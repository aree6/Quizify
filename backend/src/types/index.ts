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

/**
 * A single retrieved chunk with enough metadata to render a citation in the UI.
 * `index` is the 1-based position of this source in the `sources` array, used
 * to resolve `[S1]`, `[S2]` markers emitted by the lesson prompt.
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

/** Chunks retrieved for a single selected topic — supports breadth across topics. */
export interface TopicContext {
  topic: string;
  chunks: Array<{ text: string; citation: SourceCitation }>;
}

export interface GeneratedContent {
  lesson: string;
  questions: GeneratedQuestion[];
  sources: SourceCitation[];
}

/* ─── Pedagogically-grounded generation options (SRS UC003 + UC004) ──────────
 *
 * The SRS mandates three taxonomies for grounding content and assessment:
 *   - Bloom's Taxonomy (lesson depth)      → UC003: Generate Content
 *   - SOLO Taxonomy (quiz complexity)      → UC004: Create Quizzes
 *   - ICAP Framework (learner engagement)  → UC004, overall active-learning goal
 *
 * We expose Bloom + SOLO + length as lecturer-visible controls. ICAP scales
 * implicitly: higher Bloom/SOLO levels imply more constructive engagement
 * (Passive → Active → Constructive → Interactive).
 */

export type BloomLevel =
  | 'understand'   // explain, summarize, interpret
  | 'apply'        // use in new situations, execute procedures
  | 'analyze'      // compare, contrast, differentiate
  | 'evaluate';    // justify, critique, defend

export type SoloLevel =
  | 'unistructural'     // single correct fact (foundational)
  | 'multistructural'   // several independent facts (intermediate)
  | 'relational'        // integrate multiple concepts (advanced)
  | 'extended_abstract'; // transfer to novel contexts (challenge)

export type LessonLength = 'concise' | 'standard' | 'detailed';

export interface GenerationOptions {
  /** Bloom's cognitive level targeted by the lesson. Defaults to 'understand'. */
  bloomLevel: BloomLevel;
  /** SOLO complexity level targeted by quiz items. Defaults to 'multistructural'. */
  soloLevel: SoloLevel;
  /** Lesson verbosity per topic subsection. Defaults to 'standard'. */
  lengthLevel: LessonLength;
  /**
   * Free-text lecturer directives appended to BOTH lesson and quiz prompts.
   * Sanitized server-side (capped length, strip obvious injection patterns)
   * before being merged into the prompt under a fenced "Lecturer directives"
   * section so the model treats them as constrained input, not top-level
   * instructions.
   */
  customInstructions?: string;
}

/** Balanced baseline — good starting point for undergrad topics. */
export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  bloomLevel: 'understand',
  soloLevel: 'multistructural',
  lengthLevel: 'standard',
  customInstructions: '',
};
