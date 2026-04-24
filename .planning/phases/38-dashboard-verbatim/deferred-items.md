## Plan 38-08 deferred items

- WeekAhead.test.tsx (6 failing tests) — pre-existing failures NOT caused by 38-08. Out of scope.

## Deferred from 38-04 Digest

- **Future:** Create `intelligence_digest` table + RLS + service + `useIntelligenceDigest` hook to replace `useActivityFeed`. Current Digest shows internal activity, not external intel signals. Deferred per user decision 2026-04-25.
  - Semantic compromise accepted: `source = actor_name` reads as internal user, not a publication/news outlet (e.g., "Reuters", "Al Sharq" as mocked in the handoff). The correct long-term shape is an `intelligence_digest` row with `(tag, headline, source_publication, published_at, external_url)`.
  - Migration path: once the dedicated hook lands, swap the import in `frontend/src/pages/Dashboard/widgets/Digest.tsx` and update the field map; no widget layout/visual changes required.
