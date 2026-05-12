---
phase: 49
plan: 02
type: execute
wave: 2
depends_on: [49-01]
files_modified:
  - frontend/vite.config.ts
  - frontend/.size-limit.json
  - frontend/scripts/assert-size-limit-matches.mjs
  - frontend/docs/bundle-budget.md
  - frontend/src/**/*.tsx (audit-driven, ≥30 KB gz lazy() conversion sites)
autonomous: true
requirements: [BUNDLE-02, BUNDLE-04]
requirements_addressed: [BUNDLE-02, BUNDLE-04]
must_haves:
  truths:
    - 'D-07: `frontend/vite.config.ts` `manualChunks` arrow has `if (id.includes("@heroui")) return "heroui-vendor"`, `if (id.includes("@sentry")) return "sentry-vendor"`, and `if (id.includes("@dnd-kit")) return "dnd-vendor"` branches BEFORE the final `return "vendor"` catch-all'
    - 'D-07: Build emits `dist/assets/heroui-vendor-*.js`, `dist/assets/sentry-vendor-*.js`, `dist/assets/dnd-vendor-*.js` — each as a single file (no fragmentation)'
    - 'D-04: No new manual route-level React.lazy() added in route files (TanStackRouterVite autoCodeSplitting already handles routes)'
    - 'D-06: Every audit-identified ≥30 KB gz non-initial-path component from `49-BUNDLE-AUDIT.md` is converted to `React.lazy(() => import(...))` with Suspense boundary at the consumer; components <30 KB gz OR on the initial render path stay eager'
    - 'D-13: Route-level Suspense fallbacks use `<GlobeSpinner />`; modal/drawer lazy uses `fallback={null}` (guarded by `{open && <Lazy />}`); inline always-mounted lazy uses token-styled wrapper (`border: 1px solid var(--line)`, no shadow, `var(--row-h)`, `var(--radius)`) with `<GlobeSpinner size="sm" />` — no raw hex, no `text-blue-500`'
    - 'D-08: If residual `vendor` chunk is still >100 KB gz after D-07 split, each remaining dep ≥10 KB gz has a row in `frontend/docs/bundle-budget.md` "Residual vendor chunk" table'
    - 'D-09: `frontend/docs/bundle-budget.md` "Ceilings" table has a row for every chunk >100 KB gz including the new HeroUI / Sentry / DnD sub-vendors, each with the measured gz + ceiling (measured + 5 KB) + rationale'
    - '`frontend/scripts/assert-size-limit-matches.mjs` `expectedMatchCounts` Map has `["HeroUI vendor", 1]`, `["Sentry vendor", 1]`, `["DnD vendor", 1]` rows — strict singleton enforcement'
    - '`pnpm -C frontend size-limit` exits 0 after the Plan-01 lowered ceilings (450 KB Initial JS + per-chunk + 1.8 MB Total) — the budget is now real, not aspirational'
    - 'D-14: Zero net-new `eslint-disable` / `@ts-ignore` / `@ts-expect-error` introduced in this plan; lazy() conversions that break types are fixed at source'
  artifacts:
    - path: 'frontend/vite.config.ts'
      provides: 'manualChunks arrow extended with 3 required sub-vendor branches (heroui/sentry/dnd) + optional tiptap/exceljs branches gated on audit verdict'
      contains: "id.includes('@heroui')"
    - path: 'frontend/.size-limit.json'
      provides: '3 new entries (HeroUI vendor / Sentry vendor / DnD vendor), each with measured+5 KB ceiling; entry shape preserved'
      contains: 'heroui-vendor'
    - path: 'frontend/scripts/assert-size-limit-matches.mjs'
      provides: 'expectedMatchCounts Map extended with strict `=== 1` entries per new sub-vendor'
      contains: "['HeroUI vendor', 1]"
    - path: 'frontend/docs/bundle-budget.md'
      provides: 'Ceilings table rows for HeroUI / Sentry / DnD vendor; residual vendor chunk rows for any remaining dep ≥10 KB gz'
      contains: 'HeroUI vendor'
    - path: 'frontend/src/**/*.tsx (audit-driven)'
      provides: 'lazy()-converted ≥30 KB gz non-initial-path components, each wrapped in Suspense with the D-13 fallback selection'
  key_links:
    - from: 'frontend/vite.config.ts manualChunks arrow'
      to: 'frontend/dist/assets/{heroui,sentry,dnd}-vendor-*.js'
      via: 'Rollup chunk identity decided by id.includes branches; chunkFileNames=assets/[name]-[hash].js emits these names'
      pattern: '(heroui|sentry|dnd)-vendor-'
    - from: 'frontend/.size-limit.json HeroUI/Sentry/DnD entries'
      to: 'assert-size-limit-matches.mjs expectedMatchCounts strict 1'
      via: 'name match between .size-limit.json `name` field and expectedMatchCounts Map key'
      pattern: 'HeroUI vendor|Sentry vendor|DnD vendor'
    - from: 'frontend/src/**/*.tsx lazy() consumer sites'
      to: 'frontend/src/components/signature-visuals/GlobeSpinner.tsx OR fallback={null}'
      via: 'Suspense boundary at render site per D-13 fallback selection rules'
      pattern: 'lazy\\(\\(\\) => import|<Suspense'
phase_decisions_locked:
  D-04_no_route_lazy: 'TanStackRouterVite({ autoCodeSplitting: true }) already emits one chunk per route file (vite.config.ts:34). Plan 02 does NOT add manual route-level React.lazy(). Component-layer lazy() only.'
  D-06_threshold: 'lazy() conversion only when (a) post-split chunk is ≥30 KB gz AND (b) NOT in any route initial render path. Both conditions must be met. Component <30 KB gz OR on initial path stays eager. Audit `49-BUNDLE-AUDIT.md` Proposed lazy() conversions table is the canonical candidate list.'
  D-07_required_sub_vendors: 'heroui-vendor (@heroui/*), sentry-vendor (@sentry/*), dnd-vendor (@dnd-kit/*) — non-negotiable. Place AFTER existing scoped-package branches (radix-vendor) and BEFORE final `return "vendor"`. Existing chunk names stay verbatim (no rename — would cache-bust every CDN user simultaneously).'
  D-07_optional_sub_vendors: 'tiptap-vendor (@tiptap/*) and exceljs-vendor (exceljs) — gated on audit verdict. Add ONLY if `49-BUNDLE-AUDIT.md` residual vendor table shows that dep ≥30 KB gz on its own. If under 30 KB gz, the dep stays in `vendor` and gets a row in bundle-budget.md "Residual vendor chunk" table per D-08.'
  D-08_residual_vendor: 'If post-D-07 residual `vendor` chunk is >100 KB gz, each remaining dep ≥10 KB gz gets a row in `frontend/docs/bundle-budget.md` "Residual vendor chunk" with dep name + gz cost + reason for staying grouped.'
  D-13_fallback_selection: 'Route-level Suspense → `<GlobeSpinner />`. Modal/drawer guarded by `{open && <Lazy />}` → `fallback={null}` (closed state = no flash). Inline always-mounted → `<GlobeSpinner size="sm" />` inside a div with `border: 1px solid var(--line)`, `borderRadius: var(--radius)`, `minHeight: var(--row-h)`. NEVER `text-muted-foreground` ad-hoc spinners, NEVER raw hex, NEVER `text-blue-*` (CLAUDE.md §Design rules).'
  D-13_token_only: 'Suspense fallback styling uses tokens only. `grep -nE "(#[0-9a-fA-F]{3,6}|text-(left|right|blue|red|green|gray)-[0-9]+|box-shadow)" <changed-files>` returns 0 across changed files (CLAUDE.md §Design rules — no raw hex, no Tailwind color literals, no card shadows).'
  D-14_no_suppressions: 'Zero `eslint-disable` / `@ts-ignore` / `@ts-expect-error` added in this plan. lazy() type breakage (e.g., named-only export reachability) is fixed at source — add `export default` alongside or use `.then(m => ({ default: m.Named }))` per PATTERNS Shape 3.'
  ordering: 'Vendor decomposition (Task 1-3) before lazy() conversion (Task 4-5) — surfaces clearer gz wins and lets lazy() picks operate on stable chunk names per RESEARCH §Summary.'
---

<objective>
Make the Plan-01 ceilings real. Three structural moves on a single phase wave (Wave 2):

1. **Sub-vendor decomposition (D-07)** — extend `frontend/vite.config.ts` `manualChunks` arrow with three required `id.includes` branches (`@heroui` → `heroui-vendor`, `@sentry` → `sentry-vendor`, `@dnd-kit` → `dnd-vendor`) placed AFTER `radix-vendor` and BEFORE the final `return 'vendor'`. Optional `@tiptap` / `exceljs` branches added only if the Plan-01 audit shows ≥30 KB gz residual on its own. Each new chunk gets a `.size-limit.json` entry with `measured + 5 KB` ceiling AND a strict `=== 1` row in `assert-size-limit-matches.mjs` `expectedMatchCounts`.

