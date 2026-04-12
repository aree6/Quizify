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
  generationSource?: 'RAG+LLM' | 'RAG-only';
  contextChunksUsed?: number;
}

export interface Material {
  id: string;
  course_code: string;
  material_type: 'course_info' | 'slide';
  chapter: string | null;
  chapter_item_label: string | null;
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

/**
 * One retrieved chunk surfaced as a citation. `index` is the 1-based marker
 * emitted in the lesson as `[S1]`, `[S2]`, etc.
 */
export interface SourceCitation {
  index: number;
  chunkId: string;
  sourceFile: string;
  chapter: string | null;
  chunkIndex: number;
  similarity: number;
  snippet: string;
  /** Full chunk text shown in the source modal when a `[S#]` marker is clicked. */
  text: string;
}

export interface TopicCoverage {
  topic: string;
  chunkCount: number;
}

/* ─── Pedagogically-grounded generation options (mirrors backend types) ────── */

export type BloomLevel = 'understand' | 'apply' | 'analyze' | 'evaluate';
export type SoloLevel =
  | 'unistructural'
  | 'multistructural'
  | 'relational'
  | 'extended_abstract';
export type LessonLength = 'concise' | 'standard' | 'detailed';

export interface GenerationOptions {
  bloomLevel: BloomLevel;
  soloLevel: SoloLevel;
  lengthLevel: LessonLength;
  customInstructions?: string;
}

export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  bloomLevel: 'understand',
  soloLevel: 'multistructural',
  lengthLevel: 'standard',
  customInstructions: '',
};

export interface CoursePreview {
  title: string;
  courseCode: string;
  courseName: string;
  topics: string[];
  lesson: string;
  questions: Array<{ prompt: string; options: string[]; correct: number }>;
  questionCount: number;
  generationSource: string;
  contextChunksUsed: number;
  sources: SourceCitation[];
  topicCoverage: TopicCoverage[];
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
  sources: SourceCitation[];
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
