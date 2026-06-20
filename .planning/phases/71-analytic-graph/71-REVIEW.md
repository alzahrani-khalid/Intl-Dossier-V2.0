---
phase: 71-analytic-graph
reviewed: 2026-06-17T14:05:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - backend/tests/intelligence/fixtures/analytic-graph-seed.ts
  - backend/tests/intelligence/query-graph.clearance.integration.test.ts
  - backend/tests/intelligence/query-graph.integration.test.ts
  - backend/tests/intelligence/query-graph.invoker.integration.test.ts
  - frontend/src/components/dossier/DossierAnalyzeButton.tsx
  - frontend/src/components/dossier/DossierShell.tsx
  - frontend/src/components/keyboard-shortcuts/CommandPalette.tsx
  - frontend/src/components/keyboard-shortcuts/__tests__/CommandPalette.analyze.test.tsx
  - frontend/src/components/keyboard-shortcuts/analyze-commands.ts
  - frontend/src/components/relationships/AnalyticQueryPicker.tsx
  - frontend/src/components/relationships/AnalyticResultView.tsx
  - frontend/src/components/relationships/__tests__/AnalyticQueryPicker.test.tsx
  - frontend/src/components/relationships/__tests__/AnalyticResultView.test.tsx
  - frontend/src/hooks/useAnalyticGraph.ts
  - frontend/src/i18n/ar/graph.json
  - frontend/src/i18n/ar/keyboard-shortcuts.json
  - frontend/src/i18n/en/graph.json
  - frontend/src/i18n/en/keyboard-shortcuts.json
  - frontend/src/pages/relationships/RelationshipGraphPage.tsx
  - frontend/src/routes/_protected/relationships/graph.tsx
  - supabase/functions/analytic-graph/index.ts
  - supabase/migrations/20260617_phase71_query_graph.sql
findings:
  critical: 1
  warning: 7
  info: 5
  total: 13
status: issues_found
---

# Phase 71: Code Review Report

**Reviewed:** 2026-06-17T14:05:00Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

Phase 71 adds a multiplexed analytic-graph capability: a single `SECURITY INVOKER`
plpgsql RPC (`query_graph`) dispatching four query templates, a thin JWT-forwarding
edge function, a TanStack Query hook, an Analyze panel (picker + result view), three
Cmd+K entry points, and bilingual i18n. Three real-staging integration tests pin the
clearance gate and row shapes; two frontend unit suites pin the picker/result/command
contracts.

**Security posture is sound.** The clearance gate was reviewed against the live schema
and the three locked invariants hold:

- **No SQL injection.** Every query is parameterized plpgsql; `p_query_type` is consumed
  only via `IF/ELSIF` branch comparison (never concatenated into SQL), and the edge fn
  whitelists `queryType` against a 4-value list before it ever reaches the RPC param.
- **No clearance bypass for anon/authenticated.** The `auth.role() = 'service_role'`
  max-clearance branch is unreachable from the edge fn (which uses the ANON key + a
  forwarded caller JWT, never service-role) and from the FE (session token). `anon` is
  `REVOKE`d from `EXECUTE` (line 298); only `authenticated` is `GRANT`ed. For any
  authenticated caller, `v_clearance` is the strict `profiles.clearance_level` value read
  via the correct `WHERE p.user_id = auth.uid()` (NOT the deny-all `id =` landmine), and
  inline `sensitivity_level <= v_clearance` is applied at every `dossiers` join.
- **Indistinguishable-empty holds.** The JSONB output contains no `clearance`/`filtered`/
  `restricted` substring (verified by grep over the output structure — the only matches
  are comments and the `profiles.clearance_level` column read). "No data" and
  "above clearance" return the identical empty shape. Both i18n bundles and the result
  view carry zero tier-revealing copy, and a unit test asserts it.

The default-deny path is also correct: a missing profile yields `v_clearance := 0`, and
since `dossiers.sensitivity_level` is `CHECK (BETWEEN 1 AND 4)`, `sensitivity_level <= 0`
is never true → deny-all.

**One BLOCKER and several warnings remain**, the BLOCKER being a user-visible broken
i18n placeholder (`{{days}}`) rendered in BOTH languages on the engagement-chain count
line, plus stats inconsistencies and a directional-icon RTL issue. None of the warnings
touch the clearance gate.

## Critical Issues

### CR-01: Raw `{{days}}` i18n placeholder leaked to users in both EN and AR (engagement-chain count line)

**File:** `frontend/src/components/relationships/AnalyticResultView.tsx:182-183`, `frontend/src/i18n/en/graph.json:179`, `frontend/src/i18n/ar/graph.json:179`

**Issue:** The `analyze.count.chain` translation value declares two interpolation
variables:

