# Phase 49: Bundle Budget Reset — Pattern Map

**Mapped:** 2026-05-12
**Files analyzed:** 4 modified / 2 created / 1 settings-only (branch protection) / N source files (lazy() conversions — audit-driven)
**Analogs found:** 7 / 7 (every modification has a verbatim donor inside the live repo or Phase 47/48 plans)

The driving insight: **Phase 49 is the third symmetric twin of Phase 47/48.** The CI-gate + branch-protection + smoke-PR shape is a verbatim lift from `47-03-…-PLAN.md` Task 4–5 and `48-03-…-PLAN.md` Task 2–3 — only the context-name literal changes (`Bundle Size Check (size-limit)` instead of `type-check` or `Lint`). The build-side surgery (manualChunks branches, sub-vendor ceilings, lazy() conversions) has eight live in-repo donor sites — none of it is greenfield.

The audit/docs surface (Wave 0 gap) — `frontend/docs/bundle-budget.md` + `.planning/…/49-BUNDLE-AUDIT.md` — has no in-repo analog (D-09 / D-05 are creation-from-research), so the planner authors the schema verbatim from `49-RESEARCH.md` Patterns 6 + 7.

## File Classification

| File                                                                            | Role                      | Data Flow              | Closest Analog                                                                                     | Match Quality                                       |
| ------------------------------------------------------------------------------- | ------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `frontend/vite.config.ts` (modify, lines 132–186)                               | build config              | transform (id → chunk) | self — existing `manualChunks` arrow (10 existing branches)                                        | exact (self-extend)                                 |
| `frontend/.size-limit.json` (rewrite ceilings + add entries)                    | size budget               | static enforcement     | self — current 6 entries follow the schema Phase 49 extends                                        | exact (self-edit)                                   |
| `frontend/scripts/assert-size-limit-matches.mjs` (extend `expectedMatchCounts`) | CI guard / glob sanity    | static enforcement     | self — line 42–48 map with 5 entries                                                               | exact (self-extend)                                 |
| `frontend/docs/bundle-budget.md` (CREATE — folder + file new)                   | docs / living rationale   | reference              | No in-repo analog. Schema lifted from `49-RESEARCH.md` Pattern 6                                   | none (greenfield artifact)                          |
| `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` (CREATE)           | audit artifact (one-shot) | reference              | `.planning/phases/48-…/48-VERIFICATION.md` (sibling phase-internal snapshot pattern)               | role-match                                          |
| Branch-protection on `main` (settings change — no file)                         | CI gate / repo config     | gate (PUT API call)    | `.planning/phases/48-lint-config-alignment/48-03-…-PLAN.md` Task 2 (verbatim `gh api PUT` payload) | exact (Phase 48 → 49 with one context-string delta) |
| Smoke PR A — initial-JS overflow (ephemeral branch)                             | CI proof                  | gate-blocks proof      | `.planning/phases/48-…/48-03-…-PLAN.md` Task 3 frontend smoke + `47-03-…-PLAN.md` Task 5 smoke     | exact (mechanics verbatim; trip-wire differs)       |
| Smoke PR B — sub-vendor chunk overflow (ephemeral branch)                       | CI proof                  | gate-blocks proof      | Same as PR-A — Phase 48 two-smoke-PR pattern (D-16)                                                | exact                                               |
| Audit-identified ≥30 KB gz components → `React.lazy()` (audit-driven; N files)  | lazy boundary             | dynamic-import         | 28 existing in-repo `React.lazy()` call sites (8 cited in research)                                | exact                                               |

## Pattern Assignments

### `frontend/vite.config.ts` (modify) — build config / id → chunk transform

**Analog:** self — `frontend/vite.config.ts:132–186` (the live `manualChunks` arrow). D-07 adds new branches; existing branches stay untouched.

**Existing `manualChunks` arrow** (verbatim, the file Phase 49 modifies — `vite.config.ts:132–186`):

```typescript
// frontend/vite.config.ts:132–186
manualChunks: (id) => {
  if (id.includes('/src/components/signature-visuals/')) {
    return 'signature-visuals-static'
  }

  if (id.includes('node_modules')) {
    // React core - rarely changes, cache well
    if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
      return 'react-vendor'
    }
    // TanStack ecosystem - routing, query, table
    if (id.includes('@tanstack')) {
      return 'tanstack-vendor'
    }
    // Framer Motion - animation library
    if (id.includes('framer-motion') || id.includes('motion')) {
      return 'motion-vendor'
    }
    // Radix UI - headless components
    if (id.includes('@radix-ui')) {
      return 'radix-vendor'
    }
    // Signature visuals geospatial dependencies
    if (
      id.includes('d3-geo') ||
      id.includes('topojson-client') ||
      id.includes('world-atlas')
    ) {
      return 'signature-visuals-d3'
    }
    // Charts and visualization
    if (
      id.includes('recharts') ||
      id.includes('d3-') ||
      id.includes('@xyflow') ||
      id.includes('reactflow')
    ) {
      return 'charts-vendor'
    }
    // i18n
    if (id.includes('i18next') || id.includes('react-i18next')) {
      return 'i18n-vendor'
    }
    // Supabase client
    if (id.includes('@supabase')) {
      return 'supabase-vendor'
    }
    // Form handling
    if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
      return 'forms-vendor'
    }
    // All other dependencies
    return 'vendor'
  }
},
```

