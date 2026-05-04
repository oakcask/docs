---
name: bibliography-fetch
description: Retrieve references and citations efficiently by checking a local bibliography cache before using web search or source-specific lookup. Use when Codex needs to find papers, books, articles, standards, URLs, citations, BibTeX, DOI metadata, arXiv entries, or source lists for research, writing, documentation, literature reviews, or source verification.
---

# Bibliography Fetch

Use this skill whenever reference discovery or citation lookup is part of the task. Check `.bibliography-cache/` first, then refresh only when the cache is missing, stale, or insufficient.

## Workflow

1. Parse the request into a lookup target:
   - DOI
   - arXiv ID
   - ISBN
   - URL
   - title
   - topic query

2. Inspect `.bibliography-cache/`:
   - check `registry.json` when present
   - check exact identifier directories
   - check canonical URL hashes
   - check normalized title matches
   - check previous query hashes

3. Decide freshness:
   - use the cache when `valid_until` is today or later
   - refresh when stale
   - refresh when the user asks for latest, current, recent, today, or similar time-sensitive information
   - refresh when the cached record lacks enough metadata for the requested citation style

4. Return cached data when usable:
   - cite the cached source
   - include source URLs
   - mention the cached `accessed_at` when relevant

5. Fetch fresh data when needed:
   - prefer primary sources over summaries
   - use publisher, DOI registry, arXiv, ISBN/library catalog, standards body, official docs, or original web page when available
   - use web search for discovery when no direct source is known
   - verify bibliographic fields against at least one authoritative source when practical

6. Save fresh data:
   - create or update the reference record using `bibliography-cache` conventions
   - set `accessed_at` to today's date
   - set `fetched_at` to the current timestamp
   - set `valid_until` from the freshness policy
   - update `registry.json` when adding stable identifiers

7. Answer the user:
   - state whether results came from cache or fresh lookup
   - provide citations in the requested style
   - include links to sources used
   - flag uncertain metadata instead of silently guessing

## Source Preference

Prefer sources in this order:

1. Official identifier pages: DOI, arXiv, ISBN/library catalog
2. Publisher or official host
3. Standards body, government, or project documentation
4. Author-maintained page or institutional repository
5. Scholarly index or library metadata
6. General web search result

For software documentation, use official documentation and release notes. For legal, policy, pricing, standards, or other high-change material, treat cached data as stale unless the freshness window clearly covers the request.

## Cache Miss Handling

If no cache exists, create only the records needed for the current task. Do not build a broad bibliography unless the user asks for one.

If web access is unavailable, report that the cache was checked and fresh lookup could not be completed. Return cached data only if it is clearly marked with `accessed_at` and freshness status.

## Copyright And Quotes

Cache summaries and bibliographic metadata, not full articles. Keep excerpts short and only when needed for verification. Follow the active environment's copyright and citation rules.

Read `references/fetch-checklist.md` for a compact operational checklist before large bibliography searches.
