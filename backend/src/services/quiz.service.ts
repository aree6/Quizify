import { supabase } from '../lib/supabase.js';
import { env } from '../config/env.js';
import { HttpError } from '../middleware/error-handler.js';
import type { SourceCitation } from '../types/index.js';

interface QuestionMetadata {
  topic: string;
  subtopic: string;
  bloomLevel: string;
  soloLevel: string;
}

interface StoredQuestion {
  id: string;
  prompt: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  order_index: number;
  correct_option_index?: number;
  explanations?: string[] | null;
  metadata?: QuestionMetadata | null;
}

interface StoredCourse {
  id: string;
  title: string;
  lesson_content: string;
  sources: SourceCitation[] | null;
  status: string;
  expires_at: string | null;
  pass_percentage: number | null;
  quizzes: Array<{
    id: string;
    title: string;
    questions: StoredQuestion[];
  }>;
}

function ensureCourseIsLive(course: StoredCourse): void {
  if (course.status !== 'Ready' && course.status !== 'Shared') {
    throw new HttpError(403, 'Course is not available yet');
  }
  if (course.expires_at && course.expires_at < new Date().toISOString()) {
    throw new HttpError(410, 'Course link expired');
  }
}

export async function getPublicCourse(token: string) {
  const { data, error } = await supabase
    .from('mini_courses')
    .select(
      `
      id,
      title,
      lesson_content,
      sources,
      status,
      expires_at,
      pass_percentage,
      quizzes (
        id,
        title,
        questions (id, prompt, option_a, option_b, option_c, option_d, order_index, correct_option_index, explanations, metadata)
      )
    `,
    )
    .eq('share_token', token)
    .single();

  if (error || !data) throw new HttpError(404, 'Course not found');

  const course = data as StoredCourse;
  ensureCourseIsLive(course);

  const quiz = course.quizzes[0];
  const questions = (quiz?.questions ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: [q.option_a, q.option_b, q.option_c, q.option_d].filter((o): o is string => Boolean(o)),
      explanations: Array.isArray(q.explanations) && q.explanations.length === 4
        ? q.explanations
        : ['', '', '', ''],
      metadata: parseMetadata(q.metadata),
    }));

  return {
    id: course.id,
    title: course.title,
    lessonContent: course.lesson_content,
    sources: Array.isArray(course.sources) ? course.sources : [],
    quizTitle: quiz?.title ?? `${course.title} Quiz`,
    passPercentage: course.pass_percentage ?? env.defaultPassPercentage,
    questions,
  };
}

export async function submitQuizAttempt(params: {
  token: string;
  studentName: string;
  answers: Array<{ questionId: string; selectedOptionIndex: number }>;
  studentEmail?: string;
}) {
  const { data: courseData, error } = await supabase
    .from('mini_courses')
    .select('id, status, expires_at, pass_percentage, quizzes(id)')
    .eq('share_token', params.token)
    .single();

  if (error || !courseData) throw new HttpError(404, 'Course not found');

  const course = courseData as StoredCourse;
  ensureCourseIsLive(course);

  const quiz = course.quizzes[0];
  if (!quiz) throw new HttpError(400, 'Quiz not found for course');

  const { data: qData } = await supabase
    .from('questions')
    .select('id, correct_option_index, metadata')
    .eq('quiz_id', quiz.id);

  const questionMap = new Map<string, { correctOptionIndex: number; metadata: QuestionMetadata }>();
  for (const q of (qData ?? []) as QuestionRow[]) {
    const meta = parseMetadata(q.metadata);
    console.log(`[submit] question ${q.id.slice(0, 8)} raw_meta_type=${typeof q.metadata} raw_meta=${JSON.stringify(q.metadata)} parsed=${JSON.stringify(meta)}`);
    questionMap.set(q.id, {
      correctOptionIndex: q.correct_option_index,
      metadata: meta,
    });
  }

  const answerMap = new Map(params.answers.map((a) => [a.questionId, a.selectedOptionIndex]));
  let score = 0;

  const evaluatedAnswers: Array<{
    questionId: string;
    selectedOptionIndex: number;
    correctOptionIndex: number;
    isCorrect: boolean;
    metadata: QuestionMetadata;
  }> = [];

  for (const [qId, answerQ] of questionMap) {
    const selected = Number(answerMap.get(qId));
    const isCorrect = Number.isInteger(selected) && selected === answerQ.correctOptionIndex;
    if (isCorrect) score += 1;
    evaluatedAnswers.push({
      questionId: qId,
      selectedOptionIndex: selected,
      correctOptionIndex: answerQ.correctOptionIndex ?? -1,
      isCorrect,
      metadata: answerQ.metadata,
    });
  }

  const total = questionMap.size;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passPercentage = course.pass_percentage ?? env.defaultPassPercentage;
  const passed = percentage >= passPercentage;

  const { data: attempt, error: insertError } = await supabase
    .from('quiz_attempts')
    .insert({
      mini_course_id: course.id,
      quiz_id: quiz.id,
      student_name: params.studentName.trim(),
      score,
      total_questions: total,
      percentage,
      submitted_answers: evaluatedAnswers,
      ...(params.studentEmail ? { student_email: params.studentEmail } : {}),
    })
    .select('id, submitted_at')
    .single();

  if (insertError || !attempt) throw new HttpError(500, 'Failed to save submission');

  return {
    attemptId: attempt.id,
    submittedAt: attempt.submitted_at,
    score,
    total,
    percentage,
    passed,
    passPercentage,
    answers: evaluatedAnswers,
  };
}

