# Phase 76: RTL Infrastructure Bridge & shadcn Logical Properties - Research

**Researched:** 2026-07-02
**Domain:** React direction management (i18n-driven RTL), Radix direction context, shadcn RTL CLI tooling, CI guard scripting
**Confidence:** HIGH (all codebase claims verified against the working tree 2026-07-02; shadcn/Radix claims verified against official docs + npm registry)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

(76-CONTEXT.md records no locked user decisions — all implementation choices are at Claude's discretion within the prescribed design below.)

### Claude's Discretion

All implementation choices are at Claude's discretion — infrastructure phase whose design is already prescribed by the re-scoped REQUIREMENTS and ROADMAP success criteria:

- Direction owner is derived from `i18n.language`/`useDirection()` and consolidates today's 4 scattered setters (LanguageProvider, `i18n/index.ts` side-effects, RTLWrapper, DesignProvider), bridged into both `<html>` and Radix's direction context — no dual-mechanism double-flip.
- The 68 per-field `dir="rtl"` inputs on Arabic-only (`_ar`) fields are explicitly retained — they are correct, not violations (do not "fix" them).
- Language toggle must flip `document.dir` AND every mounted Radix portal in the same frame; portals (Popover/Tooltip/Dropdown/Sheet/dossier drawer) animate from the inline-start edge in both languages.
- `pnpm dlx shadcn@latest migrate rtl` runs ONCE against `components/ui/**`, committed as a single reviewable diff; output is best-effort on the repo's `new-york` style — review, don't trust; never blindly re-run (upstream idempotency bug re-introduces duplicate `rtl:*` classes).
- Calendar, Pagination, Sidebar are CLI-exempt → manual RTL verification in Arabic.
- CI check fails the build on any `className` containing a duplicated `rtl:*` utility.

Verification tooling, file organization for the direction hook, and CI-check implementation are planner's choice. Phase 75 audit artifacts (`75-AUDIT-classification.md`) define the touched surface.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope (infrastructure path).

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                                                                                                                                   | Research Support                                                                                                                                                                                                                                                                     |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RTLB-01 | Layout/portal `dir` has exactly one owner (derived from `i18n.language`/`useDirection()`), consolidating 4 scattered setters, bridged into `<html>` and Radix direction context; the 68 per-field `dir="rtl"` inputs retained | "Current Direction Flow" + "Pattern 1: Single Direction Owner" — all 4 setters located with exact file:line; entry points (Topbar `setLocale`, SettingsPage `switchLanguage`) mapped; i18n already auto-persists `id.locale`; Radix `DirectionProvider` verified NOT installed today |
| RTLB-02 | Portal components (Popover/Tooltip/Dropdown/Sheet/dossier drawer) animate from the correct edge in both EN and AR                                                                                                             | "Pattern 3: Portal direction + animation" — tw-animate-css logical-slide bug confirmed current; repo's proven `ltr:`/`rtl:` paired-variant pattern in `ui/sheet.tsx` documented; DossierDrawer verified to ride `ui/sheet` `side="right"`                                            |
| SRTL-01 | `pnpm dlx shadcn@latest migrate rtl` runs once against `components/ui/**`, committed as a single diff, never re-run                                                                                                           | "Pattern 4: One-shot migrate rtl protocol" — CLI 4.12.0 verified on npm; idempotency bug (#9891) confirmed; exact expected-yield inventory of physical classes remaining in `ui/**`                                                                                                  |
| SRTL-02 | Calendar, Pagination, Sidebar (CLI-exempt) manually verified RTL-correct                                                                                                                                                      | "Pattern 5: CLI-exempt component verification" — all three ALREADY hand-patched in this repo (`rtl:rotate-180`, `rtl:-scale-x-100`, rdp chevron rotations); task is verify-no-regress, not patch-from-scratch                                                                        |
| SRTL-03 | CI check prevents duplicate `rtl:*` utility classes from re-appearing                                                                                                                                                         | "Pattern 6: CI duplicate-rtl guard" — exact-duplicate-token detection design (naive `rtl:.*rtl:` grep false-positives on legitimate `ui/sheet.tsx` lines); repo's `check-*.mjs` + positive-failure-fixture CI pattern documented                                                     |

</phase_requirements>

## Summary

This phase has two independent workstreams. **Workstream A (RTLB-01/02)** consolidates four scattered `document.documentElement.dir` writers into a single direction owner derived from `i18n.language`, and bridges that one value into Radix's direction context so portals (Popover/Tooltip/Dropdown/Sheet/dossier drawer) flip with the document in the same frame. All four setters were located and verified in the working tree: `LanguageProvider` (2 write sites), `i18n/index.ts` (3 write sites), `RTLWrapper` (1 effect writing `<html>` + `<body>` + a wrapper `<div dir>`), and `DesignProvider.setLocale` (1 write site + an async `import('@/i18n')` that makes today's flip multi-frame by construction). `@radix-ui/react-direction` is NOT currently installed; instead 8 `ui/` wrappers each pass `dir={dir ?? getDocDir()}` per-component — a workable but fragmented bridge that the phase replaces with one provider. [VERIFIED: codebase grep 2026-07-02]

**Workstream B (SRTL-01/02/03)** runs shadcn's `migrate rtl` exactly once over `components/ui/**` and installs a CI guard against duplicate `rtl:*` utilities. Two facts sharply reduce this workstream's size: (1) app code outside `components/ui/**` is already logical-properties-only (ESLint-enforced), and (2) the three CLI-exempt components (Calendar, Pagination, Sidebar) are **already hand-patched** with correct `rtl:` variants in this repo — SRTL-02 is a verification pass, not new work. The genuine migrate-rtl yield in `ui/**` is small (a handful of physical `left-[50%]`/`slide-in-from-left` sites, mostly centering idioms in `alert-dialog.tsx` and Radix-motion classes in `navigation-menu.tsx` that need careful human review, not blind acceptance). [VERIFIED: codebase grep 2026-07-02]

**Primary recommendation:** Build one `DirectionProvider` bridge component (shadcn `add direction`, then rewire its `direction` prop to live `i18n.language` via `useSyncExternalStore` on i18next's `languageChanged`), do all DOM writes (`<html dir/lang>`) in its `useLayoutEffect`, delete the other three setters' DOM writes, and mount it once in `App.tsx`. Run `migrate rtl` scoped to `src/components/ui/**` on a clean tree as an isolated commit, review every hunk (reject logical-slide conversions on portal animations), then land the duplicate-`rtl:` CI script with a positive-failure fixture.

## Architectural Responsibility Map

| Capability                        | Primary Tier                                              | Secondary Tier                    | Rationale                                                                                                                                                           |
| --------------------------------- | --------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Direction state (single owner)    | Browser/Client (React provider)                           | —                                 | Direction derives from `i18n.language`; purely client-side concern                                                                                                  |
| First-paint direction             | Static bootstrap (`public/bootstrap.js`)                  | —                                 | Pre-hydration `<html dir>` from `id.locale` — already correct, UNTOUCHED this phase                                                                                 |
| Direction persistence             | Browser localStorage (`id.locale`)                        | —                                 | i18next detector `caches: ['localStorage']` with `lookupLocalStorage: 'id.locale'` already persists on every `changeLanguage` [VERIFIED: src/i18n/index.ts:552-556] |
| Radix portal direction            | Browser/Client (Radix `DirectionProvider` context)        | Per-component `dir` prop override | Radix primitives read nearest direction context; explicit `dir` prop wins when passed                                                                               |
| Portal slide animation direction  | CSS (`ltr:`/`rtl:` paired variants keyed off `html[dir]`) | —                                 | tw-animate-css logical slide utilities broken under RTL (upstream bug); paired physical variants are the proven repo pattern                                        |
| Logical-property migration        | Build tooling (shadcn CLI, one-shot)                      | Git (single isolated commit)      | Transform is not idempotent; commit isolation is the re-run guard                                                                                                   |
| Duplicate-`rtl:` regression guard | CI (node script in lint chain)                            | —                                 | Repo precedent: root `scripts/check-*.mjs` + positive-failure fixture jobs in `ci.yml`                                                                              |

## Standard Stack

### Core

| Library                     | Version                                                                   | Purpose                                                                                         | Why Standard                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@radix-ui/react-direction` | 1.1.2 (latest)                                                            | `DirectionProvider` — the direction context every installed `@radix-ui/react-*` primitive reads | Official Radix utility; the app already ships 23 `@radix-ui/react-*` packages from the same monorepo [VERIFIED: npm registry + slopcheck OK 2026-07-02] |
| `shadcn` CLI                | 4.12.0 (dev-only, via `pnpm dlx` — never installed as a dep, never `npx`) | `migrate rtl` transform + `add direction` scaffolding                                           | Official shadcn CLI; Jan-2026 RTL tooling lives here [VERIFIED: npm registry + slopcheck OK 2026-07-02]                                                 |

### Supporting (already installed — no new installs)

| Library                     | Version   | Purpose                                    | When to Use                                                                                                                                                             |
| --------------------------- | --------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `i18next` / `react-i18next` | installed | The direction authority (`i18n.language`)  | Owner subscribes to `languageChanged`                                                                                                                                   |
| `tw-animate-css`            | 1.4.0     | Enter/exit animations for shadcn portals   | KEEP — composed into `index.css:28` with HeroUI styles; work around its RTL logical-slide bug, do not remove [VERIFIED: src/index.css:28 + .planning/research/STACK.md] |
| Playwright / Vitest         | installed | Verification (e2e RTL specs already exist) | `tests/e2e/rtl-switching.spec.ts`, `dossier-drawer-rtl.spec.ts`, `calendar-rtl.spec.ts` etc. [VERIFIED: ls 2026-07-02]                                                  |

### Alternatives Considered

| Instead of                                            | Could Use                                                      | Tradeoff                                                                                                                                                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shadcn's generated `ui/direction.tsx` rewired to i18n | Adopting it verbatim with static `direction` prop              | Verbatim adoption creates a second, desyncable direction source — the exact Pitfall 1 failure. Rewire the generated component to `i18n.language` (STACK.md recommendation, re-confirmed)                |
| One Radix `DirectionProvider` at app root             | Keeping the 8 per-component `dir={dir ?? getDocDir()}` wirings | Per-component wiring works but is the fragmentation being consolidated; keep the `dir` prop passthrough on wrappers (Radix prop overrides context) but let context provide the default                  |
| Node script CI guard for duplicate `rtl:*`            | ESLint custom rule                                             | `components/ui/**` is exempted from the main ESLint config block (`eslint.config.mjs:225`) — a standalone script in the existing lint chain avoids re-plumbing exemptions [VERIFIED: eslint.config.mjs] |

**Installation:**

```bash
# From frontend/ — generates src/components/ui/direction.tsx and pulls @radix-ui/react-direction
pnpm dlx shadcn@latest add direction

# Version verification (run before install):
npm view @radix-ui/react-direction version   # 1.1.2, modified 2026-06-06 [VERIFIED 2026-07-02]
npm view shadcn version                      # 4.12.0 [VERIFIED 2026-07-02]
```

Note: on this machine `npx` is broken — always `pnpm dlx` / `pnpm exec` (established project fact).

## Package Legitimacy Audit

slopcheck 2026-07-02, `--ecosystem npm` (default pypi run false-flags npm packages — cross-ecosystem confusion; the npm run is authoritative):

| Package                                 | Registry | Age                              | Downloads             | Source Repo                    | slopcheck | Disposition |
| --------------------------------------- | -------- | -------------------------------- | --------------------- | ------------------------------ | --------- | ----------- |
| `@radix-ui/react-direction`             | npm      | years (last modified 2026-06-06) | high (Radix monorepo) | github.com/radix-ui/primitives | [OK]      | Approved    |
| `shadcn` (CLI, dev-only via `pnpm dlx`) | npm      | years                            | high                  | github.com/shadcn-ui/ui        | [OK]      | Approved    |

**Postinstall check:** `@radix-ui/react-direction` has no postinstall (scripts are lint/clean/typecheck/build only); `shadcn` has no postinstall. [VERIFIED: npm view scripts 2026-07-02]

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### Current Direction Flow (verified 2026-07-02 — what gets consolidated)

```
Topbar ع button ──────────► useLocale().setLocale('ar')          [layout/Topbar.tsx:229,243]
                                    │ (DesignProvider.setLocale)
SettingsPage ─► switchLanguage() ───┤                              [pages/settings/SettingsPage.tsx:287]
                                    ▼
        ┌──────────────── DesignProvider.setLocale ────────────────┐
        │ SYNC: localStorage id.locale                             │  [design-system/DesignProvider.tsx:283-298]
        │ SYNC: document.documentElement.lang/dir   ← WRITE #1     │
        │ ASYNC: import('@/i18n').then(changeLanguage)  ← microtask│
        │ dispatch 'designChange' event                            │
        └───────────────┬───────────────────────────────────────────┘
                        ▼
   LanguageProvider hears 'designChange' → setLanguageState + i18n.changeLanguage
        │ effect [language] → document dir/lang     ← WRITE #2     [language-provider.tsx:91-96, 111-114]
        ▼
   i18n 'languageChanged' fires → document dir/lang ← WRITE #3     [i18n/index.ts:595-598]
   (+ module-load initial set at i18n/index.ts:591-592,
    + switchLanguage's own write at :586-587)
        ▼
   RTLWrapper re-renders (i18n.language changed)
        │ effect → html dir/lang + body dir + data-language ← WRITE #4  [rtl-wrapper/RTLWrapper.tsx:14-19]
        └─ renders <div dir={direction} data-dir class="rtl|ltr">  (redundant: no CSS keys off .rtl/.ltr,
                                                                    data-dir, or body[dir] — verified by grep)
        ▼
   Radix primitives: 8 ui/ wrappers each pass dir={dir ?? getDocDir()}   [lib/utils.ts:13; accordion,
   (no DirectionProvider anywhere — @radix-ui/react-direction NOT installed)  context-menu, dropdown-menu,
                                                                    heroui-tabs, navigation-menu,
   PRE-PAINT (untouched this phase): public/bootstrap.js:112-115   scroll-area, select, slider, toggle-group]
   sets html lang/dir from id.locale before any stylesheet parses
```

Why today's flip is NOT same-frame: WRITE #1 happens synchronously in the click handler, but the React-tree direction (RTLWrapper's div, `useDirection()` consumers, Radix `dir` props) only updates after the async `import('@/i18n')` microtask → event dispatch → state update chain. `document.dir` and portal direction disagree for at least one commit.

### Target Architecture

```
Topbar ع / SettingsPage ──► i18n.changeLanguage(lang)      (entry points converge on i18next;
                                    │                       i18next auto-persists id.locale via
                                    ▼                       detector caches [i18n/index.ts:552-556])
                    ┌── DirectionProvider (the ONE owner) ──┐
                    │ subscribes: useSyncExternalStore on   │
                    │   i18n 'languageChanged'              │
                    │ derives: dir = language==='ar'?rtl:ltr│
                    │ useLayoutEffect (same commit):        │
                    │   document.documentElement.dir = dir  │
                    │   document.documentElement.lang = lng │
                    │ renders: RadixDirection.Provider      │
                    │   dir={dir}  → ALL Radix portals      │
                    └────────────────┬──────────────────────┘
                                     ▼
     html[dir] (CSS: rtl:/ltr: variants, logical props — covers body-mounted portals as ancestor)
     Radix context (JS: positioning, collision, keyboard nav in Popover/Tooltip/Dropdown/Sheet/Menu)

     REMOVED: LanguageProvider DOM writes (state/context stays for useDirection consumers)
     REMOVED: i18n/index.ts three DOM-write sites (getDirection/isRTL helpers stay)
     REMOVED: RTLWrapper DOM writes + redundant wrapper attributes (component removable — see Open Q2)
     REMOVED: DesignProvider.setLocale DOM writes (localStorage + changeLanguage delegation stays)
     RETAINED: bootstrap.js pre-paint set (out of scope, load-bearing)
     RETAINED: 68 per-field dir="rtl" on _ar fields + ui/ltr-isolate.tsx dir="ltr" boundary
```

### Recommended File Organization

```
frontend/src/
├── components/ui/direction.tsx    # shadcn-generated, REWIRED: direction from i18n, not a static prop
│                                  # (kebab-case required in ui/ by eslint-plugin-check-file)
├── hooks/useDirection.ts          # KEEP public API {direction,isRTL}; re-point to the new owner
└── i18n/index.ts                  # keep getDirection/isRTL/switchLanguage exports; strip DOM writes
scripts/
└── check-duplicate-rtl.mjs        # repo-root, mirrors check-i18n-namespaces.mjs wiring
tools/rtl-fixtures/
└── duplicate-rtl.tsx.txt          # positive-failure fixture (must FAIL the check in CI)
```

### Pattern 1: Single Direction Owner Bridged into `<html>` + Radix

**What:** One component derives `dir` from `i18n.language`, performs the only DOM writes, and feeds Radix's context. Every other current writer is demoted to a state consumer or an entry point that calls `i18n.changeLanguage`.
**When to use:** Mount once in `App.tsx`, high enough that the router and every portal-spawning surface is inside it (replace `RTLWrapper`'s slot in the chain: `DesignProvider → TweaksDisclosureProvider → LanguageProvider → [DirectionProvider] → router`).
**Example:**

```tsx
// Source: shadcn ui/direction scaffold (pnpm dlx shadcn@latest add direction) rewired per
// https://ui.shadcn.com/docs/rtl/vite + Radix Direction.Provider API
// (Radix's own prop is `dir`: <Direction.Provider dir="rtl">) [CITED: radix-ui.com/primitives/docs/utilities/direction-provider]
import { useLayoutEffect, useSyncExternalStore, type ReactNode, type ReactElement } from 'react'
import { DirectionProvider as RadixDirectionProvider } from '@radix-ui/react-direction'
import i18n, { getDirection } from '@/i18n'

function subscribe(onStoreChange: () => void): () => void {
  i18n.on('languageChanged', onStoreChange)
  return () => i18n.off('languageChanged', onStoreChange)
}

export function DirectionProvider({ children }: { children: ReactNode }): ReactElement {
  const language = useSyncExternalStore(subscribe, () => i18n.language)
  const dir = getDirection(language)

  // Same commit as the Radix context update → document + portals flip before the next paint.
  useLayoutEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = language
  }, [dir, language])

  return <RadixDirectionProvider dir={dir}>{children}</RadixDirectionProvider>
}
```

Key demotions (each keeps its non-direction responsibilities):

| File                                      | Remove                                                               | Keep                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `i18n/index.ts:586-587, 591-592, 595-598` | all three `document.documentElement.dir/lang` writes                 | `getDirection`, `isRTL`, `switchLanguage` (delegating to `changeLanguage` only), detector config                    |
| `language-provider.tsx:94-95, 113-114`    | DOM writes                                                           | context state (`language`, `direction`, `setLanguage`) — `src/hooks/useDirection.ts` and its consumers keep working |
| `RTLWrapper.tsx`                          | DOM writes + wrapper `<div dir>` (no CSS/test dependency — verified) | nothing direction-critical remains; see Open Q2 for delete-vs-passthrough                                           |
| `DesignProvider.tsx:286-289`              | `document.documentElement.lang/dir` writes                           | `id.locale` persistence + `i18n.changeLanguage` delegation + `designChange` event                                   |

### Pattern 2: Same-Frame Flip Verification

**What:** The acceptance bar is operational: after the toggle's state update commits, `document.dir` and a mounted Radix portal's direction agree within the same paint.
**How to verify:** Open a Popover, click ع, then assert both in a single `requestAnimationFrame`-gated evaluate (see Code Examples). React batches the `languageChanged`-driven state update; `useLayoutEffect` + provider prop land in the same commit, so both are updated before paint.
**Warning:** DO NOT leave `DesignProvider.setLocale`'s synchronous `document.dir` write in place "as a fast path" — it re-creates the one-frame disagreement window (document flips before the React tree does).

### Pattern 3: Portal Direction + Animation (RTLB-02)

**What:** Radix context (Pattern 1) fixes JS-driven positioning (collision, `side`/`align` resolution, submenu direction, focus order). CSS slide animations are a separate axis: tw-animate-css **logical** slide utilities (`slide-in-from-start`/`-end`) do not respect direction — a current upstream bug flagged in shadcn's own RTL docs. [CITED: ui.shadcn.com/docs/rtl]
**The repo's proven pattern** (already live in `ui/sheet.tsx:42-44`) is paired physical variants keyed off the `[dir]` ancestor — portals mount to `document.body`, and `html[dir]` is their ancestor, so `rtl:`/`ltr:` variants resolve correctly:

```
ltr:data-[state=open]:slide-in-from-right  rtl:data-[state=open]:slide-in-from-left
```

**When to use:** For every portal type in scope — Popover, Tooltip, Dropdown, Sheet (both sides), and the dossier drawer (which is `ui/sheet` with `side="right"`, `DossierDrawer.tsx:97`). Popover/Tooltip today only fade/zoom (no directional slide) [VERIFIED: ui/popover.tsx, ui/tooltip.tsx classNames] — for them, correct-edge behavior comes from Radix `side`/`align` resolution via the direction context, not CSS.
**During migrate-rtl diff review:** reject any hunk that converts the paired `ltr:`/`rtl:` pattern into bare logical slide utilities — that would trade a working pattern for the known-broken one. If a portal still misbehaves after the context bridge, apply the documented fallback: pass reactive `dir={dir}` directly onto the portal content element.

### Pattern 4: One-Shot `migrate rtl` Protocol (SRTL-01)

**What:** The upstream transform is not idempotent (shadcn-ui/ui #9891 — re-runs append duplicate `rtl:*` variants). The run must be: clean tree → scoped run → human review → single isolated commit → never re-run.
**Protocol:**

1. Start from a clean `frontend/src/components/ui` tree (no uncommitted edits — the pre-commit hook's lint-staged can leave artifacts; verify `git status` first).
2. Run scoped: `pnpm dlx shadcn@latest migrate rtl` from `frontend/` (verify with `--help` whether the current CLI accepts a path argument — STACK.md records `pnpm dlx shadcn@latest migrate rtl "src/components/ui/**"` [ASSUMED: glob syntax from milestone research, not re-verified against CLI 4.12.0 this session]). Fallback if no glob support: run repo-wide, then `git checkout -- .` everything outside `src/components/ui/` before review — app code is already logical-only so out-of-scope churn should be zero, but verify.
3. Review every hunk. Expected yield is SMALL (app-code is ESLint-clean already). Known physical-class sites in `ui/**` that the transform will target:
   - `ui/alert-dialog.tsx:37` — `left-[50%] … translate-x-[-50%] … slide-in-from-left-1/2` is a **centering idiom**, not a directional layout. `left-[50%]→start-[50%]` is safe only if the physical `translate-x-[-50%]` stays physical; review that the pair stays consistent (Tailwind v4 `translate` is a standalone property — established project fact). If in doubt, reject the hunk: a centered dialog is direction-neutral.
   - `ui/navigation-menu.tsx:67` — `data-[motion=from-start]:slide-in-from-left-52` etc. Radix's `data-motion` values are already logical (`from-start`/`to-end`); the physical slide classes are the intentional mapping. Converting them to logical slide utilities hits the tw-animate-css bug. Review carefully; likely reject.
   - `ui/sheet.tsx:42-44` — already correct paired variants; any change here is a regression.
4. Commit the reviewed diff ALONE: `feat(76): shadcn migrate rtl one-shot (components/ui)` — nothing else in the commit, so it is auditable and revertable.
5. Set `"rtl": true` in `frontend/components.json` so FUTURE `shadcn add <component>` installs are transformed at install time instead of ever re-running the bulk migrate [CITED: ui.shadcn.com/docs/changelog/2026-01-rtl]. Caveat: auto-transform is only guaranteed on `*-nova` styles; on this repo's `new-york` style treat install-time output as best-effort-review too. Do NOT touch the `@aceternity-pro` registry entry (Phase 79's job).

### Pattern 5: CLI-Exempt Component Verification (SRTL-02)

**What:** shadcn's docs exempt Calendar, Pagination, and Sidebar from the auto-migrate — they need manual RTL work. **In this repo all three are already hand-patched** [VERIFIED: grep 2026-07-02]:

| Component                 | Existing patch                                                                  | Verify in AR                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ui/calendar.tsx:27-28`   | `rtl:**:[.rdp-button\_next>svg]:rotate-180` (+ `_previous`) on react-day-picker | Month nav chevrons point correctly; next/prev advance the right way; existing `tests/e2e/calendar-rtl.spec.ts` reusable |
| `ui/pagination.tsx:58,71` | `rtl:rotate-180` on ChevronLeft/Right                                           | Prev/next affordances mirror; `aria-current` unaffected                                                                 |
| `ui/sidebar.tsx:329`      | `rtl:-scale-x-100` on PanelLeft toggle icon                                     | Rail collapses to the correct edge; mobile sheet side correct                                                           |

The task is: confirm `migrate rtl` did not duplicate/mangle these lines, then a manual Arabic walkthrough of each (plus screenshots for the verification record). This is verify-no-regress, not build-from-scratch.

### Pattern 6: CI Duplicate-`rtl:` Guard (SRTL-03)

**What:** Fail the build when any single `className` string contains the SAME `rtl:*` utility twice (the #9891 signature, e.g. `rtl:space-x-reverse rtl:space-x-reverse`).
**Critical false-positive trap:** PITFALLS.md's sketch grep (`rtl:[a-z-]+ .*rtl:`) flags any TWO DIFFERENT `rtl:` utilities in one string — which is legitimate and already shipping (`ui/sheet.tsx:42` has two distinct `rtl:` utilities per line). The check must tokenize each string literal and flag only **exact duplicate tokens** with an `rtl:` prefix.
**Wiring (repo precedent):** root `scripts/check-duplicate-rtl.mjs`, appended to the frontend `lint` script chain (exactly like `scripts/check-i18n-namespaces.mjs`), which the CI `lint` job already runs via `pnpm run lint`. Add a positive-failure fixture step in `ci.yml` mirroring the existing `design-token-check` / edge-fn-schema pattern (`! node scripts/check-duplicate-rtl.mjs tools/rtl-fixtures/`) so the guard is proven live. Scan surface: all of `frontend/src` (duplicates can leak anywhere), cost is one fast file walk.

### Anti-Patterns to Avoid

- **Two direction owners:** mounting Radix `DirectionProvider` with its own state while `document.dir` is written elsewhere — the exact double-flip Pitfall 1. One value, two sinks (`<html>`, Radix), one writer.
- **Hard-coded `direction="rtl"` / `dir="rtl"` on providers or portals for layout:** the app is bilingual with a live toggle; zero hard-coded layout direction exists today [VERIFIED: grep] — keep it that way (success criterion 1).
- **Re-running `migrate rtl` "to be safe":** never; `rtl: true` install-time transform covers future components.
- **Converting the `ltr:`/`rtl:` paired slide variants to logical slide utilities:** trades a working pattern for a known-broken one (tw-animate-css bug).
- **"Fixing" the 68 per-field `dir="rtl"`:** they mark Arabic-content fields (`_ar`) and Arabic-text preview panes; they are content-direction, not layout-direction. Explicitly retained.
- **Removing `tw-animate-css`:** composed into `index.css` alongside `@heroui/styles`; its RTL bug is worked around, not fatal.
- **Naming confusion (three `useDirection`s + two "direction"s):** the app's `src/hooks/useDirection.ts` (ltr/rtl), shadcn's generated `useDirection` in `ui/direction.tsx`, and Radix's internal hook all share the name; separately, `DesignProvider`'s `direction` means bureau/chancery/situation/ministerial (the visual theme, retired in Phase 77) — NOT text direction. Pick one exported hook name for text direction and do not import the shadcn one into app code alongside the existing one without aliasing.

## Don't Hand-Roll

| Problem                                | Don't Build                                      | Use Instead                                            | Why                                                                                                                                                                                                       |
| -------------------------------------- | ------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Direction context for Radix portals    | A custom React context that portals somehow read | `@radix-ui/react-direction` `DirectionProvider`        | Every installed Radix primitive already consumes this exact context internally; a custom context would require patching all 23 packages' consumers                                                        |
| Direction scaffold                     | Hand-written provider file from scratch          | `pnpm dlx shadcn@latest add direction`, then rewire    | Generated file matches shadcn conventions the rest of `ui/` follows; the rewiring is 10 lines                                                                                                             |
| Logical-property conversion of `ui/**` | Hand-editing physical classes across 73 files    | `migrate rtl` (once) + human review                    | The transform knows the full class map (`left→start`, `ml→ms`, `text-left→text-start`, `slide-in-from-left→slide-in-from-start`, icon `rtl:rotate-180`) [CITED: ui.shadcn.com/docs/changelog/2026-01-rtl] |
| Language subscription                  | Event-listener + setState plumbing               | `useSyncExternalStore` on `i18n.on('languageChanged')` | Tear-proof under concurrent rendering; 6 lines                                                                                                                                                            |

**Key insight:** the expensive-looking part (portal direction) is a solved problem one 3KB Radix utility away; the genuinely manual part is diff review of a non-idempotent codemod on a legacy style.

## Runtime State Inventory

Refactor phase — state audited beyond the file tree:

| Category                        | Items Found                                                                                                                                                                                                                                                                                                  | Action Required                                                                                                                                                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stored data (localStorage)      | `id.locale` (canonical, read by bootstrap.js + i18n detector), `i18nextLng` (legacy, migrated by bootstrap.js:98-107 and still WRITTEN by LanguageProvider:134), `user-preferences.language` (LanguageProvider:117-132), `ui-storage.state.language` (Zustand, read-only fallback in LanguageProvider:59-72) | Code edit only — no data migration. Consolidation must not stop writing `id.locale` (bootstrap + Playwright specs depend on it). Whether to keep mirroring `i18nextLng`/`user-preferences` is planner's call; existing values deserialize fine either way |
| Live service config             | None — direction is purely client-side                                                                                                                                                                                                                                                                       | None — verified: no backend/edge-function involvement in direction                                                                                                                                                                                        |
| OS-registered state             | None                                                                                                                                                                                                                                                                                                         | None                                                                                                                                                                                                                                                      |
| Secrets/env vars                | None                                                                                                                                                                                                                                                                                                         | None — verified: no env var references direction/locale                                                                                                                                                                                                   |
| Build artifacts / test fixtures | Playwright specs seed `localStorage['id.locale']` directly (`tests/e2e/rtl-switching.spec.ts:16-20` and siblings); dev/test hatch `window.__design` exposes `setDirection` (visual theme) but NOT `setLocale`                                                                                                | Keep `id.locale` semantics identical; new same-frame spec can toggle via the real Topbar button instead of the hatch                                                                                                                                      |

**Nothing found in category:** service config, OS state, secrets — verified by grep over `backend/`, `supabase/`, and env examples for locale/direction references.

## Common Pitfalls

### Pitfall 1: Dual direction mechanism → double-flip

**What goes wrong:** Radix `DirectionProvider` mounted as "one more provider" with static or independent state while the 4 legacy setters keep writing `document.dir`; portals disagree with the page, or agree only until the first toggle.
**Why it happens:** The bridge is added without demoting the legacy writers.
**How to avoid:** Pattern 1 — one derived value, `useLayoutEffect` DOM write + Radix prop in the same commit; delete the other writers' DOM writes in the same plan.
**Warning signs:** Popover/Dropdown opens from the wrong edge only after toggling; correct on cold load in AR but wrong after AR→EN→AR.

### Pitfall 2: `migrate rtl` double-run duplicates `rtl:*` classes

**What goes wrong:** Second run appends duplicate variants; cascade becomes order-dependent (upstream #9891).
**How to avoid:** One isolated commit; `rtl: true` for future installs; the SRTL-03 CI guard makes recurrence build-breaking.
**Warning signs:** git diff on `ui/**` shows growth in already-logical files; the new check script fires.

### Pitfall 3: Migrate output trusted on `new-york` style

**What goes wrong:** Automatic transforms are only guaranteed for `*-nova` styles; on this repo's `new-york` the output is best-effort. Specific local risks: `alert-dialog.tsx` centering idiom (`left-[50%]`+`translate-x-[-50%]` pair must stay internally consistent), `navigation-menu.tsx` Radix-motion physical slides (intentional), `sheet.tsx` paired variants (already correct).
**How to avoid:** Hunk-by-hunk review with the three named files as explicit checkpoints; reject logical-slide conversions on portal animations.
**Warning signs:** A centered dialog renders off-center in one direction; nav menu content slides the wrong way only in AR.

### Pitfall 4: Async `import('@/i18n')` keeps the flip multi-frame

**What goes wrong:** `DesignProvider.setLocale`'s dynamic import defers `changeLanguage` by a microtask; if the owner derives from `i18n.language` but `setLocale`'s synchronous DOM write also survives, document and portals flip in different commits.
**How to avoid:** Owner is the ONLY DOM writer; `setLocale` becomes persistence + delegation. (`App.tsx` statically imports `./i18n`, so the dynamic import resolves from cache — the circular-dependency comment in DesignProvider is why it's dynamic; keep the dynamic import, just remove the DOM writes.)
**Warning signs:** Playwright same-frame assertion flakes: html dir updated, portal not yet.

### Pitfall 5: First-load `?lng=ar` regression

**What goes wrong:** i18n detector order is `querystring` first (`?lng=ar` flips before paint for visual specs today, via the module-level write at `i18n/index.ts:591`). Deleting that write without a mount-time sync leaves bootstrap.js's `id.locale`-based dir (possibly `en`) in place until the owner's first effect.
**How to avoid:** The owner's `useLayoutEffect` runs on mount with the already-initialized `i18n.language` — it fires before first paint of React content, preserving the behavior. Verify with a `?lng=ar` + `id.locale=en` cold-load spec.
**Warning signs:** `rtl-switching.spec.ts`-style assertions pass but a querystring-seeded run paints LTR briefly.

### Pitfall 6: Duplicate-rtl check false positives kill CI

**What goes wrong:** A regex-level check (`rtl:.*rtl:`) fails the build on `ui/sheet.tsx`'s legitimate multi-`rtl:` lines the day it lands.
**How to avoid:** Exact-duplicate-token detection (Pattern 6); prove both directions with fixtures — a bad fixture that MUST fail and the live tree that MUST pass.

### Pitfall 7: Breaking the 8 `getDocDir()`-wired Radix wrappers during consolidation

**What goes wrong:** Removing `dir={dir ?? getDocDir()}` from accordion/context-menu/dropdown-menu/heroui-tabs/navigation-menu/scroll-area/select/slider/toggle-group before the context provider is mounted (or in a render path outside it) drops their direction entirely — Radix defaults to LTR.
**How to avoid:** Sequence: mount the provider first, verify portals flip, THEN simplify the per-component wiring; keep the `dir` prop passthrough (Radix prop overrides context) so per-instance overrides like `LtrIsolate` scenarios still work. Phase 75 audit marks all of these keep-custom "dir wiring must survive reskin" — direction correctness must survive; deriving the default from context instead of `getDocDir()` satisfies the intent.

## Code Examples

### Same-frame flip verification (Playwright)

```ts
// New e2e spec — extends existing tests/e2e/rtl-switching.spec.ts pattern (authBypass + seedLocale)
test('language toggle flips document AND mounted Radix portal in the same frame', async ({
  page,
}) => {
  await authBypass(page)
  await seedLocale(page, 'en')
  await page.goto('/…route with a popover/dropdown…')
  await page.click('[data-slot="popover-trigger"]') // mount a portal
  await expect(page.locator('[data-slot="popover-content"]')).toBeVisible()

  await page.click('[data-lang="ar"]') // Topbar ع (Topbar.tsx:243)
  const agree = await page.evaluate(
    () =>
      new Promise<{ html: string; portal: string | null }>((resolve) =>
        requestAnimationFrame(() =>
          resolve({
            html: document.documentElement.dir,
            portal:
              document.querySelector('[data-slot="popover-content"]')?.getAttribute('dir') ??
              getComputedStyle(document.querySelector('[data-slot="popover-content"]')!).direction,
          }),
        ),
      ),
  )
  expect(agree.html).toBe('rtl')
  expect(agree.portal).toBe('rtl')
})
```

### Duplicate-`rtl:` check core (exact-duplicate tokens only)

```js
// scripts/check-duplicate-rtl.mjs — sketch of the detection core
const STRING_RE = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g
function duplicatedRtlTokens(source) {
  const hits = []
  for (const [, , literal] of source.matchAll(STRING_RE)) {
    const tokens = literal.split(/\s+/).filter((t) => t.startsWith('rtl:'))
    const seen = new Set()
    for (const t of tokens) {
      if (seen.has(t)) hits.push(t) // SAME rtl: utility twice in ONE string → fail
      seen.add(t)
    }
  }
  return hits
}
// NOTE: two DIFFERENT rtl: tokens in one string are legal (ui/sheet.tsx:42-44 ships them today).
```

### CI wiring (mirrors existing lint-job + positive-failure precedent in ci.yml)

```yaml
# .github/workflows/ci.yml — inside the existing lint job (which runs `pnpm run lint`)
- name: Check duplicate rtl utilities
  run: node scripts/check-duplicate-rtl.mjs frontend/src
- name: Assert duplicate-rtl check fails on bad fixture (positive-failure)
  shell: bash
  run: |
    set -e
    ! node scripts/check-duplicate-rtl.mjs tools/rtl-fixtures
```

### Migrate execution

```bash
cd frontend
git status --porcelain src/components/ui   # MUST be empty before running
pnpm dlx shadcn@latest migrate rtl "src/components/ui/**"   # verify glob support via --help first
git add src/components/ui && git diff --cached --stat        # review EVERY hunk before commit
```

## State of the Art

| Old Approach                                                 | Current Approach                                              | When Changed                 | Impact                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| Per-component `dir={dir ?? getDocDir()}` on 8 Radix wrappers | One `DirectionProvider` context all Radix primitives inherit  | shadcn RTL support, Jan 2026 | Single owner becomes practical; per-component wiring becomes override-only |
| Manual logical-property rewrites                             | `shadcn migrate rtl` + `rtl: true` install-time transform     | Jan 2026 changelog           | One-shot codemod; NOT idempotent (#9891)                                   |
| `i18nextLng` localStorage key                                | `id.locale` (canonical since v6.0; bootstrap migrates legacy) | Phase 34                     | All tooling/specs key off `id.locale`                                      |

**Deprecated/outdated:**

- `RTLWrapper`'s `<div dir>` + `.rtl` class + `data-dir` + `body[dir]`: nothing in CSS or tests keys off any of them [VERIFIED: grep 2026-07-02] — redundant once the owner exists.
- `i18nextLng` writes in LanguageProvider:134 — legacy mirror; bootstrap migrates it one-way already.

## Assumptions Log

| #   | Claim                                                                                                                                                                            | Section          | Risk if Wrong                                                                                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `shadcn@4.12.0 migrate rtl` accepts a path glob (`"src/components/ui/**"`)                                                                                                       | Pattern 4        | LOW — fallback documented: run repo-wide, revert out-of-scope paths (expected zero anyway since app code is logical-only). Verify with `--help` at execution time |
| A2  | `"rtl": true` in components.json is accepted on the legacy `new-york` style for install-time transforms (docs demonstrate it via `create --rtl` on new styles)                   | Pattern 4 step 5 | LOW — worst case future `shadcn add` output needs the same manual review this phase's migrate output gets                                                         |
| A3  | i18next `languageChanged` fires within the same task as `changeLanguage` resolution for static-bundled resources (no async backend), so the React update batches into one commit | Pattern 2        | MEDIUM — if an extra tick sneaks in, the same-frame spec catches it; mitigation is deriving owner state synchronously from the entry-point click instead          |
| A4  | Radix `DirectionProvider` context propagation reaches portal-rendered content (portals are React-tree children even when DOM-mounted on body)                                    | Pattern 1        | LOW — this is standard React portal semantics and Radix's documented usage; the e2e spec verifies it live                                                         |

## Open Questions

1. **Delete RTLWrapper entirely, or reduce to a passthrough?**
   - What we know: sole importer is `App.tsx`; no CSS/test keys off its attributes; Phase 75 audit lists `rtl-wrapper/` keep-custom as infrastructure ("direction source … must survive reskin") — but this phase IS the sanctioned consolidation of that source.
   - What's unclear: whether any snapshot/visual baseline encodes the wrapper div in the DOM tree.
   - Recommendation: replace its slot in `App.tsx` with the new `DirectionProvider`; delete the component in the same plan with a grep-proof of zero remaining importers. If a visual baseline diff appears, a passthrough fragment is the fallback.
2. **Simplify the 8 per-component `dir={dir ?? getDocDir()}` wirings this phase, or leave them?**
   - What we know: after the provider mounts they're redundant defaults (Radix prop overrides context); audit requires direction correctness to survive.
   - Recommendation: keep the `dir` prop passthrough, drop only the `?? getDocDir()` default resolution where it duplicates context — low-risk cleanup, but acceptable to defer to keep this phase's diff minimal. Planner's call; either satisfies RTLB-01 as long as no second _owner_ remains.
3. **Scope of the duplicate-`rtl:` scan (frontend/src vs components/ui only)?**
   - Recommendation: all of `frontend/src` — duplicates can be introduced anywhere by future codemods/copy-paste; the exact-token rule has no false positives on the current tree (16 `rtl:` occurrences repo-wide, all distinct per string).

## Environment Availability

| Dependency                  | Required By              | Available                     | Version                                                                            | Fallback                                 |
| --------------------------- | ------------------------ | ----------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------- |
| Node.js                     | scripts, CLI             | ✓                             | 22.x (repo pin)                                                                    | —                                        |
| pnpm                        | dlx, lint chain          | ✓                             | 10.29.1 (pinned; `pnpm@latest`→v11 breaks)                                         | —                                        |
| `shadcn` CLI via `pnpm dlx` | SRTL-01, `add direction` | ✓ (network fetch at run time) | 4.12.0                                                                             | — (never `npx` on this machine — broken) |
| Playwright                  | e2e verification         | ✓                             | installed, `frontend/playwright.config.ts`, webServer auto-starts `pnpm dev` :5173 | —                                        |
| Vitest                      | unit tests               | ✓                             | installed                                                                          | —                                        |
| GitHub Actions CI           | SRTL-03 guard            | ✓                             | `.github/workflows/ci.yml` lint job + positive-failure precedent                   | —                                        |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Framework          | Vitest (unit, `frontend/vitest.config.ts`) + Playwright (e2e, `frontend/playwright.config.ts`, testDir `frontend/tests`) |
| Config file        | both exist — no Wave 0 framework install                                                                                 |
| Quick run command  | `cd frontend && pnpm vitest run <file>`                                                                                  |
| Full suite command | `pnpm test` (frontend workspace) / `pnpm exec playwright test tests/e2e/<spec>`                                          |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                      | Test Type                         | Automated Command                                                                                                | File Exists?                                                                                                          |
| ------- | ----------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| RTLB-01 | Owner derives dir from i18n; demoted setters no longer write DOM              | unit                              | `cd frontend && pnpm vitest run src/components/ui/__tests__/direction.test.tsx`                                  | ❌ Wave 0                                                                                                             |
| RTLB-01 | html dir flips on toggle (both directions)                                    | e2e                               | `pnpm exec playwright test tests/e2e/rtl-switching.spec.ts`                                                      | ✅ (extend with toggle-after-load cases — current spec only seeds `id.locale`)                                        |
| RTLB-02 | Portal + document agree same-frame; portals open from inline-start edge in AR | e2e                               | `pnpm exec playwright test tests/e2e/direction-portals.spec.ts`                                                  | ❌ Wave 0                                                                                                             |
| RTLB-02 | Dossier drawer slides from correct edge in AR                                 | e2e                               | `pnpm exec playwright test tests/e2e/dossier-drawer-rtl.spec.ts`                                                 | ✅ (re-run as regression gate)                                                                                        |
| SRTL-01 | Single migrate commit; no duplicate `rtl:*` in tree                           | script                            | `node scripts/check-duplicate-rtl.mjs frontend/src`                                                              | ❌ Wave 0 (script is a phase deliverable)                                                                             |
| SRTL-02 | Calendar RTL nav correct                                                      | e2e + manual                      | `pnpm exec playwright test tests/e2e/calendar-rtl.spec.ts` + manual AR walkthrough                               | ✅ / manual-only for Sidebar+Pagination visuals (justification: no existing spec; screenshots in verification record) |
| SRTL-03 | CI fails on duplicated `rtl:*`; passes on live tree                           | script (positive-failure fixture) | `! node scripts/check-duplicate-rtl.mjs tools/rtl-fixtures && node scripts/check-duplicate-rtl.mjs frontend/src` | ❌ Wave 0                                                                                                             |

### Sampling Rate

- **Per task commit:** `cd frontend && pnpm type-check && pnpm vitest run <touched-area>`
- **Per wave merge:** `pnpm lint && pnpm exec playwright test tests/e2e/rtl-switching.spec.ts tests/e2e/dossier-drawer-rtl.spec.ts`
- **Phase gate:** full frontend unit suite + the RTL e2e set (rtl-switching, direction-portals, dossier-drawer-rtl, calendar-rtl, dashboard-rtl, list-pages-rtl) green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/components/ui/__tests__/direction.test.tsx` — covers RTLB-01 (owner derivation, single DOM writer)
- [ ] `frontend/tests/e2e/direction-portals.spec.ts` — covers RTLB-02 (same-frame + per-portal edge, EN and AR)
- [ ] `scripts/check-duplicate-rtl.mjs` + `tools/rtl-fixtures/` bad fixture — covers SRTL-03 (also the SRTL-01 recurrence guard)

## Security Domain

This phase is client-side UI infrastructure — no auth, session, access-control, or data-handling surface changes.

### Applicable ASVS Categories

| ASVS Category             | Applies | Standard Control                                                                                                                                                                     |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| V2 Authentication         | no      | — (no auth surface touched)                                                                                                                                                          |
| V3 Session Management     | no      | —                                                                                                                                                                                    |
| V4 Access Control         | no      | — (no clearance-gated component collapses to a primitive — Phase 75 audit criterion-5 already protects them; this phase touches none)                                                |
| V5 Input Validation       | no      | — (no user input processed; CI script reads repo files only, no untrusted input execution)                                                                                           |
| V6 Cryptography           | no      | —                                                                                                                                                                                    |
| V14 Config / Supply chain | yes     | New dependency verified: `@radix-ui/react-direction` — official Radix monorepo, slopcheck [OK], no postinstall; `shadcn` CLI run via `pnpm dlx` (dev-time only, never a runtime dep) |

### Known Threat Patterns for this change

| Pattern                                                        | STRIDE      | Standard Mitigation                                                                                                         |
| -------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| Slopsquatted/typosquatted package at install                   | Tampering   | slopcheck npm verification done (this session); install exactly `@radix-ui/react-direction@1.1.2`; no postinstall confirmed |
| Codemod (`migrate rtl`) rewriting files outside intended scope | Tampering   | Clean-tree precondition + scoped run + full diff review + isolated commit                                                   |
| CI guard script false-negative (guard theater)                 | Repudiation | Positive-failure fixture step proves the check fires (repo precedent pattern)                                               |

## Sources

### Primary (HIGH confidence)

- Working tree greps + file reads, 2026-07-02 — all setter locations, portal implementations, existing `rtl:` patches, localStorage keys, CI/lint wiring, eslint exemptions [VERIFIED]
- https://ui.shadcn.com/docs/rtl — migrate rtl behavior; Calendar/Pagination/Sidebar manual; tw-animate-css bug + `dir` portal workaround [CITED]
- https://ui.shadcn.com/docs/rtl/vite — DirectionProvider mounting, `rtl: true`, html dir/lang [CITED]
- https://ui.shadcn.com/docs/changelog/2026-01-rtl — transform class map; `rtl: true` install-time conversion [CITED]
- https://ui.shadcn.com/docs/components/radix/direction — `add direction` command; wrapper `direction` prop + `useDirection` export [CITED]
- https://www.radix-ui.com/primitives/docs/utilities/direction-provider — Radix `Direction.Provider dir=` API [CITED]
- npm registry: `@radix-ui/react-direction@1.1.2`, `shadcn@4.12.0` + scripts fields [VERIFIED: npm view 2026-07-02]; slopcheck npm [OK] both
- `.planning/phases/75-ui-component-migration-audit/75-AUDIT-classification.md` — direction-owner surface, per-file tiers, hand-off constraints [VERIFIED: read in full]
- `.planning/research/PITFALLS.md` + `.planning/research/STACK.md` (2026-07-01 milestone research) — idempotency bug, new-york best-effort caveat, bridge recommendation [CITED]

### Secondary (MEDIUM confidence)

- shadcn-ui/ui issue #9891 (migrate rtl not idempotent) — referenced via milestone research + WebSearch cross-check this session; issue content not fetched directly

### Tertiary (LOW confidence)

- CLI glob-argument syntax for `migrate rtl` (Assumption A1) — from milestone STACK.md; verify with `--help` at execution

## Metadata

**Confidence breakdown:**

- Current-state architecture (4 setters, entry points, portal wiring): HIGH — every claim carries a file:line verified this session
- Standard stack: HIGH — npm + slopcheck + official docs
- Migrate-rtl behavior on `new-york`: MEDIUM — official docs confirm best-effort framing; exact hunk outcomes unknowable until the run (hence the review protocol)
- Same-frame mechanics: MEDIUM-HIGH — standard React commit semantics; Assumption A3 is the one timing unknown, covered by the Wave 0 e2e spec

**Research date:** 2026-07-02
**Valid until:** 2026-08-01 (shadcn CLI moves fast; re-check `shadcn` latest + #9891 status if execution slips past that)
