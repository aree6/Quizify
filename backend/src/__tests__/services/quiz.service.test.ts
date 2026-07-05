import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createChainable } from '../helpers.js';

vi.mock('../../config/env.js', () => ({
  env: {
    port: 3001,
    corsOrigin: '*',
    defaultPassPercentage: 40,
    supabase: { url: 'test', serviceRoleKey: 'test', storageBucket: 'test' },
    ai: { provider: 'none', openaiKey: '', geminiKey: '', deepseekKey: '', embeddingModel: 'test', generationModel: 'test', thinkingEnabled: false, reasoningEffort: 'low', maxLessonTokens: 1000, maxQuizTokens: 1000, maxOutlineTokens: 1000 },
  },
}));

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom, rpc: vi.fn(), auth: { getUser: vi.fn() }, storage: { from: vi.fn() } },
}));

import { getCourseAnalytics, submitQuizAttempt } from '../../services/quiz.service.js';

/* ─── Quiz Service — Scoring & Analytics ──────────────────────────────────
 * Pure unit tests for the core quiz logic (no HTTP, no routing).
 * Every test feeds controlled fixture data through mocked Supabase and
 * asserts on the computed output.
 *
 * Sub-sections:
 *   submitQuizAttempt  — scoring correctness (100%, partial, pass/fail)
 *   getCourseAnalytics — analytics aggregation (KPIs, topic, Bloom, SOLO,
 *                        cross-matrix, student diagnostics, score distribution)
 */
