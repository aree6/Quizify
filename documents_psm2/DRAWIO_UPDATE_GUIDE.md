# Draw.io Update Guide — Per-Figure Action Plan

**For:** Mohammad Areeb (you)
**Scope:** Every figure in SRS, SDD, and STD that needs to be redrawn or removed
**Source of truth:** this file. The companion `DIAGRAM_UPDATE_CHECKLIST.md` has the *why*; this file has the *how*.

Read **§0 First** before touching anything in Draw.io. It contains the conventions, export settings, and naming rules that keep the build pipeline happy.

---

## 0. Read this first

### 0.1 Where the diagrams live in Draw.io

All three documents share one Draw.io file:

> https://drive.google.com/file/d/1pmQGUTRsQPvv_Rlh3O6TXpdZs8178-We/view?usp=sharing

The file has multiple **tabs/pages**. Each tab is one (or more) figures for one document. Recommended naming inside Draw.io:

```
SRS — Use Case                (page 1)
SRS — Sequence Overview
SRS — Domain Model
SRS — State Machine MINI_COURSE
SRS — UC001 Login (Activity + Sequence)
SRS — UC002 Extract (Activity + Sequence)
SRS — UC003 Generate (Activity + Sequence)
SRS — UC004 Create Quizzes (Activity + Sequence)
SRS — US005 Analytics (Activity + Sequence)
SRS — US006 Share (Activity + Sequence)
SRS — US007 Upload (Activity + Sequence)
SRS — US008 Access (Activity + Sequence)
SRS — US009 Take Quiz (Activity + Sequence)

SDD — Use Case
SDD — Component
SDD — Class / Service
SDD — ERD
SDD — Package
SDD — Sequence Overview
SDD — UC001 Login (Activity + Sequence)
SDD — UC002 Extract (Activity + Sequence)
SDD — UC003 Generate (Activity + Sequence)
SDD — UC004 Create Quizzes (Activity + Sequence)
SDD — US005 Analytics (Activity + Sequence)
SDD — US006 Share (Activity + Sequence)
SDD — US007 Upload (Activity + Sequence)
SDD — US008 Access (Activity + Sequence)
SDD — US009 Take Quiz (Activity + Sequence)
SDD — State Machines (ST001..ST009)
SDD — UI Screens §6
```

### 0.2 Export settings (MUST match the originals)

The regenerator expects the exact byte-width the originals had (~624 px for most UML, ~full page-width for UI). Use these export settings every time:

- **Format:** PNG
- **Border width:** 10 px (white padding around the diagram)
- **Scale:** 100 % (do NOT "fit to page")
- **Selection:** Export the current page (not "all pages")
- **Background:** white
- **Grid:** OFF (the original exports have no grid)
- **Shadow:** OFF
- **Filename:** keep the **same filename** as the existing artefact (see §0.3)

### 0.3 Filename rule (critical)

When you re-export a page, **save it with the EXACT same filename** as the PNG that currently lives in `documents_psm2/{SRS,SDD}/artifacts/`. The text in `sources/SRS.md` and `sources/SDD.md` is hard-linked to those file names. If you add or remove a figure, you will also have to edit the corresponding `.md` (only the image-link line).

Mapping table — what each filename means:

| Filename (`image_000XXX_<hash>.png`) | Document | Figure caption |
|---|---|---|
| `image_000000_<hash>.png` | SRS / SDD / STD | UTM Faculty of Computing cover banner (do NOT redraw — the file is reused across all three docs) |
| `image_000001_<hash>.png` | SRS / SDD | Use Case Diagram for QUIZIFY |
| `image_000002_<hash>.png` | SRS / SDD | Sequence Diagram for QUIZIFY (overall) |
| `image_000003_<hash>.png` | SRS / SDD | Domain/Class Diagram |
| `image_000004_<hash>.png` | SRS / SDD | State Machine for MINI_COURSE (SRS) / ERD (SDD) |
| `image_000005_<hash>.png` | SRS / SDD | Activity for US001 (SRS) / Package Diagram (SDD) |
| `image_000006_<hash>.png` | SRS / SDD | Sequence for US001 (SRS) / Sequence for QUIZIFY (SDD) |
| `image_000007_<hash>.png` | SRS / SDD | Activity for UC002 (SRS) / Sequence for US001 (SDD) |
| `image_000008_<hash>.png` | SRS / SDD | Sequence for UC002 (SRS) / Sequence for UC002 (SDD) |
| `image_000009_<hash>.png` | SRS / SDD | Activity for UC003 (SRS) / empty placeholder (SDD) |
| `image_000010_<hash>.png` | SRS / SDD | Sequence for UC003 (SRS) / Sequence for UC004 (SDD) |
| `image_000011_<hash>.png` | SRS / SDD | Activity for UC004 (SRS) / Sequence for US005 (SDD) |
| `image_000012_<hash>.png` | SRS / SDD | Sequence for UC004 (SRS) / Sequence for US006 (SDD) |
| `image_000013_<hash>.png` | SRS / SDD | Activity for US005 (SRS) / Sequence for US007 (SDD) |
| `image_000014_<hash>.png` | SRS / SDD | Sequence for US005 (SRS) / Sequence for US008 (SDD) |
| `image_000015_<hash>.png` | SRS / SDD | Activity for US006 (SRS) / Sequence for US009 (SDD) |
| `image_000016_<hash>.png` | SRS / SDD | Sequence for US006 (SRS) / ST001 State Machine (SDD) |
| `image_000017_<hash>.png` | SRS / SDD | Activity for US007 (SRS) / ST002 (SDD) |
| `image_000018_<hash>.png` | SRS / SDD | Sequence for US007 (SRS) / ST003 (SDD) |
| `image_000019_<hash>.png` | SRS / SDD | Activity for US008 (SRS) / ST004 (SDD) |
| `image_000020_<hash>.png` | SRS / SDD | Sequence for US008 (SRS) / ST005 (SDD) |
| `image_000021_<hash>.png` | SRS / SDD | Activity for US009 (SRS) / ST006 (SDD) |
| `image_000022_<hash>.png` | SRS / SDD | Sequence for US009 (SRS) / ST007 (SDD) |
| `image_000023_<hash>.png` | SDD only | ST008 (SDD) |
| `image_000024_<hash>.png` | SDD only | ST009 (SDD) |
| `image_000025_<hash>.png` | SDD only | Activity for US001 (SDD) |
| `image_000026_<hash>.png` | SDD only | Activity for UC002 (SDD) |
| `image_000027_<hash>.png` | SDD only | Activity for UC003 (SDD) |
| `image_000028_<hash>.png` | SDD only | Activity for UC004 (SDD) |
| `image_000029_<hash>.png` | SDD only | Activity for US005 (SDD) |
| `image_000030_<hash>.png` | SDD only | Activity for US006 (SDD) |
| `image_000031_<hash>.png` | SDD only | Activity for US007 (SDD) |
| `image_000032_<hash>.png` | SDD only | Activity for US008 (SDD) |
| `image_000033_<hash>.png` | SDD only | Activity for US009 (SDD) |
| `image_000034_<hash>.png` | SDD only | UI: LECTURER/ADMIN Dashboard |
| `image_000035_<hash>.png` | SDD only | UI: Generate Mini-Course |
| `image_000036_<hash>.png` | SDD only | UI: Share Course Link |
| `image_000037_<hash>.png` | SDD only | UI: Simple Analytics |
| `image_000038_<hash>.png` | SDD only | UI: Results |
| `image_000039_<hash>.png` | SDD only | UI: Mini-Courses |
| `image_000040_<hash>.png` | SDD only | UI: Upload PDFs |
| `image_000041_<hash>.png` | SDD only | UI: Update Course & Slides |
| `image_000042_<hash>.png` | SDD only | UI: STUDENT Access Mini-Course |
| `image_000043_<hash>.png` | SDD only | UI: STUDENT Take Quiz |

### 0.4 Style guide for redraws

