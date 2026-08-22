# P99-42 summary

The binding-census proof instrument now implements first-defined lookup per locale over the resource graph wired by `frontend/src/i18n/index.ts`. Static namespace arrays retain order. For en and ar independently, the first namespace whose real JSON bundle defines the complete key path wins; a scalar or object stops lookup, and object definitions are recorded as object returns. Divergent locale outcomes are emitted with both locale resolutions rather than collapsed.

Implementation commit: `e744e09ad` (`fix(i18n): make binding census resource aware`).

## Resolution controls

`node scripts/i18n-binding-census.mjs "$PWD" --self-check --json` exits 0 with `positives=9` and exactly seven unique `passed:true` controls:

- `later-common`: an absent earlier path reaches the later common resource.
- `scalar-shadow`: real `sla.common.actions` scalars in both locale bundles stop the later lookup.
- `object-shadow`: a planted earlier object stops resolution and is marked object-return.
- `locale-divergent`: the en outcome stops in the planted earlier bundle while ar reaches the real common bundle, and both outcomes are retained.
- `dynamic-array`, `property-access`, and `non-literal`: each syntax is excluded from resolved partitions and present in its named blind population.

The first positive also proves that `translation:common.loading` resolves from an otherwise invisible `t` binding because the explicit key prefix takes precedence. The production resolver contains no order-blind namespace-membership test.

## Fixed-base evidence

Universe source: `4cdfdf28725f4c48d00ccb6f7aec2084f032d6cb`.

The checker copied into an isolated detached worktree at that revision exits with findings status 1 and complete JSON:

- `scannedFiles=1716`, `literalKeyCalls=8598`, `nonLiteralKeyCalls=725`.
- Governed union `213/102`, partitioned exactly as `79/52 commonColonResolved + 5/2 translationColonExplicit + 125/48 dotForm + 4/2 nsOption`.
- Full `common:common.*` class `100/59`, split `79/52` resolved + `21/14` outside.
- Blind dynamic namespace `276/27` = `236/25` literal-key + `40/16` non-literal-key; non-literal key `725/295`; property access `0/0`; blind union `961/303`.
- `unrepointed=213`, `doublePrefixed=105`, so the documented findings exit is discriminating.

The landed tree scanned against that same fixed universe exits 0:

- `scannedFiles=1716`; `8598 + 725 = 9323` modelled calls; governed `213/102`.
- Blind dynamic namespace `274/27` = `234/25` literal-key + `40/16` non-literal-key; non-literal key `725/295`; property access `0/0`; blind union `959/303`.
- `localeDivergent=[]` is present, `unrepointed=[]`, and `doublePrefixed=0`.
- `--base definitely-not-a-ref` exits nonzero.

The two-site dynamic-namespace difference between historical and landed scans is preserved by construction rather than normalized away.

## Verification

- The implementation commit gate completed the repository build successfully (with the existing CSS, circular-chunk, and PDF import warnings).
- `pnpm test -- --run` was attempted once as the full workspace suite. Turbo stopped before Vitest execution when the frontend build tried to write `frontend/node_modules/.vite-temp` through the harness-owned `node_modules` symlink and received `EPERM`; the symlink was left untouched as required by the worktree contract.
- The five deterministic P99-42 acceptance oracles pass independently of that environment-only suite limitation.

## Scope and historical boundary

Only the census, its controlled fixture, this summary, and `99-07-SUMMARY.md` changed. No application, route, component, or locale JSON was modified. `frontend/src/routes/__root.tsx` remains untouched; its `common:dashboard.title` boundary exception remains recorded in the original summary for the Arabic navigation behavior.
