![Image](Corr_SDD_PSM1_artifacts/image_000000_aa048f27894325202e30477d407577d891149a29e91062578bc4416033c8b623.png)

**SECJ 3032: Software Engineering FYP1** Semester 02, 2025/2026

**Software Design Specification (SDS)**

QUIZIFY: A SYSTEM FOR CREATING INTERACTIVE QUIZZES FROM COURSE MATERIALS USING RETRIEVAL-AUGMENTED GENERATION

2.0

Prepared by: Mohammad Areeb

## 1 Revision Page

### 1.1 Overview

The Software Design Specification (SDS) is a documentation about the design of QUIZIFY based on the approved SRS and the intended test scope in the STD.

### 1.2 Issuing Organization / Team

Individual project (FYP1)

### 1.3 Authorship / Project Team Members

| **Name** | **Role** | **Assigned Task(s)** | **Status** |
| ---------------- | -------------------- | ------------------------------------------------------ | -------------- |
| Mohammad Areeb | Developer / Author | Full system (UI, Backend, RAG integration, Database) | Complete |

##### 1 Revision History

| **REVISION NO.** | **ISSUE DATE** | **DETAILS OF REVISION** |
| -------------------- | ------------------ | ------------------------------------- |
| 1.00 | 13/01/2026 | Initial SDD submission |
| 1.1 | 29/01/2026 | Corrected SDD based on comments |
| 2.0 | 29/05/2026 | Updated SDD for PSM2 implementation |

**Note:**

