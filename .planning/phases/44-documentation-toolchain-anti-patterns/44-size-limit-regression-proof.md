---
phase: 44-documentation-toolchain-anti-patterns
plan: 03
artifact: size-limit-regression-proof
created: 2026-05-07
---

# Size Limit Regression Proof

## Passing Baseline

PASS: `pnpm -C frontend build`

- Built current frontend output successfully.
- Known existing Vite warnings remained non-blocking:
  - CSS import-order warning for `shared-week-list.css`.
  - Dynamic import warnings for `dossier-export.types.ts` and `lib/sentry.ts`.
  - Chunk size warning for large existing chunks.

PASS: `node frontend/scripts/assert-size-limit-matches.mjs`

```text
Initial JS (entry point): 25 file(s)
React vendor: 1 file(s)
TanStack vendor: 1 file(s)
Total JS: 281 file(s)
signature-visuals/d3-geospatial: 1 file(s)
signature-visuals/static-primitives: 2 file(s)
```

PASS: `pnpm -C frontend size-limit`

```text
Initial JS (entry point): 516.62 kB / 517 kB
React vendor: 348.12 kB / 349 kB
TanStack vendor: 50.1 kB / 51 kB
Total JS: 2.42 MB / 2.43 MB
signature-visuals/d3-geospatial: 54.15 kB / 55 kB
signature-visuals/static-primitives: 63.14 kB / 64 kB
```

## Negative Perturbation

FAIL: intentional >= 1 KB increase

- Temporarily added a 4 KiB random base64 payload to `frontend/src/main.tsx`.
- `pnpm -C frontend build` succeeded.
- `node frontend/scripts/assert-size-limit-matches.mjs` still found all configured entries.
- `pnpm -C frontend size-limit` exited non-zero because the measured entry chunk exceeded its cap:

```text
Initial JS (entry point)
Package size limit has exceeded by 4.21 kB
Size limit: 517 kB
Size: 521.21 kB gzipped
```

## Restoration

- Removed only the temporary payload from `frontend/src/main.tsx`.
- Confirmed `git diff -- frontend/src/main.tsx` is empty after removal.
- Re-ran the passing baseline commands above successfully.
