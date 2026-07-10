# Response to Comment & Documentation Changes

---

## RESPONSE TO COMMENT FORM

| # | Comment from Evaluators | Response to comment | Evidence |
|---|---|---|---|
| 1 | **Justify "Interactive" and generate questions dynamically.** The title says "Interactive Quiz System" but quizzes are static. Recommend generating questions based on student performance to personalise learning and better justify AI and RAG. | Added interactive justification in Chapter 1 (Section 1.1) and implemented a "Practice Weak Topics" loop. After quiz submission, weak topics (<70% correct), weakest Bloom's level, and every wrong question are identified from the attempt. Student clicks "Practice Weak Topics" on the breakdown page, triggering a new RAG-grounded AI generation that creates a personalized mini-course targeting only those weak areas. The loop: quiz → analytics → targeted practice → quiz. Practice courses are stored with `parent_course_id` linking to the original and appear nested in "Practice Sessions". One attempt per student per course enforced by UNIQUE constraint. | [Screenshot: Practice button in Weak Topics column + Practice Sessions] |
| 2 | **Prevent AI-assisted cheating.** Students can copy questions and ask external AI. Recommend disabling copy-paste, adding timers, randomizing questions per student, and recording suspicious activity. | Implemented: (a) quiz card uses `user-select: none` with event listeners blocking copy/cut/paste/contextmenu/selectstart/dragstart, (b) total quiz timer = `questions × 120s` countdown, quiz auto-submits on expiry, (c) server-side question randomization via `shuffleArray()`, (d) one attempt per student per course via UNIQUE constraint (duplicate returns 409), (e) tab-switch detection logged to `quiz_attempts.suspicious_activity`. | [Screenshot: Timer bar + copy-paste blocking] |
| 3 | **Improve the evaluation.** The report shows the system works but should evaluate how effective AI-generated questions are: accuracy, relevance, and faithfulness to source materials. | Added Section 5.4.4. Three courses (SECJ2154, SECD2613, SECR1013) evaluated across 45 questions: retrieval quality (mean similarity 0.61 across 74 chunks), citation grounding (2.2 citations per paragraph), and question fidelity (91.1%). Unverifiable cases are higher-order synthesis questions, not hallucinations. Full methodology in the report. | See Section 5.4.4 |

---

## MINIMAL DOCUMENTATION CHANGES

### A. Full_Report.md : 5 changes

**1. Section 1.1 (Introduction) : Justify "Interactive"**

