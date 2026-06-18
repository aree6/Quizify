# PSM2 Submission Documents

This folder is the source of truth for the three PSM2 documents:

- `SRS/sources/SRS.md` — Software Requirements Specification (v2.1)
- `SDD/sources/SDD.md` — Software Design Description (v2.0)
- `STD/sources/STD.md` — Software Test Documentation (v2.0)

The accompanying diagram exports live next to each source file:

- `SRS/artifacts/image_000XXX_*.png` — 23 PNG figures referenced by `SRS.md`
- `SDD/artifacts/image_000XXX_*.png` — 44 PNG figures referenced by `SDD.md`
- `STD/artifacts/image_000000_*.png` — 1 PNG (UTM cover banner)

The text in all three Markdown files is already at PSM2 baseline.
A small number of UML diagrams are still rendered from the old PSM1 export
and must be redrawn in Draw.io. See [`DIAGRAM_UPDATE_CHECKLIST.md`](./DIAGRAM_UPDATE_CHECKLIST.md)
for the per-figure status (correct / wrong / mockup placeholder) and the
specific changes each one needs.

## Layout

```
documents_psm2/
├── README.md                       (this file)
├── DIAGRAM_UPDATE_CHECKLIST.md     per-diagram update plan
├── SRS/
│   ├── sources/SRS.md              source text
│   ├── artifacts/                  23 UML/UI figure PNGs
│   └── images/                     (reserved; body figures live in base/SRS/images)
├── SDD/
│   ├── sources/SDD.md              source text
│   └── artifacts/                  44 UML/UI figure PNGs
└── STD/
    ├── sources/STD.md              source text
    └── artifacts/                  1 UTM cover banner PNG
```

## Drawing source

All diagrams are authored in Draw.io:
https://drive.google.com/file/d/1pmQGUTRsQPvv_Rlh3O6TXpdZs8178-We/view?usp=sharing

When you update a page, re-export it as PNG and replace the matching
`image_000XXX_…png` in the right `artifacts/` folder. The HTML in
`/Users/Areeb/Quizify/base/{SRS,SDD,STD}/*.html` references the same file names,
so the regenerator (`output_v2/scripts/clean_html.py`) will pick up the new
images automatically.

## How the final PDFs and DOCXs are built

```sh
cd /Users/Areeb/Quizify/output_v2
python3 scripts/clean_html.py
# then per document folder (SRS, SDD, STD), run:
#   weasyprint <doc>/<doc>.html <doc>/<doc>.pdf --stylesheet <doc>/document.css
#   pandoc   <doc>/<doc>.html -o <doc>/<doc>.docx --reference-doc=../templates/reference.docx
```

See `/Users/Areeb/Quizify/output_v2/README.md` for full regeneration
instructions.

## Updating a diagram

1. Edit the matching page in the [Draw.io source](https://drive.google.com/file/d/1pmQGUTRsQPvv_Rlh3O6TXpdZs8178-We/view?usp=sharing).
2. Export the page as PNG and overwrite the same `image_000XXX_…png` here.
3. (Optional) Run `python3 output_v2/scripts/clean_html.py` to verify the
   updated figure shows up in the cleaned HTML.
4. Commit and push.
