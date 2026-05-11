# Phase 48: Lint & Config Alignment - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 48-lint-config-alignment
**Areas discussed:** Config consolidation, no-restricted-imports policy, Rule posture + warnings, CI gate structure

---

## Config consolidation

### Q1: Where should the canonical ESLint config live?

| Option                                    | Description                                                                                                                                                          | Selected |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Root flat config only                     | Delete `frontend/eslint.config.js`. Rely solely on root `eslint.config.mjs` with workspace overrides. Single source of truth; bigger initial fix list (~723 vs ~92). | ✓        |
| Keep frontend/eslint.config.js, harmonize | Update both configs in lockstep. Smaller baseline; two configs to keep in sync.                                                                                      |          |
| You decide                                | Claude's discretion.                                                                                                                                                 |          |

**User's choice:** Root flat config only.

### Q2: How should per-workspace lint scripts find the root config?

| Option                                            | Description                                                      | Selected |
| ------------------------------------------------- | ---------------------------------------------------------------- | -------- |
| Per-workspace scripts pass `--config` explicit    | `eslint -c ../eslint.config.mjs src/...`. Symmetric, explicit.   | ✓        |
| Delete per-workspace scripts, lint from root only | Breaks turborepo per-package caching.                            |          |
| Implicit lookup                                   | Fragile — a future `frontend/eslint.config.*` re-forks silently. |          |

**User's choice:** Explicit `--config` in workspace scripts.

### Q3: Which trees should be excluded from lint via `ignores:`?

| Option                                                  | Description                                                            | Selected |
| ------------------------------------------------------- | ---------------------------------------------------------------------- | -------- |
| `frontend/design-system/inteldossier_handoff_design/**` | IntelDossier prototype handoff — visual contract, not production code. | ✓        |
| `**/routeTree.gen.ts`                                   | TanStack Router auto-generated. Keep in ignores.                       | ✓        |
| `**/database.types.ts`                                  | Supabase generated. Already in ignores; resolves `@ts-nocheck` error.  | ✓        |
| `frontend/src/components/ui/**` (blanket ignore)        | Stronger move; would hide real issues if these files are edited.       |          |

**User's choice:** Three recommended adds; primitive blanket ignore rejected.

### Q4: Keep current scope-narrow exceptions for `frontend/src/components/ui/**`?

| Option                                  | Description                                                                                                                          | Selected |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Keep current scope-narrow exceptions    | Preserve carve-outs (no-restricted-syntax / no-explicit-any / rtl-friendly off). CLAUDE.md calls primitives "implementation detail." | ✓        |
| Tighten — remove rtl-friendly carve-out | Higher CLAUDE.md compliance; high churn.                                                                                             |          |
| Remove all carve-outs                   | Max strictness; expands fix list past ROADMAP baseline.                                                                              |          |

**User's choice:** Keep current scope-narrow exceptions.

---

## no-restricted-imports policy

### Q1: What should `no-restricted-imports` actually enforce?

| Option                                                  | Description                                                                                        | Selected |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| Ban Aceternity + Kibo packages outright                 | `aceternity-ui`, `@aceternity/*`, banned wrapper paths, `kibo-ui`, `@kibo-ui/*` at error severity. | ✓        |
| Ban Aceternity/Kibo AND nudge away from shadcn defaults | Add warn-level patterns on shadcn cards too. Risks blurring the bright line.                       |          |
| Remove no-restricted-imports entirely                   | Loses automated guardrail.                                                                         |          |

**User's choice:** Ban Aceternity + Kibo outright.

### Q2: Aceternity wrapper files exist on disk with zero imports. Phase 48 scope?

| Option                                         | Description                                     | Selected |
| ---------------------------------------------- | ----------------------------------------------- | -------- |
| Delete the orphan wrapper files                | Aligns with v6.1 dead-code + Karpathy surgical. | ✓        |
| Ban paths only; leave files on disk            | Half a fix; reads as cleanup left hanging.      |          |
| Defer file deletion to follow-up cleanup phase | Cleanly bounded scope; leaves known cleanup.    |          |

**User's choice:** Delete orphan wrapper files (3d-card.tsx, bento-grid.tsx, floating-navbar.tsx).

### Q3: What should the `no-restricted-imports` message say?

| Option                        | Description                                                                                                                           | Selected |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Cascade + CLAUDE.md reference | Shared message: "Banned by CLAUDE.md primitive cascade. Use HeroUI v3 → Radix → custom. If no primitive fits, ask before installing." | ✓        |
| Per-path bespoke messages     | More guidance, more maintenance, stale-advice risk.                                                                                   |          |
| Minimal message, link only    | Forces doc click; terser.                                                                                                             |          |

**User's choice:** Cascade + CLAUDE.md reference.

---

## Rule posture + warnings

### Q1: Phase 48 posture on the TODO(Phase 2+) disabled rules?

| Option                                                   | Description                                                                                   | Selected |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| Defer all Phase 2+ rules; drive current rule set to zero | Don't re-enable any off rules. Aligns with surgical-changes; preserves Phase 47 D-03 posture. | ✓        |
| Re-enable a small targeted subset now                    | Flip 1–2 high-value rules; document inline. Expands scope.                                    |          |
| Re-enable everything that's `off`                        | Maximum strictness; explodes scope past baseline.                                             |          |

