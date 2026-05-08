---
phase: 44-documentation-toolchain-anti-patterns
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/vite.config.ts
  - frontend/.size-limit.json
  - frontend/scripts/assert-size-limit-matches.mjs
  - .github/workflows/ci.yml
autonomous: true
requirements: [TOOL-01, TOOL-02, TOOL-03]
tags: [frontend, ci, size-limit]
must_haves:
  truths:
    - 'D-14: restore truthful size-limit measurement and CI enforcement without forcing the historic 815 KB total target'
    - 'D-15: 815 KB remains aspirational documentation, not the Phase 44 merge gate'
    - 'D-16: size-limit targets stable chunk names, not stale hashed filenames'
    - 'D-17: use pnpm -C frontend build and pnpm -C frontend size-limit unless package selectors are corrected'
    - 'D-18: verification proves configured entries match real files and a >= 1 KB measured increase fails'
  artifacts:
    - path: frontend/.size-limit.json
      provides: current-output bundle budgets with small headroom
    - path: frontend/scripts/assert-size-limit-matches.mjs
      provides: deterministic no-zero-file-match guard
---

<objective>
Repair the frontend bundle-size gate so local and CI size-limit checks measure
real Vite output and fail on future regressions.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Add stable chunk names for signature visuals and d3 assets</name>
  <files>frontend/vite.config.ts</files>
  <read_first>
    - frontend/vite.config.ts
    - frontend/.size-limit.json
    - .planning/phases/44-documentation-toolchain-anti-patterns/44-PATTERNS.md
  </read_first>
  <action>
Update `manualChunks` in `frontend/vite.config.ts` with concrete cases:

1. Before the existing `recharts` / `d3-` charts bucket, return
   `signature-visuals-d3` for IDs containing `d3-geo`, `topojson-client`, or
   `world-atlas`.
2. Outside the `node_modules` block, return `signature-visuals` for IDs
   containing `/src/components/signature-visuals/`.
3. Keep existing `chunkFileNames: 'assets/[name]-[hash].js'`.

Do not change route code-splitting or remove existing vendor bucket names.
</action>
<verify>
<automated>grep -q "signature-visuals-d3" frontend/vite.config.ts && grep -q "signature-visuals" frontend/vite.config.ts</automated>
</verify>
<acceptance_criteria> - `frontend/vite.config.ts` contains the string `signature-visuals-d3` - `frontend/vite.config.ts` contains a local source check for `/src/components/signature-visuals/` - Existing `react-vendor` and `tanstack-vendor` chunk names remain present
</acceptance_criteria>
</task>

<task type="auto">
  <name>Task 2: Replace stale size-limit globs with measured current-output budgets</name>
  <files>frontend/.size-limit.json, frontend/scripts/assert-size-limit-matches.mjs</files>
  <read_first>
    - frontend/.size-limit.json
    - frontend/package.json
    - frontend/vite.config.ts
  </read_first>
  <action>
Run `pnpm -C frontend build`. Inspect `frontend/dist/assets/*.js` and update
`frontend/.size-limit.json` so every entry's `path` matches at least one real
built file.

Expected stable paths after Task 1:

- `dist/assets/index-*.js`
- `dist/assets/react-vendor-*.js`
- `dist/assets/tanstack-vendor-*.js`
- `dist/assets/signature-visuals-d3-*.js`
- `dist/assets/signature-visuals-*.js`
- `dist/assets/*.js` for Total JS

Set enforced `limit` values from current gzip measurements plus small explicit
headroom. Use concrete KB values in the JSON. Do not keep `Total JS` at `815 KB`
unless the current measured output actually fits. Record the old 815 KB target
as aspirational in docs during Plan 02, not here.

Create `frontend/scripts/assert-size-limit-matches.mjs`. It must:

- read `frontend/.size-limit.json`
- expand each `path` against `frontend/dist`
- print one line per entry: `<name>: <count> file(s)`
- exit 1 if any entry matches zero files

Use Node standard library only; do not add dependencies.
</action>
<verify>
<automated>pnpm -C frontend build && node frontend/scripts/assert-size-limit-matches.mjs && pnpm -C frontend size-limit</automated>
</verify>
<acceptance_criteria> - `node frontend/scripts/assert-size-limit-matches.mjs` exits 0 after build - No `.size-limit.json` path contains `*d3-geo*.js` - No `.size-limit.json` path measures zero files after build - `pnpm -C frontend size-limit` exits 0
</acceptance_criteria>
</task>

<task type="auto">
  <name>Task 3: Wire CI to the repaired signal and prove regression failure</name>
  <files>.github/workflows/ci.yml, .planning/phases/44-documentation-toolchain-anti-patterns/44-size-limit-regression-proof.md</files>
  <read_first>
    - .github/workflows/ci.yml
    - frontend/package.json
    - frontend/scripts/assert-size-limit-matches.mjs
  </read_first>
  <action>
Update `.github/workflows/ci.yml` `bundle-size-check` so it:

1. Installs dependencies.
2. Runs `pnpm -C frontend build` from the repo root or equivalent
   `working-directory: ./frontend` `pnpm build`.
3. Runs `node frontend/scripts/assert-size-limit-matches.mjs` from the repo root.
4. Runs `pnpm -C frontend size-limit` from the repo root or equivalent
   `working-directory: ./frontend` `pnpm size-limit`.

Then prove the negative path locally:

1. Add a temporary string payload of at least 1 KB to a measured entry chunk
   source such as `frontend/src/main.tsx` or a known signature-visual source.
2. Run `pnpm -C frontend build`.
3. Run `node frontend/scripts/assert-size-limit-matches.mjs`.
4. Run `pnpm -C frontend size-limit` and confirm non-zero exit.
5. Revert only the temporary payload.
6. Re-run build, match assertion, and size-limit; all must pass.

Write `.planning/phases/44-documentation-toolchain-anti-patterns/44-size-limit-regression-proof.md`
with the passing command output summary and the failing perturbation summary.
</action>
<verify>
<automated>grep -q "assert-size-limit-matches.mjs" .github/workflows/ci.yml && test -f .planning/phases/44-documentation-toolchain-anti-patterns/44-size-limit-regression-proof.md</automated>
</verify>
<acceptance_criteria> - CI contains `assert-size-limit-matches.mjs` - CI still has a `bundle-size-check` job - Regression proof file contains `PASS: pnpm -C frontend size-limit` - Regression proof file contains `FAIL: intentional >= 1 KB increase`
</acceptance_criteria>
</task>

</tasks>

<threat_model>
| Threat ID | Category | Component | Mitigation |
|-----------|----------|-----------|------------|
| T-44-03 | Spoofing | size-limit config | Add zero-match guard before size-limit |
| T-44-04 | Tampering | CI gate | Keep one CI job using same local commands and fail on non-zero size-limit |
| T-44-05 | Repudiation | Regression proof | Record both positive and negative command summaries in a planning artifact |
</threat_model>

<verification>
1. `pnpm -C frontend build`
2. `node frontend/scripts/assert-size-limit-matches.mjs`
3. `pnpm -C frontend size-limit`
4. Temporary >= 1 KB measured-chunk increase fails, then restored pass succeeds.
</verification>

<success_criteria>

- Every size-limit entry matches current Vite output.
- Local size-limit exits 0 after repair.
- CI runs the same build, match, and size-limit checks.
- A measured >= 1 KB increase is proven to fail.
  </success_criteria>