```json
"chain": "{{count}} engagements over {{days}} days"        // en/graph.json:179
"chain": "{{count}} ارتباطاً خلال {{days}} يوماً"           // ar/graph.json:179
```

But `renderCountLine` only ever passes `{ count }` — `days` is never supplied:

```ts
case 'engagement_chain':
  return countLine(t, 'analyze.count.chain', '{{count}} engagements', result.nodes.length)
```

`countLine` calls `t(key, fallback, { count })` then `.replace('{{count}}', …)`. With real
i18next the JSON value wins over the code default, so the rendered string is
`"5 engagements over {{days}} days"` (EN) and `"5 ارتباطاً خلال {{days}} يوماً"` (AR) — a
literal, untranslated `{{days}}` token shown to every user on a non-empty engagement-chain
result, in both languages. The unit test masks this because the mocked `t` returns the
code default (`'{{count}} engagements'`, which has no `{{days}}`), so it never exercises the
real JSON value. This is a visible-output correctness defect (CLAUDE.md treats leaked raw
i18n keys/placeholders as a shipping defect; see project memory on dot-form key leakage).
No security/clearance impact.

**Fix:** Either supply the window or drop `{{days}}` from both JSON values. `windowDays` is
not currently threaded into `AnalyticResult`, so the lower-effort, contract-safe fix is to
remove the placeholder from the copy:

```json
// en/graph.json
"chain": "{{count}} engagements"
// ar/graph.json
"chain": "{{count}} ارتباطاً"
```

If the window is desired in the copy, thread `windowDays` from `analyticData.stats`/route
search into `AnalyticResult`, then:

```ts
case 'engagement_chain':
  return t('analyze.count.chain', '{{count}} engagements over {{days}} days', {
    count: result.nodes.length,
    days: result.windowDays ?? 90,
  }).replace('{{count}}', String(result.nodes.length)).replace('{{days}}', String(result.windowDays ?? 90))
```

## Warnings

### WR-01: Edge fn overwrites RPC `node_count`/`edge_count`, double-counting `forum_membership` edges and silently diverging from the SQL stats

**File:** `supabase/functions/analytic-graph/index.ts:151-154`

**Issue:** The RPC computes `stats.node_count = COUNT(DISTINCT d.id)` and
`stats.edge_count = COUNT(DISTINCT dr.id)` (migration L107-110). The edge fn then
unconditionally overwrites them with `nodes.length` / `edges.length`:

```ts
stats: {
  ...(result.stats ?? {}),
  node_count: nodes.length,
  edge_count: edges.length,
  ...
}
```

For `forum_membership` the `nodes`/`edges` arrays are built with `jsonb_agg(DISTINCT …)`
over _projected_ objects, not over `dr.id`. Two distinct edges that share
`(source_id, target_id, relationship_type)` collapse to one in the array but count as two
in the SQL `edge_count` — so the surfaced count can differ from the SQL count, and worse,
the RPC's authoritative `node_count`/`edge_count` are thrown away in favor of array
lengths the FE could compute itself. The complexity badge in `RelationshipGraphPage`
(L334-346) keys off `analyticData.stats.node_count`, so the displayed Simple/Moderate/
Complex tier is driven by the overwritten value, not the RPC's.

**Fix:** Decide on a single source of truth. Either trust the RPC stats and stop
overwriting (only add `query_time_ms` + `performance_warning`):

```ts
stats: {
  ...(result.stats ?? {}),
  query_time_ms: queryTime,
  performance_warning: performanceWarning,
},
```

or, if the array lengths are intentionally canonical, document why and make the RPC stop
emitting divergent counts.

### WR-02: `shortest_path` node-presence guard reused as the "no path" signal, but the SQL omits per-node clearance fields on hidden hops — verify the FE empty-state cannot render a partial path

**File:** `supabase/migrations/20260617_phase71_query_graph.sql:245-275`, `frontend/src/components/relationships/AnalyticResultView.tsx:105-128, 271-289`

**Issue:** The path-wide clearance `NOT EXISTS` (L268-273) correctly hides the _entire_
path when any hop exceeds clearance, returning `v_result = NULL` → the fallback empty
shape (no `path`/`path_length`). The FE `hasPath` guard
(`path_length > 0 && path.length > 0`) then renders the neutral empty state. This is
correct. However, the inner `nodes` subquery (L245-256) _also_ filters
`d.sensitivity_level <= v_clearance` with an `AND` inside the `JOIN`. If a future change
ever loosens the outer `NOT EXISTS` (e.g. clears only endpoints like the DEFINER original
it was copied from), the path array would still contain all hop ids while `nodes` would be
missing the hidden ones — and `AnalyticResultView` (L273) renders `orderById.get(id) ??
{ id }`, i.e. it would render the hidden hop's _raw UUID_ as a visible row name. The
current code is safe only because both guards are present and agree. This is a latent
defensive-coupling hazard, not a live leak.