**What changes vs analog** (D-07 — insert 3 required + up to 2 optional branches BEFORE the final `return 'vendor'`):

```typescript
// Insert at the scoped-package cluster (after `radix-vendor`, before `signature-visuals-d3`):
if (id.includes('@heroui')) {
  return 'heroui-vendor'
}
if (id.includes('@sentry')) {
  return 'sentry-vendor'
}
if (id.includes('@dnd-kit')) {
  return 'dnd-vendor'
}
// OPTIONAL — gated on D-05 audit. Only commit if residual `vendor` >100 KB gz
// AND the dep is ≥30 KB gz on its own:
// if (id.includes('@tiptap')) { return 'tiptap-vendor' }
// if (id.includes('exceljs')) { return 'exceljs-vendor' }
```

**Gotchas from research:**

- **Ordering rule** (RESEARCH Pattern 1): `react-vendor` and `tanstack-vendor` come first because their substrings could falsely match later (`@tanstack/react-query` contains `react`). Scoped packages (`@heroui`, `@sentry`, `@dnd-kit`) are unambiguous; place them anywhere in the scoped-package cluster.
- **DO NOT** rename or remove any existing chunk name — would cache-bust every CDN user simultaneously and break `assert-size-limit-matches.mjs` globs (RESEARCH Anti-Patterns).
- **`entryFileNames: 'assets/app-[hash].js'`** (line 189) and **`chunkFileNames: 'assets/[name]-[hash].js'`** (line 188) are the contracts the `.size-limit.json` globs depend on — do not touch.

---

### `frontend/.size-limit.json` (rewrite) — size budget / static enforcement

**Analog:** self — `frontend/.size-limit.json` (44 lines, 6 entries). Each entry follows the same shape; Phase 49 rewrites ceiling values and adds new sub-vendor entries.

**Existing entry shape** (verbatim, `.size-limit.json:1–9`):

```json
{
  "name": "Initial JS (entry point)",
  "path": "dist/assets/app-*.js",
  "limit": "517 KB",
  "gzip": true,
  "running": false
}
```

**What changes vs analog** (D-01 / D-02 / D-03 / D-07):

- `Initial JS (entry point)` `limit`: `"517 KB"` → `"450 KB"` (D-01; LOWERED)
- `React vendor` `limit`: `"349 KB"` UNCHANGED (D-03 `min(current, measured+5)` — current 349 already tighter than mechanical 352)
- `TanStack vendor` `limit`: `"51 KB"` UNCHANGED (D-03 `min` — current already tighter than mechanical 55)
- `Total JS` `limit`: `"2.43 MB"` → `"1.8 MB"` (D-02, with escalation path if audit shows unattainable; LOWERED)
- `signature-visuals/d3-geospatial` `limit`: `"55 KB"` UNCHANGED (D-03 `min` — current already tighter than mechanical 56)
- `signature-visuals/static-primitives` `limit`: `"64 KB"` → `"12 KB"` (D-03 — only existing entry that lowers beyond Initial/Total; symbolic oversized dropped to measured 9 + 3 KB tight per RESEARCH Q3)
- **ADD** new entries (D-07) — placeholders `<measured + 5>` MUST be replaced post-audit:

```json
{
  "name": "HeroUI vendor",
  "path": "dist/assets/heroui-vendor-*.js",
  "limit": "<measured + 5> KB",
  "gzip": true,
  "running": false
},
{
  "name": "Sentry vendor",
  "path": "dist/assets/sentry-vendor-*.js",
  "limit": "<measured + 5> KB",
  "gzip": true,
  "running": false
},
{
  "name": "DnD vendor",
  "path": "dist/assets/dnd-vendor-*.js",
  "limit": "<measured + 5> KB",
  "gzip": true,
  "running": false
}
```

**Gotchas from research:**

- **Glob compatibility** (RESEARCH Pattern 2): `assert-size-limit-matches.mjs:15` defines `*` → `[^/]*`. New globs MUST resolve to ≥1 built file after the D-07 manualChunks change lands. If a sub-vendor branch ends up empty (e.g., `@dnd-kit` fully tree-shaken on a refactor), the script fails — intended sanity gate (RESEARCH Pitfall 2).
- **Never commit placeholders** (RESEARCH Pattern 2 "Critical" note): the executor MUST run `pnpm -C frontend build && pnpm -C frontend size-limit`, capture gz measurements per sub-vendor, and replace `<measured + 5>` with real values BEFORE commit.
- **JSON-only, no JSONC** (D-09 + Anti-Patterns): `.size-limit.json` is read by `assert-size-limit-matches.mjs:39` via raw `JSON.parse` — no inline comments tolerated. Long-form rationale goes in `frontend/docs/bundle-budget.md`.
- **Total JS math** (RESEARCH Pitfall 7): `Total JS` ceiling = `max(1.8 MB, sum-of-per-chunk-ceilings + 5% slack)`. Document derivation in `49-BUNDLE-AUDIT.md`.

---

### `frontend/scripts/assert-size-limit-matches.mjs` (extend) — CI guard / glob sanity

**Analog:** self — `frontend/scripts/assert-size-limit-matches.mjs:42–48` (the existing `expectedMatchCounts` Map).

**Existing `expectedMatchCounts` block** (verbatim, `assert-size-limit-matches.mjs:42–48`):

