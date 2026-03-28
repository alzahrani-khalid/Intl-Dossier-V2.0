# Phase 1: Dead Code & Toolchain - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 01-dead-code-toolchain
**Areas discussed:** ESLint consolidation, Dead code removal, Dependency updates, Pre-commit scope

---

## ESLint Consolidation

| Option              | Description                                                               | Selected |
| ------------------- | ------------------------------------------------------------------------- | -------- |
| Strict from day one | All rules as errors. Zero warnings policy. Forces clean code immediately. | ✓        |
| Gradual tightening  | Start with warnings for new rules, upgrade to errors in Phase 2+.         |          |
| You decide          | Claude picks based on codebase state.                                     |          |

**User's choice:** Strict from day one
**Notes:** Since this is a cleanup milestone, better to fix everything now rather than accumulate warnings.

---

| Option                    | Description                                                       | Selected |
| ------------------------- | ----------------------------------------------------------------- | -------- |
| Merge into unified config | RTL rules become part of the single flat config. Always enforced. | ✓        |
| Keep separate RTL config  | Run RTL lint as a separate step.                                  |          |
| You decide                | Claude decides based on ESLint 9 flat config compatibility.       |          |

**User's choice:** Merge into unified config
**Notes:** Aligns with Phase 4 (RTL/LTR Consistency) later.

---

| Option                | Description                                                              | Selected |
| --------------------- | ------------------------------------------------------------------------ | -------- |
| Keep separate         | Prettier formats, ESLint lints — no overlap. Use eslint-config-prettier. | ✓        |
| Integrate into ESLint | Run Prettier as an ESLint rule. Single command but slower.               |          |
| You decide            | Claude picks based on current setup.                                     |          |

**User's choice:** Keep Prettier separate
**Notes:** Faster, cleaner separation of concerns.

---

| Option             | Description                                                | Selected |
| ------------------ | ---------------------------------------------------------- | -------- |
| Single root config | One .prettierrc at root. Both workspaces share same rules. | ✓        |
| Keep per-workspace | Backend and frontend keep separate configs.                |          |
| You decide         | Claude checks if configs differ.                           |          |

**User's choice:** Single root config
**Notes:** None.

---

## Dead Code Removal

| Option                   | Description                                                   | Selected |
| ------------------------ | ------------------------------------------------------------- | -------- |
| Allowlist ui/ re-exports | Configure Knip to treat components/ui/\*.tsx as entry points. | ✓        |
| Remove re-export pattern | Remove re-export layer, update 500+ imports.                  |          |
| You decide               | Claude evaluates which re-exports are used.                   |          |

**User's choice:** Allowlist ui/ re-exports
**Notes:** These are intentional re-exports for the HeroUI migration pattern.

---

| Option                            | Description                                                             | Selected |
| --------------------------------- | ----------------------------------------------------------------------- | -------- |
| Remove dead, keep stubs with TODO | Delete unused files. Keep placeholder services with TODO + Knip ignore. | ✓        |
| Remove everything unused          | If Knip flags it, delete it. Rebuild from scratch when needed.          |          |
| You decide                        | Claude assesses each case.                                              |          |

**User's choice:** Remove dead, keep stubs with TODO
**Notes:** Placeholder services for clearance middleware (Phase 3) and MoU notifications should be preserved with clear markers.

---

| Option              | Description                                                  | Selected |
| ------------------- | ------------------------------------------------------------ | -------- |
| Yes, clean i18n too | Scan and remove orphaned keys from EN and AR files.          | ✓        |
| Skip for now        | Focus on code and deps only. Translation cleanup in Phase 4. |          |
| You decide          | Claude decides based on orphan key count.                    |          |

**User's choice:** Yes, clean i18n too
**Notes:** Unused translation keys add confusion and maintenance burden.

---

## Dependency Updates

| Option                      | Description                                  | Selected |
| --------------------------- | -------------------------------------------- | -------- |
| Latest stable               | Update all deps to latest stable versions.   | ✓        |
| Security patches only       | Only update deps with known vulnerabilities. |          |
| Major + minor, skip patches | Middle ground — update key deps only.        |          |

**User's choice:** Latest stable
**Notes:** This is the cleanup milestone — best time to modernize.

---

| Option           | Description                                                        | Selected |
| ---------------- | ------------------------------------------------------------------ | -------- |
| Audit and trim   | Check which AI libs are actually used. Remove unused, update rest. | ✓        |
| Keep all, update | Update everything but don't remove any.                            |          |
| You decide       | Claude traces imports to determine consumers.                      |          |

**User's choice:** Audit and trim
**Notes:** Trace actual imports to determine which AI libs have real consumers.

---

| Option             | Description                                               | Selected |
| ------------------ | --------------------------------------------------------- | -------- |
| Keep semver ranges | Use ^ (caret) ranges. pnpm-lock.yaml pins exact versions. | ✓        |
| Pin exact versions | Remove ^ from all deps. Maximum reproducibility.          |          |
| You decide         | Claude follows pnpm best practices.                       |          |

**User's choice:** Keep semver ranges
**Notes:** pnpm-lock.yaml already handles reproducibility.

---

## Pre-commit Scope

| Option                   | Description                   | Selected |
| ------------------------ | ----------------------------- | -------- |
| Lint (ESLint)            | Run ESLint on staged files.   | ✓        |
| Format (Prettier)        | Auto-format staged files.     | ✓        |
| Typecheck (tsc --noEmit) | Run TypeScript type checking. | ✓        |
| Knip (unused exports)    | Run Knip on staged files.     | ✓        |

**User's choice:** All 4 checks selected
**Notes:** Comprehensive quality gates on every commit.

---

| Option       | Description                                     | Selected |
| ------------ | ----------------------------------------------- | -------- |
| Block commit | Commit rejected on failure. Strict enforcement. | ✓        |
| Warn only    | Show warnings but allow commit.                 |          |
| You decide   | Claude picks per check type.                    |          |

**User's choice:** Block commit
**Notes:** Developers can --no-verify in emergencies only.

---

| Option             | Description                                                       | Selected |
| ------------------ | ----------------------------------------------------------------- | -------- |
| Staged files only  | lint-staged runs checks on changed files only. Full checks in CI. | ✓        |
| Full project check | Run on entire project. Catches everything but slow.               |          |
| You decide         | Claude optimizes for speed vs thoroughness.                       |          |

**User's choice:** Staged files only
**Notes:** Keeps commit times under 5s. Full project checks run in CI.

---

## Claude's Discretion

No areas deferred to Claude's discretion — all decisions were made explicitly.

## Deferred Ideas

None — discussion stayed within phase scope.
