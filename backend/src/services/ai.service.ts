import axios, { type AxiosInstance } from 'axios';
import OpenAI from 'openai';
import { env } from '../config/env.js';
import type { ChapterOutline, GeneratedContent, GeneratedQuestion } from '../types/index.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const openai: OpenAI | null = env.ai.openaiKey ? new OpenAI({ apiKey: env.ai.openaiKey }) : null;

const gemini: AxiosInstance = axios.create({
  baseURL: GEMINI_BASE,
  timeout: 60_000,
});

export function isAiConfigured(): boolean {
  if (env.ai.provider === 'openai') return Boolean(openai);
  if (env.ai.provider === 'gemini') return Boolean(env.ai.geminiKey);
  return false;
}

export const aiInfo = {
  provider: env.ai.provider,
  embeddingModel: env.ai.embeddingModel,
  generationModel: env.ai.generationModel,
};

/* ─── Embeddings ─── */

async function embedGemini(text: string): Promise<number[] | null> {
  if (!env.ai.geminiKey) return null;
  try {
    const { data } = await gemini.post<{ embedding?: { values: number[] } }>(
      `/models/${env.ai.embeddingModel}:embedContent`,
      {
        content: { parts: [{ text }] },
        outputDimensionality: 1536,
      },
      { params: { key: env.ai.geminiKey } },
    );
    return data.embedding?.values ?? null;
  } catch (err) {
    const msg = axios.isAxiosError(err) ? err.response?.data?.error?.message : (err as Error).message;
    console.error(`[ai] Gemini embed failed:`, msg);
    return null;
  }
}

async function embedOpenAI(texts: readonly string[]): Promise<number[][] | null> {
  if (!openai) return null;
  const resp = await openai.embeddings.create({ model: env.ai.embeddingModel, input: [...texts] });
  return resp.data.map((item) => item.embedding);
}

export async function embedTexts(texts: readonly string[]): Promise<number[][] | null> {
  if (texts.length === 0) return null;

  if (env.ai.provider === 'openai') return embedOpenAI(texts);

  if (env.ai.provider === 'gemini') {
    const results: number[][] = [];
    for (const text of texts) {
      const vec = await embedGemini(text);
      if (!vec) return null;
      results.push(vec);
    }
    return results;
  }

  return null;
}

/* ─── Generation ─── */

type RawQuiz = {
  lesson?: unknown;
  questions?: Array<{ prompt?: unknown; options?: unknown; correctOptionIndex?: unknown }>;
};

function sanitizeGeneratedQuiz(raw: RawQuiz | null, questionCount: number): GeneratedContent | null {
  if (!raw || typeof raw !== 'object') return null;

  const lesson = typeof raw.lesson === 'string' ? raw.lesson.trim() : '';
  const rawQs = Array.isArray(raw.questions) ? raw.questions : [];

  const questions: GeneratedQuestion[] = rawQs
    .map((item): GeneratedQuestion | null => {
      const prompt = typeof item.prompt === 'string' ? item.prompt.trim() : '';
      const options = Array.isArray(item.options)
        ? item.options.map((o) => (typeof o === 'string' ? o.trim() : '')).filter(Boolean)
        : [];
      const correct = Number(item.correctOptionIndex);

      if (!prompt || options.length < 4 || !Number.isInteger(correct)) return null;

      return {
        prompt,
        options: options.slice(0, 4),
        correct: Math.max(0, Math.min(options.length - 1, correct)),
      };
    })
    .filter((q): q is GeneratedQuestion => q !== null)
    .slice(0, questionCount);

  if (!lesson || questions.length === 0) return null;
  return { lesson, questions };
}

function buildLessonPrompt(p: { title: string; topics: string[]; context: string; questionCount: number }): string {
  return [
    'You are an expert university course assistant.',
    'Generate concise mini-course lesson content and a multiple-choice quiz from the provided context.',
    'Return valid JSON only with this exact schema:',
    '{"lesson": string, "questions": [{"prompt": string, "options": [string,string,string,string], "correctOptionIndex": number}] }',
    `Question count required: ${p.questionCount}`,
    `Course title: ${p.title}`,
    `Topics: ${p.topics.join(', ')}`,
    'Context:',
    p.context,
  ].join('\n\n');
}

async function generateJsonGemini(prompt: string, temperature: number): Promise<unknown | null> {
  if (!env.ai.geminiKey) return null;
  try {
    const { data } = await gemini.post<{ candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }>(
      `/models/${env.ai.generationModel}:generateContent`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature },
      },
      { params: { key: env.ai.geminiKey } },
    );
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? JSON.parse(text) : null;
  } catch (err) {
    const msg = axios.isAxiosError(err) ? err.response?.data?.error?.message : (err as Error).message;
    console.error(`[ai] Gemini generate failed:`, msg);
    return null;
  }
}

async function generateJsonOpenAI(prompt: string, temperature: number, system?: string): Promise<unknown | null> {
  if (!openai) return null;
  const completion = await openai.chat.completions.create({
    model: env.ai.generationModel,
    temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system ?? 'Return valid JSON only.' },
      { role: 'user', content: prompt },
    ],
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function generateLessonAndQuiz(payload: {
  title: string;
  topics: string[];
  context: string;
  questionCount: number;
}): Promise<GeneratedContent | null> {
  const prompt = buildLessonPrompt(payload);
  const system = 'You generate reliable educational content and valid JSON. Use only the supplied context; do not invent facts.';

  const raw =
    env.ai.provider === 'gemini'
      ? await generateJsonGemini(prompt, 0.3)
      : await generateJsonOpenAI(prompt, 0.3, system);

  return sanitizeGeneratedQuiz(raw as RawQuiz | null, payload.questionCount);
}

/* ─── Course outline extraction ─── */

function buildOutlinePrompt(courseText: string): string {
  return [
    'You are a course outline extraction assistant.',
    'From the following course material text, extract the chapter structure AS IT APPEARS in the document.',
    'Return valid JSON only with this exact schema:',
    '{ "chapters": [ { "chapter": "Chapter 1: <title>", "topics": ["Topic A", "Topic B"] } ] }',
    'Rules:',
    '- Preserve the original chapter numbering and titles from the course outline (e.g., "CHAPTER 1: SET THEORY").',
    '- Group subtopics under their ORIGINAL chapter headings as shown in the document.',
    '- Do NOT split or reorganize chapters - keep them as defined in the course outline.',
    '- Subtopics should be specific concepts listed under each chapter.',
    '- Return at least 1 chapter with at least 1 topic.',
    '',
    'Course material:',
    courseText,
  ].join('\n');
}

export async function extractCourseTopics(courseText: string): Promise<ChapterOutline[] | null> {
  if (!courseText || !isAiConfigured()) return null;

  const prompt = buildOutlinePrompt(courseText);
  const raw =
    env.ai.provider === 'gemini'
      ? await generateJsonGemini(prompt, 0.2)
      : await generateJsonOpenAI(prompt, 0.2, 'You extract structured course outlines from raw text. Return valid JSON only.');

  const parsed = raw as { chapters?: Array<{ chapter?: string; topics?: string[] }> } | null;
  if (!parsed || !Array.isArray(parsed.chapters)) return null;

  return parsed.chapters
    .filter((ch): ch is { chapter: string; topics: string[] } =>
      Boolean(ch.chapter && Array.isArray(ch.topics) && ch.topics.length > 0),
    )
    .map((ch) => ({
      chapter: ch.chapter.trim(),
      topics: ch.topics.map((t) => String(t).trim()).filter(Boolean),
    }));
}
