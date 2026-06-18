# PSM2 Diagram Update Analysis

**Date:** June 18, 2026
**Scope:** SRS v2.1, SDD v2.0, STD v2.0 (post-PSM1 → PSM2 deviation)
**Goal:** Identify which diagrams are still correct, which need redrawing, and the technical deviations that drive the changes.

This file is a working checklist for the Draw.io update pass. The text content of all three documents has already been migrated to PSM2 (`v2.0` / `v2.1`); the diagrams referenced by the text are still rendered from the old `*_PSM1_artifacts/` exports.

---

## 1. Why We Deviated From PSM1

The PSM1 submission targeted Firebase + LangChain + Pinecone. The current implementation
uses a different stack and a richer feature set, so the PSM1 UML diagrams are out of date.
The text already reflects these deviations; the diagrams must catch up.

### 1.1 Tech stack delta

| Concern              | PSM1 (old)                                | PSM2 (current)                                                            |
| -------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| Frontend             | React 18 SPA                              | React 19 + Vite 7 + Tailwind 4                                            |
| Backend              | Node.js 20 (LTS) + Express 4              | Node.js 20 + Express 4 (unchanged)                                        |
| Database             | Firebase Firestore                        | **Supabase PostgreSQL**                                                   |
| Vector store         | Pinecone (external)                       | **pgvector** extension inside Supabase                                    |
| File storage         | Firebase Storage                          | **Supabase Storage** (bucket `course-materials`)                          |
| Auth                 | Custom email + password, custom JWT       | **Supabase Auth (Google OAuth)** — no custom user table                   |
| RAG orchestration    | LangChain 0.1.x                           | `@langchain/openai` + `openai` SDK + `langchain/textsplitters`            |
| PDF parsing          | (not specified)                           | `pdf-parse` + `jszip` (for PPTX)                                          |
| LLM provider         | External (not specified)                  | DeepSeek via OpenRouter + Gemini (multi-provider)                         |

### 1.2 Feature delta

Things that **didn't exist** in PSM1 but must be shown in PSM2 diagrams:

1. **Course outline extraction** — `outlines.service` extracts `synopsis` + `learningOutcomes` + `chapters` + `topics` from `course_info` materials.
2. **Two-step creation flow** — `POST /api/courses/preview` (try generation, return content for review) → `POST /api/courses/confirm` (persist on lecturer approval). Old PSM1 was a one-shot create.
3. **Configurable generation** — Bloom's levels (6) and SOLO levels (4) and lesson length (`concise`/`standard`/`detailed`) are selected at preview time.
4. **Source citations** — generated lessons embed `[S#]` markers that resolve to a structured `sources` JSONB array (fileName, chapter, chunkIndex, similarity, snippet, full text).
5. **Per-option explanations** — every MCQ carries 4 explanations (one per option) for the post-quiz review screen.
6. **Question metadata** — each question is tagged with `topic`, `subtopic`, `bloomLevel`, `soloLevel` for the analytics dashboard.
7. **Pass/Fail logic** — `pass_percentage` on the mini-course configures the threshold; backend returns `passed: boolean` on every attempt.
8. **Reindex / Repair** — `POST /api/materials/:id/reindex` and `POST /api/materials/repair` for re-running embedding generation.
9. **Student history (optional auth)** — authenticated students can call `GET /api/students/attempts`; the share-link flow still works without login.
10. **Enhanced analytics** — topic performance, Bloom performance, SOLO performance, cross-matrix (topic × Bloom), per-question option distribution, per-student weak-topic detection. PSM1 only had a flat submissions table.
11. **PDF + PPTX support** — both file types are accepted; `material_type` enum = `('slide', 'course_info')`.
12. **Per-course materials scoping** — every `material_chunks` row carries `course_code` for scoped retrieval; the SQL function `match_material_chunks` filters on it.

### 1.3 Data model delta (drives ERD and Class diagrams)

**Old (PSM1) tables → New (PSM2) tables:**