export interface StudentAttemptSummary {
  id: string;
  courseId: string;
  courseTitle: string;
  shareToken: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  passPercentage: number;
  submittedAt: string;
}

export async function getStudentAttempts(studentEmail: string): Promise<StudentAttemptSummary[]> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select(`
      id,
      score,
      total_questions,
      percentage,
      submitted_at,
      mini_course_id,
      mini_courses!inner(id, title, share_token, pass_percentage)
    `)
    .eq('student_email', studentEmail)
    .order('submitted_at', { ascending: false });

  if (error) throw new HttpError(500, 'Failed to fetch student attempts');

  return (data ?? []).map((row: {
    id: string;
    score: number;
    total_questions: number;
    percentage: number;
    submitted_at: string;
    mini_course_id: string;
    mini_courses: Array<{
      id: string;
      title: string;
      share_token: string;
      pass_percentage: number;
    }>;
  }) => {
    const mc = row.mini_courses[0]!;
    return {
      id: row.id,
      courseId: mc.id,
      courseTitle: mc.title,
      shareToken: mc.share_token,
      score: row.score,
      totalQuestions: row.total_questions,
      percentage: row.percentage,
      passed: row.percentage >= (mc.pass_percentage ?? 40),
      passPercentage: mc.pass_percentage ?? 40,
      submittedAt: row.submitted_at,
    };
  });
}

interface AttemptRow {
  id: string;
  student_name: string;
  score: number;
  total_questions: number;
  percentage: number;
  submitted_at: string;
  submitted_answers: SubmittedAnswer[];
}

interface SubmittedAnswer {
  questionId: string;
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  metadata: QuestionMetadata;
}

interface QuestionRow {
  id: string;
  prompt: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_option_index: number;
  explanations: string[] | null;
  metadata: QuestionMetadata | null;
}

const SCORE_BUCKETS = [
  { label: '81-100%', min: 81, max: 100 },
  { label: '61-80%', min: 61, max: 80 },
  { label: '41-60%', min: 41, max: 60 },
  { label: '21-40%', min: 21, max: 40 },
  { label: '0-20%', min: 0, max: 20 },
];

function extractMetaFromObject(m: Record<string, unknown>): Partial<QuestionMetadata> {
  return {
    topic: typeof m.topic === 'string' ? m.topic : '',
    subtopic: typeof m.subtopic === 'string' ? m.subtopic : '',
    bloomLevel: typeof m.bloomLevel === 'string' ? m.bloomLevel : '',
    soloLevel: typeof m.soloLevel === 'string' ? m.soloLevel : '',
  };
}