```javascript
const expectedMatchCounts = new Map([
  ['Initial JS (entry point)', 1],
  ['React vendor', 1],
  ['TanStack vendor', 1],
  ['signature-visuals/d3-geospatial', 1],
  ['signature-visuals/static-primitives', 1],
])
```

**What changes vs analog** (Wave 0 gap from RESEARCH §"Wave 0 Gaps"): add a row for each new named singleton sub-vendor with expected count `1`:

```javascript
const expectedMatchCounts = new Map([
  ['Initial JS (entry point)', 1],
  ['React vendor', 1],
  ['TanStack vendor', 1],
  ['HeroUI vendor', 1], // NEW — D-07
  ['Sentry vendor', 1], // NEW — D-07
  ['DnD vendor', 1], // NEW — D-07
  ['signature-visuals/d3-geospatial', 1],
  ['signature-visuals/static-primitives', 1],
])
```

**Why expected `1` and not "at least 1"**: the strict count catches the regression where a refactor splits a named sub-vendor into multiple files (e.g., `heroui-vendor-A.js` + `heroui-vendor-B.js`) — that signals an unintended chunk-graph change. RESEARCH §"Wave 0 Gaps" calls this out explicitly: "otherwise the script silently accepts ≥1, which is looser than intended for named singletons."

**Gotchas from research:**

- **`Total JS`** is intentionally NOT in `expectedMatchCounts` — its glob `dist/assets/*.js` matches MANY files (every chunk), so the script defaults to "at least 1". Do not add it. Same for any optional sub-vendor only added after audit (`tiptap-vendor`, `exceljs-vendor`) — add the row only if/when the matching `.size-limit.json` entry is committed.
- **Glob shape contract** (`assert-size-limit-matches.mjs:11–18`): `*` → `[^/]*` (no slash). `dist/assets/heroui-vendor-*.js` matches `dist/assets/heroui-vendor-ABC123.js` ✓ but NOT `dist/assets/subdir/heroui-vendor-ABC123.js`. Existing chunk file-name pattern (`vite.config.ts:188`: `'assets/[name]-[hash].js'`) emits flat structure — safe.

---

### Audit-identified ≥30 KB gz components → `React.lazy()` (D-06, audit-driven, N files)

**Analog:** 28 existing `React.lazy()` call sites in `frontend/src` (grep-verified 2026-05-12). The three canonical shapes:

#### Shape 1 — Engagement-tab route lazy (the canonical template)

**Source:** `frontend/src/routes/_protected/engagements/$engagementId/overview.tsx:1–24` (verbatim, 24 lines, the model file):

```typescript
/**
 * Overview Tab Route
 * Lazy-loads OverviewTab with summary skeleton fallback.
 */

import React, { Suspense, type ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const OverviewTab = React.lazy(
  () => import('@/pages/engagements/workspace/OverviewTab'),
)

export const Route = createFileRoute('/_protected/engagements/$engagementId/overview')({
  component: OverviewRoute,
})

function OverviewRoute(): ReactElement {
  return (
    <Suspense fallback={<TabSkeleton type="summary" />}>
      <OverviewTab />
    </Suspense>
  )
}
```

**Sibling sites following the same shape:** `audit.tsx:10`, `calendar.tsx:10`, `context.tsx:10`, `docs.tsx:10`, `tasks.tsx:10` — six engagement-tab routes in lockstep. Use this shape when the lazy target is the default export and the fallback is a `TabSkeleton` variant (`summary | kanban | list | cards`).

#### Shape 2 — Modal lazy with `fallback={null}` (guarded by `{open && …}`)

**Source:** `frontend/src/components/dossier/RelationshipSidebar.tsx:63` (declaration) + `:534–536` (Suspense site):

```typescript
// frontend/src/components/dossier/RelationshipSidebar.tsx:62–63
// Lazy-load FullScreenGraphModal to maintain 200KB bundle budget
const FullScreenGraphModal = lazy(() => import('../graph/FullScreenGraphModal'))

// frontend/src/components/dossier/RelationshipSidebar.tsx:534–542 (render site)
{/* Full-screen graph modal -- lazy-loaded */}
{graphModalOpen && (
  <Suspense fallback={null}>
    <FullScreenGraphModal
      open={graphModalOpen}
      onOpenChange={setGraphModalOpen}
      dossierId={dossierId}
      dossierType={dossier?.type ?? 'country'}
    />
  </Suspense>
)}
```

**Target component shape** (`frontend/src/components/graph/FullScreenGraphModal.tsx:1–14`):

```typescript
/**
 * FullScreenGraphModal
 * Full-screen relationship network graph in an AdaptiveDialog modal.
 *
 * Opens from RelationshipSidebar "Expand Graph" button.
 * Uses AdvancedGraphVisualization with graph-traversal edge function data.
 * Lazy-loaded via React.lazy to maintain 200KB bundle budget.
 *
 * RTL-compatible, mobile-first.
 */
// ...
export default function FullScreenGraphModal(...)
```

**When to use:** the target is a modal/drawer whose consumer guards mounting with `{open && <Lazy />}`. The closed state means no flash, so `fallback={null}` is correct (RESEARCH Pattern 3 + Pitfall 4).

**Note on the `200KB bundle budget` comment:** stale v2.0 lineage (CONTEXT D-06 calls it out — copy the shape, not the hardcoded number).

#### Shape 3 — Named-export → default-wrap fallback

**Source:** `frontend/src/routes/_protected/kanban.tsx:12` (verbatim, the only in-repo example of the `.then(m => ({ default: m.Named }))` shape):

