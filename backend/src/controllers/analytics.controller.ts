import type { Request, Response } from 'express';
import { HttpError } from '../middleware/error-handler.js';
import { pathParam } from '../middleware/async-handler.js';
import { getCourseAnalytics } from '../services/quiz.service.js';

export async function analytics(req: Request, res: Response): Promise<void> {
  const courseId = pathParam(req.params.courseId);
  if (!courseId) throw new HttpError(400, 'courseId is required');

  const data = await getCourseAnalytics(courseId);
  res.json(data);
}