| PSM1 entity    | PSM2 entity        | Why                                                                                       |
| -------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| `USER`         | (deleted)          | Replaced by Supabase `auth.users`; no app-side user table                                 |
| `Admin`        | (deleted)          | Role is derived from `auth.users.app_metadata.role`; no inheritance                      |
| `Lecturer`     | (deleted)          | Same                                                                                      |
| `Student`      | (deleted)          | Replaced by `student_name` + optional `student_email` on `quiz_attempts`                   |
| `MiniCourse`   | `mini_courses`     | + `course_code`, `topics TEXT[]`, `sources JSONB`, `pass_percentage`, `expires_at`, `created_by_name`, `creator_email` |
| `Lesson`       | merged into `mini_courses.lesson_content` | No separate table; lesson is a TEXT column                                |
| `Document`     | `materials`        | + `course_code`, `material_type`, `chapter`, `chapter_item_label`, `chunk_count`, `status`, `error_message` |
| (new)          | `material_chunks`  | RAG chunks with `chunk_text` + `embedding vector(1536)` + `source_file` + `chapter`      |
| `QuizQuestion` | `questions`        | Schema change: 4 option columns (`option_a..d`) instead of separate `QuizOption` table   |
| `QuizOption`   | merged into `questions.option_a..d` | No separate table                                                              |
| `Submission`   | `quiz_attempts`    | + `score`, `total_questions`, `percentage`, `submitted_answers JSONB`, `student_email`    |
| `SubmissionAnswer` | merged into `quiz_attempts.submitted_answers` | Stored as JSONB array                                          |

### 1.4 Lifecycle delta (drives State Machine diagrams)

**`mini_courses.status` (per Supabase `CHECK` constraint):**
`('Generating', 'Ready', 'Shared')` — three states.

The PSM1 state machine shows **six** states (`Created`, `Generating`, `Ready`, `Shared`, `Failed`, `Archived`).
The current schema does not allow `Failed` or `Archived`; failure is reported as a per-attempt error, not a course status. The PSM1 state diagram **must be redrawn** to match the 3-state model.

**`materials.status` (new in PSM2):**
`('Processing', 'Active', 'Failed', 'Deleted')` — needs its own state machine (PSM1 had no state machine for materials because the entity was simpler).

---

## 2. SRS Diagram Status (18 figures)

| #  | Figure                                          | File                                  | Status           | Action needed                                                                                                                  |
| -- | ----------------------------------------------- | ------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Use Case Diagram for QUIZIFY                    | `SRS/artifacts/image_000001_…png`     | **Partial**      | Re-draw to add: `Extract Course Outline` (UC010), `Reindex Materials` (UC011), `Repair Index` (UC012), `View Student History` (Student → UC001), and a `Preview` + `Confirm` two-step on `Generate Mini-Course` |
| 2  | Sequence Diagram for QUIZIFY                    | `SRS/artifacts/image_000002_…png`     | **Wrong**        | Re-draw with `Supabase` as the single data tier (replaces `RAG Service` + `File Storage` + `Database` lanes); add `Preview/Confirm` calls; add `/api/materials/:id/reindex` and `/api/courses/:code/reindex-outline` |
| 3  | Class/Domain Model                              | `SRS/artifacts/image_000003_…png`     | **Wrong**        | Re-draw with the 6 new tables (`materials`, `material_chunks`, `mini_courses`, `quizzes`, `questions`, `quiz_attempts`); show `option_a..d` columns on `questions`; show `embeddings vector(1536)` on `material_chunks`; remove `User/Admin/Lecturer/Student` |
| 4  | State Diagram for MINI_COURSE                   | `SRS/artifacts/image_000004_…png`     | **Wrong**        | Re-draw to show 3 states only: `Generating → Ready → Shared`. Remove `Created`, `Failed`, `Archived`                            |
| 5  | Activity Diagram for US001 (Login)              | `SRS/artifacts/image_000005_…png`     | **Wrong**        | Re-draw to show "Click **Sign in with Google**" → Supabase Auth → role-based redirect (no email/password)                     |
| 6  | Sequence Diagram for US001 (Login)              | `SRS/artifacts/image_000006_…png`     | **Wrong**        | Re-draw with `Supabase Auth` and OAuth flow; remove `POST /login` and `User Store`; add role-based dashboard redirect          |
| 7  | Activity Diagram for UC002 (Extract)             | `SRS/artifacts/image_000007_…png`     | **OK (generic)** | Could keep, but consider adding `course_code` filter and outline extraction step                                              |
| 8  | Sequence Diagram for UC002 (Extract)             | `SRS/artifacts/image_000008_…png`     | **Wrong**        | Re-draw to show pgvector `match_material_chunks(course_code)` SQL function and outline extraction                              |
| 9  | Image for UC003 (Generate Content)              | `SRS/artifacts/image_000009_…png`     | **Mostly OK**    | Minor: add `[S#]` citation marker step and `customInstructions` parameter                                                     |
| 10 | Sequence Diagram for UC003                      | `SRS/artifacts/image_000010_…png`     | **Mostly OK**    | Same as #9                                                                                                                     |
| 11 | Image for UC004 (Create Quizzes)                | `SRS/artifacts/image_000011_…png`     | **Mostly OK**    | Minor: add Bloom/SOLO level tagging and per-option explanations                                                              |
| 12 | Sequence Diagram for UC004                      | `SRS/artifacts/image_000012_…png`     | **Mostly OK**    | Same as #11                                                                                                                    |
| 13 | Activity Diagram for US005 (Analytics)          | `SRS/artifacts/image_000013_…png`     | **Wrong**        | Re-draw to show **enhanced** analytics: topic performance, Bloom breakdown, SOLO breakdown, cross-matrix, per-student weak-topic dashboard (not just a flat results table) |
| 14 | Sequence Diagram for US005                      | `SRS/artifacts/image_000014_…png`     | **Wrong**        | Re-draw with `GET /api/analytics/:courseId` returning the rich `CourseAnalytics` object (not just a submissions list)         |
| 15 | Activity Diagram for US006 (Share)              | `SRS/artifacts/image_000015_…png`     | **OK (generic)** | Could keep; consider adding `expires_at` and QR code generation                                                              |
| 16 | Sequence Diagram for US006                      | `SRS/artifacts/image_000016_…png`     | **OK (generic)** | Could keep                                                                                                                     |
| 17 | Activity Diagram for US007 (Update Materials)   | `SRS/artifacts/image_000017_…png`     | **OK (generic)** | Could keep; consider adding PPTX branch and chunking + embedding step                                                         |
| 18 | Sequence Diagram for US007                      | `SRS/artifacts/image_000018_…png`     | **Wrong**        | Re-draw with PDF **and PPTX** upload; add chunking + embedding step; add `reindex` and `repair` flows                          |
| 19 | Activity Diagram for US008 (Access Mini-Course) | `SRS/artifacts/image_000019_…png`     | **OK (generic)** | Could keep; consider adding `expires_at` check                                                                                |
| 20 | Sequence Diagram for US008                      | `SRS/artifacts/image_000020_…png`     | **OK (generic)** | Could keep                                                                                                                     |
| 21 | Activity Diagram for US009 (Take Quiz)          | `SRS/artifacts/image_000021_…png`     | **OK (generic)** | Could keep; consider adding explanation display after submit                                                                  |
| 22 | Sequence Diagram for US009                      | `SRS/artifacts/image_000022_…png`     | **OK (generic)** | Could keep; consider adding optional `student_email` capture from auth                                                         |

