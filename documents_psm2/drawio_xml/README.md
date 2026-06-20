# Draw.io XML Files — PSM2 Updates

This folder contains **16 plug-and-play Draw.io XML files** that you can import into your current `MOHAMMAD_AREEB_PSM1.drawio.xml` file. Each file is a single, self-contained diagram updated for the PSM2 implementation.

## How to use

1. **Open your current Draw.io file** (`MOHAMMAD_AREEB_PSM1.drawio.xml`) in [app.diagrams.net](https://app.diagrams.net)
2. **For each file below**, use **File → Import from → Device** and pick the `.drawio` file
3. The diagram appears in a new tab with **your existing style preserved** (Tahoma, fontSize=16, swimlane fillColor=#f5f5f5)
4. The diagram is now updated for PSM2 — no editing required
5. Export the new tab as PNG and overwrite the corresponding `image_000XXX_<hash>.png` in `documents_psm2/SRS/artifacts/` or `documents_psm2/SDD/artifacts/`

## Style preserved

All files use your existing style:
- **Font:** Tahoma, size 16
- **Swimlanes:** `fillColor=#f5f5f5; strokeColor=#666666`
- **Activities:** white fill, black stroke, `arcSize=20`
- **Decisions:** white fill, black stroke (rhombus)
- **Edges:** black stroke, classic arrow
- **State machines:** rounded rectangles, terminal bull's-eye

## Folder structure

```
drawio_xml/
├── build_diagrams.py            (script that produced all 16 files)
├── 01_top_level/                (diagrams shared across SRS + SDD)
│   ├── sequence_whole.drawio     (was "sequence diagram whole")
│   ├── component.drawio          (was "component diagram")
│   ├── package.drawio            (was "pakage diagram" — typo kept as-is)
│   ├── erd.drawio                (was "erd diagram")
│   ├── domain_model.drawio       (was "domain model" — tables only, state separated)
│   ├── class.drawio              (was "class diagram")
│   └── state_mini_course.drawio  (was "stateDiagram" — 3 states)
└── 02_per_uc/
    ├── US001/
    │   ├── US001_activity.drawio
    │   ├── US001_sequence.drawio
    │   └── US001_state.drawio
    ├── US002/
    │   └── US002_sequence.drawio
    ├── US004/
    │   └── US004_sequence.drawio
    ├── US005/
    │   ├── US005_activity.drawio
    │   └── US005_sequence.drawio
    └── US007/
        ├── US007_activity.drawio
        └── US007_sequence.drawio
```

## What was changed (summary)

| Diagram | What changed |
|---|---|
| **sequence_whole** | Firebase arch → Supabase arch. Auth API → Supabase Auth. RAG Service/File Storage/Database → Supabase lanes. PDF only → PDF or PPTX. Added preview/confirm flow. |
| **component** | Removed Auth API, RAG Service, Vector Store, File Storage, Database. Added single Supabase subsystem (PostgreSQL+pgvector, Storage, Auth). |
| **package** | Removed P001..P005 + Infrastructure. Added actual /src layout (frontend, backend, supabase, LLM). |
| **erd** | 11 PSM1 entities → 6 Supabase tables with FK arrows. |
| **domain_model** | 11 PSM1 classes → 6 Supabase tables. (State diagram separated into its own file.) |
| **class** | 11 PSM1 classes → 6 Supabase tables + 6 service modules. |
| **state_mini_course** | 6 states → 3 states (Generating → Ready → Shared). |
| **US001** (all 3) | email+password → Google OAuth. |
| **US002** (sequence) | RAG Service/Database → Supabase. |
| **US004** (sequence) | Save QuizQuestion+QuizOption → questions table. |
| **US005** (activity+sequence) | Flat results table → rich dashboard. |
| **US007** (activity+sequence) | PDF only → PDF+PPTX. |

## What was NOT changed (no files produced)

These diagrams are already correct and don't need to be re-imported:

- **`usecase diagram`** (no new use cases per your earlier instruction)
- **`US002` activity** (generic flow, still accurate)
- **`US003` (all 3)** (generic flow, still accurate)
- **`US004` activity + state** (generic flow, still accurate)
- **`US005` state** (generic flow, still accurate)
- **`US006` (all 3)** (generic flow, still accurate)
- **`US007` state** (generic flow, still accurate)
- **`US008` (all 3)** (generic flow, still accurate)
- **`US009` (all 3)** (generic flow, still accurate)
- **`old usecase`** (backup, not used)
