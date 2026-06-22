import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createChainable } from '../helpers.js';

const { mockAuth, mockFrom } = vi.hoisted(() => ({
  mockAuth: { getUser: vi.fn() },
  mockFrom: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { auth: mockAuth, from: mockFrom, rpc: vi.fn(), storage: { from: vi.fn() } },
}));

vi.mock('../../services/courses.service.js', () => ({
  generateCoursePreview: vi.fn(),
  confirmAndSaveCourse: vi.fn(),
  listAvailableCourses: vi.fn(),
  listMiniCourses: vi.fn(),
  deleteMiniCourse: vi.fn(),
}));

vi.mock('../../services/outlines.service.js', () => ({
  getStoredOutline: vi.fn(),
  extractAndSaveOutline: vi.fn(),
}));

import { createApp } from '../../app.js';
import { generateCoursePreview, confirmAndSaveCourse, listAvailableCourses, listMiniCourses, deleteMiniCourse } from '../../services/courses.service.js';
import type { CoursePreviewResult } from '../../services/courses.service.js';
import { getStoredOutline, extractAndSaveOutline } from '../../services/outlines.service.js';

const app = createApp();
const request = supertest(app);

function validLecturer() {
  mockAuth.getUser.mockResolvedValue({
    data: { user: { id: 'u1', email: 'lecturer@utm.my', user_metadata: { role: 'Lecturer' } } },
    error: null,
  });
}

function validAdmin() {
  mockAuth.getUser.mockResolvedValue({
    data: { user: { id: 'a1', email: 'Mohammadareeb34@gmail.com', user_metadata: { role: 'Admin', name: 'Admin User' } } },
    error: null,
  });
}

function authHeader() {
  return { Authorization: 'Bearer valid' };
}

