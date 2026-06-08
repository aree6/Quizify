import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createChainable } from '../helpers.js';

const { mockAuth, mockFrom, mockStorageFrom } = vi.hoisted(() => ({
  mockAuth: { getUser: vi.fn() },
  mockFrom: vi.fn(),
  mockStorageFrom: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    auth: mockAuth,
    from: mockFrom,
    rpc: vi.fn(),
    storage: { from: mockStorageFrom },
  },
}));

vi.mock('../../services/materials.service.js', () => ({
  selectMaterials: vi.fn(),
  insertMaterial: vi.fn(),
  updateMaterialRow: vi.fn(),
  getMaterialById: vi.fn(),
  findExistingMaterialForUpload: vi.fn(),
  softReplaceMaterial: vi.fn(),
  deleteMaterials: vi.fn(),
  uploadFileToStorage: vi.fn(),
  moveFileInStorage: vi.fn(),
  removeFileFromStorage: vi.fn(),
  buildStoragePath: vi.fn(),
  repairIndexStatus: vi.fn(),
}));

vi.mock('../../services/rag.service.js', () => ({
  ingestMaterial: vi.fn(),
  reindexMaterial: vi.fn(),
}));

import { createApp } from '../../app.js';
import {
  selectMaterials, repairIndexStatus,
} from '../../services/materials.service.js';

const app = createApp();
const request = supertest(app);

function validLecturer() {
  mockAuth.getUser.mockResolvedValue({
    data: { user: { id: 'u1', email: 'lecturer@utm.my', user_metadata: { role: 'Lecturer' } } },
    error: null,
  });
}

function authHeader() {
  return { Authorization: 'Bearer valid' };
}

describe('Materials (TC002)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validLecturer();
  });

  describe('TC002_01: Upload validation', () => {
    it('rejects upload without file', async () => {
      const res = await request
        .post('/api/materials/upload')
        .set(authHeader())
        .field('courseCode', 'SECJ2203')
        .field('materialType', 'slide')
        .field('chapter', 'Chapter 1');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/file/i);
    });

    it('rejects upload without courseCode', async () => {
      const res = await request
        .post('/api/materials/upload')
        .set(authHeader())
        .field('materialType', 'slide')
        .field('chapter', 'Chapter 1')
        .attach('file', Buffer.from('test'), 'test.pdf');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('courseCode');
    });

    it('rejects slide upload without chapter', async () => {
      const res = await request
        .post('/api/materials/upload')
        .set(authHeader())
        .field('courseCode', 'SECJ2203')
        .field('materialType', 'slide')
        .attach('file', Buffer.from('test'), 'test.pdf');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('chapter');
    });
  });

  describe('TC002_02: Invalid file types', () => {
    it('rejects unsupported file extensions', async () => {
      const res = await request
        .post('/api/materials/upload')
        .set(authHeader())
        .field('courseCode', 'SECJ2203')
        .field('materialType', 'slide')
        .field('chapter', 'Chapter 1')
        .attach('file', Buffer.from('test'), 'notes.txt');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/pdf|pptx/i);
    });
  });

  describe('List materials', () => {
    it('returns empty list when no materials exist', async () => {
      vi.mocked(selectMaterials).mockResolvedValue([]);
      mockFrom.mockReturnValue(createChainable([]));

      const res = await request
        .get('/api/materials')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.materials).toEqual([]);
    });
  });

  describe('Delete material', () => {
    it('deletes a material by id', async () => {
      mockFrom.mockReturnValue(createChainable(
        { id: 'mat-1', storage_path: 'path/file.pdf', status: 'Active' },
        { single: true },
      ));

      const res = await request
        .delete('/api/materials/mat-1')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Repair index', () => {
    it('repairs materials with missing embeddings', async () => {
      vi.mocked(repairIndexStatus).mockResolvedValue({ repaired: 2 });

      const res = await request
        .post('/api/materials/repair')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.repaired).toBe(2);
    });
  });
});