- **Black text on white background** — no theme colours from the old mocks
- **System actor style:** stick figure
- **Use case (ellipse):** yellow fill (`#fff2cc`) is fine
- **Class / ERD entity:** white box, 1 px black border
- **Lifeline (sequence):** light blue (`#dae8fc`) head, dashed black vertical line
- **Activity:** rounded rectangle, white fill
- **State machine:** rounded rectangle per state, black arrows for transitions, labelled `<event> [<guard>]/<action>` on each arrow
- **Lanes in sequence/activity diagrams:** name them in the SAME way as the code:
  - `Student` (or `Lecturer` / `Admin`)
  - `Web UI` (React 19 + Vite + Tailwind 4)
  - `Backend API` (Express)
  - `Supabase` (PostgreSQL + pgvector + Storage + Auth)  ← single lane
  - `LLM` (DeepSeek via OpenRouter + Gemini)
- **For state machines** use the actual SQL `CHECK` values exactly:
  - `mini_courses.status IN ('Generating', 'Ready', 'Shared')`
  - `materials.status IN ('Processing', 'Active', 'Failed', 'Deleted')`

### 0.5 Endpoint reference (copy these labels into the diagrams)

These are the **real** endpoints — get the spelling exactly right:

```
Health:    GET  /health
Materials: GET  /api/materials · POST /api/materials/upload · PATCH /api/materials/:id
           DELETE /api/materials/:id · DELETE /api/materials/course/:courseCode
           DELETE /api/materials/course/:courseCode/chapter
           POST /api/materials/:id/reindex · POST /api/materials/repair
Courses:   GET  /api/courses · GET /api/courses/available
           GET  /api/courses/:courseCode/topics
           POST /api/courses/:courseCode/reindex-outline
           POST /api/courses/preview · POST /api/courses/confirm
           DELETE /api/courses/:id
Public:    GET  /api/public/course/:token · POST /api/public/course/:token/submit
Student:   GET  /api/students/attempts
Analytics: GET  /api/analytics/:courseId
```

The retrieval step is a SQL function:
```
public.match_material_chunks(query_embedding_text, match_course_code, match_count)
```

### 0.6 What to keep vs what to remove

| Element from old diagrams | Decision |
|---|---|
| `RAG Service` lane (PSM1) | **Remove** — replaced by `Backend API` calling `LLM` lane + `Supabase` lane |
| `File Storage` lane (PSM1) | **Remove** — replaced by `Supabase` lane (which includes storage) |
| `Vector Store` lane / component | **Remove** — replaced by pgvector inside `Supabase` lane |
| `Database` lane (PSM1) | **Remove** — replaced by `Supabase` lane (which includes PostgreSQL) |
| `AuthController` / `UserRepository` / `User` class | **Remove** — Supabase Auth handles this; no app-side user table |
| `User` / `Admin` / `Lecturer` / `Student` classes in domain model | **Remove** — replaced by `materials`, `material_chunks`, `mini_courses`, `quizzes`, `questions`, `quiz_attempts` |
| `QuizOption` class (PSM1) | **Remove** — options are columns `option_a`/`option_b`/`option_c`/`option_d` on `questions` |
| `POST /login` / `User Store` (PSM1) | **Remove** — replaced by Supabase Auth OAuth flow |
| `Quiz created` / `Save QuizQuestion + QuizOption` | **Replace with** `Save Question (option_a..d, explanations JSONB, metadata JSONB)` |
| MINI_COURSE states `Created`, `Failed`, `Archived` | **Remove** — only `Generating`, `Ready`, `Shared` are allowed by the SQL CHECK |
| UI screen mockups branded "CES-SAIL" | **Redraw with QUIZIFY branding** matching the live React 19 UI |
| `course_info` material type | **Add** to materials diagrams |
| PPTX upload | **Add** alongside PDF in materials/upload sequence |
| `preview` + `confirm` two-step | **Add** to course-generation sequence |
| `[S#]` source citation | **Add** to lesson-generation activity/sequence |
| Bloom's / SOLO / length options | **Add** to generation-pipeline activity/sequence |
| Reindex / Repair endpoints | **Add** to materials sequence |
| Pass percentage + Pass/Fail result | **Add** to quiz submission flow |
| Per-option explanations after submit | **Add** to US009 sequence + activity |
| Topic / Bloom / SOLO / cross-matrix analytics | **Add** to US005 sequence + activity |

---

## 1. SRS (Software Requirements Specification) — 18 figures

For each figure below, the format is:

> **File:** the PNG filename in `documents_psm2/SRS/artifacts/`
> **Status:** WRONG / OK-GENERIC / KEEP
> **What to do in Draw.io:** concrete steps

### 1.1 `image_000001` — Use Case Diagram for QUIZIFY
- **Status:** WRONG (partially). It already shows Bloom/SOLO/ICAP, but is missing the new use cases and the lecturer→Student login edge.
- **What to do in Draw.io:**
  - **KEEP:** the system boundary box, the three actors (Lecturer, Admin, Student), the four subsystem groups (Generate Mini-Course, Analytics, Sharing, Learning & Assessment, Material Management, Login & Authentication).
  - **KEEP** the "Generate Content (BLOOM Taxonomy)" and "Create Quizzes (SOLO & ICAP Taxonomy)" use cases inside `Generate Mini-Course` — these are correct.
  - **ADD** a new use case `Extract Course Outline` inside `Generate Mini-Course` (this is the `outlines.service` flow).
  - **ADD** a new use case `Reindex Material` inside `Material Management` (admin/lecturer → `/api/materials/:id/reindex`).
  - **ADD** a new use case `Repair Materials Index` inside `Material Management` (admin/lecturer → `/api/materials/repair`).
  - **SPLIT** `Generate Mini-Course` into two use cases: `Preview Mini-Course` and `Confirm Mini-Course`, with `<<include>>` from `Confirm Mini-Course` to `Preview Mini-Course`. Update the lecturer edge to point at both.
  - **ADD** a `Login & Authentication` edge from `Student` actor (the Student can login optionally to view their attempt history — `UC001` for student role).
  - **ADD** a use case `View Attempt History` inside `Learning & Assessment`, connected to Student actor.
  - **REMOVE** the `System` actor pointing at `Extract Learning Outcomes & contents` and `Create Quizzes` — those are not external system actors (the LLM is internal infrastructure, not a system actor).
- **Export:** save as the same filename.

### 1.2 `image_000002` — Sequence Diagram for QUIZIFY (overall)
- **Status:** WRONG. Shows separate `Auth API`, `Course API`, `Public API`, `RAG Service`, `File Storage`, `Database` lanes.
- **What to do in Draw.io:** redraw with the **lifetime lanes**:
  - **REMOVE** the `RAG Service` and `File Storage` lanes.
  - **REPLACE** the `Database` lane with `Supabase` (PostgreSQL + pgvector + Storage + Auth).
  - **ADD** an `LLM` lane (DeepSeek via OpenRouter / Gemini).
  - **Sequence to draw** (one combined flow):
    1. `Admin` → `Web UI`: `POST /api/materials/upload` (PDF or PPTX file)
    2. `Web UI` → `Backend API`: `POST /api/materials/upload` (multipart)
    3. `Backend API` → `Supabase Storage`: store file
    4. `Backend API` → `LLM`: chunk + embed (DeepSeek / Gemini)
    5. `Backend API` → `Supabase PostgreSQL`: insert `materials` row + insert `material_chunks` with `embedding vector(1536)`
    6. → `Admin`: `201 Created` with material id
    7. `Lecturer` → `Web UI`: click "Generate" on a course
    8. `Web UI` → `Backend API`: `POST /api/courses/preview` with `{ course_code, topics, enabledBloomLevels, enabledSoloLevels, lengthLevel, customInstructions }`
    9. `Backend API` → `Supabase PostgreSQL`: call `match_material_chunks(...)` for each topic
    10. `Backend API` → `LLM`: generate lesson with `[S#]` citation markers + generate MCQs with Bloom/SOLO metadata + per-option explanations
    11. `Backend API` → `Web UI`: return `preview` object (lesson + questions + sources)
    12. `Lecturer` reviews → clicks "Confirm"
    13. `Web UI` → `Backend API`: `POST /api/courses/confirm`
    14. `Backend API` → `Supabase PostgreSQL`: insert `mini_courses` (`status='Ready'`), `quizzes`, `questions`
    15. → `Lecturer`: `201 Created` with `courseId`
    16. `Lecturer` → `Web UI`: click "Share"
    17. `Web UI` → `Backend API`: `POST /api/courses/:id/share` → save `share_token`, set `status='Shared'`
    18. `Lecturer` displays share URL `/s/{token}`
    19. `Student` opens URL → `GET /api/public/course/:token` → `Backend API` → `Supabase` returns lesson + questions
    20. `Student` fills name + answers → `POST /api/public/course/:token/submit`
    21. `Backend API` scores, checks `pass_percentage`, inserts `quiz_attempts` row → returns `{ score, total, percentage, passed, explanations }`
    22. `Lecturer` → `Web UI`: opens Analytics
    23. `Web UI` → `Backend API`: `GET /api/analytics/:courseId`
    24. `Backend API` → `Supabase`: aggregate attempts + question metadata
    25. → `Web UI`: topic performance, Bloom performance, SOLO performance, cross-matrix, score distribution, per-student weak topics
