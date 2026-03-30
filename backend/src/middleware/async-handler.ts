import type { NextFunction, Request, Response } from 'express';

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown;

/** Wraps an async route handler so thrown errors flow to the error middleware. */
export const asyncHandler =
  (fn: Handler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/** Coerces an Express route param (which may be string | string[]) to a single string. */
export function pathParam(value: string | string[] | undefined): string {
  if (!value) return '';
  return Array.isArray(value) ? (value[0] ?? '') : value;
}
