export interface User {
  userId: string;
  name: string;
  email: string;
  role: 'Lecturer' | 'Admin' | 'Student';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: 'Lecturer' | 'Admin' | 'Student';
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CourseSummary {
  id: string;
  title: string;
  courseCode: string;
  topics: string[];
  status: 'Generating' | 'Ready' | 'Shared';
  questionCount: number;
  attempts: number;
  shareToken: string;
  shareUrl: string;
  createdAt: string;
  generationSource?: 'RAG+LLM' | 'RAG-only' | 'Fallback';
  contextChunksUsed?: number;
}

export interface Material {
  id: string;
  course_code: string;
  topic: string | null;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number;
  chunk_count: number;
  status: 'Processing' | 'Active' | 'Failed' | 'Deleted';
  error_message: string | null;
  uploaded_at: string;
  updated_at: string;
}

export interface PublicQuestion {
  id: string;
  prompt: string;
  options: string[];
}

export interface PublicCourse {
  id: string;
  title: string;
  lessonContent: string;
  quizTitle: string;
  passPercentage: number;
  questions: PublicQuestion[];
}

export interface SubmissionAnswer {
  questionId: string;
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
}

export interface QuizSubmissionResult {
  attemptId: string;
  submittedAt: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  passPercentage: number;
  answers: SubmissionAnswer[];
}

export interface AnalyticsSubmission {
  id: string;
  studentName: string;
  score: number;
  total: number;
  percentage: number;
  submittedAt: string;
}

export interface CourseAnalytics {
  totalSubmissions: number;
  averageScore: number;
  passRate: number;
  submissions: AnalyticsSubmission[];
}
