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

// ─── Non-secret AI configuration ───
// Change these here when you switch provider, model, or tuning.
// No env vars needed — they don't belong in .env or a hosting dashboard.
type AiProvider = 'openai' | 'gemini' | 'deepseek' | 'none';
const AI_PROVIDER: AiProvider = 'deepseek';
const EMBEDDING_MODEL = 'gemini-embedding-001';
const GENERATION_MODEL = 'deepseek-v4-flash';
const THINKING_ENABLED = true;
const REASONING_EFFORT: 'low' | 'medium' | 'high' = 'low';
const MAX_OUTPUT_LESSON_TOKENS = 32000;
const MAX_OUTPUT_QUIZ_TOKENS = 32000;
const MAX_OUTPUT_OUTLINE_TOKENS = 8000;

export const env = {
  port: num('PORT', 3001),
  corsOrigin: optional('CORS_ORIGIN', '*'),
  defaultPassPercentage: Math.min(100, Math.max(0, num('DEFAULT_PASS_PERCENTAGE', 40))),

  supabase: {
    url: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    storageBucket: optional('SUPABASE_STORAGE_BUCKET', 'course-materials'),
  },

  auth: {
    // Comma-separated list of emails that may claim the Admin role.
    // Set via the ADMIN_EMAILS env var. When unset or empty, no client-supplied
    // (user_metadata) Admin claim is honoured.
    adminEmails: new Set(
      (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
    // Comma-separated list of emails that may be granted the Lecturer role
    // when signing in with a non-UTM account (e.g. developer Gmail for testing).
    lecturerOverrideEmails: new Set(
      (process.env.LECTURER_OVERRIDE_EMAILS ?? '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  },

  ai: {
    provider: AI_PROVIDER as AiProvider,
    openaiKey: process.env.OPENAI_API_KEY ?? '',
    geminiKey: process.env.GEMINI_API_KEY ?? '',
    deepseekKey: process.env.DEEPSEEK_API_KEY ?? '',
    embeddingModel: EMBEDDING_MODEL,
    generationModel: GENERATION_MODEL,
    thinkingEnabled: THINKING_ENABLED as boolean,
    reasoningEffort: REASONING_EFFORT as 'low' | 'medium' | 'high',
    maxLessonTokens: MAX_OUTPUT_LESSON_TOKENS as number,
    maxQuizTokens: MAX_OUTPUT_QUIZ_TOKENS as number,
    maxOutlineTokens: MAX_OUTPUT_OUTLINE_TOKENS as number,
  },
};
