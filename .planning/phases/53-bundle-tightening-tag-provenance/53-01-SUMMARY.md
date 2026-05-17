---
phase: 53-bundle-tightening-tag-provenance
plan: 01
status: PASS
verdict: PASS
requirements:
  - BUNDLE-05
deviations: []
files_modified:
  - frontend/.size-limit.json
  - frontend/docs/bundle-budget.md
commits:
  - 988e5f6b
  - <task-3-commit>
key-files:
  created: []
  modified:
    - frontend/.size-limit.json
    - frontend/docs/bundle-budget.md
---

# Plan 53-01 Summary — Lower React vendor ceiling

## Verdict

**PASS** — React vendor ceiling tightened from `349 KB` → `285 KB` per Phase 49 D-03 `min(current, measured + 5 KB)`. `pnpm size-limit` exits 0; `assert-size-limit-matches.mjs` exits 0; living rationale doc updated to match.

## What Was Built

1. **Fresh ANALYZE measurement** of `react-vendor-*.js` on `DesignV2` (effectively phase-53-base — post-tunnel-rat-removal, post-Phase-52 close):
   - `ANALYZE=true pnpm -C frontend build` exit 0, completed in 21.15s
   - `dist/assets/react-vendor-BB5ReC7X.js` exists (930,631 raw bytes)
   - `gzip -c | wc -c` → 279,364 bytes
   - `pnpm -C frontend size-limit --json` → `size: 279423` bytes (the canonical value the gate compares against; matches direct gzip within ~60 bytes)
   - **Measured gz: 279.42 kB** (decimal kB per size-limit convention)

2. **Ceiling lowered** in `frontend/.size-limit.json`:
   - `"React vendor"` entry `"limit"` field: `"349 KB"` → `"285 KB"`
   - Computation: `ceil(279.42 + 5) = 285 KB`
   - No other entry modified (8 other rows untouched: Initial JS, TanStack vendor, HeroUI vendor, Sentry vendor, DnD vendor, Total JS, signature-visuals/d3-geospatial, signature-visuals/static-primitives)

3. **Living rationale doc updated** in `frontend/docs/bundle-budget.md`:
   - React vendor row **replaced** (not appended) with fresh measurement + Phase 53 D-03 rationale + `2026-05-16` audit date
   - Rationale prose now reads: "Phase 53 applied Phase 49 D-03 verbatim (`min(current, measured + 5 kB)`) after Phase 49 deferred the lowering to keep its Plan-02 diff surgical. Headroom 5 kB ≈ 1.8% slack absorbs React minor-version drift..."
   - No other ceilings row touched; no residual-vendor row touched; top `Last audited:` field (line 3) preserved per Karpathy §3
   - No `Audit artifact:` reference added (D-04: inline row update is canonical evidence; no `53-BUNDLE-AUDIT.md` artifact)

## Measurement Reconciliation Note

The plan's Task 2 automated verify gate `if (v >= 349 || v < 280) exit 1` was hand-crafted against the documented 279.92 kB baseline. The fresh measurement of 279.42 kB is within ~0.5 kB of that baseline, so the computed 285 KB ceiling falls comfortably inside the verify range `[280, 348]`. No deviation logged — fresh measurement effectively matches Phase 49 close-out within noise floor.

Brief mid-task confusion between KiB (×1024) and kB (×1000) conventions: size-limit's `limit` field uses decimal kB (bytes/1000), which matches the rollup CLI print and the docs. Direct `gzip -c | wc -c | bc /1024` gave 272.87 KiB which momentarily looked like a different chunk; reconciled by confirming size-limit's internal accounting via `--json` then via the CLI human print (`279.42 kB`).

## Before / After

### `frontend/.size-limit.json` (React vendor entry only)

```diff
   {
     "name": "React vendor",
     "path": "dist/assets/react-vendor-*.js",
-    "limit": "349 KB",
+    "limit": "285 KB",
     "gzip": true,
     "running": false
   },
```

### `frontend/docs/bundle-budget.md` (Ceilings table, React vendor row only)

```diff
-| React vendor         | 279.92 kB | 349 kB  | react + react-dom + scheduler. Plan 02 ordering fix unblocked tree-shaking: react-vendor dropped from 347.13 kB → 279.92 kB after `@heroui` / `@sentry` / `@dnd-kit` / `@radix-ui` / `@tanstack` paths stopped leaking through the `id.includes('react')` rule. Ceiling held at 349 kB per D-03 `min(current, measured + 5 kB)`; not lowered to keep the Plan-02 diff surgical. | 2026-05-12   |
+| React vendor         | 279.42 kB | 285 kB  | react + react-dom + scheduler. Phase 53 applied Phase 49 D-03 verbatim (`min(current, measured + 5 kB)`) after Phase 49 deferred the lowering to keep its Plan-02 diff surgical. Headroom 5 kB ≈ 1.8% slack absorbs React minor-version drift; a tighter ceiling (e.g. 284 kB) would trip on legitimate minor upgrades. | 2026-05-16   |
```

## Verification Evidence

```
$ pnpm -C frontend size-limit
  React vendor
  Size limit:   285 kB
  Size:         279.42 kB gzipped
  Loading time: 5.5 s     on slow 3G
  [... 8 other rows all passing ...]
Exit 0

$ node frontend/scripts/assert-size-limit-matches.mjs
Initial JS (entry point): 1 file(s)
React vendor: 1 file(s)
TanStack vendor: 1 file(s)
HeroUI vendor: 1 file(s)
Sentry vendor: 1 file(s)
DnD vendor: 1 file(s)
Total JS: 287 file(s)
signature-visuals/d3-geospatial: 1 file(s)
signature-visuals/static-primitives: 1 file(s)
Exit 0
```

## No Other Rows / Entries Touched

- `frontend/.size-limit.json`: 1-line diff, React vendor `limit` only (verified via `git diff --stat`)
- `frontend/docs/bundle-budget.md`: 1-row diff, React vendor row only (verified via `git diff`)
- 8 other ceilings rows preserved verbatim: Initial JS, TanStack vendor, HeroUI vendor, Sentry vendor, DnD vendor, Total JS, signature-visuals/d3-geospatial, signature-visuals/static-primitives
- Residual vendor chunk table preserved verbatim (7 rows: exceljs, dotted-map, @tiptap, proj4, date-fns, css-utils, @floating-ui)
- Top `Last audited:` field (line 3) and `Audit artifact:` reference (line 4) preserved per Karpathy §3 (those refer to the full per-chunk re-audit; the per-row "Last audited" column carries the Phase 53 date)

## Self-Check: PASSED

- [x] All 3 tasks executed
- [x] Each task committed individually (Task 2 commit `988e5f6b`; Task 3 in next commit)
- [x] `pnpm -C frontend size-limit` exit 0 on new ceiling
- [x] `node frontend/scripts/assert-size-limit-matches.mjs` exit 0
- [x] Scope: 1 field in `.size-limit.json` + 1 row in `bundle-budget.md` (Karpathy §3 Surgical)
- [x] BUNDLE-05 must-haves all satisfied
