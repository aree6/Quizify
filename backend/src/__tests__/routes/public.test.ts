import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: { getUser: vi.fn() },
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { auth: mockAuth, from: vi.fn(), rpc: vi.fn(), storage: { from: vi.fn() } },
}));

vi.mock('../../services/quiz.service.js', () => ({
  getPublicCourse: vi.fn(),
  submitQuizAttempt: vi.fn(),
}));

import { createApp } from '../../app.js';
import { getPublicCourse, submitQuizAttempt } from '../../services/quiz.service.js';

const app = createApp();
const request = supertest(app);

describe('Public Learning (TC007-TC008)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TC007: Access Mini-Course', () => {
    it('TC007_01: returns course for valid token', async () => {
      vi.mocked(getPublicCourse).mockResolvedValue({
        id: 'c1',
        title: 'Test Mini-Course',
        lessonContent: '## Lesson content',
        sources: [],
        quizTitle: 'Test Mini-Course Quiz',
        passPercentage: 40,
        questions: [
          { id: 'q1', prompt: 'Q1', options: ['A', 'B', 'C', 'D'], explanations: ['', '', '', ''], metadata: { topic: 'T', subtopic: '', bloomLevel: 'understand', soloLevel: 'multistructural' } as const },
        ],
      } as any);

      const res = await request.get('/api/public/course/test-token');

      expect(res.status).toBe(200);
      expect(res.body.course).toBeDefined();
      expect(res.body.course.title).toBe('Test Mini-Course');
    });

    it('TC007_02: returns error for invalid token', async () => {
      vi.mocked(getPublicCourse).mockRejectedValue(
        Object.assign(new Error('Course not found'), { status: 404 }),
      );

      const res = await request.get('/api/public/course/invalid-token');

      expect(res.status).toBe(500);
    });
  });

  describe('TC008: Take Quiz', () => {
    it('TC008_01: accepts valid quiz submission from authenticated student', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 's1', email: 'student@graduate.utm.my', user_metadata: { name: 'Ali' } } },
        error: null,
      });

      vi.mocked(submitQuizAttempt).mockResolvedValue({
        attemptId: 'att-1',
        submittedAt: '2026-01-01T00:00:00Z',
        score: 4,
        total: 5,
        percentage: 80,
        passed: true,
        passPercentage: 40,
        answers: [],
      });

      const res = await request
        .post('/api/public/course/test-token/submit')
        .set('Authorization', 'Bearer student-token')
        .send({
          answers: [
            { questionId: 'q1', selectedOptionIndex: 0 },
            { questionId: 'q2', selectedOptionIndex: 1 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.score).toBe(4);
      expect(res.body.passed).toBe(true);
      // Identity is derived from token, not body
      expect(submitQuizAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          studentEmail: 'student@graduate.utm.my',
          studentName: 'Ali',
        }),
      );
    });

    it('TC008_02: rejects submission without auth', async () => {
      const res = await request
        .post('/api/public/course/test-token/submit')
        .send({
          answers: [{ questionId: 'q1', selectedOptionIndex: 0 }],
        });

      expect(res.status).toBe(401);
      // requireAuth middleware emits "Authentication required" before reaching
      // the controller, which would emit "Sign in to submit a quiz attempt".
      // Either is acceptable; the contract is that unauthenticated requests are 401.
      expect(['Authentication required', 'Sign in to submit a quiz attempt']).toContain(res.body.message);
    });

    it('rejects submission without answers', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 's1', email: 'student@graduate.utm.my', user_metadata: { name: 'Ali' } } },
        error: null,
      });

      const res = await request
        .post('/api/public/course/test-token/submit')
        .set('Authorization', 'Bearer student-token')
        .send({ answers: [] });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Answers');
    });

    it('ignores studentName in body and uses token identity', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 's1', email: 'student@graduate.utm.my', user_metadata: { name: 'Ali' } } },
        error: null,
      });

      vi.mocked(submitQuizAttempt).mockResolvedValue({
        attemptId: 'att-3',
        submittedAt: '2026-01-01T00:00:00Z',
        score: 1,
        total: 1,
        percentage: 100,
        passed: true,
        passPercentage: 40,
        answers: [],
      });

      const res = await request
        .post('/api/public/course/test-token/submit')
        .set('Authorization', 'Bearer student-token')
        .send({
          studentName: 'WRONG_NAME',
          answers: [{ questionId: 'q1', selectedOptionIndex: 0 }],
        });

      expect(res.status).toBe(200);
      expect(submitQuizAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ studentName: 'Ali' }),
      );
    });
  });
});
