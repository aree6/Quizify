import type { Request, Response } from 'express';
import { HttpError } from '../middleware/error-handler.js';
import { pathParam } from '../middleware/async-handler.js';
import { getPublicCourse, submitQuizAttempt } from '../services/quiz.service.js';

export async function publicCourse(req: Request, res: Response): Promise<void> {
  const token = pathParam(req.params.token);
  if (!token) throw new HttpError(400, 'token is required');

  const course = await getPublicCourse(token);
  res.json({ course });
}

export async function submitQuiz(req: Request, res: Response): Promise<void> {
  const token = pathParam(req.params.token);
  if (!token) throw new HttpError(400, 'token is required');

  const { studentName, answers } = req.body as {
    studentName?: string;
    answers?: Array<{ questionId: string; selectedOptionIndex: number }>;
  };

  if (!studentName || typeof studentName !== 'string' || studentName.trim().length < 2) {
    throw new HttpError(400, 'Student name is required');
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    throw new HttpError(400, 'Answers are required');
  }

  const result = await submitQuizAttempt({ token, studentName, answers });
  res.json(result);
}
