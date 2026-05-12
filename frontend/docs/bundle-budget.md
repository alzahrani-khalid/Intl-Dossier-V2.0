# Frontend bundle budget

Last audited: 2026-05-12
Audit artifact: `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md`

This document records the rationale for every chunk over 100 KB gzipped in
the production build. Sibling to `frontend/.size-limit.json` per Phase 49 D-09.

## Ceilings

| Chunk                | gz size   | Ceiling | Rationale                                                                                                                                                                                                                                                                                                                                                                     | Last audited |
| -------------------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Initial JS (`app-*`) | 411.98 kB | 450 kB  | Entry route — TanStack Router shell + provider tree + i18n init. The chunk is dominated by i18n JSON namespace eager imports (~150 kB across 60+ files); the remaining mass is React Router scaffolding and the protected-route layout. Plan 02 D-06 lazy() boundaries below cut growth here as additional consumers are deferred.                                            | 2026-05-12   |
| React vendor         | 347.13 kB | 349 kB  | react + react-dom + scheduler — near native floor. Cannot be reduced without dropping React itself. Ceiling held at current per D-03 `min(current, measured + 5 kB)` because current is already tighter than the mechanical +5 kB rule.                                                                                                                                       | 2026-05-12   |
| TanStack vendor      | 50.10 kB  | 51 kB   | @tanstack/react-router + react-query + react-table + react-virtual — all on the initial path. Ceiling held at current per D-03 `min(current, measured + 5 kB)` because current is already tighter than the mechanical +5 kB rule.                                                                                                                                             | 2026-05-12   |
| Total JS             | 2.42 MB   | 2.45 MB | Sum of all `dist/assets/*.js` gzipped. Locked at 2.45 MB per D-02 escalation (see audit `## Escalation (D-02)` block) — the 1.8 MB target was unattainable inside Phase 49 scope because D-06 lazy() and D-07 manualChunks decomposition reshape chunks but do not reduce on-disk Total. Computed ceiling = max(2.45 MB, sum-of-per-chunk-ceilings × 1.05) — Total dominates. | 2026-05-12   |

<!-- Plan 02 appends rows here for HeroUI vendor / Sentry vendor / DnD vendor
     after the post-decomp build measures them. Plan 02 also fills in
     `Residual vendor chunk` below per D-08. -->

## Residual vendor chunk

Per D-08: after the D-07 named sub-vendors split off, anything remaining in
`vendor-*` that is ≥10 kB gz gets a row below with an explanation of why it
stays in the catch-all bucket.

| Dep             | gz size         | Reason for staying in `vendor` |
| --------------- | --------------- | ------------------------------ |
| (Plan 02 fills) | (Plan 02 fills) | (Plan 02 fills)                |
