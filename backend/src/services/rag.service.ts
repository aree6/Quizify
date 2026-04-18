import JSZip from 'jszip';
import pdfParse from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { supabase } from '../lib/supabase.js';
import { embedTexts } from './ai.service.js';
import { extractAndSaveOutline } from './outlines.service.js';
import type { MaterialType, SourceCitation, TopicContext } from '../types/index.js';

const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });

const EXPECTED_DIM = 1536;

/**
 * Fix common PDF text extraction artifacts:
 * 1. Standard Unicode ligatures (ﬁ, ﬂ, ﬃ, etc.) — from PDFs that use these codepoints.
 * 2. Custom-font ligature misencodings where pdf-parse replaces "ti" with a quote
 *    and "ffi" with the digit 9 (common with LaTeX/custom-CMap PDFs).
 * Only applies context-aware replacements inside word-like patterns to avoid
 * breaking legitimate quote/digit usage.
 */
function fixPdfArtifacts(raw: string): string {
  let text = raw.normalize('NFKC');

  // Standard Unicode ligatures
  text = text
    .replace(/\uFB00/g, 'ff')
    .replace(/\uFB01/g, 'fi')
    .replace(/\uFB02/g, 'fl')
    .replace(/\uFB03/g, 'ffi')
    .replace(/\uFB04/g, 'ffl')
    .replace(/\uFB05/g, 'ft')
    .replace(/\uFB06/g, 'st');

  // Custom-font artifacts: letter + quote + letter → letter + "ti" + letter
  // (covers straight ", curly " ", and stray spaces around the artifact)
  text = text.replace(/([a-zA-Z])\s*["\u201C\u201D]\s*([a-zA-Z])/g, '$1ti$2');

  // Custom-font artifact: letter + 9 + letter → letter + "ffi" + letter
  // Only apply inside words (bounded by letters on both sides) to avoid breaking numbers.
  text = text.replace(/([a-zA-Z])9([a-zA-Z])/g, '$1ffi$2');

  return text;
}

function stripXmlTags(input: string): string {
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function extractTextFromPptx(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files)
    .filter((name) => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
    .sort();

  const texts: string[] = [];
  for (const name of slideNames) {
    const xml = await zip.file(name)?.async('string');
    if (!xml) continue;
    const text = stripXmlTags(xml);
    if (text) texts.push(text);
  }
  return texts.join('\n\n');
}

async function extractText(params: { buffer: Buffer; mimeType: string; fileName: string }): Promise<string> {
  const lower = params.fileName.toLowerCase();
  const isPdf = params.mimeType === 'application/pdf' || lower.endsWith('.pdf');
  if (isPdf) {
    const parsed = await pdfParse(params.buffer);
    return fixPdfArtifacts(parsed.text ?? '');
  }

  const isPptx =
    params.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    lower.endsWith('.pptx');
  if (isPptx) return fixPdfArtifacts(await extractTextFromPptx(params.buffer));

  throw new Error('Unsupported file type. Use PDF or PPTX.');
}

function toVectorString(embedding: number[]): string {
  if (embedding.length !== EXPECTED_DIM) {
    throw new Error(`Embedding dimension mismatch (got ${embedding.length}, expected ${EXPECTED_DIM}).`);
  }
  return `[${embedding.join(',')}]`;
}

export async function ingestMaterial(params: {
  materialId: string;
  courseCode: string;
  chapter: string | null;
  materialType: MaterialType;
  fileName: string;
  mimeType: string;
  storagePath: string;
  buffer: Buffer;
}): Promise<{ chunkCount: number }> {
  const rawText = await extractText(params);
  const normalized = rawText.replace(/\s+/g, ' ').trim();
  if (!normalized) throw new Error('Could not extract text from file.');

  const chunks = (await splitter.splitText(normalized)).map((c) => c.trim()).filter(Boolean);
  if (chunks.length === 0) throw new Error('No valid text chunks produced from file.');

  await supabase.from('material_chunks').delete().eq('material_id', params.materialId);

  const embeddings = await embedTexts(chunks);
  const rows = chunks.map((chunk, index) => ({
    material_id: params.materialId,
    course_code: params.courseCode,
    source_file: params.fileName,
    chapter: params.chapter,
    chunk_index: index,
    chunk_text: chunk,
    embedding: embeddings ? toVectorString(embeddings[index]!) : null,
  }));

  const { error: chunkError } = await supabase.from('material_chunks').insert(rows);
  if (chunkError) throw new Error('Failed to store material chunks.');

  const { error: updateError } = await supabase
    .from('materials')
    .update({
      status: 'Active',
      error_message: null,
      chunk_count: chunks.length,
      file_name: params.fileName,
      storage_path: params.storagePath,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.materialId);

  if (updateError) throw new Error('Failed to update material status.');

  // For course_info uploads, extract and persist the structured outline (fire-and-forget)
  if (params.materialType === 'course_info') {
    const outlineText = normalized.slice(0, 30_000);
    void extractAndSaveOutline(params.courseCode, outlineText).catch((err) => {
      console.error(`[rag] Outline extraction failed for ${params.courseCode}:`, err.message);
    });
  }

  return { chunkCount: chunks.length };
}

/**
 * Shape returned by the `match_material_chunks` RPC. Keep this in sync with
 * the SQL function in `supabase/mvp_schema.sql`.
 */
interface MatchRow {
  id: string;
  material_id: string;
  source_file: string;
  chapter: string | null;
  chunk_index: number;
  chunk_text: string;
  similarity: number;
}

/** Trim a chunk into a compact preview for the UI citation chip. */
function buildSnippet(text: string, max = 220): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}\u2026` : cleaned;
}

/**
 * Embed a single query and run the pgvector similarity RPC. Returns rows
 * above `minSimilarity`, preserving metadata needed for citations.
 */
async function vectorSearch(params: {
  courseCode: string;
  queryText: string;
  limit: number;
  minSimilarity: number;
}): Promise<MatchRow[]> {
  const embeddings = await embedTexts([params.queryText]);
  if (!embeddings?.[0]) return [];

  const queryVec = toVectorString(embeddings[0]);
  const { data, error } = await supabase.rpc('match_material_chunks', {
    query_embedding_text: queryVec,
    match_course_code: params.courseCode,
    match_count: params.limit,
  });

  if (error || !Array.isArray(data)) return [];

  return (data as MatchRow[]).filter(
    (row) => row.chunk_text && (row.similarity ?? 1) >= params.minSimilarity,
  );
}

/**
 * Legacy combined-query retrieval. Kept for any callers that want a single
 * joined context string; new code should prefer `retrievePerTopic`.
 */
export async function retrieveRelevantChunks(params: {
  courseCode: string;
  topics: string[];
  limit?: number;
  minSimilarity?: number;
}): Promise<{ chunks: string[]; matchCount: number }> {
  const rows = await vectorSearch({
    courseCode: params.courseCode,
    queryText: `${params.courseCode} ${params.topics.join(' ')}`.trim(),
    limit: params.limit ?? 10,
    minSimilarity: params.minSimilarity ?? 0.3,
  });
  const chunks = rows.map((r) => r.chunk_text);
  return { chunks, matchCount: chunks.length };
}

/**
 * Per-topic retrieval: runs one vector search per selected topic so each topic
 * gets breadth of coverage, then dedupes by chunk id across topics. The global
 * `sources` array is assembled with 1-based indexes so the lesson prompt can
 * emit `[S1]`, `[S2]` markers that resolve cleanly in the UI.
 *
 * Returns:
 * - `topicContexts`: per-topic chunks with their citation metadata
 * - `sources`: flat, deduped list of citations used across all topics
 */
export async function retrievePerTopic(params: {
  courseCode: string;
  topics: string[];
  perTopicLimit?: number;
  minSimilarity?: number;
}): Promise<{ topicContexts: TopicContext[]; sources: SourceCitation[] }> {
  const perTopicLimit = params.perTopicLimit ?? 15;
  const minSimilarity = params.minSimilarity ?? 0.25;

  // Global source registry: chunkId -> citation (deduped across topics)
  const sourceByChunk = new Map<string, SourceCitation>();

  const topicContexts: TopicContext[] = [];

  for (const topic of params.topics) {
    const rows = await vectorSearch({
      courseCode: params.courseCode,
      queryText: `${params.courseCode} ${topic}`.trim(),
      limit: perTopicLimit,
      minSimilarity,
    });

    const chunks: TopicContext['chunks'] = [];
    for (const row of rows) {
      let citation = sourceByChunk.get(row.id);
      if (!citation) {
        citation = {
          index: sourceByChunk.size + 1,
          chunkId: row.id,
          sourceFile: row.source_file,
          chapter: row.chapter,
          chunkIndex: row.chunk_index ?? 0,
          similarity: Number(row.similarity.toFixed(3)),
          snippet: buildSnippet(row.chunk_text),
          text: row.chunk_text,
        };
        sourceByChunk.set(row.id, citation);
      }
      chunks.push({ text: row.chunk_text, citation });
    }

    topicContexts.push({ topic, chunks });
  }

  // Preserve insertion order for stable [S1], [S2] numbering.
  const sources = [...sourceByChunk.values()];
  return { topicContexts, sources };
}