```typescript
// frontend/src/routes/_protected/kanban.tsx:1–24
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy, type ReactElement } from 'react'

const WorkBoard = lazy(() => import('@/pages/WorkBoard').then((m) => ({ default: m.WorkBoard })))

export const Route = createFileRoute('/_protected/kanban')({
  component: KanbanRoute,
})

function KanbanRoute(): ReactElement {
  return (
    <Suspense fallback={null /* page-level Skeleton lives inside WorkBoard */}>
      <WorkBoard />
    </Suspense>
  )
}
```

**When to use:** the target component currently uses a named export only AND has multiple consumers (so adding `export default` would create import-pattern drift). Otherwise prefer adding `export default` alongside the named export (RESEARCH Pattern 3 "Component-side requirement").

#### Shape 4 — Inline lazy with `Suspense` + token-styled spinner

**Source:** `frontend/src/pages/TicketDetail.tsx:23` + `:411–419`:

```typescript
// TicketDetail.tsx:22–23
// Lazy load EntityLinkManager for performance (Task T049)
const EntityLinkManager = lazy(() => import('../components/entity-links/EntityLinkManager'))

// TicketDetail.tsx:411–419 (render site)
{activeTab === 'links' && (
  <Suspense
    fallback={
      <div className="flex items-center justify-center py-12">
        <div className="inline-block size-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="ms-4 text-muted-foreground">{t('common.loading', 'Loading...')}</p>
      </div>
    }
  >
```

**When to use:** in-flow always-mounted lazy component where `fallback={null}` would flash. **Phase 49 D-13 modification:** the inline fallback shape in `TicketDetail.tsx` uses ad-hoc spinner classes and `text-muted-foreground` — D-13 requires the fallback be **token-only**, mirror `border: 1px solid var(--line)`, no shadow, and use the existing `GlobeSpinner` primitive at `@/components/signature-visuals/GlobeSpinner.tsx` (the file exists — verified). The corrected Phase 49 inline fallback shape:

```typescript
// D-13-compliant inline fallback (token-styled per CLAUDE.md §Design rules)
import { GlobeSpinner } from '@/components/signature-visuals'
// ...
<Suspense
  fallback={
    <div
      className="flex items-center justify-center"
      style={{
        minHeight: 'var(--row-h)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius)',
      }}
    >
      <GlobeSpinner size="sm" />
    </div>
  }
>
```

**Gotchas from research (D-06 / D-13 / Pitfall 4 / Pitfall 5):**

- **D-06 threshold gate**: lazy() ONLY when (a) post-split chunk is ≥30 KB gz AND (b) NOT in any route's initial render path. Components below 30 KB gz stay eager.
- **Default-export requirement**: a lazy()-imported component MUST be the file's default export OR use Shape 3's `.then(m => ({ default: m.Named }))` wrap. RESEARCH Pattern 3 says: prefer (a) `export default` alongside named when single-consumer, (b) `.then` wrap when multi-consumer.
- **D-13 fallback selection** (RESEARCH Pattern 3 + Pitfall 4):
  - `fallback={null}` only when consumer guards with `{open && <Lazy />}` (most modals).
  - `<GlobeSpinner size="sm" />` in a `border: 1px solid var(--line)` box for always-mounted inline (token-only — no raw hex, no `text-blue-500`, per CLAUDE.md §Design rules).
  - `<TabSkeleton type="..." />` for any tab-shaped lazy panel — extend `frontend/src/components/workspace/TabSkeleton.tsx` with a 5th variant if needed; do not author a one-off.
- **Visual baselines may invalidate** (RESEARCH Pitfall 5): for routes with Phase 38/40/41 Playwright baselines, the added Suspense frame can fail the baseline. Resolution is baseline re-capture as part of the lazy() commit (D-06 already vets the choice; do not revert the lazy()).
- **Don't `as any` or add suppressions to make lazy() compile** (D-14): if a lazy() conversion breaks types (e.g., named-only export reachability), fix the types — RESEARCH Anti-Patterns binds this.

---

### Branch-protection on `main` — settings change / required-contexts merge

**Analog:** `.planning/phases/47-type-check-zero/47-03-ci-gate-and-branch-protection-PLAN.md` Task 4 (the original payload) + `.planning/phases/48-lint-config-alignment/48-03-…-PLAN.md` Task 2 (verbatim re-application — only the new context-string differs).

**Verbatim Phase 48 `gh api PUT` payload** (`48-03-…-PLAN.md:121–131` — the "Issue 5 fix" / minimum-required GitHub REST spec):

```bash
# Phase 48 — adds "Lint" to existing ["type-check", "Security Scan"]
gh api -X PUT repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["type-check", "Security Scan", "Lint"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON
```

**What changes vs analog** (D-10): add **one** new context literal `"Bundle Size Check (size-limit)"` to the existing three. The full Phase 49 payload (verbatim from RESEARCH Pattern 4):

```bash
# Phase 49 — adds "Bundle Size Check (size-limit)" to existing ["Lint", "Security Scan", "type-check"]
gh api -X PUT repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint", "Security Scan", "type-check", "Bundle Size Check (size-limit)"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON
```

**Read-then-merge-then-write pre/post audit** (T-49-XX mitigation, verbatim from Phase 48 Task 1):

