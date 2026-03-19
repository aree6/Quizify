import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const aiProvider = process.env.AI_PROVIDER || (OPENAI_API_KEY ? 'openai' : GEMINI_API_KEY ? 'gemini' : 'none');

export const embeddingModel =
  process.env.EMBEDDING_MODEL || (aiProvider === 'gemini' ? 'text-embedding-004' : 'text-embedding-3-small');
export const generationModel =
  process.env.GENERATION_MODEL || (aiProvider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini');

const openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export function isAiConfigured() {
  if (aiProvider === 'openai') return Boolean(openaiClient);
  if (aiProvider === 'gemini') return Boolean(GEMINI_API_KEY);
  return false;
}

async function embedTextsOpenAI(texts) {
  if (!openaiClient) return null;

  const response = await openaiClient.embeddings.create({
    model: embeddingModel,
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}

async function embedTextGemini(text) {
  if (!GEMINI_API_KEY) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${embeddingModel}:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        outputDimensionality: 1536,
      }),
    },
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data?.embedding?.values || null;
}

async function embedTextsGemini(texts) {
  if (!GEMINI_API_KEY) return null;
  const embeddings = [];

  for (const text of texts) {
    const embedding = await embedTextGemini(text);
    if (!embedding) return null;
    embeddings.push(embedding);
  }

  return embeddings;
}

export async function embedTexts(texts) {
  if (!Array.isArray(texts) || texts.length === 0) return null;

  if (aiProvider === 'gemini') {
    return embedTextsGemini(texts);
  }

  if (aiProvider === 'openai') {
    return embedTextsOpenAI(texts);
  }

  return null;
}

function sanitizeGeneratedQuiz(payload, questionCount) {
  if (!payload || typeof payload !== 'object') return null;

  const lesson = typeof payload.lesson === 'string' ? payload.lesson.trim() : '';
  const questions = Array.isArray(payload.questions) ? payload.questions : [];

  const cleanedQuestions = questions
    .map((item) => {
      const prompt = typeof item.prompt === 'string' ? item.prompt.trim() : '';
      const options = Array.isArray(item.options)
        ? item.options.map((opt) => (typeof opt === 'string' ? opt.trim() : '')).filter(Boolean)
        : [];
      const correctOptionIndex = Number(item.correctOptionIndex);

      if (!prompt || options.length < 4 || !Number.isInteger(correctOptionIndex)) {
        return null;
      }

      return {
        prompt,
        options: options.slice(0, 4),
        correct: Math.max(0, Math.min(options.length - 1, correctOptionIndex)),
      };
    })
    .filter(Boolean)
    .slice(0, questionCount);

  if (!lesson || cleanedQuestions.length === 0) return null;

  return { lesson, questions: cleanedQuestions };
}

function buildPrompt({ title, topics, context, questionCount }) {
  return [
    'You are an expert university course assistant.',
    'Generate concise mini-course lesson content and a multiple-choice quiz from the provided context.',
    'Return valid JSON only with this exact schema:',
    '{"lesson": string, "questions": [{"prompt": string, "options": [string,string,string,string], "correctOptionIndex": number}] }',
    `Question count required: ${questionCount}`,
    `Course title: ${title}`,
    `Topics: ${topics.join(', ')}`,
    'Context:',
    context,
  ].join('\n\n');
}

async function generateWithOpenAI(payload) {
  if (!openaiClient) return null;

  const completion = await openaiClient.chat.completions.create({
    model: generationModel,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You generate reliable educational content and valid JSON. Use only the supplied context; do not invent facts.',
      },
      { role: 'user', content: buildPrompt(payload) },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content;
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function generateWithGemini(payload) {
  if (!GEMINI_API_KEY) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${generationModel}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(payload) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
    },
  );

  if (!response.ok) return null;
  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

export async function generateLessonAndQuiz(payload) {
  let parsed = null;

  if (aiProvider === 'gemini') {
    parsed = await generateWithGemini(payload);
  } else if (aiProvider === 'openai') {
    parsed = await generateWithOpenAI(payload);
  }

  return sanitizeGeneratedQuiz(parsed, payload.questionCount);
}
