---
phase: 33-token-engine
plan: 33-01-token-module
subsystem: design-system
tags: [tokens, oklch, theme, rtl, density, pure-fn]
dependency_graph:
  requires:
    - 33-CONTEXT.md
    - 33-RESEARCH.md
    - 33-PATTERNS.md
    - /tmp/inteldossier-handoff/inteldossier/project/src/themes.jsx
  provides:
    - frontend/src/design-system/tokens/types.ts
    - frontend/src/design-system/tokens/directions.ts
    - frontend/src/design-system/tokens/densities.ts
    - frontend/src/design-system/tokens/buildTokens.ts
    - frontend/src/design-system/tokens/applyTokens.ts
  affects:
    - 33-02 (ThemeProvider consumer)
    - 33-03 (typography + numerals consumer)
    - 33-06 (global.css + :root token surface)
tech-stack:
  added: []
  patterns:
    - pure-token-engine (buildTokens is a pure function — no DOM, no React)
    - boundary-isolation (applyTokens is the single DOM-touching module)
    - reversible-side-effects (applyTokens returns a cleanup closure)
    - handoff-1:1 (OKLCH math ported verbatim from themes.jsx)
key-files:
  created:
    - frontend/src/design-system/tokens/densities.ts
    - frontend/src/design-system/tokens/buildTokens.ts
    - frontend/src/design-system/tokens/applyTokens.ts
    - frontend/tests/unit/design-system/buildTokens.test.ts
    - frontend/tests/unit/design-system/applyTokens.test.ts
  modified:
    - frontend/src/design-system/tokens/types.ts (pre-existing; verified against plan)
    - frontend/src/design-system/tokens/directions.ts (pre-existing; verified against plan)
decisions:
  - Soft-variant math uses a single mode-dependent (L, C) pair across all
    semantic + SLA hues (light 0.94/0.05; dark 0.22/0.08) per RESEARCH
    Gotcha #4 — keeps the D-13 extension trivially deterministic.
  - SLA-risk formula `(hue+55) % 360` is computed once and shared with
    `--sla-risk-soft` so the soft variant sits on the same offset wheel.
  - `applyTokens` tracks per-property prior state in a Map; cleanup
    restores via `setProperty` or `removeProperty` depending on whether
    the property was set before — this makes the fn safe to stack.
  - No barrel `index.ts` — enforces explicit per-file imports (DoD item).
  - Frontend workspace is `intake-frontend` (not `frontend`); all
    commands used `--filter intake-frontend` or ran inside `frontend/`.
metrics:
  duration: ~25 minutes
  completed: 2026-04-20
---

# Phase 33 Plan 01: Token Module Summary

OKLCH token engine ported 1:1 from the inteldossier handoff; `buildTokens` is a
pure function that returns a flat `Record<string,string>` of CSS var names →
OKLCH values across 72 direction×mode×hue×density combinations, and
`applyTokens` is the only module in the package allowed to touch the DOM.

## What Ships

Five files under `frontend/src/design-system/tokens/` form the complete
engine: `types.ts` (contracts), `directions.ts` (locale→font/dir/lang/numerals),
`densities.ts` (rowH/padInline/controlH presets), `buildTokens.ts` (pure
math), and `applyTokens.ts` (DOM side-effect boundary with reversible
cleanup). Two Vitest files lock the behavior down with 98 focused assertions.

## Tasks Completed

| Task | Name                                              | Commit                   | Files                                          |
| ---- | ------------------------------------------------- | ------------------------ | ---------------------------------------------- |
| 1    | types.ts — contracts                              | (pre-existing; verified) | `types.ts`                                     |
| 2    | directions.ts — locale map                        | (pre-existing; verified) | `directions.ts`                                |
| 3    | densities.ts — density presets                    | 33eafb3                  | `densities.ts`                                 |
| 4    | buildTokens.ts — pure OKLCH builder               | 33eafb3                  | `buildTokens.ts`                               |
| 5    | applyTokens.ts — DOM boundary                     | 33eafb3                  | `applyTokens.ts`                               |
| 6    | buildTokens unit tests (72-case matrix + focused) | ecad00a                  | `tests/unit/design-system/buildTokens.test.ts` |
| 7    | applyTokens unit tests (DOM side effects)         | ecad00a                  | `tests/unit/design-system/applyTokens.test.ts` |