```bash
# Step 1 — capture pre-state
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  > /tmp/49-protection-before.json 2>&1
cat /tmp/49-protection-before.json | jq '.required_status_checks.contexts'
# Expected pre-state (per Phase 48 close): ["Lint", "Security Scan", "type-check"]

# Step 2 — PUT (see above)

# Step 3 — verify
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks \
  --jq '.contexts | sort'
# Expected: ["Bundle Size Check (size-limit)","Lint","Security Scan","type-check"]

gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/enforce_admins \
  --jq '.enabled'
# Expected: true

# Step 4 — diff vs pre-state (no other rules should have changed)
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  > /tmp/49-protection-after.json
diff <(jq -S . /tmp/49-protection-before.json) <(jq -S . /tmp/49-protection-after.json)
```

**Gotchas from research (Pitfall 3 / Assumptions A5):**

- **CASING MATTERS — verbatim string** (RESEARCH Pitfall 3 + Pattern 4): the literal `"Bundle Size Check (size-limit)"` must match the `name:` field at `.github/workflows/ci.yml:271` **exactly**, including spaces and parens. **VERIFIED 2026-05-12** by reading the workflow:
  ```yaml
  # .github/workflows/ci.yml:270–273
  bundle-size-check:
    name: Bundle Size Check (size-limit)
    runs-on: ubuntu-latest
    needs: [lint, type-check]
  ```
  Branch-protection `contexts` are case-sensitive string matches against the **job `name:` field**, NOT the workflow `id:` (`bundle-size-check`). Any deviation (e.g., `"bundle-size-check"`, `"Bundle Size Check"` without parens) makes the rule a silent no-op — smoke PRs would show `mergeStateStatus: CLEAN` instead of `BLOCKED`. This is the empirical detector (D-12).
- **Body-trim "Issue 5" fix** (Phase 47 Task 4 + Phase 48 Task 2): the PUT body is the minimum-required spec. Fields `lock_branch`, `allow_fork_syncing`, `required_linear_history`, `required_conversation_resolution`, `allow_force_pushes`, `allow_deletions` are dropped because some repo tiers reject them and abort the entire PUT. The BUNDLE-03 acceptance (`contexts` includes the new entry) does not depend on the dropped fields.
- **`needs: [lint, type-check]` chain stays untouched** (D-10): the `bundle-size-check` job at `ci.yml:273` already chains correctly from Phase 47/48; do NOT edit the workflow YAML — this is a settings-only change.
- **Pre-state assumption** (RESEARCH Assumption A4): post-Phase-48 state is `["Lint", "Security Scan", "type-check"]`. Step 1 is the empirical re-verification — if it differs (e.g., a 4th context exists, or one is missing), the planner ESCALATES rather than silently overwrites.

---

### Smoke PR A — initial-JS overflow

**Analog:** `.planning/phases/48-lint-config-alignment/48-03-…-PLAN.md` Task 3 frontend smoke (verbatim mechanics; only the trip-wire and required-context-name differ).

**Verbatim Phase 48 frontend smoke shape** (`48-03-…-PLAN.md:99–119`):

```bash
# Phase 48 frontend smoke (trip-wire: text-left JSX → no-restricted-syntax violation)
FRONTEND smoke trip-wire:
  Append to frontend/src/App.tsx:
    const _smokeTest = <div className="text-left">x</div>
  Pre-push local verification: `pnpm exec eslint -c eslint.config.mjs frontend/src/App.tsx` MUST exit non-zero on the modified tree.

Required PR assertions (verbatim from 47-03 Task 5 — Issue 2 fix; mergeStateStatus NOT mergeable):
  gh pr checks <PR> --json name,state,bucket --jq '.[] | select(.name=="Lint") | .bucket'   # MUST return "fail"
  gh pr view <PR> --json mergeStateStatus -q .mergeStateStatus                              # MUST return "BLOCKED"
```

**What changes vs analog** (D-12 PR-A — push Initial JS > 450 KB, per RESEARCH Pattern 5):

```bash
git fetch origin main
git checkout -b chore/test-bundle-gate-initial origin/main

# Trip-wire: eager d3 import at App.tsx top — forces d3 into the `app-*.js` initial chunk
# Alternative if d3 doesn't push hard enough: `import { saveAs } from 'file-saver'`. Goal: +50 KB gz initial.
printf "\nimport * as d3 from 'd3';\nconsole.warn('smoke', d3.version);\n" >> frontend/src/App.tsx

git add frontend/src/App.tsx
git commit -m "chore: smoke-test bundle gate initial-js (DO NOT MERGE)"
git push -u origin chore/test-bundle-gate-initial

gh pr create --base main \
  --title "chore: smoke-test bundle gate initial-js (DO NOT MERGE)" \
  --body "BUNDLE-03 verification per CONTEXT D-12. Injects an eager d3 import to push Initial JS > 450 KB. Will be closed without merging."

PR_A=$(gh pr view --json number -q .number)
gh pr checks $PR_A --watch

# Required assertions (verbatim shape from 47-03 / 48-03 — context-name differs):
gh pr checks $PR_A --json name,state,bucket \
  --jq '.[] | select(.name=="Bundle Size Check (size-limit)") | .bucket'
# Expected: "fail"

gh pr view $PR_A --json mergeStateStatus -q .mergeStateStatus
# Expected: "BLOCKED" (NOT "MERGEABLE" — see Phase 47 Issue-2 fix)

# Close, do NOT merge:
gh pr close $PR_A --delete-branch
```

---

