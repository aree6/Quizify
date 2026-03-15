import OpenAI from 'openai';

export const embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
export const generationModel = process.env.GENERATION_MODEL || 'gpt-4o-mini';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const client = OPENAI_API_KEY
  ? new OpenAI({
      apiKey: OPENAI_API_KEY,
    })
  : null;

export function isAiConfigured() {
  return Boolean(client);
}

export async function embedTexts(texts) {
  if (!client) {
    return null;
  }

  const response = await client.embeddings.create({
    model: embeddingModel,
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}

function sanitizeGeneratedQuiz(payload, questionCount) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

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

      const normalizedCorrect = Math.max(0, Math.min(options.length - 1, correctOptionIndex));

      return {
        prompt,
        options: options.slice(0, 4),
        correct: normalizedCorrect,
      };
    })
    .filter(Boolean)
    .slice(0, questionCount);

  if (!lesson || cleanedQuestions.length === 0) {
    return null;
  }

  return {
    lesson,
    questions: cleanedQuestions,
  };
}

export async function generateLessonAndQuiz({ title, topics, context, questionCount }) {
  if (!client) {
    return null;
  }

  const prompt = [
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

  const completion = await client.chat.completions.create({
    model: generationModel,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You generate reliable educational content and valid JSON. Use only the supplied context; do not invent facts.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content;
  if (!raw) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  return sanitizeGeneratedQuiz(parsed, questionCount);
}
