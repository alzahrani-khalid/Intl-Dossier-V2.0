# Phase 35: typography-stack — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 35-typography-stack
**Areas discussed:** Font pipeline, Fontsource packages, Load strategy, Arabic gating + override placement

---

## Area selection (gate question)

| Option             | Description                                                    | Selected |
| ------------------ | -------------------------------------------------------------- | -------- |
| Font pipeline      | `buildTokens` vs CSS selectors vs helper; legacy var migration | ✓        |
| Fontsource pkgs    | Classic vs variable vs mix                                     | ✓        |
| Load strategy      | All-at-boot vs code-split vs preload-default                   | ✓        |
| AR gating + legacy | Unconditional vs locale-gated Tajawal; override CSS placement  | ✓        |

**User's choice:** All four areas selected for discussion.

---

## Area 1: Font pipeline

### Q1: How should `--font-display/body/mono` get set on `:root`?

| Option                           | Description                                                    | Selected                |
| -------------------------------- | -------------------------------------------------------------- | ----------------------- |
| Extend buildTokens (Recommended) | Add font keys to Phase 33's token map; applyTokens writes them | ✓ (Claude's discretion) |
| Pure-CSS selectors               | `[data-theme=chancery] { --font-display: ... }`                |                         |
| Separate helper                  | New `applyFontTokens()` alongside `applyTokens()`              |                         |

**User's choice:** "you decide the best for the app" — locked as **D-01: Extend buildTokens**.
**Notes:** Rationale — DRY pipeline, atomic token application on direction switch (no font/color desync), one test surface. Fonts-as-strings fit fine alongside OKLCH-computed colors in the same token map.

### Q2: What happens to legacy `--text-family` / `--display-family` / `--text-family-rtl` vars?

