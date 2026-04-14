import type {
  CourseAnalytics,
  CoursePreview,
  CourseSummary,
  GenerationOptions,
  Material,
  PublicCourse,
  QuizSubmissionResult,
  SourceCitation,
} from '../types';
import { API_BASE_URL, http } from './http';

export const apiService = {
  async getAvailableCourses() {
    const { data } = await http.get<{ courses: Array<{ code: string; name: string }> }>(
      '/api/courses/available',
    );
    return data;
  },

  async getCourseTopics(courseCode: string) {
    const { data } = await http.get<{
      chapters: Array<{ chapter: string; topics: string[] }>;
      synopsis?: string;
      learningOutcomes?: string[];
      source: 'ai' | 'stored' | 'fallback' | 'empty';
    }>(`/api/courses/${encodeURIComponent(courseCode)}/topics`);
    return data;
  },

  async previewCourse(payload: {
    courseCode: string;
    topics: string[];
    questionCount: number;
    options?: GenerationOptions;
  }) {
    const { data } = await http.post<{ preview: CoursePreview }>('/api/courses/preview', payload);
    return data;
  },

  async confirmCourse(payload: {
    title: string;
    courseCode: string;
    topics: string[];
    lesson: string;
    questions: Array<{ prompt: string; options: string[]; correct: number }>;
    sources: SourceCitation[];
    lecturerName?: string;
  }) {
    const { data } = await http.post<{ course: CourseSummary }>('/api/courses/confirm', payload);
    return data;
  },

  async reindexCourseOutline(courseCode: string) {
    const { data } = await http.post<{
      chapters: Array<{ chapter: string; topics: string[] }>;
      source: 'ai';
    }>(`/api/courses/${encodeURIComponent(courseCode)}/reindex-outline`);
    return data;
  },

  async getCourses() {
    const { data } = await http.get<{ courses: CourseSummary[] }>('/api/courses');
    return data;
  },

  async getPublicCourse(token: string) {
    const { data } = await http.get<{ course: PublicCourse }>(
      `/api/public/course/${encodeURIComponent(token)}`,
    );
    return data;
  },

  async submitQuiz(
    token: string,
    payload: { studentName: string; answers: Array<{ questionId: string; selectedOptionIndex: number }> },
  ) {
    const { data } = await http.post<QuizSubmissionResult>(
      `/api/public/course/${encodeURIComponent(token)}/submit`,
      payload,
    );
    return data;
  },

  async getAnalytics(courseId: string) {
    const { data } = await http.get<CourseAnalytics>(
      `/api/analytics/${encodeURIComponent(courseId)}`,
    );
    return data;
  },

  async getMaterials(courseCode?: string) {
    const { data } = await http.get<{ materials: Material[] }>('/api/materials', {
      params: courseCode ? { courseCode } : undefined,
    });
    return data;
  },

  async uploadMaterial(payload: { file: File; courseCode: string; topic?: string }) {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('courseCode', payload.courseCode);
    if (payload.topic) formData.append('topic', payload.topic);

    const { data } = await http.post<{ material: Material }>('/api/materials/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async uploadMaterialAdvanced(payload: {
    file: File;
    courseCode: string;
    materialType: 'course_info' | 'slide';
    chapter?: string;
    fileName?: string;
    chapterItemLabel?: string;
    onDuplicate?: 'error' | 'replace';
    relativePath?: string;
  }) {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('courseCode', payload.courseCode);
    formData.append('materialType', payload.materialType);
    if (payload.chapter) formData.append('chapter', payload.chapter);
    if (payload.fileName) formData.append('fileName', payload.fileName);
    if (payload.chapterItemLabel) formData.append('chapterItemLabel', payload.chapterItemLabel);
    if (payload.onDuplicate) formData.append('onDuplicate', payload.onDuplicate);
    if (payload.relativePath) formData.append('relativePath', payload.relativePath);

    const { data } = await http.post<{ material: Material }>('/api/materials/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteMaterial(materialId: string) {
    const { data } = await http.delete<{ success: boolean }>(
      `/api/materials/${encodeURIComponent(materialId)}`,
    );
    return data;
  },

  async deleteCourseMaterials(courseCode: string) {
    const { data } = await http.delete<{ success: boolean; deleted: number }>(
      `/api/materials/course/${encodeURIComponent(courseCode)}`,
    );
    return data;
  },

  async deleteChapterMaterials(courseCode: string, chapter: string) {
    const { data } = await http.delete<{ success: boolean; deleted: number }>(
      `/api/materials/course/${encodeURIComponent(courseCode)}/chapter`,
      { params: { chapter } },
    );
    return data;
  },

  async updateMaterial(
    materialId: string,
    payload: { fileName?: string; materialType?: 'course_info' | 'slide'; chapter?: string; topic?: string },
  ) {
    const { data } = await http.patch<{ material: Material; warning?: string }>(
      `/api/materials/${encodeURIComponent(materialId)}`,
      payload,
    );
    return data;
  },
};

export { API_BASE_URL };
