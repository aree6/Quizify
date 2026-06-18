![Image](corr_SRS_PSM1_artifacts/image_000000_aa048f27894325202e30477d407577d891149a29e91062578bc4416033c8b623.png)

**SECJ 3032: Software Engineering FYP1** Semester 02, 2025/2026

**Software Requirements Specification (SRS)**

QUIZIFY: A SYSTEM FOR CREATING INTERACTIVE QUIZZES FROM COURSE MATERIALS USING RETRIEVAL-AUGMENTED GENERATION

2.1

Prepared by: Mohammad Areeb

## 1 Revision Page

### 1.1 Overview

This version (v2.0) of the SRS documents the updated requirements for QUIZIFY, reflecting the actual implementation. Changes from PSM1 (v1.2) include: technology stack migration from Firebase/Pinecone to Supabase PostgreSQL with pgvector, addition of PPTX file support, configurable quiz parameters (question count and pass percentage), enhanced analytics with Bloom's/SOLO Taxonomy analysis, source citation support with inline [S#] markers, editable quiz preview workflow, and course outline extraction. User roles were consolidated so that both Lecturer and Admin can manage materials, with Admin having system-wide visibility.

### 1.2 Target Audience

- **Lecturers/Supervisor** : to validate scope and requirements
- **Developers** : to implement QUIZIFY features
- **Testers/Evaluators** : to verify the system meets requirements

### 1.3 Version Control History

| **Version** | **Primary Author(s)** | **Description of Version** | **Date Completed** |
| --------------- | ------------------------- | -------------------------------------------- | ---------------------- |
| 1.0 | Mohammad Areeb | Initial complete SRS draft (Sections 1, 2) | 05/11/2025 |
| 1.1 | Mohammad Areeb | SRS completed | 01/01/2026 |
| 1.2 | Mohammad Areeb | SRS correction | 29/01/2026 |
| 2.0 | Mohammad Areeb | SRS updated for PSM2 implementation | 28/05/2026 |
| 2.1 | Mohammad Areeb | Updated Images/Diagrams | 10/06/2026 |

### Table of Contents

## 2 Introduction

### 2.1 Purpose

This SRS specifies the requirements for QUIZIFY , a web-based system that transforms UTM course materials (course info + lecture slides in PDF/PPTX format) into topic-based mini-courses consisting of generated lesson content and quizzes. The intended audience includes lecturers/supervisors, developers, and testers.

### 2.2 Scope

**Product name:** QUIZIFY a system for creating interactive quizzes from course materials using retrieval-augmented generation

**What the system will do**

