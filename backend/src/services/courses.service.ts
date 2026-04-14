import { supabase } from '../lib/supabase.js';
import { env } from '../config/env.js';
import { HttpError } from '../middleware/error-handler.js';
import { randomToken, toSlug } from '../lib/utils.js';
import { findCourseByCode } from '../constants/courses.js';
import { retrievePerTopic } from './rag.service.js';
import { getStoredOutline } from './outlines.service.js';
import { generateLessonAndQuiz, isAiConfigured } from './ai.service.js';

import type {
  GeneratedContent,
  GeneratedQuestion,
  GenerationOptions,
  SourceCitation,
} from '../types/index.js';
import { DEFAULT_GENERATION_OPTIONS } from '../types/index.js';

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/** Per-topic chunk counts surfaced to the UI so lecturers can see coverage depth. */
export interface TopicCoverage {
  topic: string;
  chunkCount: number;
}

export interface CoursePreviewResult {
  title: string;
  courseCode: string;
  courseName: string;
  topics: string[];
  lesson: string;
  questions: GeneratedQuestion[];
  questionCount: number;
  generationSource: 'RAG+LLM' | 'RAG-only';
  contextChunksUsed: number;
  sources: SourceCitation[];
  topicCoverage: TopicCoverage[];
}

export interface AvailableCourse {
  code: string;
  name: string;
}

export async function listAvailableCourses(): Promise<AvailableCourse[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('course_code')
    .eq('status', 'Active');

  if (error) throw new HttpError(500, 'Failed to fetch available courses');

  const uniqueCodes = [...new Set((data ?? []).map((row: { course_code: string }) => row.course_code))];
  return uniqueCodes.map((code) => {
    const course = findCourseByCode(code);
    return { code, name: course?.name ?? code };
  });
}

export async function generateCoursePreview(params: {
  courseCode: string;
  topics: string[];
  questionCount: number;
  /** Partial is accepted — missing fields fall back to DEFAULT_GENERATION_OPTIONS. */
  options?: Partial<GenerationOptions>;
}): Promise<CoursePreviewResult> {
  const courseCode = params.courseCode.trim().toUpperCase();
  const topics = params.topics.map((t) => t.trim()).filter(Boolean);
  const questionCount = Math.min(30, Math.max(5, params.questionCount));
  // Merge with defaults so partial/missing payloads still get a valid shape.
  const options: GenerationOptions = { ...DEFAULT_GENERATION_OPTIONS, ...(params.options ?? {}) };

  if (topics.length === 0) throw new HttpError(400, 'At least one topic is required');

  const courseEntry = findCourseByCode(courseCode);
  const courseName = courseEntry?.name ?? courseCode;
  const autoTitle = `${courseName} — ${topics.slice(0, 3).join(', ')}`;

  // Per-topic RAG retrieval gives each topic its own breadth of coverage and
  // assigns stable 1-based [S#] indexes shared across the lesson + citations.
  const { topicContexts, sources } = await retrievePerTopic({
    courseCode,
    topics,
    perTopicLimit: 15,
    minSimilarity: 0.25,
  });

  if (sources.length === 0) {
    throw new HttpError(
      404,
      `No indexed content found for the selected topics in ${courseCode}. The course materials for these topics may have been removed or not yet uploaded.`,
    );
  }

  // Load course profile (synopsis + learning outcomes) to ground generation
  const profile = await getStoredOutline(courseCode);

  const generationSource: CoursePreviewResult['generationSource'] =
    isAiConfigured() ? 'RAG+LLM' : 'RAG-only';

  let content: GeneratedContent | null = null;
  if (isAiConfigured()) {
    // Stacked generation: stage 1 builds the lesson from per-topic RAG context,
    // stage 2 builds the quiz from that lesson. See ai.service.ts.
    content = await generateLessonAndQuiz({
      title: autoTitle,
      topics,
      topicContexts,
      sources,
      questionCount,
      options,
      synopsis: profile?.synopsis,
      learningOutcomes: profile?.learningOutcomes,
    });
  }

  if (!content) {
    throw new HttpError(
      500,
      'AI generation failed. Ensure the Gemini API key has available quota and course materials are indexed.',
    );
  }

  const topicCoverage: TopicCoverage[] = topicContexts.map((t) => ({
    topic: t.topic,
    chunkCount: t.chunks.length,
  }));

  return {
    title: autoTitle,
    courseCode,
    courseName,
    topics,
    lesson: content.lesson,
    questions: content.questions,
    questionCount: content.questions.length,
    generationSource,
    contextChunksUsed: sources.length,
    sources: content.sources,
    topicCoverage,
  };
}

