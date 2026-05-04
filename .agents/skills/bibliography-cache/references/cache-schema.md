# Cache Schema Checklist

Use this checklist when creating or reviewing `.bibliography-cache/` data.

## Reference Records

Every reference record must have:

- stable key chosen by DOI, arXiv ID, ISBN, URL hash, title hash, then query hash
- `metadata.json`
- `citation.md`
- `accessed_at`
- `fetched_at`
- `valid_until`
- `freshness_policy`
- at least one source URL or stable identifier

## Metadata Quality

Verify these fields when available:

- title
- authors
- year
- venue or publisher
- DOI, arXiv ID, ISBN, or canonical URL
- publication date
- source update date for web pages and software docs

Do not infer missing bibliographic facts from weak snippets. Leave fields empty or mark confidence as low.

## Citation File

`citation.md` should contain:

```markdown
# Citation

## Markdown

...

## APA

...

## BibTeX

...

## Source

- URL:
- Accessed:
```

Include only styles that are known or requested.

## Search Cache

For `searches/<query-hash>/query.json`, include:

- original query
- normalized query
- language
- filters
- requested output style
- `accessed_at`
- `fetched_at`
- `valid_until`
- `freshness_policy`

For `results.json`, store ranked result references, not duplicated full records.
