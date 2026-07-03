---
name: report-artifacts
description: Use when creating, updating, or reviewing report project deliverables in this repository, especially the shared artifact layout for abstracts, references, tables of contents, and chapter files.
---

# Report Artifacts

Use this skill when working with report deliverables. Project-specific `AGENTS.md` files define the report title, inputs, and writing rules; this skill defines the common output structure.

## Artifact Layout

Create and maintain these files at the project root:

- `ABSTRACT.md`: Abstract (ja: 要旨)
- `REFERENCES.md`: References (ja: 参考文献)
- `TOC.md`: Table of Contents (ja: 目次)
- `sections/{n}.md`: Section {n} (ja: 第{n}章)
- `metadata.json`: Metadata

## Conventions

- Keep source notes and drafts under `src/`; do not treat them as final artifacts.
- Write each chapter artifact in `sections/{n}.md`.
- Start each artifact with a level-2 heading (`##`) unless the project-specific instructions say otherwise.
- Preserve project-specific additions in `AGENTS.md`; this skill only standardizes the shared deliverable structure.

## Footnotes

Pandoc renders all artifacts as one document, so footnote identifiers must be unique across the whole report, not only within one file.

- Do not use local numeric IDs such as `[^1]`, `[^2]`, or `[^note]` in final artifacts.
- Use stable global IDs that include the artifact identity, for example `[^s3-raci]`, `[^s7-cmmi]`, `[^abstract-term]`, or `[^appendix-dataset]`.
- When moving text between chapters, update both the footnote reference and the matching definition.
- Before generating HTML, run the repository's document generation or test command so duplicate footnote IDs are caught.

## Metadata

Generate document metadata as minimal JSON:

```json
{
  "title": ...,
  "description": ...
}
```

* `title`: The report title. Use same language as the report writing rule.
* `description`: A one-sentence summary for search snippets and OGP cards. Compress the abstract into about 80-120 Japanese characters, put the main claim or conclusion first, and avoid citations, Markdown, and line breaks.
* Do not add extra attributes unless project-specific instructions require them.
