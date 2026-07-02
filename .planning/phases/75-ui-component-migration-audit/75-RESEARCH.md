# Phase 75: UI Component & Migration Audit - Research

**Researched:** 2026-07-02
**Domain:** UI component inventory / library-migration audit (React 19 + HeroUI v3 + shadcn/Radix + Aceternity-styled customs)
**Confidence:** HIGH (nearly all findings verified by commands run against the live tree this session)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

(none — see Claude's Discretion below; the phase's decision rules are already encoded in ROADMAP success criteria and REQUIREMENTS)

### Claude's Discretion

All implementation choices are at Claude's discretion — audit/inventory phase whose decision rules are already encoded in the ROADMAP success criteria and REQUIREMENTS:

- Classification taxonomy is fixed: replace-with-shadcn-primitive / keep-custom (domain-specific) / replace-with-shadcn-block.
- Every "replace-with-primitive" row must list the behaviors the primitive must preserve; empty behavior lists are downgraded to keep-custom.
- Components touching clearance, RTL directionality, flags/glyphs, or dossier-type logic default to keep-custom (or shadcn-block-with-domain-wrapper) — never primitive-replace.
- AUDIT-02/03 are confirmations, not hunts: the 2026-07-02 pre-execution review already verified the tree is on the v3 compound-component API and that none of the v3-removed components (Navbar, Snippet, User, Spacer, Image, Code, Autocomplete, DateInput) are imported. The audit records the confirmation evidence (spot-verification across Card/Checkbox/Switch/Modal wrappers) and flags any regression with a replacement plan.
- AUDIT-04 captures RHF/Zod validation wiring, ARIA attributes, and keyboard-focus contracts for each of the 8 Aceternity-styled form components in writing before any rebuild starts (rebuild itself is Phase 79).

Artifact format/location, inventory granularity, and verification tooling are planner's choice.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope (infrastructure path, no interactive discussion needed).
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                                                                        | Research Support                                                                                                                                                                                                                                                                                |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUDIT-01 | Every hand-rolled UI surface in `frontend/src/components/**` classified as replace-with-shadcn-primitive / keep-custom / replace-with-shadcn-block | Verified tree size (799 files, ~100 subdirs, 99 test files); per-directory counts; domain-signal file lists (clearance=10, flags/glyphs=13, dossier-type=62); recommended two-tier granularity (per-file for `ui/`+`forms/`, per-directory elsewhere); existing `COMPONENT_REGISTRY.md` as seed |
| AUDIT-02 | HeroUI usage confirmed on v3 compound-component API; residual flat-prop call sites listed (expected: none)                                         | Full `@heroui/react` import inventory (8 files, verified); compound usage spot-checked in wrappers; flat-named subcomponent exports (`DrawerBackdrop` etc.) verified as legitimate v3 API in installed 3.0.5 dist types; evidence commands provided                                             |
| AUDIT-03 | v3-removed components (Navbar, Snippet, User, Spacer, Image, Code, Autocomplete, DateInput) confirmed unused; regressions get replacement plans    | Verified 0 imports of all 8 names this session (grep exit 1); official removed list cross-checked against HeroUI docs (7 names: Code, Image, Navbar, Ripple, Snippet, Spacer, User); `Autocomplete` actually EXISTS in installed 3.0.5 exports — nuance documented                              |
| AUDIT-04 | The 8 Aceternity-styled form components inventoried with RHF/Zod/ARIA/keyboard-focus behavioral contracts captured                                 | All 8 files located in `components/forms/`; **verified 7 of 8 have zero live call sites** (SearchableSelect live only via UserPicker → 4 consumers); ARIA density per file measured; contract-capture template fields derived from component internals                                          |

</phase_requirements>

## Summary

This is a docs-only audit phase. Research therefore focused on establishing verified ground truth about the tree being audited, so the planner can write tasks with exact scopes, file lists, and evidence commands — not discovery tasks.

The headline finding materially de-risks Phase 79: **7 of the 8 Aceternity-styled form components are dead code.** `FormInputAceternity`, `FormTextareaAceternity`, `FormSelectAceternity`, `FormCheckboxAceternity`, `FormRadioAceternity`, `FormFieldWithValidation`, and `SmartInput` have zero imports anywhere in `frontend/src` or `tests/` outside `components/forms/` itself; the forms barrel (`components/forms/index.ts`) that exports them is itself never imported. Only `SearchableSelect` is transitively live — `UserPicker` wraps it, and UserPicker has 4 live consumers (TaskEditDialog, AddToDossierDialogs, OrgDetailsStep, TaskQuickForm). The milestone research's note that `ValidationDemoPage.tsx` consumes these is stale — that file was deleted in the demo-page cleanup (PRs #88/#89 era). AUDIT-04 contract capture is still required by the requirement, but the audit must record this zero-call-site evidence per component because it changes Phase 79's rebuild-vs-delete calculus.

AUDIT-02/03 confirmations were re-verified live this session and hold: exactly 8 files import `@heroui/react` (5 real wrappers + AppShell + TweaksDrawer + 1 test), all on v3-valid API; zero imports of any v3-removed component name. Two nuances the audit must record to avoid false findings: (1) HeroUI v3 exports flat-named subcomponent aliases (`DrawerBackdrop`, `DrawerContent`, …) alongside dot-notation — TweaksDrawer's usage is v3-conformant, not a "flat-prop" straggler; (2) three `heroui-*.tsx` files (chip/switch/tabs) contain **no HeroUI at all** — they are HeroUI-styled lookalikes on CVA/Radix, and `heroui-chip.tsx` carries a stale docstring claiming "Real @heroui/react Chip primitive."

