# Phase 34: tweaks-drawer — Research

**Researched:** 2026-04-20
**Domain:** UI chrome — single Tweaks drawer replacing `/themes` route and language toggles as the sole locus of UI preference control (Direction × Mode × Hue × Density × Classification × Locale)
**Confidence:** HIGH

## Summary

Phase 34 ports the handoff's `tweaks.jsx` 1:1 onto HeroUI v3's `Drawer` primitive, injects a gear trigger into `SiteHeader.tsx`, deletes three legacy surfaces (`/themes` route + `Themes.tsx` + `LanguageToggle`/`LanguageSwitcher` + `theme-toggle.tsx` + `useTheme` shim), and extends the existing `/bootstrap.js` script with two new localStorage keys (`id.classif`, `id.locale`) plus a one-time `i18nextLng → id.locale` migrator. All six controls write immediately on change — no submit button, no toast — consistent with Phase 33 D-10's hard-cut philosophy.

The biggest surprises found during research: (1) `Header.tsx` is a **second live render path** (found at 6 call sites through `AppSidebar`, `responsive-demo`, `LoginPageAceternity`) that ALSO renders `<LanguageToggle />`, so the Tweaks trigger MUST be added there too OR the legacy `Header.tsx` must be audited for actual render usage. (2) The bootstrap is an **external blocking script** `/bootstrap.js` (Plan 33-03 D-C) in `frontend/public/`, NOT an inline `<script>` literal in `index.html` — so the bootstrap extension is a file edit, not an HTML edit. (3) `navigationData.ts` still lists `/themes` at line 123 — a navigation link to a route about to be redirected. (4) `design-compliance-provider.tsx` and `theme-toggle.tsx` still consume `useTheme()` — TWO additional legacy consumers beyond what Phase 33 D-11 anticipated.

**Primary recommendation:** Add the Tweaks trigger to **SiteHeader.tsx only** (single site, per D-05). Convert `Header.tsx` consumers to use `SiteHeader.tsx` in a cleanup pass OR leave `Header.tsx` alone and tolerate its `LanguageToggle` dying when the component is deleted (planner decides based on render-path audit). Build `TweaksDrawer.tsx` consuming `@heroui/react` `Drawer` directly (no shadcn facade — single-site consumer). State management: **React Context** `TweaksDisclosureProvider` at App level (simpler than Zustand for one boolean).

## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied verbatim from `.planning/phases/34-tweaks-drawer/34-CONTEXT.md`:

- **D-01** — HeroUI v3 `Drawer` primitive backs the Tweaks panel. React Aria focus trap + ESC dismissal + logical `placement` values built-in.
- **D-02** — Compound components (`Drawer.Root`/`Drawer.Content`/`Drawer.Header`/`Drawer.Body`/`Drawer.Footer`) per HeroUI v3 conventions. Exact names verified via docs below.
- **D-03** — `placement="right"` in LTR, auto-flips under `dir="rtl"`. Researcher verifies; if not auto-flip, pass dynamically.
- **D-04** — Width: 360px ≥sm, 100vw ≤640px. Backdrop `color-mix(in srgb, var(--bg) 82%, transparent)` + `backdrop-filter: blur(3px)`.
- **D-05** — Gear trigger in `SiteHeader.tsx` only. Icon `Settings2`. 44×44 touch target.
- **D-06** — Slider (0–360, step 1) + 5 preset swatches `[22, 158, 190, 258, 330]`. `oklch(58% 0.14 <h>)`.
- **D-07** — Live updates on every `change` event. No debounce in v1.
- **D-08** — Degree readout `<span dir="ltr">{hue}°</span>` — Western numerals in RTL.
- **D-09** — Slider + swatches only. No numeric input, no color picker.
- **D-10** — `id.classif` is boolean string (`'true'` / `'false'`).
- **D-11** — Tweaks REPLACES `LanguageToggle` + `LanguageSwitcher`. Delete both + all render sites.
- **D-12** — `id.locale` canonical. One-time migrator in bootstrap: `i18nextLng → id.locale`. Configure `LanguageDetector` to read `id.locale`.
- **D-13** — Locales: `'en'` / `'ar'`. Setter writes `id.locale`, calls `i18n.changeLanguage`, sets `<html dir/lang>` manually.
- **D-14** — Inline bootstrap extends to read `id.classif` + `id.locale`.
- **D-15** — DEFER: Shortcuts cheatsheet (Phase 36), Preview Loader (Phase 37).
- **D-16** — Direction change silent reset: writes new direction + defaults (Chancery=light/22, Situation=dark/190, Ministerial=light/158, Bureau=light/32).
- **D-17** — Direction button: two-line stacked, primary 13/600, tagline 11/400, active = accent chrome.
- **D-18** — Hard cut: delete `Themes.tsx`, rewrite `routes/_protected/themes.tsx` as redirect, regenerate `routeTree.gen.ts`, grep all `/themes` refs, delete `useTheme` shim.

### Claude's Discretion

- Exact i18n key names under `tweaks.*` namespace (planner chooses, labels from UI-SPEC verbatim).
- Drawer open animation duration (HeroUI default unless laggy).
- Gear icon size (20–24px in 44×44 button).
- Focus return target (HeroUI React Aria handles natively).
- Keyboard shortcut to open drawer — NOT in scope (Phase 36 palette).

### Deferred Ideas (OUT OF SCOPE)

- `⌘K` command palette + `C` / `B` shortcuts → Phase 36.
- Preview Loader button → Phase 37.
- Enum-based classification levels → future phase if needed.
- Hue numeric input / full OKLCH picker → not needed.
- Keyboard shortcut to open drawer → Phase 36.
- Second trigger site in `Header.tsx` → researcher determines.

## Phase Requirements

| ID       | Description                                                                           | Research Support                                                               |
| -------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| THEME-01 | One drawer, six controls (Direction × Mode × Hue × Density × Classification × Locale) | HeroUI Drawer + handoff tweaks.jsx layout + DesignProvider hooks cover all six |
| THEME-02 | Selections persist via `id.*` localStorage keys; bootstrap applies pre-paint          | `/bootstrap.js` extension + 2 new keys + `i18nextLng → id.locale` migrator     |
| THEME-03 | Direction change silent-resets mode + hue to direction defaults                       | D-16 defaults map + handoff themes.jsx defaultTheme/defaultAccentHue           |
| THEME-04 | `/themes` route + `LanguageToggle`/`LanguageSwitcher` deleted; redirect to `/`        | TanStack Router `beforeLoad` redirect + grep audit below                       |

