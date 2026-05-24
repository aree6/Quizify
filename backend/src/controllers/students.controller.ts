import type { Request, Response } from 'express';
import { getStudentAttempts } from '../services/quiz.service.js';

export async function studentAttempts(req: Request, res: Response): Promise<void> {
  const email = req.authUser?.email;
  if (!email) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const attempts = await getStudentAttempts(email);
  res.json({ attempts });
}
