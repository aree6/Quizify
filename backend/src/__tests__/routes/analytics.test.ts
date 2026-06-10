import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: { getUser: vi.fn() },
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { auth: mockAuth, from: vi.fn(), rpc: vi.fn(), storage: { from: vi.fn() } },
}));

vi.mock('../../services/quiz.service.js', () => ({
  getCourseAnalytics: vi.fn(),
}));

import { createApp } from '../../app.js';
import { getCourseAnalytics } from '../../services/quiz.service.js';

const app = createApp();
const request = supertest(app);

function validLecturer() {
  mockAuth.getUser.mockResolvedValue({
    data: { user: { id: 'u1', email: 'lecturer@utm.my', user_metadata: { role: 'Lecturer' } } },
    error: null,
  });
}

describe('Analytics (TC009)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validLecturer();
  });

  it('TC009_01: returns full analytics when submissions exist', async () => {
    vi.mocked(getCourseAnalytics).mockResolvedValue({
      courseId: 'c1',
      courseTitle: 'Test Course',
      totalSubmissions: 10,
      uniqueStudents: 8,
      totalQuestions: 5,
      averageScore: 70,
      highestScore: 100,
      lowestScore: 20,
      passRate: 60,
      scoreDistribution: [
        { range: '0-20%', count: 1 },
        { range: '21-40%', count: 1 },
        { range: '41-60%', count: 2 },
        { range: '61-80%', count: 3 },
        { range: '81-100%', count: 3 },
      ],
      topicPerformance: [
        { topic: 'Testing', averagePercentage: 75, questionCount: 3, attemptCount: 30 },
        { topic: 'SDLC', averagePercentage: 65, questionCount: 2, attemptCount: 20 },
      ],
      bloomPerformance: [
        { bloomLevel: 'understand', averagePercentage: 78, questionCount: 3, attemptCount: 30 },
        { bloomLevel: 'apply', averagePercentage: 62, questionCount: 2, attemptCount: 20 },
      ],
      soloPerformance: [
        { soloLevel: 'multistructural', averagePercentage: 75, questionCount: 3, attemptCount: 30 },
        { soloLevel: 'relational', averagePercentage: 60, questionCount: 2, attemptCount: 20 },
      ],
      crossMatrix: [],
      questionAnalytics: [],
      studentAnalytics: [],
    });

    const res = await request
      .get('/api/analytics/c1')
      .set({ Authorization: 'Bearer valid' });

    expect(res.status).toBe(200);
    expect(res.body.totalSubmissions).toBe(10);
    expect(res.body.averageScore).toBe(70);
    expect(res.body.passRate).toBe(60);
    expect(res.body.scoreDistribution).toHaveLength(5);
    expect(res.body.topicPerformance).toHaveLength(2);
    expect(res.body.bloomPerformance).toHaveLength(2);
    expect(res.body.soloPerformance).toHaveLength(2);
  });

  it('TC009_02: returns analytics with zero values when no submissions', async () => {
    vi.mocked(getCourseAnalytics).mockResolvedValue({
      courseId: 'c1',
      courseTitle: 'Empty Course',
      totalSubmissions: 0,
      uniqueStudents: 0,
      totalQuestions: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passRate: 0,
      scoreDistribution: [
        { range: '0-20%', count: 0 },
        { range: '21-40%', count: 0 },
        { range: '41-60%', count: 0 },
        { range: '61-80%', count: 0 },
        { range: '81-100%', count: 0 },
      ],
      topicPerformance: [],
      bloomPerformance: [],
      soloPerformance: [],
      crossMatrix: [],
      questionAnalytics: [],
      studentAnalytics: [],
    });

    const res = await request
      .get('/api/analytics/c-empty')
      .set({ Authorization: 'Bearer valid' });

    expect(res.status).toBe(200);
    expect(res.body.totalSubmissions).toBe(0);
    expect(res.body.averageScore).toBe(0);
    expect(res.body.studentAnalytics).toEqual([]);
  });

  it('returns 401 without auth', async () => {
    const res = await request.get('/api/analytics/c1');
    expect(res.status).toBe(401);
  });
});