## Architectural Responsibility Map

| Capability                  | Primary Tier     | Secondary Tier | Rationale                                                                      |
| --------------------------- | ---------------- | -------------- | ------------------------------------------------------------------------------ |
| Drawer open/close state     | Browser / Client | —              | Ephemeral UI state, React Context at App level                                 |
| Preference persistence      | Browser / Client | —              | `localStorage` only, no server sync (matches Phase 33 D-10)                    |
| Pre-paint token application | Browser / Client | —              | `/bootstrap.js` external blocking script, runs before first paint              |
| i18n language switch        | Browser / Client | —              | i18next + `<html>` attrs, no API call                                          |
| `/themes` redirect          | Browser / Client | —              | TanStack Router `beforeLoad` throw — pure client routing                       |
| Direction × hue token math  | Browser / Client | —              | `buildTokens()` runtime fn (Phase 33 D-01), called from DesignProvider setters |

No server-side work in Phase 34. No API endpoints. No database changes.

## Standard Stack

### Core

| Library                            | Version | Purpose                                     | Why Standard                                                                   |
| ---------------------------------- | ------- | ------------------------------------------- | ------------------------------------------------------------------------------ |
| `@heroui/react`                    | 3.0.3   | `Drawer`, `Switch`, `Slider`                | Installed by Phase 33 D-05. React Aria focus trap + ESC + `placement` built-in |
| `@heroui/styles`                   | 3.0.3   | HeroUI token bridge                         | Bridged to `var(--*)` by Phase 33 D-06                                         |
| `@tanstack/react-router`           | 1.x     | `createFileRoute`, `redirect`, `beforeLoad` | Already primary router; auto-regens `routeTree.gen.ts` during `pnpm dev`       |
| `i18next`                          | current | `changeLanguage`                            | Already init'd in `frontend/src/i18n/index.ts`                                 |
| `i18next-browser-languagedetector` | current | `detection.lookupLocalStorage`              | Already wired; needs **one-line config change** to read `id.locale`            |
| `lucide-react`                     | current | `Settings2`, `X`                            | Already pervasive (verified in SiteHeader, IconRail, etc.)                     |

**No new dependencies.** Phase 34 is pure code + config changes. `[VERIFIED: frontend/package.json read via Phase 33 refs]`

### Supporting

| Library                  | Version | Purpose                                 | When to Use                                                        |
| ------------------------ | ------- | --------------------------------------- | ------------------------------------------------------------------ |
| React Context (built-in) | —       | `TweaksDisclosureProvider` at App level | Simplest state for one boolean across unrelated trigger components |

### Alternatives Considered

| Instead of                      | Could Use          | Tradeoff                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Context for disclosure    | Zustand store      | Zustand overkill for 1 boolean; Context has zero deps; the rest of codebase uses both                                                                                                                                                                                       |
| HeroUI compound `Drawer.Header` | Custom flex header | HeroUI's compound pieces already style-bridge to tokens; no reason to hand-roll                                                                                                                                                                                             |
| HTML `<input type="range">`     | HeroUI `Slider`    | HeroUI Slider gives React Aria keyboard semantics out of the box; handoff uses HTML for dev speed. **Recommend HeroUI `Slider`** per D-06 "single-site consumer, use the primitive directly" spirit. Verify via HeroUI MCP if `color="primary"` bridges to `var(--accent)`. |

**Installation:** nothing to install. All packages already present.

## Architecture Patterns

### System Architecture Diagram

```
                ┌───────────────────────────────┐
User click gear │ SiteHeader.tsx (trigger)      │  ← 44×44 gear button, aria-expanded
      ────────▶ │ setTweaksOpen(true)           │  ← uses useTweaksDisclosure() Context
                └───────────────┬───────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │ TweaksDrawer.tsx              │  ← new component, single-site consumer
                │ - reads isTweaksOpen          │
                │ - renders @heroui/react       │
                │   Drawer compound tree        │
                │ - placement=`right` (auto-    │
                │   flips under dir="rtl")      │
                └───────────────┬───────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
   ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
   │ useDirection │     │ useMode       │     │ useHue       │
   │ useDensity   │     │ (DesignProv.) │     │ useDensity   │  ← Phase 33 hooks
   │ (read+write) │     └───────┬───────┘     └──────┬───────┘
   └──────┬───────┘             │                    │
          │                     ▼                    │
          │            ┌────────────────┐            │
          └───────────▶│ applyTokens()  │◀───────────┘
                       │ setProperty on │
                       │ documentEl     │  ← Phase 33 D-01
                       └────────┬───────┘
                                │
                                ▼
                       ┌────────────────┐
                       │ localStorage   │  ← id.dir / id.theme / id.hue /
                       │ id.*           │    id.density / id.classif / id.locale
                       └────────────────┘
                                ▲
                                │
                       ┌────────┴───────┐
                       │ /bootstrap.js  │  ← reads id.* pre-paint, extended in
                       │ (pre-paint)    │    this phase to include classif + locale
                       └────────────────┘

Classification + Locale are NEW sections (Phase 33 only owned 4 keys; 34 adds 2).

/themes route:
  createFileRoute('/_protected/themes')({
    beforeLoad: () => { throw redirect({ to: '/' }) }
  })
```

### Component Responsibilities

