import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { aiInfo, isAiConfigured } from '../services/ai.service.js';

export function healthCheck(_req: Request, res: Response): void {
  res.json({
    ok: true,
    service: 'quizify-backend',
    rag: {
      aiConfigured: isAiConfigured(),
      aiProvider: aiInfo.provider,
      embeddingModel: aiInfo.embeddingModel,
      generationModel: aiInfo.generationModel,
      storageBucket: env.supabase.storageBucket,
    },
  });
}
