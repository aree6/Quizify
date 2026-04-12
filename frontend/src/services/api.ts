import type {
  CourseAnalytics,
  CourseSummary,
  PublicCourse,
  QuizSubmissionResult,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }
  return data as T;
}

export const apiService = {
  async generateCourse(payload: {
    title: string;
    courseCode: string;
    topics: string[];
    questionCount: number;
    passPercentage: number;
    lecturerName?: string;
    expiresAt?: string | null;
  }) {
    return request<{ course: CourseSummary }>('/api/courses/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getCourses() {
    return request<{ courses: CourseSummary[] }>('/api/courses');
  },

  async getPublicCourse(token: string) {
    return request<{ course: PublicCourse }>(`/api/public/course/${encodeURIComponent(token)}`);
  },

  async submitQuiz(
    token: string,
    payload: { studentName: string; answers: Array<{ questionId: string; selectedOptionIndex: number }> },
  ) {
    return request<QuizSubmissionResult>(`/api/public/course/${encodeURIComponent(token)}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getAnalytics(courseId: string) {
    return request<CourseAnalytics>(`/api/analytics/${encodeURIComponent(courseId)}`);
  },
};

export { API_BASE_URL };