function parseMetadata(raw: unknown, fallback?: QuestionMetadata): QuestionMetadata {
  let parsed: Partial<QuestionMetadata> | null = null;

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    parsed = extractMetaFromObject(raw as Record<string, unknown>);
  } else if (typeof raw === 'string') {
    try {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        parsed = extractMetaFromObject(obj as Record<string, unknown>);
      }
    } catch { /* raw was not valid JSON — ignore */ }
  }

  if (!parsed || !parsed.topic) {
    if (fallback) return fallback;
    return { topic: '', subtopic: '', bloomLevel: 'understand', soloLevel: 'multistructural' };
  }

  const topic = parsed.topic || fallback?.topic || '';
  const subtopic = parsed.subtopic || fallback?.subtopic || '';
  const bloomLevel = parsed.bloomLevel || fallback?.bloomLevel || 'understand';
  const soloLevel = parsed.soloLevel || fallback?.soloLevel || 'multistructural';

  return { topic, subtopic, bloomLevel, soloLevel };
}

function buildOptionDistribution(
  answers: { questionId: string; selectedOptionIndex: number }[],
  questionId: string,
  optionCount: number,
): number[] {
  const dist = new Array(optionCount).fill(0);
  for (const a of answers) {
    if (a.questionId === questionId && a.selectedOptionIndex >= 0 && a.selectedOptionIndex < optionCount) {
      dist[a.selectedOptionIndex] += 1;
    }
  }
  return dist;
}