- **Export:** same filename.

### 1.3 `image_000003` — Domain Model / Class Diagram
- **Status:** WRONG. Shows `User`/`Admin`/`Lecturer`/`Student`/`Document`/`MiniCourse`/`Lesson`/`QuizQuestion`/`QuizOption`/`Submission`/`SubmissionAnswer`.
- **What to do in Draw.io:** redraw with the **six actual tables** in Supabase. Use ER-style boxes (top compartment = name, lower compartments = attributes). Below is the exact column list per table (use these verbatim — copy/paste into the boxes):

  **`materials`**
  ```
  id              uuid PK
  course_code     text
  material_type   text CHECK in ('slide','course_info')
  chapter         text
  chapter_item_label text
  file_name       text
  storage_path    text UNIQUE
  mime_type       text
  file_size       bigint
  chunk_count     integer
  status          text CHECK in ('Processing','Active','Failed','Deleted')
  error_message   text
  uploaded_at     timestamptz
  updated_at      timestamptz
  ```

  **`material_chunks`**
  ```
  id            uuid PK
  material_id   uuid FK -> materials.id
  course_code   text
  source_file   text
  chapter       text
  chunk_index   integer
  chunk_text    text
  embedding     vector(1536)
  created_at    timestamptz
  ```

  **`mini_courses`**
  ```
  id              uuid PK
  title           text
  course_code     text
  topics          text[]
  lesson_content  text
  sources         jsonb          -- [{chunkId, sourceFile, chapter, chunkIndex, similarity, snippet, text}, ...]
  status          text CHECK in ('Generating','Ready','Shared')
  share_token     text UNIQUE
  pass_percentage integer CHECK 1..100
  expires_at      timestamptz
  created_by_name text
  creator_email   text
  created_at      timestamptz
  updated_at      timestamptz
  ```

  **`quizzes`**
  ```
  id              uuid PK
  mini_course_id  uuid FK -> mini_courses.id
  title           text
  question_count  integer
  created_at      timestamptz
  ```

  **`questions`**
  ```
  id                  uuid PK
  quiz_id             uuid FK -> quizzes.id
  prompt              text
  option_a            text
  option_b            text
  option_c            text
  option_d            text
  correct_option_index integer CHECK 0..3
  order_index         integer
  explanations        jsonb   -- {correct, incorrect_a, incorrect_b, incorrect_c, incorrect_d}
  metadata            jsonb   -- {topic, subtopic, bloomLevel, soloLevel}
  created_at          timestamptz
  ```

  **`quiz_attempts`**
  ```
  id                 uuid PK
  mini_course_id     uuid FK -> mini_courses.id
  quiz_id            uuid FK -> quizzes.id
  student_name       text
  student_email      text nullable
  score              integer
  total_questions    integer
  percentage         integer
  submitted_answers  jsonb  -- [{questionId, selectedIndex, correctIndex, isCorrect, prompt, selectedText, correctText, ...}, ...]
  submitted_at       timestamptz
  ```

  - **REMOVE** every PSM1 class: `User`, `Admin`, `Lecturer`, `Student`, `Document`, `MiniCourse`, `Lesson`, `QuizQuestion`, `QuizOption`, `Submission`, `SubmissionAnswer`.
  - **ADD** relationship arrows with correct multiplicities:
    - `materials 1 ─── 0..* material_chunks` (via `material_id`)
    - `mini_courses 1 ─── 0..* quizzes` (via `mini_course_id`)
    - `quizzes 1 ─── 0..* questions` (via `quiz_id`)
    - `mini_courses 1 ─── 0..* quiz_attempts` (via `mini_course_id`)
    - `quizzes 1 ─── 0..* quiz_attempts` (via `quiz_id`)
  - **Add a note** on the right: "Auth handled by Supabase Auth (auth.users) — no app-side user table."
- **Export:** same filename.

### 1.4 `image_000004` — State Diagram for MINI_COURSE
- **Status:** WRONG. Has 6 states (`Created`, `Generating`, `Ready`, `Shared`, `Failed`, `Archived`); only 3 are valid per the SQL CHECK.
- **What to do in Draw.io:** redraw with **3 states only**:
  - `Generating` (initial after preview runs) — add transition `Start → Generating` from the black filled circle
  - `Ready` (after lecturer confirms, content persisted) — transition `Generation success` from Generating
  - `Shared` (after `POST /api/courses/:id/share`, `share_token` saved) — transition `Share link created` from Ready
  - Terminal state (black ring) from `Shared` (no further transitions — `expires_at` is enforced at read time, not by status change)
  - **REMOVE** `Created`, `Failed`, `Archived` boxes and all their incoming/outgoing arrows
- **Optional addition:** add a "Failure" self-note on the `Generating` state (a small comment box) saying "failures are reported at the API level and stored in `materials.error_message`; they don't change `mini_courses.status`."
- **Export:** same filename.

### 1.5 `image_000005` — Activity Diagram for US001 (Login)
- **Status:** WRONG. Shows "Enter email and password" / "Click Login" with custom validation.
- **What to do in Draw.io:** redraw with **Google OAuth via Supabase Auth**:
  - **REMOVE** the `User` swimlane entry "Enter email and password"
  - **REMOVE** "Click Login" → custom "Validate credentials" path
  - **ADD** a `User` swimlane with one initial node: `Click "Sign in with Google"`
  - **ADD** a `System` swimlane (which represents Supabase Auth) with:
    - `Open Google OAuth popup` → `User authorizes` → `Supabase issues JWT session` → `Read user role from auth.users.app_metadata.role`
    - Decision: `role == 'lecturer' | 'admin' | 'student'`?
    - `redirect to /lecturer/dashboard`, `/admin/dashboard`, or `/student/dashboard` respectively
  - **Alternative flow:** if `role` missing or not in {lecturer, admin, student} → `Show error: unauthorized account`
- **Export:** same filename.

### 1.6 `image_000006` — Sequence Diagram for US001 (Login)
- **Status:** WRONG. Shows `Web UI` → `Auth API` → `User Store` with `POST /login` and password verify.
- **What to do in Draw.io:** redraw as a **Supabase Auth OAuth flow**:
  - **Lanes:** `User` (browser) → `Web UI` (React) → `Supabase Auth` → `Google OAuth` → `auth.users` table
  - **Messages:**
    1. `User` → `Web UI`: click "Sign in with Google"
    2. `Web UI` → `Supabase Auth`: `supabase.auth.signInWithOAuth({ provider: 'google' })`
    3. `Supabase Auth` → `Google OAuth`: redirect to consent screen
    4. `Google OAuth` → `User`: prompt for consent
    5. `User` → `Google OAuth`: allow
    6. `Google OAuth` → `Supabase Auth`: returns authorization code
    7. `Supabase Auth` → `auth.users`: insert/update user row with `app_metadata.role`
    8. `Supabase Auth` → `Web UI`: returns JWT in URL fragment
    9. `Web UI` → `Supabase Auth`: `supabase.auth.getSession()` to persist
    10. `Web UI` → `User`: redirect to role-based dashboard
  - **REMOVE** all `POST /login` / `User Store` / `Verify password` artefacts.
- **Export:** same filename.

