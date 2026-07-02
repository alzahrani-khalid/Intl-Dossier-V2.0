# Phase 75 — HeroUI v3 Confirmation (AUDIT-02 + AUDIT-03)

**Scope:** AUDIT-02 (HeroUI usage confirmed on the v3 compound-component API; residual flat-prop call sites — expected none) and AUDIT-03 (v3-removed component names confirmed unused; regressions get replacement plans). Confirmation artifact for **Phase 78** (`@heroui/react` 3.0.5 → 3.2.1 bump + regression sweep). CONTEXT.md forbids re-opening a v2→v3 migration narrative — this is a confirmation with evidence, not a hunt.

**Evidence style (RESEARCH Pattern 2):** every verdict pairs the exact command + its raw output + the date + a one-line interpretation + a machine-readable summary line. Phase 78 re-runs the same commands and expects the same output.

**Measured:** 2026-07-02, against the working tree at base commit `228ce049` (post-PR #93). Installed `@heroui/react` version: **3.0.5** (resolved via the pnpm store; `node_modules/.pnpm/@heroui+react@3.0.5_.../node_modules/@heroui/react`).

**Docs-only phase:** no production code changes. The stale `heroui-chip.tsx` docstring is FLAGGED here for Phase 78 cleanup — not edited in Phase 75.

<!-- FINDINGS-SUMMARY-ANCHOR -->

---

## AUDIT-02 — HeroUI v3 import inventory

### Command (the definition of an import site)

```bash
grep -rlnE "from ['\"]@heroui/react['\"]" --include='*.tsx' --include='*.ts' frontend/src
```

### Raw output (2026-07-02)

```
frontend/src/components/ui/heroui-skeleton.tsx
frontend/src/components/ui/heroui-forms.tsx
frontend/src/components/ui/heroui-modal.tsx
frontend/src/components/ui/heroui-button.tsx
frontend/src/components/ui/heroui-card.tsx
frontend/src/components/layout/AppShell.tsx
frontend/src/components/layout/ConcurrentDrawers.test.tsx
frontend/src/components/tweaks/TweaksDrawer.tsx
```

**Import-site count: 8**

The live list equals the RESEARCH-expected 8 files exactly — no delta.

### Why the import-specific grep, not a text match

The `from '@heroui/react'` regex is the definition of an import site. The RESEARCH text-match fallback (`grep -rln "@heroui" ...`) over-counts to **12** by picking up comment/docstring-only mentions:

```bash
grep -rln "@heroui" --include="*.tsx" --include="*.ts" frontend/src | grep -v node_modules
```

```
frontend/src/main.tsx                                  # comment mention only
frontend/src/components/ui/heroui-skeleton.tsx         # real import
frontend/src/components/ui/heroui-forms.tsx            # real import
frontend/src/components/ui/heroui-modal.tsx            # real import
frontend/src/components/ui/heroui-button.tsx           # real import
frontend/src/components/ui/heroui-card.tsx             # real import
frontend/src/components/ui/heroui-switch.tsx           # docstring mention only (lookalike — see Nuance 2)
frontend/src/components/ui/heroui-chip.tsx             # STALE docstring mention only (lookalike — see Nuance 2)
frontend/src/components/dossier/wizard/StepGuidanceBanner.tsx  # comment mention only
frontend/src/components/layout/AppShell.tsx            # real import
frontend/src/components/layout/ConcurrentDrawers.test.tsx  # real import (test)
frontend/src/components/tweaks/TweaksDrawer.tsx        # real import
```

The 4 extras (`main.tsx`, `heroui-switch.tsx`, `heroui-chip.tsx`, `StepGuidanceBanner.tsx`) are text mentions, not imports. Phase 78 must use the import-specific grep — the text match would also drift when the stale `heroui-chip.tsx` docstring is cleaned.

### Import inventory (8 sites, with API-style verdict)

| File                                           | What it imports                                                                                  | API style                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `components/ui/heroui-button.tsx`              | `Button` (aliased `HeroUIButtonPrimitive`)                                                       | v3                                                                                                            |
| `components/ui/heroui-card.tsx`                | `Card` (aliased `HeroUICardPrimitive`)                                                           | v3 compound (`Card.Root/.Header/.Title/.Description/.Content/.Footer`)                                        |
| `components/ui/heroui-forms.tsx`               | `TextField, Input, TextArea, Label, Description, FieldError, Select, Checkbox, Switch`           | v3 compound (`Checkbox.Control/.Indicator`, `Switch.Control/.Thumb` verified below)                           |
| `components/ui/heroui-modal.tsx`               | `Modal, Button, useOverlayState`                                                                 | v3 compound (`Modal.Backdrop/.Container/.Dialog/.Header/.Heading/.Body/.Footer/.CloseTrigger` verified below) |
| `components/ui/heroui-skeleton.tsx`            | `Skeleton` (aliased `HeroUISkeletonPrimitive`)                                                   | v3                                                                                                            |
| `components/layout/AppShell.tsx`               | `Drawer, useOverlayState`                                                                        | v3                                                                                                            |
| `components/tweaks/TweaksDrawer.tsx`           | `Drawer, DrawerBackdrop, DrawerContent, DrawerDialog, DrawerHeader, DrawerBody, useOverlayState` | v3 **flat-named subcomponent exports** (conformant — see Nuance 1)                                            |
| `components/layout/ConcurrentDrawers.test.tsx` | `Drawer`                                                                                         | v3 (test)                                                                                                     |

**Residual flat-prop (v2 monolith) call sites: none.** Every site uses either a bare v3 component, dot-notation compound API, or v3 flat-named subcomponent exports.

---

## AUDIT-02 — Compound-usage spot-check (Card / Checkbox / Switch / Modal)

### Command (RESEARCH Code Examples, verbatim)

```bash
grep -rn "Modal\.\|Checkbox\.\|Switch\.\|Card\." \
  frontend/src/components/ui/heroui-modal.tsx \
  frontend/src/components/ui/heroui-forms.tsx \
  frontend/src/components/ui/heroui-card.tsx
```

### Raw output (2026-07-02, trimmed to the load-bearing lines)

```
heroui-modal.tsx:110:    <Modal.Backdrop
heroui-modal.tsx:115:      <Modal.Container size={size} placement={placement}>
heroui-modal.tsx:116:        <Modal.Dialog
heroui-modal.tsx:125:          {showCloseButton && <Modal.CloseTrigger />}
heroui-modal.tsx:143:    <Modal.Header ...>{children}</Modal.Header>
heroui-modal.tsx:157:    <Modal.Heading ...>
heroui-modal.tsx:184:  return <Modal.Body ...>{children}</Modal.Body>
heroui-modal.tsx:203:    <Modal.Footer
heroui-card.tsx:4:  * Real @heroui/react Card compound primitives (Card.Root / Card.Header / ...)
heroui-forms.tsx:201:      <HeroUICheckbox.Control className="mt-0.5">
heroui-forms.tsx:202:        <HeroUICheckbox.Indicator />
heroui-forms.tsx:257:      <HeroUISwitch.Control>
heroui-forms.tsx:258:        <HeroUISwitch.Thumb />
```

**Interpretation:** dot-notation compound API confirmed. `heroui-modal.tsx` renders the full `Modal.*` compound tree; `heroui-forms.tsx` renders `Checkbox.Control/.Indicator` and `Switch.Control/.Thumb` (imports aliased `Checkbox as HeroUICheckbox`, `Switch as HeroUISwitch`); `heroui-card.tsx` wraps `Card` and its `Card.*` subcomponents. All four ROADMAP-required wrappers are on the v3 compound API.

---

## AUDIT-02 — Mechanical conformance proof (type-check)

### Command

```bash
pnpm --dir frontend type-check   # tsc --noEmit
```

### Result (2026-07-02)

```
> intake-frontend@1.0.0 type-check
> tsc --noEmit

<no output>
```

**Type-check: exit 0**

`tsc --noEmit` is the strongest available conformance proof: the compiler checks every one of the 8 HeroUI call sites against the installed 3.0.5 `.d.ts` declarations. Exit 0 means no call site uses an API the installed package does not declare — no `### Type-check triage` needed (RESEARCH assumption A2 held: the tree is green).

**Execution transparency:** this worktree shares no `frontend/node_modules` (Claude Code worktree), so the type-check was run in the main checkout, which is at the identical base commit `228ce049` with a clean `frontend/src` (this is a docs-only phase — no frontend source was touched). The result is therefore faithful to the audited tree. Phase 78 re-runs the same command from the repo root in an environment with `node_modules` installed.

---

## Nuance 1 — flat-named subcomponent exports are v3 (not a v2 straggler)

A naive AUDIT-02 grep for "missing dot-notation" would false-flag `TweaksDrawer.tsx`, which imports `DrawerBackdrop, DrawerContent, DrawerDialog, DrawerHeader, DrawerBody`. These are **legitimate v3 flat-named subcomponent aliases** — v3 ships both spellings (dot-notation `Drawer.Backdrop` and flat-named `DrawerBackdrop`). The removed v2 pattern is the prop-driven monolith (`<Modal title isOpen>` with content passed as props), which does not appear anywhere in the tree.

### Evidence

```bash
# resolved dist path (pnpm store):
#   node_modules/.pnpm/@heroui+react@3.0.5_.../node_modules/@heroui/react/dist/components/drawer/index.d.ts
grep -nE "DrawerBackdrop|DrawerContent|DrawerDialog|DrawerHeader|DrawerBody" <dist>/components/drawer/index.d.ts
```

```
2:import { DrawerBackdrop, DrawerBody, DrawerCloseTrigger, DrawerContent, DrawerDialog, DrawerFooter, DrawerHandle, DrawerHeader, DrawerHeading, DrawerRoot, DrawerTrigger } from "./drawer";
66:export { DrawerRoot, DrawerTrigger, DrawerBackdrop, DrawerContent, DrawerDialog, DrawerHeader, DrawerHeading, DrawerBody, DrawerFooter, DrawerHandle, DrawerCloseTrigger, };
```

Line 66 exports exactly the names `TweaksDrawer.tsx` imports. `DrawerBackdrop` and its siblings are v3-conformant; record both spellings as conformant so Phase 78's sweep does not false-positive.

---

## Nuance 2 — a `heroui-*` filename does not mean HeroUI usage

Three files carry the `heroui-` prefix but contain **no `@heroui/react` import** — they are HeroUI-styled lookalikes built on CVA / Radix. The HeroUI-conformance inventory must be keyed on actual imports, never on filenames or docstrings.

### Evidence

```bash
for f in heroui-chip.tsx heroui-switch.tsx heroui-tabs.tsx; do
  grep -nE "from ['\"]@heroui/react['\"]" "frontend/src/components/ui/$f" \
    && echo "HAS import" || echo "NO @heroui/react import"
done
```

```
frontend/src/components/ui/heroui-chip.tsx   -> NO @heroui/react import  (cva + @radix-ui/react-slot)
frontend/src/components/ui/heroui-switch.tsx -> NO @heroui/react import  (plain button + span)
frontend/src/components/ui/heroui-tabs.tsx   -> NO @heroui/react import  (@radix-ui/react-tabs)
```

**Stale docstring flag (Phase 78 cleanup candidate — NO code edits in Phase 75):** `heroui-chip.tsx` lines 1-5 claim it is a "Real @heroui/react Chip primitive":

```
/**
 * HeroUI Chip Wrapper (Badge replacement) — Phase 33-05 (Wave 3)
 *
 * Real @heroui/react Chip primitive. Preserves the shadcn-style `badgeVariants`
 * cva API and `asChild` branch used by existing Badge call sites.
```

The implementation is `cva` + `@radix-ui/react-slot` — the docstring is false. `heroui-switch.tsx`'s docstring is honest ("no @heroui/react dependency"). Phase 78 should correct the `heroui-chip.tsx` docstring during its sweep; Phase 75 flags it only.

---

## `@heroui-pro/react` — installed, zero imports

`@heroui-pro/react` **1.0.0-beta.6** is declared in `frontend/package.json` (line 43) and installed (PR #93), with **0 imports** anywhere in `frontend/src`:

```bash
grep -rln "@heroui-pro/react" --include="*.tsx" --include="*.ts" frontend/src | grep -v node_modules | wc -l
# -> 0
```

The **first** import of a Pro component will require `HEROUI_AUTH_TOKEN` in CI (Pro packages are delivered via an authenticated registry). Phase 78/79 must wire that secret before any Pro import lands, or CI will fail on install.
