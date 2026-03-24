import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { supabase } from './lib/supabase.js';
import { generateFallbackContent } from './data/fallbackContent.js';
import { normalizePassPercentage, randomToken, toSlug } from './lib/utils.js';
import { generateLessonAndQuiz, isAiConfigured, embeddingModel, generationModel, aiProvider } from './lib/ai.js';
import { ingestMaterial, retrieveRelevantChunks } from './lib/rag.js';
import { getCourseDisplayName, findCourseByCode } from './constants/courses.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const port = process.env.PORT || 3001;
const defaultPassPercentage = normalizePassPercentage(process.env.DEFAULT_PASS_PERCENTAGE, 70);
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'course-materials';
const materialSelectProfile =
  'id, course_code, material_type, chapter, chapter_item_label, file_name, storage_path, mime_type, file_size, chunk_count, status, error_message, uploaded_at, updated_at';

function isRlsViolation(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('row-level security policy') || message.includes('new row violates row-level security');
}

function materialsWriteHint(error) {
  if (isRlsViolation(error)) {
    return 'RLS blocked write on materials. Use Supabase service_role key (not publishable/anon key) in backend env and keep bucket policy for service_role.';
  }
  return 'Database write failed. Check that materials table has all required columns.';
}

function withMaterialDefaults(row) {
  return {
    chapter_item_label: null,
    error_message: null,
    updated_at: row?.uploaded_at || new Date().toISOString(),
    ...row,
  };
}

function sanitizeSegment(value, fallback = 'uncategorized') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '-')
    .replace(/-+/g, '-');
  return normalized || fallback;
}

function sanitizeFileName(fileName) {
  const cleaned = String(fileName || '')
    .trim()
    .replace(/[/\\]/g, '-')
    .replace(/[^a-zA-Z0-9_. -]/g, '_');
  return cleaned || 'material';
}

function ensureSupportedExtension(fileName, originalName) {
  const normalized = String(fileName || '').trim();
  if (!normalized) return originalName;
  if (/\.(pdf|pptx)$/i.test(normalized)) return normalized;
  const extension = originalName.match(/\.(pdf|pptx)$/i)?.[0] || '';
  return `${normalized}${extension}`;
}

function buildStoragePath({ courseCode, materialType, chapter, fileName, chapterItemLabel }) {
  const course = findCourseByCode(courseCode);
  const courseName = course ? course.name : 'unknown-course';
  const safeCourse = sanitizeSegment(`${courseName}-${courseCode}`, 'course');
  const safeType = sanitizeSegment(materialType, 'slide');

  if (safeType === 'course_info') {
    const safeName = sanitizeFileName(fileName);
    return `${safeCourse}/course-info/${Date.now()}-${safeName}`;
  }

  const chapterSegment = sanitizeSegment(chapter || 'unassigned-chapter');
  const itemSegment = safeType === 'slide' && chapterItemLabel ? sanitizeSegment(chapterItemLabel, 'item') : null;
  const safeName = sanitizeFileName(fileName);

  if (itemSegment) {
    return `${safeCourse}/${safeType}/${chapterSegment}/${itemSegment}/${Date.now()}-${safeName}`;
  }
  return `${safeCourse}/${safeType}/${chapterSegment}/${Date.now()}-${safeName}`;
}

async function selectMaterials({ courseCode, id, includeDeleted = false } = {}) {
  let query = supabase.from('materials').select(materialSelectProfile);

  if (id) {
    query = query.eq('id', id).limit(1);
  }

  if (courseCode) {
    query = query.eq('course_code', courseCode);
  }

  if (!includeDeleted) {
    query = query.neq('status', 'Deleted');
  }

  query = query.order('uploaded_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    return { data: null, error };
  }

  return { data: (data || []).map(withMaterialDefaults), error: null };
}

async function getMaterialById(id) {
  const { data, error } = await selectMaterials({ id, includeDeleted: true });
  if (error) return { material: null, error };
  return { material: data?.[0] || null, error: null };
}

async function insertMaterial(payload) {
  const { data, error } = await supabase.from('materials').insert(payload).select('id').single();
  if (error) return { id: null, error };
  return { id: data?.id, error: null };
}

