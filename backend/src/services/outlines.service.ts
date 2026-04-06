/**
 * Course outline persistence — stores/reads structured chapter+topic JSON
 * in Supabase Storage so no schema migration is needed.
 */
import { supabase } from '../lib/supabase.js';
import { env } from '../config/env.js';
import { extractCourseTopics } from './ai.service.js';
import type { ChapterOutline, CourseOutline } from '../types/index.js';

const BUCKET = env.supabase.storageBucket;
const OUTLINE_PREFIX = '_outlines';

function outlinePath(courseCode: string): string {
  return `${OUTLINE_PREFIX}/${courseCode.toUpperCase()}.json`;
}

export async function getStoredOutline(courseCode: string): Promise<CourseOutline | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(outlinePath(courseCode));
  if (error || !data) return null;

  try {
    const text = await data.text();
    const parsed = JSON.parse(text) as CourseOutline;
    return Array.isArray(parsed.chapters) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveOutline(courseCode: string, chapters: ChapterOutline[]): Promise<boolean> {
  const body = JSON.stringify({ chapters, updatedAt: new Date().toISOString() } satisfies CourseOutline);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(outlinePath(courseCode), body, { contentType: 'application/json', upsert: true });

  if (error) console.error(`[outlines] Failed to save outline for ${courseCode}:`, error.message);
  return !error;
}

export async function extractAndSaveOutline(
  courseCode: string,
  materialText: string,
): Promise<ChapterOutline[] | null> {
  const chapters = await extractCourseTopics(materialText);
  if (!chapters || chapters.length === 0) {
    console.warn(`[outlines] AI extraction returned no chapters for ${courseCode}`);
    return null;
  }

  await saveOutline(courseCode, chapters);
  return chapters;
}
