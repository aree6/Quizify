import type { NextFunction, Request, Response } from 'express';

/** Domain error carrying an HTTP status code. */
export class HttpError extends Error {
  status: number;
  details?: string;
  hint?: string;

  constructor(status: number, message: string, opts?: { details?: string; hint?: string }) {
    super(message);
    this.status = status;
    this.details = opts?.details;
    this.hint = opts?.hint;
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Not found' });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, details: err.details, hint: err.hint });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  // eslint-disable-next-line no-console
  console.error('[error]', err);
  res.status(500).json({ message });
}
