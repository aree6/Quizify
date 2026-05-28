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

/** Standard Bloom's Taxonomy cognitive levels. */
export type BloomLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

/** Official academic SOLO Taxonomy terms (mapped from UI labels). */
export type SoloLevel =
  | 'unistructural'
  | 'multistructural'
  | 'relational'
  | 'extended_abstract';

export type LessonLength = 'concise' | 'standard' | 'detailed';

/**
 * Strict analytics metadata for every generated question.
 * Powers the Lecturer Dashboard to pinpoint exactly where students fail.
 */
export interface QuestionMetadata {
  topic: string;
  subtopic: string;
  bloomLevel: BloomLevel;
  soloLevel: SoloLevel;
}

export interface GenerationOptions {
  /**
   * Bloom's cognitive levels ENABLED by the lecturer.
   * The lesson and quiz will ONLY target these levels.
   */
  enabledBloomLevels: BloomLevel[];
  /**
   * SOLO complexity levels ENABLED by the lecturer.
   * Quiz items will ONLY target these levels.
   */
  enabledSoloLevels: SoloLevel[];
  /** Lesson verbosity per topic subsection. Defaults to 'standard'. */
  lengthLevel: LessonLength;
  /**
   * Free-text lecturer directives appended to BOTH lesson and quiz prompts.
   */
  customInstructions?: string;
}

export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  enabledBloomLevels: ['understand', 'apply'],
  enabledSoloLevels: ['multistructural'],
  lengthLevel: 'standard',
  customInstructions: '',
};

export interface GeneratedQuestion {
  prompt: string;
  options: string[];
  correct: number;
  /** Pedagogical explanation for each option (why right or wrong). */
  explanations: string[];
  /** Strict analytics tagging for dashboard insights. */
  metadata: QuestionMetadata;
}

export interface CoursePreview {
  title: string;
  courseCode: string;
  courseName: string;
  topics: string[];
  lesson: string;
  questions: GeneratedQuestion[];
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
  explanations: string[];
  metadata: QuestionMetadata;
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
  metadata: QuestionMetadata;
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

export interface StudentAttempt {
  id: string;
  courseId: string;
  courseTitle: string;
  shareToken: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  passPercentage: number;
  submittedAt: string;
}

export interface TopicPerformanceData {
  topic: string;
  subtopic: string;
  totalAnswers: number;
  correctCount: number;
  percentage: number;
}

export interface BloomPerformanceData {
  bloomLevel: string;
  totalAnswers: number;
  correctCount: number;
  percentage: number;
}

export interface SoloPerformanceData {
  soloLevel: string;
  totalAnswers: number;
  correctCount: number;
  percentage: number;
}

export interface CrossMatrixEntry {
  topic: string;
  bloomLevel: string;
  totalAnswers: number;
  correctCount: number;
  percentage: number;
}

export interface QuestionAnalyticsEntry {
  questionId: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanations: string[];
  metadata: QuestionMetadata;
  totalAttempts: number;
  correctCount: number;
  percentage: number;
  optionDistribution: number[];
}

export interface ScoreDistributionEntry {
  range: string;
  min: number;
  max: number;
  count: number;
}

export interface StudentAnswerDetail {
  questionId: string;
  prompt: string;
  options: string[];
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanations: string[];
  metadata: QuestionMetadata;
}

export interface StudentWeakTopic {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface StudentAnalyticsData {
  attemptId: string;
  studentName: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  weakTopics: StudentWeakTopic[];
  strongestTopic: string | null;
  weakestBloomLevel: string | null;
  answers: StudentAnswerDetail[];
}

export interface CourseAnalytics {
  courseId: string;
  totalSubmissions: number;
  uniqueStudents: number;
  totalQuestions: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  passPercentage: number;
  scoreDistribution: ScoreDistributionEntry[];
  topicPerformance: TopicPerformanceData[];
  bloomPerformance: BloomPerformanceData[];
  soloPerformance: SoloPerformanceData[];
  crossMatrix: CrossMatrixEntry[];
  questionAnalytics: QuestionAnalyticsEntry[];
  studentAnalytics: StudentAnalyticsData[];
}
