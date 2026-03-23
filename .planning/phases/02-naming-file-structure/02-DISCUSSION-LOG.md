# Phase 2: Naming & File Structure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 02-naming-file-structure
**Areas discussed:** Component file convention, Hook naming split, Rename strategy, Enforcement rules

---

## Component File Convention

### Directory naming

| Option     | Description                                                                       | Selected |
| ---------- | --------------------------------------------------------------------------------- | -------- |
| kebab-case | All dirs become kebab-case. Matches types/ and lib/. Most common in modern React. | ✓        |
| PascalCase | All dirs become PascalCase. Matches component names. Angular-style.               |          |
| You decide | Claude picks based on codebase patterns.                                          |          |

**User's choice:** kebab-case
**Notes:** Matches existing types/ and lib/ conventions.

### Standalone files

| Option                   | Description                                                                     | Selected |
| ------------------------ | ------------------------------------------------------------------------------- | -------- |
| Move into dirs           | Every component gets its own kebab-case dir. Groups component + tests + styles. | ✓        |
| Keep as PascalCase files | Standalone files stay at top level. Only multi-file components get directories. |          |
| You decide               | Claude picks per component.                                                     |          |

**User's choice:** Move into dirs
**Notes:** No loose files in components/.

### Barrel exports

| Option              | Description                                                         | Selected |
| ------------------- | ------------------------------------------------------------------- | -------- |
| Yes, barrel exports | Each dir gets index.ts. Cleaner imports.                            |          |
| No barrels          | Import directly from file. Avoids circular deps. Knip works better. | ✓        |
| You decide          | Claude picks based on existing patterns.                            |          |

**User's choice:** No barrels
**Notes:** Knip from Phase 1 handles unused exports better without barrels.

---

## Hook Naming Split

| Option     | Description                                                                            | Selected |
| ---------- | -------------------------------------------------------------------------------------- | -------- |
| camelCase  | All hooks become useX.ts. Already the majority (~40 vs ~18). Matches React convention. | ✓        |
| kebab-case | All hooks become use-x.ts. Matches types/lib pattern. Would rename ~40 files.          |          |
| You decide | Claude picks based on majority and React conventions.                                  |          |

**User's choice:** camelCase
**Notes:** Majority already camelCase. React convention alignment.

---

## Rename Strategy

### Execution approach

| Option               | Description                                                                    | Selected |
| -------------------- | ------------------------------------------------------------------------------ | -------- |
| Layer-by-layer       | One plan per layer: hooks → components → cleanup. Each independently testable. | ✓        |
| Big-bang single plan | Everything in one plan. Fewer commits, harder to debug.                        |          |
| You decide           | Claude picks safest approach.                                                  |          |

**User's choice:** Layer-by-layer
**Notes:** Catch breakage early per layer.

### Git history

| Option      | Description                                                       | Selected |
| ----------- | ----------------------------------------------------------------- | -------- |
| Use git mv  | Preserves blame history. More steps but keeps authorship context. | ✓        |
| Just rename | Delete old + create new. Simpler but loses file-level blame.      |          |
| You decide  | Claude picks based on tooling.                                    |          |

**User's choice:** Use git mv
**Notes:** None.

### Scope

| Option              | Description                                                         | Selected |
| ------------------- | ------------------------------------------------------------------- | -------- |
| Naming only         | Just fix naming. No directory restructuring. Tight scope, low risk. | ✓        |
| Light restructuring | Fix naming AND consolidate obvious duplicates.                      |          |
| You decide          | Claude judges safe scope.                                           |          |

**User's choice:** Naming only
**Notes:** Directory restructuring is a separate concern.

---

## Enforcement Rules

### Enforcement method

| Option              | Description                                                                   | Selected |
| ------------------- | ----------------------------------------------------------------------------- | -------- |
| ESLint rules        | Add eslint-plugin-filenames or custom rules. Runs in pre-commit from Phase 1. | ✓        |
| Convention doc only | Document rules. Rely on code review.                                          |          |
| Both ESLint + docs  | Automated rules + docs. Belt and suspenders.                                  |          |
| You decide          | Claude picks enforcement level.                                               |          |

**User's choice:** ESLint rules
**Notes:** Automated enforcement via existing pre-commit infrastructure.

### UI primitives

| Option               | Description                                                           | Selected |
| -------------------- | --------------------------------------------------------------------- | -------- |
| Keep kebab-case      | UI primitives stay kebab-case. Already consistent, matches shadcn/ui. | ✓        |
| Switch to PascalCase | Match component convention. Would update all ui/ imports.             |          |

**User's choice:** Keep kebab-case
**Notes:** Already consistent, no changes needed.

---

## Claude's Discretion

- ESLint plugin choice and rule configuration
- File rename order within each layer
- Edge case handling (**tests**/, .d.ts files)
- Import path update tooling

## Deferred Ideas

None — discussion stayed within phase scope.
