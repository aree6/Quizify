import type { Request, Response } from 'express';
import { HttpError } from '../middleware/error-handler.js';
import { pathParam } from '../middleware/async-handler.js';
import { getPublicCourse, submitQuizAttempt, generatePracticeCourse } from '../services/quiz.service.js';

export async function publicCourse(req: Request, res: Response): Promise<void> {
  const token = pathParam(req.params.token);
  if (!token) throw new HttpError(400, 'token is required');

  const course = await getPublicCourse(token);
  res.json({ course });
}

export async function submitQuiz(req: Request, res: Response): Promise<void> {
  const token = pathParam(req.params.token);
  if (!token) throw new HttpError(400, 'token is required');

  if (!req.authUser) {
    throw new HttpError(401, 'Sign in to submit a quiz attempt');
  }

  const { answers } = req.body as {
    answers?: Array<{ questionId: string; selectedOptionIndex: number }>;
  };

  if (!Array.isArray(answers) || answers.length === 0) {
    throw new HttpError(400, 'Answers are required');
  }

  // Identity is derived from the verified token, never from the request body.
  const result = await submitQuizAttempt({
    token,
    studentName: req.authUser.name,
    answers,
    studentEmail: req.authUser.email,
  });
  res.json(result);
}

export async function practiceWeakTopics(req: Request, res: Response): Promise<void> {
  const token = pathParam(req.params.token);
  if (!token) throw new HttpError(400, 'token is required');

  if (!req.authUser) {
    throw new HttpError(401, 'Sign in to practice weak topics');
  }

  const { attemptId } = req.body as { attemptId?: string };
  if (!attemptId) throw new HttpError(400, 'attemptId is required');

  const result = await generatePracticeCourse(
    token,
    attemptId,
    req.authUser.email,
    req.authUser.name,
  );
  res.json(result);
}