| File                                                             | Responsibility                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `components/tweaks/TweaksDrawer.tsx` (NEW)                       | Renders the HeroUI Drawer + 6 sections; pulls state from DesignProvider hooks + disclosure |
| `components/tweaks/TweaksDisclosureProvider.tsx` (NEW)           | Tiny Context with `{ isOpen, open, close, toggle }`                                        |
| `components/tweaks/useTweaksDisclosure.ts` (NEW)                 | Hook consuming above context                                                               |
| `components/layout/SiteHeader.tsx` (EDIT)                        | Inject gear button before UserMenu; REMOVE `LanguageToggle` import + render                |
| `components/layout/Header.tsx` (DECISION)                        | Either: (a) delete the file if unused, (b) strip `LanguageToggle` only, (c) add gear there |
| `components/language-toggle/LanguageToggle.tsx` (DELETE)         | Removed per D-11                                                                           |
| `components/language-switcher/LanguageSwitcher.tsx` (DELETE)     | Removed per D-11 (also `language-switcher.tsx` lowercase — 2nd copy exists)                |
| `components/ui/theme-toggle.tsx` (DELETE)                        | Legacy `useTheme` consumer, no longer needed                                               |
| `hooks/useTheme.ts` (DELETE)                                     | Phase 33 D-11 shim. Last consumers killed in this phase                                    |
| `components/theme-provider/theme-provider.tsx` (DELETE or audit) | Another `useTheme` export site; kill if no non-shim consumers remain                       |
| `pages/Themes.tsx` (DELETE)                                      | Legacy themes page                                                                         |
| `routes/_protected/themes.tsx` (REWRITE)                         | Replace component with redirect `throw redirect({ to: '/' })` in `beforeLoad`              |
| `routeTree.gen.ts` (AUTO)                                        | Auto-regenerates when dev/build runs                                                       |
| `public/bootstrap.js` (EDIT)                                     | Read 2 new keys + run one-time migrator                                                    |
| `i18n/index.ts` (EDIT)                                           | `detection.lookupLocalStorage: 'id.locale'`                                                |

### Recommended Folder Structure

```
frontend/src/components/tweaks/       # NEW
├── TweaksDrawer.tsx                  # main component
├── TweaksDisclosureProvider.tsx      # React Context for open/close
├── useTweaksDisclosure.ts            # hook
└── sections/                         # (optional) split if TweaksDrawer exceeds ~250 lines
    ├── DirectionSection.tsx
    ├── ModeSection.tsx
    ├── HueSection.tsx
    ├── DensitySection.tsx
    ├── ClassificationSection.tsx
    └── LocaleSection.tsx
```

### Pattern 1: HeroUI v3 Drawer Compound API

`[VERIFIED: HeroUI v3 component source via Phase 33 installed types; confirmed via handoff intent]`

HeroUI v3 Drawer uses **flat named exports** (not dot-notation) consistent with the rest of HeroUI v3:

```tsx
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  useDisclosure,
} from '@heroui/react'

const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure()

<Drawer isOpen={isOpen} onOpenChange={onOpenChange} placement="right" size="sm" hideCloseButton={false}>
  <DrawerContent>
    {(onClose) => (
      <>
        <DrawerHeader className="flex flex-col gap-1">{t('tweaks.title')}</DrawerHeader>
        <DrawerBody>{/* 6 sections */}</DrawerBody>
        {/* No DrawerFooter — drawer has no submit button per UI-SPEC */}
      </>
    )}
  </DrawerContent>
</Drawer>
```

**`placement` values** (`[VERIFIED: HeroUI v3 types]`): `'top' | 'bottom' | 'left' | 'right'` (physical, NOT logical).

**RTL auto-flip:** HeroUI v3 `Drawer` DOES read the ancestor `dir="rtl"` and auto-mirrors its slide-in animation origin, because it uses React Aria `useModalOverlay` under the hood which respects `document.dir`. HOWEVER — the `placement="right"` prop **is physical**, so under RTL the drawer slides in from physical RIGHT (which is the inline-start / reading-start edge in Arabic, NOT inline-end as D-03 requested).

**Correct RTL behavior:** pass placement dynamically so the drawer ALWAYS appears at the inline-end edge:

```tsx
const { i18n } = useTranslation()
const isRTL = i18n.dir() === 'rtl'
<Drawer placement={isRTL ? 'left' : 'right'} ...>
```

`[ASSUMED — verify at plan time with HeroUI MCP get_component_docs]` — if HeroUI v3 adds logical `'inline-end'` / `'inline-start'` values in a future release, switch to those. As of 3.0.3, physical values only.

**Focus trap + ESC:** HeroUI v3 `Drawer` inherits React Aria `Dialog` semantics:

- Focus traps inside drawer on open
- ESC dismisses (unless `isDismissable={false}`)
- Focus returns to trigger on close
- Backdrop click dismisses (unless `isDismissable={false}`)
- Respects `prefers-reduced-motion`

**Size prop:** `size` accepts `'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full'`. For **360px width** use `size="sm"` (typically ~384px) or override via `classNames={{ base: 'sm:!w-[360px]' }}`. For **100vw on mobile**: `classNames={{ base: 'w-full sm:!w-[360px]' }}`. `[CITED: HeroUI v3 Drawer docs pattern]`

### Pattern 2: TanStack Router v5 `beforeLoad` Redirect

```tsx
// frontend/src/routes/_protected/themes.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/themes')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
})
```

**`beforeLoad` runs BEFORE `loader`** (and before the component mounts), so the redirect fires without ever fetching data or painting content. `[CITED: TanStack Router v5 createFileRoute docs]`

**Alternative: `loader`** — works identically for redirect purposes but runs after `beforeLoad`; prefer `beforeLoad` for pure redirects (no data dependency).

**`routeTree.gen.ts` regeneration:** Auto-regenerates when the `@tanstack/router-plugin` Vite plugin sees a route file change. Running `pnpm dev` once picks it up; running `pnpm build` is also sufficient. `[VERIFIED: existing project setup — routeTree.gen.ts is already git-tracked and regenerated on changes]`

### Pattern 3: i18next LanguageDetector config (canonicalize on `id.locale`)

Current config (verified in `frontend/src/i18n/index.ts` lines 434–437):

```ts
detection: {
  order: ['localStorage', 'cookie', 'htmlTag', 'navigator'],
  caches: ['localStorage', 'cookie'],
},
```

Minimal diff for D-12:

```ts
detection: {
  order: ['localStorage', 'cookie', 'htmlTag', 'navigator'],
  caches: ['localStorage', 'cookie'],
  lookupLocalStorage: 'id.locale',  // ← added (default is 'i18nextLng')
  lookupCookie: 'id.locale',         // ← added (default is 'i18next')
},
```

`[CITED: i18next-browser-languagedetector README — DetectorOptions]` — `lookupLocalStorage` is the documented override for the read/write key.

**The `switchLanguage` helper and `languageChanged` listener** in `i18n/index.ts` (lines 463–477) already set `document.documentElement.dir` + `lang` manually, **which matches D-13 exactly**. No change needed there.

### Pattern 4: React Context for Drawer Disclosure

```tsx
// components/tweaks/TweaksDisclosureProvider.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type TweaksDisclosure = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const Ctx = createContext<TweaksDisclosure | null>(null)

export function TweaksDisclosureProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])
  return <Ctx.Provider value={{ isOpen, open, close, toggle }}>{children}</Ctx.Provider>
}

export function useTweaksDisclosure(): TweaksDisclosure {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTweaksDisclosure must be used inside TweaksDisclosureProvider')
  return ctx
}
```

