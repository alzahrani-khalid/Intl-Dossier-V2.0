---
tags: [performance]
summary: performance implementation decisions and patterns
relevantTo: [performance]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 2
  referenced: 2
  successfulFeatures: 2
---

# performance

### Query key factory (queryKeys.savedSearches, queryKeys.pinned) pattern instead of string-based keys for React Query caching (2026-01-13)

- **Context:** System needed reliable cache invalidation across multiple tabs (All/Pinned/Smart Filters) without manual string management
- **Why:** Object-based keys provide type safety, enable hierarchical invalidation (invalidate all saved searches when creating new one), and make refactoring easier. Factory pattern centralizes key generation logic
- **Rejected:** String keys like 'saved_searches_all' - error-prone, hard to maintain consistency, makes hierarchical invalidation difficult
- **Trade-offs:** Slight verbosity in hook definitions but massive improvement in cache invalidation reliability and refactoring safety
- **Breaking if changed:** Changing to string keys would require manual tracking of all cache dependencies and lose ability to bulk-invalidate related queries

### TanStack Query used for API caching with `useScenarioSandbox` hook managing query lifecycle. Mobile viewport test shows 667px height, larger than typical mobile but within tablet range. (2026-01-14)

- **Context:** Preventing redundant API calls to list scenarios while supporting real-time updates; testing responsive design requires specific viewport size
- **Why:** TanStack Query automatic caching avoids refetching unchanged data. 667px viewport tests within iPad mini range, more realistic than 568px for actual user scenarios.
- **Rejected:** Manual state management would require cache invalidation logic; 568px viewport (old iPhone SE) is outdated for 2024 testing
- **Trade-offs:** TanStack Query adds dependency but eliminates cache management code. Testing at 667px catches more real-world issues but misses smaller phone edge cases.
- **Breaking if changed:** Removing TanStack Query requires implementing manual cache invalidation triggering extra API calls. Changing viewport size may miss breakpoint bugs in actual used devices.

### Implemented 1-second debounced auto-save instead of immediate or longer interval persistence (2026-01-14)

- **Context:** Form changes triggered on every keystroke but needed to minimize IndexedDB write operations
- **Why:** 1 second balances UX (reasonable recovery granularity) with performance (avoids excessive I/O overhead). Too short (100ms) thrashes storage; too long (5s) loses recent changes on crash
- **Rejected:** No debounce (excessive writes), 5-second debounce (data loss risk), onChange-based save (performance hit on every keystroke)
- **Trade-offs:** 1 second adds imperceptible latency for auto-save feedback but eliminates 80%+ of unnecessary writes; users see minor delay before guaranteed persistence
- **Breaking if changed:** Removing debounce makes app unresponsive on large forms; extending beyond 2-3s increases data loss risk during unexpected closures

### Combined scoring algorithm uses match quality (50%) + recency (30%) for entity ranking, not pure text relevance (2026-01-14)

- **Context:** Users frequently search for recently-interacted entities, but text search alone surfaces old matches first
- **Why:** Dossier systems have high entity reuse; recent entities are statistically more relevant. Recency weighting ensures 'Ministry of Finance (2024)' ranks above 'Ministry of Finance (2015)' for same query
- **Rejected:** Pure BM25 relevance scoring (misses temporal patterns). TF-IDF only (ignores interaction patterns users expect)
- **Trade-offs:** Recency bias sometimes surfaces less-relevant matches early; mitigated by 50/50 split preventing complete chronological ordering
- **Breaking if changed:** Removing recency component reverts to relevance-only, causing user frustration when looking for recently-used entities buried in results

#### [Pattern] Used Framer Motion for chip add/remove animations instead of CSS transitions (2026-01-14)

- **Problem solved:** Visual feedback for filter state changes (chips appearing/disappearing) without blocking interaction
- **Why this works:** JavaScript animation library allows coordinated animations across multiple chips with proper sequencing. CSS transitions alone don't handle dynamic list changes smoothly when items are added/removed from DOM
- **Trade-offs:** Easier: built-in layout animations, easing curves, coordinated timing. Harder: adds library dependency; slightly larger JS bundle

#### [Gotcha] Edge function generates personalized digest content on-demand for each user rather than pre-computing and storing digests (2026-01-15)

- **Situation:** Notifications-digest edge function reads user preferences and queries activity data every time to generate email content
- **Root cause:** Avoids stale digest storage; preferences can change without invalidating cached digests; simpler data model with no digest archive table needed
- **How to avoid:** Higher computational cost per email send; more database queries at send time; but simpler schema and no cache invalidation concerns
