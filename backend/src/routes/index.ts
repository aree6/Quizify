import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../middleware/async-handler.js';
import { healthCheck } from '../controllers/health.controller.js';
import {
  deleteChapterMaterials,
  deleteCourseMaterials,
  deleteMaterial,
  listMaterials,
  patchMaterial,
  uploadMaterial,
} from '../controllers/materials.controller.js';
import {
  confirmCourse,
  getAvailableCourses,
  getCourses,
  getCourseTopics,
  previewCourse,
  reindexOutline,
} from '../controllers/courses.controller.js';
import { publicCourse, submitQuiz } from '../controllers/public.controller.js';
import { analytics } from '../controllers/analytics.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

export const router = Router();

// Health
router.get('/health', healthCheck);

// Materials
router.get('/api/materials', asyncHandler(listMaterials));
router.post('/api/materials/upload', upload.single('file'), asyncHandler(uploadMaterial));
router.patch('/api/materials/:id', asyncHandler(patchMaterial));
router.delete('/api/materials/:id', asyncHandler(deleteMaterial));
router.delete('/api/materials/course/:courseCode', asyncHandler(deleteCourseMaterials));
router.delete('/api/materials/course/:courseCode/chapter', asyncHandler(deleteChapterMaterials));

// Courses
router.get('/api/courses', asyncHandler(getCourses));
router.get('/api/courses/available', asyncHandler(getAvailableCourses));
router.get('/api/courses/:courseCode/topics', asyncHandler(getCourseTopics));
router.post('/api/courses/:courseCode/reindex-outline', asyncHandler(reindexOutline));
router.post('/api/courses/preview', asyncHandler(previewCourse));
router.post('/api/courses/confirm', asyncHandler(confirmCourse));

// Public (student-facing)
router.get('/api/public/course/:token', asyncHandler(publicCourse));
router.post('/api/public/course/:token/submit', asyncHandler(submitQuiz));

// Analytics
router.get('/api/analytics/:courseId', asyncHandler(analytics));
