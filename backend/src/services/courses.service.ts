import { supabase } from '../lib/supabase.js';
import { env } from '../config/env.js';
import { HttpError } from '../middleware/error-handler.js';
import { randomToken, toSlug } from '../lib/utils.js';
import { findCourseByCode } from '../constants/courses.js';
import { retrieveRelevantChunks } from './rag.service.js';
import { generateLessonAndQuiz, isAiConfigured } from './ai.service.js';
import { generateFallbackContent } from '../data/fallback-content.js';
import type { GeneratedContent, GeneratedQuestion } from '../types/index.js';

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export interface CoursePreviewResult {
  title: string;
  courseCode: string;
  courseName: string;
  topics: string[];
  lesson: string;
  questions: GeneratedQuestion[];
  questionCount: number;
  generationSource: 'RAG+LLM' | 'RAG-only' | 'Fallback';
  contextChunksUsed: number;
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
}): Promise<CoursePreviewResult> {
  const courseCode = params.courseCode.trim().toUpperCase();
  const topics = params.topics.map((t) => t.trim()).filter(Boolean);
  const questionCount = Math.min(30, Math.max(5, params.questionCount));

  if (topics.length === 0) throw new HttpError(400, 'At least one topic is required');

  const courseEntry = findCourseByCode(courseCode);
  const courseName = courseEntry?.name ?? courseCode;
  const autoTitle = `${courseName} — ${topics.slice(0, 3).join(', ')}`;

  const contextChunks = await retrieveRelevantChunks({ courseCode, topics, limit: 20 });
  const contextText = contextChunks.join('\n\n');

  const generationSource: CoursePreviewResult['generationSource'] =
    contextChunks.length > 0 ? (isAiConfigured() ? 'RAG+LLM' : 'RAG-only') : 'Fallback';

  let content: GeneratedContent | null = null;
  if (contextChunks.length > 0 && isAiConfigured()) {
    content = await generateLessonAndQuiz({
      title: autoTitle,
      topics,
      context: contextText,
      questionCount,
    });
  }

  if (!content) {
    throw new HttpError(
      500,
      'AI generation failed. Ensure the Gemini API key has available quota and course materials are indexed.',
    );
  }

  // Pad with fallback questions if AI returned fewer
  if (content.questions.length < questionCount) {
    const supplement = generateFallbackContent({ title: autoTitle, topics, questionCount });
    content.questions = [...content.questions, ...supplement.questions].slice(0, questionCount);
  }

  return {
    title: autoTitle,
    courseCode,
    courseName,
    topics,
    lesson: content.lesson,
    questions: content.questions,
    questionCount: content.questions.length,
    generationSource,
    contextChunksUsed: contextChunks.length,
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