**User's choice:** Defer all Phase 2+ rules.

### Q2: Warning policy — fix-at-call-site or budget?

| Option                                                     | Description                                                      | Selected |
| ---------------------------------------------------------- | ---------------------------------------------------------------- | -------- |
| Fix at call site by default; downgrade only with rationale | `--max-warnings 0`; inline rationale required for any downgrade. | ✓        |
| Allow a warning budget (>0 still passes CI)                | Weak gate; warnings drift back.                                  |          |
| Downgrade noisy rules wholesale before fixing              | Faster path; encodes "we gave up."                               |          |

**User's choice:** Fix at call site; `--max-warnings 0` in CI.

### Q3: Top-signal rules — unused-imports/no-unused-vars + rtl-friendly?

| Option                                              | Description                                                           | Selected |
| --------------------------------------------------- | --------------------------------------------------------------------- | -------- |
| Drive both to zero by fixing call sites             | Mechanical fixes; aligned with Phase 47 D-03 + CLAUDE.md RTL mandate. | ✓        |
| Drive RTL to zero; downgrade unused-vars further    | Weaker on unused side.                                                |          |
| Let the planner decide rule-by-rule after histogram | Each rule gets fix-vs-downgrade decision based on count.              |          |

**User's choice:** Drive both to zero by call-site fixes.

### Q4: Backend's 3 errors — posture?

| Option                                                  | Description                                                                                              | Selected |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------- |
| Fix all three at the source                             | Empty interface → type alias; console.log → Winston logger; @ts-nocheck → remove or ignore-as-generated. | ✓        |
| Fix the first two; investigate @ts-nocheck origin first | Planner verifies if generated before deciding.                                                           |          |
| You decide                                              | Claude's discretion.                                                                                     |          |

**User's choice:** Fix all three at source (planner still verifies @ts-nocheck file origin per the option-2 caveat, captured in D-13).

---

## CI gate structure

### Q1: CI job structure for the restored lint gate?

| Option                                                | Description                                                                          | Selected |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ | -------- |
| Keep single `lint` job, both workspaces               | Turbo fans out in parallel; attribution clear from labeled output; fewer CI minutes. |          |
| Split into lint-frontend + lint-backend parallel jobs | Mirror Phase 47 D-08 type-check split. More CI minutes; cosmetic gain.               |          |
| You decide                                            | Claude's discretion.                                                                 | ✓        |

**User's choice:** You decide. Claude leans toward single job (see D-14 rationale: type-check needed split because it was hidden inside lint; that problem doesn't apply here).

### Q2: Branch protection update on `main` once lint is green?

| Option                                                   | Description                                  | Selected |
| -------------------------------------------------------- | -------------------------------------------- | -------- |
| Add `lint` as required check + keep enforce_admins: true | Mirrors Phase 47 D-09 posture.               | ✓        |
| Add `lint` as required check, soft-enforce               | Weakens gate; mixed signal across milestone. |          |
| Defer branch-protection update to a follow-up            | Phase isn't done per success criterion #4.   |          |

**User's choice:** Add `lint` to required checks with `enforce_admins: true`.

### Q3: Smoke-test PR for the lint gate?

| Option                                       | Description                                                                                           | Selected |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| Two smoke PRs — one per workspace            | Frontend: `text-left` violation; backend: raw `console.log`. Closes Phase 47 follow-up #1 by analogy. | ✓        |
| One smoke PR combining both workspaces       | Less PR noise; proves only the single check name blocked.                                             |          |
| Skip smoke PR; trust protection API response | Weaker proof; goes against Phase 47 D-13 precedent.                                                   |          |

**User's choice:** Two smoke PRs (one per workspace).

---

## Claude's Discretion

- **D-14 (CI job structure):** User selected "you decide." Claude leans single `lint` job. Planner may revisit based on per-workspace runtime histogram; either choice satisfies success criteria.
- **Sub-plan count under Phase 48** — planner's call. D-01..D-08 (config) and D-15..D-16 (CI) cluster naturally; D-09..D-13 (rule violations) is the natural splitting axis.
- **Order between orphan wrapper deletion (D-07) and path bans (D-06)** — executor's call. Safe either order because nothing imports them today.
- **Optional `pnpm lint:summary` histogram script** — planner's discretion (analogue of Phase 47's `pnpm type-check:summary` proposal).
- **`@ts-nocheck` resolution in `contact-directory.types.ts`** — planner verifies hand-authored vs script-generated before choosing remove-directive vs add-to-ignores.

## Deferred Ideas

- Re-enabling `TODO(Phase 2+)` disabled rules (`no-explicit-any`, `no-floating-promises`, `explicit-function-return-type`, `react-hooks/rules-of-hooks`, all `no-unsafe-*`, `strict-boolean-expressions`, `require-await`).
- Tightening primitive carve-outs in `frontend/src/components/ui/**` (re-enabling `rtl-friendly` etc. on primitives).
- Deletion of non-Aceternity `floating-*` orphan candidates (floating-dock, etc.) — out of Phase 48 scope.
- Stylelint / a11y CI gates.
- Knip enforcement (`.husky/pre-commit` `|| true` removal).
- Pre-commit `eslint` hook addition.
- Bundle budget reset (BUNDLE-01..04) — Phase 49.