**Fix:** Add a comment binding the two guards as a unit, or assert in an integration test
that a clearance-blocked intermediary hop yields `path == null` (not a partial path). The
existing clearance/invoker suites only exercise `forum_membership`; add a `shortest_path`
clearance case so the path-hiding contract is regression-locked.

### WR-03: Back-arrow / directional icon contract — `Sparkles` is fine, but confirm no chevron regression in the Analyze deep-link button on RTL

**File:** `frontend/src/components/dossier/DossierAnalyzeButton.tsx:46-52`

**Issue:** The button is RTL-safe as written (`Sparkles` is non-directional, gap-1 uses
logical flow, `minBlockSize` is logical). No defect in this file. Flagging only to record
that the broader Analyze surface in `RelationshipGraphPage` uses `Network`, `List`,
`Layers`, `Rocket`, `Sparkles`, `AlertCircle` — all non-directional — so there is no
icon-flip obligation here. No fix required; included so the RTL icon checklist is
explicitly closed for this phase.

**Fix:** None.

### WR-04: `useAnalyticGraph` runs two-entity queries before `entityId2` is present, returning misleading empty results

**File:** `frontend/src/hooks/useAnalyticGraph.ts:118-123`, `frontend/src/pages/relationships/RelationshipGraphPage.tsx:219-228`

**Issue:** The query is `enabled` as soon as `entityId` is non-empty (L121). For
`shared_committees` and `shortest_path` the edge fn _requires_ `entityId2` and returns a
400 when it is missing (index.ts L108-113). On the Analyze landing page, `query` defaults
to `'forum_membership'` so this is usually benign, but if a deep-link arrives with
`query=shortest_path` and no `entity2` (e.g. a hand-edited/stale URL — the route
`validateSearch` happily accepts `query=shortest_path` without `entity2`), the hook fires
a request that 400s, surfacing the generic `analyze.error` banner rather than prompting for
the second entity. The hook's own doc comment claims "Two-entity templates … additionally
require `entityId2`, which is enforced by the picker" — but the deep-link path bypasses the
picker.

**Fix:** Gate `enabled` on the two-entity requirement inside the hook so the request is not
issued until the contract is satisfiable:

```ts
const TWO_ENTITY: ReadonlySet<AnalyticQueryType> = new Set(['shared_committees', 'shortest_path'])
enabled:
  entityId != null && entityId.length > 0 &&
  (!TWO_ENTITY.has(queryType) || (entityId2 != null && entityId2.length > 0)),
```

### WR-05: `AnalyticResultView` type-label lookups use the wrong namespace key (`dossier.type.*` under the `graph` namespace) → always falls back to the raw enum

**File:** `frontend/src/components/relationships/AnalyticResultView.tsx:261, 300`

