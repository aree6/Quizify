import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../app.js';

const app = createApp();
const request = supertest(app);

/* ─── GET /health ──────────────────────────────────────────────────────────
 * Unauthenticated health-check endpoint.
 * Verifies the app boots, returns correct service identity, and includes AI
 * provider configuration info.
 */
describe('GET /health', () => {
  it('returns ok with service info', async () => {
    // Basic health check — service responds with 200 and identifies itself
    const res = await request.get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe('quizify-backend');
  });

  it('includes rag configuration', async () => {
    // Health response surfaces AI provider / model info for diagnostics
    const res = await request.get('/health');
    expect(res.body.rag).toBeDefined();
    expect(typeof res.body.rag.aiConfigured).toBe('boolean');
    expect(res.body.rag.aiProvider).toBeDefined();
    expect(res.body.rag.embeddingModel).toBeDefined();
    expect(res.body.rag.generationModel).toBeDefined();
  });

  it('returns 404 for unknown routes', async () => {
    // Global 404 handler catches unmatched paths
    const res = await request.get('/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Not found');
  });
});