- Allow **lecturers** (authenticated) to generate mini-courses from UTM materials.
- Automatically perform RAG-related operations to:
    - Extract learning outcomes and relevant contents
    - Generate lesson content with inline source citations ([S#] markers)
    - Generate quizzes (MCQ) with configurable question counts (5-30) and Bloom's/SOLO taxonomy tagging
- Support both PDF and PPTX file formats for course materials.
- Provide a shareable course link for students to access without login.
- Allow students to enter name (mandatory) and take quizzes.
- Provide authenticated students (via Google OAuth) access to their quiz attempt history through a student dashboard.
- Provide lecturers enhanced analytics including topic performance, Bloom's Taxonomy analysis, SOLO Taxonomy analysis, cross-matrix analysis, and per-student diagnostics.
- Allow lecturers to preview and edit generated content before publishing.
- Support course outline extraction from course\_info materials.

**What the system will not do**

- No LMS integration (e.g., Moodle) at this stage.
- No collaborative editing or multi-lecturer course co-authoring.
- No mobile native application (web-based only, responsive design).

### 2.3 Definitions, Acronyms and Abbreviations

| **Term** | **Meaning** |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| RAG | Retrieval-Augmented Generation |
| LLM | Large Language Model |
| MCQ | Multiple Choice Questions |
| UTM | Universiti Teknologi Malaysia |
| SRS | Software Requirements Specification |
| PDF | Portable Document Format |
| SOLO | Structure of the Observed Learning Outcome (taxonomy levels: unistructural, multistructural, relational, extended_abstract) |
| Bloom | Bloom's Taxonomy (cognitive levels: remember, understand, apply, analyze, evaluate, create) |

### 2.4 References

- IEEE Std. 830-1998: Recommended Practice for Software Requirements Specifications
- Templates provided in eLearning
- QUIZIFY proposal documents (PSM1 submission)
- Documentation for chosen tooling: React 19, Node.js, Express, Supabase PostgreSQL + pgvector + Auth + Storage, DeepSeek (via OpenRouter), Gemini

### 2.5 Overview

Section 2 describes user roles, system features, launch plan, and detailed user stories with diagrams. Section 3 contains appendices for requirement elicitation evidence and supporting artefacts.

## 3 Specific Requirements

### 3.1 User Roles

#### 3.1.1 User Role 1: Lecturer

**User Need** Lecturer needs a way to generate topic-based mini-courses from course materials and share them with students for learning and assessment, with analytics to track student performance.

**User Stories**

- UC001: As a lecturer, I want to login to the system so that I can access protected QUIZIFY features.
- UC002: As a lecturer, I want the system to extract relevant learning outcomes and contents from UTM materials so that the generated mini-course is aligned with the curriculum.
- UC003: As a lecturer, I want the system to generate lesson content from extracted context with source citations so that students can learn the topic through a grounded lesson.
- UC004: As a lecturer, I want the system to create MCQ quizzes with Bloom's/SOLO taxonomy tagging so that students can assess their understanding at various cognitive levels.
- UC005: As a lecturer, I want to view enhanced analytics (topic performance, Bloom's analysis, cross-matrix) so that I can identify where students struggle.
- UC006: As a lecturer, I want to generate/share a course link so that students can access the mini-course without login.
#### 3.1.2 User Role 2: Admin

**User Need** Admin needs elevated access to manage course materials system-wide.

**User Stories**

- UC001: As a admin, I want to login to the system so that I can access protected QUIZIFY features.
- US007: As an admin, I want to update course information and slides so that the system uses the latest UTM resources

#### 3.1.3 User Role 3: Student

**User Need** Student needs a way to access a mini-course and take the quiz via a share link, and when authenticated, view their past quiz attempt history.

**User Stories**

- UC001: As a student, I want to login to the system so that I can view my past quiz attempt history.
- UC008: As a student, I want to open the shared course link so that I can view the lesson and quiz without logging in.
- UC009: As a student, I want to enter my name and submit my quiz answers so that I can receive my score immediately.

### 3.2 System Features

QUIZIFY is a web-based system that supports lecturers in converting UTM course materials into interactive mini-courses. The system integrates a retrieval-and-generation component to extract relevant learning outcomes and contents, generate lesson content, and create quizzes. Students access the mini-course through a shared link and submit quiz attempts with their name.

The system features are illustrated in **Figure 2.2.1** below. The detailed description of each module and function is tabulated in **Table 2.2.2** .

#### 3.2.1 Use Case Diagram for QUIZIFY

![Image](corr_SRS_PSM1_artifacts/image_000001_876812bd95210e7f0873dd539aa5a733607fab6c600ec8589ed62c3c8235ff3b.png)

[Draw.io](https://drive.google.com/file/d/1pmQGUTRsQPvv_Rlh3O6TXpdZs8178-We/view?usp=sharing)

#### 3.2.2 Table Description of Module and Functions for QUIZIFY

| **Use case** | **Function** |  |
| ---------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| UC001 | Login & Authentication | Authenticates lecturer/admin/student via Google OAuth access protected features and role-based dashboards. |
| UC002 | Extract Learning Outcomes & contents | System retrieves relevant learning outcomes/contents from UTM materials. |
| UC003 | Generate Content | System generates lesson content with inline [S#] citations based on retrieved context. |
| UC004 | Create Quizzes | System generates MCQ quiz set with Bloom's/SOLO taxonomy metadata and per-option explanations. |
| UC005 | View analytics | Lecturer views enhanced analytics including topic performance, Bloom's analysis, SOLO analysis, cross-matrix, and per-student diagnostics. |
| UC006 | Share Course Link | Lecturer generates/shares a public link for student access. |
| UC007 | Update Course Information & Slides | Admin/Lecturer uploads UTM course info and lecture slides (PDF/PPTX) used for retrieval and generation. |
| UC008 | Access Mini-Course | Student opens share link to view lesson and attempt quiz. |
| UC009 | Take Quiz | Student enters name, answers MCQs, submits, receives score. |

#### 3.2.3 Module Decomposition

This section proposes a clean organization of QUIZIFY into modules that map directly to the use cases (UC001–UC009) and reduce coupling.

##### 3.2.3.1 Proposed Modules

##### 3.2.3.2 Authentication &amp; Authorization Module

**Responsibility** : Identity, session/token management via Supabase Auth (Google OAuth), role checks (Lecturer, Admin, Student).

**Use cases covered**

- UC001: Login &amp; Authentication
##### 3.2.3.3 Admin Materials Management Module

**Responsibility** : Course info and slides upload, storage metadata, indexing triggers.

**Use cases covered**

- UC007: Update Course Information &amp; Slides
##### 3.2.3.4 Mini-Course Orchestration Module

**Responsibility** : Owns mini-course lifecycle (Generating/Ready/Shared), pipeline coordination, persistence.

**Use cases covered**

- UC002: Extract Learning Outcomes &amp; contents
- UC003: Generate Content
- UC004: Create Quizzes
- UC006: Share Course Link
##### 3.2.3.5 RAG / AI Generation Module

**Responsibility** : Retrieval and generation sub-steps (kept internal behind stable API).

**Use cases covered**

- UC002: Extract Learning Outcomes &amp; contents
- UC003: Generate Content
- UC004: Create Quizzes
##### 3.2.3.6 Public Learning &amp; Assessment Module

**Responsibility** : Public access to mini-course content, quiz submission, scoring, student-facing validation.

**Use cases covered**

- UC008: Access Mini-Course
- UC009: Take Quiz
##### 3.2.3.7 Analytics Module

**Responsibility** : Read-only reporting of submissions and scores.

**Use cases covered**

- UC005: View simple analytics
##### 3.2.3.8 Mapping Summary (UC → Module)

- **UC001** → Authentication &amp; Authorization
- **UC002** → Mini-Course Orchestration
- **UC003** → Mini-Course Orchestration
- **UC004** → Mini-Course Orchestration
- **UC005** → Analytics
- **UC006** → Mini-Course Orchestration
- **UC007** → Materials Management
- **UC008** → Public Learning &amp; Assessment
- **UC009** → Public Learning &amp; Assessment

#### 3.2.4 Sequence Diagram for QUIZIFY

![Image](corr_SRS_PSM1_artifacts/image_000002_c7da95e90cc62900a02ca8267a63adb92a4c4716326e0ca369d4fc19eed582d2.png)

[Draw.io](https://drive.google.com/file/d/1pmQGUTRsQPvv_Rlh3O6TXpdZs8178-We/view?usp=sharing)

#### 3.2.5 Domain Model/Class

![Image](corr_SRS_PSM1_artifacts/image_000003_3bd3adeb05061bf386cbd779e804a89e9d3d774e0cbf88142896355bc81c6f4f.png)

The domain model (class diagram) describes the main conceptual classes in QUIZIFY. The diagram intentionally excludes operations, and attributes are listed without visibility and type details.

##### 3.2.5.1 Class descriptions (attributes only)

- Materials: uploaded file metadata (status, course\_code, file\_name, storage\_path, chunk\_count)
- material\_chunks: text chunks with vector(1536) pgvector embeddings
- mini\_courses: generated courses with lesson\_content, sources (JSONB), share\_token, pass\_percentage
- quizzes: quiz metadata per mini\_course
- questions: MCQs with option\_a-d, explanations (JSONB), metadata (JSONB: bloomLevel, soloLevel)
- quiz\_attempts: student submissions with submitted\_answers (JSONB), student\_email (nullable)
##### 3.2.5.2 Relationships among classes

- materials has material\_chunks (1 to 0..*)
- mini\_courses references materials via course\_code
- mini\_courses has quizzes (1 to 1)
- quizzes has questions (1 to 0..*)
- mini\_courses receives quiz\_attempts (1 to 0..*).
#### 3.2.6 State Diagram for MINI\_COURSE

![Image](corr_SRS_PSM1_artifacts/image_000004_3ab581715b3c971e94920b2f04f62b99e5ce19ffd6cdb029cefb3294426a2f2e.png)

The state diagram describes the lifecycle of a MINI\_COURSE from creation to sharing and archiving.

##### 3.2.6.1 States

- Created: A mini-course record exists (topic captured) but generation has not completed.
- Generating (RAG pipeline running): The system is retrieving relevant content and generating the lesson and quiz.
- Ready (lesson + quiz stored): Generation completed successfully and the content is stored.
- Shared (public link active): A share token exists and the mini-course is accessible via the public link.
- Failed (generation error): Generation failed (e.g., missing/irrelevant context or service error).
- Archived: The mini-course is no longer active for sharing (administrative or lifecycle decision).
##### 3.2.6.2 Transitions

- Start → Created: Mini-course is created.
- Created → Generating: Lecturer requests generation.
- Generating → Ready: Generation succeeds and output is stored.
- Generating → Failed: Generation fails (error condition).
- Failed → Generating: Retry generation.
- Ready → Shared: Share link is created/activated.
- Shared → Archived: Archive action is performed.
- Archived → End: Lifecycle ends.

### 3.3 Launch Phase

Product Backlog (initial):

| **Sprint** | **ID** | **User Story** | **Status** | **Assignee** |
| -------------- | ---------- | -------------------------------------- | -------------- | ---------------- |
| Sprint 1 | UC001 | Login & Authentication | Done | Mohammad Areeb |
| Sprint 1 | UC007 | Update Course Information & Slides | Done | Mohammad Areeb |
| Sprint 1 | UC002 | Extract Learning Outcomes & contents | Done | Mohammad Areeb |
| Sprint 1 | UC003 | Generate Content | Done | Mohammad Areeb |
| Sprint 1 | UC004 | Create Quizzes | Done | Mohammad Areeb |
| Sprint 2 | UC006 | Share Course Link | Done | Mohammad Areeb |
| Sprint 2 | UC008 | Access Mini-Course | Done | Mohammad Areeb |
| Sprint 2 | UC009 | Take Quiz | Done |  |
| Sprint 3 | UC005 | View simple analytics | Done |  |

### 3.4 User Story Details

#### 3.4.1 US001: Login &amp; Authentication

| **Field** | **Content** |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| User Story ID | US001 |
| User Story Name | Login & Authentication |
| User Story Description | As a lecturer/admin, I want to login to the system so that I can access protected QUIZIFY functionalities. |
| Acceptance Criteria(s) | 1) Valid credentials grant access.  2) Invalid credentials show error.  3) User is redirected to dashboard on success. |
| Precondition | User is on login page. |
| Postcondition | User is authenticated and dashboard is accessible. |
| Normal Flow(s) - NF | 1. The user enters email and password.  2. The system validates credentials.  3. The system redirects the user to dashboard. |
| Alternative Flow(s) - AF | AF1. User clicks "Forgot password" (if implemented later). |
| Exception Flow(s) - EF | EF1. Invalid credentials -&gt; system shows error message.  EF2. Empty fields -&gt; system shows validation message. |

##### 3.4.1.1 Activity Diagram for US001

![Image](corr_SRS_PSM1_artifacts/image_000005_b129b09454e0e310caf0884c39ae715a84efb23887b3a78c042eb2a335b0d8c0.png)

##### 3.4.1.2 Sequence Diagram for US001

![Image](corr_SRS_PSM1_artifacts/image_000006_c5d179788eab1758a8e87e4d5d67d003158c0247e41a00708d23ca4e756474c8.png)

#### 3.4.2 UC002: Extract Learning Outcomes &amp; Contents

| **Field** | **Content** |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use Case ID | UC002 |
| Use Case Name | Extract Learning Outcomes & contents |
| Primary Actor | System |
| Description | The system retrieves relevant learning outcomes and contents from uploaded UTM course materials to build an extracted context for generation. |
| Precondition | Course materials (course info + slides PDFs) have been uploaded and indexed. A topicTitle is provided. |
| Postcondition | Extracted context is available for lesson/quiz generation OR an appropriate error is returned. |
| Normal Flow(s) - NF | 1. The system loads course materials metadata.  2. The system checks materials exist.  3. The system extracts learning outcomes and relevant content for the provided topic.  4. The system returns extracted context to the generation pipeline. |
| Exception Flow(s) - EF | EF1. Materials missing -> system returns conflict/error and stops pipeline. EF2. Retrieval returns empty context -> system indicates insufficient relevant content. |

##### 3.4.2.1 Activity Diagram for UC002

![Image](corr_SRS_PSM1_artifacts/image_000007_159bddac2dd90619d885ce548a28496f89a142cc2459dfe256e4ab430ec0de74.png)

##### 3.4.2.2 Sequence Diagram for UC002

![Image](corr_SRS_PSM1_artifacts/image_000008_089e35a01f91f3635349b4d91f992b0a468a2e1097da8fe5e42dd9c9ed25a29f.png)

#### 3.4.3 UC003: Generate Content

| **Field** | **Content** |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use Case ID | UC003 |
| Use Case Name | Generate Content |
| Primary Actor | System |
| Description | The system generates lesson content based on the extracted context (learning outcomes + relevant contents). |
| Precondition | Extracted context is available (UC002 completed successfully). |
| Postcondition | A lesson is generated and stored OR an error is returned. |
| Normal Flow(s) - NF | 1. The system requests the RAG/LLM component to generate a lesson from extracted context. 2. The system stores the lesson content. 3. The system returns lesson content for preview. |
| Exception Flow(s) - EF | EF1. LLM/generation fails -> system returns error and stops pipeline. EF2. Generated content empty/invalid -> system returns error and requires retry. |

![Image](corr_SRS_PSM1_artifacts/image_000009_5195efd12bc4ebb47dba9a086a5b32290651755b1a55a4ddf5a50f1f03c6fa60.png)

##### 3.4.3.1 Activity Diagram for UC003

##### 3.4.3.2

##### 3.4.3.3 Sequence Diagram for UC003

![Image](corr_SRS_PSM1_artifacts/image_000010_fc8c287f7a7c0c5ecae005009117c404c3f29deceb000e860da75bb8214544dd.png)

#### 3.4.4 UC004: Create Quizzes

| **Field** | **Content** |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use Case ID | UC004 |
| Use Case Name | Create Quizzes |
| Primary Actor | System |
| Description | The system generates a quiz set (MCQ) aligned with the generated lesson and extracted learning outcomes. |
| Precondition | Extracted context is available (UC002 completed). Lesson generation has completed (UC003 completed). |
| Postcondition | Quiz questions/options are generated and stored OR an error is returned. |
| Normal Flow(s) - NF | 1. The system requests the RAG/LLM component to generate MCQ questions and options. 2. The system stores quiz questions and options. 3. The system returns quiz data for preview. |
| Exception Flow(s) - EF | EF1. LLM/generation fails -> system returns error and stops pipeline. EF2. Generated quiz invalid (missing options/correct answer) -> system returns error and requires retry. |

![Image](corr_SRS_PSM1_artifacts/image_000011_4c6ef1f06a4c5ea92c1df2d081f409f53f9da1035924662167d1b7d6eb5e70b8.png)

##### 3.4.4.1 Activity Diagram for UC004

##### 3.4.4.2 Sequence Diagram for UC004

![Image](corr_SRS_PSM1_artifacts/image_000012_8a8627675751830603192f18b70295f7441da9984a095af42d4e885a8062da24.png)

#### 3.4.5 US005: View Analytics

| **Field** | **Content** |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Use Case ID | UC005 |
| Use Case Name | View analytics |
| Primary Actor | Lecturer |
| Description | Lecturer views a results table of student quiz attempts for a selected mini-course. |
| Precondition | Lecturer is logged in. A mini-course exists. |
| Postcondition | Results are displayed OR “No submissions yet” is displayed. |
| Normal Flow(s) - NF | 1. System aggregates all quiz attempts and question metadata. 2. System retrieves submissions and scores. 3. System displays results table. |
| Alternative Flow(s) - AF | AF1. No submissions exist -> system displays an empty state message. |

![Image](corr_SRS_PSM1_artifacts/image_000013_b20ed629099f4db0fd4002b1523078adbbc2d7e27149b3bd2524b6af2ae97df7.png)

##### 3.4.5.1 Activity Diagram for US005

##### 3.4.5.2 Sequence Diagram for US005

![Image](corr_SRS_PSM1_artifacts/image_000014_c89ab2a6ee45bfc3d216d52db97340b7e68c8ed6607838ce60cd90b764f2cc92.png)

#### 3.4.6 US006: Share Course Link

| Field | Content |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use Case ID | UC006 |
| Use Case Name | Share Course Link |
| Primary Actor | Lecturer |
| Description | Lecturer generates and shares a public link so students can access a mini-course without login. |
| Precondition | Lecturer is logged in and a mini-course has been generated. |
| Postcondition | Share token/link is stored and displayed to the lecturer. |
| Normal Flow(s) - NF | 1. Lecturer opens a generated mini-course. 2. Lecturer clicks Share. 3. System generates/updates share token. 4. System displays shareable link for copying. |
| Exception Flow(s) - EF | EF1. Link generation fails -> system shows error message and allows retry. |

##### 3.4.6.1

##### 3.4.6.2 Activity Diagram for US006

![Image](corr_SRS_PSM1_artifacts/image_000015_32be6500f066353fc837e6f1d79a5fdc5a82b14dbd4ce8117d9a6a8c9a6fe915.png)

##### 3.4.6.3 Sequence Diagram for US006

![Image](corr_SRS_PSM1_artifacts/image_000016_577e26b1cede588ef9ef1005685c1602860ff7e25a265dd26f4208d9f503bbc5.png)

#### 3.4.7 US007: Update Course Information &amp; Slides

| Field | Content |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use Case ID | UC007 |
| Use Case Name | Update Course Information & Slides |
| Primary Actor | Admin |
| Description | Admin uploads/updates UTM course information and lecture slides (PDF) used for retrieval and generation. |
| Precondition | Admin is logged in. |
| Postcondition | Materials are stored and available for later retrieval/generation. |
| Normal Flow(s) - NF | 1. Admin enters course info. 2. Admin uploads lecture slides (PDF & PPTX). 3. Admin clicks Save/Upload. 4. System validates fields and file type. 5. System uploads the file and stores document metadata. 6. System confirms success. |
| Alternative Flow(s) - AF | AF1. Validation fails -> system shows validation message and allows correction. |
| Exception Flow(s) - EF | EF1. Upload fails -> system shows error and allows retry. |

##### 3.4.7.1

##### 3.4.7.2 Activity Diagram for US007

![Image](corr_SRS_PSM1_artifacts/image_000017_7df3cafcf1507503ddb13ae7d93de04f16cc84e6a5ac4b809ff8028b391d9abf.png)

##### 3.4.7.3 Sequence Diagram for US007

![Image](corr_SRS_PSM1_artifacts/image_000018_acb0a6938abb1464190b4e1b495c52b4fde47ace09f552b04071cdd21062a5d3.png)

#### 3.4.8 US008: Access Mini-Course

| Field | Content |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Use Case ID | UC008 |
| Use Case Name | Access Mini-Course |
| Primary Actor | Student |
| Description | Student opens the share link to view the lesson and quiz without login. |
| Precondition | A shareable link exists for a mini-course. |
| Postcondition | Mini-course lesson and quiz are displayed OR an invalid link message is shown. |
| Normal Flow(s) - NF | 1. Student opens share link. 2. System validates share token. 3. System loads and displays lesson and quiz. |
| Alternative Flow(s) - AF | AF1. Invalid/expired token -> system shows invalid link message. |

##### 3.4.8.1 Activity Diagram for US008

![Image](corr_SRS_PSM1_artifacts/image_000019_4c1f942c314e9dccab4fbe863d4cdd5c5d17ab338659cd68235f739fcc7a7705.png)

##### 3.4.8.2 Sequence Diagram for US008

![Image](corr_SRS_PSM1_artifacts/image_000020_2c8ec500175dd0274676e6c50b6c747a05d64f75b025a32a99fcd8429ccc5d53.png)

#### 3.4.9 US009: Take Quiz

| **Field** | **Content** |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use Case ID | UC009 |
| Use Case Name | Take Quiz |
| Primary Actor | Student |
| Description | Student enters name, answers MCQs, submits, and receives a score. |
| Precondition | Student has accessed a mini-course and the quiz is available. |
| Postcondition | Submission is stored and score is displayed OR an error/validation message is shown. |
| Normal Flow(s) - NF | 1. Student enters name. 2. Student selects answers for all questions. 3. Student submits quiz. 4. System validates name/answers. 5. System calculates score. 6. System stores submission and displays score. |
| Alternative Flow(s) - AF | AF1. Missing answers -> system prompts student to complete unanswered questions. |
| Exception Flow(s) - EF | EF1. Name invalid -> system shows validation message. EF2. Storage failure -> system shows error and allows retry. |

##### 3.4.9.1 Activity Diagram for US009

![Image](corr_SRS_PSM1_artifacts/image_000021_f9e63544cfce77be646725f7aaac0b3e4af5719acf93b2462f9372f04a33cfd8.png)

##### 3.4.9.2 Sequence Diagram for US009

![Image](corr_SRS_PSM1_artifacts/image_000022_6e99aa82750e09f803cdba3f226d3629065cc1fafe35e69a8f25a59079539a35.png)

### 3.5 Performance and Other Requirements (Non-Functional)

| ID | Category | Requirement |
| --------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| NFR-001 | Performance | The system shall load student mini-course pages within 10 seconds (excluding generation time). |
| NFR-002 | Security | Lecturer/admin functions shall require authentication. |
| NFR-003 | Validation | The system shall only accept student name values that are at least 2 characters long. |
| NFR-004 | Reliability | Submissions shall be stored without data loss. |
| NFR-005 | Usability | Student interface shall be mobile responsive and simple to complete. |
| NFR-006 | Compatibility | System shall run on modern browsers with stable internet. |
| NFR-007 | Maintainability | System shall be modular (separate UI/API/data/RAG components). |

### 3.6 Design Constraints

- **DC-001:** Only **UTM course information and lecture slides** are used as source materials.
- **DC-002:** Students may optionally login to view quiz attempt history; quiz-taking via share link does not require login.
- **DC-003:** Student name is mandatory for quiz submission.
- **DC-004:** Collaborative editing, multi-lecturer co-authoring, and LMS integration are deferred **.**
- **DC-005:** API keys and sensitive configuration must not be exposed on the client side.

## 4 Appendices

### 4.1 Appendix A: Additional Supporting Artefacts
Draw.io link for diagrams

[https://drive.google.com/file/d/1pmQGUTRsQPvv\_Rlh3O6TXpdZs8178-We/view?usp=sharing](https://drive.google.com/file/d/1pmQGUTRsQPvv_Rlh3O6TXpdZs8178-We/view?usp=sharing)