### Smoke PR B — sub-vendor chunk overflow

**Analog:** `.planning/phases/48-lint-config-alignment/48-03-…-PLAN.md` Task 3 backend smoke (verbatim mechanics; trip-wire is now a sub-vendor bloat instead of `console.log`).

**What changes vs Phase 48 analog** (D-12 PR-B — push one sub-vendor chunk > its D-03 ceiling, per RESEARCH Pattern 5):

```bash
git checkout main && git pull
git checkout -b chore/test-bundle-gate-subvendor origin/main

# Trip-wire: re-export an entire scoped package into a sub-vendor-touching file
# to balloon `dnd-vendor` past its D-03 ceiling.
echo "export * from '@dnd-kit/sortable';" >> frontend/src/components/kanban/_smoke-dnd-bloat.ts

git add frontend/src/components/kanban/_smoke-dnd-bloat.ts
git commit -m "chore: smoke-test bundle gate sub-vendor (DO NOT MERGE)"
git push -u origin chore/test-bundle-gate-subvendor

gh pr create --base main \
  --title "chore: smoke-test bundle gate sub-vendor (DO NOT MERGE)" \
  --body "BUNDLE-03 verification per CONTEXT D-12. Bloats dnd-vendor over its ceiling to prove the gate blocks per-chunk regressions. Will be closed without merging."

PR_B=$(gh pr view --json number -q .number)
gh pr checks $PR_B --watch
gh pr checks $PR_B --json name,state,bucket \
  --jq '.[] | select(.name=="Bundle Size Check (size-limit)") | .bucket'
# Expected: "fail"
gh pr view $PR_B --json mergeStateStatus -q .mergeStateStatus
# Expected: "BLOCKED"

gh pr close $PR_B --delete-branch
```

**Gotchas from research (RESEARCH Pattern 5 + Pitfall 3 + Anti-Patterns):**

- **`mergeStateStatus` is the field — NOT `mergeable`** (Phase 47 Issue-2 fix): `mergeable` returns `MERGEABLE` for branches without git conflicts even when required checks fail. `mergeStateStatus: BLOCKED` is the correct empirical signal that the rule is binding.
- **TWO PRs is mandatory, not one** (D-12): initial-JS overflow and sub-vendor overflow are two different failure surfaces. A passing-on-overflow gate could exist that only checks the Total JS line but skips per-chunk lines, or vice versa. Two PRs prove BOTH ceilings actually block. Same posture as Phase 48 D-16 (one frontend + one backend).
- **Smoke-PR cleanup is mandatory BEFORE phase SUMMARY** (RESEARCH Anti-Patterns + T-48-03 mitigation): `gh pr close --delete-branch` runs for BOTH PRs before writing the phase summary. Phase 47/48 closed all four prior smokes this way; leaving them open creates accidental-merge risk.
- **`enforce_admins: true` prevents admin-bypass merge** (T-48-03): even repo admins cannot merge a BLOCKED PR. This is the safety net behind the branch-name + title + body "DO NOT MERGE" guards.
- **`chunkSizeWarningLimit: 500`** at `vite.config.ts:127` is a build-time warning only, NOT a gate. The gate is `pnpm size-limit` (RESEARCH Architectural Responsibility Map). Don't confuse the two when smoke-testing.

---

### `frontend/docs/bundle-budget.md` (CREATE — folder + file new)

**Analog:** No in-repo analog (verified 2026-05-12: `ls frontend/docs/` → no such directory). Schema lifted verbatim from `49-RESEARCH.md` Pattern 6.

**Why a sibling note over inline JSON comments** (D-09): `.size-limit.json` is read by `assert-size-limit-matches.mjs:39` via raw `JSON.parse` — no JSONC tolerance. Rationale is multi-sentence per chunk; would bloat the JSON; JSON has no native comment syntax.

**Proposed structure** (verbatim from RESEARCH Pattern 6; planner adopts or revises):

```markdown
# Frontend Bundle Budget

Last audited: 2026-05-XX
Audit artifact: `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md`

This document explains the rationale for every chunk over 100 KB gzipped in
the production build. Sibling to `.size-limit.json` per Phase 49 D-09.

## Ceilings (locked Phase 49)

| Chunk                | Ceiling (gz) | Measured (gz) | Last audited | Rationale                                                                                                                                                                                                         |
| -------------------- | ------------ | ------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial JS (`app-*`) | 450 KB       | 411.98 KB     | 2026-05-XX   | Entry route — TanStack Router shell + provider tree + i18n init. Lazy boundaries below cut growth here.                                                                                                           |
| React vendor         | 349 KB       | 347.13 KB     | 2026-05-XX   | react + react-dom + scheduler — near native floor. Cannot be reduced without dropping React itself. Ceiling held at current per D-03 `min`.                                                                       |
| TanStack vendor      | 51 KB        | 50.1 KB       | 2026-05-XX   | @tanstack/react-router + react-query + react-table + react-virtual — all on the initial path. Ceiling held at current per D-03 `min`.                                                                             |
| HeroUI vendor        | TBD          | TBD           | 2026-05-XX   | Primary primitive cascade per CLAUDE.md §Component Library Strategy. Eager because most routes render a HeroUI primitive on first paint.                                                                          |
| Sentry vendor        | TBD          | TBD           | 2026-05-XX   | @sentry/react — error tracking. Init is `requestIdleCallback`-deferred at `main.tsx:24`, so this chunk is non-blocking despite the size. Keep its own chunk so a Sentry upgrade doesn't cache-bust other vendors. |
| DnD vendor           | TBD          | TBD           | 2026-05-XX   | @dnd-kit/\* — only loaded on kanban + reorder routes; separate chunk avoids cache-busting the initial path on dnd-kit minor upgrades.                                                                             |

## Residual vendor chunk

Per D-08: after the D-07 named sub-vendors are split off, anything remaining
in `vendor-*` that is ≥10 KB gz gets a row below with an explanation of why
it stays in the catch-all bucket.

| Dep | gz size | Reason for staying in `vendor` |
| --- | ------- | ------------------------------ |
| ... | ...     | ...                            |
```

