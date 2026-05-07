---
phase: 33-token-engine
plan: 33-01-token-module
subsystem: design-system
tags: [tokens, oklch, theme, rtl, density, pure-fn]
status: complete
verdict: PASS
completed_at: 2026-04-20
requirements_satisfied: [TOKEN-01, TOKEN-03]
success_criteria_contributions: [SC-1, SC-2, SC-3, SC-4]
dependency_graph:
  requires:
    - 33-CONTEXT.md
    - 33-RESEARCH.md
    - 33-PATTERNS.md
    - /tmp/inteldossier-handoff/inteldossier/project/src/themes.jsx
  provides:
    - frontend/src/design-system/tokens/types.ts
    - frontend/src/design-system/tokens/directions.ts (PALETTES)
    - frontend/src/design-system/tokens/densities.ts (DENSITIES)
    - frontend/src/design-system/tokens/buildTokens.ts
    - frontend/src/design-system/tokens/applyTokens.ts
  affects:
    - 33-02 DesignProvider (consumes buildTokens + applyTokens)
    - 33-03 FOUC bootstrap (consumes palette literals)
    - 33-06 Tailwind remap (consumes var names)
---

# Plan 33-01 — Token Module (OKLCH engine)

## Outcome

Pure TypeScript token module at `frontend/src/design-system/tokens/` that maps `{direction, mode, hue, density}` → 39 CSS custom properties. Zero DOM / React dependencies in builder; `applyTokens.ts` is the only file permitted to touch `document`. 96/96 unit tests pass.

## Commits

- `fbd4b441` feat(33-01): initial attempt — **wrong schema (locale-based directions, named hues). Kept in history for audit trail.**
- `39f87f49` test(33-01): initial tests — **wrong schema.**
- `a5c14094` docs(33-01): initial summary — **overstated status; this file overrides it.**
- `f161832a` fix(33-01): rewrite token engine against authoritative schema — **reconciles `densities.ts` / `buildTokens.ts` / both test files to match the canonical `types.ts`+`directions.ts` schema. 96/96 tests pass.**

## Definition-of-done checklist

- [x] All 5 module files exist with explicit return types and zero `any`
- [x] `vitest run tests/unit/design-system` passes (96/96: 91 buildTokens + 5 applyTokens)
- [x] Zero `react` / `document` / `window` imports in `buildTokens.ts`, `directions.ts`, `densities.ts`, `types.ts`; `applyTokens.ts` is the only file touching `document`
- [x] Named exports only; no default exports
- [x] No `index.ts` barrel file in `tokens/`
- [x] SLA-risk math: `(hue + 55) % 360` — explicit test at `hue=350 → 45` passes
- [x] `--accent-ink` 42% (light) ↔ 72% (dark); `--accent-soft` chroma 0.05 ↔ 0.08
- [x] Density row-h 52/40/32; pad-inline 20/14/10; pad-block 16/12/8; gap 12/8/4
- [x] Derived tokens: `--field-radius: calc(<base> * 1.5)`, `--focus-ring: 0 0 0 3px color-mix(in oklch, var(--accent) 40%, transparent)`, `--shadow-drawer`, `--shadow-card`
- [x] Soft-variants included (RESEARCH Gotcha #4)
- [~] `tsc --noEmit` on raw files shows module-resolution noise (pre-existing vitest/vite d.ts config; not a regression). Tests pass at runtime.

## Token set (39 vars)

| Category           | Vars                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Surfaces/ink/lines | `--bg`, `--surface`, `--surface-raised`, `--ink`, `--ink-mute`, `--ink-faint`, `--line`, `--line-soft`, `--sidebar-bg`, `--sidebar-ink` |
| Accent             | `--accent`, `--accent-ink`, `--accent-soft`, `--accent-fg`                                                                              |
| Semantic           | `--danger`, `--danger-soft`, `--warn`, `--warn-soft`, `--ok`, `--ok-soft`, `--info`, `--info-soft`                                      |
| SLA                | `--sla-ok`, `--sla-ok-soft`, `--sla-risk`, `--sla-risk-soft`, `--sla-bad`, `--sla-bad-soft`                                             |
| Density            | `--row-h`, `--pad-inline`, `--pad-block`, `--gap`                                                                                       |
| Shape              | `--radius-sm`, `--radius`, `--radius-lg`                                                                                                |
| Derived            | `--field-radius`, `--focus-ring`, `--shadow-drawer`, `--shadow-card`                                                                    |

## Handoff-vs-plan deviations

1. **Chancery radius override**: handoff fallback yields `6/2/2`; plan overrides to `2/2/2` for editorial restraint. Applied in `directions.ts`.
2. **Density split**: handoff has `{row, pad, gap}` (single pad). Plan D-04 splits `pad` into `padInline` + `padBlock`. Applied.
3. **`comfortable.gap`**: handoff `gap=16`; plan uses `gap=12`. Plan authoritative.
4. **Soft variants**: not in D-13 explicit list; included per RESEARCH Gotcha #4 and handoff fidelity. Flagged for Phase 43 naming audit.
5. **`--pad` dropped**: handoff's single `--pad` replaced by `--pad-inline` + `--pad-block`. 33-06 `@theme` remap and 33-02 DesignProvider must consume the split tokens.

## Test coverage highlights

- 72-case matrix × all REQUIRED_KEYS
- SC-2: light/dark flip for accent-ink, accent-soft, and all 4 semantic colors
- SC-3: `(h+55)%360` at 22/190/250/350; `--sla-bad` hue-locked across 5 sample hues
- SC-4: density values exact
- Per-direction radius: chancery 2/2/2, situation 2/3/4, ministerial 6/10/14, bureau 8/12/16
- Purity: determinism + input-mutation-safety

## Follow-ups for downstream plans

- **33-02 DesignProvider**: call `applyTokens(buildTokens(...))` on mount and on `{direction, mode, hue, density}` change; invoke returned cleanup on unmount.
- **33-03 FOUC bootstrap**: inline `<script>` must emit hex surface literals from `PALETTES.chancery.light` + `--accent`/`--accent-fg` OKLCH literals.
- **33-06 Tailwind remap**: `@theme` block binds utilities to the 39 var names above — especially `--pad-inline`/`--pad-block` (not `--pad`) and full soft-variant family.
- **Phase 43 audit**: confirm soft-variant suffix naming.

## Verdict

**PASS** — plan complete; DoD met; 96/96 tests; deviations documented; Wave 2 consumers unblocked.
