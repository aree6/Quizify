import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.js';
import { healthCheck } from '../controllers/health.controller.js';
import {
  deleteChapterMaterials,
  deleteCourseMaterials,
  deleteMaterial,
  listMaterials,
  patchMaterial,
  reindexMaterial,
  repairIndex,
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
import { publicCourse, submitQuiz, practiceWeakTopics } from '../controllers/public.controller.js';
import { analytics } from '../controllers/analytics.controller.js';
import { studentAttempts, studentAttemptDetail } from '../controllers/students.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
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
router.post('/api/materials/:id/reindex', requireAuth, asyncHandler(reindexMaterial));
router.post('/api/materials/repair', requireAuth, asyncHandler(repairIndex));

// Courses (require auth)
router.get('/api/courses', requireAuth, asyncHandler(getCourses));
router.get('/api/courses/available', requireAuth, asyncHandler(getAvailableCourses));
router.get('/api/courses/:courseCode/topics', requireAuth, asyncHandler(getCourseTopics));
router.post('/api/courses/:courseCode/reindex-outline', requireAuth, asyncHandler(reindexOutline));
router.post('/api/courses/preview', requireAuth, asyncHandler(previewCourse));
router.post('/api/courses/confirm', requireAuth, asyncHandler(confirmCourse));
router.delete('/api/courses/:id', requireAuth, asyncHandler(deleteCourse));

// Public read (lesson); quiz submission requires the student to be signed in
// so the attempt is always associated with their account.
router.get('/api/public/course/:token', asyncHandler(publicCourse));
router.post('/api/public/course/:token/submit', requireAuth, asyncHandler(submitQuiz));
router.post('/api/public/course/:token/practice', requireAuth, asyncHandler(practiceWeakTopics));

// Student history (requires auth)
router.get('/api/students/attempts', requireAuth, asyncHandler(studentAttempts));
router.get('/api/students/attempts/:attemptId', requireAuth, asyncHandler(studentAttemptDetail));

// Analytics
router.get('/api/analytics/:courseId', requireAuth, asyncHandler(analytics));
