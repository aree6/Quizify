# Quizify — RAG-Powered Interactive Quiz & Mini-Course Generator

Quizify converts UTM course materials (PDF/PPTX) into interactive mini-courses with AI-generated lessons and MCQ quizzes. Built around a Retrieval-Augmented Generation (RAG) pipeline backed by Supabase PostgreSQL + pgvector.

## Architecture

```
Upload PDF/PPTX → Extract text → Chunk (LangChain) → Embed (Gemini 1536d) → Store in pgvector
                                                                                    ↓
Create Mini-Course ← Lecturer selects course + topics → Vector similarity search → RAG context
                                                                                    ↓
DeepSeek v4-flash → Generates lesson (with [S#] citations) + MCQ quiz (Bloom's & SOLO tagged)
                                                                                    ↓
Share link → Student accesses lesson (public) → Signs in (Google OAuth) → Takes quiz
                                                                                    ↓
Results stored → Analytics: topic performance, Bloom/SOLO breakdown, cross-matrix, per-student diagnostics
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | Node.js + Express 4 (TypeScript) |
| Database | Supabase PostgreSQL 15 + pgvector |
| Auth | Supabase Auth (Google OAuth) |
| Storage | Supabase Storage (`course-materials` bucket) |
| AI (Generation) | DeepSeek API (`deepseek-v4-flash`) with thinking mode |
| AI (Embeddings) | Gemini API (`gemini-embedding-001`, 1536 dimensions) |
| RAG Pipeline | LangChain text splitters, custom prompt construction |
| File Parsing | pdf-parse (PDF), JSZip + custom XML parser (PPTX) |
| Testing | Vitest + supertest |
| Deployment | Netlify (frontend) + Render (backend) |

## AI Provider Configuration

The AI provider is **hardcoded** in `backend/src/config/env.ts`. Currently set to `deepseek`.  
Supported providers: `deepseek`, `openai`, `gemini`, `none`.

- **Embeddings always use Gemini** (`gemini-embedding-001`) regardless of which provider generates content
- **Generation uses DeepSeek v4-flash** with thinking mode enabled (`REASONING_EFFORT: low`)
- To switch providers, edit the `AI_PROVIDER` constant and `GENERATION_MODEL` in `backend/src/config/env.ts`

## Setup

### 1) Supabase Database

Run `supabase/mvp_schema.sql` in the Supabase SQL Editor. It creates:
- `materials`, `material_chunks` (with pgvector embeddings), `mini_courses`, `quizzes`, `questions`, `quiz_attempts`
- `match_material_chunks` vector similarity search function
- RLS policies on all tables
- `course-materials` storage bucket

### 2) Backend

```bash
cd backend
cp .env.example .env
npm install
```

Fill `backend/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `DEEPSEEK_API_KEY` | Yes* | DeepSeek API key for generation |
| `GEMINI_API_KEY` | Yes* | Gemini API key for embeddings (+ fallback generation) |
| `CORS_ORIGIN` | No | CORS origin (default: `http://localhost:5173`) |
| `PORT` | No | Server port (default: `3001`) |
| `DEFAULT_PASS_PERCENTAGE` | No | Quiz pass threshold (default: `40`) |
| `SUPABASE_STORAGE_BUCKET` | No | Storage bucket (default: `course-materials`) |
| `ADMIN_EMAILS` | No | Comma-separated admin emails |
| `LECTURER_OVERRIDE_EMAILS` | No | Comma-separated test lecturer emails |

*At least one provider key is required. The active provider is hardcoded in `src/config/env.ts`.

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

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_API_URL` | Backend URL (default: `http://localhost:3001`) |
| `VITE_BASE_PATH` | Deployment base path (default: `/`) |

Run frontend:
```bash
npm run dev
```

## User Roles & Auth

Three roles, auto-detected on sign-in (server-side enforced):

| Role | Detection Rule | Access |
|------|---------------|--------|
| **Admin** | Email in `ADMIN_EMAILS` env var | Upload/manage materials, system oversight |
| **Lecturer** | `@utm.my` email | Create courses, view analytics, manage materials |
| **Student** | `@graduate.utm.my` email | Take quizzes via share links, view attempt history |

- Auth via **Google OAuth** (Supabase Auth)
- Role resolution is server-side — clients cannot spoof roles
- `LECTURER_OVERRIDE_EMAILS` env var allows non-UTM email testing
- Frontend dev mode: mock user bypasses OAuth

