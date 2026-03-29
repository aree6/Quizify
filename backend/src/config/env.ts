import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function num(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  port: num('PORT', 3001),
  corsOrigin: optional('CORS_ORIGIN', '*'),
  defaultPassPercentage: Math.min(100, Math.max(0, num('DEFAULT_PASS_PERCENTAGE', 70))),

  supabase: {
    url: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    storageBucket: optional('SUPABASE_STORAGE_BUCKET', 'course-materials'),
  },

  ai: {
    provider: (process.env.AI_PROVIDER ??
      (process.env.OPENAI_API_KEY ? 'openai' : process.env.GEMINI_API_KEY ? 'gemini' : 'none')) as
      | 'openai'
      | 'gemini'
      | 'none',
    openaiKey: process.env.OPENAI_API_KEY ?? '',
    geminiKey: process.env.GEMINI_API_KEY ?? '',
    embeddingModel: optional(
      'EMBEDDING_MODEL',
      process.env.AI_PROVIDER === 'gemini' ? 'gemini-embedding-001' : 'text-embedding-3-small',
    ),
    generationModel: optional(
      'GENERATION_MODEL',
      process.env.AI_PROVIDER === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini',
    ),
  },
} as const;