export async function getCourseAnalytics(courseId: string) {
  const [attemptsRes, courseRes] = await Promise.all([
    supabase
      .from('quiz_attempts')
      .select('id, student_name, score, total_questions, percentage, submitted_at, submitted_answers')
      .eq('mini_course_id', courseId)
      .order('submitted_at', { ascending: false }),
    supabase
      .from('mini_courses')
      .select('pass_percentage, quizzes(id)')
      .eq('id', courseId)
      .single(),
  ]);

  if (attemptsRes.error) throw new HttpError(500, 'Failed to fetch analytics');

  const attempts = (attemptsRes.data ?? []) as AttemptRow[];
  const passPercentage = courseRes.data?.pass_percentage ?? env.defaultPassPercentage;
  const quizId = courseRes.data?.quizzes?.[0]?.id;

  if (attempts.length === 0) {
    return {
      courseId,
      totalSubmissions: 0,
      uniqueStudents: 0,
      totalQuestions: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passRate: 0,
      passPercentage,
      scoreDistribution: SCORE_BUCKETS.map((b) => ({ range: b.label, min: b.min, max: b.max, count: 0 })),
      topicPerformance: [],
      bloomPerformance: [],
      soloPerformance: [],
      crossMatrix: [],
      questionAnalytics: [],
      studentAnalytics: [],
    };
  }

  let questionMap = new Map<string, {
    prompt: string;
    options: string[];
    correctOptionIndex: number;
    explanations: string[];
    metadata: QuestionMetadata;
  }>();

  if (quizId) {
    const { data: qData } = await supabase
      .from('questions')
      .select('id, prompt, option_a, option_b, option_c, option_d, correct_option_index, explanations, metadata')
      .eq('quiz_id', quizId);

    for (const q of (qData ?? []) as QuestionRow[]) {
      const opts = [q.option_a, q.option_b, q.option_c, q.option_d].filter((o): o is string => o !== null);
      const meta = parseMetadata(q.metadata);
      console.log(`[analytics] question ${q.id.slice(0, 8)} raw_meta_type=${typeof q.metadata} raw_meta=${JSON.stringify(q.metadata)} parsed=${JSON.stringify(meta)}`);
      questionMap.set(q.id, {
        prompt: q.prompt,
        options: opts,
        correctOptionIndex: q.correct_option_index,
        explanations: Array.isArray(q.explanations) ? q.explanations : [],
        metadata: meta,
      });
    }
  }

  const totalSubmissions = attempts.length;
  const uniqueStudents = new Set(attempts.map((a) => a.student_name.toLowerCase().trim())).size;
  const scores = attempts.map((a) => Number(a.percentage ?? 0));
  const averageScore = Math.round(scores.reduce((s, v) => s + v, 0) / totalSubmissions);
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  const passCount = attempts.filter((a) => Number(a.percentage ?? 0) >= passPercentage).length;
  const passRate = Math.round((passCount / totalSubmissions) * 100);

  const totalQuestions = attempts[0]?.total_questions ?? 0;

  const scoreDistribution = SCORE_BUCKETS.map((bucket) => ({
    range: bucket.label,
    min: bucket.min,
    max: bucket.max,
    count: attempts.filter((a) => {
      const pct = Number(a.percentage ?? 0);
      return pct >= bucket.min && pct <= bucket.max;
    }).length,
  }));

  const allAnswers: Array<{
    questionId: string;
    isCorrect: boolean;
    selectedOptionIndex: number;
    metadata: QuestionMetadata;
  }> = [];

  for (const a of attempts) {
    const raw = a.submitted_answers as unknown;
    if (Array.isArray(raw)) {
      for (const entry of raw as SubmittedAnswer[]) {
        const qMeta = questionMap.get(entry.questionId)?.metadata;
        allAnswers.push({
          questionId: entry.questionId,
          isCorrect: entry.isCorrect,
          selectedOptionIndex: entry.selectedOptionIndex,
          metadata: parseMetadata(entry.metadata, qMeta),
        });
      }
    }
  }

  const topicMap = new Map<string, { count: number; correct: number; subtopic: string }>();
  const bloomMap = new Map<string, { count: number; correct: number }>();
  const soloMap = new Map<string, { count: number; correct: number }>();
  const crossMap = new Map<string, { count: number; correct: number }>();

  for (const ans of allAnswers) {
    const m = ans.metadata;
    const topic = m.topic || 'General';
    const bloom = m.bloomLevel || 'understand';
    const solo = m.soloLevel || 'multistructural';

    if (!topicMap.has(topic)) topicMap.set(topic, { count: 0, correct: 0, subtopic: m.subtopic });
    const te = topicMap.get(topic)!;
    te.count += 1;
    if (ans.isCorrect) te.correct += 1;

    if (!bloomMap.has(bloom)) bloomMap.set(bloom, { count: 0, correct: 0 });
    const be = bloomMap.get(bloom)!;
    be.count += 1;
    if (ans.isCorrect) be.correct += 1;

    if (!soloMap.has(solo)) soloMap.set(solo, { count: 0, correct: 0 });
    const se = soloMap.get(solo)!;
    se.count += 1;
    if (ans.isCorrect) se.correct += 1;

    const crossKey = `${topic}::${bloom}`;
    if (!crossMap.has(crossKey)) crossMap.set(crossKey, { count: 0, correct: 0 });
    const ce = crossMap.get(crossKey)!;
    ce.count += 1;
    if (ans.isCorrect) ce.correct += 1;
  }

  const toPct = (correct: number, total: number) => (total > 0 ? Math.round((correct / total) * 100) : 0);

  const topicPerformance = Array.from(topicMap.entries())
    .map(([topic, v]) => ({
      topic,
      subtopic: v.subtopic,
      totalAnswers: v.count,
      correctCount: v.correct,
      percentage: toPct(v.correct, v.count),
    }))
    .sort((a, b) => a.percentage - b.percentage);

  const bLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
  const bloomPerformance = bLevels.map((level) => {
    const entry = bloomMap.get(level);
    return {
      bloomLevel: level,
      totalAnswers: entry?.count ?? 0,
      correctCount: entry?.correct ?? 0,
      percentage: entry ? toPct(entry.correct, entry.count) : -1,
    };
  });

  const sLevels = ['unistructural', 'multistructural', 'relational', 'extended_abstract'];
  const soloPerformance = sLevels.map((level) => {
    const entry = soloMap.get(level);
    return {
      soloLevel: level,
      totalAnswers: entry?.count ?? 0,
      correctCount: entry?.correct ?? 0,
      percentage: entry ? toPct(entry.correct, entry.count) : -1,
    };
  });

  const crossMatrix = Array.from(crossMap.entries()).map(([key, v]) => {
    const [topic, bloomLevel] = key.split('::');
    return { topic, bloomLevel, totalAnswers: v.count, correctCount: v.correct, percentage: toPct(v.correct, v.count) };
  });

  const questionAnalytics = Array.from(questionMap.entries())
    .map(([id, q]) => {
      const relevant = allAnswers.filter((a) => a.questionId === id);
      const totalAttempts = relevant.length;
      const correctCount = relevant.filter((a) => a.isCorrect).length;
      const dist = buildOptionDistribution(allAnswers, id, q.options.length);
      return {
        questionId: id,
        prompt: q.prompt,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanations: q.explanations,
        metadata: q.metadata,
        totalAttempts,
        correctCount,
        percentage: toPct(correctCount, totalAttempts),
        optionDistribution: dist,
      };
    })
    .sort((a, b) => a.percentage - b.percentage);

  const studentAnalytics = attempts.map((a) => {
    const raw = a.submitted_answers as unknown;
    const answers: SubmittedAnswer[] = Array.isArray(raw) ? (raw as SubmittedAnswer[]) : [];

    const topicCorrectMap = new Map<string, { correct: number; total: number }>();
    let bloomCorrectMap = new Map<string, { correct: number; total: number }>();

    const answerDetails = answers.map((entry) => {
      const qInfo = questionMap.get(entry.questionId);
      const m = parseMetadata(entry.metadata, qInfo?.metadata);
      const topic = m.topic || 'General';
      const bloom = m.bloomLevel || 'understand';

      if (!topicCorrectMap.has(topic)) topicCorrectMap.set(topic, { correct: 0, total: 0 });
      const te = topicCorrectMap.get(topic)!;
      te.total += 1;
      if (entry.isCorrect) te.correct += 1;

      if (!bloomCorrectMap.has(bloom)) bloomCorrectMap.set(bloom, { correct: 0, total: 0 });
      const be = bloomCorrectMap.get(bloom)!;
      be.total += 1;
      if (entry.isCorrect) be.correct += 1;

      return {
        questionId: entry.questionId,
        prompt: qInfo?.prompt ?? '',
        options: qInfo?.options ?? [],
        selectedOptionIndex: entry.selectedOptionIndex,
        correctOptionIndex: entry.correctOptionIndex,
        isCorrect: entry.isCorrect,
        explanations: qInfo?.explanations ?? [],
        metadata: m,
      };
    });

    const weakTopics = Array.from(topicCorrectMap.entries())
      .map(([topic, v]) => ({
        topic,
        correct: v.correct,
        total: v.total,
        percentage: toPct(v.correct, v.total),
      }))
      .filter((t) => t.percentage < 70)
      .sort((a, b) => a.percentage - b.percentage);

    let weakestBloomLevel: string | null = null;
    let weakestBloomPct = 100;
    for (const [level, v] of bloomCorrectMap) {
      const pct = toPct(v.correct, v.total);
      if (pct < weakestBloomPct && v.total > 0) {
        weakestBloomPct = pct;
        weakestBloomLevel = level;
      }
    }

    const strongTopics = Array.from(topicCorrectMap.entries())
      .filter(([, v]) => v.total > 0)
      .sort((a, b) => toPct(b[1].correct, b[1].total) - toPct(a[1].correct, a[1].total));
    const strongestTopic = strongTopics.length > 0 ? (strongTopics[0]?.[0] ?? null) : null;

    return {
      attemptId: a.id,
      studentName: a.student_name,
      score: a.score,
      total: a.total_questions,
      percentage: a.percentage,
      passed: Number(a.percentage) >= passPercentage,
      submittedAt: a.submitted_at,
      weakTopics,
      strongestTopic,
      weakestBloomLevel,
      answers: answerDetails,
    };
  });

  return {
    courseId,
    totalSubmissions,
    uniqueStudents,
    totalQuestions,
    averageScore,
    highestScore,
    lowestScore,
    passRate,
    passPercentage,
    scoreDistribution,
    topicPerformance,
    bloomPerformance,
    soloPerformance,
    crossMatrix,
    questionAnalytics,
    studentAnalytics,
  };
}