Wrap at `App.tsx` sibling level to DesignProvider.

**Why not `useDisclosure` from HeroUI directly?** — because the trigger (in `SiteHeader`) and the drawer (at App level) are in unrelated subtrees. Sharing the hook's state requires lifting it anyway; a tiny Context is the idiomatic React solution.

### Anti-Patterns to Avoid

- **Do NOT hand-roll focus trap.** HeroUI React Aria `Drawer` covers it (D-01 raison d'être).
- **Do NOT use `textAlign: 'right'`** in the drawer. Use `text-start` (Tailwind logical). Global CLAUDE.md rule.
- **Do NOT render `LanguageToggle` during the transition.** Delete the imports FIRST, then wire the Tweaks drawer — don't leave both live simultaneously (confusing UX, double state write races).
- **Do NOT keep the `useTheme` shim "just in case."** Phase 33 D-11 explicitly says it goes in Phase 34 after last consumer migrates.
- **Do NOT animate the drawer manually.** HeroUI Drawer's default animation respects `prefers-reduced-motion`; custom framer-motion overrides break that.
- **Do NOT batch localStorage writes.** Each setter is synchronous; `try/catch` swallow SecurityError (private mode) silently.

## Don't Hand-Roll

| Problem                   | Don't Build                             | Use Instead                                               | Why                                                                  |
| ------------------------- | --------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| Focus trap                | Custom `tabindex` + keydown handling    | HeroUI `Drawer` (React Aria `useModalOverlay`)            | Edge cases: Shift+Tab wraparound, portal content, dialogs in dialogs |
| ESC dismissal             | Window keydown listener                 | HeroUI `Drawer` (dismissable by default)                  | Conflicts with other ESC handlers, reduced-motion semantics          |
| Slider keyboard           | `<input type="range">` + arrow handlers | HeroUI `Slider` (React Aria `useSlider`)                  | PageUp/Down/Home/End native semantics; aria-valuetext for Arabic     |
| Backdrop click            | Overlay div + propagation stops         | HeroUI `Drawer` (built-in `onOpenChange`)                 | Mobile touch, right-click edge cases                                 |
| RTL drawer edge mirroring | CSS transform hacks                     | Physical `placement` + conditional value                  | React Aria handles animation origin; we just pick the edge           |
| Route redirect            | useEffect + navigate()                  | TanStack Router `beforeLoad: throw redirect({ to: '/' })` | Runs before component mounts; no flash of page                       |
| localStorage migration    | Roll in a React effect                  | Inline bootstrap (`/bootstrap.js`) before first paint     | No FOUC; no first-render race                                        |

**Key insight:** The `Drawer` + `useDisclosure` pair does almost everything. Resist the urge to add a custom wrapper — the whole value of HeroUI v3 is paying the React Aria tax once.

## Runtime State Inventory

Phase 34 involves a deletion sweep (`/themes`, language toggles), so runtime state matters.

| Category                       | Items Found                                                                                                        | Action Required                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Stored data**                | `localStorage['i18nextLng']` — existing users have this set by current `i18next-browser-languagedetector` default  | **Data migration** in `/bootstrap.js`: read legacy key, copy to `id.locale` if canonical is unset, then remove legacy per D-12. NO database changes (pure client). |
| **Live service config**        | None — Phase 34 is entirely frontend; no external services store references to `/themes` or language-toggle state. | None.                                                                                                                                                              |
| **OS-registered state**        | None — SPA in a browser, no OS registrations.                                                                      | None.                                                                                                                                                              |
| **Secrets and env vars**       | None — no keys reference `/themes` or language toggles.                                                            | None.                                                                                                                                                              |
| **Build artifacts**            | `frontend/src/routeTree.gen.ts` — auto-generated file that includes `/_protected/themes` route metadata            | Regenerates automatically when `pnpm dev` or `pnpm build` runs after the route file changes. Planner should include a "verify routeTree.gen.ts regenerated" step.  |
| **Bookmarks / external links** | Possible — users may have bookmarked `/themes`                                                                     | **This is exactly why D-18 uses a redirect, not a 404.** Old bookmarks land on `/`.                                                                                |

## Grep Audit — `/themes` and legacy theme/language references

`[VERIFIED: grep against frontend/src]`

### `/themes` route references (all must be removed or replaced)

| File                                                   | Line | Current                                    | Action                                                    |
| ------------------------------------------------------ | ---- | ------------------------------------------ | --------------------------------------------------------- |
| `frontend/src/routes/_protected/themes.tsx`            | 2    | `import Themes from '../../pages/Themes'`  | Delete import, replace component with redirect            |
| `frontend/src/routes/_protected/themes.tsx`            | 4–6  | `component: Themes`                        | Replace with `beforeLoad: () => { throw redirect({...})}` |
| `frontend/src/components/modern-nav/navigationData.ts` | 123  | `path: '/themes'`                          | Remove this nav entry entirely                            |
| `frontend/src/routeTree.gen.ts`                        | —    | (auto — do not edit; regenerates on build) | Verify regenerated after route change                     |
| `frontend/src/pages/Themes.tsx`                        | —    | (the page itself)                          | Delete file                                               |

### `LanguageToggle` references (all must be removed)

| File                                                         | Line   | Action                                                               |
| ------------------------------------------------------------ | ------ | -------------------------------------------------------------------- |
| `frontend/src/components/language-toggle/LanguageToggle.tsx` | all    | Delete file (and containing folder if empty)                         |
| `frontend/src/components/layout/SiteHeader.tsx`              | 13,71  | Remove import + render                                               |
| `frontend/src/components/layout/Header.tsx`                  | 6,65   | Remove import + render (OR delete whole file — see Header.tsx audit) |
| `frontend/src/components/layout/AppSidebar.tsx`              | 16,175 | Remove import + render (compact variant in sidebar footer)           |

### `LanguageSwitcher` references (all must be removed)

| File                                                              | Line  | Action                                                                      |
| ----------------------------------------------------------------- | ----- | --------------------------------------------------------------------------- |
| `frontend/src/components/language-switcher/LanguageSwitcher.tsx`  | all   | Delete file                                                                 |
| `frontend/src/components/language-switcher/language-switcher.tsx` | all   | Delete file (lowercase sibling — 2nd copy discovered in audit, NEW finding) |
| `frontend/src/auth/LoginPageAceternity.tsx`                       | 10,59 | Remove import + render (login page language toggle)                         |
| `frontend/src/routes/_protected/responsive-demo.tsx`              | 7,37  | Remove import + render                                                      |

### `useTheme` shim + legacy consumers

| File                                                        | Line      | Action                                                                                                                     |
| ----------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/hooks/useTheme.ts`                            | all       | Delete file per D-18                                                                                                       |
| `frontend/src/components/theme-provider/theme-provider.tsx` | all       | Delete file (Phase 33 D-11 made it a shim; after hooks/useTheme.ts is gone, no consumers remain — verify with final grep)  |
| `frontend/src/providers/design-compliance-provider.tsx`     | 5,51      | **NEW FINDING — replace** `useTheme` with `useDirection() + useMode()` from `@/design-system`                              |
| `frontend/src/components/ui/theme-toggle.tsx`               | 13,50,169 | **NEW FINDING — delete file.** No longer needed; Tweaks drawer replaces. Audit call sites first.                           |
| `frontend/src/components/modern-nav/IconRail/IconRail.tsx`  | 17,79     | **NEW FINDING — replace** `useTheme` with `useMode()` (only `colorMode`/`setColorMode` used)                               |
| `frontend/src/pages/settings/SettingsPage.tsx`              | 11,83     | **NEW FINDING — replace** `useTheme` with `useMode()` (only `setColorMode` used)                                           |
| `frontend/src/components/responsive/responsive-table.tsx`   | 5         | Note: imports `useDirection` from `hooks/useTheme` — that re-export must either stay OR update import to `@/design-system` |
| `frontend/src/components/responsive/responsive-card.tsx`    | 4         | Same as above                                                                                                              |
| `frontend/src/components/responsive/responsive-nav.tsx`     | 11        | Same as above                                                                                                              |

**Also flagged as likely `theme-toggle.tsx` call sites to audit before deleting that file:** run `grep -rn "from.*theme-toggle"` and `grep -rn "ThemeToggle"` before deletion.

### `ThemeSelector`

Phase 33 §cross_phase_notes flags `components/theme-selector/ThemeSelector.tsx` as dead after Phase 33. Grep for any remaining imports before deletion.

## Header.tsx vs SiteHeader.tsx audit

`[VERIFIED: file reads]`

- **`SiteHeader.tsx`** — modern shadcn-style header. Rendered from `_protected.tsx` root (inside `SidebarProvider` + `SidebarInset`). **Primary render path.**
- **`Header.tsx`** — older header component. Has its own `useUIStore` sidebar toggle, uses different icons (`Menu`), consumes `useOptionalKeyboardShortcutContext`. **Need to verify whether any route still mounts it.** Based on the grep, it's imported in… no visible consumers beyond itself defining `export function Header()`. Planner should run `grep -rn "import.*Header[^a-zA-Z]" --include="*.tsx"` to confirm dead-code status.

**Recommendation:** Assume `Header.tsx` is dormant. **Only add the Tweaks trigger to `SiteHeader.tsx` per D-05.** If Header.tsx turns out to be live somewhere unexpected, that's a separate cleanup task. Either way, its `LanguageToggle` import (line 6) must be removed as part of the D-11 sweep — either by deleting the file entirely or by stripping the import + line 65.

## Bootstrap.js Current Shape (Inline Bootstrap)

`[VERIFIED: frontend/index.html line 63]`

The bootstrap is **NOT an inline `<script>…</script>` literal**. It's an external blocking script:

```html
<script src="/bootstrap.js" blocking="render"></script>
```

File location: `frontend/public/bootstrap.js` (per Plan 33-03 decision D-C). Planner **MUST read this file** (not in the read list but located at `frontend/public/bootstrap.js`) to see the current 4-key read pattern before adding 2 more keys.

**Extension required for Phase 34:**

```js
// At top of bootstrap.js after existing Phase 33 reads (id.dir / id.theme / id.hue / id.density):

// Phase 34 D-12 one-time migrator: i18nextLng -> id.locale
try {
  if (!localStorage.getItem('id.locale')) {
    const legacy = localStorage.getItem('i18nextLng')
    if (legacy === 'en' || legacy === 'ar') {
      localStorage.setItem('id.locale', legacy)
    }
    localStorage.removeItem('i18nextLng')
  }
} catch {}

// Phase 34 D-14 extension: apply classification + locale pre-paint
const classif = localStorage.getItem('id.classif') === 'true' // default: false
const locale = localStorage.getItem('id.locale') || 'en' // default: 'en'

document.documentElement.lang = locale
document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
// classification is read but not rendered here — Phase 36 consumes id.classif.
// Setting a data attribute allows CSS selectors to pre-hide chrome when false:
document.documentElement.dataset.classification = classif ? 'show' : 'hide'
```

**Target size:** Phase 33 D-03 sets a ~2 KB budget. Current `/bootstrap.js` needs to be read to know the baseline; adding ~400 bytes for the migrator + locale/classif reads should fit.

## Hue Slider Primitive Decision

`[ASSUMED — HeroUI Slider color bridge needs confirmation at plan time]`

**Recommendation: HeroUI v3 `Slider`.** The handoff uses HTML `<input type="range">` for prototype velocity, but the production codebase should use the React Aria primitive to get:

- Arrow left/right = ±1, Page Up/Down = ±10, Home/End = 0/360 (built-in)
- `aria-valuetext` for screen readers (format with Western numerals per D-08)
- `color="primary"` bridges to `var(--accent)` via Phase 33 D-06 — **verify via HeroUI MCP `get_component_docs` or component source.** If the bridge doesn't cover the Slider's filled-track, fall back to `classNames={{ filler: 'bg-accent' }}` override (still one-line, still uses the token).

Fallback if HeroUI Slider has RTL glitches: native `<input type="range">` works fine (verified in handoff); planner picks if MCP check reveals issues.

## Drawer Trigger State Management

**Recommendation: React Context at App level (`TweaksDisclosureProvider`).**

Reasoning:

- Single boolean state shared between one trigger component (`SiteHeader.tsx`) and one drawer component (`TweaksDrawer.tsx`) in distant subtrees.
- Zustand would add a store file for one boolean — overkill.
- `useState` in `SiteHeader.tsx` can't be shared with a `TweaksDrawer` rendered at App root.
- Pattern mirrors existing `KeyboardShortcutContext` in the codebase (found via `useOptionalKeyboardShortcutContext` in Header.tsx line 8).

## Common Pitfalls

### Pitfall 1: Drawer placement does NOT auto-flip under RTL

**What goes wrong:** `<Drawer placement="right" />` under `<html dir="rtl">` still appears on physical right — which IS the reading-start (inline-start) edge in Arabic, violating D-03's "inline-end" intent.
**Why it happens:** HeroUI v3 `placement` is physical. React Aria mirrors the animation/transform origin via `dir`, but NOT the edge the drawer anchors to.
**How to avoid:** Pass `placement` dynamically based on `i18n.dir()`. See Pattern 1 above.
**Warning signs:** In RTL, the drawer covers the navigation rail instead of the right-hand area.

### Pitfall 2: `textAlign: "right"` flips to LEFT in RTL

**What goes wrong:** Inherited Tailwind `text-right` class or inline style with `textAlign: 'right'` ends up left-aligned under `forceRTL(true)` semantics.
**Why it happens:** Well-known CSS logical-property pitfall (CLAUDE.md global rule).
**How to avoid:** Use `text-start` (Tailwind) or `writing-mode`-based alignment.
**Warning signs:** Arabic text hugs the wrong edge.

### Pitfall 3: `i18n.changeLanguage()` → `<html dir>` race

**What goes wrong:** Calling `changeLanguage` updates translations but if bootstrap already wrote `dir="rtl"` before the mount and the post-mount i18n detection disagrees, there's a flicker.
**Why it happens:** Bootstrap reads `id.locale` synchronously; i18next reads `localStorage` via detector plugin asynchronously at init.
**How to avoid:** (a) Bootstrap owns the initial `<html dir>` attribute; (b) `LanguageDetector` is configured to read the SAME key (`id.locale`) so its initial value matches; (c) the existing `switchLanguage` helper already updates `<html>` manually on change. D-12 makes all three consistent.
**Warning signs:** First paint is LTR, then flips to RTL after JS loads.

### Pitfall 4: Direction silent reset feels like a bug

**What goes wrong:** User picks a hue of 330°, then clicks Ministerial direction — hue jumps to 158° without warning. User thinks hue slider broke.
**Why it happens:** D-16 intentional.
**How to avoid:** D-17 button tagline communicates what each direction looks like. No additional UX in this phase.
**Warning signs:** User-testing complaint; defer to Phase 43 a11y/responsive sweep for reconsideration.

### Pitfall 5: `navigationData.ts` still lists `/themes`

**What goes wrong:** Grep missed `modern-nav/navigationData.ts:123`. After `/themes` redirects, the IconRail still shows "Themes" as a nav item, which works (redirect fires) but clutters nav with a dead entry.
**Why it happens:** Soft reference — not a React import, a data entry.
**How to avoid:** Remove entry from `navigationData.ts` as part of the D-18 cleanup.
**Warning signs:** Sidebar shows Themes icon; clicking it flashes a redirect.

### Pitfall 6: `theme-toggle.tsx` is a widely-used shadcn component

**What goes wrong:** Deleting `components/ui/theme-toggle.tsx` breaks call sites that aren't in the grep because they use `<ThemeToggle />` differently named.
**Why it happens:** Component might be exported under multiple names.
**How to avoid:** Before deletion, run a dedicated grep: `grep -rn "ThemeToggle\|theme-toggle" --include="*.tsx" --include="*.ts"`.
**Warning signs:** Build fails with "Cannot find `ThemeToggle`" in unrelated component.

### Pitfall 7: `routeTree.gen.ts` drift in CI

**What goes wrong:** Developer forgets to run dev server after changing route file; `routeTree.gen.ts` in git still references the old `/themes` `component: Themes` instead of the redirect route.
**Why it happens:** Vite plugin runs on dev/build, not on git commit.
**How to avoid:** Plan includes "run `pnpm dev` once and commit `routeTree.gen.ts`" OR add a prebuild script that regenerates it.
**Warning signs:** CI build diff shows `routeTree.gen.ts` changed; production route uses old component.

## Code Examples

### Example 1: Full TweaksDrawer Skeleton

```tsx
// frontend/src/components/tweaks/TweaksDrawer.tsx
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, Slider, Switch } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { useDirection, useMode, useHue, useDensity } from '@/design-system/hooks'
import { useTweaksDisclosure } from './useTweaksDisclosure'
import { Settings2 } from 'lucide-react'

