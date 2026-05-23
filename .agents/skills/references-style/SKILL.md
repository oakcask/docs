---
name: references-style
description: Standardize report REFERENCES.md files in this repository. Use when creating, rewriting, reviewing, or validating Japanese reference lists, citation sections, source metadata, access dates, DOI/URL/ISBN formatting, or category headings for report deliverables.
---

# References Style

Use this skill when working on a report project's `REFERENCES.md`. Pair it with `bibliography-fetch` when metadata must be looked up or verified.

## Target Shape

`REFERENCES.md` should be a curated bibliography, not a raw source dump.

```markdown
## 参考文献

アクセス日は、特に断りのない限りYYYY年M月D日である。ウェブ記事の公開日・更新日は、公開ページで確認できる範囲を記す。

### 分野・用途

- 著者（年）「論文・記事タイトル」『媒体名』巻(号), 開始-終了頁。DOI: <https://doi.org/...>
- 著者（年）『書籍タイトル』出版社。ISBN: ...
- 組織名（年またはn.d.）「ページタイトル」『サイト名』参照日。URL: <https://...>
```

Use `###` for top-level categories. Use `####` only when a large category needs stable subgroups. Keep every reference as one bullet.

## Ordering

- Put sources in thematic categories that match the report argument.
- Start with primary or central literature when the report has a defined core source set.
- Within a category, use a stable order: importance for argument-first lists, otherwise author/organization name and year.
- Keep official, primary, peer-reviewed, and secondary/commentary sources distinguishable through category names or short introductory notes.
- Do not mix draft notes, relevance comments, or quoted evidence into the reference item. Put those elsewhere unless the project explicitly asks for annotations.

## Required Metadata

Prefer complete metadata over terse links. Capture the fields that exist for the source type:

- Scholarly article: authors, year, title, journal/proceedings, volume, issue, pages or article number, DOI.
- Book: authors/editors, year, title, edition when relevant, publisher, ISBN when known.
- Chapter: chapter authors, year, chapter title, book title, editors, publisher, pages, DOI or URL when available.
- Web page or article: author or organization, year or `n.d.`, page/article title, site/publication name, publication or update date when visible, URL.
- Standards, laws, policy, or official guidance: issuing body, year/version/date, title, edition/status when relevant, URL, and any currency caveat if the status may change.
- Games, manga, films, and other primary works: creator/publisher, title, release years, consulted version, and the exact chapter/episode/scene/path when the report relies on a specific passage or interaction.

Use `n.d.` only when no publication year can be established. Do not invent missing dates, editions, page ranges, or authors.

## Formatting Rules

- Write Japanese author/organization names as `著者（年）`; write English-language scholarly sources as `Author, A. A., & Author, B. B. (Year).` unless the surrounding file already uses a consistent English bibliographic style.
- Use Japanese corner brackets for Japanese titles: 「記事・論文」 and 『書籍・媒体』.
- Use italic Markdown for English book, journal, proceedings, and report titles when following English style.
- In artifact `REFERENCES.md` files, render DOI and web links as Markdown autolinks wrapped with `<` and `>`.
- Render DOI values as `DOI: <https://doi.org/...>`.
- Render web links as `URL: <https://...>`.
- When converting a Markdown title link such as `[Title](https://...)`, keep the title as plain bibliographic text and put the URL separately as `URL: <https://...>` or `DOI: <https://doi.org/...>`.
- Render ISBN values as `ISBN: ...`.
- Use half-width hyphens for numeric page ranges, for example `47-89`.
- End Japanese-form entries with `。`. Keep punctuation consistent inside the file.
- Avoid Markdown link titles in this repository style unless the file already consistently uses them and the user asks to preserve that style.

## Access Dates

- Prefer a single access-date note at the top when most web sources were checked on the same date.
- Add an item-level access date only when it differs from the top note, when the file already uses item-level access dates, or when the source is volatile.
- Use absolute Japanese dates: `2026年5月11日参照`.
- For pages that show only relative update text, state the observation cautiously instead of converting it to a firm date.

## Validation Checklist

Before finishing, check:

- The heading and category levels are consistent.
- Every bullet has enough metadata to identify the source without opening the URL.
- URLs, DOI links, ISBNs, and access dates use one format across the file.
- Sources that require current status checks, such as laws, standards, official guidance, product docs, and recent news, have been verified for the requested date.
- No placeholder metadata remains.
- The style is consistent with this skill unless the report's `AGENTS.md` gives a stricter rule.
