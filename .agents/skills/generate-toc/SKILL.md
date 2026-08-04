---
name: generate-toc
description: Generate or refresh report TOC.md files in this repository. Use when Codex needs to create, update, verify, or repair a Japanese report table of contents from sections/*.md and appendix headings, matching the TOC.md style used by 202605-necessity-of-linguistic-ability.
---

# Generate TOC

Generate `TOC.md` from the report's chapter files instead of hand-editing links.

## Workflow

1. Identify the report project root. It should contain flat chapters under `sections/`, or numbered part directories under `sections/`, and may contain `APPENDIX.md` or `APPENDIX*.md`.
2. Run the bundled script from the repository root:

```bash
python3 .agents/skills/generate-toc/scripts/generate_toc.py <project-dir>
```

3. Review the generated `TOC.md` for report-specific additions that the script cannot infer.
4. If only checking consistency, run:

```bash
python3 .agents/skills/generate-toc/scripts/generate_toc.py <project-dir> --check
```

## Expected Format

Match this structure:

```markdown
## 目次

- [1. 章タイトル](sections/1.md)
  - [1.1 節タイトル](sections/1.md#11-節タイトル)
- [付録A. 付録タイトル](APPENDIX.md)
```

For a report organized into parts, match this structure:

```markdown
## 目次

- [第1部 部タイトル](sections/01/PART.md)
  - [1. 章タイトル](sections/01/01.md)
    - [1.1 節タイトル](sections/01/01.md#11-節タイトル)
```

## Conventions

- Use the first `##` heading in each `sections/{n}.md` as the chapter title.
- For part-based reports, use `sections/{part}/PART.md` with a `#` heading, and keep numbered chapter files in the same directory with `##` headings.
- Use `###` headings under each chapter as nested TOC entries.
- Sort part directories and chapter files numerically.
- Include appendix files as top-level TOC entries using their first `##` heading.
- Generate relative links only.
- Use GitHub-style Markdown anchors: lowercase ASCII, remove punctuation such as `.` `、` `・`, and replace whitespace with `-`.
- Do not include source notes or draft files under `src/`.
