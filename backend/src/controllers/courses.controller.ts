import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../middleware/error-handler.js';
import { pathParam } from '../middleware/async-handler.js';
import { extractAndSaveOutline, getStoredOutline } from '../services/outlines.service.js';
import {
  confirmAndSaveCourse,
  generateCoursePreview,
  listAvailableCourses,
  listMiniCourses,
} from '../services/courses.service.js';
import type { GeneratedQuestion } from '../types/index.js';

export async function getAvailableCourses(_req: Request, res: Response): Promise<void> {
  const courses = await listAvailableCourses();
  res.json({ courses });
}

export async function getCourseTopics(req: Request, res: Response): Promise<void> {
  const courseCode = pathParam(req.params.courseCode).trim().toUpperCase();
  if (!courseCode) throw new HttpError(400, 'courseCode is required');

  // 1) Persisted outline (extracted at upload time)
  const stored = await getStoredOutline(courseCode);
  if (stored && stored.chapters.length > 0) {
    res.json({
      chapters: stored.chapters,
      synopsis: stored.synopsis,
      learningOutcomes: stored.learningOutcomes,
      source: 'stored',
    });
    return;
  }

  // 2) Extract from course_info chunks on-the-fly
  const { data: chunks, error } = await supabase
    .from('material_chunks')
    .select('chunk_text, chapter, source_file')
    .eq('course_code', courseCode)
    .order('chunk_index', { ascending: true })
    .limit(80);

  if (error) throw new HttpError(500, 'Failed to fetch course chunks');

  if (!chunks || chunks.length === 0) {
    res.json({ chapters: [], source: 'empty' });
    return;
  }

  const combinedText = chunks
    .map((c: { chunk_text: string }) => c.chunk_text)
    .join('\n\n')
    .slice(0, 30_000);

  const extracted = await extractAndSaveOutline(courseCode, combinedText);
  if (extracted && extracted.chapters.length > 0) {
    res.json({
      chapters: extracted.chapters,
      synopsis: extracted.synopsis,
      learningOutcomes: extracted.learningOutcomes,
      source: 'ai',
    });
    return;
  }

  // 3) Fallback: group by chapter field, derive topic names from file names
  const chapterMap = new Map<string, Set<string>>();
  for (const chunk of chunks as Array<{ chapter: string | null; source_file: string | null }>) {
    const key = chunk.chapter ?? 'General';
    if (!chapterMap.has(key)) chapterMap.set(key, new Set());
    const topic = (chunk.source_file ?? '')
      .replace(/\.(pdf|pptx)$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();
    if (topic) chapterMap.get(key)!.add(topic);
  }
  const fallbackChapters = [...chapterMap.entries()]
    .map(([chapter, topicSet]) => ({ chapter, topics: [...topicSet].slice(0, 15) }))
    .sort((a, b) => a.chapter.localeCompare(b.chapter, undefined, { numeric: true }));

  res.json({ chapters: fallbackChapters, source: 'fallback' });
}

export async function previewCourse(req: Request, res: Response): Promise<void> {
  const courseCode = typeof req.body.courseCode === 'string' ? req.body.courseCode : '';
  const topics = Array.isArray(req.body.topics) ? (req.body.topics as unknown[]).map(String) : [];
  const questionCount = Number(req.body.questionCount ?? 15);

  if (!courseCode) throw new HttpError(400, 'Course code is required');

  const preview = await generateCoursePreview({ courseCode, topics, questionCount });
  res.json({ preview });
}

export async function confirmCourse(req: Request, res: Response): Promise<void> {
  const { title, courseCode, lesson, topics, questions, lecturerName } = req.body as {
    title?: string;
    courseCode?: string;
    lesson?: string;
    topics?: string[];
    questions?: GeneratedQuestion[];
    lecturerName?: string;
  };

  if (!title || !courseCode || !lesson || !Array.isArray(questions) || questions.length === 0) {
    throw new HttpError(400, 'title, courseCode, lesson, and questions are required');
  }

  const course = await confirmAndSaveCourse({
    title,
    courseCode,
    topics: topics ?? [],
    lesson,
    questions,
    lecturerName: lecturerName ?? 'Lecturer',
  });

  res.status(201).json({ course });
}

export async function reindexOutline(req: Request, res: Response): Promise<void> {
  const courseCode = pathParam(req.params.courseCode).trim().toUpperCase();
  if (!courseCode) throw new HttpError(400, 'courseCode is required');

  const { data: chunks, error } = await supabase
    .from('material_chunks')
    .select('chunk_text')
    .eq('course_code', courseCode)
    .order('chunk_index', { ascending: true })
    .limit(80);

  if (error || !chunks || chunks.length === 0) {
    throw new HttpError(404, 'No indexed chunks found for this course');
  }

  const combinedText = (chunks as Array<{ chunk_text: string }>)
    .map((c) => c.chunk_text)
    .join('\n\n')
    .slice(0, 30_000);

  const extracted = await extractAndSaveOutline(courseCode, combinedText);
  if (!extracted || extracted.chapters.length === 0) {
    throw new HttpError(500, 'AI outline extraction failed. Check Gemini quota.');
  }

  res.json({
    chapters: extracted.chapters,
    synopsis: extracted.synopsis,
    learningOutcomes: extracted.learningOutcomes,
    source: 'ai',
  });
}

export async function getCourses(_req: Request, res: Response): Promise<void> {
  const courses = await listMiniCourses();
  res.json({ courses });
}