2. **Audit-driven `React.lazy()` conversion (D-06)** — for each ≥30 KB gz non-initial-path component ranked in `49-BUNDLE-AUDIT.md` "Proposed lazy() conversions", convert from eager `import` to `lazy(() => import(...))` at the consumer site with a Suspense boundary using the D-13 fallback selection. Use the canonical 3-shape templates from PATTERNS verbatim (engagement-tab `<TabSkeleton>`, modal `fallback={null}` guarded by `{open && <Lazy />}`, inline `<GlobeSpinner />` in a token-styled wrapper). Components below 30 KB gz OR on the initial render path stay eager.

3. **Documentation update (D-08 + D-09)** — append HeroUI / Sentry / DnD rows to `frontend/docs/bundle-budget.md` "Ceilings" table with measured gz + ceiling + rationale. If post-D-07 residual `vendor` chunk is still >100 KB gz, populate the "Residual vendor chunk" table per D-08 with every dep ≥10 KB gz.

Purpose: deliver the BUNDLE-02 lazy-split outcome and the BUNDLE-04 vendor decomposition + documented rationale; make the Plan-01 lowered ceilings actually pass `pnpm -C frontend size-limit`. Plan 03 then flips the gate to PR-blocking.

Output: extended `manualChunks` arrow, 3 new `.size-limit.json` entries with measured ceilings, 3 new `expectedMatchCounts` rows, audit-identified lazy() conversions wrapped in D-13-compliant Suspense, populated bundle-budget.md tables — all committed; `pnpm -C frontend size-limit` exits 0; existing E2E suite still passes against the new lazy boundaries.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/49-bundle-budget-reset/49-CONTEXT.md
@.planning/phases/49-bundle-budget-reset/49-RESEARCH.md
@.planning/phases/49-bundle-budget-reset/49-PATTERNS.md
@.planning/phases/49-bundle-budget-reset/49-VALIDATION.md
@.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md
@.planning/phases/49-bundle-budget-reset/49-01-SUMMARY.md
@./CLAUDE.md
@frontend/vite.config.ts
@frontend/.size-limit.json
@frontend/scripts/assert-size-limit-matches.mjs
@frontend/docs/bundle-budget.md
@frontend/src/components/graph/FullScreenGraphModal.tsx
@frontend/src/components/dossier/RelationshipSidebar.tsx
@frontend/src/routes/_protected/engagements/$engagementId/overview.tsx
@frontend/src/routes/_protected/kanban.tsx
@frontend/src/pages/TicketDetail.tsx

<interfaces>
<!--
manualChunks arrow current shape (VERIFIED 2026-05-12, vite.config.ts:132-186; ordering is significant — first-match wins):

(id) => {
if (id.includes('/src/components/signature-visuals/')) return 'signature-visuals-static'
if (id.includes('node_modules')) {
if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) return 'react-vendor'
if (id.includes('@tanstack')) return 'tanstack-vendor'
if (id.includes('framer-motion') || id.includes('motion')) return 'motion-vendor'
if (id.includes('@radix-ui')) return 'radix-vendor'
// ★ INSERT D-07 BRANCHES HERE — heroui / sentry / dnd (each `id.includes('@<pkg>') return '<name>-vendor'`)
if (id.includes('d3-geo') || id.includes('topojson-client') || id.includes('world-atlas')) return 'signature-visuals-d3'
if (id.includes('recharts') || id.includes('d3-') || id.includes('@xyflow') || id.includes('reactflow')) return 'charts-vendor'
if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n-vendor'
if (id.includes('@supabase')) return 'supabase-vendor'
if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) return 'forms-vendor'
return 'vendor' // ← catch-all; unchanged
}
}

D-07 insertion order (PATTERNS §"Pattern 1 ordering rule"): place new branches AFTER the existing scoped-package cluster (after `radix-vendor`, around line 153), BEFORE `signature-visuals-d3`. Scoped packages `@heroui`/`@sentry`/`@dnd-kit` are unambiguous (only match themselves) so ordering inside the scoped cluster is forgiving — but placement BEFORE `return 'vendor'` is mandatory.

Existing 28 React.lazy() call sites in frontend/src (canonical 4 shapes from PATTERNS):

Shape 1 — Engagement-tab route lazy with TabSkeleton fallback (6 sites):
frontend/src/routes/\_protected/engagements/$engagementId/{overview,audit,calendar,context,docs,tasks}.tsx
Template: const Tab = React.lazy(() => import('@/pages/.../OverviewTab'))
<Suspense fallback={<TabSkeleton type="summary" />}><Tab /></Suspense>

Shape 2 — Modal lazy with fallback={null} (guarded by `{open && ...}`):
frontend/src/components/dossier/RelationshipSidebar.tsx:63 (declares FullScreenGraphModal lazy)
frontend/src/components/dossier/RelationshipSidebar.tsx:534-542 (Suspense site)
Template: const Modal = lazy(() => import('../graph/Modal'))
{graphModalOpen && <Suspense fallback={null}><Modal {...props} /></Suspense>}

Shape 3 — Named-export wrap with `.then(m => ({ default: m.Named }))`:
frontend/src/routes/\_protected/kanban.tsx:12
Template: const WorkBoard = lazy(() => import('@/pages/WorkBoard').then((m) => ({ default: m.WorkBoard })))
Use when target has multiple consumers; otherwise prefer adding `export default` alongside named export.

Shape 4 — Inline lazy with Suspense + GlobeSpinner in a token-styled wrapper (Phase 49 D-13 enforced):
Replaces ad-hoc spinner classes (`text-muted-foreground`, hardcoded sizes) seen at TicketDetail.tsx:411-419.
Required shape:
import { GlobeSpinner } from '@/components/signature-visuals'
<Suspense fallback={

<div className="flex items-center justify-center" style={{
          minHeight: 'var(--row-h)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
        }}>
<GlobeSpinner size="sm" />
</div>
}>...</Suspense>

GlobeSpinner location (PATTERNS-verified 2026-05-12): frontend/src/components/signature-visuals/GlobeSpinner.tsx (file exists).
GlobeSpinner barrel export: frontend/src/components/signature-visuals/index.ts (verify the named export exists; if barrel does not exist, import directly: `import { GlobeSpinner } from '@/components/signature-visuals/GlobeSpinner'`).

assert-size-limit-matches.mjs expectedMatchCounts (VERIFIED 2026-05-12, lines 42-48):
const expectedMatchCounts = new Map([
['Initial JS (entry point)', 1],
['React vendor', 1],
['TanStack vendor', 1],
['signature-visuals/d3-geospatial', 1],
['signature-visuals/static-primitives', 1],
])
★ EXTEND with: ['HeroUI vendor', 1], ['Sentry vendor', 1], ['DnD vendor', 1].
The map key MUST match the `name` field in .size-limit.json byte-for-byte (case-sensitive).
`Total JS` intentionally NOT added — its glob matches many files (defaults to "≥1").
Optional sub-vendors (`Tiptap vendor`, `ExcelJS vendor`) added ONLY if the corresponding .size-limit.json entries land.

Sentry frontend init note (RESEARCH §Project Constraints): `requestIdleCallback`-deferred at main.tsx:24, so the sentry-vendor chunk is NOT initial-path-blocking despite its size. The rationale for keeping it as its own chunk is cache isolation — a Sentry minor upgrade does not cache-bust other vendors. Document in bundle-budget.md.
-->
</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                                                             | Description                                                                                                                                                                        |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `manualChunks` branch ordering                                       | First-match wins. Misordering (e.g., placing `@dnd-kit` after `return 'vendor'`) silently makes the branch dead code.                                                              |
| `.size-limit.json` ↔ `assert-size-limit-matches.mjs` ↔ Rollup output | Three places must agree byte-for-byte on chunk names. A typo in any one fails the build at CI.                                                                                     |
| `React.lazy()` named-vs-default-export contract                      | A lazy()-imported component must be the file's default export or wrapped with `.then(m => ({ default: m.Named }))`. Wrong shape causes a runtime crash, not a build-time error.    |
| Suspense fallback styling                                            | Per D-13 and CLAUDE.md §Design rules — token-only, no raw hex, no shadows. Ad-hoc Tailwind color classes silently introduce design drift.                                          |
| Component-layer lazy() vs initial render path                        | D-06's "not in initial render path" condition is verified by inspecting the consumer site — wrong picks defeat the lazy() cost by moving a chunk that loads on first paint anyway. |

## STRIDE Threat Register

