import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../middleware/error-handler.js';
import { pathParam } from '../middleware/async-handler.js';
import { ingestMaterial } from '../services/rag.service.js';
import {
  buildStoragePath,
  deleteMaterials,
  ensureSupportedExtension,
  findExistingMaterialForUpload,
  getMaterialById,
  insertMaterial,
  moveFileInStorage,
  removeFileFromStorage,
  selectMaterials,
  softReplaceMaterial,
  updateMaterialRow,
  uploadFileToStorage,
} from '../services/materials.service.js';
import type { MaterialType } from '../types/index.js';

const SUPPORTED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export async function listMaterials(req: Request, res: Response): Promise<void> {
  const courseCode = typeof req.query.courseCode === 'string' ? req.query.courseCode : null;
  const materials = await selectMaterials({ courseCode });
  res.json({ materials });
}

export async function uploadMaterial(req: Request, res: Response): Promise<void> {
  const file = req.file;
  const courseCode = String(req.body.courseCode ?? '').trim().toUpperCase();
  const materialType: MaterialType = req.body.materialType === 'course_info' ? 'course_info' : 'slide';
  const chapter = typeof req.body.chapter === 'string' ? req.body.chapter.trim() || null : null;
  const requestedFileName = typeof req.body.fileName === 'string' ? req.body.fileName.trim() : '';
  const chapterItemLabelInput = typeof req.body.chapterItemLabel === 'string' ? req.body.chapterItemLabel.trim() : '';
  const onDuplicate = req.body.onDuplicate === 'replace' ? 'replace' : 'error';

  if (!courseCode) throw new HttpError(400, 'courseCode is required');
  if (!file) throw new HttpError(400, 'File is required');
  if (materialType === 'slide' && !chapter) throw new HttpError(400, 'chapter is required for slide material');

  const lower = file.originalname.toLowerCase();
  const hasSupportedExtension = lower.endsWith('.pdf') || lower.endsWith('.pptx');
  if (!SUPPORTED_MIMES.includes(file.mimetype) && !hasSupportedExtension) {
    throw new HttpError(400, 'Only PDF and PPTX files are supported for RAG');
  }

  const normalizedFileName = ensureSupportedExtension(requestedFileName, file.originalname);
  const normalizedChapterItemLabel = materialType === 'slide' ? chapterItemLabelInput || '1.0' : null;
  const storagePath = buildStoragePath({
    courseCode,
    materialType,
    chapter,
    fileName: normalizedFileName,
    chapterItemLabel: normalizedChapterItemLabel,
  });

  // Duplicate handling
  const existing = await findExistingMaterialForUpload({
    courseCode,
    materialType,
    chapter,
    chapterItemLabel: normalizedChapterItemLabel,
  });

  if (existing) {
    if (onDuplicate !== 'replace') {
      throw new HttpError(409, 'Duplicate material exists', {
        details:
          materialType === 'course_info'
            ? `Course information already exists for ${courseCode}`
            : `Material already exists for ${courseCode} • ${chapter} • ${normalizedChapterItemLabel}`,
        hint: 'Choose Replace to overwrite existing material, or Skip to keep existing one.',
      });
    }
    await softReplaceMaterial(existing);
  }

  const materialId = await insertMaterial({
    course_code: courseCode,
    material_type: materialType,
    chapter,
    chapter_item_label: normalizedChapterItemLabel,
    file_name: normalizedFileName,
    storage_path: storagePath,
    mime_type: file.mimetype,
    file_size: file.size,
    status: 'Processing',
  });

  const material = await getMaterialById(materialId);

  try {
    await uploadFileToStorage(storagePath, file.buffer, file.mimetype);
  } catch (err) {
    await supabase
      .from('materials')
      .update({ status: 'Failed', error_message: 'Storage upload failed', updated_at: new Date().toISOString() })
      .eq('id', materialId);
    throw err;
  }

  try {
    const result = await ingestMaterial({
      materialId,
      courseCode,
      chapter,
      materialType,
      fileName: normalizedFileName,
      mimeType: file.mimetype,
      storagePath,
      buffer: file.buffer,
    });

    res.status(201).json({
      material: { ...material, status: 'Active', chunk_count: result.chunkCount },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'RAG processing failed';
    await supabase
      .from('materials')
      .update({ status: 'Failed', error_message: message, updated_at: new Date().toISOString() })
      .eq('id', materialId);
    throw new HttpError(500, message);
  }
}

export async function patchMaterial(req: Request, res: Response): Promise<void> {
  const id = pathParam(req.params.id);
  if (!id) throw new HttpError(400, 'id is required');

  const requestedFileName = typeof req.body.fileName === 'string' ? req.body.fileName.trim() : undefined;
  const requestedType: MaterialType | undefined =
    req.body.materialType === 'course_info' || req.body.materialType === 'slide' ? req.body.materialType : undefined;
  const requestedChapter = typeof req.body.chapter === 'string' ? req.body.chapter.trim() : undefined;
  const requestedChapterItemLabel =
    typeof req.body.chapterItemLabel === 'string' ? req.body.chapterItemLabel.trim() : undefined;

  const material = await getMaterialById(id);

  const nextType: MaterialType = requestedType ?? (material.material_type || 'slide');
  const nextChapter =
    nextType === 'slide' ? (requestedChapter === undefined ? material.chapter : requestedChapter || null) : null;
  const nextChapterItemLabel =
    nextType === 'slide'
      ? requestedChapterItemLabel === undefined
        ? material.chapter_item_label
        : requestedChapterItemLabel || null
      : null;
  const nextFileName = requestedFileName
    ? ensureSupportedExtension(requestedFileName, material.file_name)
    : material.file_name;

  const shouldMoveFile =
    nextType !== material.material_type ||
    (nextChapter ?? null) !== (material.chapter ?? null) ||
    (nextChapterItemLabel ?? null) !== (material.chapter_item_label ?? null) ||
    nextFileName !== material.file_name;

  const nextStoragePath = shouldMoveFile
    ? buildStoragePath({
        courseCode: material.course_code,
        materialType: nextType,
        chapter: nextChapter,
        fileName: nextFileName,
        chapterItemLabel: nextChapterItemLabel,
      })
    : material.storage_path;

  if (shouldMoveFile && material.storage_path !== nextStoragePath) {
    await moveFileInStorage(material.storage_path, nextStoragePath);
  }

  await updateMaterialRow(id, {
    file_name: nextFileName,
    material_type: nextType,
    chapter: nextChapter,
    chapter_item_label: nextChapterItemLabel,
    storage_path: nextStoragePath,
    updated_at: new Date().toISOString(),
  });

  await supabase
    .from('material_chunks')
    .update({ source_file: nextFileName, chapter: nextChapter })
    .eq('material_id', id);

  const updated = await getMaterialById(id);
  res.json({ material: updated });
}

export async function deleteMaterial(req: Request, res: Response): Promise<void> {
  const id = pathParam(req.params.id);
  if (!id) throw new HttpError(400, 'id is required');

  const { data, error } = await supabase
    .from('materials')
    .select('id, storage_path, status')
    .eq('id', id)
    .single();

  if (error || !data) throw new HttpError(404, 'Material not found');

  await removeFileFromStorage(data.storage_path);
  await supabase.from('material_chunks').delete().eq('material_id', id);
  await supabase
    .from('materials')
    .update({ status: 'Deleted', updated_at: new Date().toISOString() })
    .eq('id', id);

  res.json({ success: true });
}

export async function deleteCourseMaterials(req: Request, res: Response): Promise<void> {
  const courseCode = pathParam(req.params.courseCode).trim().toUpperCase();
  if (!courseCode) throw new HttpError(400, 'courseCode is required');

  const { data, error } = await supabase
    .from('materials')
    .select('id, storage_path')
    .eq('course_code', courseCode)
    .neq('status', 'Deleted');

  if (error) throw new HttpError(500, 'Failed to fetch course materials', { details: error.message });

  const rows = (data ?? []) as Array<{ id: string; storage_path: string }>;
  await deleteMaterials(rows);
  res.json({ success: true, deleted: rows.length });
}

export async function deleteChapterMaterials(req: Request, res: Response): Promise<void> {
  const courseCode = pathParam(req.params.courseCode).trim().toUpperCase();
  const chapter = typeof req.query.chapter === 'string' ? req.query.chapter.trim() : '';
  if (!courseCode || !chapter) throw new HttpError(400, 'courseCode and chapter are required');

  const { data, error } = await supabase
    .from('materials')
    .select('id, storage_path')
    .eq('course_code', courseCode)
    .eq('chapter', chapter)
    .neq('status', 'Deleted');

  if (error) throw new HttpError(500, 'Failed to fetch chapter materials', { details: error.message });

  const rows = (data ?? []) as Array<{ id: string; storage_path: string }>;
  await deleteMaterials(rows);
  res.json({ success: true, deleted: rows.length });
}