### 1.7 `image_000007` — Activity Diagram for UC002 (Extract)
- **Status:** OK-GENERIC. Mostly fine.
- **What to do in Draw.io:**
  - **KEEP** the overall flow (`Lecturer` triggers → `Load course materials metadata` → decision `Materials available?` → either `Extract learning outcomes & relevant contents` or `Show error: materials not uploaded`).
  - **ADD** an extra step before the decision: `Filter by course_code` (the `match_material_chunks` SQL function scopes by `course_code`).
  - **OPTIONAL** split the "Extract" node into two:
    - `Extract course outline (synopsis, learningOutcomes, chapters, topics)` — only for `course_info` material type
    - `Extract topic chunks via match_material_chunks(course_code)` — for `slide` material type
  - **REMOVE** the implicit assumption of a single RAG service; the activity now lives inside `Backend API`.
- **Export:** same filename.

### 1.8 `image_000008` — Sequence Diagram for UC002 (Extract)
- **Status:** WRONG. Shows `Web UI` → `Course API` → `RAG Service` → `Database` lanes.
- **What to do in Draw.io:** redraw with these **lanes**: `Lecturer` → `Web UI` → `Backend API` → `Supabase PostgreSQL` (with `pgvector`).
  - **Messages:**
    1. `Lecturer` → `Web UI`: `GET /api/courses/:courseCode/topics` (for the course outline dropdown)
    2. `Web UI` → `Backend API`: forward GET
    3. `Backend API` → `Supabase`: `SELECT synopsis, learning_outcomes, chapters FROM stored_outline WHERE course_code = $1` (or recompute by calling the LLM on the `course_info` material)
    4. `Backend API` → `Web UI`: outline (synopsis, LOs, chapters, topics)
    5. `Lecturer` selects topics and clicks "Generate" → triggers UC003 (covered separately)
  - **REMOVE** the `RAG Service` and `Database` lanes — replace with a single `Supabase` lane.
- **Export:** same filename.

### 1.9 `image_000009` — Activity Diagram for UC003 (Generate Content)
- **Status:** MOSTLY-OK.
- **What to do in Draw.io:**
  - **KEEP** the flow: `Proceed with mini-course generation` → `Generate lesson content using extracted context` → decision `Lesson generated?` → either `Store lesson content` → `Return lesson for preview` OR `Return generation error`.
  - **ADD** a parallel step: `Generate MCQ questions with Bloom/SOLO metadata + per-option explanations`.
  - **ADD** a new state on the lesson: `Embed [S#] citation markers` (the lesson text contains inline markers like `[S1]`, `[S2]` that resolve to the `sources` JSONB array).
  - **ADD** a step: `Resolve enabledBloomLevels + enabledSoloLevels + lengthLevel from request`.
- **Export:** same filename.

### 1.10 `image_000010` — Sequence Diagram for UC003 (Generate Content)
- **Status:** MOSTLY-OK.
- **What to do in Draw.io:**
  - **KEEP** the basic flow: `Web UI` → `Course API` → `RAG Service` → `Database`.
  - **RENAME** `RAG Service` lane → `Backend API (ai.service)`.
  - **RENAME** `Database` lane → `Supabase`.
  - **ADD** message: `Backend API` → `LLM`: `chat.completions.create({ model: 'deepseek-chat' | 'gemini-1.5-flash', messages: [{ role: 'system', ... }, { role: 'user', prompt with Bloom/SOLO directives and [S#] instruction }] })`
  - **ADD** message: `Backend API` → `Supabase`: `INSERT INTO mini_courses (status='Generating', sources=...) RETURNING id` (during preview — actually, during preview the row is **not yet** inserted; confirm this in the backend and reflect it correctly).
  - **ADD** message: `Backend API` → `Web UI`: returns preview object `{ lesson_markdown, questions, sources }`.
- **Export:** same filename.

### 1.11 `image_000011` — Activity Diagram for UC004 (Create Quizzes)
- **Status:** MOSTLY-OK.
- **What to do in Draw.io:**
  - **KEEP** the basic flow (`Proceed with mini-course generation` → `Generate quiz questions and options (MCQ)` → decision → `Store quiz questions & options` OR `Return generation error`).
  - **ADD** step: `Tag each question with {topic, subtopic, bloomLevel, soloLevel}`.
  - **ADD** step: `Generate 4 explanations (one per option) explaining why correct is right and why each distractor is wrong`.
  - **UPDATE** the storage node to: `Store questions with option_a..d columns, explanations JSONB, metadata JSONB`.
- **Export:** same filename.

### 1.12 `image_000012` — Sequence Diagram for UC004 (Create Quizzes)
- **Status:** MOSTLY-OK.
- **What to do in Draw.io:**
  - **KEEP** the basic structure.
  - **REMOVE** the `Save QuizQuestion + QuizOption` message.
  - **REPLACE** with: `INSERT INTO questions (quiz_id, prompt, option_a, option_b, option_c, option_d, correct_option_index, order_index, explanations, metadata) VALUES (...)`.
  - **REMOVE** the `RAG Service` / `Database` lanes — replace with `Backend API` / `Supabase`.
- **Export:** same filename.

### 1.13 `image_000013` — Activity Diagram for US005 (View Analytics)
- **Status:** WRONG. Shows a flat "fetch submission results" → "display results table" / "no submissions yet" decision.
- **What to do in Draw.io:** redraw as **multi-panel analytics**:
  - **REMOVE** the simple "Open analytics dashboard" → "Fetch submission results" → "Display results table" flow.
  - **ADD** new activity nodes:
    - `Lecturer opens Analytics for a course`
    - `Fetch all attempts + question metadata` (`GET /api/analytics/:courseId`)
    - `Compute CourseAnalytics` (a fork/join of 6 parallel computations):
      - `Compute totalSubmissions, uniqueStudents, averageScore, highestScore, lowestScore, passRate`
      - `Compute scoreDistribution (0-20, 21-40, ..., 81-100)`
      - `Compute topicPerformance grouped by topic`
      - `Compute bloomPerformance grouped by bloomLevel`
      - `Compute soloPerformance grouped by soloLevel`
      - `Compute crossMatrix (topic × bloomLevel)`
      - `Compute per-question optionDistribution`
    - `Render dashboard` (4 panels: KPI cards, score distribution bar, topic bar, Bloom pie, SOLO pie, cross-matrix heatmap, attempts table)
  - **Use a swimlane** for "Lecturer" (left) and "System" (right).
- **Export:** same filename.

### 1.14 `image_000014` — Sequence Diagram for US005 (Analytics)
- **Status:** WRONG. Shows `GET /mini-courses/{courseId}/submissions` and a flat table.
- **What to do in Draw.io:** redraw:
  - **Lanes:** `Lecturer` → `Web UI` → `Backend API` → `Supabase PostgreSQL`.
  - **Messages:**
    1. `Lecturer` → `Web UI`: open Analytics
    2. `Web UI` → `Backend API`: `GET /api/analytics/:courseId`
    3. `Backend API` → `Supabase`: complex query that joins `quiz_attempts`, `questions`, `mini_courses` and aggregates per topic / bloom / solo
    4. `Supabase` → `Backend API`: returns aggregated rows
    5. `Backend API` → `Web UI`: JSON body matching the `CourseAnalytics` TypeScript type
    6. `Web UI` → `Lecturer`: renders the dashboard (Recharts for bar/pie/heatmap)
- **Export:** same filename.

### 1.15 `image_000015` — Activity Diagram for US006 (Share)
- **Status:** OK-GENERIC. Conceptually fine, just minor touches.
- **What to do in Draw.io:**
  - **KEEP** the overall flow.
  - **ADD** step: `Set status = 'Shared'` and `Generate share_token (UUID-based, 8 chars or full UUID — see backend code)`.
  - **OPTIONAL** add: `Set expires_at if lecturer specified an expiry`.
  - **ADD** alternate: `Course is in 'Generating' or 'Shared' already` → `Reject share action with error`.
- **Export:** same filename.

