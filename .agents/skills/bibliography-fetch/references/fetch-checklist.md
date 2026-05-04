# Fetch Checklist

Use this checklist for bibliography searches with multiple references or time-sensitive sources.

## Before Searching

- Identify whether the user asked for a specific source, citation, or topic search.
- Check `.bibliography-cache/registry.json`.
- Check exact identifiers before query-based cache entries.
- Confirm freshness from `valid_until`.
- Treat latest/current requests as requiring refresh.

## During Fresh Lookup

- Prefer primary sources.
- Record all source URLs used for verification.
- Compare title, author, year, and venue when multiple sources disagree.
- Use stable identifiers whenever available.
- Avoid citing search snippets as authoritative sources.

## After Lookup

- Write or update the cache record.
- Set `accessed_at` to today's date.
- Set `fetched_at` to the current timestamp.
- Set `valid_until` according to the selected freshness policy.
- Update `registry.json` for stable identifiers.
- Return whether the answer used cache or fresh lookup.