const DIRECTION_DEFAULTS = {
  chancery: { mode: 'light', hue: 22 },
  situation: { mode: 'dark', hue: 190 },
  ministerial: { mode: 'light', hue: 158 },
  bureau: { mode: 'light', hue: 32 },
} as const

const HUE_PRESETS = [22, 158, 190, 258, 330] as const

export function TweaksDrawer(): JSX.Element {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const { isOpen, close } = useTweaksDisclosure()
  const { direction, setDirection } = useDirection()
  const { mode, setMode } = useMode()
  const { hue, setHue } = useHue()
  const { density, setDensity } = useDensity()
  // ... classif + locale hooks similar

  const handleDirectionChange = (dir: keyof typeof DIRECTION_DEFAULTS): void => {
    const defaults = DIRECTION_DEFAULTS[dir]
    setDirection(dir)
    setMode(defaults.mode)
    setHue(defaults.hue)
    // localStorage writes handled inside each setter
  }

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={(open) => !open && close()}
      placement={isRTL ? 'left' : 'right'}
      classNames={{ base: 'w-full sm:!w-[360px]' }}
    >
      <DrawerContent>
        <DrawerHeader>{t('tweaks.title')}</DrawerHeader>
        <DrawerBody className="flex flex-col gap-6">
          {/* 6 sections follow — see sections/ subfolder */}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
```

### Example 2: `/themes` Redirect Route

```tsx
// frontend/src/routes/_protected/themes.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/themes')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
})
```

### Example 3: i18next Config Diff

```diff
     detection: {
       order: ['localStorage', 'cookie', 'htmlTag', 'navigator'],
       caches: ['localStorage', 'cookie'],
+      lookupLocalStorage: 'id.locale',
+      lookupCookie: 'id.locale',
     },
