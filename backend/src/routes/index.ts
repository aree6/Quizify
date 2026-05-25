import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../middleware/async-handler.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
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
  deleteCourse,
  getAvailableCourses,
  getCourses,
  getCourseTopics,
  previewCourse,
  reindexOutline,
} from '../controllers/courses.controller.js';
import { publicCourse, submitQuiz } from '../controllers/public.controller.js';
import { analytics } from '../controllers/analytics.controller.js';
import { studentAttempts } from '../controllers/students.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

export const router = Router();

// Health
router.get('/health', healthCheck);

// Materials (require auth)
router.get('/api/materials', requireAuth, asyncHandler(listMaterials));
router.post('/api/materials/upload', requireAuth, upload.single('file'), asyncHandler(uploadMaterial));
router.patch('/api/materials/:id', requireAuth, asyncHandler(patchMaterial));
router.delete('/api/materials/:id', requireAuth, asyncHandler(deleteMaterial));
router.delete('/api/materials/course/:courseCode', requireAuth, asyncHandler(deleteCourseMaterials));
router.delete('/api/materials/course/:courseCode/chapter', requireAuth, asyncHandler(deleteChapterMaterials));

// Courses (require auth)
router.get('/api/courses', requireAuth, asyncHandler(getCourses));
router.get('/api/courses/available', requireAuth, asyncHandler(getAvailableCourses));
router.get('/api/courses/:courseCode/topics', requireAuth, asyncHandler(getCourseTopics));
router.post('/api/courses/:courseCode/reindex-outline', requireAuth, asyncHandler(reindexOutline));
router.post('/api/courses/preview', requireAuth, asyncHandler(previewCourse));
router.post('/api/courses/confirm', requireAuth, asyncHandler(confirmCourse));
router.delete('/api/courses/:id', requireAuth, asyncHandler(deleteCourse));

// Public (student-facing, with optional auth for identity linking)
router.get('/api/public/course/:token', asyncHandler(publicCourse));
router.post('/api/public/course/:token/submit', optionalAuth, asyncHandler(submitQuiz));

// Student history (requires auth)
router.get('/api/students/attempts', requireAuth, asyncHandler(studentAttempts));

// Analytics
router.get('/api/analytics/:courseId', requireAuth, asyncHandler(analytics));