**Gotchas from research (RESEARCH Pattern 6 / Assumptions A6):**

- **Folder creation required**: `frontend/docs/` does NOT exist on `main`. Plan must `mkdir -p frontend/docs/` (or rely on git's "create parent dirs on add" behavior) BEFORE writing the file.
- **No marketing voice** (CLAUDE.md §Design rules — Banned: "Discover", "Easily", "Unleash", exclamation marks). Sentence case for headings.
- **No emoji** (CLAUDE.md §Design rules). Plain words only.
- **Living doc, not one-shot**: this file is re-touched on every chunk-affecting change. Distinct from `49-BUNDLE-AUDIT.md` (one-shot snapshot — see next entry).

---

### `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` (CREATE — one-shot artifact)

**Analog:** No in-repo analog with exact shape. Closest precedent for a phase-internal audit-artifact pattern is `.planning/phases/48-…/48-VERIFICATION.md` (sibling phase snapshot — role-match, not shape-match). Schema lifted verbatim from `49-RESEARCH.md` Pattern 7.

**Why `.planning/` not `frontend/docs/`** (RESEARCH §"Specific Ideas"): the audit is a point-in-time decision input (top-20 chunks at audit time, lazy() candidate list). It captures a moment; `frontend/docs/bundle-budget.md` is the living rationale doc.

**Proposed structure** (verbatim from RESEARCH Pattern 7):

```markdown
# Phase 49 — Bundle Audit Snapshot

**Date:** 2026-05-XX (post D-07 decomposition, pre D-06 lazy())
**Source:** `pnpm -C frontend analyze` → `frontend/dist/stats.html`
**Build mode:** production (ANALYZE=true)

## Top 20 chunks by gz size

| Rank | Chunk        | gz size | Raw size | Type     | Initial path? |
| ---- | ------------ | ------- | -------- | -------- | ------------- |
| 1    | react-vendor | 347 KB  | 1.1 MB   | vendor   | yes           |
| 2    | app          | 412 KB  | 1.4 MB   | app      | yes           |
| 3    | vendor       | TBD     | TBD      | residual | partial       |

## Suspected `app` chunk eager-import culprits

| Component         | Path                                 | Est. gz | Eager via  | Lazy() candidate?                    |
| ----------------- | ------------------------------------ | ------- | ---------- | ------------------------------------ |
| CalendarEntryForm | frontend/src/components/calendar/... | ~XX KB  | XYZ.tsx:12 | yes — modal, never on initial render |

## Sub-vendor decomposition results (post D-07)

| New chunk     | gz  | Was-part-of `vendor` (gz) | Net Total Δ |
| ------------- | --- | ------------------------- | ----------- |
| heroui-vendor | TBD | TBD                       | 0 (split)   |
| sentry-vendor | TBD | TBD                       | 0 (split)   |
| dnd-vendor    | TBD | TBD                       | 0 (split)   |

## Proposed lazy() conversions (ranked by est. gz win)

| Rank | Component | Est. gz saved from initial | Justification (D-06 threshold check)         |
| ---- | --------- | -------------------------- | -------------------------------------------- |
| 1    | ...       | ...                        | ≥30 KB gz AND not in initial path: confirmed |

## Decision

[Planner records: how many components flipped lazy, which were skipped + why,
projected Total JS after both D-06 and D-07 land.]
```

**Gotchas from research:**

- **Audit ordering matters** (RESEARCH §Summary): the audit fires **post D-07 vendor-decomposition, pre D-06 lazy() conversion**. Vendor-first surfaces clearer gz wins and lets the lazy() picks operate on stable chunk names.
- **D-02 escalation hook**: if the audit shows the projected Total JS after lazy() is still >1.8 MB, the audit doc records the measured projection and the planner escalates per D-02 ("never silently raise"). Do not commit a higher Total JS ceiling without the escalation paper trail.
- **Confidence flag**: D-02 1.8 MB attainability is MEDIUM confidence pre-audit (RESEARCH §Metadata). Audit results are the empirical reality check.

---

## Shared Patterns (cross-cutting)

### Pattern S1 — `gh api PUT` for branch-protection (Phase 47 → 48 → 49 verbatim)

**Source:** `.planning/phases/47-type-check-zero/47-03-…-PLAN.md` Task 4 (origin). Re-applied verbatim in `48-03-…-PLAN.md` Task 2. Phase 49 is the third application — same shape, only the `contexts` array literal differs.

**Apply to:** the branch-protection task (Plan 03 in the suggested 3-plan cleavage). The full read-then-merge-then-write sequence is in the "Branch-protection on `main`" section above; this row exists to mark the lift as cross-cutting / inherited posture.

### Pattern S2 — Two-smoke-PR gate proof (Phase 47 D-13 → 48 D-16 → 49 D-12)

**Source:** `.planning/phases/47-type-check-zero/47-03-…-PLAN.md` Task 5 (origin, one smoke). Phase 48 D-16 added the "two PRs, one per failure surface" rule (`48-03-…-PLAN.md` Task 3). Phase 49 inherits the two-PR posture and applies it to bundle-size failure surfaces (initial-JS vs sub-vendor).

**Apply to:** Plan 03 final tasks (smoke PR A + smoke PR B), each with `gh pr close --delete-branch` BEFORE the phase SUMMARY.

### Pattern S3 — Suppression-count diff anchor (Phase 47 D-01 → 48 D-17 → 49 D-14)

**Source:** `.planning/phases/47-type-check-zero/47-CONTEXT.md` D-01 (origin — `@ts-ignore` / `@ts-expect-error` net-new = 0). Phase 48 D-17 extended to `eslint-disable`. Phase 49 D-14 extends to size-limit ceiling-raising.

**Pre-phase baseline (verified 2026-05-12 per RESEARCH §Suppression Audit):**

- `@ts-ignore` / `@ts-expect-error`: 2 occurrences (`IntakeForm.tsx:94`, `Icon.test.tsx:64`) — both predate Phase 49
- `eslint-disable` (any variant): 2 files
- **NEW Phase 49 anchor**: pre-phase `.size-limit.json` ceilings (D-01..D-03 are LOWERED, not raised — phase-close check must show ceiling values ≤ original symbolic + any D-02 escalation).

**Apply to:** every plan's `done` gate. Diff anchor is the `phase-49-base` git tag (planner creates this in Plan 01 mirroring `phase-47-base` / `phase-48-base`).

### Pattern S4 — Surgical-changes discipline (CLAUDE.md §Karpathy + RESEARCH Anti-Patterns)

**Source:** CLAUDE.md §Karpathy Coding Principles §3 "Surgical Changes". RESEARCH calls out specific Phase 49 anti-patterns:

- Don't add manual `React.lazy()` per route file (D-04: already auto-split by TanStackRouterVite).
- Don't write a custom gz delta calculator (D-11: size-limit's exit code IS the delta proxy).
- Don't add `floating-action-button.tsx` / `floating-dock.tsx` to the lazy queue out of opportunism (Phase 48 D-07 already deleted Aceternity orphans; non-Aceternity `floating-*` files have real consumers).
- Don't replace the entire `manualChunks` arrow — D-07 ADDS branches; existing chunk names stay.

