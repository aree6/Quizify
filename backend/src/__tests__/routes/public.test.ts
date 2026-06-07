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
        courseCode: 'SECJ2203',
        lesson: '## Lesson content',
        sources: [],
        passPercentage: 40,
        questions: [
          { id: 'q1', prompt: 'Q1', optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D', correctOptionIndex: 0, orderIndex: 0, metadata: { topic: 'T', bloomLevel: 'understand', soloLevel: 'multistructural' } },
        ],
      });

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
    it('TC008_01: accepts valid quiz submission', async () => {
      vi.mocked(submitQuizAttempt).mockResolvedValue({
        studentName: 'Ali',
        score: 4,
        totalQuestions: 5,
        percentage: 80,
        passed: true,
        answers: [],
      });

      const res = await request
        .post('/api/public/course/test-token/submit')
        .send({
          studentName: 'Ali',
          answers: [
            { questionId: 'q1', selectedOptionIndex: 0 },
            { questionId: 'q2', selectedOptionIndex: 1 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.score).toBe(4);
      expect(res.body.passed).toBe(true);
    });

    it('TC008_02: rejects submission when student name is blank', async () => {
      const res = await request
        .post('/api/public/course/test-token/submit')
        .send({
          studentName: '',
          answers: [{ questionId: 'q1', selectedOptionIndex: 0 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Student name');
    });

    it('TC008_02: rejects submission when student name is too short', async () => {
      const res = await request
        .post('/api/public/course/test-token/submit')
        .send({
          studentName: 'A',
          answers: [{ questionId: 'q1', selectedOptionIndex: 0 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Student name');
    });

    it('rejects submission without answers', async () => {
      const res = await request
        .post('/api/public/course/test-token/submit')
        .send({
          studentName: 'Ali',
          answers: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Answers');
    });

    it('accepts submission with optional auth', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 's1', email: 'student@graduate.utm.my', user_metadata: {} } },
        error: null,
      });

      vi.mocked(submitQuizAttempt).mockResolvedValue({
        studentName: 'Ali',
        score: 5,
        totalQuestions: 5,
        percentage: 100,
        passed: true,
        answers: [],
      });

      const res = await request
        .post('/api/public/course/test-token/submit')
        .set('Authorization', 'Bearer student-token')
        .send({
          studentName: 'Ali',
          answers: [{ questionId: 'q1', selectedOptionIndex: 0 }],
        });

      expect(res.status).toBe(200);
    });
  });
});