### 1.16 `image_000016` — Sequence Diagram for US006 (Share)
- **Status:** OK-GENERIC.
- **What to do in Draw.io:**
  - **KEEP** the overall flow.
  - **UPDATE** the endpoint label: `POST /api/courses/:id/share` (or `PATCH /api/courses/:id` with `{ status: 'Shared' }` — pick the one your backend actually uses and verify against `backend/src/controllers/courses.controller.ts`).
  - **REMOVE** `Save shareToken (Shared)` split into two messages: `UPDATE mini_courses SET status='Shared', share_token=gen_random_uuid() WHERE id=$1` then `SELECT share_token FROM mini_courses WHERE id=$1`.
  - **ADD** optional `expires_at` parameter.
- **Export:** same filename.

### 1.17 `image_000017` — Activity Diagram for US007 (Update Materials)
- **Status:** OK-GENERIC.
- **What to do in Draw.io:**
  - **KEEP** the upload/validate/store flow.
  - **ADD** branch for `file extension` decision: PDF or PPTX (both allowed; reject DOCX, TXT, etc.).
  - **ADD** step: `Extract text (pdf-parse for PDF, jszip+xml for PPTX)`.
  - **ADD** step: `Chunk text (langchain text splitters)`.
  - **ADD** step: `Generate embeddings (DeepSeek or Gemini embedding API, 1536-dim)`.
  - **ADD** step: `Insert material_chunks rows with embedding`.
  - **ADD** alternative flow: `Reindex existing material` (`POST /api/materials/:id/reindex`).
  - **ADD** alternative flow: `Repair materials missing embeddings` (`POST /api/materials/repair`).
- **Export:** same filename.

### 1.18 `image_000018` — Sequence Diagram for US007 (Upload)
- **Status:** WRONG. Shows PDF only and a `File Storage` lane.
- **What to do in Draw.io:**
  - **REMOVE** `File Storage` lane.
  - **RENAME** `Database` lane → `Supabase`.
  - **ADD** `LLM` lane (called only for embedding, not generation).
  - **Messages:**
    1. `Admin/Lecturer` → `Web UI`: select file (PDF or PPTX) + enter course_code
    2. `Web UI` → `Backend API`: `POST /api/materials/upload` (multipart)
    3. `Backend API` validates file type → rejects if not PDF/PPTX
    4. `Backend API` → `Supabase Storage`: store file at `course-materials/{course_code}/{uuid}.{ext}`
    5. `Backend API` → `Supabase PostgreSQL`: `INSERT INTO materials (status='Processing', ...)`
    6. `Backend API` → `pdf-parse` or `jszip`: extract text
    7. `Backend API` → `langchain/textsplitters`: chunk text
    8. `Backend API` → `LLM`: embedding API call (1536-dim)
    9. `Backend API` → `Supabase PostgreSQL`: `INSERT INTO material_chunks` (with `embedding vector(1536)`)
    10. `Backend API` → `Supabase PostgreSQL`: `UPDATE materials SET status='Active', chunk_count=N WHERE id=$1`
    11. `Backend API` → `Web UI`: `201 Created` with material id
- **Export:** same filename.

### 1.19 `image_000019` — Activity Diagram for US008 (Access)
- **Status:** OK-GENERIC.
- **What to do in Draw.io:**
  - **KEEP** the flow.
  - **ADD** decision: `Token valid AND mini_courses.expires_at > now() AND status IN ('Ready','Shared')`?
  - **ADD** alternative: `Token not found` / `Token expired` → show "Mini-course not found or expired".
- **Export:** same filename.

### 1.20 `image_000020` — Sequence Diagram for US008 (Access)
- **Status:** OK-GENERIC.
- **What to do in Draw.io:**
  - **KEEP** the flow.
  - **UPDATE** endpoint: `GET /api/public/course/:token`.
  - **REMOVE** the `Save Submission + Answers` and `POST /public/submissions` messages (they belong in US009).
- **Export:** same filename.

### 1.21 `image_000021` — Activity Diagram for US009 (Take Quiz)
- **Status:** OK-GENERIC.
- **What to do in Draw.io:**
  - **KEEP** the basic flow (`Enter name` → validate → `Select answers` → validate → `Submit` → `Calculate score` → `Store submission and answers` → `Display score`).
  - **ADD** step after `Display score`: `Display per-option explanations for each question` (the student sees why each answer is correct/incorrect).
  - **ADD** step: `Compute pass/fail using mini_courses.pass_percentage` → `Display "Passed" or "Failed" badge`.
  - **ADD** optional: if `student_email` present in JWT (logged-in student), `Link attempt to student_email`.
- **Export:** same filename.

### 1.22 `image_000022` — Sequence Diagram for US009 (Take Quiz)
- **Status:** OK-GENERIC.
- **What to do in Draw.io:**
  - **KEEP** the flow.
  - **UPDATE** endpoint: `POST /api/public/course/:token/submit`.
  - **ADD** message: response includes `{ score, total, percentage, passed, explanations: [...], sources: [...] }`.
  - **ADD** optional: `if (user) UPDATE quiz_attempts SET student_email = user.email`.
- **Export:** same filename.

---

## 2. SDD (Software Design Description) — 31 figures

SDD has the same set of UML diagrams as SRS, plus a state-machine block (ST001–ST009) and a UI-screens block (§6). The UML figures overlap heavily with SRS — see §1 for the conceptual content. Below, only SDD-specific deltas are listed.

### 2.1 `image_000001` — Use Case Diagram
- **Status:** WRONG. Same as SRS §1.1.
- **What to do in Draw.io:** apply the SRS §1.1 changes. The SDD version can be a copy of the SRS one with one extra note: "Diagram: see SRS Figure 2.1 for canonical use case list."

### 2.2 `image_000002` — Component Diagram
- **Status:** WRONG. Shows `Auth API`, `Course API`, `Public API` as separate components inside `Backend API` subsystem, plus `RAG Service` + `LLM Provider` as a separate `AI / Services` subsystem, plus `Database` + `File Storage` + `Vector Store` as a separate `Data Stores` subsystem.
- **What to do in Draw.io:** redraw with **3 top-level subsystems**:
  1. **Client (Front end)** — single component `React 19 + Vite + Tailwind 4` (Lecturer/Admin UI + Student Public UI are routes inside the same SPA)
  2. **Backend API (Node.js + Express)** — sub-components: `Materials`, `Courses` (Preview/Confirm/Reindex/Outline), `Public` (Course + Submit), `Analytics`, `Students`. Auth is delegated to `Supabase` (no internal auth component).
  3. **Supabase** (single component) — sub-components: `PostgreSQL + pgvector`, `Storage`, `Auth (Google OAuth)`.
  4. **LLM Providers** (single component) — sub-components: `DeepSeek (via OpenRouter)`, `Gemini`.
  - **REMOVE** the four arrows from Backend API into separate Database/File Storage/Vector Store. Replace with one arrow from Backend API to Supabase.
  - **ADD** a `<<verify>>` arrow from Supabase.Auth to the React client (the JWT lives in the browser).
  - **ADD** arrows: `Backend API → Supabase.PostgreSQL+pgvector` (query/match), `Backend API → Supabase.Storage` (upload/download), `Backend API → LLM Providers` (chat + embedding).
- **Export:** same filename.