async function updateMaterial(id, payload) {
  const { error } = await supabase.from('materials').update(payload).eq('id', id);
  if (error) return { error };
  return { error: null };
}

async function findExistingMaterialForUpload({ courseCode, materialType, chapter, chapterItemLabel }) {
  let query = supabase
    .from('materials')
    .select('id, course_code, material_type, chapter, chapter_item_label, file_name, storage_path, status')
    .eq('course_code', courseCode)
    .eq('material_type', materialType)
    .neq('status', 'Deleted');

  if (materialType === 'course_info') {
    query = query.limit(1);
  } else {
    query = query
      .eq('chapter', chapter)
      .eq('chapter_item_label', chapterItemLabel)
      .limit(1);
  }

  const { data, error } = await query.maybeSingle();
  if (error) return { existing: null, error };
  return { existing: data || null, error: null };
}

async function softReplaceMaterial(existingMaterial) {
  await supabase.storage.from(storageBucket).remove([existingMaterial.storage_path]);
  await supabase.from('material_chunks').delete().eq('material_id', existingMaterial.id);
  await supabase
    .from('materials')
    .update({ status: 'Deleted', updated_at: new Date().toISOString() })
    .eq('id', existingMaterial.id);
}

async function deleteMaterials(materials) {
  if (!Array.isArray(materials) || materials.length === 0) return;

  const ids = materials.map((item) => item.id);
  const paths = materials.map((item) => item.storage_path).filter(Boolean);

  if (paths.length > 0) {
    await supabase.storage.from(storageBucket).remove(paths);
  }

  await supabase.from('material_chunks').delete().in('material_id', ids);
  await supabase
    .from('materials')
    .update({ status: 'Deleted', updated_at: new Date().toISOString() })
    .in('id', ids);
}

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'quizify-backend',
    rag: {
      aiConfigured: isAiConfigured(),
      aiProvider,
      embeddingModel,
      generationModel,
      storageBucket,
    },
  });
});

app.get('/api/materials', async (req, res) => {
  const courseCode = typeof req.query.courseCode === 'string' ? req.query.courseCode : null;

  const { data, error } = await selectMaterials({ courseCode });
  if (error) {
    return res.status(500).json({ message: 'Failed to fetch materials' });
  }

  return res.json({ materials: data || [] });
});

