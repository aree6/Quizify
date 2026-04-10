import { supabase } from '../lib/supabase.js';
import { env } from '../config/env.js';
import { HttpError } from '../middleware/error-handler.js';

interface StoredQuestion {
  id: string;
  prompt: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  order_index: number;
  correct_option_index?: number;
}

interface StoredCourse {
  id: string;
  title: string;
  lesson_content: string;
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
      status,
      expires_at,
      pass_percentage,
      quizzes (
        id,
        title,
        questions (id, prompt, option_a, option_b, option_c, option_d, order_index)
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
    }));

  return {
    id: course.id,
    title: course.title,
    lessonContent: course.lesson_content,
    quizTitle: quiz?.title ?? `${course.title} Quiz`,
    passPercentage: course.pass_percentage ?? env.defaultPassPercentage,
    questions,
  };
}

export async function submitQuizAttempt(params: {
  token: string;
  studentName: string;
  answers: Array<{ questionId: string; selectedOptionIndex: number }>;
}) {
  const { data, error } = await supabase
    .from('mini_courses')
    .select('id, status, expires_at, pass_percentage, quizzes(id, questions(id, correct_option_index))')
    .eq('share_token', params.token)
    .single();

  if (error || !data) throw new HttpError(404, 'Course not found');

  const course = data as StoredCourse;
  ensureCourseIsLive(course);

  const quiz = course.quizzes[0];
  if (!quiz) throw new HttpError(400, 'Quiz not found for course');

  const answerMap = new Map(params.answers.map((a) => [a.questionId, a.selectedOptionIndex]));
  let score = 0;

  const evaluatedAnswers = quiz.questions.map((q) => {
    const selected = Number(answerMap.get(q.id));
    const isCorrect = Number.isInteger(selected) && selected === q.correct_option_index;
    if (isCorrect) score += 1;
    return {
      questionId: q.id,
      selectedOptionIndex: selected,
      correctOptionIndex: q.correct_option_index ?? -1,
      isCorrect,
    };
  });

  const total = quiz.questions.length;
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

export async function getCourseAnalytics(courseId: string) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('id, student_name, score, total_questions, percentage, submitted_at')
    .eq('mini_course_id', courseId)
    .order('submitted_at', { ascending: false });

  if (error) throw new HttpError(500, 'Failed to fetch analytics');

  const attempts = (data ?? []) as Array<{
    id: string;
    student_name: string;
    score: number;
    total_questions: number;
    percentage: number;
    submitted_at: string;
  }>;

  if (attempts.length === 0) {
    return { totalSubmissions: 0, averageScore: 0, passRate: 0, submissions: [] };
  }

  const totalSubmissions = attempts.length;
  const averageScore = Math.round(
    attempts.reduce((sum, item) => sum + Number(item.percentage ?? 0), 0) / totalSubmissions,
  );
  const passCount = attempts.filter((item) => Number(item.percentage ?? 0) >= env.defaultPassPercentage).length;
  const passRate = Math.round((passCount / totalSubmissions) * 100);

  return {
    totalSubmissions,
    averageScore,
    passRate,
    submissions: attempts.map((item) => ({
      id: item.id,
      studentName: item.student_name,
      score: item.score,
      total: item.total_questions,
      percentage: item.percentage,
      submittedAt: item.submitted_at,
    })),
  };
}