**Primary recommendation:** Plan 3 audit artifacts in the phase directory (classification, HeroUI confirmation, Aceternity contracts), classify per-file only in `components/ui/` + `components/forms/` and per-directory everywhere else, and bake every evidence command from this research into task verification steps. No new packages, no code changes.

## Project Constraints (from CLAUDE.md)

Directives that bind this phase's deliverables and process:

- **GSD workflow enforcement**: all file changes flow through GSD commands; this research/plan/execute chain satisfies that.
- **Audit deliverables are planning docs** — `commit_docs: true`, so artifacts are committed. Known repo quirk: pre-commit lint-staged/prettier churns `.planning/*.md`; docs commits historically use `HUSKY=0` + pre-formatted output (MEMORY: lint-staged reverts MM files).
- **No emoji in user-visible copy / no marketing voice** — applies to audit docs (they are internal, but keep sentence case, factual tone).
- **Design source of truth**: the IntelDossier prototype is the _outgoing_ spec; v8.0's target values live in `.planning/research/STACK.md` (Linear reference values), NOT `frontend/DESIGN.md`. Classification notes must not treat Bureau chrome as the preservation target — behavior is preserved, visuals are Phase 77's job.
- **Component cascade (CLAUDE.md)**: HeroUI v3 → Radix → build-it-yourself, primitives for _interactive behavior only_. This cascade is the tie-breaker rubric for replace-vs-keep classification calls.
- **Banned libraries**: Aceternity UI and Kibo UI banned; ESLint `no-restricted-imports` ban is live in root `eslint.config.mjs` (lines ~124–150), including path bans for deleted ui files (`3d-card`, `bento-grid`, `floating-navbar`, `link-preview`).
- **RTL logical properties only** (`ms-*`, `me-*`, `text-start`); relevant to AUDIT-04 contract capture (the 8 components use `ps-12`/`pe-12` icon spacing that any rebuild must preserve).
- **Naming/style**: audit docs are markdown; if any helper script is written, follow repo ESLint/prettier (single quotes, no semicolons, explicit return types).

## Architectural Responsibility Map

Adapted for an audit phase — capabilities map to evidence layers, not runtime tiers:

| Capability                    | Primary Tier                                                                    | Secondary Tier                                                 | Rationale                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| AUDIT-01 classification       | Static analysis (ripgrep on `frontend/src/components/**`)                       | Knowledge graph (graphify-out / Understand-Anything dashboard) | Import edges + file contents decide classification; graph accelerates dependency questions but is 3 weeks stale |
| AUDIT-02 v3-conformance       | Installed package types (`node_modules/@heroui/react/dist`) + `pnpm type-check` | Import-site grep                                               | Type-check against installed 3.0.5 declarations is the mechanical proof that every call site uses v3-valid API  |
| AUDIT-03 removed-components   | ripgrep import scan                                                             | Installed dist export listing                                  | 0-hit grep is the confirmation; dist listing resolves the Autocomplete discrepancy                              |
| AUDIT-04 behavioral contracts | Manual file reading (8 known files)                                             | Usage grep (call-site liveness)                                | Contracts are read out of component source; liveness evidence contextualizes each contract                      |
| Artifact publication          | `.planning/phases/75-ui-component-migration-audit/`                             | git (committed, `commit_docs: true`)                           | Downstream planners (Phases 76–79) read from the planning tree                                                  |

## Verified Ground Truth (the numbers the plan should cite)