| Option                       | Description                                                | Selected                |
| ---------------------------- | ---------------------------------------------------------- | ----------------------- |
| Rewrite inline (Recommended) | Rename 11 references in index.css; delete RTL-family rules | ✓ (Claude's discretion) |
| Keep as aliases              | `--text-family: var(--font-body)` alias at `:root`         |                         |
| Delete + rewrite CSS         | Aggressive — delete the 11 rules entirely                  |                         |

**User's choice:** "you decide the best for the app" — locked as **D-02: Rewrite inline**.
**Notes:** Rationale — 11 references is trivial to refactor, zero component references (one canvas-ctx read auto-migrates), matches Phase 33 D-09 hard-cut pattern. Safer than deleting rules outright.

---

## Area 2: Fontsource packages

### Q3: Which @fontsource variant per family?

| Option                                      | Description                                                                                          | Selected                |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------- |
| Mix: variable where available (Recommended) | Variable for Inter/Public Sans/Space Grotesk/Fraunces/JetBrains Mono; classic for IBM Plex + Tajawal | ✓ (Claude's discretion) |
| All classic (TYPO-02 literal)               | `@fontsource/*` for all 8, explicit weight imports                                                   |                         |
| All variable (force)                        | Collapses to Mix in practice (3 families have no variable version)                                   |                         |

**User's choice:** "you decide the best for the app" — locked as **D-03: Mix**.
**Notes:** Rationale — smallest viable bundle while matching TYPO-02 weight requirements. Variable's single-file + arbitrary-weight support is future-proof for downstream phases that might request non-standard weights.

### Q4: Variable font loading — full axis or subset?

| Option                      | Description                                              | Selected                |
| --------------------------- | -------------------------------------------------------- | ----------------------- |
| Full variable (Recommended) | Import `.../wght.css` as-is, supports any weight 100-900 | ✓ (Claude's discretion) |
| Subset 400-700 only         | Use `?weight=400..700` querystring subset syntax         |                         |

**User's choice:** "you decide the best for the app" — locked as **D-04: Full variable axis**.
**Notes:** Rationale — subset syntax varies across fontsource versions and can break silently on package bumps; ~50KB total delta isn't worth the fragility.

---

## Area 3: Load strategy

### Q5: When are the 7 Latin families + Tajawal loaded?

| Option                      | Description                                                | Selected                |
| --------------------------- | ---------------------------------------------------------- | ----------------------- |
| All at boot (Recommended)   | Side-effect imports in `fonts.ts` imported from `main.tsx` | ✓ (Claude's discretion) |
| Code-split per direction    | Dynamic `import()` on direction change                     |                         |
| Preload default + lazy rest | Chancery sync; others lazy on first switch                 |                         |

**User's choice:** "you decide the best for the app" — locked as **D-05: All at boot via `frontend/src/fonts.ts`**.
**Notes:** Rationale — direction switch already re-lays-out the UI (type scale changes); a simultaneous FOUT would compound the jolt. Users switch direction rarely. Matches Phase 33 FOUC-first philosophy.

---

## Area 4: Arabic gating + override placement

### Q6: Tajawal loading — unconditional or locale-gated?

| Option                    | Description                                    | Selected                |
| ------------------------- | ---------------------------------------------- | ----------------------- |
| Always load (Recommended) | Tajawal imported in `fonts.ts` alongside Latin | ✓ (Claude's discretion) |
| Conditional on locale     | Load only when `id.locale === 'ar'`            |                         |

**User's choice:** "you decide the best for the app" — locked as **D-06: Always load**.
**Notes:** Rationale — Arabic-first app (CLAUDE.md global RTL rules), zero locale-toggle flash, Phase 43 QA sweep exercises every route in AR. The ~180KB overhead is acceptable against eliminating the async-font-flash class of bugs entirely.

### Q7: Where does the handoff's verbatim RTL cascade block live?

| Option                            | Description                                      | Selected                |
| --------------------------------- | ------------------------------------------------ | ----------------------- |
| Inline in index.css (Recommended) | Paste ~60-line block after `@theme` in index.css | ✓ (Claude's discretion) |
| Dedicated fonts.css               | New `styles/fonts.css` with override block       |                         |
| CSS-in-JS via component           | `<GlobalFontStyles>` with `<style>` element      |                         |

**User's choice:** "you decide the best for the app" — locked as **D-07: Inline in index.css**.
**Notes:** Rationale — TYPO-03 "preserved verbatim" is grep-verifiable when block sits in one known file. No `@font-face` rules to co-locate (fontsource handles those). CSS-in-JS breaks pre-hydration rendering.

---

## Done-gate

| Option                | Description                                                    | Selected |
| --------------------- | -------------------------------------------------------------- | -------- |
| Write context         | Lock 7 decisions, write CONTEXT.md + DISCUSSION-LOG.md, commit | ✓        |
| Revisit pipeline      | Reopen Area 1                                                  |          |
| Revisit packages/load | Reopen Areas 2/3                                               |          |
| Revisit AR gating     | Reopen Area 4                                                  |          |

**User's choice:** Write context.

---

## Claude's Discretion (planner owns at plan time)

These were flagged as open but low-stakes; planner decides during plan-phase research:

- Font fallback chain (handoff-minimal `'Inter', system-ui, sans-serif` vs enhanced `-apple-system, BlinkMacSystemFont, ...`).
- `font-display` CSS property (swap default vs fallback vs optional).
- `<link rel="preload">` hints in `index.html` for critical fonts.
- Organization of imports inside `fonts.ts` (alphabetical, by direction, by family role).
- Tailwind `@theme` font utility bindings (verify existing state from Phase 33; add if missing).
- Unit-test vs E2E-test partition for TYPO-01..04 coverage.

---

## Deferred Ideas

Captured in CONTEXT.md `<deferred>` section:

- Arabic font variants beyond Tajawal (future theming direction).
- Font optical-size axis usage (Fraunces `opsz`).
- Font subsetting to Arabic + Latin Extended only.
- `<link rel="preload">` critical-font optimization.