app.post('/api/materials/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const courseCode = typeof req.body.courseCode === 'string' ? req.body.courseCode.trim().toUpperCase() : '';
  const materialType = req.body.materialType === 'course_info' ? 'course_info' : 'slide';
  const chapter = typeof req.body.chapter === 'string' ? req.body.chapter.trim() || null : null;
  const requestedFileName = typeof req.body.fileName === 'string' ? req.body.fileName.trim() : '';
  const chapterItemLabel = typeof req.body.chapterItemLabel === 'string' ? req.body.chapterItemLabel.trim() : '';
  const onDuplicate = req.body.onDuplicate === 'replace' ? 'replace' : 'error';

  if (!courseCode) {
    return res.status(400).json({ message: 'courseCode is required' });
  }

  if (!file) {
    return res.status(400).json({ message: 'File is required' });
  }

  if (materialType === 'slide' && !chapter) {
    return res.status(400).json({ message: 'chapter is required for slide material' });
  }

  const supportedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];
  const lowerName = file.originalname.toLowerCase();
  const isSupportedName = lowerName.endsWith('.pdf') || lowerName.endsWith('.pptx');
  if (!supportedMimeTypes.includes(file.mimetype) && !isSupportedName) {
    return res.status(400).json({ message: 'Only PDF and PPTX files are supported for RAG' });
  }

  const normalizedFileName = ensureSupportedExtension(requestedFileName, file.originalname);
  const normalizedChapterItemLabel = materialType === 'slide' ? chapterItemLabel || '1.0' : null;
  const storagePath = buildStoragePath({
    courseCode,
    materialType,
    chapter,
    fileName: normalizedFileName,
    chapterItemLabel: normalizedChapterItemLabel,
  });

  const { existing: existingMaterial, error: existingLookupError } = await findExistingMaterialForUpload({
    courseCode,
    materialType,
    chapter,
    chapterItemLabel: normalizedChapterItemLabel,
  });

  if (existingLookupError) {
    return res.status(500).json({ message: 'Failed to validate duplicate material', details: existingLookupError.message });
  }

  if (existingMaterial) {
    if (onDuplicate !== 'replace') {
      return res.status(409).json({
        message: 'Duplicate material exists',
        details:
          materialType === 'course_info'
            ? `Course information already exists for ${courseCode}`
            : `Material already exists for ${courseCode} • ${chapter} • ${normalizedChapterItemLabel}`,
        duplicate: {
          id: existingMaterial.id,
          file_name: existingMaterial.file_name,
          chapter: existingMaterial.chapter,
          chapter_item_label: existingMaterial.chapter_item_label,
        },
        hint: 'Choose Replace to overwrite existing material, or Skip to keep existing one.',
      });
    }

    await softReplaceMaterial(existingMaterial);
  }

  const { id: materialId, error: insertMaterialError } = await insertMaterial({
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

  if (insertMaterialError || !materialId) {
    return res.status(500).json({
      message: 'Failed to register material',
      details: insertMaterialError?.message || 'Unknown database error',
      hint: materialsWriteHint(insertMaterialError),
    });
  }

  const { material, error: materialReadError } = await getMaterialById(materialId);
  if (materialReadError || !material) {
    return res.status(500).json({
      message: 'Material registered but could not be read back',
      details: materialReadError?.message || 'Unknown database error',
    });
  }

  const { error: storageError } = await supabase.storage
    .from(storageBucket)
    .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: true });

  if (storageError) {
    await supabase
      .from('materials')
      .update({ status: 'Failed', error_message: 'Storage upload failed', updated_at: new Date().toISOString() })
      .eq('id', materialId);
    return res.status(500).json({ message: 'Failed to upload file to storage', details: storageError.message });
  }

  try {
    const ingestResult = await ingestMaterial({
      materialId,
      courseCode,
      chapter,
      fileName: normalizedFileName,
      mimeType: file.mimetype,
      storagePath,
      buffer: file.buffer,
    });

    return res.status(201).json({
      material: {
        ...material,
        status: 'Active',
        chunk_count: ingestResult.chunkCount,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'RAG processing failed';
    await supabase
      .from('materials')
      .update({
        status: 'Failed',
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', materialId);

    return res.status(500).json({ message });
  }
});

app.patch('/api/materials/:id', async (req, res) => {
  const { id } = req.params;
  const requestedFileName = typeof req.body.fileName === 'string' ? req.body.fileName.trim() : undefined;
  const requestedType = req.body.materialType === 'course_info' || req.body.materialType === 'slide' ? req.body.materialType : undefined;
  const requestedChapter = typeof req.body.chapter === 'string' ? req.body.chapter.trim() : undefined;
  const requestedChapterItemLabel = typeof req.body.chapterItemLabel === 'string' ? req.body.chapterItemLabel.trim() : undefined;

  const { material, error: readError } = await getMaterialById(id);
  if (readError || !material) {
    return res.status(404).json({ message: 'Material not found' });
  }

  const nextType = requestedType || material.material_type || 'slide';
  const nextChapter = nextType === 'slide' ? (requestedChapter === undefined ? material.chapter : requestedChapter || null) : null;
  const nextChapterItemLabel = nextType === 'slide' ? (requestedChapterItemLabel === undefined ? material.chapter_item_label : requestedChapterItemLabel || null) : null;
  const nextFileName = requestedFileName ? ensureSupportedExtension(requestedFileName, material.file_name) : material.file_name;

  const shouldMoveFile =
    nextType !== material.material_type ||
    (nextChapter || null) !== (material.chapter || null) ||
    (nextChapterItemLabel || null) !== (material.chapter_item_label || null) ||
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
    const { error: moveError } = await supabase.storage.from(storageBucket).move(material.storage_path, nextStoragePath);
    if (moveError) {
      return res.status(500).json({ message: 'Failed to reorganize material in storage', details: moveError.message });
    }
  }

  const updates = {
    file_name: nextFileName,
    material_type: nextType,
    chapter: nextChapter,
    chapter_item_label: nextChapterItemLabel,
    storage_path: nextStoragePath,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await updateMaterial(id, updates);
  if (updateError) {
    return res.status(500).json({
      message: 'Failed to update material metadata',
      details: updateError.message,
      hint: materialsWriteHint(updateError),
    });
  }

  await supabase
    .from('material_chunks')
    .update({
      source_file: nextFileName,
      chapter: nextChapter,
    })
    .eq('material_id', id);

  const { material: updatedMaterial, error: updatedReadError } = await getMaterialById(id);
  if (updatedReadError || !updatedMaterial) {
    return res.status(500).json({ message: 'Material metadata saved but could not be read back' });
  }

  return res.json({ material: updatedMaterial });
});

app.delete('/api/materials/:id', async (req, res) => {
  const { id } = req.params;
  const { data: material, error } = await supabase
    .from('materials')
    .select('id, storage_path, status')
    .eq('id', id)
    .single();

  if (error || !material) {
    return res.status(404).json({ message: 'Material not found' });
  }

  const { error: storageDeleteError } = await supabase.storage.from(storageBucket).remove([material.storage_path]);
  if (storageDeleteError) {
    return res.status(500).json({ message: 'Failed to delete file from storage' });
  }

  await supabase.from('material_chunks').delete().eq('material_id', id);

  const { error: updateError } = await supabase
    .from('materials')
    .update({ status: 'Deleted', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (updateError) {
    return res.status(500).json({ message: 'Failed to update material status', hint: materialsWriteHint(updateError) });
  }

  return res.json({ success: true });
});

app.delete('/api/materials/course/:courseCode', async (req, res) => {
  const courseCode = String(req.params.courseCode || '').trim().toUpperCase();
  if (!courseCode) {
    return res.status(400).json({ message: 'courseCode is required' });
  }

  const { data, error } = await supabase
    .from('materials')
    .select('id, storage_path')
    .eq('course_code', courseCode)
    .neq('status', 'Deleted');

  if (error) {
    return res.status(500).json({ message: 'Failed to fetch course materials', details: error.message });
  }

  await deleteMaterials(data || []);
  return res.json({ success: true, deleted: (data || []).length });
});

app.delete('/api/materials/course/:courseCode/chapter', async (req, res) => {
  const courseCode = String(req.params.courseCode || '').trim().toUpperCase();
  const chapter = typeof req.query.chapter === 'string' ? req.query.chapter.trim() : '';
  if (!courseCode || !chapter) {
    return res.status(400).json({ message: 'courseCode and chapter are required' });
  }

  const { data, error } = await supabase
    .from('materials')
    .select('id, storage_path')
    .eq('course_code', courseCode)
    .eq('chapter', chapter)
    .neq('status', 'Deleted');

  if (error) {
    return res.status(500).json({ message: 'Failed to fetch chapter materials', details: error.message });
  }

  await deleteMaterials(data || []);
  return res.json({ success: true, deleted: (data || []).length });
});

app.get('/api/public/course/:token', async (req, res) => {
  const { token } = req.params;
  const now = new Date().toISOString();

  const { data: course, error } = await supabase
    .from('mini_courses')
    .select(
      `
      id,
      title,
      lesson_content,
      status,
      expires_at,
      pass_percentage,
      quizzes (
        id,
        title,
        questions (
          id,
          prompt,
          option_a,
          option_b,
          option_c,
          option_d,
          order_index
        )
      )
    `,
    )
    .eq('share_token', token)
    .single();

  if (error || !course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  if (course.status !== 'Ready' && course.status !== 'Shared') {
    return res.status(403).json({ message: 'Course is not available yet' });
  }

  if (course.expires_at && course.expires_at < now) {
    return res.status(410).json({ message: 'Course link expired' });
  }

  const quiz = course.quizzes?.[0];
  const questions = (quiz?.questions || [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean),
    }));

  return res.json({
    course: {
      id: course.id,
      title: course.title,
      lessonContent: course.lesson_content,
      quizTitle: quiz?.title || `${course.title} Quiz`,
      passPercentage: course.pass_percentage || defaultPassPercentage,
      questions,
    },
  });
});

app.post('/api/public/course/:token/submit', async (req, res) => {
  const { token } = req.params;
  const { studentName, answers } = req.body;

  if (!studentName || typeof studentName !== 'string' || studentName.trim().length < 2) {
    return res.status(400).json({ message: 'Student name is required' });
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ message: 'Answers are required' });
  }

  const { data: course, error: courseError } = await supabase
    .from('mini_courses')
    .select('id, status, expires_at, pass_percentage, quizzes(id, questions(id, correct_option_index))')
    .eq('share_token', token)
    .single();

  if (courseError || !course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  if (course.status !== 'Ready' && course.status !== 'Shared') {
    return res.status(403).json({ message: 'Course is not available yet' });
  }

  const now = new Date().toISOString();
  if (course.expires_at && course.expires_at < now) {
    return res.status(410).json({ message: 'Course link expired' });
  }

  const quiz = course.quizzes?.[0];
  if (!quiz) {
    return res.status(400).json({ message: 'Quiz not found for course' });
  }

  const answerMap = new Map(answers.map((item) => [item.questionId, item.selectedOptionIndex]));
  let score = 0;

  const evaluatedAnswers = quiz.questions.map((q) => {
    const selectedOptionIndex = Number(answerMap.get(q.id));
    const isCorrect = Number.isInteger(selectedOptionIndex) && selectedOptionIndex === q.correct_option_index;
    if (isCorrect) score += 1;
    return {
      questionId: q.id,
      selectedOptionIndex,
      correctOptionIndex: q.correct_option_index,
      isCorrect,
    };
  });

  const total = quiz.questions.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passPercentage = course.pass_percentage || defaultPassPercentage;
  const passed = percentage >= passPercentage;

  const { data: attempt, error: insertError } = await supabase
    .from('quiz_attempts')
    .insert({
      mini_course_id: course.id,
      quiz_id: quiz.id,
      student_name: studentName.trim(),
      score,
      total_questions: total,
      percentage,
      submitted_answers: evaluatedAnswers,
    })
    .select('id, submitted_at')
    .single();

  if (insertError) {
    return res.status(500).json({ message: 'Failed to save submission' });
  }

  return res.json({
    attemptId: attempt.id,
    submittedAt: attempt.submitted_at,
    score,
    total,
    percentage,
    passed,
    passPercentage,
    answers: evaluatedAnswers,
  });
});

app.post('/api/courses/generate', async (req, res) => {
  const {
    title,
    courseCode,
    topics = [],
    questionCount = 5,
    passPercentage = defaultPassPercentage,
    lecturerName = 'Lecturer',
    expiresAt = null,
  } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ message: 'Course title is required' });
  }

  if (!courseCode || typeof courseCode !== 'string') {
    return res.status(400).json({ message: 'Course code is required' });
  }

  const normalizedCourseCode = courseCode.trim().toUpperCase();
  const normalizedTopics = Array.isArray(topics) ? topics.map((t) => String(t).trim()).filter(Boolean) : [];
  const sanitizedQuestionCount = Math.min(15, Math.max(5, Number(questionCount) || 5));
  const normalizedPass = normalizePassPercentage(passPercentage, defaultPassPercentage);

  const contextChunks = await retrieveRelevantChunks({
    courseCode: normalizedCourseCode,
    topics: normalizedTopics,
    limit: 12,
  });

  const contextText = contextChunks.join('\n\n');
  let content = null;

  if (contextChunks.length > 0 && isAiConfigured()) {
    content = await generateLessonAndQuiz({
      title,
      topics: normalizedTopics,
      context: contextText,
      questionCount: sanitizedQuestionCount,
    });
  }

  if (!content) {
    content = generateFallbackContent({
      title,
      topics: normalizedTopics,
      questionCount: sanitizedQuestionCount,
    });
  } else if (content.questions.length < sanitizedQuestionCount) {
    const fallbackSupplement = generateFallbackContent({
      title,
      topics: normalizedTopics,
      questionCount: sanitizedQuestionCount,
    });
    content.questions = [...content.questions, ...fallbackSupplement.questions].slice(0, sanitizedQuestionCount);
  }

  let shareToken = `${toSlug(normalizedCourseCode)}-${randomToken(8)}`;
  for (let i = 0; i < 3; i += 1) {
    const { data: exists } = await supabase
      .from('mini_courses')
      .select('id')
      .eq('share_token', shareToken)
      .maybeSingle();
    if (!exists) break;
    shareToken = `${toSlug(normalizedCourseCode)}-${randomToken(8)}`;
  }

  const sourceType = contextChunks.length > 0 ? (isAiConfigured() ? 'RAG+LLM' : 'RAG-only') : 'Fallback';

  const { data: miniCourse, error: courseError } = await supabase
    .from('mini_courses')
    .insert({
      title,
      course_code: normalizedCourseCode,
      topics: normalizedTopics,
      lesson_content: content.lesson,
      status: 'Ready',
      share_token: shareToken,
      pass_percentage: normalizedPass,
      expires_at: expiresAt,
      created_by_name: lecturerName,
    })
    .select('id, title, share_token, status, created_at, pass_percentage, expires_at')
    .single();

  if (courseError || !miniCourse) {
    return res.status(500).json({ message: 'Failed to create mini-course' });
  }

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      mini_course_id: miniCourse.id,
      title: `${title} Quiz`,
      question_count: sanitizedQuestionCount,
    })
    .select('id, title')
    .single();

  if (quizError || !quiz) {
    return res.status(500).json({ message: 'Failed to create quiz' });
  }

  const questionRows = content.questions.map((q, idx) => ({
    quiz_id: quiz.id,
    prompt: q.prompt,
    option_a: q.options[0] || null,
    option_b: q.options[1] || null,
    option_c: q.options[2] || null,
    option_d: q.options[3] || null,
    correct_option_index: q.correct,
    order_index: idx,
  }));

  const { error: questionsError } = await supabase.from('questions').insert(questionRows);
  if (questionsError) {
    return res.status(500).json({ message: 'Failed to create questions' });
  }

  return res.status(201).json({
    course: {
      id: miniCourse.id,
      title: miniCourse.title,
      status: miniCourse.status,
      shareToken: miniCourse.share_token,
      shareUrl: `/quiz?token=${miniCourse.share_token}`,
      createdAt: miniCourse.created_at,
      passPercentage: miniCourse.pass_percentage,
      expiresAt: miniCourse.expires_at,
      generationSource: sourceType,
      contextChunksUsed: contextChunks.length,
    },
  });
});