describe('Courses (TC003-TC006)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validLecturer();
  });

  describe('TC003: Extract Learning Outcomes', () => {
    it('TC003_01: returns stored outline when available', async () => {
      vi.mocked(getStoredOutline).mockResolvedValue({
        synopsis: 'Test synopsis',
        learningOutcomes: ['LO1', 'LO2'],
        chapters: [{ chapter: 'Chapter 1', topics: ['Topic A', 'Topic B'] }],
        updatedAt: '2026-01-01',
      });

      const res = await request
        .get('/api/courses/SECJ2203/topics')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.chapters).toHaveLength(1);
      expect(res.body.source).toBe('stored');
      expect(res.body.synopsis).toBe('Test synopsis');
    });

    it('TC003_02: returns fallback when no stored outline and no materials', async () => {
      vi.mocked(getStoredOutline).mockResolvedValue(null);
      mockFrom.mockReturnValue(createChainable([]));

      const res = await request
        .get('/api/courses/SECJ9999/topics')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.chapters).toEqual([]);
      expect(res.body.source).toBe('empty');
    });

    it('returns error when courseCode is missing', async () => {
      const res = await request
        .get('/api/courses/%20/topics')
        .set(authHeader());

      expect(res.status).toBe(400);
    });
  });

  describe('TC004: Generate Content', () => {
    it('TC004_01: generates course preview successfully', async () => {
      const mockPreview = {
        title: 'Software Testing',
        courseCode: 'SECJ2203',
        courseName: 'SECJ2203',
        topics: ['Software Testing'],
        questionCount: 10,
        generationSource: 'RAG+LLM',
        contextChunksUsed: 3,
        lesson: '## Lesson content\nThis is a test lesson [S1].',
        questions: [
          {
            prompt: 'What is testing?',
            options: ['A', 'B', 'C', 'D'],
            correct: 0,
            explanations: ['exp0', 'exp1', 'exp2', 'exp3'],
            metadata: { topic: 'Testing', subtopic: 'Basics', bloomLevel: 'understand', soloLevel: 'multistructural' },
          },
        ],
        sources: [{ index: 1, chunkId: 'c1', sourceFile: 'slides.pdf', chapter: 'Ch1', chunkIndex: 0, similarity: 0.9, snippet: '...', text: '...' }],
        topicCoverage: [{ topic: 'Testing', chunkCount: 5 }],
      };

      vi.mocked(generateCoursePreview).mockResolvedValue(mockPreview as CoursePreviewResult);

      const res = await request
        .post('/api/courses/preview')
        .set(authHeader())
        .send({
          courseCode: 'SECJ2203',
          topics: ['Software Testing'],
          questionCount: 10,
        });

      expect(res.status).toBe(200);
      expect(res.body.preview).toBeDefined();
      expect(res.body.preview.title).toBe('Software Testing');
      expect(res.body.preview.questions).toHaveLength(1);
      expect(res.body.preview.sources).toHaveLength(1);
    });

    it('TC004_02: rejects preview without courseCode', async () => {
      const res = await request
        .post('/api/courses/preview')
        .set(authHeader())
        .send({ topics: ['Testing'] });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Course code');
    });
  });

  describe('TC005: Create Quizzes', () => {
    it('TC005_01: generates quiz with metadata in preview', async () => {
      const mockPreview = {
        title: 'Testing Quiz',
        courseCode: 'SECJ2203',
        courseName: 'SECJ2203',
        topics: ['Testing'],
        questionCount: 5,
        generationSource: 'RAG+LLM',
        contextChunksUsed: 0,
        lesson: '## Lesson content',
        questions: [
          {
            prompt: 'Q1',
            options: ['A', 'B', 'C', 'D'],
            correct: 0,
            explanations: ['e0', 'e1', 'e2', 'e3'],
            metadata: { topic: 'Testing', subtopic: 'Basics', bloomLevel: 'understand', soloLevel: 'multistructural' },
          },
        ],
        sources: [],
        topicCoverage: [],
      };

      vi.mocked(generateCoursePreview).mockResolvedValue(mockPreview as CoursePreviewResult);

      const res = await request
        .post('/api/courses/preview')
        .set(authHeader())
        .send({
          courseCode: 'SECJ2203',
          topics: ['Testing'],
          questionCount: 5,
          options: {
            enabledBloomLevels: ['understand', 'apply'],
            enabledSoloLevels: ['multistructural'],
            lengthLevel: 'standard',
          },
        });

      expect(res.status).toBe(200);
      const q = res.body.preview.questions[0];
      expect(q.metadata.bloomLevel).toBe('understand');
      expect(q.metadata.soloLevel).toBe('multistructural');
    });
  });

  describe('TC006: Share Course Link', () => {
    it('TC006_01: creates course with share token on confirm', async () => {
      vi.mocked(confirmAndSaveCourse).mockResolvedValue({
        id: 'course-123',
        title: 'Test Course',
        shareToken: 'test-token-abc12345',
        shareUrl: 'https://quizify.app/quiz?token=test-token-abc12345',
        status: 'Ready',
        createdAt: '2026-01-01',
        passPercentage: 40,
        expiresAt: '',
      });

      const res = await request
        .post('/api/courses/confirm')
        .set(authHeader())
        .send({
          title: 'Test Course',
          courseCode: 'SECJ2203',
          lesson: '## Lesson',
          questions: [{ prompt: 'Q1', options: ['A', 'B', 'C', 'D'], correct: 0, explanations: ['e0', 'e1', 'e2', 'e3'], metadata: { topic: 'T', subtopic: 'S', bloomLevel: 'understand', soloLevel: 'multistructural' } }],
        });

      expect(res.status).toBe(201);
      expect(res.body.course.shareToken).toBe('test-token-abc12345');
    });

    it('TC006_02: rejects confirmation without required fields', async () => {
      const res = await request
        .post('/api/courses/confirm')
        .set(authHeader())
        .send({ title: 'Only title' });

      expect(res.status).toBe(400);
    });

    it('confirms course with optional pass percentage', async () => {
      vi.mocked(confirmAndSaveCourse).mockResolvedValue({
        id: 'c1', title: 'T',
        shareToken: 'tok', shareUrl: '/?token=tok', status: 'Ready',
        createdAt: '2026-01-01', passPercentage: 40, expiresAt: '',
      });

      const res = await request
        .post('/api/courses/confirm')
        .set(authHeader())
        .send({
          title: 'T', courseCode: 'SECJ2203', lesson: 'L',
          questions: [{ prompt: 'Q', options: ['A', 'B', 'C', 'D'], correct: 0, explanations: ['e0', 'e1', 'e2', 'e3'], metadata: { topic: 'T', subtopic: 'S', bloomLevel: 'understand', soloLevel: 'multistructural' } }],
          passPercentage: 60,
        });

      expect(res.status).toBe(201);
    });
  });

  describe('List courses', () => {
    it('returns lecturer courses when authenticated', async () => {
      vi.mocked(listMiniCourses).mockResolvedValue([
        { id: 'c1', title: 'Course 1', courseCode: 'SECJ2203', topics: [], status: 'Ready', shareToken: 'tok', shareUrl: '/?token=tok', questionCount: 5, attempts: 0, createdAt: '2026-01-01' },
      ]);

      const res = await request
        .get('/api/courses')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.courses).toHaveLength(1);
    });

    it('admin sees all courses', async () => {
      validAdmin();
      vi.mocked(listMiniCourses).mockResolvedValue([]);

      const res = await request
        .get('/api/courses')
        .set(authHeader());

      expect(res.status).toBe(200);
    });
  });

  describe('Delete course', () => {
    it('deletes a course by id', async () => {
      vi.mocked(deleteMiniCourse).mockResolvedValue();

      const res = await request
        .delete('/api/courses/course-123')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects delete without valid id', async () => {
      const res = await request
        .delete('/api/courses/%20')
        .set(authHeader());

      expect(res.status).toBe(400);
    });
  });
});
