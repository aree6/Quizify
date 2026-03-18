# Quizify MVP + RAG

This repository now includes a working end-to-end MVP with Supabase-based RAG:

- Frontend (React + Vite + Tailwind)
- Backend (Node.js + Express)
- Supabase PostgreSQL + pgvector
- Supabase Storage for materials (PDF/PPTX)
- Upload -> extract -> chunk -> embed -> retrieve -> generate mini-course flow

## Architecture

1. Admin uploads PDF/PPTX in Materials page
2. Backend stores file in Supabase Storage bucket (`course-materials`)
3. Backend extracts text, chunks it, generates embeddings, and stores vectors in `material_chunks`
4. Lecturer creates mini-course by course code + topics
5. Backend retrieves relevant chunks with pgvector similarity search
6. LLM generates lesson + quiz (or fallback if AI key is missing)

## Model Defaults (affordable + good)

- Embeddings: `text-embedding-3-small` (fast, low cost, 1536 dimensions)
- Generation: `gpt-4o-mini` (strong quality/cost for structured quiz output)

These defaults are implemented in `backend/src/lib/ai.js` and configurable via env.

## Setup

### 1) Supabase database schema

Open Supabase SQL Editor and run:

- `supabase/mvp_schema.sql`

It creates:

- `mini_courses`, `quizzes`, `questions`, `quiz_attempts`
- `materials`, `material_chunks`
- vector match function `match_material_chunks`
- RLS policies and storage bucket/policy for `course-materials`

### 2) Backend

```bash
cd backend
cp .env.example .env
npm install
```

Fill `backend/.env`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (required for real embeddings + generation)
- `SUPABASE_STORAGE_BUCKET=course-materials`
- optional: `EMBEDDING_MODEL`, `GENERATION_MODEL`, `PORT`, `CORS_ORIGIN`

Run backend:

```bash
npm run dev
```

### 3) Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
```

Fill `frontend/.env.local`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL=http://localhost:3001`
- `VITE_BASE_PATH=/`

Run frontend:

```bash
npm run dev
```

## How to test RAG end-to-end

1. Login as Admin (dev mode)
2. Go to Materials
3. Upload a PDF/PPTX with a selected course code (e.g., `SE101`)
4. Confirm status is `Active` and chunk count > 0
5. Login as Lecturer
6. Go to Create Course and use the same course code + related topics
7. Generate mini-course and check generation info (RAG+LLM / RAG-only / Fallback)
8. Open share link and submit quiz as student
9. Verify submission in Analytics

## API endpoints

- `GET /health`
- `GET /api/materials`
- `POST /api/materials/upload` (multipart form-data: `file`, `courseCode`, optional `topic`)
- `DELETE /api/materials/:id`
- `POST /api/courses/generate`
- `GET /api/courses`
- `GET /api/public/course/:token`
- `POST /api/public/course/:token/submit`
- `GET /api/analytics/:courseId`

## Notes

- If `OPENAI_API_KEY` is missing, uploads still work and chunks are stored without embeddings.
- In that mode, course generation falls back to non-vector retrieval and finally to built-in fallback content.
- PPTX extraction is supported. Legacy binary `.ppt` is intentionally not supported in this MVP.