app.get('/api/courses', async (_req, res) => {
  const { data, error } = await supabase
    .from('mini_courses')
    .select('id, title, course_code, topics, status, share_token, created_at, quizzes(question_count), quiz_attempts(id)')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ message: 'Failed to fetch courses' });
  }

  const courses = (data || []).map((course) => {
    const attemptCount = course.quiz_attempts?.length || 0;
    const questionCount = course.quizzes?.[0]?.question_count || 0;
    return {
      id: course.id,
      title: course.title,
      courseCode: course.course_code,
      topics: course.topics || [],
      status: course.status,
      questionCount,
      attempts: attemptCount,
      shareToken: course.share_token,
      shareUrl: `/quiz?token=${course.share_token}`,
      createdAt: course.created_at,
    };
  });

  return res.json({ courses });
});

app.get('/api/analytics/:courseId', async (req, res) => {
  const { courseId } = req.params;

  const { data: attempts, error } = await supabase
    .from('quiz_attempts')
    .select('id, student_name, score, total_questions, percentage, submitted_at')
    .eq('mini_course_id', courseId)
    .order('submitted_at', { ascending: false });

  if (error) {
    return res.status(500).json({ message: 'Failed to fetch analytics' });
  }

  if (!attempts || attempts.length === 0) {
    return res.json({
      totalSubmissions: 0,
      averageScore: 0,
      passRate: 0,
      submissions: [],
    });
  }

  const totalSubmissions = attempts.length;
  const averageScore = Math.round(
    attempts.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / totalSubmissions,
  );
  const passCount = attempts.filter((item) => Number(item.percentage || 0) >= defaultPassPercentage).length;
  const passRate = Math.round((passCount / totalSubmissions) * 100);

  return res.json({
    totalSubmissions,
    averageScore,
    passRate,
    submissions: attempts.map((item) => ({
      id: item.id,
      studentName: item.student_name,
      score: item.score,
      total: item.total_questions,
      percentage: item.percentage,
      submittedAt: item.submitted_at,
    })),
  });
});

app.listen(port, () => {
  console.log(`Quizify backend running on port ${port}`);
});
