import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: { getUser: vi.fn() },
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    auth: mockAuth,
    from: vi.fn(),
    rpc: vi.fn(),
    storage: { from: vi.fn() },
  },
}));

import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import type { Request, Response, NextFunction } from 'express';

function resolveWithin<T>(value: T): Promise<T> {
  return new Promise((resolve) => resolve(value));
}

describe('requireAuth', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { headers: {} } as Partial<Request>;
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as Partial<Response>;
    next = vi.fn();
  });

  it('returns 401 when no authorization header is present', () => {
    requireAuth(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header is not Bearer', () => {
    req.headers = { authorization: 'Basic abc123' };
    requireAuth(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
  });

  it('returns 401 when token is invalid', async () => {
    req.headers = { authorization: 'Bearer invalid-token' };
    mockAuth.getUser.mockResolvedValue({ data: null, error: { message: 'Invalid token' } });

    requireAuth(req as Request, res as Response, next);
    await vi.waitFor(() => {
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid authentication token' });
    });
  });

  it('populates authUser and calls next on valid token', async () => {
    req.headers = { authorization: 'Bearer valid-token' };
    mockAuth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'lecturer@utm.my',
          user_metadata: { role: 'Lecturer' },
        },
      },
      error: null,
    });

    requireAuth(req as Request, res as Response, next);
    await vi.waitFor(() => {
      expect(next).toHaveBeenCalled();
      expect(req.authUser).toEqual({
        id: 'user-123',
        email: 'lecturer@utm.my',
        role: 'Lecturer',
      });
    });
  });

  it('returns 401 on auth service error', async () => {
    req.headers = { authorization: 'Bearer token' };
    mockAuth.getUser.mockRejectedValue(new Error('Service unavailable'));

    requireAuth(req as Request, res as Response, next);
    await vi.waitFor(() => {
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication failed' });
    });
  });
});

describe('optionalAuth', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { headers: {} } as Partial<Request>;
    res = {} as Partial<Response>;
    next = vi.fn();
  });

  it('calls next without authUser when no token present', () => {
    optionalAuth(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(req.authUser).toBeUndefined();
  });

  it('populates authUser when valid token is present', async () => {
    req.headers = { authorization: 'Bearer valid-token' };
    mockAuth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'student-789',
          email: 'student@graduate.utm.my',
          user_metadata: {},
        },
      },
      error: null,
    });

    optionalAuth(req as Request, res as Response, next);
    await vi.waitFor(() => {
      expect(next).toHaveBeenCalled();
      expect(req.authUser).toEqual({
        id: 'student-789',
        email: 'student@graduate.utm.my',
      });
    });
  });

  it('calls next without authUser on invalid token', async () => {
    req.headers = { authorization: 'Bearer bad-token' };
    mockAuth.getUser.mockResolvedValue({ data: null, error: { message: 'Invalid' } });

    optionalAuth(req as Request, res as Response, next);
    await resolveWithin(null);
    await vi.waitFor(() => {
      expect(next).toHaveBeenCalled();
      expect(req.authUser).toBeUndefined();
    });
  });

  it('calls next on auth service error without blocking', async () => {
    req.headers = { authorization: 'Bearer token' };
    mockAuth.getUser.mockRejectedValue(new Error('Service down'));

    optionalAuth(req as Request, res as Response, next);
    await vi.waitFor(() => {
      expect(next).toHaveBeenCalled();
    });
  });
});