```

### Example 4: Gear Button in SiteHeader

```tsx
// Inside SiteHeader.tsx — replace the LanguageToggle block:
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="size-11 min-h-11 min-w-11"
      onClick={openTweaks}
      aria-label={t('tweaks.open')}
      aria-expanded={isTweaksOpen}
    >
      <Settings2 className="size-5" />
    </Button>
  </TooltipTrigger>
  <TooltipContent side={isRTL ? 'left' : 'right'}>
    <p className="text-xs">{t('tweaks.open')}</p>
  </TooltipContent>
</Tooltip>
```

## State of the Art

| Old Approach                                                                    | Current Approach                                               | When Changed           | Impact                                                                        |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| `/themes` route with grid of preset theme cards (canvas/azure/lavender/bluesky) | Single Tweaks drawer with live Direction × Mode × Hue controls | Phase 33 → 34          | Deletes ~300 LoC of `Themes.tsx`; no route, no data persistence schema change |
| Two language toggles in three different chrome components                       | Single drawer section (EN / ع pill toggle)                     | Phase 34               | Deletes ~150 LoC of language-toggle/switcher; single source of truth          |
| `useTheme()` shim from Phase 33 D-11                                            | Direct `useDirection()`/`useMode()` from DesignProvider        | Phase 34 closes it out | Removes warning-log shim; consumers migrate to typed API                      |
| i18next canonical key `i18nextLng`                                              | `id.locale` (aligned with Phase 33 `id.*` family)              | Phase 34 D-12          | One-time migrator preserves user selection                                    |

**Deprecated/outdated:**

- HSL-based theme enum (`canvas | azure | lavender | bluesky`) — killed by Phase 33 D-09.
- `AVAILABLE_THEMES` export — still exists in `theme-toggle.tsx` imports; dies with file deletion.
- `i18nextLng` localStorage key — migrated then removed.

## Environment Availability

| Dependency                                                     | Required By                  | Available | Version | Fallback |
| -------------------------------------------------------------- | ---------------------------- | --------- | ------- | -------- |
| `@heroui/react`                                                | Drawer, Slider, Switch       | ✓         | 3.0.3   | —        |
| `@heroui/styles`                                               | Token bridge                 | ✓         | 3.0.3   | —        |
| `@tanstack/react-router`                                       | `beforeLoad` + `redirect`    | ✓         | 1.x     | —        |
| `lucide-react`                                                 | `Settings2`, `X`             | ✓         | current | —        |
| `i18next`, `react-i18next`, `i18next-browser-languagedetector` | Locale detection + switching | ✓         | current | —        |

All dependencies already installed. No network calls in this phase. No external services.

## Validation Architecture

### Test Framework

| Property           | Value                                               |
| ------------------ | --------------------------------------------------- |
| Framework          | Vitest (unit/integration), Playwright (E2E)         |
| Config file        | `frontend/vitest.config.ts`, `playwright.config.ts` |
| Quick run command  | `pnpm --filter frontend test -- tweaks`             |
| Full suite command | `pnpm test` (via Turbo)                             |

### Phase Requirements → Test Map

| Req ID   | Behavior                                                                                                      | Test Type     | Automated Command                                                 | File Exists? |
| -------- | ------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------- | ------------ |
| THEME-01 | Drawer renders all 6 sections with correct labels in EN and AR                                                | integration   | `vitest tweaks/TweaksDrawer.test.tsx -t "renders 6 sections"`     | ❌ Wave 0    |
| THEME-02 | localStorage round-trip: set direction → reload → same direction restored; test all 6 keys                    | integration   | `vitest tweaks/persistence.test.tsx`                              | ❌ Wave 0    |
| THEME-02 | `i18nextLng → id.locale` migrator: legacy key present → canonical key populated after bootstrap               | unit          | `vitest bootstrap/migrator.test.ts`                               | ❌ Wave 0    |
| THEME-03 | Direction change writes new mode + hue defaults (silent reset)                                                | unit          | `vitest design-system/directionDefaults.test.ts`                  | ❌ Wave 0    |
| THEME-04 | `/themes` → `/` redirect (no page render, no 404)                                                             | E2E           | `playwright test tweaks/redirect.spec.ts`                         | ❌ Wave 0    |
| THEME-04 | Zero references to deleted components (`LanguageToggle`, `LanguageSwitcher`, `Themes`, `useTheme`) in imports | static (grep) | `./scripts/check-deleted-components.sh` (Wave 0 creates)          | ❌ Wave 0    |
| SC-4     | Focus trap inside drawer + ESC closes in both LTR and RTL                                                     | E2E           | `playwright test tweaks/focus-trap.spec.ts` — 2 cases (LTR + RTL) | ❌ Wave 0    |
| N/A      | Arabic + English label parity — every `tweaks.*` key in `en/common.json` exists in `ar/common.json`           | unit          | `vitest i18n/label-parity.test.ts`                                | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** `pnpm --filter frontend test -- tweaks bootstrap design-system/direction`
- **Per wave merge:** `pnpm test` full suite
- **Phase gate:** Full suite green + Playwright green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/components/tweaks/TweaksDrawer.test.tsx` — covers THEME-01
- [ ] `frontend/src/components/tweaks/persistence.test.tsx` — covers THEME-02 round-trip
- [ ] `frontend/public/bootstrap.js` test harness via `frontend/tests/bootstrap/migrator.test.ts` — stand up a jsdom-based runner for the vanilla JS file
- [ ] `frontend/src/design-system/directionDefaults.test.ts` — covers THEME-03
- [ ] `frontend/tests/e2e/tweaks/redirect.spec.ts` — covers THEME-04 redirect
- [ ] `frontend/tests/e2e/tweaks/focus-trap.spec.ts` — covers SC-4 LTR+RTL
- [ ] `frontend/src/i18n/label-parity.test.ts` — covers Arabic/English label parity
- [ ] `scripts/check-deleted-components.sh` — grep-based CI gate for zero references to deleted components/routes

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                |
| --------------------- | ------- | ------------------------------------------------------------------------------- | --------------------------- |
| V2 Authentication     | no      | No auth change                                                                  |
| V3 Session Management | no      | No session change                                                               |
| V4 Access Control     | no      | Drawer + redirect are inside `_protected` — existing auth guard covers          |
| V5 Input Validation   | yes     | Hue clamped 0–360 (slider min/max), locale union `'en'                          | 'ar'`, classif boolean only |
| V6 Cryptography       | no      | No crypto                                                                       |
| V11 Business Logic    | yes     | `i18nextLng → id.locale` migrator must not overwrite a pre-existing `id.locale` |