**SRS summary:** 9 wrong, 5 mostly OK, 8 OK. **Re-draw at minimum 9 diagrams.**

---

## 3. SDD Diagram Status (31 figures)

| #  | Figure                                          | File                                     | Status       | Action needed                                                                                                                  |
| -- | ----------------------------------------------- | ---------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Use Case Diagram for QUIZIFY                    | `SDD/artifacts/image_000001_…png`        | **Partial**  | Same as SRS Fig 1                                                                                                              |
| 2  | Component Diagram                              | `SDD/artifacts/image_000002_…png`        | **Wrong**    | Re-draw with `Supabase (PostgreSQL + pgvector + Storage + Auth)` as a single infrastructure lane (not `RAG Service` / `Vector Store` / `File Storage` / `Database` as four separate components); show `Materials` / `Courses` / `Public` / `Analytics` controllers; show `RAG/AI` module calling LLM provider |
| 3  | Class Diagram (service modules)                | `SDD/artifacts/image_000003_…png`        | **Wrong**    | Re-draw with current service modules: `materials.service`, `courses.service`, `rag.service`, `ai.service`, `quiz.service`, `outlines.service`; remove `User/Admin/Lecturer/Student` entity classes; show `MaterialRow`, `MiniCourse`, `Question`, `QuizAttempt` (no `QuizOption` class) |
| 4  | ERD                                            | `SDD/artifacts/image_000004_…png`        | **Wrong**    | Re-draw with the 6 actual tables and the actual columns (see §1.3); add FK arrows from `quizzes.mini_course_id` to `mini_courses.id`, and from `questions.quiz_id` to `quizzes.id`; show `vector(1536)` on `material_chunks.embedding` |
| 5  | Package Diagram                                | `SDD/artifacts/image_000005_…png`        | **Wrong**    | Re-draw with current backend layout (`controllers` / `services` / `routes` / `middleware` / `lib` / `config` / `types`) and frontend layout (`pages` / `components` / `services` / `context` / `types` / `constants`); replace `Infrastructure` lane with `Supabase` |
| 6  | Sequence for QUIZIFY (end-to-end)              | `SDD/artifacts/image_000006_…png`        | **Wrong**    | Same as SRS Fig 2                                                                                                              |
| 7  | Sequence for US001 (Login)                     | `SDD/artifacts/image_000007_…png`        | **Wrong**    | Same as SRS Fig 6                                                                                                              |
| 8  | Sequence for UC002 (Extract)                    | `SDD/artifacts/image_000008_…png`        | **Wrong**    | Same as SRS Fig 8                                                                                                              |
| 9  | Image for UC003 (activity alt)                 | `SDD/artifacts/image_000009_…png`        | (placeholder) | Empty image; replace with the real UC003 activity diagram                                                                      |
| 10 | Sequence for UC004 (Create Quizzes)             | `SDD/artifacts/image_000010_…png`        | **OK (generic)** | Could keep; consider adding Bloom/SOLO level tagging                                                                       |
| 11 | Sequence for US005 (Analytics)                 | `SDD/artifacts/image_000011_…png`        | **Wrong**    | Same as SRS Fig 14                                                                                                             |
| 12 | Sequence for US006 (Share)                     | `SDD/artifacts/image_000012_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 13 | Sequence for US007 (Update Materials)          | `SDD/artifacts/image_000013_…png`        | **Wrong**    | Same as SRS Fig 18                                                                                                             |
| 14 | Sequence for US008 (Access)                    | `SDD/artifacts/image_000014_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 15 | Sequence for US009 (Take Quiz)                 | `SDD/artifacts/image_000015_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 16 | ST001: State Machine for UC001 (Login)         | `SDD/artifacts/image_000016_…png`        | **Wrong**    | Re-draw for Google OAuth → Supabase session                                                                                    |
| 17 | ST002: State Machine for UC002 (Extract)        | `SDD/artifacts/image_000017_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 18 | ST003: State Machine for UC003 (Generate)      | `SDD/artifacts/image_000018_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 19 | ST004: State Machine for UC004 (Create Quiz)    | `SDD/artifacts/image_000019_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 20 | ST005: State Machine for US005 (Analytics)      | `SDD/artifacts/image_000020_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 21 | ST006: State Machine for US006 (Share)         | `SDD/artifacts/image_000021_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 22 | ST007: State Machine for US007 (Upload)        | `SDD/artifacts/image_000022_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 23 | ST008: State Machine for US008 (Access)        | `SDD/artifacts/image_000023_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 24 | ST009: State Machine for US009 (Take Quiz)     | `SDD/artifacts/image_000024_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 25 | Activity for US001 (Login)                     | `SDD/artifacts/image_000025_…png`        | **Wrong**    | Same as SRS Fig 5                                                                                                              |
| 26 | Activity for UC002 (Extract)                   | `SDD/artifacts/image_000026_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 27 | Activity for UC003 (Generate)                  | `SDD/artifacts/image_000027_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 28 | Activity for UC004 (Create Quiz)               | `SDD/artifacts/image_000028_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 29 | Activity for US005 (Analytics)                 | `SDD/artifacts/image_000029_…png`        | **Wrong**    | Same as SRS Fig 13                                                                                                             |
| 30 | Activity for US006 (Share)                     | `SDD/artifacts/image_000030_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 31 | Activity for US007 (Upload)                    | `SDD/artifacts/image_000031_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 32 | Activity for US008 (Access)                    | `SDD/artifacts/image_000032_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 33 | Activity for US009 (Take Quiz)                 | `SDD/artifacts/image_000033_…png`        | **OK (generic)** | Could keep                                                                                                                  |
| 34 | UI: LECTURER/ADMIN Dashboard                   | `SDD/artifacts/image_000034_…png`        | **Mockup, not real** | The current QUIZIFY UI is React 19 + Tailwind (different layout, different colors). Re-screenshot from running app or rebrand this mockup to "QUIZIFY" and re-style to match |
| 35 | UI: Generate Mini-Course                       | `SDD/artifacts/image_000035_…png`        | **Mockup, not real** | Same as #34                                                                                                                   |
| 36 | UI: Share Course Link                          | `SDD/artifacts/image_000036_…png`        | **Mockup, not real** | Same as #34; also: the real QUIZIFY has a `/s/{token}` short URL, not a QR code                                               |
| 37 | UI: Simple Analytics                           | `SDD/artifacts/image_000037_…png`        | **Mockup, not real** | Same as #34; real QUIZIFY analytics uses Recharts (bar/pie/heatmap) and Bloom/SOLO breakdowns                                   |
| 38 | UI: Results                                    | `SDD/artifacts/image_000038_…png`        | **Mockup, not real** | Same as #34                                                                                                                   |
| 39 | UI: MINI Courses                               | `SDD/artifacts/image_000039_…png`        | **Mockup, not real** | Same as #34                                                                                                                   |
| 40 | UI: Upload PDFs                                | `SDD/artifacts/image_000040_…png`        | **Mockup, not real** | Same as #34; real QUIZIFY supports both PDF and PPTX                                                                          |
| 41 | UI: Update Course & Slides                     | `SDD/artifacts/image_000041_…png`        | **Mockup, not real** | Same as #34                                                                                                                   |
| 42 | UI: STUDENT Access Mini-Course                 | `SDD/artifacts/image_000042_…png`        | **Mockup, not real** | Same as #34; real QUIZIFY uses share link with token, not "course code" input                                                |
| 43 | UI: STUDENT Take Quiz                          | `SDD/artifacts/image_000043_…png`        | **Mockup, not real** | Same as #34                                                                                                                   |

**SDD summary:** 12 wrong, 19 OK (generic), 10 mockup placeholders that need re-screenshots. **Re-draw at minimum 12 diagrams + 10 UI screenshots.**

---

## 4. STD Diagram Status

| #  | Figure                                          | File                                     | Status   | Action needed                                                                                                                  |
| -- | ----------------------------------------------- | ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1  | UTM banner (cover)                              | `STD/artifacts/image_000000_…png`        | **OK**   | The UTM banner is reusable. The body of STD.md has no UML diagrams; only the UTM cover banner is referenced. Nothing to update here. |

**STD summary:** STD has no UML diagrams to update. The text already reflects PSM2. **Nothing to redraw in STD.**

---

## 5. Quick reference: backend endpoints (for accurate diagrams)

These are the actual endpoints the diagrams should depict (from `backend/src/routes/index.ts`):

```
GET    /health
GET    /api/materials                                requireAuth
POST   /api/materials/upload                         requireAuth + multipart
PATCH  /api/materials/:id                            requireAuth
DELETE /api/materials/:id                            requireAuth
DELETE /api/materials/course/:courseCode             requireAuth
DELETE /api/materials/course/:courseCode/chapter     requireAuth
POST   /api/materials/:id/reindex                    requireAuth
POST   /api/materials/repair                         requireAuth
GET    /api/courses                                  requireAuth
GET    /api/courses/available                        requireAuth
GET    /api/courses/:courseCode/topics               requireAuth
POST   /api/courses/:courseCode/reindex-outline      requireAuth
POST   /api/courses/preview                          requireAuth
POST   /api/courses/confirm                          requireAuth
DELETE /api/courses/:id                              requireAuth
GET    /api/public/course/:token                     public
POST   /api/public/course/:token/submit              optionalAuth
GET    /api/students/attempts                        requireAuth
GET    /api/analytics/:courseId                      requireAuth
```

The Supabase SQL function `match_material_chunks(query_embedding_text, match_course_code, match_count)` is what implements the retrieval step in `rag.service`.

---

## 6. Suggested workflow for re-drawing in Draw.io

1. Open the [Draw.io source](https://drive.google.com/file/d/1pmQGUTRsQPvv_Rlh3O6TXpdZs8178-We/view?usp=sharing) for the document you are updating.
2. Find the matching page (Use Case, ERD, Component, Sequence, etc.).
3. For each **WRONG** or **MOCKUP** figure above, re-export the page and replace the PNG in this folder:
   - SRS: `documents_psm2/SRS/artifacts/image_000XXX_…png`
   - SDD: `documents_psm2/SDD/artifacts/image_000XXX_…png`
4. After all updates, the pipeline regenerator (`output_v2/scripts/clean_html.py`) will pick up the new images automatically — only the `imageN.png` references in the HTML need to match the new file numbers if you add or remove figures.

The text in `sources/SRS.md`, `sources/SDD.md`, `sources/STD.md` is already at PSM2 baseline and does not need editing unless the new diagram triggers a figure-number change.

---

## 7. Regenerating the final PDFs after the update

```sh
cd /Users/Areeb/Quizify/output_v2
python3 scripts/clean_html.py     # re-runs the HTML cleaner
# PDFs and DOCXs (per doc) are regenerated from the cleaned HTML — see output_v2/README for the exact commands.
```