**Issue:** The component calls `useTranslation('graph')` (L62) then
`t('dossier.type.${node.type}', node.type)`. The `graph` bundle has the type labels under
`type.*` (en/graph.json L82-91: `type.engagement`, `type.working_group`, …), **not**
`dossier.type.*`. So every type-label lookup misses and silently renders the fallback
(the raw enum string `node.type`, e.g. `working_group` instead of "Working Group" / "مجموعة
عمل"). In AR this shows English enum tokens. The unit test passes because the mocked `t`
returns the default arg.

**Fix:** Use the correct key (the `graph` bundle already has these):

```ts
{
  node.type != null ? t(`type.${node.type}`, node.type) : '—'
}
```

(both L261 and L300). Alternatively call `t('dossier:type.…')` if the intent was the
`dossier` namespace, but the `graph` bundle already carries the labels, so `type.${…}` is
the smaller change.

### WR-06: `windowDays` typed as `number` but the chain count copy and result view never use it; window control state can desync from URL

**File:** `frontend/src/components/relationships/AnalyticQueryPicker.tsx:85, 176-193`, `frontend/src/pages/relationships/RelationshipGraphPage.tsx:226-228`

**Issue:** The picker keeps `windowDays` in local component state initialized to
`DEFAULT_WINDOW_DAYS` (90) and only ever emits it via `onRun`. When the panel mounts from a
deep-link that already carries `windowDays` in the route search, the picker does **not**
seed its window input from that value (unlike `defaultEntityId`, which is seeded). So a
deep-link `…&query=engagement_chain&windowDays=30` runs the query at 30 days (the hook reads
the route value), but the picker's visible window field shows 90. The displayed control and
the executed query disagree until the user re-runs. Minor UX/consistency defect.

**Fix:** Accept an optional `defaultWindowDays` prop and seed the window state from it (mirror
`defaultEntityId`), or lift the window into the URL-driven state the page already owns.

### WR-07: Empty-`catch` swallowing in localStorage helpers is acceptable, but `getCommandUsageCounts` will silently reset on a single corrupt entry

**File:** `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:326-346`

**Issue:** `getCommandUsageCounts` does `JSON.parse` inside a `try` that, on any parse
failure, returns `{}` — silently discarding _all_ accumulated usage frequency, not just the
corrupt key. `incrementCommandUsage` then rewrites the whole object. This is pre-existing
behavior touched only tangentially by Phase 71 (the analyze entries flow through
`incrementCommandUsage`), so it is in-scope-adjacent rather than new. Not a correctness risk
for the feature, but the swallow erases user personalization on transient corruption.

**Fix:** Out of phase scope to rework; if touched, prefer per-key tolerance (parse, validate
shape, drop only invalid keys) over wholesale reset. Otherwise leave as-is — flagged for
awareness, not required for this phase.

## Info

### IN-01: `dossier.type` label keys in the picker result view are not the only namespace drift — `analyze.commandPrefix` / `analyze.openInPanel` keys are defined but unused

**File:** `frontend/src/i18n/en/graph.json:156, 169`, `frontend/src/i18n/ar/graph.json:156, 169`

**Issue:** `analyze.commandPrefix` ("Analyze:") and `analyze.openInPanel` ("Open in the
Network panel") exist in both bundles but no reviewed component references them
(`commandPrefix` is duplicated as a hardcoded `Analyze: ` prefix in `analyze-commands.ts`
L111; `openInPanel` has no consumer in the reviewed set). Dead i18n keys.

**Fix:** Remove the unused keys, or wire `openInPanel` into the panel's "Open in Network"
deep-link affordance the docstrings reference (analyze-commands.ts L13-16 implies it exists,
but it is not in the reviewed files).

### IN-02: `analyze-commands.ts` hardcodes the English "Analyze:" prefix instead of the `commandPrefix` token

**File:** `frontend/src/components/keyboard-shortcuts/analyze-commands.ts:111`

**Issue:** `label: \`Analyze: ${template.labelSuffix}\``hardcodes English. This is by design
(the file is intentionally i18n-free and CommandPalette swaps in the localized`quickActions.analyze\*`label via`analyzeLabelKey`), and the localized labels do exist in
both bundles. No user-facing defect. Documented so the duplication (canonical English here +
localized override there) is understood, not "fixed" into a regression.

**Fix:** None required; the override path is correct.

### IN-03: `RelationshipGraphPage` non-null assertion `fetchGraphData(startDossierId!, …)`

**File:** `frontend/src/pages/relationships/RelationshipGraphPage.tsx:171`

**Issue:** `startDossierId!` is asserted non-null inside `queryFn`, guarded by
`enabled: !!startDossierId`. Safe in practice (TanStack won't run a disabled query), but the
`!` defeats strict-null checking and is the kind of pattern CLAUDE.md's strict-boolean rules
discourage. Pre-existing (not introduced by Phase 71 — the analytic hook below it correctly
uses `entityId != null && entityId.length > 0`).

**Fix:** Optional: pass a guaranteed value or early-return. Low priority; pre-existing.

### IN-04: Fixture seeds `type: 'engagement'` while the engagement extension migration comment references `'engagement_dossier'`

**File:** `backend/tests/intelligence/fixtures/analytic-graph-seed.ts:172-184`

**Issue:** The fixture inserts the engagement anchor with `type: 'engagement'`, which is the
correct value per the live `dossiers` type CHECK (`'engagement'` is in the enum;
`'engagement_dossier'` is NOT). The older migration `20260110000006_create_engagement_dossiers.sql`
carries a stale comment suggesting `type='engagement_dossier'`, which would violate the
CHECK. The fixture is correct; the legacy comment is misleading. No action on Phase 71 code.

**Fix:** None for this phase. (Optionally correct the stale comment in the older migration.)

### IN-05: `query_graph` `forum_membership` `relationship_type` whitelist includes a likely-nonexistent value

**File:** `supabase/migrations/20260617_phase71_query_graph.sql:119`

**Issue:** The membership filter is
`dr.relationship_type IN ('member_of', 'participates_in', 'participant_in')`.
`dossier_relationships.relationship_type` is a free `TEXT` (no CHECK), and the table comment
lists both `participant_in` and `participates_in` as examples, so accepting both spellings is
defensible defensive coding. The RF-7 fixture seeds only `member_of`, so the other two are
untested. Not a defect — noted so the dual-spelling is a deliberate choice, not drift.

**Fix:** None required; consider a comment that the dual spelling is intentional belt-and-suspenders.

---

_Reviewed: 2026-06-17T14:05:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