## Commits

- `33eafb3` — feat(33-01): add token engine module with OKLCH theme builder
- `ecad00a` — test(33-01): cover token engine across 72 matrix + DOM side effects

## Test Results

```
Test Files  2 passed (2)
     Tests  98 passed (98)
```

Breakdown:

- `buildTokens.test.ts` — 92 tests (72 matrix + 20 focused assertions on
  direction/typography, mode-dependent math, SLA-risk modulo, density,
  geometry, soft variants, purity/determinism)
- `applyTokens.test.ts` — 6 tests (write-all, cleanup-removes-new,
  cleanup-restores-prior, stack-restore, no-DOM no-op, and one shared
  setup hook)

## Verification Verdict

| Gate                                                          | Status                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------- |
| pnpm test design-system/tokens                                | PASS (98/98)                                            |
| pnpm typecheck (design-system files)                          | PASS (0 errors in tokens/ or tests/unit/design-system/) |
| pnpm lint src/design-system/tokens/ tests/unit/design-system/ | PASS (0 errors, 0 warnings)                             |
| No `any` / explicit return types                              | PASS                                                    |
| No `react`/`document`/`window` imports outside applyTokens.ts | PASS                                                    |
| Named exports only                                            | PASS                                                    |
| No `index.ts` barrel                                          | PASS                                                    |
| SLA-risk `(hue+55)%360` explicit test (350→45)                | PASS                                                    |
| `--accent-ink` 42% light vs 72% dark                          | PASS                                                    |
| `--accent-soft` chroma 0.05 light vs 0.08 dark                | PASS                                                    |
| Density rowH 52/40/32 and padInline 20/14/10                  | PASS                                                    |
| D-13 soft variants (danger/ok/warn/info/sla-{ok,risk,bad})    | PASS                                                    |
| Derived tokens (field-radius, focus-ring, shadow-\*)          | PASS                                                    |

**DoD: PASS**

## Deviations from Plan

**None.** Pre-existing `types.ts` and `directions.ts` were checked against
the plan frontmatter and the handoff source; both matched 1:1 (Tajawal was
chosen for rtl-ar as the consumer-accessible Arabic font, matching the plan
and the project's global CLAUDE.md Tajawal reference). No extensions or
reshaping was needed.

### Auto-fixed Issues

None — plan was executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. This plan introduces no network endpoints, no auth paths, no file
access, and no schema changes. All code is in-process / same-origin DOM.

## Follow-ups for Wave 2

- **33-02 (ThemeProvider)**: consume `buildTokens` + `applyTokens` inside a
  React provider. `applyTokens` returns a cleanup closure — use it in a
  `useLayoutEffect` so token writes happen pre-paint and prior values are
  restored on unmount / prop change.
- **33-03 (Typography + numerals)**: read `--font-sans` and `--numerals`
  directly from `:root`; do not re-derive from `Direction` at the leaf.
- **33-06 (global.css / :root)**: initial `:root { ... }` should seed
  default tokens for `{direction: 'ltr-en', mode: 'light', hue: 'teal',
density: 'comfortable'}` so there is no flash before the provider mounts.
- **Tailwind v4 bridge (future)**: the token names are already
  CSS-custom-property-native; a Tailwind theme layer can reference them
  with `theme(--accent)` style syntax once the tokens engine is mounted.

## Self-Check: PASSED

- `frontend/src/design-system/tokens/types.ts` — FOUND
- `frontend/src/design-system/tokens/directions.ts` — FOUND
- `frontend/src/design-system/tokens/densities.ts` — FOUND
- `frontend/src/design-system/tokens/buildTokens.ts` — FOUND
- `frontend/src/design-system/tokens/applyTokens.ts` — FOUND
- `frontend/tests/unit/design-system/buildTokens.test.ts` — FOUND
- `frontend/tests/unit/design-system/applyTokens.test.ts` — FOUND
- Commit `33eafb3` — FOUND
- Commit `ecad00a` — FOUND
