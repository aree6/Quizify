import { vi } from 'vitest';

/**
 * Builds a chainable mock that mimics Supabase query builder, e.g.:
 *
 *   supabase.from('table').select('col').eq('key', val).then(...)
 *
 * Every query method (select, insert, eq, etc.) returns `self` so calls
 * can be chained indefinitely. Only `.then()` resolves, returning
 * `{ data, error }`.
 *
 * @param data      — the fake dataset to wrap in the resolved promise
 * @param opts.single — when true, unwraps arrays to the first element
 */
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

  // All Supabase query-builder methods that return 'self' for chaining
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

/**
 * Same as createChainable but its `.then()` rejects with an error.
 * Used to test error-handling paths in services/routes.
 *
 * @param message — error message string
 * @param code    — optional error code
 */
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