## Features

### Lecturer
- **Materials Upload**: Drag-drop PDF/PPTX files, organize by course > chapter > sub-chapter
- **Mini-Course Generation**: RAG pipeline generates lessons with `[S#]` inline source citations + configurable MCQ quizzes (5-20 questions) tagged with Bloom's & SOLO taxonomy
- **Editable Preview**: Edit lesson text, quiz questions, options, explanations, and taxonomy tags before confirming
- **Course Management**: List, sort, copy share links, delete courses
- **Enhanced Analytics Dashboard**:
  - KPIs: submissions, average score, pass rate, unique students, high/low scores
  - Topic performance (per-topic bar charts)
  - Bloom's Taxonomy performance analysis
  - SOLO Taxonomy performance analysis
  - Topic × Bloom cross-matrix (heatmap)
  - Per-student diagnostics with weak topics, cognitive profile, AI recommendations

### Student
- **Public Course Access**: Open share links to view mini-course lessons (no login required)
- **Quiz Taking**: Sign in with Google to take quizzes; one question at a time with progress bar
- **Quiz Results**: Immediate feedback with score, pass/fail, per-option explanations, Bloom/SOLO tags
- **Student Dashboard**: Attempt history, detailed breakdown per attempt, weak topic identification

### Admin
- Full materials management (upload, re-index, delete by course/chapter)
- System-wide visibility of all courses

## API Endpoints

All `/api/*` routes (except public read) require `Authorization: Bearer <JWT>`.

### Health
| Method | Path | Auth |
|--------|------|------|
| `GET` | `/health` | None |

### Materials
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/materials?courseCode=X` | Required | List materials |
| `POST` | `/api/materials/upload` | Required | Upload PDF/PPTX (multipart) |
| `PATCH` | `/api/materials/:id` | Required | Update metadata |
| `DELETE` | `/api/materials/:id` | Required | Soft-delete material |
| `DELETE` | `/api/materials/course/:courseCode` | Required | Delete all for course |
| `DELETE` | `/api/materials/course/:courseCode/chapter?chapter=X` | Required | Delete chapter materials |
| `POST` | `/api/materials/:id/reindex` | Required | Re-index material |
| `POST` | `/api/materials/repair` | Required | Auto-repair failed materials |

### Courses
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/courses` | Required | List courses |
| `GET` | `/api/courses/available` | Required | Courses with indexed materials |
| `GET` | `/api/courses/:code/topics` | Required | Chapter topics for course |
| `POST` | `/api/courses/:code/reindex-outline` | Required | Re-extract outline |
| `POST` | `/api/courses/preview` | Required | Generate lesson+quiz preview |
| `POST` | `/api/courses/confirm` | Required | Save course to DB |
| `DELETE` | `/api/courses/:id` | Required | Delete course |

### Public
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/public/course/:token` | None | Get course by share token |
| `POST` | `/api/public/course/:token/submit` | Required | Submit quiz answers |

### Student
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/students/attempts` | Required | Student attempt history |
| `GET` | `/api/students/attempts/:attemptId` | Required | Detailed attempt breakdown |

### Analytics
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/analytics/:courseId` | Required | Full course analytics |

## End-to-End Test Flow

1. Login as Admin → upload PDF/PPTX to Materials
2. Verify material status is `Active` and chunk count > 0
3. Login as Lecturer → Create Course, select course code + topics
4. Configure Bloom's/SOLO levels, question count → Generate Mini-Course
5. Preview & edit lesson/quiz → Confirm & Create Course
6. Copy share link → open as Student
7. Sign in with Google → take quiz → submit
8. View results (score, pass/fail, per-option explanations)
9. Login as Lecturer → Analytics → view topic/Bloom/SOLO/student diagnostics

## Testing

```bash
cd backend
npx vitest run             # Run all tests (8 files, 59+ tests)
npx vitest run --coverage  # With coverage report
```

- **Unit tests**: Service layer (quiz scoring, analytics)
- **Integration tests**: Route handlers with mocked Supabase
- **Coverage**: 100% on middleware/routes/types; ~89% on quiz service

## Notes

- If provider API key is missing, generation will fail with a 500 error. There is no fallback mode.
- PPTX extraction supports `.pptx` only (not legacy `.ppt`).
- File uploads are limited to 10 MB per file.
- The backend is a standalone Express server (not a Supabase Edge Function).
- `src/data/fallback-content.ts` exists but is not currently wired to any route.
