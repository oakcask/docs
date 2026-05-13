---
name: bibliography-cache
description: Define and maintain a local bibliography cache for references, citations, search results, source metadata, and access dates. Use when Codex needs to create, update, inspect, normalize, or validate cached bibliography records for DOI, arXiv, ISBN, URL, title, or query-based reference data.
---

# Bibliography Cache

Use this skill to keep reference metadata reusable, auditable, and cheap to retrieve. Store cache data under `.bibliography-cache/` in the current project unless the user specifies another cache root.

## Layout

Create this structure as needed:

```text
.bibliography-cache/
  registry.json
  references/
    doi/
    arxiv/
    isbn/
    url/
    title/
  searches/
  collections/
```

Use one directory per reference record. Use one directory per cached search query.

## Identifier Order

Choose the most stable key available:

1. DOI
2. arXiv ID
3. ISBN
4. Canonical URL hash
5. Normalized title, year, and first author hash
6. Normalized search query hash

Normalize DOI values to lowercase and strip URL prefixes such as `https://doi.org/`. Normalize ISBN values by removing hyphens and spaces. Canonicalize URLs by removing common tracking parameters before hashing.

## Record Files

Each reference record should contain:

- `metadata.json`: required structured metadata
- `citation.md`: required human-readable citation strings
- `notes.md`: optional agent-written relevance notes
- `snapshot.md`: optional short page summary for URL-based sources

Do not cache full copyrighted articles. Cache metadata, links, short permitted excerpts, citation strings, and agent-written summaries.

## Required Metadata

Use ISO dates. Include these fields in every `metadata.json`:

```json
{
  "cache_schema": "bibliography-cache/v1",
  "source_type": "doi",
  "title": "",
  "authors": [],
  "year": null,
  "venue": "",
  "doi": "",
  "arxiv_id": "",
  "isbn": "",
  "url": "",
  "publisher": "",
  "source_published_at": null,
  "source_updated_at": null,
  "accessed_at": "YYYY-MM-DD",
  "fetched_at": "YYYY-MM-DDTHH:MM:SSZ",
  "valid_until": "YYYY-MM-DD",
  "freshness_policy": "scholarly-default",
  "citation_styles": {
    "markdown": "",
    "apa": "",
    "bibtex": ""
  },
  "verification": {
    "method": "",
    "sources_checked": [],
    "confidence": "medium"
  }
}
```

Leave unknown optional fields empty or null instead of inventing values.

## Freshness

Treat a record as stale when `valid_until` is before today, when the user asks for current/latest information, or when a fast-changing source has no `source_updated_at`.

Default freshness windows:

```text
scholarly-default: 180 days
doi-metadata: 365 days
arxiv: 30 days
book: 365 days
web-page: 90 days
stable-official-page: 180 days
news: 7 days
law-policy-standard: 7 days
software-docs: 30 days
current-request: 0 days
```

Set `accessed_at` to the retrieval date. Set `fetched_at` to the retrieval timestamp. Set `valid_until` from the selected freshness policy unless the user specifies a stricter rule.

## Search Cache

For cached searches, create:

```text
searches/<query-hash>/
  query.json
  results.json
  summary.md
```

`query.json` should include the query text, language, filters, requested citation style, `accessed_at`, `fetched_at`, `valid_until`, and `freshness_policy`.

`results.json` should contain a ranked list of reference record keys or source URLs. Do not duplicate full reference metadata when a reference record already exists.

## Registry

Keep `registry.json` small. Use it as an index from normalized identifiers to record locations:

```json
{
  "cache_schema": "bibliography-cache/v1",
  "updated_at": "YYYY-MM-DDTHH:MM:SSZ",
  "records": {
    "doi:10.0000/example": "references/doi/<key>",
    "url:<hash>": "references/url/<hash>"
  }
}
```

Read `references/cache-schema.md` for a compact checklist when creating or reviewing cache files.