| Threat ID | Category    | Component                                                                                                                 | Disposition | Mitigation Plan                                                                                                                                                                                                                                                                                                                                                   |
| --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --- | ----- | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| T-49-05   | Tampering   | New manualChunks branch placed after `return 'vendor'` (dead code; sub-vendor never emitted)                              | mitigate    | Task 1 acceptance: `pnpm -C frontend build && ls frontend/dist/assets/heroui-vendor-*.js` MUST list ≥1 file. If absent, the branch is dead and Plan 02 STOPs until ordering is fixed.                                                                                                                                                                             |
| T-49-06   | Tampering   | `.size-limit.json` `name` field drift from `assert-size-limit-matches.mjs` Map key                                        | mitigate    | Task 2 acceptance: cross-grep `name` field in JSON against Map key in mjs — `jq -r '.[]                                                                                                                                                                                                                                                                           | select(.name                                                          | test("vendor"))       | .name' frontend/.size-limit.json`and verify each name appears in`expectedMatchCounts`. Strict `=== 1` enforcement catches typos. |
| T-49-07   | Tampering   | lazy() conversion that breaks a route's initial render path (component is reachable on first paint via a non-modal mount) | mitigate    | Task 4 acceptance per component: trace the consumer call site; if it is mounted without a guard (`{open && ...}` / tab-switch / route deeper than landing), the conversion is REVERTED. Existing E2E suite (`pnpm -C frontend test:e2e`) must still pass.                                                                                                         |
| T-49-08   | Tampering   | Suspense fallback uses raw hex / `text-blue-*` / box-shadow against CLAUDE.md design rules                                | mitigate    | Task 4 grep gate: `rg -nE "(#[0-9a-fA-F]{3,6}\\b                                                                                                                                                                                                                                                                                                                  | text-(left                                                            | right                 | blue                                                                                                                             | red | green | gray)-[0-9]+ | box-shadow | drop-shadow)" $(git diff --name-only phase-49-base..HEAD -- 'frontend/src/\*_/_.tsx')` returns 0. |
| T-49-09   | Repudiation | Visual baseline failures after lazy() introduces a Suspense frame                                                         | accept      | Per RESEARCH Pitfall 5: the added Suspense frame can fail Phase 38/40/41 visual baselines. Resolution is baseline re-capture as part of the lazy() commit (D-06 vetted the choice — do not revert lazy()). Acceptance criterion notes the baseline list to re-capture; Plan 03 visual-baseline reconciliation is OUT OF SCOPE (handled if needed by gap-closure). |
| T-49-10   | Tampering   | D-14 violation — executor adds `// @ts-expect-error` or `as any` to make a lazy() conversion compile                      | mitigate    | Task 6 grep gate: `git diff phase-49-base..HEAD -- 'frontend/src'                                                                                                                                                                                                                                                                                                 | grep -E '^\\+.\*(@ts-(ignore\|expect-error)\|eslint-disable\|as any)' | grep -vE '^\\+\\+\\+' | wc -l` MUST return 0.                                                                                                            |

