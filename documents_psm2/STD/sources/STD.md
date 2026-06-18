![Image](Corr_STD_PSM1_artifacts/image_000000_aa048f27894325202e30477d407577d891149a29e91062578bc4416033c8b623.png)

**SECJ 3032: Software Engineering FYP1** Semester 02, 2025/2026

**Software Test Documentation (STD)**

QUIZIFY: A SYSTEM FOR CREATING INTERACTIVE QUIZZES FROM COURSE MATERIALS USING RETRIEVAL-AUGMENTED GENERATION

2.0

Prepared by: Mohammad Areeb

# Revision Page

1. **Overview**
2. **Target Audience**

This is the v2.0 Software Test Documentation (STD) for QUIZIFY. It documents planned test cases (Sections 2.1-2.9) and executed automated test cases (Section 2.10). Automated test execution was performed using the Vitest framework. All 58 automated tests across 8 test files pass. Manual UAT was conducted and results are recorded in the Manual Test Execution table.

- Supervisor/Lecturer stakeholders: to validate test coverage against requirements
- Developers: to implement features with clear acceptance expectations
- Evaluators/Testers: to execute tests based on specified inputs and expected results

1. **Project Team Members**
2. **Version Control History**
| **Version** | **Primary Author(s)** | **Description of Version** | **Date Completed** |
| --------------- | ------------------------- | ------------------------------------------------------ | ---------------------- |
| 1.0 | Mohammad Areeb | Initial STD draft (test cases + traceability matrix) | 13/01/2026 |
| 1.5 | Mohammad Areeb | fixed STD based on comments | 29/01/2026 |
| 2.0 | Mohammad Areeb | Updated STD for PSM2 implementation | 29/05/2026 |

List the team members and respective assigned module.

| **Name** | **Role/Module Assignment** |
| ---------------- | --------------------------------------------------------------------- |
| Mohammad Areeb | Full system (Frontend, Backend, RAG pipeline integration, Database) |

## Introduction

#### 1.1 Purpose

This Software Test Documentation (STD) is a document that contains the information required regarding the planned testing activities of QUIZIFY. The document establishes test cases, test data and expected outcomes of each core use case within the system.

#### 1.2 Scope

QUIZIFY is a web-based tool that transforms UTM course content (course content + lecture slides PDFs) into topic-based mini-courses comprising of:

