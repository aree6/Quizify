export type MaterialType = 'course_info' | 'slide';
export type MaterialStatus = 'Processing' | 'Active' | 'Failed' | 'Deleted';

export interface MaterialRow {
  id: string;
  course_code: string;
  material_type: MaterialType;
  chapter: string | null;
  chapter_item_label: string | null;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number;
  chunk_count: number;
  status: MaterialStatus;
  error_message: string | null;
  uploaded_at: string;
  updated_at: string;
}

export interface ChapterOutline {
  chapter: string;
  topics: string[];
}

export interface CourseOutline {
  synopsis: string;
  learningOutcomes: string[];
  chapters: ChapterOutline[];
  updatedAt?: string;
}

export interface GeneratedQuestion {
  prompt: string;
  options: string[];
  correct: number;
}

export interface GeneratedContent {
  lesson: string;
  questions: GeneratedQuestion[];
}