This Software Design Descriptions (SDD template is adapted from IEEE Recommended Practice based on Software Design Descriptions (SDD) (IEEE Std. 1016­1998 1), that are simplified and customized to meet the need of SECJ3203 FYP1 SE course at Faculty of Computing, UTM. Examples of models are from Arlow and Neustadt (2002) and other sources stated accordingly.

## 2 Introduction

### 2.1 Purpose

This SDS provides the software design of QUIZIFY. It is intended for:

- Lecturer/Supervisor (to approve design decisions and scope) stakeholders.
- Developers (to ensure uniform implementation of QUIZIFY components)
- Testers/Evaluators (to find out the internal design to verify)
### 2.2 Scope

QUIZIFY is a web-based program that breaks down UTM course materials (course information + lecture slides PDFs) into topic-based mini-courses comprising of:

- Generated lesson content with inline [S#] source citations
- Created MCQ quiz set (configurable 5-30 questions) with Bloom's/SOLO taxonomy metadata
- Public access to students without logging in
- Student quiz submission with name and immediate score display
- Enhanced analytics with topic performance, Bloom's/SOLO analysis.

Out of scope for PSM2:

- LMS integration (e.g., Moodle)
- Collaborative editing or multi-lecturer co-authoring
- Mobile native application.
### 2.3 Context

QUIZIFY is used by:

- **Admin** : management of course data and lecture slides (PDF)
- **Lecturer** : creates mini-courses and sends links; see student’s analytics.
- **Student** : accesses mini-course via shared link, takes quiz, receives score.

This SDS describes the design in various architectural viewpoints and supports implementation and testing.

### 2.4 Summary

Section 4 describes the design body in various perspectives (context, composition, logical, information, interface, structure, interaction, state-dynamic, and algorithm). Section 5 outlines UI design.

## 3 References

1. IEEE Std. 1016-1998: IEEE Recommended Practice for Software Design Descriptions
2. IEEE Std. 830-1998: Recommended Practice for Software Requirements Specifications
3. SRS QUIZIFY
4. SDD Template from eLearning

## 4 Glossary

| **Term** | **Meaning** |
| ------------ | ------------------------------------------------------------- |
| RAG | Retrieval-Augmented Generation |
| LLM | Large Language Model |
| MCQ | Multiple Choice Questions |
| UTM | Universiti Teknologi Malaysia |
| SDS/SDD | Software Design Specification / Software Design Description |
| API | Application Programming Interface |

## 5 Design Body

### 5.1 Design Stakeholders and Their Concerns

| **Stakeholder** | **Concerns** |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Lecturer | Accurate curriculum-aligned content, configurable generation, inline citations, link sharing, enhanced analytics |
| Admin | Easy upload/update of materials (PDF/PPTX), duplicate handling, system-wide course visibility |
| Student | Fast access via link, mobile-friendly UI, immediate feedback with explanations |
| Supervisor/Evaluator | Clear modular design, traceability to SRS/STD, maintainability, security |
| Developer | Clear module boundaries, stable interfaces, error handling, multi-provider AI support |

### 5.2 Context Viewpoint

#### 5.2.1 Design Concerns

- System boundary and offered services
- Actors and interactions (Admin, Lecturer, Student)
- Traceability to SRS use cases UC001–UC009

The perspectives of the Context offer a black-box description of QUIZIFY by explaining what the system will be offering and how people may be interacting with what the system can offer. This perspective is provided to make sure that the recorded scope is in line with the SRS and to decrease the lack of clarity concerning what actors should initiate each high-level capability.

#### 5.2.2 Design View (Use Case Diagram)

[Draw.io](https://drive.google.com/file/d/1pmQGUTRsQPvv_Rlh3O6TXpdZs8178-We/view?usp=sharing)

![Image](Corr_SDD_PSM1_artifacts/image_000001_255d5c32e8cd48ccc66558804bb073321a5d5d5ae0eade2bd4386a60a19f44f1.png)

**Figure 2.1: Use Case Diagram for QUIZIFY**

Figure 2.1 is a summary of the functional scope of QUIZIFY and the three main actors (Admin, Lecturer, Student) are represented on how they interact with the system boundary. The diagram identifies the end-to-end objective of creating and sharing a mini-course, and it breaks down the generation capacity into sub-functions contained in it (extract outcomes/contents, create content, create quizzes). This is also inline with the client server architecture in which users engage with each other using the web UI, and the backend services facilitate generation and persistence.

### 5.3 Composition Viewpoint

#### 5.3.1 Design Concerns

- Major subsystems and responsibilities
- Client-server architecture with Supabase as the backend platform
- Separation of UI, APIs, AI services, and data stores

The Composition viewpoint is also provided to discuss the way QUIZIFY is divided into significant components and the reasons why these divisions have been made. QUIZIFY is a client-server-based architecture: user interaction and presentation is in the client and the business logic is in the server side, which integrates AI services and storage management. This perspective assists the reviewers with making sense on how the responsibilities are divided without delving into the details of classes at the implementation level.

#### 5.3.2 Design View (Component Diagram)

**Figure 3.1: Component Diagram of QUIZIFY (client-server architectural)**

![Image](Corr_SDD_PSM1_artifacts/image_000002_cc8ba3a644b642230ea76a2acba4f0122ac036b09714c733f03bdad3c7728173.png)

The client-server architectural style is used in describing QUIZIFY in Figure 3.1. The Client is where the Lecturer/Admin UI and Student Public UI are located that oversee the input and navigation and validation feedback along with rendering of the generated lesson/quiz content. The Backend API will be the entry point on the server-side and will provide authentication, materials management, generation orchestration, public access, and analytics retrieval endpoints.

The server combines external services that are needed in the RAG pipeline such as a vector store to be accessed and an LLM provider to be generated. Persistent storage (database and file storage) The persistent storage is retained behind server-side interfaces such that the client never accesses data stores directly. The separation contributes to maintainability (discriminated module boundaries), reliability (persistency centralized), and security (access to the protected operations being limited).

### 5.4 Logical Viewpoint

#### 5.4.1 Design Concerns

- Core service responsibilities (no traditional classes)
- Separation between route handlers, business logic, and data access

Logical viewpoint is aimed at ensuring that domain entities (e.g., mini-course, lesson, quiz, submission) are not tied to infrastructure information, and that controller/service components keep workflows (e.g., generation and quiz submission) organized.

#### 5.4.2 Design View (Class Diagram)

![Image](Corr_SDD_PSM1_artifacts/image_000003_ec95b9ff85c4bf09d976d6b9a6c7815e4c88ee5e518e73a53aee58117f83ea9c.png)

Figure 4.2: Class Diagram for QUIZIFY

The system uses a service-oriented architecture with Express route handlers delegating to service modules. Key service modules:

- materials.service: CRUD operations for materials, storage management.
- courses.service: Course generation, listing, deletion.
- rag.service: Text extraction, chunking, embedding, vector search.
- ai.service: Multi-provider AI integration, prompt building, content generation.
- quiz.service: Public course access, quiz submission, analytics computation.
- outlines.service: Course outline extraction and persistence.
### 5.5 Information Viewpoint

#### 5.5.1 Design Concerns

- Persistent data entities in Supabase PostgreSQL
- Vector storage via pgvector extension
- File storage via Supabase Storage

The Information viewpoint explains how QUIZIFY converts its information area to enduring data forms. Because QUIZIFY needs to store uploaded course materials, generated lessons/quizzes, and student submissions in a reliable manner, the database schema would be created in a way that reduces redundancy and facilitates efficient retrieval both generation (server-side) and delivery/viewing/analytics (client-side) of such data.

#### 5.5.2 Design View (ERD Diagram + Data Dictionary)

![Image](Corr_SDD_PSM1_artifacts/image_000004_7769ec3c0d66cd2a7c2e6d645b959bf92c3d150b0141e2c20422f1de5d39add8.png)

Figure 5.1: ERD for QUIZIFY

The ERD identifies 6 core tables:

- materials: Stores uploaded file metadata (PDF/PPTX) with course\_code, material\_type, chapter, status, chunk\_count.
- material\_chunks: Stores text chunks with pgvector embeddings (vector(1536)) for similarity search.
- mini\_courses: Stores generated mini-courses with lesson\_content, sources (JSONB), share\_token, pass\_percentage, expires\_at.
- quizzes: Stores quiz metadata linked to mini\_courses.
- questions: Stores MCQ questions with option\_a-d columns, explanations (JSONB), metadata (JSONB with topic/bloomLevel/soloLevel).
- quiz\_attempts: Stores student submissions with score, percentage, submitted\_answers (JSONB with full answer details).

**Data Dictionary**

**Entity overview:**

| **Entity** | **Description** |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| materials | Uploaded course material file metadata (PDF/PPTX) linked to course_code; status tracks processing lifecycle. |
| material_chunks | Text chunks extracted from materials with pgvector embeddings (1536-dimension) enabling semantic similarity search via RAG. |
| mini_courses | Generated mini-course record containing lesson content, source citations, share token, pass threshold, and expiry. |
| quizzes | Quiz metadata record linked to a mini_course; holds title and question count. |
| questions | Individual MCQ question with four option columns (option_a through option_d), correct index, taxonomy metadata, and explanations. |
| quiz_attempts | Student quiz attempt record capturing name, email, score, percentage, and full submitted answers as JSONB. |

**Entity: materials**

| **Attribute** | **Type** | **Key** | **Description** |
| -------------------- | ------------ | ----------- | ------------------------------------------------------------------ |
| id | UUID | PK | Primary identifier for the material record. |
| course_code | VARCHAR |  | Course code (e.g., SECJ3032) for grouping materials. |
| material_type | VARCHAR |  | Type of material: 'pdf' or 'pptx'. |
| chapter | VARCHAR |  | Chapter number/name extracted from the file. |
| chapter_item_label | VARCHAR |  | Sub-item label within the chapter (e.g., "1.2"). |
| file_name | VARCHAR |  | Original uploaded file name. |
| storage_path | VARCHAR |  | Supabase Storage path to the physical file. |
| mime_type | VARCHAR |  | MIME type of the file. |
| file_size | INTEGER |  | File size in bytes. |
| chunk_count | INTEGER |  | Number of text chunks generated from this material. |
| status | VARCHAR |  | Processing status: 'pending', 'processing', 'indexed', 'failed'. |
| error_message | TEXT |  | Error details if processing failed. |
| uploaded_at | TIMESTAMP |  | Timestamp of file upload. |
| updated_at | TIMESTAMP |  | Timestamp of last metadata update. |

**Entity: material\_chunks**

| **Attribute** | **Type** | **Key** | **Description** |
| ----------------- | -------------- | ------------------- | ------------------------------------------------------------------------------ |
| id | UUID | PK | Primary identifier for the chunk. |
| material_id | UUID | FK → materials.id | Parent material this chunk belongs to. |
| course_code | VARCHAR |  | Course code for efficient querying. |
| source_file | VARCHAR |  | Original file name for source citation. |
| chapter | VARCHAR |  | Chapter identifier for scoped retrieval. |
| chunk_index | INTEGER |  | Positional index of chunk within the material. |
| chunk_text | TEXT |  | The text content of this chunk. |
| embedding | vector(1536) |  | 1536-dimension vector embedding for semantic similarity search via pgvector. |
| created_at | TIMESTAMP |  | Timestamp when chunk and embedding were created. |

**Entity: mini\_courses**

| **Attribute** | **Type** | **Key** | **Description** |
| ----------------- | ------------ | ----------- | ------------------------------------------------------------------------------------- |
| id | UUID | PK | Primary identifier for the mini-course. |
| title | VARCHAR |  | Display title of the mini-course (topic-based). |
| course_code | VARCHAR |  | Source course code. |
| topics | TEXT[] |  | Array of topic strings covered by the mini-course. |
| lesson_content | TEXT |  | Generated lesson content with inline [S#] source citations. |
| sources | JSONB |  | Structured source references array: [{id, fileName, chapter, chunkIndex}]. |
| status | VARCHAR |  | Lifecycle status: 'created', 'generating', 'ready', 'shared', 'failed', 'archived'. |
| share_token | VARCHAR |  | Unique public token for shareable student access link. |
| pass_percentage | INTEGER |  | Pass threshold percentage configured at generation time. |
| expires_at | TIMESTAMP |  | Optional expiration date for the share link. |
| created_by_name | VARCHAR |  | Display name of the creator (lecturer/admin). |
| creator_email | VARCHAR |  | Email of the creator (links to auth identity). |
| created_at | TIMESTAMP |  | Timestamp of initial creation. |
| updated_at | TIMESTAMP |  | Timestamp of last update or status change. |

**Entity: quizzes**

| **Attribute** | **Type** | **Key** | **Description** |
| ----------------- | ------------ | ---------------------- | --------------------------------------------- |
| id | UUID | PK | Primary identifier for the quiz. |
| mini_course_id | UUID | FK → mini_courses.id | Parent mini-course this quiz belongs to. |
| title | VARCHAR |  | Display title of the quiz. |
| question_count | INTEGER |  | Total number of MCQ questions in this quiz. |
| created_at | TIMESTAMP |  | Timestamp of quiz creation. |

**Entity: questions**

| **Attribute** | **Type** | **Key** | **Description** |
| ---------------------- | ------------ | ----------------- | ------------------------------------------------------------------------------------- |
| id | UUID | PK | Primary identifier for the question. |
| quiz_id | UUID | FK → quizzes.id | Parent quiz this question belongs to. |
| prompt | TEXT |  | The question prompt/stem text. |
| option_a | TEXT |  | First answer option text. |
| option_b | TEXT |  | Second answer option text. |
| option_c | TEXT |  | Third answer option text. |
| option_d | TEXT |  | Fourth answer option text. |
| correct_option_index | INTEGER |  | Zero-based index of the correct option (0-3). |
| order_index | INTEGER |  | Display order of the question within the quiz. |
| explanations | JSONB |  | Explanations object: {correct: "...", incorrect_a: "...", incorrect_b: "...", ...}. |
| metadata | JSONB |  | Taxonomy metadata: {topic: "...", bloomLevel: "...", soloLevel: "..."}. |
| created_at | TIMESTAMP |  | Timestamp of question creation. |

**Entity: quiz\_attempts**

| **Attribute** | **Type** | **Key** | **Description** |
| ------------------- | ------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| id | UUID | PK | Primary identifier for the quiz attempt. |
| mini_course_id | UUID | FK → mini_courses.id | Mini-course attempted by the student. |
| quiz_id | UUID | FK → quizzes.id | Specific quiz attempted. |
| student_name | VARCHAR |  | Student-provided name (validated, not blank). |
| score | INTEGER |  | Number of correct answers. |
| total_questions | INTEGER |  | Total questions in the quiz at time of attempt. |
| percentage | NUMERIC |  | Score as a percentage (score / total_questions * 100). |
| submitted_answers | JSONB |  | Full answer details: [{questionId, selectedIndex, correctIndex, isCorrect, prompt, selectedText, correctText}]. |
| student_email | VARCHAR |  | Optional student email captured via OAuth. |
| submitted_at | TIMESTAMP |  | Timestamp of quiz submission. |

### 5.6 Interface Viewpoint

#### 5.6.1 Design Concerns

- External and internal interfaces between UI, APIs, and services
- Validation rules and error reporting

The Interface viewpoint outlines the interaction of the end-users and system components in terms of well-stated interfaces. This covers the screens that the user interacts with, as well as the API surface on the server side, though it focuses more on validation rules (e.g. student name cannot be blank) and the ability to report errors in a predictable way to enable the client to provide clear feedback.

#### 5.6.2 Design View (Interfaces)

- Protected Lecturer/Admin UI: Login, Materials management, Create Course (with preview), My Courses, Analytics
- Public Student UI: Access mini-course, Take quiz with navigation, View results with explanations

REST API Endpoints:

| Method | Endpoint | Description |
| ----------- | ------------------------------------------- | -------------------------------------------- |
| GET | /health | Health check |
| GET | /api/materials | List materials |
| POST | /api/materials/upload | Upload material (multipart) |
| PATCH | /api/materials/:id | Update material metadata |
| DELETE | /api/materials/:id | Delete material |
| DELETE | /api/materials/course/:courseCode | Delete all course materials |
| DELETE | /api/materials/course/:courseCode/chapter | Delete chapter materials |
| POST | /api/materials/:id/reindex | Re-run embedding generation for a material |
| POST | /api/materials/repair | Repair materials missing embeddings |
| GET | /api/courses | List courses |
| GET | /api/courses/available | List courses with indexed materials |
| GET | /api/courses/:courseCode/topics | Get course topics |
| POST | /api/courses/:courseCode/reindex-outline | Re-extract outline |
| POST | /api/courses/preview | Generate course preview |
| POST | /api/courses/confirm | Confirm and save course |
| DELETE | /api/courses/:id | Delete course |
| GET | /api/public/course/:token | Get public course |
| POST | /api/public/course/:token/submit | Submit quiz |
| GET | /api/students/attempts | Get student attempt history |
| GET | /api/analytics/:courseId | Get course analytics |

**Hardware Interfaces**

QUIZIFY is a web-based system; therefore, the primary hardware interface is between the application and the user’s devices (mobile/desktop) through a web browser.

**Mobile devices (Student usage)**

- Require: Android/iOs smart phone that can support a modern web-browser.
- Projected limitations: smaller screen, spotty network.
- Support plan: responsive UI, button size, and compact forms (name + MCQ choice)

**Desktop/Laptop devices (Lecturer/Admin usage)**

- Minimum: Windows/macOS laptop/desktop with the ability to use a modern web browser.
- Support strategy: broader layouts of tables (analytics) and files uploading

**Server-side hosting environment**

- Services Backend API and storage services are hosted on the cloud infrastructure and accessed using HTTPS.
- The persistent storage and the file storage cannot be accessed directly by the client, all the access is mediated by the server-side APIs.

**Software Interfaces**

QUIZIFY relies on third-party software applications to provide the UI, backend service, persistence, and RAG pipeline. The table below shows the software products needed and their purpose of interface.

| Name | Version | Interface / Purpose |
| ----------------------------- | ------------- | ------------------------------------------------------------------- |
| React + Vite + Tailwind CSS | 19 / 7 / 4 | Frontend stack (UI rendering + fast dev build + styling system). |
| Node.js + Express | LTS / 4 | Backend stack (server runtime + API routing layer). |
| Supabase JS SDK | v2 | Database + storage + auth interface (backend-as-a-service layer). |
| OpenAI SDK / Axios | v5 / Latest | AI + external API interface (LLM calls + REST requests). |
| LangChain text splitters | Latest | Text chunking interface (splits long text for AI processing). |
| pdf-parse | Latest | PDF text extraction interface (PDF → raw text). |
| JSZip | Latest | PPTX text extraction interface (unzips PowerPoint structure). |
| multer | Latest | File upload handling interface (multipart form-data processing). |

**Communication Interfaces**

QUIZIFY uses standard web communication protocols and formats:

**HTTPS (TLS over TCP/IP)**

- Used for all client-to-server and server-to-service communication.
- The client uses JSON request/response bodies and communicates with server endpoints.
- Authentication is by a session/token, which is returned by the login API and relayed by the following requests (e.g., Authorization: Bearer &lt;token&gt;).
- Supabase (PostgreSQL + pgvector + Storage + Auth), DeepSeek (via OpenRouter), and Gemini integrations use HTTPS APIs and require secure credentials (API keys/service accounts) managed on the server side.
### 5.7 Structure Viewpoint

#### 5.7.1 Design Concerns

**REST API + JSON payloads**

**Service APIs (cloud integrations)**

- Package/module organization
- Frontend: src/pages, src/components, src/services, src/context, src/types, src/constants
- Backend: src/controllers, src/services, src/routes, src/middleware, src/lib, src/config, src/data, src/types.

The Structure perspective records the internal structure of QUIZIFY (in terms of packages/ modules and dependence). This position has been added to show maintainability: UI concerns are not linked to the logic of orchestration at the backend, and infrastructure integrations are not linked to the core domain.

#### 5.7.2 Design View (Package Diagram)

![Image](Corr_SDD_PSM1_artifacts/image_000005_f5485bc5f617dd4082621b6d8ac1c23a74ba9ef38fbe8a8b8a608aa07a186ad0.png)

Figure 4.1: Package Diagram for QUIZIFY

The package diagram classifies QUIZIFY code into high-level modules and provides dependencies among these modules. UI packages rely on backend API packages on secured and exposed features. Persistence and RAG Backend packages require infrastructure packages. This is to ensure that dependency direction is made explicit so that local changes are not brought in and unnecessary coupling is not introduced.

### 5.8 Interaction Viewpoint

#### 5.8.1 Design Concerns

- End-to-end interaction per use case UC001–UC009
- Layered flow: UI → API → RAG/Storage/DB

The Interaction perspective explains the way QUIZIFY entities work together in the long run to achieve every use case. This perspective has been added to keep the dynamic behavior in line with the component boundaries: the UI will initiate requests, the backend will coordinate workflows, and the supporting services will be the RAG/persistence layers.

#### 5.8.2 Design View (Sequence Diagram)

Every sequence diagram represents a scenario realization of a use case, that is, it displays the messages between the actor and the Web UI, the backend APIs, and supporting services (RAG, database). This documentation is considered to check completeness (are all the necessary steps there) and error handling (alternative flows are clearly defined), and architectural consistency (client uses APIs to communicate with the system).

##### 5.8.2.1 Sequence Diagram for QUIZIFY

![Image](Corr_SDD_PSM1_artifacts/image_000006_c7da95e90cc62900a02ca8267a63adb92a4c4716326e0ca369d4fc19eed582d2.png)

[Draw.io](https://drive.google.com/file/d/1pmQGUTRsQPvv_Rlh3O6TXpdZs8178-We/view?usp=sharing)

##### 5.8.2.2 Sequence Diagram for US001

![Image](Corr_SDD_PSM1_artifacts/image_000007_c5d179788eab1758a8e87e4d5d67d003158c0247e41a00708d23ca4e756474c8.png)

This sequence diagram illustrates the flow of Lecturer/Admin credentials which are posted through the Web UI, authenticated by Auth API against the user store, and accepted (returning a token) or rejected (generating an error).

##### 5.8.2.3 Sequence Diagram for UC002

![Image](Corr_SDD_PSM1_artifacts/image_000008_089e35a01f91f3635349b4d91f992b0a468a2e1097da8fe5e42dd9c9ed25a29f.png)

##### 5.8.2.4

This sequence diagram illustrates the process by which the Course API verifies the presence of materials uploaded and uses the RAG service to access/extract the necessary learning outcomes and context and returns status of context-ready or a materials-missing error.

##### 5.8.2.5 Sequence Diagram for UC003

![Image](Corr_SDD_PSM1_artifacts/image_000009_585199ce140fb26bc39a59a0d1d2b8f02d0af7a0655813260936986917977d19.png)

This sequence diagram illustrates the process by which the Course API verifies the presence of materials uploaded and uses the RAG service to access/extract the necessary learning outcomes and context and returns status of context-ready or a materials-missing error.

##### 5.8.2.6 Sequence Diagram for UC004

![Image](Corr_SDD_PSM1_artifacts/image_000010_8a8627675751830603192f18b70295f7441da9984a095af42d4e885a8062da24.png)

This sequence diagram illustrates how to generate quiz through the RAG service, maintenance of questions (with option\_a through option\_d columns) as well as managing errors that arise when there is failure in generating quizzes.

#### 5.8.3

##### 5.8.3.1 Sequence Diagram for US005

![Image](Corr_SDD_PSM1_artifacts/image_000011_c89ab2a6ee45bfc3d216d52db97340b7e68c8ed6607838ce60cd90b764f2cc92.png)

This sequence diagram demonstrates the process of searching the Analytics API to get submissions to a mini-course with the result either a table of populated results or an empty state.

##### 5.8.3.2 Sequence Diagram for US006

![Image](Corr_SDD_PSM1_artifacts/image_000012_577e26b1cede588ef9ef1005685c1602860ff7e25a265dd26f4208d9f503bbc5.png)

This sequence diagram indicates the way in which the Course API creates and stores a shareToken and provides a shareable link (or an error with retry).

##### 5.8.3.3 Sequence Diagram for US007

![Image](Corr_SDD_PSM1_artifacts/image_000013_acb0a6938abb1464190b4e1b495c52b4fde47ace09f552b04071cdd21062a5d3.png)

The sequence diagram demonstrates that materials are uploaded by admins, which are verified and data is stored in files, metadata of a database is saved and upload failure is handled.

##### 5.8.3.4 Sequence Diagram for US008

![Image](Corr_SDD_PSM1_artifacts/image_000014_2c8ec500175dd0274676e6c50b6c747a05d64f75b025a32a99fcd8429ccc5d53.png)

This sequence diagram describes the way a student is provided with access to content through shareToken, lesson + quiz payload, or gets an invalid link message.

##### 5.8.3.5 Sequence Diagram for US009

![Image](Corr_SDD_PSM1_artifacts/image_000015_6e99aa82750e09f803cdba3f226d3629065cc1fafe35e69a8f25a59079539a35.png)

The sequence diagram below displays validation of quiz submission (name and missing answer), scoring, persistence of quiz\_attempts (with submitted\_answers JSONB) as well as error handling.

### 5.9 State Dynamic Viewpoint

#### 5.9.1 Design Concerns

- Mini-course lifecycle (2 states: Ready and Shared)
- Alignment (Processing, Active/Failed, Deleted)

The State Dynamic viewpoint is used because QUIZIFY has reactive workflows in which the lifecycle of the developed mini-course matters (created, generating, ready, shared, failed, archived). Recording these states forces invalid transitions (e.g. sharing before it is fully generated) and defines the behavior of retry/error recovery.

#### 5.9.2 Design View (State Machine Diagram)

##### 5.9.2.1 ST001: State Machine Diagram for UC001 - Login &amp; Authentication

![Image](Corr_SDD_PSM1_artifacts/image_000016_fd66491ae6e9dc569290167fbd6c34e8432828ef171a4eb79e5f362dbfa77289.png)

This state machine illustrates the authentication lifecycle of an initial unauthenticated state to verifying credentials. Upon success, the system sets the system to an authenticated session state (token/session issued). In case of failure, it switches to a state of login-fail and leaves the user with an opportunity to re-try.

##### 5.9.2.2 ST002: State Machine Diagram for UC002 - Extract Learning Outcomes &amp; Contents

![Image](Corr_SDD_PSM1_artifacts/image_000017_091e31b1aff8ae6f46083247d2d77d76da6a8a9597dfe82fed32689670d7a230.png)

This state machine illustrates the workflow of extracting learning outcomes and contents from uploaded materials. It transitions from idle through material validation and RAG context extraction, reaching either a context-ready state (proceeding to generation) or a materials-missing error state (requiring material upload).

##### 5.9.2.3 ST003: State Machine Diagram for UC003 - Generate Lesson Content

![Image](Corr_SDD_PSM1_artifacts/image_000018_e718c778f2e8e1c6254d5fc95607992d6a01a1f6d8e315ac68fb5ed3b4de315a.png)

This state diagram represents the workflow of lesson generation, both the generation step and the persistence step. It also records the occurrence of the system going to a generated-failure state when there are errors and allows retries of the generation.

##### 5.9.2.4 ST004: State Machine Diagram for UC004 - Create Quizzes

![Image](Corr_SDD_PSM1_artifacts/image_000019_f0d6840ff89e989d0edbd2c7f2d9cecade80e7e3256b333da79181f34112ca6e.png)

This state diagram represents generation of quizzes as series of requests, to generation, to save questions/options states. Failure goes to a state of generation-failed where it can be retried before the quiz is made available.

##### 5.9.2.5 ST005: State Machine Diagram for UC005 - View Simple Analytics

![Image](Corr_SDD_PSM1_artifacts/image_000020_0d25d930582d2e2c8a346f469fb9076743ae91991a3829a71cba795a60c44f28.png)

This state machine diagram indicates the analytics viewing flow as a state of opening the dashboard, acquiring submissions, and either a table of results or the state of no submissions.

##### 5.9.2.6 ST006: State Machine Diagram for UC006 - Share Course Link

![Image](Corr_SDD_PSM1_artifacts/image_000021_c255dc3a56ed14efbe51c88a2021305e2eeb072ae61e3ef4468f1b26bba841a4.png)

The following state machine diagram models the life of the share links which start at “ready to share” and moves to the “link shared” state. It also has a share-failed state of server errors and retry behaviour.

##### 5.9.2.7 ST007: State Machine Diagram for UC007 - Update Course Information &amp; Slides

![Image](Corr_SDD_PSM1_artifacts/image_000022_4efe14497b38da82ed9fef2a903a8b1bd489fd6d6015f61857fe032f6779ce8c.png)

The following state machine diagram represents the workflow of uploading of the admin materials through the portal that consists of form editing, validation, uploading files to storage, and metadata saving. It also records the alternate error conditions (validation error, upload error) and the manner in which the process can get back to editing or getting a second attempt.

##### 5.9.2.8 ST008: State Machine Diagram for UC008 - Access Mini-Course (Public)

![Image](Corr_SDD_PSM1_artifacts/image_000023_5f60212f948e345c12317680685344245b11ac01f192b58f196dbad8f3145303.png)

The diagram below is a state machine that gets used to model public access through share link. It switches to link opened to fetching content by token, and on the case of success, displays the mini-course, or switches to an invalid/expired link status.

##### 5.9.2.9 ST009: State Machine Diagram for UC009 - Take Quiz &amp; Submit Answers

![Image](Corr_SDD_PSM1_artifacts/image_000024_f9004b39b0a082e9656e24dca7aecbabd8e0b86dd4703cbc9f06c5be231ac5d7.png)

The following state machine diagram represents the quiz submission lifecycle: a student fills out the quiz, the system verifies the information, calculates the score, stores the submission data, and shows the score. It further records validation failures (invalid name, missing answers) and retry error.

### 5.10 Algorithm Viewpoint

#### 5.10.1 Design Concerns

- RAG pipeline: text extraction -&gt; chunking -&gt; embedding -&gt; retrieval -&gt; generation
- Bloom's/SOLO taxonomy directive mapping
- Quiz scoring and analytics computation

The Algorithm perspective records the decision logic internally which should be the same in the UI and backend implementation. In the case of QUIZIFY, the algorithmic documented in the SDD are quiz submission validation (particularly student name validation) and calculation of scores, based on selected answers.

#### 5.10.2 Design View (Activity Diagram / Decision Tables)

For QUIZIFY, the algorithmic aspect is primarily control flow rather than complex mathematical computation, that is why activity diagrams are used

##### 5.10.2.1 Activity Diagram for US001

![Image](Corr_SDD_PSM1_artifacts/image_000025_b129b09454e0e310caf0884c39ae715a84efb23887b3a78c042eb2a335b0d8c0.png)

This activity diagram illustrates the flow of user logins into the system, including the submission of their credentials, server-side authentication and the division into the successful access (redirection to dashboard) and an authentication error message.

##### 5.10.2.2 Activity Diagram for UC002

![Image](Corr_SDD_PSM1_artifacts/image_000026_159bddac2dd90619d885ce548a28496f89a142cc2459dfe256e4ab430ec0de74.png)

The following activity diagram indicates how the system verifies the presence of materials, gets the corresponding learning outcomes/context based on the RAG pipeline, and halts with a materials-missing error in case documents are not found.

##### 5.10.2.3 Activity Diagram for UC003

![Image](Corr_SDD_PSM1_artifacts/image_000027_5195efd12bc4ebb47dba9a086a5b32290651755b1a55a4ddf5a50f1f03c6fa60.png)

##### 5.10.2.4

This activity diagram demonstrates the process of lesson generation through retrieved context, such as storage of the generated lesson, and processing cases of lesson generation failure.

##### 5.10.2.5 Activity Diagram for UC004

![Image](Corr_SDD_PSM1_artifacts/image_000028_598278849146499045063615332dcc6e33bf2747b20f9b439c77988c20778bfb.png)

##### 5.10.2.6

This activity diagram reflects MCQ creation logic, such as, creating questions/options, checking on the quiz form needed, continuing with the quiz and dealing with failures in case generation output is invalid.

![Image](Corr_SDD_PSM1_artifacts/image_000029_f065a708788462e45fc913d6b9e38220488b98c0b0289e10360fd865a4a9a81c.png)

##### 5.10.2.7 Activity Diagram for US005

This activity diagram illustrates the process in which the lecturer opens analytics, the system pulls submissions of a chosen mini-course, and then the UI will show a results table or a message indicating there are no submissions at the time.

##### 5.10.2.8

##### 5.10.2.9 Activity Diagram for US006

![Image](Corr_SDD_PSM1_artifacts/image_000030_32be6500f066353fc837e6f1d79a5fdc5a82b14dbd4ce8117d9a6a8c9a6fe915.png)

This process diagram depicts the share process, which involves the creation of a shareToken, storage, return to the lecturer in the form of a public link, and error cases with a restart option.

##### 5.10.2.10

##### 5.10.2.11 Activity Diagram for US007

![Image](Corr_SDD_PSM1_artifacts/image_000031_7df3cafcf1507503ddb13ae7d93de04f16cc84e6a5ac4b809ff8028b391d9abf.png)

This activity diagram illustrates the workflow of the materials management by the admin which involves metadata validation and file type validation, uploading the PDF file, metadata saving, and it goes back to the validation/upload error management.

##### 5.10.2.12 Activity Diagram for US008

![Image](Corr_SDD_PSM1_artifacts/image_000032_4c1f942c314e9dccab4fbe863d4cdd5c5d17ab338659cd68235f739fcc7a7705.png)

This activity diagram illustrates the external access through the share link, checking the token, accessing lesson and quiz materials and accessing invalid or expired links.

##### 5.10.2.13 Activity Diagram for US009

![Image](Corr_SDD_PSM1_artifacts/image_000033_f9e63544cfce77be646725f7aaac0b3e4af5719acf93b2462f9372f04a33cfd8.png)

This activity diagram shows the end-to-end quiz attempt logic: enter student name, receive answers, enter inputs and validate them, receive score, save the data of the submission and show the results. It also comprises other flows in validation failures and storage failure.

**Decision Table (Quiz submission validation - draft)**

| **Rule** | **Student name blank?** | **Missing answers?** | **Expected result** |
| ------------ | --------------------------- | ------------------------ | ---------------------------------------------------- |
| R1 | Yes | Any | Reject with validation message (NFR-003) |
| R2 | No | Yes | Reject and prompt to complete unanswered questions |
| R3 | No | No | Accept submission; calculate and return score |

Score computing (design-level): compute selectedOptionIndex and correctOptionIndex and add the score after every submitted answer is done. A confirmation message is sent to the client with the final score saved in quiz\_attempts.score.

## 6 User Interface Design

### Overview of User Interface

QUIZIFY provides two primary user-facing interfaces:

- A protected Lecturer/Admin interface for login, materials management, generation, sharing, and analytics.
- A public Student interface accessible via share link for lesson reading and quiz submission.

### Screen Images

#### 6.1.1 LECTURER/ADMIN: DASHBOARD

![Image](Corr_SDD_PSM1_artifacts/image_000034_3592cdc932d88337b26720cb0eca51e7da45ef14426611a06ffedc70c631f61a.png)

![Image](Corr_SDD_PSM1_artifacts/image_000035_43c971a742e408fb1fe7e7d7db0222bd699756f429eef6ba6439d7f1b59f2c52.png)

#### 6.1.2 LECTURER:  Generate Mini-Course

**Share Course Link**

#### 6.1.3 LECTURER:  Share Course Link

![Image](Corr_SDD_PSM1_artifacts/image_000036_edcc6fee83be8b5271b49ff11f598b8c789bcb0523048dff87074aeb8aaeec2e.png)

**Simple Analytics**

![Image](Corr_SDD_PSM1_artifacts/image_000037_529f948bc3d8bf86fe3b7d3070f93ec24aa45b9bcbadafb892720cb5de347957.png)

#### 6.1.4 LECTURER:  Simple Analytics Screen

**Results**

![Image](Corr_SDD_PSM1_artifacts/image_000038_8bf71b41c564537358b5bac8d800465df39b46f4c9af962b9d6ef883bae4c578.png)

#### 6.1.5 LECTURER: MINI Courses screen

![Image](Corr_SDD_PSM1_artifacts/image_000039_2678cdb80835821025ff7b3679999779117cc0b391a5e15f3830bc243f51bd6b.png)

#### 6.1.6 LECTURER: Results screen

#### 6.1.7 ADMIN: Upload PDF Screen

![Image](Corr_SDD_PSM1_artifacts/image_000040_f50278b923c29e14cd7b8e2317470e514604665b8f9effead14c53b6f21d0b81.png)

#### 6.1.8 ADMIN: Update Course &amp; Slides Screen

![Image](Corr_SDD_PSM1_artifacts/image_000041_d9ede1467a049550e55d169df53d186266e3b1e4079958f1f6d270e12932027a.png)

#### 6.1.9 STUDENT: Access Mini-Course Screen

![Image](Corr_SDD_PSM1_artifacts/image_000042_52ecb8717fd6d92ce538150e26c07e9b564041c621f5cee178bb08f2e3ff635c.png)

#### 6.1.10 STUDENT: Take Quiz Screen

![Image](Corr_SDD_PSM1_artifacts/image_000043_806013e5227b95b293c0115a66567ba04c1c2f9ed2c17b9c75c1e44c3b4ae0d2.png)

## 7 Appendices

- Appendix B: All diagrams are in [Draw.io](https://drive.google.com/file/d/1pmQGUTRsQPvv_Rlh3O6TXpdZs8178-We/view?usp=sharing)
