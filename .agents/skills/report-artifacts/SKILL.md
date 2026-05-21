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

## Metadata

Generate document's metadata as JSON:

```json
{
  "title": ...
}
```

* `title`: The report title. Use same language as the report writing rule.