</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: Extend manualChunks with heroui/sentry/dnd sub-vendor branches</name>
  <files>frontend/vite.config.ts</files>
  <read_first>
    - frontend/vite.config.ts lines 128-194 (current `build.rollupOptions.output` block + manualChunks arrow)
    - .planning/phases/49-bundle-budget-reset/49-CONTEXT.md D-07 (verbatim required + optional sub-vendor list)
    - .planning/phases/49-bundle-budget-reset/49-RESEARCH.md §"Pattern 1: Extending manualChunks for D-07 Sub-Vendors" (insertion-point example + ordering rule)
    - .planning/phases/49-bundle-budget-reset/49-PATTERNS.md §"frontend/vite.config.ts (modify) — build config / id → chunk transform" (verbatim donor)
    - .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md "Residual `vendor` super-chunk composition" + "Decision" sections (optional tiptap/exceljs verdict from Plan 01 audit)
    - frontend/package.json `dependencies` (confirm @heroui/* / @sentry/* / @dnd-kit/* are present; check @tiptap/* and exceljs presence for optional branches)
  </read_first>
  <action>
    Extend `manualChunks` with three required sub-vendor branches per D-07. Optional `tiptap-vendor` / `exceljs-vendor` branches are added only if `49-BUNDLE-AUDIT.md` "Decision" section approved them based on the audit measurement.

    1. Confirm dep presence (D-07 optional gating):
       - `node -e "const p=require('./frontend/package.json'); for (const k of Object.keys(p.dependencies||{})) if (k.startsWith('@heroui')||k.startsWith('@sentry')||k.startsWith('@dnd-kit')||k.startsWith('@tiptap')||k==='exceljs') console.log(k)"`
       - Confirm `@heroui/*`, `@sentry/*`, `@dnd-kit/*` are present. If any is absent, STOP — D-07 lists them as required.
       - Note presence/absence of `@tiptap/*` and `exceljs` for the optional-branch decision in step 3.

    2. Edit `frontend/vite.config.ts` — insert three branches into the `manualChunks` arrow. Use the Edit tool, single-occurrence anchored on the `radix-vendor` branch:
       - Anchor (current line ~150-152):
         `            if (id.includes('@radix-ui')) {`
         `              return 'radix-vendor'`
         `            }`
       - Insert IMMEDIATELY AFTER the `radix-vendor` block closes (still inside `if (id.includes('node_modules')) { ... }`), BEFORE the `signature-visuals-d3` block. The three new branches each follow the same arrow shape:
         - `if (id.includes('@heroui')) return 'heroui-vendor'`
         - `if (id.includes('@sentry')) return 'sentry-vendor'`
         - `if (id.includes('@dnd-kit')) return 'dnd-vendor'`
       - Match the surrounding indentation (12-space inner body inside the arrow) and brace style (every existing branch uses `{ return '...' }` shape). Add a `// HeroUI primitive cascade per CLAUDE.md §Component Library Strategy (D-07)` comment above the heroui branch, `// Sentry — error tracking; cache-isolation rationale per D-09 (Sentry frontend init is requestIdleCallback-deferred at main.tsx:24, so non-initial-path)` above sentry, and `// @dnd-kit — kanban + reorder; non-initial-path` above dnd. Keep comments concise (CLAUDE.md §"No marketing voice").

    3. Optional `tiptap-vendor` / `exceljs-vendor` (D-07 gated on audit):
       - Read `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` `## Decision` section.
       - If the audit's "Optional sub-vendors per CONTEXT" line approves `tiptap-vendor` (only when `@tiptap/*` is ≥30 KB gz on its own per D-07 optional gating), insert `if (id.includes('@tiptap')) return 'tiptap-vendor'` AFTER the `dnd-vendor` branch with a comment naming the audit-measured gz.
       - Same logic for `exceljs-vendor` (`if (id.includes('exceljs')) return 'exceljs-vendor'`).
       - If neither was approved, skip — the deps stay in residual `vendor` and get a row in bundle-budget.md "Residual vendor chunk" in Task 5.

    4. Verify the file still parses + builds:
       - `pnpm -C frontend build; echo "build exit=$?"` MUST print `exit=0`.
       - `ls frontend/dist/assets/heroui-vendor-*.js | wc -l` MUST return `1`.
       - `ls frontend/dist/assets/sentry-vendor-*.js | wc -l` MUST return `1`.
       - `ls frontend/dist/assets/dnd-vendor-*.js | wc -l` MUST return `1`.
       - If any expected file is missing, the branch is dead code (T-49-05). Revisit step 2 — most likely cause is placement AFTER `return 'vendor'` (the catch-all returns earlier than the new branch).

    5. Measure the new chunks (input for Task 2 ceiling values):
       - `for f in frontend/dist/assets/{heroui,sentry,dnd}-vendor-*.js; do gz=$(gzip -c "$f" | wc -c); echo "$(basename "$f") gz=$gz B = $((gz/1024)) KB"; done > /tmp/49-02-subvendor-measurements.txt`
       - Eyeball: every line shows a `gz` value > 0 KB. Save the file — Task 2 reads it.
       - If `tiptap-vendor` / `exceljs-vendor` were added, measure those too.

    6. Karpathy §3 sanity — confirm `git diff phase-49-base -- frontend/vite.config.ts` shows ONLY additions (no edits to existing branches, no reordering, no chunkSizeWarningLimit changes, no plugin block edits). Verbatim allowed: 3 (or 5 with optional) new `if` branches + their preceding comments. Anything else is opportunistic — revert.

  </action>
  <verify>
    <automated>
      pnpm -C frontend build
      ls frontend/dist/assets/heroui-vendor-*.js | wc -l
      ls frontend/dist/assets/sentry-vendor-*.js | wc -l
      ls frontend/dist/assets/dnd-vendor-*.js | wc -l
      grep -c "id.includes('@heroui')" frontend/vite.config.ts
      grep -c "id.includes('@sentry')" frontend/vite.config.ts
      grep -c "id.includes('@dnd-kit')" frontend/vite.config.ts
      test -s /tmp/49-02-subvendor-measurements.txt
      git diff phase-49-base -- frontend/vite.config.ts | grep -cE '^[+-]' | awk '{exit ($1 < 4 || $1 > 30)}'
    </automated>
  </verify>
  <acceptance_criteria>
    - Source: `grep -c "id.includes('@heroui')" frontend/vite.config.ts` returns 1.
    - Source: `grep -c "id.includes('@sentry')" frontend/vite.config.ts` returns 1.
    - Source: `grep -c "id.includes('@dnd-kit')" frontend/vite.config.ts` returns 1.
    - Source: `grep -c "return 'heroui-vendor'" frontend/vite.config.ts` returns 1.
    - Source: `grep -c "return 'sentry-vendor'" frontend/vite.config.ts` returns 1.
    - Source: `grep -c "return 'dnd-vendor'" frontend/vite.config.ts` returns 1.
    - Behavior: `pnpm -C frontend build; echo $?` returns 0.
    - Behavior: `ls frontend/dist/assets/heroui-vendor-*.js | wc -l` returns 1.
    - Behavior: `ls frontend/dist/assets/sentry-vendor-*.js | wc -l` returns 1.
    - Behavior: `ls frontend/dist/assets/dnd-vendor-*.js | wc -l` returns 1.
    - Source: `/tmp/49-02-subvendor-measurements.txt` is non-empty and contains gz size readings for heroui/sentry/dnd vendor chunks.
    - Audit (Karpathy §3): `git diff phase-49-base -- frontend/vite.config.ts` shows only additions inside the `node_modules` block of the `manualChunks` arrow; no edits to existing branches; no reordering.
  </acceptance_criteria>
  <done>manualChunks extended with heroui/sentry/dnd (and optional tiptap/exceljs if audit-approved); build emits the three new chunks; per-chunk gz measurements captured for Task 2.</done>
</task>

<task type="auto">
  <name>Task 2: Add HeroUI/Sentry/DnD entries to .size-limit.json with measured+5 KB ceilings</name>
  <files>frontend/.size-limit.json</files>
  <read_first>
    - frontend/.size-limit.json (current 6 entries after Plan 01 re-baseline)
    - /tmp/49-02-subvendor-measurements.txt (Task 1 gz measurements)
    - .planning/phases/49-bundle-budget-reset/49-CONTEXT.md D-03 (measured + 5 KB rule) + D-07 (required sub-vendors)
    - .planning/phases/49-bundle-budget-reset/49-RESEARCH.md §"Pattern 2: `.size-limit.json` Sub-Vendor Entry Schema" (verbatim entry shape + "never commit placeholders" rule)
    - .planning/phases/49-bundle-budget-reset/49-PATTERNS.md §"frontend/.size-limit.json (rewrite)" (verbatim ADD list)
  </read_first>
  <action>
    Append 3 new entries (heroui/sentry/dnd) to `.size-limit.json`. Each entry uses the existing schema. Ceiling = measured gz + 5 KB (rounded UP to next KB), per D-03. Optional tiptap/exceljs entries added only if Task 1 added the matching `manualChunks` branch.

    1. Compute ceilings from `/tmp/49-02-subvendor-measurements.txt`:
       - Read each line (`heroui-vendor-<hash>.js gz=<B> B = <K> KB`); take `<K>` and compute `ceiling = ceil(K) + 5` (round-up safety because gz size in bytes / 1024 may truncate).
       - Example: if heroui-vendor measures 92340 B (90.18 KB), ceiling = 90 + 5 = 95 KB → entry `"limit": "95 KB"`.
       - Document the math in the commit message body for traceability.

    2. Append entries to `frontend/.size-limit.json` using the Edit tool. Match the existing entry shape byte-for-byte (5 fields: `name`, `path`, `limit`, `gzip`, `running`). Insertion point: directly before the `Total JS` entry (preserves the "individual chunks first, aggregate last" ordering observed in the current 6 entries).

       Three new entries (placeholders `<X>` replaced with computed values from step 1):
       - `{ "name": "HeroUI vendor",  "path": "dist/assets/heroui-vendor-*.js",  "limit": "<X> KB", "gzip": true, "running": false }`
       - `{ "name": "Sentry vendor",  "path": "dist/assets/sentry-vendor-*.js",  "limit": "<X> KB", "gzip": true, "running": false }`
       - `{ "name": "DnD vendor",     "path": "dist/assets/dnd-vendor-*.js",     "limit": "<X> KB", "gzip": true, "running": false }`

       NEVER commit literal `<X>` placeholders (RESEARCH §"Critical" note + PATTERNS §"Never commit placeholders"). The Task acceptance gate greps for the placeholder string and fails if found.

    3. If Task 1 added `tiptap-vendor` / `exceljs-vendor` branches, append matching entries with measured ceilings here too (same shape; `name`: `"Tiptap vendor"` / `"ExcelJS vendor"`; `path`: `dist/assets/{tiptap,exceljs}-vendor-*.js`).

    4. Verify JSON validity and entry count:
       - `node -e 'JSON.parse(require("fs").readFileSync("frontend/.size-limit.json","utf8"))'` exits 0.
       - `jq '. | length' frontend/.size-limit.json` outputs `9` (was 6; +3 required). Or `10`/`11` if tiptap/exceljs added.
       - `jq -r '.[] | .name' frontend/.size-limit.json | sort -u` lists exactly the expected names.

    5. T-49-06 cross-check — entry names match path globs:
       - For each new entry, confirm `path` field matches `dist/assets/<name-slug>-vendor-*.js` shape and `ls frontend/dist/assets/<name-slug>-vendor-*.js | wc -l` returns 1.

    6. Re-run the assert script (Task 3 extends `expectedMatchCounts`; until then, the script defaults to "≥1" for unknown names — should still pass):
       - `node frontend/scripts/assert-size-limit-matches.mjs; echo $?` MUST return 0.

  </action>
  <verify>
    <automated>
      node -e 'JSON.parse(require("fs").readFileSync("frontend/.size-limit.json","utf8"))'
      jq '. | length' frontend/.size-limit.json
      jq -r '.[] | .name' frontend/.size-limit.json | grep -c "HeroUI vendor"
      jq -r '.[] | .name' frontend/.size-limit.json | grep -c "Sentry vendor"
      jq -r '.[] | .name' frontend/.size-limit.json | grep -c "DnD vendor"
      grep -c '<X>' frontend/.size-limit.json
      grep -c "measured + 5" frontend/.size-limit.json
      node frontend/scripts/assert-size-limit-matches.mjs
    </automated>
  </verify>
  <acceptance_criteria>
    - Source: `frontend/.size-limit.json` parses as valid JSON.
    - Source: `jq '. | length' frontend/.size-limit.json` returns 9 (or 10/11 if optional sub-vendors added).
    - Source: `jq -r '.[] | .name' frontend/.size-limit.json | grep -c "HeroUI vendor"` returns 1.
    - Source: `jq -r '.[] | .name' frontend/.size-limit.json | grep -c "Sentry vendor"` returns 1.
    - Source: `jq -r '.[] | .name' frontend/.size-limit.json | grep -c "DnD vendor"` returns 1.
    - Source: `grep -c '<X>' frontend/.size-limit.json` returns 0 (no placeholders).
    - Source: `grep -c "measured + 5" frontend/.size-limit.json` returns 0 (no placeholder text from the research example).
    - Source: each new entry's `limit` field is of form `"<positive integer> KB"`.
    - Behavior: `node frontend/scripts/assert-size-limit-matches.mjs; echo $?` returns 0.
    - Audit (T-49-06): every `name` field of the new entries corresponds to an actual file under `dist/assets/` (verified in step 5).
  </acceptance_criteria>
  <done>.size-limit.json has 3 (or 5) new sub-vendor entries with real measured+5 KB ceilings; no placeholders; assert script passes.</done>
</task>

<task type="auto">
  <name>Task 3: Extend assert-size-limit-matches.mjs expectedMatchCounts with strict singleton entries</name>
  <files>frontend/scripts/assert-size-limit-matches.mjs</files>
  <read_first>
    - frontend/scripts/assert-size-limit-matches.mjs lines 42-48 (existing expectedMatchCounts Map)
    - .planning/phases/49-bundle-budget-reset/49-CONTEXT.md (integration points — D-07 + assert-script extension)
    - .planning/phases/49-bundle-budget-reset/49-RESEARCH.md §"Wave 0 Gaps" / §"Important" (strict singleton enforcement rationale)
    - .planning/phases/49-bundle-budget-reset/49-PATTERNS.md §"`frontend/scripts/assert-size-limit-matches.mjs` (extend)" (verbatim diff)
  </read_first>
  <action>
    Extend the `expectedMatchCounts` Map with strict `=== 1` rows for each new sub-vendor `name`. Map keys MUST match `.size-limit.json` `name` fields byte-for-byte (case-sensitive — `"HeroUI vendor"` NOT `"heroui vendor"`).

    1. Edit `frontend/scripts/assert-size-limit-matches.mjs` lines 42-48. Anchor on the existing Map literal. Insert three new entries after the `'TanStack vendor', 1` row and before the `'signature-visuals/d3-geospatial', 1` row (alphabetical-ish; ordering does not change behavior — strict equality drives the gate):
       - `['HeroUI vendor', 1],`
       - `['Sentry vendor', 1],`
       - `['DnD vendor', 1],`

    2. If Task 1 added `tiptap-vendor` / `exceljs-vendor` branches AND Task 2 added matching `.size-limit.json` entries, also add:
       - `['Tiptap vendor', 1],`
       - `['ExcelJS vendor', 1],`

    3. Do NOT add a row for `Total JS` — its glob (`dist/assets/*.js`) matches many files (RESEARCH §"Wave 0 Gaps"). Leaving it absent makes the script default to "≥1," the intended behavior.

    4. Verify script execution:
       - `node frontend/scripts/assert-size-limit-matches.mjs; echo $?` MUST return 0.
       - Run a deliberate-fail check by editing `.size-limit.json` `HeroUI vendor` path to a non-existent glob temporarily (`dist/assets/heroui-vendor-NONEXISTENT-*.js`), running the script, asserting it exits non-zero, then reverting. This validates strict enforcement is active. (Optional safety check; if the executor prefers, skip and rely on the build step in Task 4 to surface any regression.)

    5. Karpathy §3 sanity:
       - `git diff phase-49-base -- frontend/scripts/assert-size-limit-matches.mjs` shows only additions inside the `expectedMatchCounts` Map literal. No edits to `globToRegExp`, `walkFiles`, or the loop logic.

  </action>
  <verify>
    <automated>
      grep -c "'HeroUI vendor', 1" frontend/scripts/assert-size-limit-matches.mjs
      grep -c "'Sentry vendor', 1" frontend/scripts/assert-size-limit-matches.mjs
      grep -c "'DnD vendor', 1" frontend/scripts/assert-size-limit-matches.mjs
      node frontend/scripts/assert-size-limit-matches.mjs
      git diff phase-49-base -- frontend/scripts/assert-size-limit-matches.mjs | grep -cE '^-' | awk '{exit ($1 > 0)}'
    </automated>
  </verify>
  <acceptance_criteria>
    - Source: `grep -c "'HeroUI vendor', 1" frontend/scripts/assert-size-limit-matches.mjs` returns 1.
    - Source: `grep -c "'Sentry vendor', 1" frontend/scripts/assert-size-limit-matches.mjs` returns 1.
    - Source: `grep -c "'DnD vendor', 1" frontend/scripts/assert-size-limit-matches.mjs` returns 1.
    - Source: `grep -c "Total JS" frontend/scripts/assert-size-limit-matches.mjs` returns 0 (Total JS is intentionally absent from the Map — defaults to ≥1).
    - Behavior: `node frontend/scripts/assert-size-limit-matches.mjs; echo $?` returns 0.
    - Audit (Karpathy §3): `git diff phase-49-base -- frontend/scripts/assert-size-limit-matches.mjs` has 0 deletion lines (`^-` lines from the diff; only additions inside the Map literal).
  </acceptance_criteria>
  <done>expectedMatchCounts extended with strict singleton entries per new sub-vendor; script still exits 0; no edits outside the Map.</done>
</task>

<task type="auto">
  <name>Task 4: Convert audit-identified ≥30 KB gz non-initial components to React.lazy() with D-13 Suspense</name>
  <files>frontend/src/**/*.tsx (audit-driven, varies — likely candidates: CalendarEntryForm, chart-heavy modals/drawers; final list comes from `49-BUNDLE-AUDIT.md`)</files>
  <read_first>
    - .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md `## Proposed lazy() conversions` table (canonical candidate list from Plan 01)
    - .planning/phases/49-bundle-budget-reset/49-CONTEXT.md D-06 (≥30 KB gz AND not in initial render path) + D-13 (fallback selection rules)
    - .planning/phases/49-bundle-budget-reset/49-RESEARCH.md §"Pattern 3: React.lazy() Conversion (D-06)" (verbatim shapes + component-side requirement)
    - .planning/phases/49-bundle-budget-reset/49-PATTERNS.md §"Audit-identified ≥30 KB gz components → React.lazy()" (4 canonical shapes — engagement-tab, modal fallback={null}, named-export wrap, inline GlobeSpinner+token wrapper)
    - frontend/src/components/graph/FullScreenGraphModal.tsx (Shape-2 template — default export, opens from sidebar)
    - frontend/src/components/dossier/RelationshipSidebar.tsx:62-63 + :534-542 (Shape-2 declaration + consumer site)
    - frontend/src/routes/_protected/engagements/$engagementId/overview.tsx (Shape-1 template — TabSkeleton fallback)
    - frontend/src/routes/_protected/kanban.tsx:1-24 (Shape-3 template — named-export wrap)
    - frontend/src/pages/TicketDetail.tsx:22-23 + :411-419 (Shape-4 — but D-13 requires re-styling: replace `text-muted-foreground` ad-hoc spinner with token-wrapped GlobeSpinner)
    - frontend/src/components/signature-visuals/GlobeSpinner.tsx (confirm file exists; confirm props — likely `size="sm" | "md" | "lg"`)
    - ./CLAUDE.md §"Design rules — non-negotiable" (no raw hex, no card shadows, density-aware row heights, token-only)
    - ./CLAUDE.md §"Karpathy Coding Principles" §3 (only touch what's needed for the conversion)
  </read_first>
  <action>
    For each component approved in the Plan-01 audit's "Proposed lazy() conversions" table, convert from eager `import` to `lazy(() => import(...))` at the consumer site with the D-13-correct Suspense fallback. Touch ONLY the files needed for each conversion: the component file (if a `export default` shim must be added) and its consumer(s) (Suspense boundary).

    1. Read `49-BUNDLE-AUDIT.md` `## Proposed lazy() conversions` table. For each row marked `D-06 threshold met? = yes`:
       - Pull (a) Component name, (b) File path, (c) Consumer site to wrap in Suspense.
       - If the table has 0 rows marked `yes`, this task is a no-op — record in summary and proceed to Task 5. (Real outcome: Plan 01's audit will produce at least 1 candidate per CONTEXT D-06 example list — `CalendarEntryForm`, `EntityLinkManager` if not already lazy at every consumer, chart-heavy modals.)

    2. For each candidate, apply the right shape per D-13 (decision tree):
       - **Is the consumer wrapping with `{open && <Component />}` or a tab-switch (`{activeTab === '...' && ...}`)?** → Shape 2 (modal `fallback={null}`).
       - **Is the consumer a route file under `frontend/src/routes/`?** → Shape 1 (TabSkeleton if engagement-tab-shaped; otherwise inline GlobeSpinner in a div with `border: 1px solid var(--line)`).
       - **Is the component currently a named export only AND has multiple consumers?** → Shape 3 (`.then(m => ({ default: m.Named }))` wrap).
       - **Is the component currently a named export only AND has a single consumer?** → Add `export default <Name>` alongside the named export at the component file, then use Shape 1/2/4 at the consumer.
       - **Is the consumer always-mounted (not guarded by `{open && ...}` or a tab-switch)?** → Shape 4 (inline `<GlobeSpinner size="sm" />` in token-styled wrapper).

    3. Apply the conversion verbatim from the matching shape in PATTERNS:
       - **Shape 1 (route-tab):** declare `const Comp = React.lazy(() => import('@/...'))` at top of the route file; wrap render in `<Suspense fallback={<TabSkeleton type="..." />}><Comp /></Suspense>`. Extend `frontend/src/components/workspace/TabSkeleton.tsx` with a 5th variant ONLY if existing variants do not fit (existing: `summary | kanban | list | cards`). Do not author a one-off if a variant fits.
       - **Shape 2 (modal):** declare `const Modal = lazy(() => import('../path/Modal'))`; wrap render in `{open && <Suspense fallback={null}><Modal {...props} /></Suspense>}`.
       - **Shape 3 (named-wrap):** `const Comp = lazy(() => import('@/path').then((m) => ({ default: m.Comp })))`; Suspense fallback per consumer shape (1, 2, or 4 above).
       - **Shape 4 (inline):** declare `const Comp = lazy(() => import('@/path'))`; import `GlobeSpinner` from `@/components/signature-visuals` (or direct file path if the barrel does not re-export); wrap render in:
         <Suspense fallback={
           <div className="flex items-center justify-center" style={{
             minHeight: 'var(--row-h)',
             border: '1px solid var(--line)',
             borderRadius: 'var(--radius)',
           }}>
             <GlobeSpinner size="sm" />
           </div>
         }>
           <Comp {...props} />
         </Suspense>

    4. For Phase 38/40/41 visual-baseline routes touched by a Shape-4 conversion, note the file path in the commit message body as `Visual baselines may need re-capture: <route-list>`. Re-capture is OUT OF SCOPE for Plan 02 (Plan 03 may schedule it as a gap-closure if E2E surfaces failures); per RESEARCH Pitfall 5, do NOT revert the lazy() — the lazy() is the budget win; baselines are the visual contract.

    5. Component-side requirement check (PATTERNS §"Component-side requirement"):
       - For every lazy()'d target, confirm the target file exports `default` OR the consumer uses Shape 3's `.then` wrap. If neither, add `export default <Name>` alongside the named export at the component file (surgical — one-line addition).

    6. Karpathy §3 sanity per file touched:
       - Each touched file's diff must contain ONLY: (a) new lazy() declaration + import changes, (b) Suspense wrap at render site, (c) at most one `export default` shim addition. No unrelated formatting, no test-attribute additions, no logic changes.

    7. T-49-08 design-rules grep gate. For every file touched in this task:
       - `rg -nE "(#[0-9a-fA-F]{3,6}\\b|text-(left|right|blue|red|green|gray)-[0-9]+|box-shadow|drop-shadow)" $(git diff --name-only phase-49-base..HEAD -- 'frontend/src/**/*.tsx')` MUST return 0 lines.
       - If matches surface, fix to tokens (`var(--*)`) before continuing.

    8. T-49-10 suppression gate. For every file touched in this task:
       - `git diff phase-49-base..HEAD -- 'frontend/src' | grep -E '^\+.*(@ts-(ignore|expect-error)|eslint-disable|\bas any)' | grep -vE '^\+\+\+'` MUST return 0 lines.
       - If matches surface, fix the underlying type issue at source (e.g., add `export default` shim instead of `as any`).

    9. Validate against existing test/E2E suite:
       - `pnpm --filter intake-frontend lint; echo "lint exit=$?"` MUST return 0.
       - `pnpm --filter intake-frontend type-check; echo "tc exit=$?"` MUST return 0.
       - `pnpm -C frontend test --run; echo "vitest exit=$?"` MUST return 0 (unit tests).
       - `pnpm -C frontend test:e2e; echo "e2e exit=$?"` — best-effort; if the E2E suite cannot run in the sandbox (no dev server / no Doppler envs as seen in prior phases), document the deferral in the Plan 02 summary with the exact reason — do NOT mark this acceptance criterion as silently passed.

  </action>
  <verify>
    <automated>
      pnpm --filter intake-frontend lint
      pnpm --filter intake-frontend type-check
      pnpm -C frontend test --run
      pnpm -C frontend build
      rg -nE "(#[0-9a-fA-F]{3,6}\b|text-(left|right|blue|red|green|gray)-[0-9]+|box-shadow|drop-shadow)" $(git diff --name-only phase-49-base..HEAD -- 'frontend/src/**/*.tsx') 2>/dev/null | wc -l
      git diff phase-49-base..HEAD -- 'frontend/src' | grep -E '^\+.*(@ts-(ignore|expect-error)|eslint-disable|\bas any)' | grep -vE '^\+\+\+' | wc -l
      git diff phase-49-base..HEAD -- 'frontend/src/**/*.tsx' | grep -cE '^\+.*lazy\(\(\) => import'
    </automated>
  </verify>
  <acceptance_criteria>
    - Behavior: `pnpm --filter intake-frontend lint; echo $?` returns 0 (no new lint errors from conversions).
    - Behavior: `pnpm --filter intake-frontend type-check; echo $?` returns 0 (no new TS errors; lazy() type-compatible).
    - Behavior: `pnpm -C frontend test --run; echo $?` returns 0 (existing unit tests still pass).
    - Behavior: `pnpm -C frontend build; echo $?` returns 0.
    - Audit (T-49-08): `rg -nE "(#[0-9a-fA-F]{3,6}\b|text-(left|right|blue|red|green|gray)-[0-9]+|box-shadow|drop-shadow)" $(git diff --name-only phase-49-base..HEAD -- 'frontend/src/**/*.tsx') | wc -l` returns 0.
    - Audit (T-49-10): `git diff phase-49-base..HEAD -- 'frontend/src' | grep -E '^\+.*(@ts-(ignore|expect-error)|eslint-disable|\bas any)' | grep -vE '^\+\+\+' | wc -l` returns 0.
    - Behavior: count of new `lazy(() => import` lines in `frontend/src/**/*.tsx` diff equals the count of `yes` rows in `49-BUNDLE-AUDIT.md` "Proposed lazy() conversions" table (i.e., the plan delivers every approved candidate; zero is acceptable only if the audit produced zero candidates, documented in summary).
    - Gate proof (E2E): `pnpm -C frontend test:e2e` exits 0 OR the Plan 02 summary explicitly documents the deferral with the cause (e.g., "no Doppler env in session sandbox" per Phase 40-23 precedent).
  </acceptance_criteria>
  <done>Audit-identified ≥30 KB gz non-initial components converted to lazy() with D-13-correct Suspense fallbacks; tokens-only styling; no suppressions; lint/type-check/build/unit-tests still green.</done>
</task>

<task type="auto">
  <name>Task 5: Update bundle-budget.md with sub-vendor rows + residual vendor table (D-08/D-09)</name>
  <files>frontend/docs/bundle-budget.md</files>
  <read_first>
    - frontend/docs/bundle-budget.md (Plan 01 scaffold — table header + Initial/React/TanStack/Total rows)
    - .planning/phases/49-bundle-budget-reset/49-CONTEXT.md D-08 (residual vendor rationale) + D-09 (every chunk >100 KB gz gets a row)
    - .planning/phases/49-bundle-budget-reset/49-RESEARCH.md §"Pattern 6" (bundle-budget.md schema)
    - .planning/phases/49-bundle-budget-reset/49-PATTERNS.md §"frontend/docs/bundle-budget.md" (verbatim schema with HeroUI/Sentry/DnD example rows)
    - /tmp/49-02-subvendor-measurements.txt (Task 1 measurements)
    - frontend/.size-limit.json (Task 2-locked ceilings)
    - frontend/dist/assets/vendor-*.js (residual vendor chunk for D-08 measurement)
    - ./CLAUDE.md §"Design rules" (no marketing voice, no emoji)
  </read_first>
  <action>
    Append measured rows to the bundle-budget.md "Ceilings" table for HeroUI / Sentry / DnD vendors. If residual `vendor` is still >100 KB gz, populate the "Residual vendor chunk" table per D-08.

    1. Append three rows to the "Ceilings" table — one each for HeroUI vendor, Sentry vendor, DnD vendor. Row template (one row per chunk):

       `| HeroUI vendor | <measured> KB | <ceiling from .size-limit.json> KB | Primary primitive cascade per CLAUDE.md §Component Library Strategy. Eager because most routes render a HeroUI primitive on first paint. | <YYYY-MM-DD> |`

       Rationale strings (one per chunk; sentence case; no marketing voice; no emoji):
       - **HeroUI vendor:** "Primary primitive cascade per CLAUDE.md §Component Library Strategy. Eager because most routes render a HeroUI primitive on first paint. Cache-isolated so HeroUI minor upgrades do not cache-bust other vendors."
       - **Sentry vendor:** "@sentry/react error tracking. Init is requestIdleCallback-deferred at main.tsx:24, so this chunk is non-blocking despite the size. Cache-isolated so a Sentry upgrade does not cache-bust other vendors."
       - **DnD vendor:** "@dnd-kit/* — only loaded on kanban + reorder routes; separate chunk avoids cache-busting the initial path on dnd-kit minor upgrades."

    2. If Task 1 added optional `tiptap-vendor` / `exceljs-vendor` branches, append matching rows here too (rationale: "Audit-approved Phase 49 D-07 optional split — <gz size> on its own, exceeds the 30 KB threshold per CONTEXT D-06").

    3. Update the `Last audited:` line at the top of the file to today's date.

    4. Populate the "Residual vendor chunk" table (D-08):
       - Measure residual `vendor-*.js` chunk gz: `gzip -c frontend/dist/assets/vendor-*.js | wc -c | awk '{print int($1/1024)" KB"}'`
       - If <100 KB gz: replace the "Residual vendor chunk" table body with a single line: `Residual vendor chunk is <X KB> gz, under the 100 KB threshold — no per-dep documentation required.`
       - If ≥100 KB gz: list every remaining dep ≥10 KB gz with a one-line reason (D-08 rule). Identify deps via `frontend/dist/stats.html` treemap drill-down into the residual `vendor` chunk, or via Rollup's stats JSON if extractable. For each row:
         `| <dep name> | <gz size> KB | <reason — e.g., "used by 3+ vendors transitively; not worth its own chunk"> |`
       - Common candidates expected to remain: small i18n plugins, single-export utility libs, polyfills. If the executor cannot identify a dep, name it `<unknown-residual>` and document the investigation gap in the Plan 02 summary.

    5. Karpathy §3 sanity:
       - `git diff phase-49-base -- frontend/docs/bundle-budget.md` shows additions to (a) the `Last audited:` line, (b) the "Ceilings" table (3 or 5 new rows), and (c) the "Residual vendor chunk" table body. No reformatting of Plan-01 rows.

    6. Banned-token grep (CLAUDE.md §Design rules):
       - `rg -n '(Discover|Easily|Unleash|emoji)' frontend/docs/bundle-budget.md` returns 0 matches.
       - `rg -nP '[\x{1F300}-\x{1FAFF}]' frontend/docs/bundle-budget.md` returns 0 matches.

  </action>
  <verify>
    <automated>
      grep -c "| HeroUI vendor |" frontend/docs/bundle-budget.md
      grep -c "| Sentry vendor |" frontend/docs/bundle-budget.md
      grep -c "| DnD vendor |" frontend/docs/bundle-budget.md
      grep -c "Residual vendor chunk" frontend/docs/bundle-budget.md
      rg -n '(Discover|Easily|Unleash)' frontend/docs/bundle-budget.md | wc -l
      rg -nP '[\x{1F300}-\x{1FAFF}]' frontend/docs/bundle-budget.md | wc -l
    </automated>
  </verify>
  <acceptance_criteria>
    - Source: `grep -c "| HeroUI vendor |" frontend/docs/bundle-budget.md` returns 1.
    - Source: `grep -c "| Sentry vendor |" frontend/docs/bundle-budget.md` returns 1.
    - Source: `grep -c "| DnD vendor |" frontend/docs/bundle-budget.md` returns 1.
    - Source: each new row contains a measured gz value (positive integer + "KB"), a ceiling (matches `.size-limit.json` `limit` field), and a non-empty rationale sentence.
    - Source: "Residual vendor chunk" subsection contains either a "under the 100 KB threshold" note OR ≥1 populated dep row (D-08 conditional).
    - Source: `Last audited:` line at the top reads today's date.
    - Source: `rg -n '(Discover|Easily|Unleash)' frontend/docs/bundle-budget.md | wc -l` returns 0 (no marketing voice).
    - Source: `rg -nP '[\x{1F300}-\x{1FAFF}]' frontend/docs/bundle-budget.md | wc -l` returns 0 (no emoji).
  </acceptance_criteria>
  <done>bundle-budget.md has rows for every chunk >100 KB gz, including the new sub-vendors; residual vendor is either documented or note-only; CLAUDE.md design-rules compliance preserved.</done>
</task>

<task type="auto">
  <name>Task 6: Confirm pnpm size-limit exits 0 + commit Plan 02 atomically</name>
  <files>(no new files; verification + commit)</files>
  <read_first>
    - frontend/.size-limit.json (post Task 2 — has 9-11 entries)
    - frontend/dist/assets/*.js (latest build output)
    - .planning/phases/49-bundle-budget-reset/49-CONTEXT.md D-02 (Total JS ceiling rule)
    - .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md (D-02 attainability verdict)
  </read_first>
  <action>
    Final verification on the post-Plan-02 baseline + atomic commit.

    1. Re-run a clean build to capture the final chunk inventory:
       - `rm -rf frontend/dist`
       - `pnpm -C frontend build; echo "build exit=$?"` MUST return 0.
       - `node frontend/scripts/assert-size-limit-matches.mjs; echo "assert exit=$?"` MUST return 0.

    2. Run the size-limit gate — this is the moment Plan 01's lowered ceilings become enforceable:
       - `pnpm -C frontend size-limit; echo "size-limit exit=$?"` MUST return 0.
       - If exit is non-zero, identify the failing chunk:
         - Initial JS over 450 KB? → audit `49-BUNDLE-AUDIT.md` for additional D-06 lazy() candidates that were missed; revisit Task 4.
         - Total JS over 1.8 MB AND `49-BUNDLE-AUDIT.md` did NOT escalate? → STOP, file an escalation block in 49-BUNDLE-AUDIT.md retroactively, return to Plan 01 Task 4 to lock the escalated ceiling. (Per D-02 — never silently raise.)
         - Sub-vendor over its measured+5 KB ceiling? → unexpected; the ceiling was set from this build's measurement. Re-measure and re-confirm Task 2.

    3. Phase-49 D-14 partial audit (Plan 03 runs the full audit; Plan 02 confirms its own contribution is clean):
       - `git diff phase-49-base -- 'frontend/src' | grep -E '^\+.*(@ts-(ignore|expect-error)|eslint-disable)' | grep -vE '^\+\+\+' | wc -l` MUST return 0.
       - `git diff phase-49-base -- frontend/.size-limit.json | grep -E '^\+.*"limit": "' | wc -l` — every NEW `"limit"` line in this diff must be either (a) a value ≤ baseline + 5 KB (Task 2 new entries) or (b) ≤ Plan 01's locked ceiling (no further raises).

    4. Atomic commit of all Plan 02 changes:
       - `git add frontend/vite.config.ts frontend/.size-limit.json frontend/scripts/assert-size-limit-matches.mjs frontend/docs/bundle-budget.md frontend/src`
       - `git status --porcelain | grep -E '^.M ' | wc -l` is the number of files staged — sanity-check matches expectation (5 files + N lazy() src changes from Task 4).
       - `git commit -m "$(cat <<'EOF'

feat(49-02): vendor decomposition + audit-driven lazy() conversion

- manualChunks: add heroui-vendor / sentry-vendor / dnd-vendor branches (D-07)
- .size-limit.json: +3 sub-vendor entries with measured+5 KB ceilings (D-03)
- assert-size-limit-matches.mjs: extend expectedMatchCounts with strict ===1 rows
- React.lazy() conversions for N ≥30 KB gz non-initial components (D-06)
- bundle-budget.md: rationale rows for HeroUI / Sentry / DnD; residual vendor

pnpm size-limit exits 0 with Plan-01 lowered ceilings (450 KB Initial / 1.8 MB Total).
EOF
)"`

    5. Verify the commit landed cleanly:
       - `git log -1 --pretty=%H` returns a 40-char SHA.
       - `git log -1 --pretty=%s` includes `feat(49-02):`.
       - `git status --porcelain` returns empty (working tree clean).

  </action>
  <verify>
    <automated>
      pnpm -C frontend build
      node frontend/scripts/assert-size-limit-matches.mjs
      pnpm -C frontend size-limit
      git diff phase-49-base -- 'frontend/src' | grep -E '^\+.*(@ts-(ignore|expect-error)|eslint-disable)' | grep -vE '^\+\+\+' | wc -l
      git log -1 --pretty=%s | grep -c "feat(49-02):"
      git status --porcelain | wc -l
    </automated>
  </verify>
  <acceptance_criteria>
    - Behavior: `pnpm -C frontend build; echo $?` returns 0.
    - Behavior: `node frontend/scripts/assert-size-limit-matches.mjs; echo $?` returns 0.
    - Behavior: `pnpm -C frontend size-limit; echo $?` returns 0 — the budget the phase set in Plan 01 is now real and enforceable.
    - Audit (D-14): `git diff phase-49-base -- 'frontend/src' | grep -E '^\+.*(@ts-(ignore|expect-error)|eslint-disable)' | grep -vE '^\+\+\+' | wc -l` returns 0.
    - Source: `git log -1 --pretty=%s` includes `feat(49-02):`.
    - Source: `git status --porcelain | wc -l` returns 0 (working tree clean post-commit).
  </acceptance_criteria>
  <done>Post-Plan-02 build + assert + size-limit all exit 0; D-14 partial audit clean; Plan 02 changes committed atomically; Plan 03 may now start.</done>
</task>

<task id="T-49-09" type="auto">
  <action>
    **Plan 02 SUMMARY — handoff artifact for Plan 03 preflight.**

    Create `.planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md` capturing the moment the size-limit gate becomes locally green (the binding pre-CI proof that Plan 03 can safely flip to PR-blocking). Plan 03 Task 1 step 1 (`ls .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md`) gates on this file existing — without it, Plan 03 STOPS.

    1. Capture pre/post `pnpm -C frontend size-limit` output. The "pre" snapshot is the post-Plan-01 state (size-limit exits non-zero, lazy() not yet landed); the "post" snapshot is the current state (exits 0).
       - `pnpm -C frontend size-limit > /tmp/49-02-sizelimit-post.txt 2>&1; echo $? >> /tmp/49-02-sizelimit-post.txt`

    2. Capture lazy() conversion list:
       - `git diff phase-49-base -- 'frontend/src' | grep -E '^\+.*React\.lazy' | grep -vE '^\+\+\+' > /tmp/49-02-lazy-additions.txt`

    3. Capture sub-vendor measurements:
       - Identify each new chunk's gz: `for n in heroui sentry dnd; do f=$(ls frontend/dist/assets/${n}-vendor-*.js 2>/dev/null | head -1); test -n "$f" && printf "%s %s\n" "$n" "$(gzip -c "$f" | wc -c | awk '{printf "%.1f KB", $1/1024}')"; done > /tmp/49-02-subvendor-measured.txt`

    4. Author `49-02-SUMMARY.md` with the following required sections:

       # Phase 49 — Plan 02 SUMMARY: Vendor Decomposition + Lazy Conversion

       **Plan:** 49-02-vendor-decomp-and-lazy
       **Verdict:** SUCCESS | SUCCESS-WITH-DEVIATION | FAIL
       **Date:** <YYYY-MM-DD>
       **Commit SHA:** <git rev-parse HEAD>

       ## Sub-vendor measurements + locked ceilings
       | Chunk | Measured (gz) | Locked ceiling | Source |
       | --- | --- | --- | --- |
       | heroui-vendor | <X.X KB> | <X+5 KB> | D-07 |
       | sentry-vendor | <X.X KB> | <X+5 KB> | D-07 |
       | dnd-vendor | <X.X KB> | <X+5 KB> | D-07 |
       | tiptap-vendor | <X.X KB or "not added"> | <X+5 KB or "n/a"> | D-07 (optional) |
       | exceljs-vendor | <X.X KB or "not added"> | <X+5 KB or "n/a"> | D-07 (optional) |

       ## Components converted to React.lazy()
       | Component | File path | Measured gz | Fallback shape |
       | --- | --- | --- | --- |
       | <name> | frontend/src/... | <X KB> | <GlobeSpinner | fallback={null} | token-styled skeleton> |
       ...

       ## Pre/post size-limit
       - Pre (post-Plan-01, pre-lazy()): `pnpm size-limit` exit=<N>
       - Post (Plan-02 close): `pnpm size-limit` exit=0
       - Initial JS post-Plan-02: <X.XX KB gz> (ceiling 450 KB)
       - Total JS post-Plan-02: <X.XX MB gz> (ceiling 1.8 MB or escalated)

       ## Residual vendor chunk (D-08)
       - Size: <X.X KB gz>
       - Disposition: <under 100 KB — note only | over 100 KB — full table in bundle-budget.md>

       ## E2E deferrals
       <Any test:e2e deferral with reason per Phase 40-23 precedent. If none: "None.">

       ## Visual baselines requiring re-capture
       <Any visual baseline files affected by lazy() conversion / Suspense fallback timing per RESEARCH Pitfall 5. If none: "None.">

       ## Deviations
       <Any planner-discretion calls — optional sub-vendor adds, lazy() candidates dropped due to E2E regression, etc. If none: "None.">

       ## Handoff
       Plan 03 may now start. The size-limit gate is LOCALLY green (`pnpm -C frontend size-limit` exits 0); ready to be flipped to PR-blocking via branch-protection PUT in 49-03 Task 2.

    5. Commit:
       - `gsd-sdk query commit "docs(49-02): Plan 02 SUMMARY — vendor decomp + lazy close-out" --files ".planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md"`

  </action>
  <read_first>
    - .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md (lazy() candidate source list)
    - frontend/.size-limit.json (locked ceilings)
    - .planning/phases/49-bundle-budget-reset/49-01-SUMMARY.md (analog SUMMARY structure)
    - .planning/phases/48-lint-config-alignment/48-02-*-PLAN.md SUMMARY (if exists; closer analog than 47)
  </read_first>
  <verify>
    <automated>
      test -f .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md
      grep -c "^## Sub-vendor measurements" .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md
      grep -c "^## Components converted to React.lazy" .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md
      grep -c "^## Pre/post size-limit" .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md
      grep -c "^## Residual vendor chunk" .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md
      grep -c "^## Handoff" .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md
      grep -cE "Verdict:.*(SUCCESS|FAIL)" .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md
      grep -c "<placeholder>" .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md
      git log --oneline -1 -- .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md | wc -l
    </automated>
  </verify>
  <acceptance_criteria>
    - Source: `test -f .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md` exits 0.
    - Source: Each of `grep -c "^## Sub-vendor measurements"`, `^## Components converted to React.lazy`, `^## Pre/post size-limit`, `^## Residual vendor chunk`, `^## Handoff` returns 1.
    - Source: `grep -cE "Verdict:.*(SUCCESS|FAIL)"` returns ≥1 (verdict is concrete).
    - Source: `grep -c "<placeholder>" .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md` returns 0.
    - Behavior: `git log --oneline -1 -- .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md | wc -l` returns 1.
    - Audit (T-49-09): Plan 03 Task 1 preflight step 1 (`ls .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md`) succeeds when this task is complete.
  </acceptance_criteria>
  <done>49-02-SUMMARY.md exists with all required sections populated; verdict is concrete; no placeholders remain; commit landed.</done>
</task>

</tasks>

<verification>
After all tasks complete:
- `pnpm -C frontend build` exits 0.
- `node frontend/scripts/assert-size-limit-matches.mjs` exits 0.
- `pnpm -C frontend size-limit` exits 0 — Initial JS ≤ 450 KB gz, Total JS ≤ 1.8 MB gz (or escalated value), all sub-vendor ceilings respected.
- `ls frontend/dist/assets/{heroui,sentry,dnd}-vendor-*.js | wc -l` returns ≥3.
- `jq '. | length' frontend/.size-limit.json` returns 9 (or 10/11 if optional sub-vendors added).
- `grep -c "'HeroUI vendor', 1\|'Sentry vendor', 1\|'DnD vendor', 1" frontend/scripts/assert-size-limit-matches.mjs` returns 3.
- `frontend/docs/bundle-budget.md` has rows for every chunk >100 KB gz (Initial / React / TanStack / Total / HeroUI / Sentry / DnD at minimum).
- Existing unit + lint + type-check still green on the touched files.
- `git diff phase-49-base..HEAD -- 'frontend/src' | grep -E '^\+.*(@ts-(ignore|expect-error)|eslint-disable|\bas any)' | grep -vE '^\+\+\+' | wc -l` returns 0.
- Plan 03 unblocked: it adds `Bundle Size Check (size-limit)` to `main` branch protection and runs two smoke PRs to prove the gate BLOCKS.
</verification>

<success_criteria>

- BUNDLE-02: Initial route loads under the new BUNDLE-01 budget (`pnpm -C frontend size-limit` exits 0); heavy chunks route-split via `React.lazy()` based on the Plan-01 audit. E2E suite still green or deferral documented per Phase 40-23 precedent.
- BUNDLE-04: Vendor super-chunk audited and decomposed; every chunk >100 KB gz has documented rationale in `frontend/docs/bundle-budget.md`.
- D-07: All three required sub-vendor branches landed (heroui/sentry/dnd); optional branches (tiptap/exceljs) per audit verdict.
- D-08: Residual vendor chunk either <100 KB gz (note-only) or fully documented in bundle-budget.md "Residual vendor chunk" table.
- D-13: Suspense fallback styling is token-only — `<GlobeSpinner />` for route-level; `fallback={null}` for guarded modals; inline `<GlobeSpinner size="sm" />` in a `border: 1px solid var(--line)` box for always-mounted. No raw hex, no `text-blue-*`, no card shadows.
- D-14: Zero net-new suppressions / ceiling raises in Plan 02 diff.
- Karpathy §3: Surgical changes only — `manualChunks` arrow gets 3 (or 5) new branches; existing branches untouched; `assert-size-limit-matches.mjs` gets Map additions only; lazy() conversions touch only consumer + (optionally) component-side `export default` shim.

</success_criteria>

<output>
After completion, create `.planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md` recording:
- The three sub-vendor measurements (gz size + locked ceiling per chunk).
- Whether optional tiptap-vendor / exceljs-vendor were added (audit verdict + final decision).
- List of components converted to React.lazy() — name, file path, measured gz, fallback shape used (1-4).
- Pre/post `pnpm -C frontend size-limit` output (the moment the ceiling becomes real).
- Residual vendor chunk size + D-08 disposition (note vs. full table).
- Any E2E test:e2e deferral with reason (per Phase 40-23 precedent).
- Any visual baseline files that may need re-capture (RESEARCH Pitfall 5).
- Plan 02 close-out verdict and explicit handoff: "Plan 03 may now start; the size-limit gate is locally green and ready to be flipped to PR-blocking."
</output>