### 2.3 `image_000003` — Class Diagram (service modules)
- **Status:** WRONG. Shows `MiniCourseController`, `MiniCourseService`, `RAGClient`, `SubmissionService`, `AnalyticsService`, `MaterialsService`, `AuthController`, `AuthService`, `UserRepository`, plus old entity classes.
- **What to do in Draw.io:** redraw with the **actual service modules** in `backend/src/services/`. Use class notation with `+method()` notation:

  ```
  ┌─ materials.service ────────────────┐
  │ +listMaterials()                   │
  │ +uploadMaterial(file, meta)        │
  │ +deleteMaterial(id)                │
  │ +deleteCourseMaterials(courseCode) │
  │ +deleteChapterMaterials(courseCode)│
  │ +reindexMaterial(id)               │
  │ +repairIndex()                     │
  └────────────────────────────────────┘
  ```
  ```
  ┌─ courses.service ──────────────────┐
  │ +listMiniCourses()                 │
  │ +listAvailableCourses()            │
  │ +getCourseTopics(courseCode)       │
  │ +reindexOutline(courseCode)        │
  │ +generateCoursePreview(req)        │   // returns GeneratedContent, does NOT persist
  │ +confirmAndSaveCourse(req)         │   // persists mini_courses + quizzes + questions
  │ +deleteMiniCourse(id)              │
  └────────────────────────────────────┘
  ```
  ```
  ┌─ rag.service ──────────────────────┐
  │ +extractText(file)                 │   // pdf-parse / jszip
  │ +chunkText(text)                   │   // langchain/textsplitters
  │ +embedChunks(chunks)               │   // calls LLM.embeddings
  │ +matchChunks(courseCode, embed)    │   // calls Supabase match_material_chunks
  │ +extractAndSaveOutline(material)   │
  │ +getStoredOutline(courseCode)      │
  └────────────────────────────────────┘
  ```
  ```
  ┌─ ai.service ───────────────────────┐
  │ +generateLesson(context, options)  │   // returns markdown with [S#] markers
  │ +generateQuiz(lesson, options)     │   // returns GeneratedQuestion[] with metadata + explanations
  │ +embed(text)                       │   // returns vector(1536)
  └────────────────────────────────────┘
  ```
  ```
  ┌─ quiz.service ─────────────────────┐
  │ +getPublicCourse(token)            │
  │ +submitQuiz(token, payload)        │   // scores, checks pass_percentage, persists
  │ +computeAnalytics(courseId)        │
  │ +getStudentAttempts(userId)        │
  └────────────────────────────────────┘
  ```

  - **REMOVE** `RAGClient`, `MiniCourseController`, `SubmissionService`, `AnalyticsController`, `AnalyticsService`, `AuthController`, `AuthService`, `UserRepository`, `MaterialsController`, `MiniCourseController`, `PublicController`, `User`, `MiniCourse`, `Lesson`, `QuizQuestion`, `QuizOption`, `Submission`, `SubmissionAnswer`, `Document`.
  - **ADD** dependency arrows:
    - `courses.service → rag.service` (for retrieval)
    - `courses.service → ai.service` (for generation)
    - `materials.service → rag.service` (for chunking + embedding)
    - `quiz.service → ai.service` (for answer-explanation rendering)
    - All services → `Supabase PostgreSQL` (via `supabase` client in `backend/src/lib/supabase.ts`).
- **Export:** same filename.

### 2.4 `image_000004` — ERD
- **Status:** WRONG. Shows `USER`, `MINI_COURSE`, `QUIZ_QUESTION`, `QUIZ_OPTION`, `LESSON`, `SUBMISSION`, `SUBMISSION_ANSWER`, `DOCUMENT`.
- **What to do in Draw.io:** use the **same column lists from §1.3 above**. Drop `User/Admin/Lecturer/Student`. Add the new `materials/material_chunks/quizzes/questions/quiz_attempts` tables with correct FK arrows:
  - `material_chunks.material_id → materials.id`
  - `quizzes.mini_course_id → mini_courses.id`
  - `questions.quiz_id → quizzes.id`
  - `quiz_attempts.mini_course_id → mini_courses.id`
  - `quiz_attempts.quiz_id → quizzes.id`
  - **REMOVE** the `SUBMISSION_ANSWER` table — answers are inside `quiz_attempts.submitted_answers` JSONB.
  - **REMOVE** the `QUIZ_OPTION` table — options are `option_a..d` columns on `questions`.
- **Export:** same filename.

### 2.5 `image_000005` — Package Diagram
- **Status:** WRONG. Shows `P001..P005` packages inside `Backend API` and `RAG Service` + `Vector Store` + `File Storage` + `Database` inside `Infrastructure`.
- **What to do in Draw.io:** redraw with **actual directory structure** from the code:

  **Frontend (`/frontend/src`):**
  ```
  pages/         (Login, Dashboard, Materials, CreateCourse, MyCourses, Analytics, Quiz)
  components/    (auth/, common/ — Layout, Toast, RequireRole, PageState)
  services/      (api, auth, http, supabase)
  context/       (AuthContext)
  types/         (TypeScript types matching backend)
  constants/
  ```

  **Backend (`/backend/src`):**
  ```
  routes/index.ts
  controllers/   (materials, courses, public, analytics, students, health)
  services/      (materials, courses, rag, ai, quiz, outlines)
  middleware/    (auth, async-handler, error-handler)
  lib/           (supabase)
  config/
  types/
  data/          (fallback-content)
  ```

  **Supabase (cloud):**
  ```
  PostgreSQL + pgvector
  Storage bucket "course-materials"
  Auth (Google OAuth)
  ```

  - **REMOVE** `P001..P005` packages and the `RAG Service` / `Vector Store` / `File Storage` / `Database` boxes.
  - **REPLACE** with the directory-tree structure above.
  - **ADD** dependency arrows: `frontend/* → backend/services/*`, `backend/services/* → supabase` (via `lib/supabase.ts`).
- **Export:** same filename.

### 2.6 `image_000006` — Sequence Diagram for QUIZIFY (overall, SDD version)
- **Status:** WRONG. Same content as SRS `image_000002` with the same PSM1 architecture.
- **What to do in Draw.io:** apply the SRS §1.2 changes. The SDD one is allowed to be slightly more detailed (add a `<<persistence>>` note to the Supabase lane). Otherwise identical.

### 2.7 `image_000007` — Sequence Diagram for US001 (Login, SDD)
- **Status:** WRONG. Same as SRS §1.6.
- **What to do in Draw.io:** apply the SRS §1.6 changes. The SDD one can be identical.

### 2.8 `image_000008` — Sequence Diagram for UC002 (Extract, SDD)
- **Status:** WRONG. Same as SRS §1.8.
- **What to do in Draw.io:** apply the SRS §1.8 changes.

### 2.9 `image_000009` — (currently a blank/placeholder image, SDD)
- **Status:** BLANK. There is no image in the SDD.md for `Activity Diagram for UC003` — only the sequence diagram `image_000010` exists. The SDD.md text in §5.10.2.3 ("Activity Diagram for UC003") currently shows nothing because this image is missing.
- **What to do in Draw.io:**
  - **CREATE** a new page in the Draw.io file called "SDD — Activity UC003".
  - **Draw** the UC003 activity diagram (you can copy the SRS §1.9 version as a base).
  - **EXPORT** as PNG and save it with the **same filename** (`image_000009_…png`) so the existing `SDD.md` link works.
- **If you want to skip this**, you can also just edit `SDD/sources/SDD.md` to remove the empty image reference, but it's cleaner to add the diagram.

### 2.10 `image_000010` — Sequence Diagram for UC004 (Create Quizzes, SDD)
- **Status:** OK-GENERIC.
- **What to do in Draw.io:** apply the SRS §1.12 changes (rename lanes, replace `Save QuizQuestion + QuizOption` with the JSONB-aware insert).

### 2.11 `image_000011` — Sequence Diagram for US005 (Analytics, SDD)
- **Status:** WRONG. Same as SRS §1.14.
- **What to do in Draw.io:** apply the SRS §1.14 changes.

### 2.12 `image_000012` — Sequence Diagram for US006 (Share, SDD)
- **Status:** OK-GENERIC. Same as SRS §1.16.
- **What to do in Draw.io:** apply the SRS §1.16 changes.

### 2.13 `image_000013` — Sequence Diagram for US007 (Upload, SDD)
- **Status:** WRONG. Same as SRS §1.18.
- **What to do in Draw.io:** apply the SRS §1.18 changes.

### 2.14 `image_000014` — Sequence Diagram for US008 (Access, SDD)
- **Status:** OK-GENERIC. Same as SRS §1.20.
- **What to do in Draw.io:** apply the SRS §1.20 changes.

### 2.15 `image_000015` — Sequence Diagram for US009 (Take Quiz, SDD)
- **Status:** OK-GENERIC. Same as SRS §1.22.
- **What to do in Draw.io:** apply the SRS §1.22 changes.

### 2.16 `image_000016` — ST001: State Machine for UC001 (Login, SDD)
- **Status:** WRONG. Current diagram shows "Validate credentials" → "Valid" / "Invalid" flow.
- **What to do in Draw.io:** redraw as **Google OAuth state machine**:
  - States: `Idle` → `OAuthPending` → `Authenticated` (terminal) OR `AuthFailed`
  - Transitions:
    - `Idle --[click "Sign in with Google"]--> OAuthPending`
    - `OAuthPending --[user denies]--> AuthFailed --[retry]--> Idle`
    - `OAuthPending --[user authorizes]--> Authenticated --[sign out]--> Idle`