describe('Quiz Service - Scoring (Input/Output)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitQuizAttempt', () => {
    it('scores all correct answers as 100%', async () => {
      // 3 questions, all answered correctly -> 3/3 = 100%, passed
      mockFrom.mockImplementation((table: string) => {
        if (table === 'mini_courses') {
          return createChainable({
            id: 'c1',
            quizzes: [{ id: 'q1' }],
            status: 'Ready',
            expires_at: null,
            pass_percentage: 40,
          }, { single: true });
        }
        if (table === 'questions') {
          return createChainable([
            { id: 'q1', correct_option_index: 0, metadata: { topic: 'T1', subtopic: 's1', bloomLevel: 'understand', soloLevel: 'multistructural' } },
            { id: 'q2', correct_option_index: 1, metadata: { topic: 'T1', subtopic: 's1', bloomLevel: 'understand', soloLevel: 'multistructural' } },
            { id: 'q3', correct_option_index: 2, metadata: { topic: 'T2', subtopic: 's2', bloomLevel: 'apply', soloLevel: 'relational' } },
          ]);
        }
        if (table === 'quiz_attempts') {
          return createChainable(
            { id: 'att-1', submitted_at: '2026-01-01T00:00:00Z' },
            { single: true },
          );
        }
        return createChainable([]);
      });

      const result = await submitQuizAttempt({
        token: 'test-token',
        studentName: 'Ali',
        answers: [
          { questionId: 'q1', selectedOptionIndex: 0 },
          { questionId: 'q2', selectedOptionIndex: 1 },
          { questionId: 'q3', selectedOptionIndex: 2 },
        ],
      });

      expect(result.score).toBe(3);
      expect(result.total).toBe(3);
      expect(result.percentage).toBe(100);
      expect(result.passed).toBe(true);
    });

    it('scores partial answers correctly', async () => {
      // 5 questions, 1 correct -> 1/5 = 20%, failed (pass = 60)
      mockFrom.mockImplementation((table: string) => {
        if (table === 'mini_courses') {
          return createChainable({
            id: 'c1',
            quizzes: [{ id: 'q1' }],
            status: 'Shared',
            expires_at: null,
            pass_percentage: 60,
          }, { single: true });
        }
        if (table === 'questions') {
          return createChainable([
            { id: 'q1', correct_option_index: 0, metadata: {} },
            { id: 'q2', correct_option_index: 0, metadata: {} },
            { id: 'q3', correct_option_index: 0, metadata: {} },
            { id: 'q4', correct_option_index: 0, metadata: {} },
            { id: 'q5', correct_option_index: 0, metadata: {} },
          ]);
        }
        if (table === 'quiz_attempts') {
          return createChainable(
            { id: 'att-2', submitted_at: '2026-01-02T00:00:00Z' },
            { single: true },
          );
        }
        return createChainable([]);
      });

      const result = await submitQuizAttempt({
        token: 'test-token',
        studentName: 'Bob',
        answers: [
          { questionId: 'q1', selectedOptionIndex: 0 }, // correct
          { questionId: 'q2', selectedOptionIndex: 1 }, // wrong
          { questionId: 'q3', selectedOptionIndex: 1 }, // wrong
          { questionId: 'q4', selectedOptionIndex: 2 }, // wrong
          { questionId: 'q5', selectedOptionIndex: 3 }, // wrong
        ],
      });

      expect(result.score).toBe(1);
      expect(result.total).toBe(5);
      expect(result.percentage).toBe(20);
      expect(result.passed).toBe(false);
      expect(result.passPercentage).toBe(60);
    });
  });

  describe('getCourseAnalytics', () => {
    it('returns empty analytics when no attempts exist', async () => {
      // No submissions -> all KPIs zero, empty arrays, 5 empty buckets
      mockFrom.mockImplementation((table: string) => {
        if (table === 'quiz_attempts') {
          return createChainable([]);
        }
        if (table === 'mini_courses') {
          return createChainable({
            pass_percentage: 40,
            quizzes: [{ id: 'q1' }],
          }, { single: true });
        }
        return createChainable([]);
      });

      const result = await getCourseAnalytics('c1');

      expect(result.totalSubmissions).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.passRate).toBe(0);
      expect(result.topicPerformance).toEqual([]);
      expect(result.bloomPerformance).toEqual([]);
      expect(result.scoreDistribution).toHaveLength(5);
    });

    it('computes topic performance from attempts', async () => {
      // 2 students, 3 questions each -> KPI aggregation + topic breakdown
      const attempts = [
        {
          id: 'a1',
          student_name: 'Ali',
          score: 3,
          total_questions: 3,
          percentage: 100,
          submitted_at: '2026-01-01',
          submitted_answers: [
            { questionId: 'q1', selectedOptionIndex: 0, correctOptionIndex: 0, isCorrect: true, metadata: { topic: 'Testing', subtopic: 'Basics', bloomLevel: 'understand', soloLevel: 'multistructural' } },
            { questionId: 'q2', selectedOptionIndex: 1, correctOptionIndex: 1, isCorrect: true, metadata: { topic: 'Testing', subtopic: 'Basics', bloomLevel: 'apply', soloLevel: 'relational' } },
            { questionId: 'q3', selectedOptionIndex: 0, correctOptionIndex: 1, isCorrect: false, metadata: { topic: 'SDLC', subtopic: 'Phases', bloomLevel: 'understand', soloLevel: 'multistructural' } },
          ],
        },
        {
          id: 'a2',
          student_name: 'Bob',
          score: 1,
          total_questions: 3,
          percentage: 33,
          submitted_at: '2026-01-02',
          submitted_answers: [
            { questionId: 'q1', selectedOptionIndex: 2, correctOptionIndex: 0, isCorrect: false, metadata: { topic: 'Testing', subtopic: 'Basics', bloomLevel: 'understand', soloLevel: 'multistructural' } },
            { questionId: 'q2', selectedOptionIndex: 1, correctOptionIndex: 1, isCorrect: true, metadata: { topic: 'Testing', subtopic: 'Basics', bloomLevel: 'apply', soloLevel: 'relational' } },
            { questionId: 'q3', selectedOptionIndex: 3, correctOptionIndex: 1, isCorrect: false, metadata: { topic: 'SDLC', subtopic: 'Phases', bloomLevel: 'understand', soloLevel: 'multistructural' } },
          ],
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'quiz_attempts') {
          return createChainable(attempts);
        }
        if (table === 'mini_courses') {
          return createChainable({
            pass_percentage: 40,
            quizzes: [{ id: 'q1' }],
          }, { single: true });
        }
        if (table === 'questions') {
          return createChainable([
            { id: 'q1', prompt: 'What is testing?', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option_index: 0, explanations: [], metadata: { topic: 'Testing', subtopic: 'Basics', bloomLevel: 'understand', soloLevel: 'multistructural' } },
            { id: 'q2', prompt: 'Apply testing?', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option_index: 1, explanations: [], metadata: { topic: 'Testing', subtopic: 'Basics', bloomLevel: 'apply', soloLevel: 'relational' } },
            { id: 'q3', prompt: 'What is SDLC?', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option_index: 1, explanations: [], metadata: { topic: 'SDLC', subtopic: 'Phases', bloomLevel: 'understand', soloLevel: 'multistructural' } },
          ]);
        }
        return createChainable([]);
      });

      const result = await getCourseAnalytics('c1');

      // KPI correctness
      expect(result.totalSubmissions).toBe(2);
      expect(result.uniqueStudents).toBe(2);
      expect(result.averageScore).toBe(67);
      expect(result.highestScore).toBe(100);
      expect(result.lowestScore).toBe(33);
      expect(result.passRate).toBe(50);

      // Per-topic aggregates
      const testingTopic = result.topicPerformance.find((t: any) => t.topic === 'Testing');
      expect(testingTopic).toBeDefined();
      const sdlcTopic = result.topicPerformance.find((t: any) => t.topic === 'SDLC');
      expect(sdlcTopic).toBeDefined();

      // Bloom performance includes all 6 levels (some with 0, some populated)
      expect(result.bloomPerformance).toHaveLength(6);
      const understandBloom = result.bloomPerformance.find((b: any) => b.bloomLevel === 'understand');
      expect(understandBloom).toBeDefined();
    });

    it('computes cross-matrix from attempts', async () => {
      // Topic x Bloom's cross-matrix entries for the heatmap
      const attempts = [
        {
          id: 'a1', student_name: 'Ali', score: 2, total_questions: 2, percentage: 100, submitted_at: '2026-01-01',
          submitted_answers: [
            { questionId: 'q1', selectedOptionIndex: 0, correctOptionIndex: 0, isCorrect: true, metadata: { topic: 'Testing', subtopic: '', bloomLevel: 'understand', soloLevel: 'multistructural' } },
            { questionId: 'q2', selectedOptionIndex: 1, correctOptionIndex: 1, isCorrect: true, metadata: { topic: 'Testing', subtopic: '', bloomLevel: 'apply', soloLevel: 'relational' } },
          ],
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'quiz_attempts') return createChainable(attempts);
        if (table === 'mini_courses') return createChainable({ pass_percentage: 40, quizzes: [{ id: 'q1' }] }, { single: true });
        if (table === 'questions') {
          return createChainable([
            { id: 'q1', prompt: 'Q1', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option_index: 0, explanations: [], metadata: { topic: 'Testing', bloomLevel: 'understand', soloLevel: 'multistructural' } },
            { id: 'q2', prompt: 'Q2', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option_index: 1, explanations: [], metadata: { topic: 'Testing', bloomLevel: 'apply', soloLevel: 'relational' } },
          ]);
        }
        return createChainable([]);
      });

      const result = await getCourseAnalytics('c1');
      expect(result.crossMatrix).toHaveLength(2);
      expect(result.crossMatrix[0]).toHaveProperty('topic');
      expect(result.crossMatrix[0]).toHaveProperty('bloomLevel');
    });

    it('computes student analytics with weak topics', async () => {
      // Per-student diagnostic: identifies weak topics (<70%), strongest topic,
      // weakest Bloom level, and answer breakdown
      const attempts = [
        {
          id: 'a1', student_name: 'Ali', score: 1, total_questions: 2, percentage: 50, submitted_at: '2026-01-01',
          submitted_answers: [
            { questionId: 'q1', selectedOptionIndex: 0, correctOptionIndex: 0, isCorrect: true, metadata: { topic: 'Testing', subtopic: '', bloomLevel: 'understand', soloLevel: 'multistructural' } },
            { questionId: 'q2', selectedOptionIndex: 0, correctOptionIndex: 1, isCorrect: false, metadata: { topic: 'SDLC', subtopic: '', bloomLevel: 'understand', soloLevel: 'multistructural' } },
          ],
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'quiz_attempts') return createChainable(attempts);
        if (table === 'mini_courses') return createChainable({ pass_percentage: 40, quizzes: [{ id: 'q1' }] }, { single: true });
        if (table === 'questions') {
          return createChainable([
            { id: 'q1', prompt: 'Q1', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option_index: 0, explanations: [], metadata: { topic: 'Testing', bloomLevel: 'understand', soloLevel: 'multistructural' } },
            { id: 'q2', prompt: 'Q2', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option_index: 1, explanations: [], metadata: { topic: 'SDLC', bloomLevel: 'understand', soloLevel: 'multistructural' } },
          ]);
        }
        return createChainable([]);
      });

      const result = await getCourseAnalytics('c1');
      expect(result.studentAnalytics).toHaveLength(1);
      const student = result.studentAnalytics[0]!;
      expect(student.studentName).toBe('Ali');
      // SDLC is weak (0/1 correct = 0% < 70% threshold)
      expect(student.weakTopics).toHaveLength(1);
      expect(student.weakTopics[0]!.topic).toBe('SDLC');
      // Testing is strongest (1/1 = 100%)
      expect(student.strongestTopic).toBe('Testing');
      expect(student.answers).toHaveLength(2);
    });

    it('computes score distribution correctly', async () => {
      // 5 students with exactly one per bucket -> each bucket has count=1
      const attempts = [
        { id: 'a1', student_name: 'S1', score: 1, total_questions: 5, percentage: 20, submitted_at: '2026-01-01', submitted_answers: [] },
        { id: 'a2', student_name: 'S2', score: 2, total_questions: 5, percentage: 40, submitted_at: '2026-01-02', submitted_answers: [] },
        { id: 'a3', student_name: 'S3', score: 3, total_questions: 5, percentage: 60, submitted_at: '2026-01-03', submitted_answers: [] },
        { id: 'a4', student_name: 'S4', score: 4, total_questions: 5, percentage: 80, submitted_at: '2026-01-04', submitted_answers: [] },
        { id: 'a5', student_name: 'S5', score: 5, total_questions: 5, percentage: 100, submitted_at: '2026-01-05', submitted_answers: [] },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'quiz_attempts') return createChainable(attempts);
        if (table === 'mini_courses') return createChainable({ pass_percentage: 40, quizzes: [{ id: 'q1' }] }, { single: true });
        if (table === 'questions') return createChainable([]);
        return createChainable([]);
      });

      const result = await getCourseAnalytics('c1');
      expect(result.scoreDistribution).toHaveLength(5);
      const buckets = result.scoreDistribution;
      expect(buckets.find((b: any) => b.range === '0-20%')?.count).toBe(1);
      expect(buckets.find((b: any) => b.range === '21-40%')?.count).toBe(1);
      expect(buckets.find((b: any) => b.range === '41-60%')?.count).toBe(1);
      expect(buckets.find((b: any) => b.range === '61-80%')?.count).toBe(1);
      expect(buckets.find((b: any) => b.range === '81-100%')?.count).toBe(1);
    });

    it('computes average score and pass rate correctly', async () => {
      // 3 students: scores 40, 60, 80 -> avg = 60, pass (>=40) = 3/3 = 100%
      const attempts = [
        { id: 'a1', student_name: 'S1', score: 2, total_questions: 5, percentage: 40, submitted_at: '2026-01-01', submitted_answers: [] },
        { id: 'a2', student_name: 'S2', score: 3, total_questions: 5, percentage: 60, submitted_at: '2026-01-02', submitted_answers: [] },
        { id: 'a3', student_name: 'S3', score: 4, total_questions: 5, percentage: 80, submitted_at: '2026-01-03', submitted_answers: [] },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'quiz_attempts') return createChainable(attempts);
        if (table === 'mini_courses') return createChainable({ pass_percentage: 40, quizzes: [{ id: 'q1' }] }, { single: true });
        if (table === 'questions') return createChainable([]);
        return createChainable([]);
      });

      const result = await getCourseAnalytics('c1');
      expect(result.averageScore).toBe(60);
      expect(result.passRate).toBe(100);
    });
  });
});
