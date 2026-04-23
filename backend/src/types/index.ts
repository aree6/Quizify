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

/**
 * Strict analytics metadata for every generated question.
 * Powers the Lecturer Dashboard to pinpoint exactly where students fail.
 */
export interface QuestionMetadata {
  /** The primary topic this question belongs to. */
  topic: string;
  /** The specific subtopic or concept being tested. */
  subtopic: string;
  /** The Bloom's Taxonomy cognitive target of this question. */
  bloomLevel: BloomLevel;
  /** The SOLO Taxonomy depth level of this question. */
  soloLevel: SoloLevel;
}

export interface GeneratedQuestion {
  prompt: string;
  options: string[];
  correct: number;
  /**
   * Pedagogical explanation for EACH option (index 0-3).
   * Must explain why the correct answer is right and why each distractor is wrong,
   * diagnosing misconceptions to reinforce learning.
   */
  explanations: string[];
  /**
   * Strict analytics tagging for dashboard insights.
   * Every question MUST carry exact metadata so the system can report:
   * "The student understands X at a multi-structural level, but fails at Bloom 'Apply' level."
   */
  metadata: QuestionMetadata;
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
 * The SRS mandates two taxonomies for grounding content and assessment:
 *   - Bloom's Taxonomy (lesson depth)      → UC003: Generate Content
 *   - SOLO Taxonomy (quiz complexity)      → UC004: Create Quizzes
 *
 * CONFIG-DRIVEN BEHAVIOR:
 *   - Lecturers toggle SPECIFIC levels of Bloom's and SOLO Taxonomies.
 *   - We ONLY generate content and questions for the levels they ENABLE.
 *   - If a level is toggled off, it is ignored completely.
 */

/** Standard Bloom's Taxonomy cognitive levels. */
export type BloomLevel =
  | 'remember'   // recall facts, basic concepts
  | 'understand' // explain, summarize, interpret
  | 'apply'      // use in new situations, execute procedures
  | 'analyze'    // compare, contrast, differentiate
  | 'evaluate'   // justify, critique, defend
  | 'create';    // design, construct, formulate

/** Official academic SOLO Taxonomy terms (mapped from UI labels). */
export type SoloLevel =
  | 'unistructural'     // single correct fact (UI: Foundational)
  | 'multistructural'   // several independent facts (UI: Intermediate)
  | 'relational'        // integrate multiple concepts (UI: Advanced)
  | 'extended_abstract'; // transfer to novel contexts (UI: Challenge)

export type LessonLength = 'concise' | 'standard' | 'detailed';

export interface GenerationOptions {
  /**
   * Bloom's cognitive levels ENABLED by the lecturer.
   * The lesson and quiz will ONLY target these levels.
   * Defaults to ['understand', 'apply'].
   */
  enabledBloomLevels: BloomLevel[];
  /**
   * SOLO complexity levels ENABLED by the lecturer.
   * Quiz items will ONLY target these levels.
   * Defaults to ['multistructural'].
   */
  enabledSoloLevels: SoloLevel[];
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
  enabledBloomLevels: ['understand', 'apply'],
  enabledSoloLevels: ['multistructural'],
  lengthLevel: 'standard',
  customInstructions: '',
};
