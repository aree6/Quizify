import type { Request, Response } from 'express';
import { getStudentAttemptDetail, getStudentAttempts } from '../services/quiz.service.js';
import { pathParam } from '../middleware/async-handler.js';

export async function studentAttempts(req: Request, res: Response): Promise<void> {
  const email = req.authUser?.email;
  if (!email) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const attempts = await getStudentAttempts(email);
  res.json({ attempts });
}

export async function studentAttemptDetail(req: Request, res: Response): Promise<void> {
  const email = req.authUser?.email;
  if (!email) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const attemptId = pathParam(req.params.attemptId);
  if (!attemptId) {
    res.status(400).json({ message: 'attemptId is required' });
    return;
  }

  const detail = await getStudentAttemptDetail(attemptId, email);
  res.json(detail);
}