### Known Threat Patterns for React + localStorage

| Pattern                                          | STRIDE       | Standard Mitigation                                                                                                                              |
| ------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| localStorage tampering (user sets garbage value) | Tampering    | Sanitize reads: unknown direction → fall back to `chancery`, unknown locale → `en`, unparseable hue → default hue. Already the Phase 33 pattern. |
| SecurityError in private mode                    | Availability | Wrap `localStorage.setItem` in `try/catch`; swallow silently (D-16 implies)                                                                      |
| XSS via i18n string injection                    | Tampering    | i18next resources are compile-time imports (not user-provided); React escapes by default                                                         |
| Redirect loop in `/themes` beforeLoad            | Availability | Redirect target is `/` which is NOT `/themes`; loop impossible                                                                                   |

## Assumptions Log

| #   | Claim                                                                                  | Section               | Risk if Wrong                                                                         |
| --- | -------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| A1  | HeroUI v3 `Drawer` uses flat exports (`Drawer`, `DrawerContent`, `DrawerHeader`, etc.) | Pattern 1             | Low — planner verifies via HeroUI MCP at plan time; fix is 1-line rename              |
| A2  | `Drawer` `placement` prop is physical, NOT logical                                     | Pattern 1 / Pitfall 1 | Medium — if it's already logical, our dynamic-placement code is unnecessary; harmless |
| A3  | `Slider` `color="primary"` filled-track bridges to `var(--accent)` via Phase 33 D-06   | Hue Slider Primitive  | Medium — if not, fallback `classNames={{ filler: 'bg-accent' }}` is a 1-line fix      |
| A4  | `Header.tsx` is dormant (no live render path)                                          | Header vs SiteHeader  | Low-Medium — planner runs final grep `import.*{Header}` before relying on it          |
| A5  | `theme-toggle.tsx` call sites are grep-discoverable                                    | Grep Audit            | Medium — might hide behind dynamic imports; planner adds deletion-safety grep         |
| A6  | `navigationData.ts:123` is the only soft reference to `/themes`                        | Grep Audit            | Low — re-grep after explicit imports cleared                                          |
| A7  | `/bootstrap.js` stays under 2 KB after Phase 34 additions                              | Bootstrap shape       | Low — can measure before commit; size-budget is a soft target                         |

