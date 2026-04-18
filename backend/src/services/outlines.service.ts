/**
 * Course outline persistence — stores/reads structured chapter+topic JSON
 * inside the course-info folder in Supabase Storage, keeping it
 * alongside the source course-info files for consistent structure.
 */
import { supabase } from '../lib/supabase.js';
import { env } from '../config/env.js';
import { findCourseByCode } from '../constants/courses.js';
import { extractCourseProfile } from './ai.service.js';
import { sanitizeSegment } from './materials.service.js';
import type { CourseOutline } from '../types/index.js';

const BUCKET = env.supabase.storageBucket;

/** Build the outline path inside the course-info folder for a given course code. */
function outlinePath(courseCode: string): string {
  const course = findCourseByCode(courseCode);
  const courseName = course?.name ?? 'unknown-course';
  const safeCourse = sanitizeSegment(`${courseName}-${courseCode}`, 'course');
  return `${safeCourse}/course-info/outline.json`;
}

export async function getStoredOutline(courseCode: string): Promise<CourseOutline | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(outlinePath(courseCode));
  if (error || !data) return null;

  try {
    const text = await data.text();
    const parsed = JSON.parse(text) as Partial<CourseOutline>;
    if (!Array.isArray(parsed.chapters)) return null;

    // Backfill defaults for older outlines that only had chapters
    return {
      synopsis: typeof parsed.synopsis === 'string' ? parsed.synopsis : '',
      learningOutcomes: Array.isArray(parsed.learningOutcomes) ? parsed.learningOutcomes : [],
      chapters: parsed.chapters,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function saveOutline(
  courseCode: string,
  profile: Omit<CourseOutline, 'updatedAt'>,
): Promise<boolean> {
  const body = JSON.stringify({ ...profile, updatedAt: new Date().toISOString() } satisfies CourseOutline);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(outlinePath(courseCode), body, { contentType: 'application/json', upsert: true });

  if (error) console.error(`[outlines] Failed to save outline for ${courseCode}:`, error.message);
  return !error;
}

export async function extractAndSaveOutline(
  courseCode: string,
  materialText: string,
): Promise<CourseOutline | null> {
  const profile = await extractCourseProfile(materialText);
  if (!profile || profile.chapters.length === 0) {
    console.warn(`[outlines] AI extraction returned no chapters for ${courseCode}`);
    return null;
  }

  await saveOutline(courseCode, profile);
  return { ...profile, updatedAt: new Date().toISOString() };
}
