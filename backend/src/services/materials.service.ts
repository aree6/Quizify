import { supabase } from '../lib/supabase.js';
import { env } from '../config/env.js';
import { findCourseByCode } from '../constants/courses.js';
import { HttpError } from '../middleware/error-handler.js';
import type { MaterialRow, MaterialType } from '../types/index.js';

const STORAGE_BUCKET = env.supabase.storageBucket;

const MATERIAL_SELECT =
  'id, course_code, material_type, chapter, chapter_item_label, file_name, storage_path, mime_type, file_size, chunk_count, status, error_message, uploaded_at, updated_at';

function isRlsViolation(error: { message?: string } | null | undefined): boolean {
  const msg = String(error?.message ?? '').toLowerCase();
  return msg.includes('row-level security policy') || msg.includes('new row violates row-level security');
}

export function materialsWriteHint(error: { message?: string } | null | undefined): string {
  if (isRlsViolation(error)) {
    return 'RLS blocked write on materials. Use Supabase service_role key in backend env.';
  }
  return 'Database write failed. Check that materials table has all required columns.';
}

function withDefaults(row: MaterialRow): MaterialRow {
  return {
    ...row,
    chapter_item_label: row.chapter_item_label ?? null,
    error_message: row.error_message ?? null,
    updated_at: row.updated_at ?? row.uploaded_at ?? new Date().toISOString(),
  };
}

export function sanitizeSegment(value: string | null | undefined, fallback = 'uncategorized'): string {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '-')
    .replace(/-+/g, '-');
  return normalized || fallback;
}

export function sanitizeFileName(fileName: string): string {
  const cleaned = String(fileName ?? '')
    .trim()
    .replace(/[/\\]/g, '-')
    .replace(/[^a-zA-Z0-9_. -]/g, '_');
  return cleaned || 'material';
}

export function ensureSupportedExtension(fileName: string, originalName: string): string {
  const normalized = String(fileName ?? '').trim();
  if (!normalized) return originalName;
  if (/\.(pdf|pptx)$/i.test(normalized)) return normalized;
  const extension = originalName.match(/\.(pdf|pptx)$/i)?.[0] ?? '';
  return `${normalized}${extension}`;
}

export function buildStoragePath(params: {
  courseCode: string;
  materialType: MaterialType;
  chapter: string | null;
  fileName: string;
  chapterItemLabel: string | null;
}): string {
  const course = findCourseByCode(params.courseCode);
  const courseName = course?.name ?? 'unknown-course';
  const safeCourse = sanitizeSegment(`${courseName}-${params.courseCode}`, 'course');
  const safeType = sanitizeSegment(params.materialType, 'slide');
  const safeName = sanitizeFileName(params.fileName);

  if (safeType === 'course_info') {
    return `${safeCourse}/course-info/${Date.now()}-${safeName}`;
  }

  const chapterSegment = sanitizeSegment(params.chapter ?? 'unassigned-chapter');
  const itemSegment =
    safeType === 'slide' && params.chapterItemLabel ? sanitizeSegment(params.chapterItemLabel, 'item') : null;

  return itemSegment
    ? `${safeCourse}/${safeType}/${chapterSegment}/${itemSegment}/${Date.now()}-${safeName}`
    : `${safeCourse}/${safeType}/${chapterSegment}/${Date.now()}-${safeName}`;
}

export async function selectMaterials(params: {
  courseCode?: string | null;
  id?: string;
  includeDeleted?: boolean;
} = {}): Promise<MaterialRow[]> {
  let query = supabase.from('materials').select(MATERIAL_SELECT);

  if (params.id) query = query.eq('id', params.id).limit(1);
  if (params.courseCode) query = query.eq('course_code', params.courseCode);
  if (!params.includeDeleted) query = query.neq('status', 'Deleted');

  query = query.order('uploaded_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw new HttpError(500, 'Failed to fetch materials');

  return (data as MaterialRow[] | null)?.map(withDefaults) ?? [];
}

export async function getMaterialById(id: string): Promise<MaterialRow> {
  const rows = await selectMaterials({ id, includeDeleted: true });
  const material = rows[0];
  if (!material) throw new HttpError(404, 'Material not found');
  return material;
}

export async function insertMaterial(payload: {
  course_code: string;
  material_type: MaterialType;
  chapter: string | null;
  chapter_item_label: string | null;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  status: 'Processing';
}): Promise<string> {
  const { data, error } = await supabase.from('materials').insert(payload).select('id').single();
  if (error || !data) {
    throw new HttpError(500, 'Failed to register material', {
      details: error?.message,
      hint: materialsWriteHint(error),
    });
  }
  return data.id as string;
}

export async function updateMaterialRow(id: string, payload: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('materials').update(payload).eq('id', id);
  if (error) {
    throw new HttpError(500, 'Failed to update material metadata', {
      details: error.message,
      hint: materialsWriteHint(error),
    });
  }
}

export async function findExistingMaterialForUpload(params: {
  courseCode: string;
  materialType: MaterialType;
  chapter: string | null;
  chapterItemLabel: string | null;
}): Promise<MaterialRow | null> {
  let query = supabase
    .from('materials')
    .select('id, course_code, material_type, chapter, chapter_item_label, file_name, storage_path, status')
    .eq('course_code', params.courseCode)
    .eq('material_type', params.materialType)
    .neq('status', 'Deleted');

  if (params.materialType === 'course_info') {
    query = query.limit(1);
  } else {
    query = query.eq('chapter', params.chapter).eq('chapter_item_label', params.chapterItemLabel).limit(1);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new HttpError(500, 'Failed to validate duplicate material', { details: error.message });
  return (data as MaterialRow | null) ?? null;
}

export async function softReplaceMaterial(existing: Pick<MaterialRow, 'id' | 'storage_path'>): Promise<void> {
  await supabase.storage.from(STORAGE_BUCKET).remove([existing.storage_path]);
  await supabase.from('material_chunks').delete().eq('material_id', existing.id);
  await supabase
    .from('materials')
    .update({ status: 'Deleted', updated_at: new Date().toISOString() })
    .eq('id', existing.id);
}

export async function deleteMaterials(rows: Array<Pick<MaterialRow, 'id' | 'storage_path'>>): Promise<void> {
  if (rows.length === 0) return;

  const ids = rows.map((r) => r.id);
  const paths = rows.map((r) => r.storage_path).filter(Boolean);

  if (paths.length > 0) await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  await supabase.from('material_chunks').delete().in('material_id', ids);
  await supabase
    .from('materials')
    .update({ status: 'Deleted', updated_at: new Date().toISOString() })
    .in('id', ids);
}

export async function uploadFileToStorage(path: string, buffer: Buffer, contentType: string): Promise<void> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) throw new HttpError(500, 'Failed to upload file to storage', { details: error.message });
}

export async function moveFileInStorage(from: string, to: string): Promise<void> {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).move(from, to);
  if (error) throw new HttpError(500, 'Failed to reorganize material in storage', { details: error.message });
}

export async function removeFileFromStorage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) throw new HttpError(500, 'Failed to delete file from storage');
}
