import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { supabase } from './lib/supabase.js';
import { generateFallbackContent } from './data/fallbackContent.js';
import { normalizePassPercentage, randomToken, toSlug } from './lib/utils.js';

const app = express();
const port = process.env.PORT || 3001;
const defaultPassPercentage = normalizePassPercentage(process.env.DEFAULT_PASS_PERCENTAGE, 70);

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'quizify-backend' });
});

app.get('/api/public/course/:token', async (req, res) => {
  const { token } = req.params;
  const now = new Date().toISOString();

  const { data: course, error } = await supabase
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
        questions (
          id,
          prompt,
          option_a,
          option_b,
          option_c,
          option_d,
          order_index
        )
      )
    `,
    )
    .eq('share_token', token)
    .single();

  if (error || !course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  if (course.status !== 'Ready' && course.status !== 'Shared') {
    return res.status(403).json({ message: 'Course is not available yet' });
  }

  if (course.expires_at && course.expires_at < now) {
    return res.status(410).json({ message: 'Course link expired' });
  }

  const quiz = course.quizzes?.[0];
  const questions = (quiz?.questions || [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean),
    }));

  return res.json({
    course: {
      id: course.id,
      title: course.title,
      lessonContent: course.lesson_content,
      quizTitle: quiz?.title || `${course.title} Quiz`,
      passPercentage: course.pass_percentage || defaultPassPercentage,
      questions,
    },
  });
});

app.post('/api/public/course/:token/submit', async (req, res) => {
  const { token } = req.params;
  const { studentName, answers } = req.body;

  if (!studentName || typeof studentName !== 'string' || studentName.trim().length < 2) {
    return res.status(400).json({ message: 'Student name is required' });
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ message: 'Answers are required' });
  }

  const { data: course, error: courseError } = await supabase
    .from('mini_courses')
    .select('id, status, expires_at, pass_percentage, quizzes(id, questions(id, correct_option_index))')
    .eq('share_token', token)
    .single();

  if (courseError || !course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  if (course.status !== 'Ready' && course.status !== 'Shared') {
    return res.status(403).json({ message: 'Course is not available yet' });
  }

  const now = new Date().toISOString();
  if (course.expires_at && course.expires_at < now) {
    return res.status(410).json({ message: 'Course link expired' });
  }

  const quiz = course.quizzes?.[0];
  if (!quiz) {
    return res.status(400).json({ message: 'Quiz not found for course' });
  }

  const answerMap = new Map(answers.map((item) => [item.questionId, item.selectedOptionIndex]));
  let score = 0;

  const evaluatedAnswers = quiz.questions.map((q) => {
    const selectedOptionIndex = Number(answerMap.get(q.id));
    const isCorrect = Number.isInteger(selectedOptionIndex) && selectedOptionIndex === q.correct_option_index;
    if (isCorrect) score += 1;
    return {
      questionId: q.id,
      selectedOptionIndex,
      correctOptionIndex: q.correct_option_index,
      isCorrect,
    };
  });

  const total = quiz.questions.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passPercentage = course.pass_percentage || defaultPassPercentage;
  const passed = percentage >= passPercentage;

  const { data: attempt, error: insertError } = await supabase
    .from('quiz_attempts')
    .insert({
      mini_course_id: course.id,
      quiz_id: quiz.id,
      student_name: studentName.trim(),
      score,
      total_questions: total,
      percentage,
      submitted_answers: evaluatedAnswers,
    })
    .select('id, submitted_at')
    .single();

  if (insertError) {
    return res.status(500).json({ message: 'Failed to save submission' });
  }

  return res.json({
    attemptId: attempt.id,
    submittedAt: attempt.submitted_at,
    score,
    total,
    percentage,
    passed,
    passPercentage,
    answers: evaluatedAnswers,
  });
});

app.post('/api/courses/generate', async (req, res) => {
  const {
    title,
    courseCode,
    topics = [],
    questionCount = 5,
    passPercentage = defaultPassPercentage,
    lecturerName = 'Lecturer',
    expiresAt = null,
  } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ message: 'Course title is required' });
  }

  if (!courseCode || typeof courseCode !== 'string') {
    return res.status(400).json({ message: 'Course code is required' });
  }

  const sanitizedQuestionCount = Math.min(15, Math.max(5, Number(questionCount) || 5));
  const normalizedPass = normalizePassPercentage(passPercentage, defaultPassPercentage);
  const content = generateFallbackContent({
    title,
    topics: Array.isArray(topics) ? topics : [],
    questionCount: sanitizedQuestionCount,
  });

  let shareToken = `${toSlug(courseCode)}-${randomToken(8)}`;
  for (let i = 0; i < 3; i += 1) {
    const { data: exists } = await supabase
      .from('mini_courses')
      .select('id')
      .eq('share_token', shareToken)
      .maybeSingle();
    if (!exists) break;
    shareToken = `${toSlug(courseCode)}-${randomToken(8)}`;
  }

  const { data: miniCourse, error: courseError } = await supabase
    .from('mini_courses')
    .insert({
      title,
      course_code: courseCode,
      topics,
      lesson_content: content.lesson,
      status: 'Ready',
      share_token: shareToken,
      pass_percentage: normalizedPass,
      expires_at: expiresAt,
      created_by_name: lecturerName,
    })
    .select('id, title, share_token, status, created_at, pass_percentage, expires_at')
    .single();

  if (courseError || !miniCourse) {
    return res.status(500).json({ message: 'Failed to create mini-course' });
  }

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      mini_course_id: miniCourse.id,
      title: `${title} Quiz`,
      question_count: sanitizedQuestionCount,
    })
    .select('id, title')
    .single();

  if (quizError || !quiz) {
    return res.status(500).json({ message: 'Failed to create quiz' });
  }

  const questionRows = content.questions.map((q, idx) => ({
    quiz_id: quiz.id,
    prompt: q.prompt,
    option_a: q.options[0] || null,
    option_b: q.options[1] || null,
    option_c: q.options[2] || null,
    option_d: q.options[3] || null,
    correct_option_index: q.correct,
    order_index: idx,
  }));

  const { error: questionsError } = await supabase.from('questions').insert(questionRows);
  if (questionsError) {
    return res.status(500).json({ message: 'Failed to create questions' });
  }

  return res.status(201).json({
    course: {
      id: miniCourse.id,
      title: miniCourse.title,
      status: miniCourse.status,
      shareToken: miniCourse.share_token,
      shareUrl: `/quiz?token=${miniCourse.share_token}`,
      createdAt: miniCourse.created_at,
      passPercentage: miniCourse.pass_percentage,
      expiresAt: miniCourse.expires_at,
    },
  });
});

app.get('/api/courses', async (_req, res) => {
  const { data, error } = await supabase
    .from('mini_courses')
    .select('id, title, course_code, topics, status, share_token, created_at, quizzes(question_count), quiz_attempts(id)')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ message: 'Failed to fetch courses' });
  }

  const courses = (data || []).map((course) => {
    const attemptCount = course.quiz_attempts?.length || 0;
    const questionCount = course.quizzes?.[0]?.question_count || 0;
    return {
      id: course.id,
      title: course.title,
      courseCode: course.course_code,
      topics: course.topics || [],
      status: course.status,
      questionCount,
      attempts: attemptCount,
      shareToken: course.share_token,
      shareUrl: `/quiz?token=${course.share_token}`,
      createdAt: course.created_at,
    };
  });

  return res.json({ courses });
});

app.get('/api/analytics/:courseId', async (req, res) => {
  const { courseId } = req.params;

  const { data: attempts, error } = await supabase
    .from('quiz_attempts')
    .select('id, student_name, score, total_questions, percentage, submitted_at')
    .eq('mini_course_id', courseId)
    .order('submitted_at', { ascending: false });

  if (error) {
    return res.status(500).json({ message: 'Failed to fetch analytics' });
  }

  if (!attempts || attempts.length === 0) {
    return res.json({
      totalSubmissions: 0,
      averageScore: 0,
      passRate: 0,
      submissions: [],
    });
  }

  const totalSubmissions = attempts.length;
  const averageScore = Math.round(
    attempts.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / totalSubmissions,
  );
  const passCount = attempts.filter((item) => Number(item.percentage || 0) >= defaultPassPercentage).length;
  const passRate = Math.round((passCount / totalSubmissions) * 100);

  return res.json({
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
  });
});

app.listen(port, () => {
  console.log(`Quizify backend running on port ${port}`);
});
