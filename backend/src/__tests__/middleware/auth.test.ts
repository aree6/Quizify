import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase auth before importing the real module
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

/* ─── requireAuth middleware ───────────────────────────────────────────────
 * Guards every protected route. Must:
 *   1. Reject missing / malformed / invalid tokens with 401
 *   2. Populate req.authUser on valid tokens
 *   3. Derive role from email pattern & env-var allowlists
 */
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
    // No header at all — should be caught before any async work
    requireAuth(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header is not Bearer', () => {
    // Wrong scheme (Basic, Digest, etc.) — reject immediately
    req.headers = { authorization: 'Basic abc123' };
    requireAuth(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
  });

  it('returns 401 when token is invalid', async () => {
    // Token format is correct (Bearer ...) but Supabase rejects it
    req.headers = { authorization: 'Bearer invalid-token' };
    mockAuth.getUser.mockResolvedValue({ data: null, error: { message: 'Invalid token' } });

    requireAuth(req as Request, res as Response, next);
    await vi.waitFor(() => {
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid authentication token' });
    });
  });

  it('populates authUser and calls next on valid token', async () => {
    // Happy path: valid JWT -> getUser returns user -> role resolved -> next()
    req.headers = { authorization: 'Bearer valid-token' };
    mockAuth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'lecturer@utm.my',
          user_metadata: { role: 'Lecturer', name: 'Dr. Ahmad' },
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
        name: 'Dr. Ahmad',
        role: 'Lecturer',
      });
    });
  });

  it('grants Lecturer role to LECTURER_OVERRIDE_EMAILS (mohammadar336@gmail.com) with non-UTM Gmail', async () => {
    // Dev/test users with non-UTM emails can be promoted via env-var allowlist
    req.headers = { authorization: 'Bearer valid-token' };
    mockAuth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-336',
          email: 'mohammadar336@gmail.com',
          user_metadata: { name: 'Areeb' },
        },
      },
      error: null,
    });

    requireAuth(req as Request, res as Response, next);
    await vi.waitFor(() => {
      expect(next).toHaveBeenCalled();
      expect(req.authUser).toEqual({
        id: 'user-336',
        email: 'mohammadar336@gmail.com',
        name: 'Areeb',
        role: 'Lecturer',
      });
    });
  });

  it('rejects a non-UTM email that is not in any allow-list (role stays undefined)', async () => {
    // Random Gmail (not in any allow-list) — role is undefined; access may be denied downstream
    req.headers = { authorization: 'Bearer valid-token' };
    mockAuth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-999',
          email: 'random@gmail.com',
          user_metadata: { role: 'Admin', name: 'Spoofer' },
        },
      },
      error: null,
    });

    requireAuth(req as Request, res as Response, next);
    await vi.waitFor(() => {
      expect(next).toHaveBeenCalled();
      expect(req.authUser?.role).toBeUndefined();
      expect(req.authUser?.email).toBe('random@gmail.com');
    });
  });

  it('returns 401 on auth service error', async () => {
    // Internal Supabase Auth failure (network error, etc.) — reject
    req.headers = { authorization: 'Bearer token' };
    mockAuth.getUser.mockRejectedValue(new Error('Service unavailable'));

    requireAuth(req as Request, res as Response, next);
    await vi.waitFor(() => {
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication failed' });
    });
  });
});

/* ─── optionalAuth middleware ──────────────────────────────────────────────
 * Used for routes where auth is nice-to-have but not required (public reads).
 * Never rejects — always calls next(). Populates req.authUser if token is
 * valid; leaves it undefined otherwise.
 */
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
    // No token -> skip auth, continue without user info
    optionalAuth(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(req.authUser).toBeUndefined();
  });

  it('populates authUser when valid token is present', async () => {
    // Token present and valid -> attach user to request
    req.headers = { authorization: 'Bearer valid-token' };
    mockAuth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'student-789',
          email: 'student@graduate.utm.my',
          user_metadata: { name: 'Student' },
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
        name: 'Student',
      });
    });
  });

  it('calls next without authUser on invalid token', async () => {
    // Token present but invalid -> still continue, just no user info
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
    // Auth service is down -> still call next, user stays anonymous
    req.headers = { authorization: 'Bearer token' };
    mockAuth.getUser.mockRejectedValue(new Error('Service down'));

    optionalAuth(req as Request, res as Response, next);
    await vi.waitFor(() => {
      expect(next).toHaveBeenCalled();
    });
  });
});