All verified by commands run 2026-07-02 against the working tree at `main` (post-PR #93). `[VERIFIED: session grep/find]` throughout this section.

### Tree size and shape

- `frontend/src/components/**`: **799** `.ts`/`.tsx` files, of which **99** are `*.test.ts(x)` → ~700 classification-relevant source files. **0** files at the directory root; ~100 subdirectories.
- Largest directories: `dossier/` 136, `ui/` 74, `signature-visuals/` 31, `forms/` 22, `layout/` 21, `copilot/` 20, `modern-nav/` 18, `empty-states/` 16, `commitments/` 16, `calendar/` 16, `list-page/` 15, `settings/` 14, `intelligence/` 14, `report-builder/` 13, `kanban/` 12, `dashboard-widgets/` 12. Long tail: ~45 directories with 1–4 files each.
- `components/ui/COMPONENT_REGISTRY.md` exists (172 lines, last updated Phase 48 / 2026-05-12) — a usable seed for the `ui/` classification rows, but stale (HeroUI wrapper table is "(To-do)"; doesn't reflect chip/switch/tabs reality below).

### HeroUI surface (AUDIT-02)

Files importing `@heroui/react` — the complete list (8):

| File                                           | What it imports                                                                                  | API style                                                                                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/ui/heroui-button.tsx`              | `Button`                                                                                         | v3                                                                                                                                                       |
| `components/ui/heroui-card.tsx`                | `Card`                                                                                           | v3                                                                                                                                                       |
| `components/ui/heroui-forms.tsx`               | `TextField, Input, TextArea, Label, Description, FieldError, Select, Checkbox, Switch`           | v3 compound (`Checkbox.Control/.Indicator`, `Switch.Control/.Thumb` verified in file)                                                                    |
| `components/ui/heroui-modal.tsx`               | `Modal, Button, useOverlayState`                                                                 | v3 compound (`Modal.Backdrop/.Container/.Dialog/.Header/.Heading/.Body/.Footer/.CloseTrigger` verified)                                                  |
| `components/ui/heroui-skeleton.tsx`            | `Skeleton`                                                                                       | v3                                                                                                                                                       |
| `components/layout/AppShell.tsx`               | `Drawer, useOverlayState`                                                                        | v3                                                                                                                                                       |
| `components/tweaks/TweaksDrawer.tsx`           | `Drawer, DrawerBackdrop, DrawerContent, DrawerDialog, DrawerHeader, DrawerBody, useOverlayState` | v3 **flat-named subcomponent exports** — verified legitimate: `node_modules/@heroui/react/dist/components/drawer/index.d.ts` exports exactly these names |
| `components/layout/ConcurrentDrawers.test.tsx` | `Drawer`                                                                                         | v3 (test)                                                                                                                                                |

- `@heroui-pro/react` 1.0.0-beta.6 is installed with **0 imports** anywhere. First import will require `HEROUI_AUTH_TOKEN` in CI (MEMORY: heroui-pro delivery model).
- **Lookalike trap:** `heroui-chip.tsx` (CVA + `@radix-ui/react-slot`, stale docstring claims "Real @heroui/react Chip primitive"), `heroui-switch.tsx` (plain button+span, docstring honestly says "no @heroui/react dependency"), `heroui-tabs.tsx` (`@radix-ui/react-tabs`) — all three have **no HeroUI dependency**. The audit's HeroUI-conformance rows must be keyed on actual imports, not `heroui-` filenames.

### v3-removed components (AUDIT-03)

- Grep for `import {…(Navbar|Snippet|User|Spacer|Image|Code|Autocomplete|DateInput)…} from '@heroui/react'` across `frontend/src`: **0 hits** (exit 1). Confirmation holds.
- Official removed list per HeroUI incremental-migration docs is **7 names: Code, Image, Navbar, Ripple, Snippet, Spacer, User** — replaced with native HTML [CITED: heroui.com/en/docs/react/migration/incremental-migration]. The project's 8-name list adds Autocomplete + DateInput and omits Ripple.
- **`Autocomplete` EXISTS as an export in installed `@heroui/react` 3.0.5** (`dist/components/autocomplete/index.d.ts` declares it) — so "removed in v3" is stale for that name; an import of it would compile. The confirmation the audit records is "0 imports of any of the 8 listed names (+ Ripple, cheap to add)" — import-evidence, not removal claims. `[VERIFIED: node_modules dist inspection]`

### The 8 Aceternity-styled components (AUDIT-04)

All in `components/forms/`. "Aceternity" = a `variant="aceternity"` prop + `motion/react` usage — no library import (ban is live and CI-enforced).

| Component                     | Aceternity marker                     | Live call sites outside `components/forms/`                                                                                                                                                                       | ARIA attr/role count |
| ----------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `FormInputAceternity.tsx`     | named + variant prop                  | **0**                                                                                                                                                                                                             | 4                    |
| `FormTextareaAceternity.tsx`  | named + variant prop                  | **0**                                                                                                                                                                                                             | —                    |
| `FormSelectAceternity.tsx`    | named + variant prop                  | **0**                                                                                                                                                                                                             | —                    |
| `FormCheckboxAceternity.tsx`  | named + variant prop                  | **0**                                                                                                                                                                                                             | —                    |
| `FormRadioAceternity.tsx`     | named + variant prop                  | **0**                                                                                                                                                                                                             | —                    |
| `FormFieldWithValidation.tsx` | `variant?: 'default' \| 'aceternity'` | **0**                                                                                                                                                                                                             | 8                    |
| `SmartInput.tsx`              | `variant?: 'default' \| 'aceternity'` | **0**                                                                                                                                                                                                             | 6                    |
| `SearchableSelect.tsx`        | `variant?: 'default' \| 'aceternity'` | **0 direct — but LIVE via `UserPicker`** (which is imported by `tasks/TaskEditDialog.tsx`, `dossier/AddToDossierDialogs.tsx`, `dossier/wizard/steps/OrgDetailsStep.tsx`, `work-creation/forms/TaskQuickForm.tsx`) | 13                   |

- The forms barrel `components/forms/index.ts` exports all 8 but **nothing imports the barrel**. Symbol-level grep across `frontend/src` + `tests/` confirmed zero external references to all 8 names.
- The two live files in `components/forms/` are `UserPicker.tsx` (wraps SearchableSelect) and `ContextualHelp.tsx` (`FieldLabelWithHelp`, used by wizard steps). `ContextualHelp` uses only `ui/` primitives — no Aceternity dependency.
- Contract shape observed in `FormInputAceternity` (representative): RHF `UseFormRegister`/`FieldError` props, rotating-placeholder `setInterval` animation, `isRTL`-conditional `ps-12`/`pe-12` icon spacing, error-conditional border/focus-ring classes, hard-coded Aceternity shadow literals (inside the `components/ui`-adjacent ESLint carve-out zone), `motion/react` `AnimatePresence` error reveal.
- `motion/react` is imported by 18 of 22 files in `forms/` and 36 files repo-wide — motion usage is NOT unique to the 8 and must not be used as the Aceternity discriminator.

### Aceternity-derived `ui/` primitives (AUDIT-01 relevant, distinct from the 8)

Classic Aceternity-lineage files in `components/ui/` and their importer counts: `animated-tooltip` 0, `background-boxes` 0, `moving-border` 0, `floating-dock` 0, `layout-grid` 0, `placeholders-and-vanish-input` 0, `text-generate-effect` 0, `expandable-card` 0, `world-map` **1** (`geographic-visualization/WorldMapVisualization.tsx`). Eight more dead files the classification should mark and the ~74-literal ESLint carve-out decision (Phase 77 TOKEN-06) should note.

### Domain-signal file sets (keep-custom defaults, success criterion 5)

- **Clearance** (10 files): `calendar/CalendarEntryForm.tsx`, `copilot/CopilotSurface.tsx`, `intelligence/GenerateDigestButton.tsx`, `dossier/tabs/DossierSignalsTab.tsx`, `signals/SignalsQueue.tsx`, `signals/EscalateSignalDialog.tsx`, `signals/CaptureSignalForm.tsx`, `entity-links/EntityLinkManager.tsx` (+2 test files).
- **Flags/glyphs** (13 files incl. tests): `signature-visuals/DossierGlyph.tsx` + 5 tests, `list-page/DossierTable.tsx`, `calendar/CalendarEventPill.tsx`, `intelligence/AlertRuleRow.tsx`, `intelligence/DigestCard.tsx`, `intelligence/DigestsTab.tsx`, `dossier/ExpandableDossierCard.tsx`, `dossier/DossierDrawer/RecentActivitySection.tsx`.
- **Dossier-type logic**: 62 files (`DossierType|dossier_type|getDossierRouteSegment`) — list via the evidence command, too long to inline.
- **RTL directionality — the breadth problem**: 397 of 799 files match `isRTL|dir={|getDocDir|i18n.dir`; 358 use `useDirection`/`getDocDir`; 94 set a `dir=` attribute; 30 use `LTRIsolate`/rtl-wrapper. A literal reading of "touching RTL directionality" defaults half the tree to keep-custom and collapses the audit's information value. See Open Question 2 and the recommended narrow operationalization under Architecture Patterns.

### Evidence tooling available

ripgrep 15.1.0, pnpm 10.29.1, node v22/v24, `pnpm --dir frontend type-check` (`tsc --noEmit`), root `eslint.config.mjs` (Aceternity ban + palette-literal rule with `components/ui/**` carve-out at lines ~225/236), Vitest, Playwright. Knowledge-graph dashboard (Understand-Anything) is **not currently running** (curl → connection refused); relaunch via `./frontend/src/.understand-anything/start-dashboard.sh` (token-pinned URL in CLAUDE.md). `graphify-out/graph.json` exists but is stale (built 2026-06-11 from commit `3e312219`); `.planning/graphs/graph.json` (GSD graphify) does not exist.

## Standard Stack

**No new libraries.** This phase's "stack" is evidence tooling — all present and verified locally:

### Core

| Tool                                          | Version                       | Purpose                                                                                             | Why Standard                                                         |
| --------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| ripgrep (`rg`)                                | 15.1.0 [VERIFIED: local]      | Import/usage evidence for all four audits                                                           | Fast, exact, reproducible evidence commands                          |
| TypeScript (`pnpm --dir frontend type-check`) | 5.9.x [VERIFIED: repo script] | Mechanical AUDIT-02 proof — every HeroUI call site type-checks against installed 3.0.5 declarations | A green `tsc --noEmit` is stronger than any grep for API conformance |
| ESLint (root `eslint.config.mjs`)             | repo-pinned                   | Confirms the Aceternity ban + carve-out state referenced in classification notes                    | Already CI-enforced                                                  |
| git                                           | —                             | Blame/history for contract provenance in AUDIT-04                                                   | —                                                                    |

### Supporting

| Tool                                                 | Purpose                                                     | When to Use                                                                        |
| ---------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Understand-Anything dashboard (`start-dashboard.sh`) | Per-file dependency queries during classification           | Optional accelerator; restart first — currently down                               |
| `graphify-out/GRAPH_REPORT.md`                       | Community/hub orientation of the component tree             | Treat relationships as approximate (3 weeks stale, commit `3e312219`)              |
| HeroUI MCP servers (`heroui-react`, `heroui-pro`)    | Component docs for replace-with-primitive candidate columns | Available in the executor environment per repo MCP config                          |
| `heroui.com/llms.txt` + `/react/llms-components.txt` | Auth-free OSS component index fallback                      | If MCPs unavailable [ASSUMED — from MEMORY, fetched 2026-07-02 in a prior session] |

### Alternatives Considered

| Instead of               | Could Use                          | Tradeoff                                                                                                  |
| ------------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| ripgrep evidence scripts | react-scanner / dependency-cruiser | New dev-dependencies for a one-shot audit; violates "no packages" posture of a docs-only phase — rejected |
| Manual contract capture  | Storybook-driven inspection        | Storybook deferred by ADR-006 — rejected                                                                  |

**Installation:** none.

## Package Legitimacy Audit

**No packages are installed by this phase.** slopcheck not run — not applicable. All tooling above is already present in the repo or on the machine (verified via `command -v` / `package.json` scripts this session). If the planner adds any helper dependency (not recommended), it must pass the Package Legitimacy Gate first.

## Architecture Patterns

### Recommended artifact set (planner's choice — this is the recommendation)

Three markdown artifacts in the phase directory, one per downstream consumer boundary:

```
.planning/phases/75-ui-component-migration-audit/
├── 75-AUDIT-classification.md      # AUDIT-01 — consumed by Phases 76 (RTL surface), 77 (TOKEN-06 scope)
├── 75-AUDIT-heroui-confirmation.md # AUDIT-02 + AUDIT-03 — consumed by Phase 78 (bump + regression sweep)
└── 75-AUDIT-aceternity-contracts.md# AUDIT-04 — consumed by Phase 79 (rebuild-or-delete)
```

Rationale: AUDIT-02 and AUDIT-03 share one consumer (Phase 78) and one evidence style (import greps + type-check) — one file. AUDIT-01 and AUDIT-04 have different consumers and different row schemas. Markdown tables (not CSV) — downstream GSD planners read markdown, and `commit_docs: true` versions them.

### Pattern 1: Two-tier classification granularity (AUDIT-01)

**What:** Classify per-file ONLY where primitive-replace is plausible — `components/ui/` (74 files) and `components/forms/` (22 files). Classify per-directory everywhere else (~95 directories), with per-file exception rows only where a directory splits.
**Why:** 700 per-file rows is audit theater. Feature directories (`dossier/`, `signals/`, `intelligence/`, …) are domain surfaces that classify keep-custom almost by definition under criterion 5; the genuinely contestable rows live in `ui/` + `forms/`.
**Row schema (fixed by success criteria):**

```markdown
| Surface | Classification | Domain signals (clearance/RTL/flags/dossier-type) | Behaviors the primitive must preserve | Evidence |
| ------- | -------------- | ------------------------------------------------- | ------------------------------------- | -------- |
```

Enforcement rule baked into the template: a `replace-with-shadcn-primitive` row with an empty "behaviors" cell is **invalid** — downgrade to keep-custom (criterion 1). Domain-signal hits (criterion 5) force keep-custom or shadcn-block-with-domain-wrapper regardless of how generic the surface looks.

**RTL operationalization (recommended narrow reading):** "touching RTL directionality" = the component _owns_ direction — it sets a `dir=` attribute (94 files), implements direction-conditional positioning/animation/portal logic, or is RTL infrastructure (`rtl-wrapper/`, `ui/ltr-isolate.tsx`, `modern-nav/` direction logic). Mere `isRTL` consumption for icon flips/logical spacing (the other ~300 files) does NOT force keep-custom — instead the RTL behavior goes into the "behaviors to preserve" cell. Without this narrowing, 397/799 files default keep-custom and the audit tells Phase 76/77 nothing. Flag this reading explicitly in the artifact header so the criterion-5 audit trail is honest.

### Pattern 2: Confirmation-artifact structure (AUDIT-02/03)

Record for each check: the exact command, the raw result (file list or 0-hit exit code), the date, and the interpretation. This matches the CONTEXT.md requirement ("evidence-backed, not vibes") and makes Phase 78's re-run trivial (same commands, expect same output). Include the two conformance nuances (flat-named subcomponent exports are v3; `heroui-*` filename ≠ HeroUI usage) so Phase 78's sweep doesn't false-positive.

### Pattern 3: Per-component contract capture (AUDIT-04)

One section per component, fields derived from what the files actually contain:

- **Liveness:** call-site list (or "0 — dead code, barrel-only export") + the evidence command
- **RHF wiring:** `register`/`FieldError` prop contract, ref chain, error display path (incl. server-echoed errors — PITFALLS.md P7 nuance)
- **Zod linkage:** where the schema lives at the (dead or live) call sites
- **ARIA:** `aria-invalid`, `aria-describedby`, `role="alert"`/`aria-live` error announcement, label association (counts measured: SearchableSelect 13, FormFieldWithValidation 8, SmartInput 6, FormInputAceternity 4)
- **Keyboard/focus:** tab order, focus-visible treatment, combobox keyboard nav (SearchableSelect), Escape/blur handling
- **RTL:** `isRTL`-conditional spacing (`ps-12`/`pe-12`), icon-side logic
- **Animation-only behavior** (explicitly non-contractual): rotating placeholders, motion reveals — record so Phase 79 knows what it may drop

For SearchableSelect, additionally capture the `UserPicker` façade contract (its 4 consumers bind through UserPicker's props, not SearchableSelect's).

### Anti-Patterns to Avoid

- **Classification by filename or docstring:** `heroui-chip.tsx` lies about its implementation. Classify by imports and rendered output.
- **Barrel-presence as liveness:** `forms/index.ts` exports everything and is imported by nothing. Liveness = symbol-level grep.
- **Re-opening the v2→v3 migration narrative:** CONTEXT.md explicitly forbids it; AUDIT-02/03 are confirmations with evidence, scoped to hours not days.

## Don't Hand-Roll

| Problem                     | Don't Build                     | Use Instead                                                                | Why                                                                                                             |
| --------------------------- | ------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Import/dependency graph     | A custom AST walker script      | ripgrep symbol greps + (optionally) the existing knowledge-graph dashboard | Evidence commands in this doc already answer every liveness question; a new tool is scope creep in a docs phase |
| v3 API conformance proof    | Per-call-site manual API review | `pnpm --dir frontend type-check` against installed 3.0.5 types             | The compiler checks every call site mechanically; manual review only for the 8 import sites' patterns           |
| Component inventory tooling | react-scanner/storybook harness | The per-directory `find` counts + `COMPONENT_REGISTRY.md` seed             | No new dev-deps; registry already covers `ui/` naming                                                           |

**Key insight:** every audit question in this phase reduces to "who imports X" or "does this name exist in the installed package" — both are solved by tools already on the machine.

## Common Pitfalls

### Pitfall 1: Over-classifying toward primitive-replace (milestone PITFALLS.md P8)

**What goes wrong:** Generic-looking cards/rows/badges encode clearance gating, RTL chevrons, DossierGlyph flags, `sensitivity_level <= clearance` visual gating.
**How to avoid:** Domain-signal file lists above are pre-computed; criterion-5 default is keep-custom; empty behavior lists downgrade automatically.
**Warning signs:** A classification pass that produces mostly "replace" rows in feature directories.

### Pitfall 2: False-flagging v3 flat-named subcomponent exports as "flat-prop" call sites

**What goes wrong:** A naive AUDIT-02 grep for missing dot-notation flags `TweaksDrawer.tsx` (`DrawerBackdrop`, `DrawerContent`, …) as pre-3.x usage.
**Why it happens:** v3 ships both spellings; the removed pattern is v2's prop-driven monolith (`<Modal title isOpen>` with content props), not named subcomponent imports.
**How to avoid:** Verified this session: `dist/components/drawer/index.d.ts` exports exactly those names. Record both spellings as conformant in the artifact.

### Pitfall 3: Trusting `heroui-*` filenames or docstrings

**What goes wrong:** `heroui-chip.tsx` claims to wrap the real HeroUI Chip; it is CVA+Slot. `heroui-switch.tsx`/`heroui-tabs.tsx` are also HeroUI-free.
**How to avoid:** Key all HeroUI rows on the verified 8-file import list. Flag the stale chip docstring in the artifact (a Phase 78 cleanup candidate, not a Phase 75 edit).

### Pitfall 4: Propagating stale prior claims into the audit

**What goes wrong:** Several upstream docs contain claims now falsified: STACK.md says `ValidationDemoPage.tsx` consumes the 8 (deleted); PITFALLS.md says "5 Aceternity components" in places (it is 8); the requirement's removed list includes `Autocomplete`, which exists in installed 3.0.5; `COMPONENT_REGISTRY.md`'s HeroUI table is "(To-do)".
**How to avoid:** The audit regenerates ALL evidence fresh with the commands below; prior docs are orientation, never evidence.

### Pitfall 5: Capturing contracts without liveness context

**What goes wrong:** AUDIT-04 writes 8 detailed contracts implying 8 rebuilds; Phase 79 then rebuilds dead code.
**How to avoid:** Requirement says capture contracts — do it — but each contract leads with its liveness evidence. 7 of 8 are dead; SearchableSelect's real contract is UserPicker's façade. The rebuild-vs-delete decision belongs to Phase 79 planning (with the user), armed with this evidence.

### Pitfall 6: Knowledge-graph over-trust

**What goes wrong:** Dashboard is down; graphify graph is 3 weeks stale (pre-dates PRs #88/#89 route cleanup and #93 HeroUI Pro install).
**How to avoid:** Use graphs for orientation only; every classification/liveness cell cites a fresh grep.

## Code Examples

Evidence commands — all run and verified this session; the plan should embed them verbatim in task verification steps (run from repo root).

### AUDIT-02: HeroUI import inventory + conformance

```bash
# Complete import-site list (expect the 8 files listed in Ground Truth)
rg -l "@heroui/react" frontend/src --type ts --type tsx 2>/dev/null || \
  grep -rln "@heroui" --include="*.tsx" --include="*.ts" frontend/src | grep -v node_modules

# Mechanical v3-conformance proof (expect exit 0)
pnpm --dir frontend type-check

# Compound-usage spot-check across the required wrappers (Card/Checkbox/Switch/Modal)
grep -rn "Modal\.\|Checkbox\.\|Switch\.\|Card\." \
  frontend/src/components/ui/heroui-modal.tsx frontend/src/components/ui/heroui-forms.tsx frontend/src/components/ui/heroui-card.tsx
```

### AUDIT-03: v3-removed component confirmation (expect 0 hits, exit 1)

```bash
grep -rnE "import\s*\{[^}]*\b(Navbar|Snippet|User|Spacer|Image|Code|Autocomplete|DateInput|Ripple)\b[^}]*\}\s*from\s*['\"]@heroui/react['\"]" \
  --include="*.tsx" --include="*.ts" frontend/src ; echo "exit=$? (1 = confirmed unused)"
```

### AUDIT-04: per-component liveness (expect 0 for all but SearchableSelect-via-UserPicker)

```bash
for c in FormInputAceternity FormTextareaAceternity FormSelectAceternity FormCheckboxAceternity \
         FormRadioAceternity FormFieldWithValidation SearchableSelect SmartInput; do
  echo -n "$c: "
  grep -rl "\b$c\b" --include="*.tsx" --include="*.ts" frontend/src tests 2>/dev/null \
    | grep -v "frontend/src/components/forms/" | wc -l | tr -d ' '
done
# UserPicker (the live SearchableSelect façade) consumers:
grep -rln "components/forms/UserPicker" --include="*.tsx" frontend/src | grep -v components/forms
```

### AUDIT-01: domain-signal sets and tree shape

```bash
cd frontend/src/components
find . -type f \( -name "*.tsx" -o -name "*.ts" \) | wc -l                      # 799
find . -name "*.test.tsx" -o -name "*.test.ts" | wc -l                          # 99
grep -rl "clearance" --include="*.tsx" .                                        # 10 files
grep -rlE "DossierGlyph|FlagCodes|flags/" --include="*.tsx" .                   # 13 files
grep -rlE "DossierType|dossier_type|getDossierRouteSegment" --include="*.tsx" . | wc -l  # 62
grep -rlE 'dir=\{|dir="rtl"|dir="ltr"' --include="*.tsx" . | wc -l              # 94 (dir-owners)
```

### Aceternity-derived ui/ primitive liveness

```bash
cd frontend/src
for c in animated-tooltip background-boxes moving-border floating-dock layout-grid \
         placeholders-and-vanish-input text-generate-effect world-map expandable-card; do
  echo -n "$c: "; grep -rl "ui/$c" --include="*.tsx" --include="*.ts" . | grep -v "components/ui/$c" | wc -l | tr -d ' '
done   # all 0 except world-map: 1
```

## State of the Art

| Old Approach                                       | Current Approach                                                                                                     | When Changed                                                 | Impact                                                                |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| HeroUI v2 prop-driven monoliths + `HeroUIProvider` | v3 compound components (dot-notation AND flat-named subcomponent exports), no provider, React Aria base, Tailwind v4 | v3 GA 2026 [CITED: infoq.com/news/2026/07/heroui-v3-rewrite] | This tree is already fully v3 — AUDIT-02 is a confirmation            |
| v2 Autocomplete/DateInput                          | v3 ComboBox / DateField (+ a new v3 `Autocomplete` export present in 3.0.5)                                          | v3 line                                                      | "Removed" list nuance documented above                                |
| `@heroui/react` 3.0.5 (installed)                  | 3.2.1 (latest) [VERIFIED: npm view, 2026-07-02]                                                                      | —                                                            | Phase 78's bump target confirmed still-current; not this phase's work |

**Deprecated/outdated:** Bureau/IntelDossier visual spec (`frontend/DESIGN.md`) is the outgoing design; classification notes reference behavior, never Bureau chrome, as the preservation target.

## Assumptions Log

| #   | Claim                                                                                                                                                    | Section                     | Risk if Wrong                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------- |
| A1  | `heroui.com/llms.txt` and `/react/llms-components.txt` remain valid auth-free doc indexes                                                                | Standard Stack (supporting) | Low — MCP servers are the primary path; fallback only                                                    |
| A2  | `pnpm --dir frontend type-check` is currently green on `main` (not re-run this session — ~minutes runtime; CI required-checks imply green at last merge) | AUDIT-02 evidence           | Low — the executor runs it as a task step; if red, failures are pre-existing and get triaged, not hidden |
| A3  | HeroUI Pro catalog mapping (MEMORY reference, fetched 2026-07-02) is accurate for the "candidate replacement" advisory columns                           | Architecture Patterns       | Low — advisory only; Phase 79 re-verifies against MCP docs before any rebuild                            |

All other claims in this document are `[VERIFIED: session commands]` or `[CITED]` as tagged inline.

## Open Questions (RESOLVED)

1. **Does the 7-of-8-dead finding change AUDIT-04's deliverable?**
   - What we know: the requirement mandates contract capture for all 8; 7 have zero consumers; Phase 79's ROADMAP still says "rebuilt on HeroUI v3/Radix."
   - What's unclear: whether Phase 79 becomes delete-not-rebuild for the dead 7.
   - Recommendation: capture all 8 contracts as required, lead each with liveness evidence, and add an explicit "Phase 79 rescope input" note in the artifact. Do NOT rescope Phase 79 in this phase — that is a user decision at Phase 79 planning.
   - RESOLVED: adopted by plan 75-03 — every contract leads with liveness evidence and Task 3 writes the exact-heading "Phase 79 rescope input" section; Phase 79 rescoping stays a user decision at Phase 79 planning.

2. **RTL keep-custom trigger breadth.**
   - What we know: literal reading → 397/799 files default keep-custom; narrow reading (direction-owners) → 94 files + infra.
   - What's unclear: which reading the success-criterion author intended.
   - Recommendation: planner adopts the narrow reading, states it in the artifact header, and routes consumed-RTL behavior into the "behaviors to preserve" cells. This preserves criterion-5 safety intent without collapsing the audit. If the plan-checker objects, the fallback is the literal reading with a "keep-custom (RTL-consumer)" sub-label so Phases 76/77 can still see the real surface.
   - RESOLVED: adopted by plan 75-01 — the classification artifact header states the narrow direction-owner reading (rulebook item d) with an explicit note that it resolves this question, and consumed-RTL behavior routes into the "Behaviors to preserve" cells.

3. **Classification of the 8 dead Aceternity-derived `ui/` primitives** (moving-border, background-boxes, …).
   - What we know: 0 importers each (world-map has 1); some are path-banned in ESLint already.
   - Recommendation: classify as keep-custom-pending-deletion or a fourth advisory label `dead — delete candidate` in the notes column (taxonomy itself is fixed at 3; use the notes column, don't extend the taxonomy).
   - RESOLVED: adopted by plans 75-01 (row schema: advisory labels live in Notes only, taxonomy never extended) and 75-04 (dead Aceternity-derived primitives classified keep-custom with a "dead — delete candidate" Notes advisory backed by fresh 0-importer evidence; world-map excepted with 1 importer).

## Environment Availability

| Dependency                              | Required By              | Available           | Version                                | Fallback                                                                      |
| --------------------------------------- | ------------------------ | ------------------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| ripgrep                                 | evidence commands        | ✓                   | 15.1.0                                 | grep (BSD, verified working)                                                  |
| pnpm                                    | type-check/lint evidence | ✓                   | 10.29.1                                | —                                                                             |
| node                                    | tooling                  | ✓                   | v22.23.1 / v24.9.0 (nvm)               | —                                                                             |
| `pnpm --dir frontend type-check` script | AUDIT-02                 | ✓                   | `tsc --noEmit` (frontend/package.json) | —                                                                             |
| root `eslint.config.mjs`                | ban/carve-out citations  | ✓                   | —                                      | —                                                                             |
| Understand-Anything dashboard           | optional dep queries     | ✗ (not running)     | —                                      | `./frontend/src/.understand-anything/start-dashboard.sh` relaunch, or ripgrep |
| graphify graph (`.planning/graphs/`)    | GSD graph queries        | ✗ (absent)          | —                                      | `graphify-out/` (stale 2026-06-11) or ripgrep                                 |
| HeroUI MCP servers                      | primitive-candidate docs | ✓ (repo MCP config) | —                                      | `heroui.com/llms.txt`                                                         |

**Missing dependencies with no fallback:** none — the phase can execute entirely on ripgrep + tsc.

## Validation Architecture

> `workflow.nyquist_validation: true` — section included. This is a docs-only phase: the "tests" are the reproducible evidence commands; no unit tests are written.

### Test Framework

| Property           | Value                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Framework          | Evidence commands (bash/ripgrep/tsc) — no new test files; Vitest/Playwright exist but are not exercised by this phase |
| Config file        | n/a                                                                                                                   |
| Quick run command  | the per-requirement evidence commands (Code Examples section), each < 10s except type-check                           |
| Full suite command | all evidence commands + `pnpm --dir frontend type-check`                                                              |

### Phase Requirements → Test Map

| Req ID   | Behavior                                                 | Test Type                    | Automated Command                                                                                                                                            | File Exists?    |
| -------- | -------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| AUDIT-01 | Every surface classified; counts reconcile with the tree | doc-completeness check       | `find frontend/src/components -type f \( -name "*.tsx" -o -name "*.ts" \) ! -name "*.test.*" \| wc -l` vs. rows covered (per-dir rows expand to file counts) | ✅ command-only |
| AUDIT-02 | 8-file import list + type-check green recorded           | evidence re-run              | import grep + `pnpm --dir frontend type-check`                                                                                                               | ✅ command-only |
| AUDIT-03 | 0 imports of removed names recorded                      | evidence re-run              | removed-names grep, expect exit 1                                                                                                                            | ✅ command-only |
| AUDIT-04 | 8 contracts captured, each with liveness evidence        | doc review + liveness re-run | per-component liveness loop (expect 0×7 + UserPicker chain)                                                                                                  | ✅ command-only |

### Sampling Rate

- **Per task commit:** re-run the evidence command(s) for the artifact touched; paste raw output into the artifact.
- **Per wave merge:** all four evidence blocks re-run once.
- **Phase gate:** artifacts exist, every classification row non-empty per the downgrade rule, evidence outputs dated.

### Wave 0 Gaps

None — existing tooling covers all phase requirements; no test files, fixtures, or framework installs needed.

## Security Domain

> `security_enforcement` not set in config → treated as enabled. Scope is narrow for a docs-only phase.

### Applicable ASVS Categories

| ASVS Category         | Applies                       | Standard Control                                                                                                                                                                                                                              |
| --------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no                            | no code changes                                                                                                                                                                                                                               |
| V3 Session Management | no                            | no code changes                                                                                                                                                                                                                               |
| V4 Access Control     | **yes (documentation-level)** | criterion 5: clearance-touching components (10-file list above) MUST classify keep-custom/domain-wrapper — the classification itself is the control that prevents later phases from silently dropping `sensitivity_level <= clearance` gating |
| V5 Input Validation   | yes (documentation-level)     | AUDIT-04 contracts preserve the RHF/Zod validation + error-announcement chain so Phase 79 cannot regress it invisibly                                                                                                                         |
| V6 Cryptography       | no                            | —                                                                                                                                                                                                                                             |

### Known Threat Patterns for this phase

| Pattern                                                                  | STRIDE                              | Standard Mitigation                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audit doc leaks gated-payload vocabulary into a place it must not appear | Information Disclosure              | Planning docs are internal; the "indistinguishable-empty" rule (no `clearance`/`filtered`/`restricted` substrings) applies to **gated RPC payloads**, not planning docs — no conflict, but the artifact should not embed live data samples from gated RPCs |
| Misclassification drops clearance gating in Phase 77/79                  | Elevation of Privilege (downstream) | Pre-computed clearance file list + keep-custom default + behaviors-cell enforcement                                                                                                                                                                        |

## Sources

### Primary (HIGH confidence)

- Live-tree commands run 2026-07-02 (this session): file counts, import inventories, liveness greps, `node_modules/@heroui/react/dist` type-declaration inspection — the bulk of this document
- `npm view @heroui/react version` → 3.2.1 (2026-07-02)
- Repo artifacts: root `eslint.config.mjs`, `frontend/components.json`, `frontend/package.json`, `frontend/src/components/ui/COMPONENT_REGISTRY.md`, `.planning/{REQUIREMENTS,ROADMAP,STATE}.md`, `.planning/phases/75-ui-component-migration-audit/75-CONTEXT.md`

### Secondary (MEDIUM confidence)

- HeroUI incremental-migration docs [CITED: heroui.com/en/docs/react/migration/incremental-migration] — official v3-removed list (Code, Image, Navbar, Ripple, Snippet, Spacer, User)
- InfoQ, "HeroUI v3 Lands as a Ground-Up Rewrite" [CITED: infoq.com/news/2026/07/heroui-v3-rewrite]
- `.planning/research/{STACK,PITFALLS,SUMMARY}.md` (milestone research, 2026-07 — used for orientation; two stale claims corrected herein)
- MEMORY references: `reference_heroui_pro_catalog_v8_mapping`, `project_heroui_pro_installed_delivery_model`, `project_v8_preexec_review_durable_facts`

### Tertiary (LOW confidence)

- None load-bearing.

## Metadata

**Confidence breakdown:**

- Ground-truth inventory (counts, import lists, liveness): HIGH — every number reproduced by a command in this session
- HeroUI v3 API facts: HIGH — verified against installed package dist types + official migration docs
- Artifact-format / granularity recommendations: MEDIUM — planner discretion per CONTEXT.md; recommendations are opinionated but reversible
- RTL-trigger operationalization: MEDIUM — flagged as Open Question 2; requires a stated reading in the artifact

**Research date:** 2026-07-02
**Valid until:** 2026-07-16 (tree-shape numbers drift with every merged PR; re-run the evidence commands at plan execution — they are cheap)