async function generateUniqueShareToken(courseCode: string): Promise<string> {
  const slug = toSlug(courseCode);
  for (let i = 0; i < 3; i += 1) {
    const candidate = `${slug}-${randomToken(8)}`;
    const { data } = await supabase.from('mini_courses').select('id').eq('share_token', candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${slug}-${randomToken(12)}`;
}

export async function confirmAndSaveCourse(params: {
  title: string;
  courseCode: string;
  topics: string[];
  lesson: string;
  questions: GeneratedQuestion[];
  sources: SourceCitation[];
  lecturerName: string;
}): Promise<{
  id: string;
  title: string;
  status: string;
  shareToken: string;
  shareUrl: string;
  createdAt: string;
  passPercentage: number;
  expiresAt: string;
}> {
  const courseCode = params.courseCode.trim().toUpperCase();
  const topics = params.topics.map((t) => t.trim()).filter(Boolean);
  const passPercentage = env.defaultPassPercentage;
  const expiresAt = new Date(Date.now() + ONE_MONTH_MS).toISOString();

  const shareToken = await generateUniqueShareToken(courseCode);

  const { data: miniCourse, error: courseError } = await supabase
    .from('mini_courses')
    .insert({
      title: params.title,
      course_code: courseCode,
      topics,
      lesson_content: params.lesson,
      sources: params.sources,
      status: 'Ready',
      share_token: shareToken,
      pass_percentage: passPercentage,
      expires_at: expiresAt,
      created_by_name: params.lecturerName,
    })
    .select('id, title, share_token, status, created_at, pass_percentage, expires_at')
    .single();

  if (courseError || !miniCourse) throw new HttpError(500, 'Failed to create mini-course');

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      mini_course_id: miniCourse.id,
      title: `${params.title} Quiz`,
      question_count: params.questions.length,
    })
    .select('id')
    .single();

  if (quizError || !quiz) throw new HttpError(500, 'Failed to create quiz');

  const questionRows = params.questions.map((q, idx) => ({
    quiz_id: quiz.id,
    prompt: q.prompt,
    option_a: q.options[0] ?? null,
    option_b: q.options[1] ?? null,
    option_c: q.options[2] ?? null,
    option_d: q.options[3] ?? null,
    correct_option_index: q.correct,
    order_index: idx,
  }));

  const { error: questionsError } = await supabase.from('questions').insert(questionRows);
  if (questionsError) throw new HttpError(500, 'Failed to create questions');

  return {
    id: miniCourse.id,
    title: miniCourse.title,
    status: miniCourse.status,
    shareToken: miniCourse.share_token,
    shareUrl: `/quiz?token=${miniCourse.share_token}`,
    createdAt: miniCourse.created_at,
    passPercentage: miniCourse.pass_percentage,
    expiresAt: miniCourse.expires_at,
  };
}

export async function listMiniCourses(): Promise<
  Array<{
    id: string;
    title: string;
    courseCode: string;
    topics: string[];
    status: string;
    questionCount: number;
    attempts: number;
    shareToken: string;
    shareUrl: string;
    createdAt: string;
  }>
> {
  const { data, error } = await supabase
    .from('mini_courses')
    .select('id, title, course_code, topics, status, share_token, created_at, quizzes(question_count), quiz_attempts(id)')
    .order('created_at', { ascending: false });

  if (error) throw new HttpError(500, 'Failed to fetch courses');

  return (data ?? []).map((course: {
    id: string;
    title: string;
    course_code: string;
    topics: string[] | null;
    status: string;
    share_token: string;
    created_at: string;
    quizzes: Array<{ question_count: number }> | null;
    quiz_attempts: Array<{ id: string }> | null;
  }) => ({
    id: course.id,
    title: course.title,
    courseCode: course.course_code,
    topics: course.topics ?? [],
    status: course.status,
    questionCount: course.quizzes?.[0]?.question_count ?? 0,
    attempts: course.quiz_attempts?.length ?? 0,
    shareToken: course.share_token,
    shareUrl: `/quiz?token=${course.share_token}`,
    createdAt: course.created_at,
  }));
}