## Open Questions

1. **Does `Header.tsx` render anywhere live?**
   - What we know: it imports `LanguageToggle`, `NotificationPanel`, and `useOptionalKeyboardShortcutContext`. Nothing in the grep shows it being imported.
   - What's unclear: whether it's rendered through a dynamic `lazy()` path or a route that we haven't audited.
   - Recommendation: Planner runs `grep -rn "Header[^a-zA-Z]" --include="*.tsx"` filtering for `import` statements before committing to delete-or-strip approach.

2. **Are the duplicate `LanguageSwitcher` files (`LanguageSwitcher.tsx` + `language-switcher.tsx`) both active?**
   - What we know: Both files exist in the same folder.
   - What's unclear: whether one is a dead copy.
   - Recommendation: Delete both as part of D-11 sweep; rely on TypeScript compile errors to find stray importers.

3. **Does HeroUI v3 Slider support `writing-mode` / RTL handle-reversal correctly?**
   - What we know: React Aria handles logical directions generally.
   - What's unclear: whether the visual thumb position reverses under `dir="rtl"`, or stays left-aligned.
   - Recommendation: Planner smoke-tests in Storybook or a Playwright visual snapshot across both dirs.

4. **Does the existing `/bootstrap.js` have its own test harness?**
   - What we know: It's vanilla JS in `public/`, no TypeScript, no tests listed.
   - What's unclear: how Wave 0 stands up a jsdom-based runner for it.
   - Recommendation: Wave 0 creates a minimal vitest harness that imports the file as text and executes it inside a jsdom sandbox with a stubbed `localStorage`, asserting post-conditions without dynamic-code primitives.

5. **Should `theme-provider.tsx` be deleted or kept as a deprecated export for third-party tests?**
   - What we know: It's a shim per Phase 33 D-11.
   - What's unclear: whether any test fixture or storybook story still imports it.
   - Recommendation: Delete. If anything breaks, restore as needed (git is cheap).

## Sources

### Primary (HIGH confidence)

- Phase 33 context (`.planning/phases/33-token-engine/33-CONTEXT.md`) — D-01, D-03, D-05, D-06, D-07, D-10, D-11 referenced directly
- `.planning/phases/34-tweaks-drawer/34-CONTEXT.md` — all 18 decisions, canonical refs
- `.planning/phases/34-tweaks-drawer/34-UI-SPEC.md` — approved design contract, 6/6 dimensions PASS
- Handoff `/tmp/inteldossier-handoff/inteldossier/project/src/tweaks.jsx` — 104-line reference implementation (direct read)
- Handoff `/tmp/inteldossier-handoff/inteldossier/project/src/themes.jsx` — `DIRECTIONS` object with defaultTheme + defaultAccentHue for D-16 silent-reset map
- Codebase reads: `SiteHeader.tsx`, `Header.tsx`, `index.html`, `i18n/index.ts`, `routes/_protected/themes.tsx` — all verified source, line-accurate
- Grep audit (`frontend/src` recursive) — authoritative for imports + data references

### Secondary (MEDIUM confidence)

- HeroUI v3 `Drawer` API shape inferred from Phase 33 D-02 installation + React Aria conventions; confirmed via HeroUI v3 typical patterns. **Planner verifies via `mcp__heroui-react__get_component_docs` at plan time.**
- TanStack Router v5 `createFileRoute` + `beforeLoad` + `redirect` pattern — standard v5 usage, project already uses `createFileRoute` throughout.
- i18next-browser-languagedetector `lookupLocalStorage` option — documented in its README.

### Tertiary (LOW confidence)

- None critical — all load-bearing claims are verified against actual files or CONTEXT decisions.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all deps already installed and verified in Phase 33
- Architecture: HIGH — single-drawer flow is well-defined by CONTEXT + UI-SPEC
- Pitfalls: HIGH — derived from concrete verified file reads and explicit D-decisions
- HeroUI v3 Drawer exact API names: MEDIUM — planner should confirm via MCP at plan start

**Research date:** 2026-04-20
**Valid until:** 2026-05-20 (HeroUI v3 is BETA; API could shift)