- **Export:** same filename.

### 2.17 `image_000017` — ST002: State Machine for UC002 (Extract)
- **Status:** OK-GENERIC. Mostly fine.
- **What to do in Draw.io:** no major changes. Optional: rename the terminal state to `ContextReady` (matches the SRS text).

### 2.18 `image_000018` — ST003: State Machine for UC003 (Generate Content)
- **Status:** OK-GENERIC. Mostly fine.

### 2.19 `image_000019` — ST004: State Machine for UC004 (Create Quizzes)
- **Status:** OK-GENERIC. Mostly fine.
- **OPTIONAL** add a state: `ExplanationGeneration` after quiz generation (since explanations are generated separately in the prompt).

### 2.20 `image_000020` — ST005: State Machine for US005 (Analytics)
- **Status:** OK-GENERIC.
- **OPTIONAL** add a `ComputingAggregations` state between "Fetching" and "Displaying" — the 6 parallel aggregations take time.

### 2.21 `image_000021` — ST006: State Machine for US006 (Share)
- **Status:** OK-GENERIC. Conceptually fine.

### 2.22 `image_000022` — ST007: State Machine for US007 (Upload)
- **Status:** OK-GENERIC. The current state machine is reasonable.
- **OPTIONAL** add a `Chunking` state and an `Embedding` state between upload and storage (so the state machine reflects the new pipeline).

### 2.23 `image_000023` — ST008: State Machine for US008 (Access)
- **Status:** OK-GENERIC. Add an `ExpiredLink` state if the link's `expires_at` is in the past.

### 2.24 `image_000024` — ST009: State Machine for US009 (Take Quiz)
- **Status:** OK-GENERIC. Add a `Scoring` state and a `Pass`/`Fail` terminal state (currently just `Display score`).

### 2.25 `image_000025` — Activity Diagram for US001 (Login, SDD)
- **Status:** WRONG. Same as SRS §1.5.
- **What to do in Draw.io:** apply the SRS §1.5 changes.

### 2.26 `image_000026` — Activity Diagram for UC002 (Extract, SDD)
- **Status:** OK-GENERIC. Same as SRS §1.7.

### 2.27 `image_000027` — Activity Diagram for UC003 (Generate, SDD)
- **Status:** OK-GENERIC. Same as SRS §1.9.

### 2.28 `image_000028` — Activity Diagram for UC004 (Create Quizzes, SDD)
- **Status:** OK-GENERIC. Same as SRS §1.11.

### 2.29 `image_000029` — Activity Diagram for US005 (Analytics, SDD)
- **Status:** WRONG. Same as SRS §1.13.
- **What to do in Draw.io:** apply the SRS §1.13 changes (the multi-panel dashboard).

### 2.30 `image_000030` — Activity Diagram for US006 (Share, SDD)
- **Status:** OK-GENERIC. Same as SRS §1.15.

### 2.31 `image_000031` — Activity Diagram for US007 (Upload, SDD)
- **Status:** OK-GENERIC. Same as SRS §1.17.

### 2.32 `image_000032` — Activity Diagram for US008 (Access, SDD)
- **Status:** OK-GENERIC. Same as SRS §1.19.

### 2.33 `image_000033` — Activity Diagram for US009 (Take Quiz, SDD)
- **Status:** OK-GENERIC. Same as SRS §1.21.

### 2.34 `image_000034` — UI Screen: LECTURER/ADMIN Dashboard
- **Status:** WRONG. Currently a CES-SAIL mockup. The actual UI is the React 19 + Tailwind app at `frontend/src/pages/Dashboard.tsx`.
- **What to do:**
  - **REMOVE** the "CES-SAIL" branding (top-left logo + breadcrumb).
  - **REPLACE** with QUIZIFY branding.
  - **Two options for the actual screen:**
    1. **Run the app, log in as Lecturer/Admin, take a screenshot.** Then rebrand lightly to remove any visible dev/staging chrome. (This is the recommended path — it shows the real UI.)
    2. **Redraw a mockup** in Draw.io matching `Dashboard.tsx` (Lecturer sees 4 cards: Materials Library, Create Course, My Courses, Analytics; Admin sees 1 card: Materials Library + a System Note).
  - **Required content** in the screenshot/mockup:
    - Sidebar with: Dashboard, Materials, Create Course, My Courses, Analytics (Lecturer role)
    - Welcome heading with the user's name
    - 4 KPI cards: Curriculum PDFs, Mini-courses (Generated lessons + quiz), Published (Shareable links), Drafts
    - Quick Actions row: Manage PDFs, Generate, View Results
    - Performance Snapshot panel on the right (Total attempts, Average score)
- **Export:** same filename.

### 2.35 `image_000035` — UI Screen: Generate Mini-Course
- **Status:** WRONG. CES-SAIL mockup. The actual UI is at `frontend/src/pages/CreateCourse.tsx` (687 lines).
- **What to do:**
  - **REMOVE** CES-SAIL branding.
  - **REQUIRED content** in the screenshot/mockup:
    - Page title: "Create a Mini-Course"
    - Topic title input
    - Optional teaching notes textarea
    - **Course outline section** (synopsis + learning outcomes as checkboxes — `LO1`, `LO2`, `LO3`)
    - **Bloom's Taxonomy section** — checkboxes for: Remember, Understand, Apply, Analyze, Evaluate, Create
    - **SOLO Taxonomy section** — checkboxes for: Foundational (unistructural), Intermediate (multistructural), Advanced (relational), Challenge (extended_abstract)
    - **Lesson length** — radio: Concise / Standard / Detailed
    - **Custom instructions** textarea
    - **Source document** dropdown (the `course_code` with `Active` materials)
    - **Number of questions** slider (5–30)
    - **Pass percentage** input (default 40)
    - "Generate" button + "Reset" button
    - Right side: "Generated preview" panel with tabs: Lesson, Quiz, Sources
- **Export:** same filename.

### 2.36 `image_000036` — UI Screen: Share Course Link
- **Status:** WRONG. CES-SAIL mockup with WhatsApp/Telegram/QR code. The actual UI is in `MyCourses.tsx` (each course has a "View share link" or similar).
- **What to do:**
  - **REMOVE** CES-SAIL branding, WhatsApp/Telegram share buttons, and the QR code.
  - **REMOVE** the "Course QR code" panel — QUIZIFY does not generate QR codes.
  - **REQUIRED content** in the screenshot/mockup:
    - Page title: "Share Course Link"
    - Description: "Generate a shareable link for students to access the lesson and quiz."
    - Mini-course selector (dropdown of `Ready` courses)
    - Share URL display: `https://<host>/s/{share_token}` with a "Copy" button
    - Status badge: "Published" / "Draft"
    - **REMOVE** the "Preview student view" button if it doesn't exist in the actual code, or add a screenshot of the actual preview if it does.
  - **VERIFY** against `MyCourses.tsx` first.
- **Export:** same filename.

### 2.37 `image_000037` — UI Screen: Simple Analytics
- **Status:** WRONG. CES-SAIL mockup. The actual UI is at `frontend/src/pages/Analytics.tsx` (816 lines) using Recharts.
- **What to do:**
  - **REMOVE** CES-SAIL branding.
  - **REMOVE** the "Engagement", "Completion", "Score trend" metrics — the current implementation does not track these. Replace with metrics that match the actual `CourseAnalytics` shape:
    - Total Submissions
    - Unique Students
    - Average Score
    - Highest Score
    - Lowest Score
    - Pass Rate
  - **KEEP** the "Weak concepts snapshot" idea but rename to "Weak topics" and use the `topicPerformance` data from the API.
  - **REQUIRED content** in the screenshot/mockup:
    - Mini-course selector dropdown (top right)
    - 6 KPI cards: Total Submissions, Unique Students, Avg Score, Highest, Lowest, Pass Rate
    - **Score Distribution** bar chart (Recharts)
    - **Topic Performance** bar chart (Recharts)
    - **Bloom's Performance** pie chart (Recharts) — only enabled levels
    - **SOLO Performance** pie chart (Recharts) — only enabled levels
    - **Cross-Matrix (Topic × Bloom)** table/heatmap
    - **Attempts table** with name, score, percentage, passed badge, submitted_at
  - If you can run the app, take a screenshot. If not, mock in Draw.io with realistic data.