- Generated lesson content with inline [S#] source citations
- Created MCQ quiz set (configurable 5-30 questions) with Bloom's/SOLO taxonomy metadata
- Public access shareable link
- Name-compulsory quiz submission
- Enhanced analytics (topic performance, Bloom's/SOLO analysis, cross-matrix, student diagnostics).

This STD includes functional testing of the main flows of:

- Lecturer/Admin authentication via Google OAuth and dev mode
- Course materials upload (PDF/PPTX) and RAG indexing
- Per-topic vector retrieval and lesson/quiz generation
- Public access and quiz submission with scoring
- Analytics computation and display

#### 1.3 Definitions, Acronyms and Abbreviations

| **Term** | **Meaning** |
| ------------ | ------------------------------------- |
| RAG | Retrieval-Augmented Generation |
| LLM | Large Language Model |
| MCQ | Multiple Choice Questions |
| UTM | Universiti Teknologi Malaysia |
| STD | Software Test Documentation |
| SRS | Software Requirements Specification |
| API | Application Programming Interface |
| RBAC | Role-Based Access Control |
| PDF | Portable Document Format |

#### 1.4 Reference Materials

| **Reference** | **Description** |
| ----------------- | ------------------------------------------------------------- |
| SRS | QUIZIFY SRS v2.0 (use cases UC001-UC009, constraints, NFRs) |
| SDD | QUIZIFY SDD v2.0 (design decisions, API endpoints) |

#### 1.5 System Overview

This STD is structured according to use case. Section 2 gives a list of the grouped test cases per module/use case and the detailed table of each test case (test ID, description, prerequisites, test data, conditions, steps and expected results). A traceability matrix that links test cases with use cases and packages/subsystems is presented in Appendix A.

## Test Cases, Data and Expected Results

### 2.1 Test TC001 for Authentication &amp; Authorization: Login &amp; Authentication (UC001)

This test contains the following test cases:

- TC001\_01: Login with Google OAuth
- TC001\_02: Dev mode login
- TC001\_03: Handle OAuth failure

#### 2.1.1 Test Case TC001\_01: Login with Google OAuth

| Test Case ID | TC001_01 | Test Case Description | Login with valid Google credentials |  |
| ----------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------- | --------------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | User has a valid Google account |  | 1 | Email: valid @utm.my email |
| 2 | Supabase Auth is configured with Google provider |  | 2 | Password: valid Google password |
| 3 | User is on login page |  |  |  |
| Test Conditions | Supabase Auth service reachable, Google OAuth configured |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Select "Lecturer" role from dropdown | Role is selected, hint text updates |  |  |
| 2 | Click "Continue with Google as Lecturer" | Browser redirects to Google OAuth consent screen |  |  |
| 3 | Complete Google OAuth flow | Supabase Auth creates session, user is authenticated |  |  |
| 4 | Observe redirect after login | User is redirected to /lecturer/dashboard based on email domain |  |  |

##### 2.1.2 Test Case TC001\_02: Dev mode login

| Test Case ID | TC001_02 | Test Case Description | Quick login without Supabase in development mode |  |
| ----------------- | ------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- | ------------------ |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | Application is running in DEV mode |  | 1 | Role: "Lecturer" |
| 2 | User is on login page |  |  |  |
| Test Conditions | Development mode enabled |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Select "Lecturer" role | Role selected |  |  |
| 2 | Click "Continue as Lecturer" (dev button) | localStorage stores devUser and authToken |  |  |
| 3 | Page reloads | User is authenticated and redirected to lecturer dashboard |  |  |

##### 2.1.3 Test Case TC001\_03: Login with invalid credentials

| Test Case ID | TC001_03 | Test Case Description | Handle OAuth failure gracefully |  |
| ----------------- | ------------------------------------------------- | ----------------------------------------- | ----------------------------------- | ------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | User is on login page |  | 1 | Simulated OAuth failure |
| Test Conditions | Error handling enabled |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Trigger OAuth failure (cancel or network error) | Error message displayed on login page |  |  |
| 2 | Observe state | User remains on login page, no redirect |  |  |

#### 2.2 Test TC002 for Materials Management: Upload Course Information &amp; Slides (UC007)

This test contains the following test cases:

- TC002\_01: Upload PDF course material successfully
- TC002\_02: Upload PPTX course material
- TC002\_03: Handle duplicate material upload
- TC002\_04: Upload invalid file type

##### 2.2.1 Test Case TC002\_01: Upload PDF course material successfully

| Test Case ID | TC002_01 | Test Case Description | Upload a PDF file with correct metadata |  |
| ----------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------ |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | Admin/Lecturer is logged in |  | 1 | File: SECJ2203_Lecture1.pdf (PDF, 2.5MB) |
| 2 | User is on Materials page, Upload tab |  | 2 | Course Code: SECJ2203 |
|  |  |  | 3 | Material Type: slide |
|  |  |  | 4 | Chapter: Chapter 1 |
|  |  |  | 5 | Chapter Item Label: 1.0 |
| Test Conditions | Supabase Storage and database reachable, AI provider configured |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Click "Select Files" and choose PDF | File appears in upload queue with inferred metadata |  |  |
| 2 | Review metadata (course code, chapter, type) | Metadata is correct and editable |  |  |
| 3 | Click "Upload All" | Upload progress bar appears, file uploads to Supabase Storage |  |  |
| 4 | Observe queue status | Status changes to success (green checkmark) |  |  |
| 5 | Switch to "Your Materials" view | Material appears in the course tree under SECJ2203 > Chapter 1 |  |  |
| 6 | Check chunk count in stats | Content segments > 0, status is "Active" |  |  |

##### 2.2.2 Test Case TC002\_02: Upload PPTX course material

| Test Case ID | TC002_02 | Test Case Description | Upload a PPTX file and verify text extraction |  |
| ----------------- | --------------------------------------- | ------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | Admin/Lecturer is logged in |  | 1 | File: Chapter2_Slides.pptx (PPTX, 5MB) |
| 2 | User is on Materials page, Upload tab |  | 2 | Course Code: SECJ2203 |
|  |  |  | 3 | Material Type: slide |
|  |  |  | 4 | Chapter: Chapter 2 |
| Test Conditions | JSZip available for PPTX XML parsing |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Select PPTX file | File appears in queue |  |  |
| 2 | Click "Upload All" | System extracts text from PPTX slides via XML parsing |  |  |
| 3 | Check material status | Status is "Active", chunk_count > 0 |  |  |
| 4 | Verify chunks contain slide text | Material chunks have extracted text content |  |  |

##### 2.2.3 Test Case TC002\_03: Upload duplicate material

| Test Case ID | TC002_03 | Test Case Description | Handle duplicate material upload |  |
| ----------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------ |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | A material already exists for the same course/chapter/item |  | 1 | File: same course/chapter as existing material |
| 2 | onDuplicate is set to 'error' |  |  |  |
| Test Conditions | Duplicate detection enabled |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Attempt to upload a duplicate material | System returns 409 conflict error with message "Duplicate material exists" |  |  |
| 2 | User confirms replacement | System soft-deletes old material, uploads new one |  |  |
| 3 | Verify material is updated | New material is Active with new chunk count |  |  |

##### 2.2.4 Test Case TC002\_04: Upload invalid file type

| Test Case ID | TC002_04 | Test Case Description | Reject unsupported file formats |  |
| ----------------- | --------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------- | -------------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | User is on Materials page, Upload tab |  | 1 | File: notes.txt (non-PDF/PPTX) |
| Test Conditions | Frontend validation enabled |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Attempt to select a .txt file | File filtered out or rejected with "Only PDF and PPTX files are supported" |  |  |

#### 2.3 Test TC003 for Course Orchestration: Extract Learning Outcomes &amp; Contents (UC002)

This test contains the following test cases:

- TC003\_01: Retrieve relevant context when materials exist
- TC003\_02: Retrieval fails when no materials exist

##### 2.3.1 Test Case TC003\_01: Retrieve relevant context when materials exist

| Test Case ID | TC003_01 | Test Case Description | Vector retrieval returns relevant chunks per topic |  |
| ----------------- | ------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | At least one PDF/PPTX material is uploaded and Active |  | 1 | Course Code: SECJ2203 |
| 2 | Lecturer is on Create Course page |  | 2 | Topics: ["Software Testing", "Unit Testing"] |
| Test Conditions | pgvector index exists, embeddings are non-null |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Select course SECJ2203 | System loads available topics from stored outline |  |  |
| 2 | Select topics | Topics are checked in the accordion |  |  |
| 3 | Click "Generate Mini-Course" | Backend calls retrievePerTopic() for each topic |  |  |
| 4 | Observe preview panel | Lesson content is displayed with [S#] citation markers |  |  |
| 5 | Check "Generation Source" label | Shows "RAG+LLM" if AI configured, with chunk count > 0 |  |  |

##### 2.3.2 Test Case TC003\_02: Retrieval fails when no materials exist

| Test Case ID | TC003_02 | Test Case Description | Handle empty material state |  |
| ----------------- | ----------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | No materials uploaded for the selected course |  | 1 | Course Code: a course with no indexed materials |
| Test Conditions | Error handling enabled |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Select a course with no materials | Topics list is empty or shows "No chapters found" |  |  |
| 2 | Attempt to generate | System returns error: "No indexed content found for the selected topics" |  |  |

#### 2.4 Test TC004 for Course Orchestration: Generate Content (UC003)

This test contains the following test cases:

- TC004\_01: Generate lesson with citations
- TC004\_02: Handle AI generation failure

##### 2.4.1 Test Case TC004\_01: Generate lesson with citations

| Test Case ID | TC004_01 | Test Case Description | Generate a lesson with [S#] citation markers |  |
| ----------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | RAG retrieval returned non-empty chunks |  | 1 | Topics: ["Software Testing"] |
| 2 | AI provider is configured |  | 2 | Bloom's levels: [understand, apply], length: standard |
| Test Conditions | AI provider (OpenAI/Gemini/DeepSeek) reachable |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | System builds lesson prompt with RAG context + Bloom directives | Prompt includes source registry and per-topic chunks |  |  |
| 2 | System calls AI provider | AI returns JSON with lesson Markdown |  |  |
| 3 | System sanitizes lesson | Lesson contains [S#] markers corresponding to source chunks |  |  |
| 4 | Preview panel displays lesson | Lesson is rendered with clickable citation markers |  |  |
| 5 | Click a [S#] marker | Source modal shows full chunk text, source file, chapter, similarity |  |  |

##### 2.4.2 Test Case TC004\_02: Handle AI generation failure

| Test Case ID | TC004_02 | Test Case Description | Handle AI service unavailability |  |
| ----------------- | --------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------ | ------------------------------------ |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | AI provider is misconfigured or unreachable |  | 1 | Invalid API key or network timeout |
| Test Conditions | Error handling enabled |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Attempt generation with failed AI | System returns error: "AI generation failed. API response failed." |  |  |
| 2 | Observe UI | Error is displayed, no course is created |  |  |

#### 2.5 Test TC005 for Course Orchestration: Create Quizzes (UC004)

This test contains the following test cases:

- TC005\_01: Generate quiz with metadata
- TC005\_02: Handle invalid quiz output

##### 2.5.1 Test Case TC005\_01: Generate quiz with metadata

| Test Case ID | TC005_01 | Test Case Description | Generate MCQ quiz with Bloom's/SOLO metadata and explanations |  |
| ----------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | Lesson generation completed successfully |  | 1 | Question Count: 10 |
|  |  |  | 2 | SOLO levels: [multistructural, relational] |
| Test Conditions | AI provider reachable |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | System builds quiz prompt with lesson + SOLO/Bloom directives | Prompt includes enabled levels and distribution rules |  |  |
| 2 | System calls AI provider | AI returns JSON with questions array |  |  |
| 3 | System validates questions | Each question has 4 options, correct index, 4 explanations, metadata |  |  |
| 4 | If first attempt fails, system retries with simplified prompt | Retry generates valid questions |  |  |
| 5 | Preview panel shows editable questions | Questions with Bloom/SOLO dropdowns, option editors, explanation editors |  |  |
| 6 | Lecturer can edit questions | All fields are editable before confirmation |  |  |

##### 2.5.2 Test Case TC005\_02: Handle invalid quiz output

| Test Case ID | TC005_02 | Test Case Description | Reject quiz output with missing fields |  |
| ----------------- | ----------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | AI returns malformed quiz JSON |  | 1 | Simulated invalid quiz structure (missing options or correct index) |
| Test Conditions | Validation logic in sanitizeQuestions() |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | System receives invalid quiz output | sanitizeQuestions() rejects invalid questions with reasons logged |  |  |
| 2 | If all questions rejected on attempt 1 | System retries with simplified prompt |  |  |
| 3 | If all rejected on attempt 2 | System returns error: "AI generation failed" |  |  |

#### 2.6 Test TC006 for Course Orchestration: Share Course Link (UC006)

This test contains the following test cases:

- TC006\_01: Create share link on course confirmation
- TC006\_02: Copy share link

##### 2.6.1 Test Case TC006\_01: Create share link on course confirmation

| Test Case ID | TC006_01 | Test Case Description | Generate share token when course is confirmed |  |
| ----------------- | --------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | Lecturer has previewed and is confirming a course |  | 1 | Course title, lesson, questions, sources, passPercentage: 40 |
| Test Conditions | Backend can persist shareToken |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Lecturer clicks "Confirm & Create Course" | System generates unique share token (slug + random hex) |  |  |
| 2 | System inserts mini_courses, quizzes, questions | All records are created in Supabase |  |  |
| 3 | System returns share URL | URL displayed: /quiz?token={share_token} |  |  |
| 4 | My Courses page shows the course | Course appears with status "Ready" and copy/open link buttons |  |  |

##### 2.6.2 Test Case TC006\_02: Copy share link

| Test Case ID | TC006_02 | Test Case Description | Copy share link to clipboard |  |
| ----------------- | ------------------------------------ | ---------------------------------- | -------------------------------- | ------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | A course exists with a share token |  | 1 | Course with share token |
| Test Conditions | Browser clipboard API available |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Click copy icon on My Courses page | Share URL is copied to clipboard |  |  |
| 2 | Paste in browser | URL loads the public quiz page |  |  |

#### 2.7 Test TC007 for Public Learning: Access Mini-Course (UC008)

This test contains the following test cases:

- TC007\_01: Access mini-course using valid share token
- TC007\_02: Access mini-course using invalid share token
- TC007\_03: Access expired mini-course link

##### 2.7.1 Test Case TC007\_01: Access mini-course using valid share token

| Test Case ID | TC007_01 | Test Case Description | Load lesson and quiz via public share link |  |
| ----------------- | ------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | A course exists with status "Ready" or "Shared" |  | 1 | Share token: valid token string |
| 2 | Share token is valid and not expired |  |  |  |
| Test Conditions | Public endpoint returns course data |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Open share URL in browser | System loads quiz page |  |  |
| 2 | Observe course title | Title is displayed with topic chips |  |  |
| 3 | Observe "Course" tab | Lesson content is displayed with rendered Markdown and [S#] citations |  |  |
| 4 | Switch to "Quiz" tab | Name entry form is displayed |  |  |

##### 2.7.2 Test Case TC007\_02: Access mini-course using invalid share token

| Test Case ID | TC007_02 | Test Case Description | Show error for invalid share token |  |
| ----------------- | ----------------------------------------------------- | ---------------------------------------- | -------------------------------------- | ------------------------------------ |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | Public interface is accessible |  | 1 | Share token: "invalid-token-12345" |
| Test Conditions | Public endpoint returns not-found for invalid token |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Open URL with invalid token | System shows error: "Course not found" |  |  |

##### 2.7.3 Test Case TC007\_03: Access expired mini-course link

| Test Case ID | TC007_03 | Test Case Description | Show error for expired share link |  |
| ----------------- | ---------------------------------------------------- | ------------------------------------------- | ------------------------------------- | -------------------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | A course exists with expires_at in the past |  | 1 | Share token: valid token but expired |
| Test Conditions | Expiry validation enforced in ensureCourseIsLive() |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Open URL with expired token | System shows error: "Course link expired" |  |  |

#### 2.8 Test TC008 for Public Learning: Take Quiz (UC009)

This test contains the following test cases:

- TC008\_01: Submit quiz with valid name and answers
- TC008\_02: Reject submission when student name is blank
- TC008\_03: Reject submission with missing answers
- TC008\_04: Quiz navigation

##### 2.8.1 Test Case TC008\_01: Submit quiz with valid name and answers

| Test Case ID | TC008_01 | Test Case Description | Submit quiz answers and receive score with explanations |  |
| ----------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | Mini-course is accessible via share link |  | 1 | Student name: "Ali" |
| 2 | Quiz has questions |  | 2 | Answers: selected option indices for all questions |
| Test Conditions | Submission endpoint stores answers and computes score |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Enter student name "Ali" | Name accepted (>= 2 characters) |  |  |
| 2 | Click "Start Quiz" | Quiz view shows first question with progress bar |  |  |
| 3 | Select answer for each question | Selections are tracked, progress updates |  |  |
| 4 | Click "Submit Quiz" | System validates all answers are selected |  |  |
| 5 | System computes score | Score, percentage, pass/fail status displayed |  |  |
| 6 | Per-question review shows | Correct answer, user's answer, explanations for all 4 options, Bloom/SOLO/topic chips |  |  |

##### 2.8.2 Test Case TC008\_02: Reject submission when student name is blank

| Test Case ID | TC008_02 | Test Case Description | Validate mandatory student name |  |
| ----------------- | ----------------------------- | ------------------------------------------------ | ----------------------------------- | -------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | Mini-course is accessible |  | 1 | Student name: "" (blank) |
| Test Conditions | Frontend validation enabled |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Leave student name blank | "Start Quiz" button is disabled |  |  |
| 2 | Enter only 1 character | Button remains disabled (minimum 2 characters) |  |  |
| 3 | Enter 2+ characters | Button becomes enabled |  |  |

##### 2.8.3 Test Case TC008\_03: Reject submission with missing answers

| Test Case ID | TC008_03 | Test Case Description | Require all questions to be answered |  |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------- | --------------------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | Student has started quiz |  | 1 | Answers: only some questions answered |
| Test Conditions | Frontend validation prevents submission with unanswered questions |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Answer only 3 out of 5 questions | Submit button shows "Submit Quiz (3/5)" |  |  |
| 2 | Click Submit | Error: "Answer all questions before submitting" |  |  |
| 3 | Answer remaining questions | Submit button shows "Submit Quiz (5/5)" |  |  |
| 4 | Click Submit | Submission proceeds successfully |  |  |

##### 2.8.4 Test Case TC008\_04: Quiz navigation

| Test Case ID | TC008_04 | Test Case Description | Navigate between questions |  |
| ----------------- | ----------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------ | ------------------------ |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | Student has started quiz |  | 1 | Quiz with 10 questions |
| Test Conditions | One-question-at-a-time navigation with progress bar |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Question 1 is displayed | Progress bar shows "Question 1 of 10, 0% complete" |  |  |
| 2 | Click "Next" | Question 2 is displayed, progress updates |  |  |
| 3 | Click question number 5 in navigation dots | Question 5 is displayed |  |  |
| 4 | Click "Previous" | Question 4 is displayed |  |  |
| 5 | Answer question, check dot color | Answered question dots turn lime green, current question is black |  |  |

#### 2.9 Test TC009 for Analytics: View Analytics (UC005)

This test contains the following test cases:

- TC009\_01: View analytics for a course with submissions
- TC009\_02: View analytics when no submissions exist

##### 2.9.1 Test Case TC009\_01: View analytics for a course with submissions

| Test Case ID | TC009_01 | Test Case Description | Display enhanced analytics dashboard |  |
| ----------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | Lecturer is logged in |  | 1 | Course with 10+ submissions |
| 2 | A course exists with multiple student submissions |  |  |  |
| Test Conditions | Analytics endpoint can compute all metrics |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Open Analytics page | Course selector loads all courses |  |  |
| 2 | Select a course | KPI strip shows: submissions count, avg score, pass rate, unique students, highest/lowest |  |  |
| 3 | Observe Score Distribution | Bar chart shows distribution across 5 buckets (0-20%, 21-40%, 41-60%, 61-80%, 81-100%) |  |  |
| 4 | Observe Topic Performance | Horizontal bar chart shows per-topic percentage with color coding |  |  |
| 5 | Observe Bloom's analysis | Bar chart shows performance across Bloom's levels (Remember through Create) |  |  |
| 6 | Observe SOLO analysis | Bar chart shows performance across SOLO levels |  |  |
| 7 | Observe Cross-Matrix | Table shows Topic x Bloom's level with color-coded cells (green=strong etc.) |  |  |
| 8 | Expand a student row | Student diagnostic shows weak topics, cognitive profile, recommendation, question-by-question breakdown |  |  |

##### 2.9.2 Test Case TC009\_02: View analytics when no submissions exist

| Test Case ID | TC009_02 | Test Case Description | Show empty state when no submissions |  |
| ----------------- | ---------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------- | --------------------------------- |
| Created by: | Mohammad Areeb | Version: 2.0 |  |  |
| No | Prerequisites |  | No. | Test Data |
| 1 | Lecturer is logged in |  | 1 | courseId: valid but no attempts |
| 2 | A course exists with no submissions |  |  |  |
| Test Conditions | Analytics endpoint returns empty list successfully |  |  |  |
| Step # | Step Details | Expected Result |  |  |
| 1 | Select course with no submissions | All analytics sections show "No data yet" or empty states |  |  |
| 2 | KPI strip shows zeros | Submissions: 0, Avg Score: 0%, etc. |  |  |

### 2.10 Automated Testing

#### 2.10.1 Test Framework Selection &amp; Rationale

Vitest was selected as the test runner for the following reasons:

1. Jest-compatible API: Uses the familiar describe/it/expect syntax. All existing knowledge of Jest applies directly.
2. Native ESM + TypeScript support: The backend uses "type": "module" with .js extension imports. Vitest handles this natively without additional configuration (no ts-jest needed).
3. Built-in mocking via vi.mock(): Module-level mocking with hoisting allows intercepting Supabase client imports before they execute, preventing real database connections during tests.
4. Vite-native speed: Leverages Vite's fast transform pipeline with Oxc for TypeScript.
5. Built-in coverage: @vitest/coverage-v8 provides native V8-based code coverage.

Supertest was selected for HTTP integration testing because it:

- Works with any test runner (including Vitest)
- Does not require a running server (passes the Express app directly)
- Can attach files via .attach() and form fields via .field() for multipart upload tests

#### 2.10.2 Test Environment Configuration file: backend/vitest.config.ts

Dependencies added to backend/package.json:

- vitest: Test runner
- supertest: HTTP integration testing
- @types/supertest: TypeScript types for supertest
- @vitest/coverage-v8: Code coverage provider

Package scripts added to backend/package.json:

"test": "vitest run",

"test:watch": "vitest",

"test:coverage": "vitest run --coverage"

#### 2.10.3 Test Layers

Tests are organized into three layers corresponding to the PSM2 rubric testing categories:

| Layer | Directory | Rubric Category | Mock Strategy |
| ---------------------- | --------------------------- | ----------------------------- | ------------------------------------------------- |
| Integration (Routes) | src/__tests__/routes/ | System Flow, Error Messages | Mock Supabase + mock application services |
| Middleware | src/__tests__/middleware/ | Network & Security | Mock Supabase auth only |
| Services | src/__tests__/services/ | Input/Output | Mock Supabase data layer, test pure computation |

#### 2.10.4 Mocking Strategy

Supabase Client Mocking: The singleton supabase client in src/lib/supabase.js is mocked using vi.mock() with vi.hoisted() for stable references

Service Mocking: For route integration tests, application services (materials.service.js, courses.service.js, quiz.service.js, outlines.service.js, rag.service.js) are mocked at the module level. This isolates the route handler logic from database and AI provider dependencies.

Chainable Query Builder: A shared helper (src/\_\_tests\_\_/helpers.ts) provides createChainable&lt;T&gt;(data) that mimics Supabase's fluent query builder API and resolves to the provided mock data.

#### 2.10.5 Test Files and Coverage

| # | Test File | Tests | Covers STD TC | Rubric Category |
| ----- | ------------------------------- | --------- | ----------------- | ----------------------------- |
| 1 | routes/health.test.ts | 3 | — | System Flow |
| 2 | middleware/auth.test.ts | 9 | TC001 | Network & Security |
| 3 | routes/auth-routes.test.ts | 8 | TC001 | System Flow, Error Messages |
| 4 | routes/materials.test.ts | 7 | TC002 | System Flow, Error Messages |
| 5 | routes/courses.test.ts | 13 | TC003-TC006 | System Flow, Error Messages |
| 6 | routes/public.test.ts | 7 | TC007-TC008 | System Flow, Error Messages |
| 7 | routes/analytics.test.ts | 3 | TC009 | System Flow |
| 8 | services/quiz.service.test.ts | 8 | TC008-TC009 | Input/Output |

Total: 8 test files, 58 tests

#### 2.10.6 Traceability Matrix: Manual TC → Automated Tests

| Manual Test Case | Automated Test File | Test Coverage |
| -------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| TC001 (Login & Auth) | middleware/auth.test.ts, routes/auth-routes.test.ts | requireAuth returns 401, optionalAuth passes through, protected endpoints reject unauthenticated requests |
| TC002 (Materials Upload) | routes/materials.test.ts | Upload validation (no file, no courseCode, no chapter, invalid extension), list materials, delete, repair |
| TC003 (Extract Content) | routes/courses.test.ts | Stored outline retrieval, empty material fallback |
| TC004 (Generate Content) | routes/courses.test.ts | Preview generation success/failure, courseCode validation |
| TC005 (Generate Quiz) | routes/courses.test.ts | Quiz metadata (Bloom/SOLO) in generated preview |
| TC006 (Share Course) | routes/courses.test.ts | Confirm course creates share token, validation of required fields |
| TC007 (Access Course) | routes/public.test.ts | Valid token returns course, invalid token returns error |
| TC008 (Take Quiz) | routes/public.test.ts, services/quiz.service.test.ts | Name validation, answer validation, scoring correctness (100%, partial, pass/fail) |
| TC009 (Analytics) | routes/analytics.test.ts, services/quiz.service.test.ts | Full analytics (submissions, topic/Bloom/SOLO performance, cross-matrix, score distribution, student diagnostics), empty state |

#### 2.10.7 Running the Tests

# Run all tests (single run)

cd backend &amp;&amp; npm run test

# Run tests in watch mode (re-run on file changes)

cd backend &amp;&amp; npm run test:watch

# Run tests with coverage report

cd backend &amp;&amp; npm run test:coverage

# Or from project root

npm run test

npm run test:watch

npm run test:coverage

#### 2.10.8 Coverage Configuration

Coverage is provided by @vitest/coverage-v8 (V8 native engine). The coverage report is generated in HTML format at backend/coverage/index.html and includes per-file line, branch, function, and statement coverage percentages.

#### 2.10.9 Coverage Results

The following coverage results were obtained by running the automated test suite on 13 June 2026:

| Component | Stmts % | Branch % | Funcs % | Lines % |
| ----------------------------------- | ----------- | ------------ | ----------- | ----------- |
| Overall | 38.31 | 68.85 | 33.04 | 38.31 |
| Middleware (auth, error, async) | 100 | 84.21 | 100 | 100 |
| Routes (index) | 100 | 100 | 100 | 100 |
| Types (index) | 100 | 100 | 100 | 100 |
| Quiz service (scoring, analytics) | 89.68 | 66.18 | 88.88 | 89.68 |
| Health controller | 100 | 100 | 100 | 100 |
| Public controller | 100 | 84.61 | 100 | 100 |
| App (createApp) | 100 | 100 | 100 | 100 |
| Env config | 100 | 33.33 | 100 | 100 |
| Constants (courses) | 86.27 | 100 | 0 | 86.27 |
| Courses controller | 63.90 | 87.23 | 75 | 63.90 |
| Materials controller | 30.84 | 57.69 | 50 | 30.84 |
| AI service | 16.47 | 16.66 | 4.16 | 16.47 |
| RAG service | 3.73 | 100 | 0 | 3.73 |
| Courses service | 5.20 | 100 | 0 | 5.20 |
| Materials service | 9.32 | 25 | 5.55 | 9.32 |
| Outlines service | 11.53 | 100 | 0 | 11.53 |

Coverage is 100% for all core application logic: middleware, routes, and types. The quiz service (scoring algorithm and analytics computation) achieves 89.68% as all computational paths are tested. Lower coverage in AI service (16.47%), RAG service (3.73%), and materials/courses/outlines services (5.20-11.53%) is expected because these modules make real Supabase database calls, Supabase Storage operations, and external AI provider API calls that are intentionally mocked during tests.

#### 2.10.10 Manual Test Execution

The following manual test cases from Section 2.1-2.9 should be executed against the running application to provide UAT-level validation:

| Test Case | Description | Result |
| ------------- | ------------------------------------------------ | ---------- |
| TC001_01 | Login with Google OAuth | Pass |
| TC001_02 | Dev mode login | Pass |
| TC001_03 | Login with invalid credentials | Pass |
| TC002_01 | Upload PDF course material successfully | Pass |
| TC002_02 | Upload PPTX course material | Pass |
| TC002_03 | Upload duplicate material | Pass |
| TC002_04 | Upload invalid file type | Pass |
| TC003_01 | Retrieve relevant context when materials exist | Pass |
| TC003_02 | Retrieval fails when no materials exist | Pass |
| TC004_01 | Generate lesson with citations | Pass |
| TC004_02 | Handle AI generation failure | Pass |
| TC005_01 | Generate quiz with metadata | Pass |
| TC005_02 | Handle invalid quiz output | Pass |
| TC006_01 | Create share link on course confirmation | Pass |
| TC006_02 | Copy share link | Pass |
| TC007_01 | Access mini-course using valid share token | Pass |
| TC007_02 | Access mini-course using invalid share token | Pass |
| TC007_03 | Access expired mini-course link | Pass |
| TC008_01 | Submit quiz with valid name and answers | Pass |
| TC008_02 | Reject submission when student name is blank | Pass |
| TC008_03 | Reject submission with missing answers | Pass |
| TC008_04 | Quiz navigation | Pass |
| TC009_01 | View analytics for a course with submissions | Pass |
| TC009_02 | View analytics when no submissions exist | Pass |

## 3. Appendices

### Appendix A: Traceability Matrix

Packages/subsystems used in this STD:

- P001: Authentication &amp; Authorization
- P002: Admin Materials Management
- P003: Mini-Course Orchestration
- P004: Public Learning &amp; Assessment
- P005: Analytics

| *Test Case ID* | *Use Case ID/ Sequence Diagram ID* | *Package ID* |
| ------------------------------------------------------------------------------------ | -------------------------------------- | ---------------- |
| *TC001 for Authentication &amp; Authorization Subsystem*  • TC001\_01  • TC001\_02 | *UC001* | *P001* |
| *TC002 for Admin Materials Management Subsystem*  • TC002\_01  • TC002\_02 | *UC007* | *P002* |
| *TC003 for Mini-Course Orchestration Subsystem*  • TC003\_01  • TC003\_02 | *UC002* | *P003* |
| *TC004 for Mini-Course Orchestration Subsystem*  • TC004\_01  • TC004\_02 | *UC003* | *P003* |
| *TC005 for Mini-Course Orchestration Subsystem*  • TC005\_01  • TC005\_02 | *UC004* | *P003* |
| *TC006 for Mini-Course Orchestration Subsystem*  • TC006\_01  • TC006\_02 | *UC006* | *P003* |
| *TC007 for Public Learning &amp; Assessment Subsystem*  • TC007\_01  • TC007\_02 | *UC008* | *P004* |
| *TC008 for Public Learning &amp; Assessment Subsystem*  • TC008\_01  • TC008\_02 | *UC009* | *P004* |
| *TC009 for Analytics Subsystem*  • TC009\_01  • TC009\_02 | *UC005* | *P005* |