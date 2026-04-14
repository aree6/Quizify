import cors from 'cors';
import express, { type Express } from 'express';
import { router } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '2mb' }));

  app.use(router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
