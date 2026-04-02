import JSZip from 'jszip';
import pdfParse from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { supabase } from '../lib/supabase.js';
import { embedTexts } from './ai.service.js';
import { extractAndSaveOutline } from './outlines.service.js';
import type { MaterialType } from '../types/index.js';

const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });

const EXPECTED_DIM = 1536;

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
    return parsed.text ?? '';
  }

  const isPptx =
    params.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    lower.endsWith('.pptx');
  if (isPptx) return extractTextFromPptx(params.buffer);

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

export async function retrieveRelevantChunks(params: {
  courseCode: string;
  topics: string[];
  limit?: number;
}): Promise<string[]> {
  const limit = params.limit ?? 10;
  const queryText = `${params.courseCode} ${params.topics.join(' ')}`.trim();

  const embeddings = await embedTexts([queryText]);
  if (embeddings?.[0]) {
    const queryVec = toVectorString(embeddings[0]);
    const { data, error } = await supabase.rpc('match_material_chunks', {
      query_embedding_text: queryVec,
      match_course_code: params.courseCode,
      match_count: limit,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return (data as Array<{ chunk_text: string }>).map((item) => item.chunk_text).filter(Boolean);
    }
  }

  const { data, error } = await supabase
    .from('material_chunks')
    .select('chunk_text')
    .eq('course_code', params.courseCode)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as Array<{ chunk_text: string }>).map((item) => item.chunk_text).filter(Boolean);
}