**Apply to:** every plan task's `action` block. Each touched file must trace to a CONTEXT decision; opportunistic refactors are deferred.

---

## No Analog Found

Files with no close in-repo match. Planner uses RESEARCH-provided schemas verbatim (Patterns 6 + 7):

| File                                                         | Role                    | Data Flow | Reason                                                                                                                                               |
| ------------------------------------------------------------ | ----------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/docs/bundle-budget.md`                             | docs / living rationale | reference | `frontend/docs/` folder doesn't exist on main (verified 2026-05-12). D-09 creates folder + file.                                                     |
| `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` | one-shot audit artifact | reference | Phase-internal audit-snapshot shape is new for Phase 49 (Phase 47/48 had REVIEW / VERIFICATION but no BUNDLE-AUDIT). Schema from RESEARCH Pattern 7. |

## Metadata

**Analog search scope:**

- `frontend/vite.config.ts` (read end-to-end 2026-05-12)
- `frontend/.size-limit.json` (read end-to-end 2026-05-12)
- `frontend/scripts/assert-size-limit-matches.mjs` (read end-to-end 2026-05-12)
- `.github/workflows/ci.yml:265–300` (read 2026-05-12 — bundle-size-check job)
- `frontend/src/**/*.tsx` (grep for `React.lazy\|= lazy(` — 28 sites, 8 inspected in detail: `RelationshipSidebar.tsx:63,536`; `kanban.tsx:12,20`; `engagements/$engagementId/{overview,calendar,audit,docs,tasks,context}.tsx:10`; `TicketDetail.tsx:23,411`; `FullScreenGraphModal.tsx:1–14`)
- `frontend/src/components/workspace/TabSkeleton.tsx` (read 2026-05-12 — 4 existing variants)
- `frontend/src/components/signature-visuals/` (ls — `GlobeSpinner.tsx` confirmed present)
- `.planning/phases/47-type-check-zero/47-03-…-PLAN.md` (read 2026-05-12 — origin of branch-protection `gh api PUT` payload)
- `.planning/phases/48-lint-config-alignment/48-03-…-PLAN.md` (read 2026-05-12 — verbatim two-smoke-PR shape; verbatim branch-protection PUT)
- `.planning/phases/48-lint-config-alignment/48-PATTERNS.md` (read 2026-05-12 — pattern-mapping precedent for symmetric-phase carry-forwards)

**Files scanned:** ~40 source files + 8 planning artifacts

**Pattern extraction date:** 2026-05-12

**Confidence:**

- HIGH — manualChunks shape, lazy() canonical templates, branch-protection payload, smoke-PR mechanics. All have ≥1 verbatim in-repo or prior-phase donor.
- MEDIUM — D-02 1.8 MB Total JS attainability (audit-dependent). The patterns are right; the ceiling value is a measurement output, not a pattern decision.
- LOW — none. Every file has either a verbatim donor or an explicit RESEARCH-provided schema.
