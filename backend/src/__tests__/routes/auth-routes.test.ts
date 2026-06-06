import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';

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

import { createApp } from '../../app.js';

const app = createApp();
const request = supertest(app);

describe('Auth-protected routes (TC001)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function validToken() {
    mockAuth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'lecturer@utm.my',
          user_metadata: { role: 'Lecturer' },
        },
      },
      error: null,
    });
  }

  describe('Materials endpoints require auth', () => {
    it('GET /api/materials returns 401 without token', async () => {
      const res = await request.get('/api/materials');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Authentication required');
    });

    it('GET /api/materials returns data with valid token', async () => {
      validToken();
      const res = await request.get('/api/materials').set('Authorization', 'Bearer valid');
      expect(res.status).not.toBe(401);
    });
  });

  describe('Courses endpoints require auth', () => {
    it('GET /api/courses returns 401 without token', async () => {
      const res = await request.get('/api/courses');
      expect(res.status).toBe(401);
    });

    it('GET /api/courses/available returns 401 without token', async () => {
      const res = await request.get('/api/courses/available');
      expect(res.status).toBe(401);
    });

    it('POST /api/courses/preview returns 401 without token', async () => {
      const res = await request.post('/api/courses/preview').send({});
      expect(res.status).toBe(401);
    });
  });

  describe('Analytics endpoint requires auth', () => {
    it('GET /api/analytics/:courseId returns 401 without token', async () => {
      const res = await request.get('/api/analytics/test-course-id');
      expect(res.status).toBe(401);
    });
  });

  describe('Student attempts require auth', () => {
    it('GET /api/students/attempts returns 401 without token', async () => {
      const res = await request.get('/api/students/attempts');
      expect(res.status).toBe(401);
    });
  });
});

describe('Public routes (no auth required)', () => {
  it('GET /api/public/course/:token does not require auth', async () => {
    const res = await request.get('/api/public/course/test-token');
    expect(res.status).not.toBe(401);
  });
});
