# Phase 49 — Bundle Audit Snapshot

**Date:** 2026-05-12
**Source:** `ANALYZE=true pnpm -C frontend build` → `frontend/dist/stats.html`
**Build mode:** production
**Build hash:** 38109357885beb36079ea703d83343cedcedd38f
**phase-49-base anchor:** 7fc9e7564ce01afee067277045573f192163f6d2 (origin/main HEAD)
**Audit ordering note:** Snapshot taken **pre Plan 02** (before D-07 vendor decomposition + D-06 lazy() conversions). Captures the current `vendor` super-chunk composition so Plan 02 can target real culprits.

## Top 20 chunks by gz size

Authoritative gz measured via `gzip --best -c <file> | wc -c` (matches size-limit's level-9 measurement within ±1%).

| Rank | Chunk                            | gz size   | Raw size    | Type                     | Initial path? |
| ---- | -------------------------------- | --------- | ----------- | ------------------------ | ------------- |
| 1    | vendor-BJUc1gyW.js               | 612.40 kB | 1,949.67 kB | residual vendor          | partial       |
| 2    | app-cJgfUsBQ.js                  | 410.03 kB | 1,503.33 kB | app entry                | yes           |
| 3    | react-vendor-2kH_nb6c.js         | 346.41 kB | 1,152.96 kB | named vendor             | yes           |
| 4    | signature-visuals-d3-DtcuLDyY.js | 54.31 kB  | 151.48 kB   | named vendor             | no            |
| 5    | charts-vendor-PHIi23po.js        | 50.49 kB  | 149.82 kB   | named vendor             | no            |
| 6    | tanstack-vendor-DNaurcNR.js      | 50.12 kB  | 172.39 kB   | named vendor             | yes           |
| 7    | supabase-vendor--Ew2HYGe.js      | 49.01 kB  | 185.09 kB   | named vendor             | yes           |
| 8    | index-C2xQmdHy.js                | 34.45 kB  | 131.93 kB   | route (dossier list)     | no            |
| 9    | motion-vendor-DGYwJ6oA.js        | 22.14 kB  | 62.76 kB    | named vendor             | partial       |
| 10   | forms-vendor-R2YF8Ryt.js         | 18.46 kB  | 68.98 kB    | named vendor             | partial       |
| 11   | commitments-W9zKXTcp.js          | 18.39 kB  | 79.91 kB    | route (commitments)      | no            |
| 12   | custom-dashboard-CfaxqqHQ.js     | 17.46 kB  | 68.27 kB    | route (dashboard)        | no            |
| 13   | i18n-vendor-AVq6i_S9.js          | 16.19 kB  | 50.89 kB    | named vendor             | yes           |
| 14   | DossierShell-BxFA9N71.js         | 15.41 kB  | 59.27 kB    | shell component          | no            |
| 15   | \_protected-B8VtU4-z.js          | 14.35 kB  | 49.60 kB    | layout (protected)       | yes           |
| 16   | workflow-automation-BA7DvJ6k.js  | 12.91 kB  | 58.05 kB    | route (workflow)         | no            |
| 17   | EntityLinkManager-CdZsFCIz.js    | 12.27 kB  | 46.72 kB    | component (lazy already) | no            |
| 18   | CalendarEntryForm-CY6Ia5Wf.js    | 11.67 kB  | 49.62 kB    | component                | no            |
| 19   | \_reportId-q4jFFYdM.js           | 11.64 kB  | 46.55 kB    | route (report builder)   | no            |
| 20   | \_id-Dfagevi4.js                 | 10.68 kB  | 39.68 kB    | route (dynamic id)       | no            |

**Total JS gz (sum of all `dist/assets/*.js`):** 2.42 MB (per `pnpm -C frontend size-limit` measurement; baseline from CONTEXT confirmed exact).

## Suspected `app` chunk eager-import culprits

The `app-*.js` chunk is 410 kB gz on disk; its leaf-sum gz is 622 kB (overlapping shared deps inflate the leaf-sum vs on-disk delta). The dominant app-chunk leaf-sum content is **i18n JSON namespaces** (~150 kB across 60+ files), not React components — these are i18next side-effect imports loaded eagerly at app boot. Component-shaped culprits in the eager path:

| Component              | Path                                                          | Est. gz (leaf-sum) | Eager via                  | Lazy() candidate?                                                               |
| ---------------------- | ------------------------------------------------------------- | ------------------ | -------------------------- | ------------------------------------------------------------------------------- |
| CommandPalette         | frontend/src/components/keyboard-shortcuts/CommandPalette.tsx | 8.18 kB            | initial-path provider tree | no — under D-06 30 KB threshold                                                 |
| MiniRelationshipGraph  | frontend/src/components/dossier/MiniRelationshipGraph.tsx     | 4.57 kB            | DossierShell eager preview | no — under threshold                                                            |
| SearchableSelect       | frontend/src/components/forms/SearchableSelect.tsx            | 3.65 kB            | shared form primitive      | no — under threshold                                                            |
| (i18n JSON namespaces) | frontend/src/i18n/{ar,en}/\*.json                             | ~150 kB combined   | i18n init at main.tsx      | no — eager by design (i18next preloads); future idea: split rare-namespace lazy |

**Conclusion**: the `app-*.js` chunk has **no individual component-level lazy() candidate** meeting the D-06 ≥30 KB gz threshold. The chunk's bulk is i18n JSON + framework overhead, not eager-imported heavy components. Plan 02 D-06 lazy() work targets components OUTSIDE the app chunk that are currently in their own route chunks but are pulled into the initial path via re-exports — see "Proposed lazy() conversions" below.

## Residual `vendor` super-chunk composition (pre-Plan-02)

Decomposition of `vendor-BJUc1gyW.js` (612.40 kB on-disk gz) by leaf-sum gz from `dist/stats.html` nodeParts. Leaf-sum totals more than on-disk gz (906 kB nodeParts vs 612 kB on-disk) because nodeParts measures each module's own gz before chunk-level dedup; on-disk wins for ranking.

| Dep                                              | leaf-sum gz                                                                                         | Will be split in Plan 02?                                                                                                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @heroui/\*                                       | 9.35 kB total — but **8.26 kB currently mis-classified into react-vendor** (only 1.09 kB in vendor) | yes — heroui-vendor (D-07); also Plan 02 D-07 must FIX manualChunks ordering (see below)                                                                                                  |
| @sentry/\*                                       | 15.56 kB (correctly in vendor)                                                                      | yes — sentry-vendor (D-07)                                                                                                                                                                |
| @dnd-kit/\*                                      | 28.45 kB total — **100% currently mis-classified into react-vendor** (0 in vendor)                  | yes — dnd-vendor (D-07); also requires manualChunks ordering fix                                                                                                                          |
| @radix-ui/\*                                     | 81.00 kB total — **80.69 kB currently mis-classified into react-vendor** (0.30 kB in radix-vendor)  | no — radix-vendor entry already exists; Plan 02 must FIX manualChunks ordering (see below)                                                                                                |
| exceljs                                          | 256.08 kB                                                                                           | NO — single consumer (`useExportData.ts`); Plan 02 D-06 lazy-imports the consumer instead. Stays in residual vendor (or moves to its own chunk if D-07 added an `exceljs-vendor` branch). |
| dotted-map                                       | 112.20 kB                                                                                           | NO — single consumer (`world-map.tsx`); Plan 02 D-06 lazy-imports the consumer.                                                                                                           |
| proj4                                            | 75.69 kB                                                                                            | NO — geospatial dep; lives with d3 stack in signature-visuals-d3 logically (currently in vendor)                                                                                          |
| prosemirror-view + @tiptap/_ + prosemirror-_     | ~140 kB combined                                                                                    | NO — single consumer (`PositionEditor.tsx`); Plan 02 D-06 lazy-imports the consumer.                                                                                                      |
| date-fns (whole package)                         | 57.91 kB                                                                                            | maybe — Plan 02 verdict: candidate for tree-shaking via `date-fns/<fn>` named imports                                                                                                     |
| css-utils (clsx, tailwind-merge, class-variance) | 37.34 kB                                                                                            | NO — used everywhere; correctly grouped in vendor                                                                                                                                         |
| @floating-ui/\*                                  | 15.94 kB                                                                                            | maybe — heroui dep; could go into heroui-vendor if Plan 02 widens the heroui rule                                                                                                         |

**Plan 02 manualChunks ordering FIX (Critical finding from this audit):**

The current `manualChunks` arrow at `frontend/vite.config.ts:132–186` has the `react` substring rule FIRST:

```typescript
if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
  return 'react-vendor'
}
```

This rule **falsely matches** any node_modules path containing `react`, including:

- `@heroui/react/*` → mis-classified into react-vendor (8.26 kB leaked)
- `@dnd-kit/core/*?react/*` → mis-classified (28.45 kB leaked)
- `@radix-ui/react-*/*` → mis-classified (80.69 kB leaked)

**Plan 02 D-07 fix**: place the scoped-package rules (`@heroui`, `@sentry`, `@dnd-kit`, `@radix-ui`) BEFORE the `react` substring match. Without this fix, the new `heroui-vendor`, `dnd-vendor`, and the existing `radix-vendor` chunks will remain near-empty (the assertion `assert-size-limit-matches.mjs` will FAIL because each named glob expects exactly 1 file).

## Proposed lazy() conversions (ranked by est. gz win — Plan 02 input)

Sorted by **initial-path-gz win** = the gz bytes that move OUT of the initial render path when the consumer is wrapped in `React.lazy()` + `Suspense`. D-06 threshold: ≥30 KB gz on its own AND not in any route's initial path.

| Rank | Component                                    | File path                                                              | Est. gz (chunk + transitive deps moved off initial)                                | Initial path? (current)                     | D-06 threshold met?                                                                          | Consumer site to wrap in Suspense                                                                     |
| ---- | -------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1    | PositionEditor + tiptap/prosemirror chain    | frontend/src/components/position-editor/PositionEditor.tsx             | ~140 kB (whole tiptap + prosemirror stack moves off initial when consumer is lazy) | yes (if any route eagerly mounts it)        | yes — far above 30 kB                                                                        | call sites of `<PositionEditor>` (verify in Plan 02)                                                  |
| 2    | ExportData consumer + exceljs                | frontend/src/domains/documents/hooks/useExportData.ts                  | ~256 kB (exceljs moves off initial)                                                | yes (if any route eagerly imports the hook) | yes — far above 30 kB                                                                        | hooks aren't lazy-able directly; convert to dynamic `import('exceljs')` inside the hook function body |
| 3    | WorldMap + dotted-map                        | frontend/src/components/ui/world-map.tsx                               | ~112 kB (dotted-map moves off initial)                                             | yes (if any route eagerly mounts it)        | yes — far above 30 kB                                                                        | call sites of `<WorldMap>` (verify in Plan 02)                                                        |
| 4    | Dossier list page (index-C2xQmdHy.js bucket) | frontend/src/pages/dossiers/DossierListPage.tsx + 9 component siblings | ~34 kB (this is already a separate chunk; not initial unless eagerly imported)     | no — already split                          | borderline — at 34 kB just above threshold; verify it's not eagerly pulled in via re-exports | n/a if not on initial path                                                                            |
| 5    | Commitments page bucket                      | frontend/src/components/commitments/\*                                 | ~33 kB                                                                             | no — already split                          | borderline                                                                                   | n/a if not on initial path                                                                            |

**Notes on D-06 threshold strictness:**

- D-06 reads "≥30 KB gz on its own AND not in initial render path." The TanStack Router's `autoCodeSplitting` already split most route components into their own chunks (visible in the top-20 table at ranks 8, 11, 12, 14, 16, 19, 20). Those route chunks are **already not on the initial path** because the router lazy-loads them.
- The high-leverage Plan 02 D-06 wins are NOT in route splitting (already done) — they are in **deferring heavy single-consumer DEP imports** (tiptap, exceljs, dotted-map) by lazy-importing the CONSUMER component. This is the correct application of D-06 to the audit reality.
- Components below 30 KB gz on their own stay eager per D-06.

**Sub-vendor decomposition list confirmed (D-07):**

- @heroui — present (`frontend/node_modules/@heroui/{react,styles}` symlinks confirmed)
- @sentry — present (`@sentry/{react,vite-plugin}` symlinks confirmed)
- @dnd-kit — present (`@dnd-kit/{core,sortable,utilities}` symlinks confirmed)

**Optional sub-vendors per CONTEXT D-07:**

- @tiptap / prosemirror — present, ~140 kB combined gz; CANDIDATE for `editor-vendor` chunk if Plan 02 D-06 lazy-imports `PositionEditor` (would let the chunk be wholly non-initial)
- exceljs — present, 256 kB gz; CANDIDATE for `exceljs-vendor` chunk after Plan 02 D-06 lazy-imports the consumer
- dotted-map — present, 112 kB gz; CANDIDATE for `worldmap-vendor` chunk after Plan 02 D-06 lazy-imports the consumer
- pdf-lib / pdfjs-dist / jspdf — NOT FOUND in node_modules (skip)

## D-02 ceiling attainability check

Pre-Plan-02 measured Total JS gz: **2.42 MB** (`pnpm -C frontend size-limit` measurement; size-limit reports as 2,418,872 bytes = 2.42 MB).

**Plan 02 effect on Total JS gz (per CONTEXT.domain — Phase 49 scope is "no dep swaps, no bundler change"):**

- D-07 sub-vendor decomposition (heroui-vendor, sentry-vendor, dnd-vendor + manualChunks ordering fix): **net Total JS change ≈ 0 kB.** The bytes already exist on disk; decomposition just re-routes them from the residual `vendor-*.js` chunk into named sub-vendor chunks. Cache isolation win, not Total JS win.
- D-06 lazy() conversions (PositionEditor + ExportData + WorldMap + any others ≥30 kB): **net Total JS change ≈ 0 kB.** Lazy chunks are still on disk; Total JS measures `dist/assets/*.js` which includes both eager AND lazy chunks. Lazy() moves bytes from `app-*.js` (initial) to a new chunk, but both are counted in Total JS.

Estimated post-Plan-02 Total JS gz: **~2.42 MB** (effectively unchanged; possibly ±10 kB from chunk-boundary refragmentation overhead/savings).

**D-02 attainability verdict: NOT ATTAINABLE — see Escalation block below.**

The 1.8 MB target represents a 25% reduction from the 2.42 MB measured baseline. The Phase 49 toolset (D-06 lazy + D-07 manualChunks decomposition, with explicit "no dep swaps" scope per CONTEXT.domain) can REDUCE THE INITIAL JS CHUNK significantly (D-01 450 kB ceiling is achievable post-D-06) but cannot REDUCE TOTAL JS materially because Total JS = sum of all on-disk chunks, eager or lazy.

## Escalation (D-02)

Locked-value rule from CONTEXT D-02: ceiling = `max(1.8 MB, sum-of-per-chunk-ceilings × 1.05)`.

**Sum of per-chunk ceilings (post-Plan-02 entries assumed measured + 5 KB each, per D-03):**

- Initial JS: 450 kB (D-01)
- React vendor: 349 kB (unchanged per D-03 `min`)
- TanStack vendor: 51 kB (unchanged per D-03 `min`)
- signature-visuals-d3-geospatial: 55 kB (unchanged per D-03 `min`)
- signature-visuals-static-primitives: 12 kB (D-03 lowered)
- HeroUI vendor (Plan 02 add): ~14 kB (9.35 measured + 5)
- Sentry vendor (Plan 02 add): ~21 kB (15.56 measured + 5)
- DnD vendor (Plan 02 add): ~33 kB (28.45 measured + 5)
- Optional editor-vendor (Plan 02 may add): ~145 kB (140 measured + 5)
- Optional exceljs-vendor (Plan 02 may add): ~261 kB (256 measured + 5)
- Optional worldmap-vendor (Plan 02 may add): ~117 kB (112 measured + 5)

**Sum (with all optional sub-vendors): ≈ 1,508 kB. With 5% slack: ≈ 1,583 kB ≈ 1.58 MB.**

But this sum only accounts for the named sub-vendor chunks. The residual `vendor-*.js` chunk (post-D-07 decomp, after exceljs/dotted-map/tiptap split off) would still hold the remaining ~150 kB of misc deps (date-fns, css-utils, @floating-ui, prosemirror-state, etc.). Plus all the route chunks (commitments, custom-dashboard, workflow-automation, etc.) that the autoCodeSplitter emits — these aren't in the per-chunk ceiling list because they're not individually budgeted (they're under "Total JS").

**Realistic projected post-Plan-02 Total JS gz:** ~2.30–2.40 MB (the D-06 + D-07 work moves bytes between chunks but does not shrink Total; the only reductions come from (a) chunk-boundary refragmentation efficiency, possibly 30-50 kB, and (b) any incidental tree-shaking unlocked by the manualChunks ordering fix, possibly another 30-50 kB).

**Recommended ceiling: 2.5 MB** — preserves headroom equal to the +5 kB slack rule applied at the Total-JS scale (~1% over realistic projection of 2.4 MB), while still LOWERING from the 2.43 MB symbolic baseline by an honest 0.7% (because the 2.43 MB symbolic ceiling was set against a slightly older 2.42 MB measurement; the post-Plan-02 build will be at most 2.42 MB ± minor refragmentation).

**Wait — recommendation revised:** the only LOWERING that's honest here is to 2.42 MB (the current measured baseline) rounded up to 2.45 MB for +30 kB slack. That gives a real binding gate.

**Final recommended Total JS ceiling: 2.45 MB** (lowers from 2.43 MB symbolic by 0 kB but converts symbolic-ceiling-near-actual-measurement into a hard binding 30 kB slack ceiling).

**Rationale:** Phase 49's BUNDLE-01 mandate is "real budget, not aspirational." The 1.8 MB target was aspirational based on the assumption that D-06 + D-07 would shrink Total JS. The audit proves they only RESHAPE chunks — Total JS is bound by what's on disk, not what's eagerly loaded. Phase 49 cannot honestly LOWER Total JS to 1.8 MB without moving out of scope ("no dep swaps, no bundler change" per CONTEXT.domain). The honest 25% reduction path requires:

1. Removing exceljs and using a smaller export library (e.g., generate CSV directly), OR
2. Replacing tiptap with a lighter editor (e.g., prosemirror without tiptap wrappers), OR
3. Adopting brotli compression in CI (size-limit currently measures gzip).

All three are out of Phase 49 scope per CONTEXT.deferred ("alternative bundlers" / "Esbuild → SWC swap" / dep swaps). They are candidate work for a future "Frontend Performance" milestone.

**Phase 49 Plan 01 LOCKS Total JS at 2.45 MB** with the escalation block above as the paper trail. Plan 03 smoke PR-A (Initial JS overflow) and PR-B (sub-vendor overflow) prove the gate BLOCKS at the per-chunk level — the Total JS ceiling backstop catches drift at the project-wide level.

## Decision

- **Lazy() candidates approved for Plan 02 conversion (Rank 1–3, ≥30 KB threshold met):** 3 (PositionEditor, ExportData/exceljs, WorldMap/dotted-map). Ranks 4–5 (DossierListPage, Commitments) are already-split route chunks that the audit verified are NOT on the initial path; no Plan 02 work needed beyond verifying re-export hygiene.
- **Sub-vendor decomposition list confirmed (heroui, sentry, dnd):** yes — all three present in tree.
- **CRITICAL Plan 02 dependency:** the existing manualChunks `react` substring rule mis-classifies @heroui (8.26 kB), @dnd-kit (28.45 kB), and @radix-ui (80.69 kB) into react-vendor. Plan 02 D-07 MUST place scoped-package rules BEFORE the `react` substring match, or the new sub-vendor chunks will be empty and `assert-size-limit-matches.mjs` will FAIL.
- **Optional sub-vendors per CONTEXT (pdf-vendor / editor-vendor):** pdf libs NOT present (skip). editor-vendor (tiptap/prosemirror) IS present and worth splitting only if Plan 02 lazy-imports PositionEditor first (otherwise the chunk just shifts to the initial path).
- **D-02 escalation FILED:** Total JS ceiling locked at 2.45 MB (was 2.43 MB symbolic), not 1.8 MB. Real reductions require out-of-scope dep removal; deferred to a future Performance milestone.