Insert after first paragraph:
> The system is termed "interactive" because it creates a two-way learning loop: students receive immediate corrective feedback with per-option explanations after every answer, clickable inline source citations [S#] reveal original lecture text in modals, and an on-demand "Practice Weak Topics" feature uses analytics from a prior quiz attempt to generate a personalized mini-course targeting that student's specific weak areas, forming an adaptive quiz → practice → quiz cycle.

**2. Section 4.2.2 (Non-Functional Requirements) : Add NFR-008**

In Table 7, add after NFR-008 (Privacy):
> | NFR-008 | Assessment Integrity | Quiz blocks copy-paste (CSS `user-select: none` + JS event listeners). Total quiz timer (questions × 120s) auto-submits on expiry. Question order randomized via server-side `shuffleArray()`. One attempt per student per course via UNIQUE constraint. Tab-switch activity logged to `suspicious_activity` JSONB. |

**3. Section 5.2.2 (Implementation) : Extend UC009 description**

Append to the UC009 paragraph:
> After submission, the student can view a breakdown page showing weak topics, cognitive profile, and recommendations. A "Practice Weak Topics" button inside the Weak Topics column triggers a new RAG-grounded AI generation producing a personalized mini-course with [S#] citations. The AI prompt includes: weak topic scores, wrong questions with student vs. correct answers, cognitive profile (strongest topic, weakest Bloom's level), and source chunks retrieved via pgvector vector search. Practice courses are stored with `parent_course_id` linking to the original and appear in a "Practice Sessions" section on the breakdown page. Students can loop: quiz → practice → new quiz → practice again.

**4. Section 5.3 (API Endpoints) : Add practice endpoint**

In Table 9, after `/submit`:
> | UC009 | POST | /api/public/course/:token/practice | requireAuth |

**5. Section 5.4.4 : Insert Evaluation of AI-Generated Content**

Insert the entire content from `/Users/Areeb/Quizify/documentation/section_5_4_4_evaluation.md` between Section 5.4.3 (User Acceptance Testing) and Section 5.5 (Chapter Summary).

---

### B. SRS.md : 2 changes

**1. Section 1.2 (Scope) : Add anti-cheating**

After item (l), add:
> (m) Enforce assessment integrity via copy-paste prevention, total quiz timer (questions × 120s), randomized question order, and one attempt per student per course with UNIQUE constraint.

**2. Section 1.10 (Non-Functional Requirements) : Add NFR-008**

In Table 13, after NFR-007:
> | NFR-008 | Assessment Integrity | Quiz blocks copy-paste via CSS + JS event listeners. Total quiz timer auto-submits on expiry. Question order randomized server-side. One attempt per student per course. |

---

### C. SDD.md : 3 changes

**1. Section 1.9 (Information Viewpoint) : Update mini_courses table**

Add to data dictionary:
> | parent_course_id | UUID (nullable) | FK → mini_courses.id | Links practice course to original parent. NULL for root courses. |
> | student_email | TEXT (nullable) | : | Email of student who triggered practice generation. NULL for lecturer-created courses. |

Also add to `quiz_attempts`:
> | suspicious_activity | JSONB (nullable) | : | Logs tab switches, copy attempts during quiz. Format: `{ tabSwitches: N, copyAttempts: N }`. |

**2. Section 1.10.2.1 (REST API Endpoints) : Add practice endpoint**

Add:
> | POST | /api/public/course/:token/practice | Trigger practice course generation from a prior quiz attempt. Returns new share token. |

**3. Section 1.10.2 (Interfaces) : Add anti-cheating UI design**

Insert before 1.10.2.1:
> The quiz card applies `user-select: none` CSS and blocks copy/cut/paste/contextmenu/selectstart/dragstart events with a toast warning. A total quiz timer (questions × 120s) is displayed as a countdown bar; on expiry, the quiz auto-submits with whatever answers were selected. Question order is randomized server-side via `shuffleArray()` per request. The database enforces one attempt per student per course: `quiz_attempts` has a UNIQUE constraint on `(mini_course_id, student_email)`.

---

### D. STD.md : 2 changes

**1. Section TC008 (Take Quiz) : Add anti-cheating test sub-cases**

After TC008_04:
> **TC008_05: Copy-paste prevention** : Text selection disabled on quiz card. Ctrl+C/right-click blocked. Toast warning appears on copy attempt.
> **TC008_06: Total quiz timer** : Timer counts from `questions × 120s`. Persists across navigation. Auto-submits on expiry. Answered and unanswered questions are submitted.
> **TC008_07: Question randomization** : Two different student accounts see different question orders. Order is stable within a single session.
> **TC008_08: One attempt per course** : Duplicate submission returns HTTP 409. Quiz page shows "You have already taken this quiz" with link to breakdown.

**2. Section TC005 (Create Quizzes) : Add practice generation test**

After TC005_02:
> **TC005_03: Practice generation** : After quiz submission, breakdown page shows weak topics (<70% correct). Practice button generates new personalized mini-course via RAG vector search. Wrong questions, cognitive profile, and source citations are included in the AI prompt. Generated course is stored with `parent_course_id`. Practice Sessions section lists child courses with scores and breakdown links.

---

## SUMMARY OF IMPLEMENTED CHANGES

| Examiner Comment | What Changed |
|---|---|
| **#1 : Interactive** | Paragraph justifying interactive learning loop in Chapter 1. |
| **#2 : Dynamic Generation** | Practice Weak Topics loop: RAG vector search, enhanced AI prompt (wrong questions + cognitive profile + source citations), nested hierarchy (`parent_course_id`), Practice Sessions on breakdown page, one attempt per course. |
| **#3 : Anti-Cheating** | Copy-paste prevention, total quiz timer (questions × 120s), question randomization, UNIQUE constraint on attempts, suspicious activity logging. |
| **#4 : Evaluation** | Section 5.4.4: retrieval quality (0.61 mean similarity), citation density (2.2/paragraph), question fidelity (91.1% verifiable). |

**Documentation changes: 12 targeted edits across 4 documents. No new use cases. No new diagrams.**

---

## DATABASE MIGRATION

```sql
-- Deduplicate existing attempts (keep latest per student per course)
DELETE FROM public.quiz_attempts
WHERE id NOT IN (
    SELECT DISTINCT ON (mini_course_id, student_email) id
    FROM public.quiz_attempts
    WHERE student_email IS NOT NULL
    ORDER BY mini_course_id, student_email, submitted_at DESC
);

-- One attempt per student per course
ALTER TABLE public.quiz_attempts
    ADD CONSTRAINT unique_student_course_attempt UNIQUE (mini_course_id, student_email);

-- Practice course support
ALTER TABLE public.mini_courses
    ADD COLUMN IF NOT EXISTS parent_course_id uuid REFERENCES public.mini_courses(id) ON DELETE SET NULL;
ALTER TABLE public.mini_courses
    ADD COLUMN IF NOT EXISTS student_email text;
CREATE INDEX IF NOT EXISTS idx_mini_courses_parent_course_id ON public.mini_courses (parent_course_id);
CREATE INDEX IF NOT EXISTS idx_mini_courses_student_email ON public.mini_courses (student_email);

-- Suspicious activity logging
ALTER TABLE public.quiz_attempts
    ADD COLUMN IF NOT EXISTS suspicious_activity jsonb;
```
