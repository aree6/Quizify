# Minimal Diagram Updates — PSM2

The text in `SRS/sources/SRS.md`, `SDD/sources/SDD.md`, and `STD/sources/STD.md` is already at the PSM2 baseline. The **only thing that needs to change is the diagram PNGs** in `SRS/artifacts/` and `SDD/artifacts/`.

This folder (`documents_psm2/diagrams_source/`) contains the **Draw.io XML and Mermaid source** for every figure. Some files have been **rewritten in place** to match the current implementation; the rest are byte-identical copies of the originals (because the corresponding diagram was already correct).

## What I changed (only 11 of 28 files)

### SRS — 5 draw.io XML + 4 Mermaid

| File | Change |
|---|---|
| `SRS/drawio/state_diagram_mini_course.drawio` | 6 states → 3 states (`Generating` → `Ready` → `Shared`). Removed `Created`, `Failed`, `Archived`. Added note explaining the SQL CHECK. |
| `SRS/drawio/domain_model_ces_sail.drawio` | Removed all 11 PSM1 classes (`User`, `Admin`, `Lecturer`, `Student`, `Document`, `Lesson`, `QuizQuestion`, `QuizOption`, `Submission`, `SubmissionAnswer`, `MiniCourse`). Added 6 actual Supabase tables with full columns and FK relationships. |
| `SRS/drawio/activity_uc001_login.drawio` | Email + password → Google OAuth via Supabase Auth. New swimlane `Supabase Auth`. Role-based dashboard redirect. |
| `SRS/drawio/activity_uc005_view_simple_analytics.drawio` | Flat results table → rich analytics. Added parallel fork for KPIs, score distribution, topic, Bloom's, SOLO, cross-matrix computations. |
| `SRS/drawio/activity_uc007_update_course_info_slides.drawio` | PDF only → PDF + PPTX. Added chunking + embedding + `material_chunks` insert steps. |
| `SRS/mermaid/uc001_login_uml.mmd` | Same as the corresponding draw.io login diagram, in Mermaid. |
| `SRS/mermaid/uc005_view_simple_analytics_uml.mmd` | Same as the corresponding draw.io analytics diagram, in Mermaid. |
| `SRS/mermaid/uc007_update_course_info_slides_uml.mmd` | Same as the corresponding draw.io upload diagram, in Mermaid. |
| `SRS/mermaid/whole_system_uml.mmd` | Firebase architecture (Auth API, RAG Service, File Storage, Database) → Supabase architecture. Added preview/confirm two-step, `match_material_chunks` SQL call, per-option explanations, [S#] source citations. |

### SDD — 4 draw.io XML (state, component, package, ST001)

| File | Change |
|---|---|
| `SDD/drawio/state_diagram_mini_course.drawio` and `..._spacious.drawio` | Same 6 → 3 state change as the SRS state diagram. |
| `SDD/drawio/component_architecture_ces_sail.drawio` and `..._spacious.drawio` | Removed `Auth API`, `RAG Service`, `Vector Store`, `File Storage`, `Database` as separate components. Replaced `Data Stores` subsystem with single `Supabase` subsystem (PostgreSQL+pgvector + Storage + Auth). Added the actual controllers (materials, courses, public, analytics, students, health) and services (materials, courses, rag, ai, quiz, outlines). |
| `SDD/drawio/package_diagram_ces_sail.drawio` and `..._spacious.drawio` | Removed `P001..P005` packages and `Infrastructure` lane (Database/File Storage/RAG Service/Vector Store). Replaced with the actual `/src` directory layout: frontend pages/components/services/context/types/constants; backend routes/controllers/services/middleware/lib/config/types/data; supabase SQL + storage + auth + pgvector; LLM providers. |
| `SDD/drawio/st001_state_machine_login.drawio` (new) | ST001 state machine for UC001 Login. Old PSM1 shape was `Unauthenticated → Login submitted → Authenticating → Authenticated` (email+password). New PSM2 shape: `Idle → OAuthPending → Authenticated` (terminal) OR `AuthFailed → Idle` on retry. Same 4-state layout and same level of detail as the original ST001. The other state machines ST002-ST009 are kept as-is (still generic and accurate for the current implementation). |

## What I did NOT change (already correct, copied as-is)

| File | Why kept |
|---|---|
| `SRS/drawio/use_case_ces_sail.drawio` | Per your instruction: use cases are correct, do not add new ones. |
| `SRS/drawio/activity_uc002_extract_learning_outcomes.drawio` | Generic flow still applies. |
| `SRS/drawio/activity_uc003_generate_content.drawio` | Generic flow still applies. |
| `SRS/drawio/activity_uc004_create_quizzes.drawio` | Generic flow still applies. |
| `SRS/drawio/activity_uc006_share_course_link.drawio` | Generic flow still applies. |
| `SRS/drawio/activity_uc008_access_mini_course.drawio` | Generic flow still applies. |
| `SRS/drawio/activity_uc009_take_quiz.drawio` | Generic flow still applies. |
| `SRS/mermaid/uc002_*.mmd` … `uc009_*.mmd` (6 files) | Generic flow still applies. |

(The 9 ST001-ST009 state machines in `SDD/artifacts/` are not present in `sdd_assets_uml_v2 copy/` so I have not touched them. They are generic in-flow diagrams; you can leave them or re-derive from the SRS activity diagrams if you want, but the text is already PSM2-aligned.)

## Workflow for you

1. Open any of the changed `.drawio` files in [app.diagrams.net](https://app.diagrams.net) (File → Open from Device) or just drag-and-drop into the browser.
2. Verify the diagram looks right.
3. **Export as PNG** with these settings (must match the originals):
   - Format: PNG
   - Border width: 10 px
   - Scale: 100 %
   - Selection: Current page
   - Background: white
   - Grid: OFF, Shadow: OFF
4. **Save with the same filename** as the PNG currently in `documents_psm2/SRS/artifacts/` or `documents_psm2/SDD/artifacts/`. The mapping is below.

| Draw.io source file | Filename to overwrite in `artifacts/` |
|---|---|
| `SRS/drawio/state_diagram_mini_course.drawio` | `image_000004_<hash>.png` (SRS state diagram figure) |
| `SRS/drawio/domain_model_ces_sail.drawio` | `image_000003_<hash>.png` (SRS class diagram) |
| `SRS/drawio/activity_uc001_login.drawio` | `image_000005_<hash>.png` (SRS login activity) |
| `SRS/drawio/activity_uc005_view_simple_analytics.drawio` | `image_000013_<hash>.png` (SRS analytics activity) |
| `SRS/drawio/activity_uc007_update_course_info_slides.drawio` | `image_000017_<hash>.png` (SRS upload activity) |
| `SRS/mermaid/*.mmd` | regenerate PNGs (you can paste the Mermaid into mermaid.live and screenshot, or use a CLI tool) |
| `SDD/drawio/state_diagram_mini_course.drawio` and `..._spacious.drawio` | `image_000004_<hash>.png` (SDD ERD) and `image_000005_<hash>.png` (SDD package) - or you can pick the matching one based on the caption. The SDD.md references the state diagram at `image_000004_<hash>.png`. |
| `SDD/drawio/component_architecture_ces_sail.drawio` and `..._spacious.drawio` | `image_000002_<hash>.png` (SDD component diagram) |
| `SDD/drawio/package_diagram_ces_sail.drawio` and `..._spacious.drawio` | `image_000005_<hash>.png` (SDD package diagram) |

5. **Domain model shortcut:** for the ERD, the cleanest approach is to take a screenshot of the Supabase Table Editor showing all 6 tables (or open `supabase/mvp_schema.sql` in a SQL tool with an ER diagram view). The column lists in the new `domain_model_ces_sail.drawio` are already what Supabase expects.

6. **Commit and push** the new PNGs (filename does not need to change, just the content):
   ```sh
   cd /Users/Areeb/Quizify
   git add documents_psm2/SRS/artifacts/ documents_psm2/SDD/artifacts/
   git commit -m "docs: redraw PSM2 figures (state, domain, login, analytics, upload, component, package)"
   git push origin main
   ```

## Filename cheat sheet

The exact filenames in `documents_psm2/SRS/artifacts/` and `documents_psm2/SDD/artifacts/` (the `<hash>` is preserved when you re-export with the same shape):

```
SRS/artifacts/image_000004_3ab581715b3c971e94920b2f04f62b99e5ce19ffd6cdb029cefb3294426a2f2e.png   <- state diagram (NEW: 3 states)
SRS/artifacts/image_000003_3bd3adeb05061bf386cbd779e804a89e9d3d774e0cbf88142896355bc81c6f4f.png   <- domain model (NEW: 6 Supabase tables)
SRS/artifacts/image_000005_b129b09454e0e310caf0884c39ae715a84efb23887b3a78c042eb2a335b0d8c0.png   <- login activity (NEW: Google OAuth)
SRS/artifacts/image_000013_b20ed629099f4db0fd4002b1523078adbbc2d7e27149b3bd2524b6af2ae97df7.png   <- analytics activity (NEW: rich dashboard)
SRS/artifacts/image_000017_7df3cafcf1507503ddb13ae7d93de04f16cc84e6a5ac4b809ff8028b391d9abf.png   <- upload activity (NEW: PDF+PPTX+embed)

SDD/artifacts/image_000004_7769ec3c0d66cd2a7c2e6d645b959bf92c3d150b0141e2c20422f1de5d39add8.png   <- ERD (NEW: 6 Supabase tables - same as SRS domain)
SDD/artifacts/image_000002_cc8ba3a644b642230ea76a2acba4f0122ac036b09714c733f03bdad3c7728173.png   <- component diagram (NEW: Supabase subsystem)
SDD/artifacts/image_000005_f5485bc5f617dd4082621b6d8ac1c23a74ba9ef38fbe8a8b8a608aa07a186ad0.png   <- package diagram (NEW: actual /src layout)
```

(The SDD also has `_spacious` versions of the state/component/package diagrams - export the spacious ones first then the regular ones if you want both, or just export one and overwrite both filenames.)

## What you can ignore

- The UI screen mockups in `SDD/artifacts/image_000034..image_000043` are CES-SAIL branded. These are still PSM1-style and need re-screenshots from the running app. I have not included source files for them because they are mockups, not UML. To fix: run the app, take a screenshot, and save with the same filename.
- The ST001-ST009 state machines in `SDD/artifacts/image_000016..image_000024` are generic in/out flow diagrams. Their source `.drawio` files are not in the `sdd_assets_uml_v2 copy` folder, so I have not updated them. They can stay as-is; the text descriptions of those state machines in SDD.md are already PSM2-aligned.
