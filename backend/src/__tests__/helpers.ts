import { vi } from 'vitest';

export function createChainable<T>(data: T, opts?: { single?: boolean }) {
  const self: Record<string, unknown> = {
    then: (resolve: (val: unknown) => unknown) =>
      Promise.resolve(
        resolve({
          data: opts?.single ? (Array.isArray(data) ? (data as Array<unknown>)[0] ?? null : data) : data,
          error: null,
        }),
      ),
  };

  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'gt', 'gte', 'lt', 'lte', 'is', 'like',
    'order', 'limit', 'range', 'match', 'or', 'filter', 'not',
    'single', 'maybeSingle', 'set', 'returning',
  ];

  for (const m of methods) {
    self[m] = vi.fn(() => self);
  }

  return self as Record<string, unknown> & { then: (cb: (d: unknown) => unknown) => Promise<unknown> };
}

export function createErrorChainable(message: string, code?: string) {
  const self: Record<string, unknown> = {
    then: (_resolve: unknown, reject?: (err: unknown) => unknown) =>
      Promise.reject(reject ? reject({ message, code }) : new Error(message)),
  };

  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'gt', 'gte', 'lt', 'lte', 'is', 'like',
    'order', 'limit', 'range', 'match', 'or', 'filter', 'not',
    'single', 'maybeSingle', 'set', 'returning',
  ];

  for (const m of methods) {
    self[m] = vi.fn(() => self);
  }

  return self;
}