- **Export:** same filename.

### 2.38 `image_000038` — UI Screen: Results
- **Status:** WRONG. CES-SAIL mockup. The actual UI is the post-quiz screen in `frontend/src/pages/Quiz.tsx` (after the student submits).
- **What to do:**
  - **REMOVE** CES-SAIL branding.
  - **REQUIRED content** in the screenshot/mockup:
    - Big "Quiz completed!" header
    - Score: `4 / 5` (large) with percentage
    - **Pass / Fail badge** (green or red, using `pass_percentage` threshold)
    - "Time taken" or "Submitted at" timestamp
    - For each question, a card showing:
      - Question prompt
      - Student's answer (highlighted correct/incorrect)
      - Correct answer
      - The 4 explanations (why correct is right, why each distractor is wrong)
    - Optional: weak topics and strongest topic (from `studentAnalytics.weakTopics` and `strongestTopic`)
    - "Retake quiz" or "Back to courses" button
- **Export:** same filename.

### 2.39 `image_000039` — UI Screen: Mini-Courses
- **Status:** WRONG. CES-SAIL mockup. The actual UI is at `frontend/src/pages/MyCourses.tsx` (153 lines).
- **What to do:**
  - **REMOVE** CES-SAIL branding.
  - **REMOVE** "View details" / "Open student view" buttons that don't exist in the actual code.
  - **REQUIRED content** in the screenshot/mockup:
    - Page title: "My Courses" or "Mini-Courses"
    - List of `mini_courses` rows showing:
      - `title`
      - `status` badge (Generating / Ready / Shared)
      - `course_code`
      - `created_at`
      - Optional: `pass_percentage`, `expires_at`
    - Action buttons per row that match the code (e.g., "View" / "Delete" / "Share" — check the actual code first)
- **Export:** same filename.

### 2.40 `image_000040` — UI Screen: Upload PDFs (Materials)
- **Status:** WRONG. CES-SAIL mockup. The actual UI is at `frontend/src/pages/Materials.tsx` (949 lines).
- **What to do:**
  - **REMOVE** CES-SAIL branding.
  - **REMOVE** "PDF only" text in the upload zone — current implementation supports **PDF + PPTX**.
  - **REQUIRED content** in the screenshot/mockup:
    - Page title: "Materials" or "Materials Library"
    - Upload zone with "Drop PDF/PPTX files here" + "Upload" button
    - List of materials showing:
      - `file_name`
      - `material_type` badge (slide / course_info)
      - `chapter` + `chapter_item_label`
      - `status` badge (Processing / Active / Failed / Deleted) with colour coding
      - `chunk_count`
      - `uploaded_at`
    - Filter / search by filename
    - Per-row actions: Reindex (only on Active/Failed), Delete, View chapters
- **Export:** same filename.

### 2.41 `image_000041` — UI Screen: Update Course & Slides
- **Status:** WRONG. CES-SAIL mockup. Check the actual code first to see if this is a separate page.
- **What to do:**
  - **REMOVE** CES-SAIL branding.
  - **If this is not a real page** in the current code, you can either:
    1. Take a screenshot of `Materials.tsx` showing the chapter management view, or
    2. **REMOVE** this image from the SDD by editing `SDD/sources/SDD.md` and renaming the file `image_000041_*` to `image_000041_*_unused.png` so the regenerator ignores it.
  - **VERIFY** against `Materials.tsx` to decide.
- **Export:** same filename (or remove if not a real page).

### 2.42 `image_000042` — UI Screen: STUDENT Access Mini-Course
- **Status:** WRONG. CES-SAIL mockup shows a "course code" input field. The actual flow is a direct share link `/s/{token}` that opens the course.
- **What to do:**
  - **REMOVE** CES-SAIL branding.
  - **REMOVE** the "Enter course code" input — students open the course by clicking the share link directly.
  - **REQUIRED content** in the screenshot/mockup:
    - Page title: "Access Mini-Course" or the course title (e.g., "Introduction to Machine Learning Basics")
    - Lesson content (markdown rendered with `react-markdown` + `remark-gfm`)
    - Inline `[S#]` markers (clickable, opens a modal showing the source chunk)
    - "Take Quiz" button at the bottom
    - Optional: "What happens next?" panel (Lesson → Quiz → Score)
- **Export:** same filename.

### 2.43 `image_000043` — UI Screen: STUDENT Take Quiz
- **Status:** WRONG. CES-SAIL mockup. The actual UI is at `frontend/src/pages/Quiz.tsx` (423 lines).
- **What to do:**
  - **REMOVE** CES-SAIL branding.
  - **REQUIRED content** in the screenshot/mockup:
    - Header: "Quiz" badge + "Question 1 of 5 · Answered 1/5"
    - Course title (large)
    - Progress bar
    - Question card:
      - Question prompt
      - 4 option buttons (A, B, C, D)
      - "Previous" / "Next" buttons
    - "Back to lesson" link
    - "Submit" button (only enabled when all answered)
- **Export:** same filename.

---

## 3. STD (Software Test Documentation) — 0 UML figures

**Nothing to redraw.**

The STD has only one figure:
- `image_000000_<hash>.png` — the UTM Faculty of Computing cover banner (reused from SRS/SDD).

This banner is **correct** and **does not need updating**. Leave it as-is.

---

## 4. Workflow: from Draw.io to GitHub

For each figure you redraw:

1. **Open the Draw.io file** in your browser.
2. **Navigate to the matching tab** (e.g., "SDD — ERD").
3. **Edit** the page per the instructions above.
4. **Export as PNG** with the settings from §0.2.
5. **Save with the same filename** as the current PNG in `documents_psm2/{SRS,SDD}/artifacts/`.
6. **Drop the file** into `documents_psm2/{SRS,SDD}/artifacts/` (overwriting the old one).
7. **Verify** by re-running the regenerator:
   ```sh
   cd /Users/Areeb/Quizify/output_v2
   python3 scripts/clean_html.py
   ```
   Then open `output_v2/SRS/SRS.html` (or SDD/STD) in a browser to see the new figure.
8. **Generate PDFs** as needed (per `output_v2/README.md`).
9. **Commit** the updated PNGs:
   ```sh
   cd /Users/Areeb/Quizify
   git add documents_psm2/
   git commit -m "docs: redraw <figure names> in Draw.io to match PSM2 implementation"
   git push origin main
   ```

---

## 5. Quick checklist — what you must NOT forget

Use this as a final pass-through after your redraws:

- [ ] All **state machine** diagrams use only the 3 valid states for `mini_courses`: `Generating`, `Ready`, `Shared`.
- [ ] All **ERD** diagrams show 6 tables: `materials`, `material_chunks`, `mini_courses`, `quizzes`, `questions`, `quiz_attempts`. No `User`/`Admin`/`Lecturer`/`Student`/`QuizOption`/`Submission`/`SubmissionAnswer`/`Document`/`Lesson` tables.
- [ ] All **sequence** diagrams have a single `Supabase` lane (not `Database` + `File Storage` + `Vector Store`).
- [ ] All **login** diagrams show `Sign in with Google` (not email+password).
- [ ] All **materials upload** diagrams show **PDF + PPTX** support.
- [ ] All **course generation** diagrams show the `preview` → `confirm` two-step.
- [ ] All **analytics** diagrams show topic performance, Bloom's performance, SOLO performance, cross-matrix (not just a flat submissions table).
- [ ] All **quiz** diagrams show `option_a..d` columns (not a separate `QuizOption` table).
- [ ] All **UI screenshots** show QUIZIFY branding (not CES-SAIL).
- [ ] All filenames match the originals in `documents_psm2/{SRS,SDD}/artifacts/`.
- [ ] No new images added (the .md files are hard-linked to the current filenames).
- [ ] Commit + push after each meaningful batch of updates.
