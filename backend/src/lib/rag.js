import JSZip from 'jszip';
import pdfParse from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { supabase } from './supabase.js';
import { embedTexts } from './ai.js';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

function stripXmlTags(input) {
  return input
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractTextFromPptx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files)
    .filter((name) => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
    .sort();

  const slideTexts = [];
  for (const slideName of slideNames) {
    const xml = await zip.file(slideName)?.async('string');
    if (!xml) continue;
    const text = stripXmlTags(xml);
    if (text) slideTexts.push(text);
  }

  return slideTexts.join('\n\n');
}

async function extractTextFromFile({ buffer, mimeType, fileName }) {
  const lowerName = fileName.toLowerCase();
  const isPdf = mimeType === 'application/pdf' || lowerName.endsWith('.pdf');
  if (isPdf) {
    const parsed = await pdfParse(buffer);
    return parsed.text || '';
  }

  const isPptx =
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    lowerName.endsWith('.pptx');
  if (isPptx) {
    return extractTextFromPptx(buffer);
  }

  throw new Error('Unsupported file type. Use PDF or PPTX.');
}

function toVectorString(embedding) {
  if (!Array.isArray(embedding) || embedding.length !== 1536) {
    throw new Error('Embedding dimension mismatch. Use a 1536-dim embedding model like text-embedding-3-small.');
  }
  return `[${embedding.join(',')}]`;
}

export async function ingestMaterial({
  materialId,
  courseCode,
  topic,
  fileName,
  mimeType,
  storagePath,
  buffer,
}) {
  const text = await extractTextFromFile({ buffer, mimeType, fileName });
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  if (!normalizedText) {
    throw new Error('Could not extract text from file.');
  }

  const chunks = await splitter.splitText(normalizedText);
  const filteredChunks = chunks.map((chunk) => chunk.trim()).filter(Boolean);
  if (filteredChunks.length === 0) {
    throw new Error('No valid text chunks produced from file.');
  }

  await supabase.from('material_chunks').delete().eq('material_id', materialId);

  const embeddings = await embedTexts(filteredChunks);
  const rows = filteredChunks.map((chunk, index) => ({
    material_id: materialId,
    course_code: courseCode,
    source_file: fileName,
    topic: topic || null,
    chunk_index: index,
    chunk_text: chunk,
    embedding: embeddings ? toVectorString(embeddings[index]) : null,
  }));

  const { error: chunkError } = await supabase.from('material_chunks').insert(rows);
  if (chunkError) {
    throw new Error('Failed to store material chunks.');
  }

  const { error: updateError } = await supabase
    .from('materials')
    .update({
      status: 'Active',
      error_message: null,
      chunk_count: filteredChunks.length,
      file_name: fileName,
      storage_path: storagePath,
      updated_at: new Date().toISOString(),
    })
    .eq('id', materialId);

  if (updateError) {
    throw new Error('Failed to update material status.');
  }

  return {
    chunkCount: filteredChunks.length,
  };
}

export async function retrieveRelevantChunks({ courseCode, topics, limit = 10 }) {
  const queryText = `${courseCode} ${topics.join(' ')}`.trim();

  const embeddings = await embedTexts([queryText]);
  if (embeddings?.[0]) {
    const queryEmbeddingText = toVectorString(embeddings[0]);
    const { data, error } = await supabase.rpc('match_material_chunks', {
      query_embedding_text: queryEmbeddingText,
      match_course_code: courseCode,
      match_count: limit,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((item) => item.chunk_text).filter(Boolean);
    }
  }

  const { data, error } = await supabase
    .from('material_chunks')
    .select('chunk_text')
    .eq('course_code', courseCode)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((item) => item.chunk_text).filter(Boolean);
}
