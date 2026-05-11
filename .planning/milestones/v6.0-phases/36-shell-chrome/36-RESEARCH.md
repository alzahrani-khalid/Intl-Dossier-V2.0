# Phase 36: shell-chrome — Research

**Researched:** 2026-04-22
**Domain:** React 19 app-shell chrome (sidebar + topbar + direction-aware classification bar) over HeroUI v3 + shadcn re-exports, Tailwind v4 logical properties, Arabic RTL + English LTR
**Confidence:** HIGH for decided scope; MEDIUM for GASTAT SVG tint path (class-based SVG needs adaptation); MEDIUM for HeroUI Drawer concurrency (no explicit docs but stack is portal-based and proven)

## Summary

Phase 36 is a **chrome-replacement phase, not a feature phase**. The user has pre-decided 8 of the 8 top-level design questions (D-01..D-08); the UI-SPEC was checker-approved 6/6. Research confirms the handoff source (`/tmp/inteldossier-handoff/inteldossier/project/src/` — 11 files, 385KB, all present) and surfaces **four pre-planning risks** the plan must address:

1. **GASTAT SVG is class-driven with EMPTY `<defs>` and NO `<style>` block.** The handoff file defines 12 `cls-N` classes on `<path>` elements but provides no color bindings. D-07's "swap every `fill`/`stroke` to `currentColor`" approach does not apply cleanly — there are no such attributes to swap. Recommendation: the plan's logo task must include inspecting the original published stylesheet (likely living in the handoff's CSS) and **rewriting the SVG as React TSX with `fill="currentColor"` on every `<path>`** while discarding the class attributes. Confidence: HIGH (verified by `grep` on the 6704-byte file).

2. **HeroUI v3 Drawer concurrency** — two simultaneous Drawer instances (Tweaks + mobile Sidebar) is not explicitly documented but is portal-based with independent `isOpen`/`onOpenChange` controllers. The Phase 34 Tweaks drawer uses the compound `Drawer.Root/Content/Header/Body/Footer` shape. Recommendation: reuse the same primitive for Sidebar with a distinct state atom (`useSidebarOpen`) — verify at implementation time by mounting both concurrently in a Vitest component test (added to Wave 0).

3. **Classification chrome (SHELL-03)** — LOCKED in UI-SPEC as a **single `<ClassificationBar direction={...}>` with internal switch**. This matches handoff `shell.jsx:193-208`. Planner must emit three DOM positions from one component: marginalia (above main), ribbon (banner inside grid-row between topbar and main), chip (inline at `<main>`'s page-head start).

4. **`_protected.tsx` is the ONLY route importing `MainLayout`** — grep confirmed exactly 2 files touch `MainLayout` (`MainLayout.tsx` itself + `_protected.tsx`). This makes D-04's import swap a single-file edit. Deletion plan is tight.

**Primary recommendation:** Plan 36 as 6 sequential tasks: (36-01) Wave 0 / navigation-config `section` lock-in + i18n key scaffolding, (36-02) `GastatLogo.tsx` from SVG, (36-03) `AppShell.tsx` + `Sidebar.tsx` + `Topbar.tsx` + `ClassificationBar.tsx` compositions, (36-04) `_protected.tsx` swap + old-component deletion + CI gate extension, (36-05) responsive drawer + focus trap + RTL verify, (36-06) Nyquist validation + visual smoke-check matrix (4 directions × 2 locales × 3 breakpoints = 24 spot-checks).

## Project Constraints (from CLAUDE.md)

**MANDATORY — will be checked against plan and implementation:**

- **Web/Tailwind RTL:** logical properties ONLY — `ms-*/me-*/ps-*/pe-*/start-*/end-*/text-start/text-end/rounded-s-*/rounded-e-*`. **FORBIDDEN:** `ml-*/mr-*/pl-*/pr-*/left-*/right-*/text-left/text-right/rounded-l-*/rounded-r-*`.
- **Dir attribute:** `dir={isRTL ? 'rtl' : 'ltr'}` on root-level containers.
- **Mobile-first:** base (320px) → sm (640px) → md (768px) → lg (1024px) → xl (1280px) → 2xl (1536px). Never desktop-first.
- **Touch targets:** `min-h-11 min-w-11` (44×44 px) for every interactive element on ≤768px viewports.
- **Karpathy:** surgical changes — delete `MainLayout`/`AppSidebar`/`SiteHeader`/`MobileBottomTabBar` fully, no legacy-rename shim. Every line in `AppShell.tsx` must trace to a UI-SPEC requirement.
- **GSD workflow:** edits go through GSD command entry; Phase 36 is `/gsd:execute-phase` terrain.
- **HeroUI v3 BETA:** no v2 fallback, no migration guides — rely on installed `@heroui/react@3.0.3` + `@heroui/styles@3.0.3` + `@radix-ui/react-slot` + `cva`. [VERIFIED: package.json grep]

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01** — Fresh `AppShell.tsx` replaces `MainLayout.tsx` entirely; mounts `DesignProvider` → `TweaksDisclosureProvider` → `Sidebar` / `Topbar` / `ClassificationBar` / `<main>` (slot). [LOCKED]
- **D-02** — `components/ui/sidebar.tsx` (shadcn primitive) PRESERVED. Provides `SidebarProvider`, `SidebarInset`, cookie persistence, `useSidebar` hook. [LOCKED]
- **D-03** — `navigation-config.ts` PRESERVED. Extend with `section: 'operations' | 'dossiers' | 'administration'` discriminator. (Already exists — see verified finding below.) [LOCKED]
- **D-04** — Every `_protected.tsx` imports `AppShell` instead of `MainLayout`. `MainLayout.tsx` deleted when phase closes. CI-gate prevents reintroduction. [LOCKED]
- **D-05** — Delete `MobileBottomTabBar.tsx`. Single mobile-nav = full-screen overlay drawer triggered by hamburger at `inset-inline-start` of topbar. [LOCKED]
- **D-06** — Reuse HeroUI `Drawer` primitive for sidebar overlay (same pattern as Phase 34 Tweaks). Researcher to confirm two-concurrent-instance safety. [see UI-SPEC locked]
- **D-07** — Inline React SVG at `frontend/src/components/brand/GastatLogo.tsx`. `fill`/`stroke` → `"currentColor"`. Props: `className`, `size` (default 22). **⚠ Research found the SVG has NO inline fill/stroke attrs — see Standard Stack below for adaptation.** [LOCKED with research caveat]
- **D-08** — Handoff `GASTAT_LOGO.svg` is the authoritative source. Path verified: `/tmp/inteldossier-handoff/inteldossier/project/reference/GASTAT_LOGO.svg` (6704 bytes, readable). [VERIFIED]

### Claude's Discretion

- **Classification chrome (SHELL-03)** — UI-SPEC already locked **single `<ClassificationBar direction={...}>`** (handoff parity). [RESOLVED in UI-SPEC]
- **Nav section taxonomy** — RESOLVED: existing `navigation-config.ts` already uses `id: 'operations' | 'dossiers' | 'administration'`. 3-group structure matches UI-SPEC verbatim. [RESOLVED — no changes needed to config TS, only consumers wire to new `section` lookups.]
- **Topbar item order** — LOCKED in UI-SPEC §Topbar Anatomy (hamburger / search / direction-switcher / bell / theme / locale / Tweaks). [RESOLVED]
- **Drawer trigger icon** — `Menu` (lucide). [RESOLVED in UI-SPEC]
- **Active-nav 2px bar** — `::before` pseudo-element with `inset-inline-start:0`. [RESOLVED in UI-SPEC]
- **User card anatomy** — avatar initials + name + role; org is OMITTED (duplicates workspace). [RESOLVED in UI-SPEC]
- **Cookie key** — `sidebar_state` (reuse shadcn default). [RESOLVED]
- **Tweaks gear re-wire** — same `useTweaksOpen()` hook, new location inside Topbar. [RESOLVED]
- **CI-gate extension** — extend existing `scripts/check-deleted-components.sh` (file EXISTS — verified). [VERIFIED]

### Deferred Ideas (OUT OF SCOPE)

- ⌘K command palette behavior — visual hint only in Phase 36.
- Notification bell dropdown UI — Phase 42.
- Dashboard/Kanban/List page content — Phase 38-42.
- `<GlobeLoader>` splash — Phase 37.
- LanguageProvider legacy `i18nextLng` migration tech debt — tangential (bootstrap.js already handles one-time migration on line 38-44).
- Full accessibility audit sweep — Phase 43.
- Visual-regression baseline matrix (24-snapshot) — Phase 43 or interim.

## Phase Requirements

| ID       | Description (from REQUIREMENTS.md)                                                                                                                                           | Research Support                                                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| SHELL-01 | 256px sidebar with brand mark + app name + workspace + user card + 3 nav sections + footer; 2px accent bar at `inset-inline-start:0` on active item                          | Sidebar Anatomy UI-SPEC; handoff `shell.jsx:62-84`; `app.css:23,41,67` verified; `navigation-config.ts` already emits 3 groups |
| SHELL-02 | 56px topbar with search pill + ⌘K kbd + direction switcher (4 buttons) + bell+badge + theme toggle + locale toggle + Tweaks button                                           | Topbar Anatomy UI-SPEC; handoff `shell.jsx:146-189`; Phase 34 `useTweaksOpen()` reused                                         |
| SHELL-03 | Direction-specific classification chrome: Chancery=marginalia, Situation=ribbon, Ministerial/Bureau=chip, all sourced from `workspace + classification level + session info` | Single `<ClassificationBar direction={...}>` component — LOCKED in UI-SPEC; handoff `shell.jsx:193-208` + `app.css:195-197`    |
| SHELL-04 | Responsive overlay drawer ≤1024px (280px, `translateX(-100%)`, RTL flips to `translateX(100%)`); full-screen drawer + wrapped topbar ≤640px                                  | HeroUI Drawer with `placement="start"` (auto-flips under `dir="rtl"`); Tailwind `lg:hidden` gate for hamburger visibility      |
| SHELL-05 | Real `GASTAT_LOGO.svg` at 22×22, tinted via `currentColor` in active accent color                                                                                            | SVG path verified; but ⚠ see Standard Stack note — SVG needs color-class → currentColor rewrite, not attribute swap            |

## Architectural Responsibility Map

| Capability                                             | Primary Tier                           | Secondary Tier   | Rationale                                                                                                |
| ------------------------------------------------------ | -------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| AppShell composition (React tree)                      | Browser / Client                       | —                | All state (direction, mode, locale, classif, sidebar-open) lives in React + localStorage; no server code |
| FOUC pre-paint (direction, dir, lang, classif, tokens) | Browser / Client (`bootstrap.js`)      | —                | Runs BEFORE React boots; writes to `document.documentElement`                                            |
| i18n key resolution                                    | Browser / Client                       | —                | react-i18next runs in-browser; bundled at build time                                                     |
| Cookie persistence (`sidebar_state`)                   | Browser / Client                       | —                | shadcn primitive sets cookie via JS; no server read                                                      |
| Classification visibility gate                         | Browser / Client                       | —                | `useClassification()` from TweaksDisclosureProvider (in-memory + localStorage `id.classif`)              |
| Token application (`applyTokens()`)                    | Browser / Client                       | —                | DesignProvider writes CSS vars on `documentElement`                                                      |
| Drawer focus trap + ESC                                | Browser / Client (HeroUI / React Aria) | —                | No server involvement                                                                                    |
| Auth gate (route `beforeLoad`)                         | API / Backend                          | Browser / Client | Supabase `auth.getSession()` already implemented — Phase 36 does NOT touch auth flow                     |

**Key insight:** Phase 36 is a **zero-backend-change** phase. No API modifications, no migrations, no Edge Functions. All work is frontend shell chrome.

## Standard Stack

### Core

| Library                          | Version               | Purpose                                                     | Why Standard                                                                      |
| -------------------------------- | --------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `@heroui/react`                  | `3.0.3`               | Drawer primitive (mobile overlay sidebar + existing Tweaks) | Installed + proven in Phase 34 [VERIFIED: package.json]                           |
| `@heroui/styles`                 | `3.0.3`               | HeroUI v3 styling runtime                                   | Peer of @heroui/react [VERIFIED: package.json]                                    |
| `lucide-react`                   | already installed     | All topbar + sidebar icons                                  | Project convention — CLAUDE.md mandates no mixing icon libs [VERIFIED: CLAUDE.md] |
| `react-i18next`                  | already installed     | `t()` + `useTranslation()` + `i18n.language`                | Project standard; `shell` namespace added                                         |
| `@tanstack/react-router`         | v5, already installed | Route state for auto-close-drawer-on-navigate               | Existing pattern; `useRouter()` subscription                                      |
| `class-variance-authority` (cva) | already installed     | Variant management for nav-item active states               | shadcn re-export pattern uses cva                                                 |
| `clsx` + `tailwind-merge`        | already installed     | `cn()` helper; conditional classnames                       | Existing `@/lib/utils`                                                            |

### Supporting

| Library                            | Version               | Purpose                                                             | When to Use                              |
| ---------------------------------- | --------------------- | ------------------------------------------------------------------- | ---------------------------------------- |
| `@radix-ui/react-slot`             | already installed     | `asChild` for polymorphic buttons                                   | If nav items need to forward to `<Link>` |
| shadcn `components/ui/sidebar.tsx` | in-repo               | `SidebarProvider`, `SidebarInset`, `useSidebar`, cookie persistence | Wrapper for the new Sidebar composition  |
| HeroUI v3 `Drawer` (compound)      | `@heroui/react@3.0.3` | `Drawer.Root / Content / Header / Body / Footer`                    | Mobile overlay sidebar at ≤1024px        |

### Alternatives Considered

| Instead of                                     | Could Use                 | Tradeoff                                                                                                       |
| ---------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| HeroUI Drawer for sidebar                      | shadcn `Sheet`            | Would introduce a NEW primitive; fails D-06 directive to reuse Phase 34's already-installed pattern. Rejected. |
| SVGR / `vite-plugin-svgr`                      | Hand-rewritten TSX        | D-07 explicitly declines new Vite plugins. Rejected.                                                           |
| `border-inline-start: 2px solid var(--accent)` | `::before` pseudo-element | Would shift content by 2px on activation (layout flicker). UI-SPEC locked `::before` per handoff parity.       |

**Installation:** No new installs. All dependencies already present. [VERIFIED: `package.json` grep — `@heroui/react` v3.0.3, `@heroui/styles` v3.0.3, `lucide-react`, testing libs]

**Version verification:** Skipped (no new installs). Phase 33 installed HeroUI v3 at 3.0.3 — still current.

### ⚠ GASTAT Logo SVG — Special Handling

The handoff SVG (`GASTAT_LOGO.svg`, 6704 bytes) uses **class-based styling** with **an empty `<defs>` block and no `<style>` element**. [VERIFIED: grep shows 38 path elements with 12 distinct `cls-1..cls-12` classes; `<defs>` contains only whitespace; no `<style>` tag exists.]

Consequence: D-07's "swap every `fill`/`stroke` to `currentColor`" has **nothing to swap**. The original color bindings lived in an external stylesheet that is not present in the handoff.

**Recommended conversion approach (for the plan):**

1. **Read the full SVG** to extract the 38 `<path>` / `<polygon>` / `<rect>` elements.
2. **Strip all `class="cls-N"` attributes.**
3. **Add `fill="currentColor"` to every element** (or to the outer `<g>`).
4. **Preserve the `viewBox="0 0 162.98 233.12"` exactly.**
5. Export as `<GastatLogo size={22} className="..." />` — inner `<svg>` uses `width={size} height={size}` + `fill="currentColor"` at the `<svg>` level (inherits to paths).
6. The sidebar wrapper sets `color: var(--accent)` → paths inherit via `currentColor` → mark tints correctly.
7. No `stroke` on any path (verified via grep — stroke-based icons are elsewhere, not in brand mark).

This approach may lose the 12-class visual differentiation (if classes encoded different shades), but the single-color tint per D-07 is explicitly desired. If a multi-color variant is needed later, a separate phase can reintroduce a stylesheet. Flag this in plan task 36-02.

## System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│  bootstrap.js (pre-React, pre-stylesheet)                              │
│  reads localStorage: id.dir, id.theme, id.hue, id.density,             │
│  id.classif, id.locale — writes html.dir, html.lang,                   │
│  data-direction, data-classification, data-density, CSS vars           │
└──────────────────────────┬─────────────────────────────────────────────┘
                           │ FOUC-safe paint
                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│  main.tsx → App.tsx providers (existing order, UNCHANGED):             │
│     DesignProvider (Phase 33)                                          │
│       └ LanguageProvider                                               │
│           └ TweaksDisclosureProvider (Phase 34)                        │
│               └ AuthStore / ChatProvider / TanStack Router             │
│                   └ <Outlet /> (routes)                                │
└──────────────────────────┬─────────────────────────────────────────────┘
                           │ navigate("/any-protected-route")
                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│  routes/_protected.tsx — auth gate + wraps children in AppShell        │
│  (SWAP POINT: import MainLayout → import AppShell)                     │
└──────────────────────────┬─────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│  AppShell.tsx (NEW)                                                    │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  useSidebarOpen(), useDirection(), useMode(), useLocale(),   │     │
│  │  useClassification(), useRouter() — auto-close on navigate   │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                        │
│  ┌─── ≥1025px: GRID ──────────────────────────────────────────┐       │
│  │  col1 (256px)         col2 (1fr)                           │       │
│  │  ┌──────────────┐   ┌─────────────────────────────────┐    │       │
│  │  │              │   │  <Topbar />  (row1, 56px)       │    │       │
│  │  │              │   ├─────────────────────────────────┤    │       │
│  │  │  <Sidebar/>  │   │  <ClassificationBar             │    │       │
│  │  │  (row1+2)    │   │      direction=?> (only         │    │       │
│  │  │              │   │      ribbon gets a row; others  │    │       │
│  │  │              │   │      render inside/outside main) │    │       │
│  │  │              │   ├─────────────────────────────────┤    │       │
│  │  │              │   │  <main> { children (route page) │    │       │
│  │  │              │   │           <Outlet/> }           │    │       │
│  │  └──────────────┘   └─────────────────────────────────┘    │       │
│  └─────────────────────────────────────────────────────────────┘      │
│                                                                        │
│  ┌─── ≤1024px: DRAWER ─────────────────────────────────────────┐      │
│  │  <Topbar/>  (hamburger visible, `lg:hidden`)                │      │
│  │  <HeroUI Drawer placement="start" isOpen={sidebarOpen}>     │      │
│  │    <Drawer.Content>                                         │      │
│  │      <Sidebar/>  (drawer mode: 280px / 100vw phone)         │      │
│  │    </Drawer.Content>                                        │      │
│  │  </Drawer>                                                  │      │
│  │  <ClassificationBar direction=?>                            │      │
│  │  <main>...</main>                                           │      │
│  └─────────────────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component           | Path (proposed)                                        | Owns                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppShell`          | `frontend/src/components/layout/AppShell.tsx`          | Grid/drawer mode switch; mounts Sidebar, Topbar, ClassificationBar, `<main>`; orchestrates `useSidebarOpen` + route-change auto-close                                             |
| `Sidebar`           | `frontend/src/components/layout/Sidebar.tsx`           | Brand (`.sb-brand` + `<GastatLogo>`), user card, 3 nav sections (consumes `createNavigationGroups` from `navigation-config.ts`), footer; 2px `::before` accent bar on active item |
| `Topbar`            | `frontend/src/components/layout/Topbar.tsx`            | 7 items per UI-SPEC §Topbar Anatomy; Tweaks button wired to `useTweaksOpen()`; hamburger wired to `useSidebarOpen`                                                                |
| `ClassificationBar` | `frontend/src/components/layout/ClassificationBar.tsx` | Single switch component with 3 DOM shapes (marginalia / ribbon / chip); reads `useDirection()` + `useClassification()`; `null` when `id.classif === false`                        |
| `GastatLogo`        | `frontend/src/components/brand/GastatLogo.tsx`         | Inline SVG; props `{ className?: string; size?: number }`; size default 22                                                                                                        |
| `useSidebarOpen`    | `frontend/src/components/layout/useSidebarOpen.ts`     | React state hook; exposed to hamburger + nav-item-onClick + router subscription                                                                                                   |

## Architecture Patterns

### Recommended Project Structure

```
frontend/src/
├── components/
│   ├── brand/
│   │   └── GastatLogo.tsx                ← NEW (SHELL-05)
│   ├── layout/
│   │   ├── AppShell.tsx                  ← NEW (replaces MainLayout.tsx)
│   │   ├── Sidebar.tsx                   ← NEW (composes ui/sidebar primitive)
│   │   ├── Topbar.tsx                    ← NEW (replaces SiteHeader.tsx)
│   │   ├── ClassificationBar.tsx         ← NEW (SHELL-03)
│   │   ├── useSidebarOpen.ts             ← NEW (drawer state + route-change close)
│   │   ├── navigation-config.ts          ← PRESERVE (already has `id: 'operations'|'dossiers'|'administration'`)
│   │   ├── MainLayout.tsx                ← DELETE
│   │   ├── AppSidebar.tsx                ← DELETE
│   │   ├── SiteHeader.tsx                ← DELETE
│   │   └── MobileBottomTabBar.tsx        ← DELETE
│   ├── ui/
│   │   └── sidebar.tsx                    ← PRESERVE (D-02; shadcn primitive)
│   └── tweaks/ …                          ← PRESERVE (Phase 34)
├── routes/
│   └── _protected.tsx                     ← SWAP (`MainLayout` → `AppShell`)
├── i18n/locales/
│   ├── en.json                            ← ADD `shell.*` namespace (see UI-SPEC copy table)
│   └── ar.json                            ← ADD `shell.*` namespace
└── public/
    └── bootstrap.js                       ← PRESERVE (AppShell must render consistent with pre-paint)

scripts/
└── check-deleted-components.sh            ← EXTEND (add 4 deleted filenames)
```

### Pattern 1: HeroUI Drawer (reuse Phase 34 shape)

```tsx
// Source: Phase 34 34-CONTEXT.md D-01/02 + HeroUI v3 compound docs
import { Drawer, DrawerContent, DrawerHeader, DrawerBody } from '@heroui/react'
import { useSidebarOpen } from './useSidebarOpen'

// Inside AppShell:
;<Drawer
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  placement="start" // auto-flips to "end" in RTL via dir="rtl" on <html>
  size="xs" // 280px @ md; full-screen @ sm via custom classes
  hideCloseButton // custom close via nav-click / ESC / backdrop
  backdrop="opaque"
  className="lg:hidden" // only present in drawer mode
>
  <DrawerContent>
    <Sidebar mode="drawer" onNavigate={() => setIsOpen(false)} />
  </DrawerContent>
</Drawer>
```

### Pattern 2: `::before` active-nav bar with logical properties

```tsx
// Source: UI-SPEC §Sidebar Anatomy LOCKED implementation
import { cn } from '@/lib/utils'
;<Link
  to={item.path}
  className={cn(
    'relative flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)]',
    'text-[13px] font-[var(--font-body)] opacity-[0.78] hover:bg-[color-mix(in_oklab,var(--sidebar-ink)_8%,transparent)]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
    isActive && [
      'opacity-100 font-medium bg-[color-mix(in_oklab,var(--sidebar-ink)_10%,transparent)]',
      'before:absolute before:content-[""] before:start-0 before:top-1.5 before:bottom-1.5',
      'before:w-0.5 before:rounded-[2px] before:bg-[var(--accent)]',
    ],
  )}
>
  <Icon size={16} aria-hidden="true" />
  <span>{t(item.label)}</span>
</Link>
```

### Pattern 3: Atomic direction change (inherited from Phase 33 D-09)

```tsx
// applyTokens() in DesignProvider already writes every CSS var via one
// setProperty loop. Phase 36 relies on this — zero intermediate frames
// when user clicks direction-switcher.
// → AppShell code writes NO tokens itself. It READS from CSS vars.
```

### Pattern 4: Classification chrome internal switch

```tsx
// Source: UI-SPEC §Classification LOCKED
function ClassificationBar() {
  const direction = useDirection()
  const isVisible = useClassification() // from TweaksDisclosureProvider
  const { t, i18n } = useTranslation()
  if (!isVisible) return null

  const body = (
    <>
      {t('shell.classification.workspace')} · {t(`shell.classification.level.${level}`)} ·{' '}
      {t('shell.classification.handleSecurely')} · {t('shell.classification.session')} {dateLocale}{' '}
      · {initials}
    </>
  )

  if (direction === 'chancery')
    return <div className="cls-marginalia text-center italic pt-1.5 px-5">— {body} —</div>
  if (direction === 'situation')
    return (
      <div className="cls-ribbon w-full py-1 px-5 bg-[var(--accent)] text-[var(--accent-fg)] font-mono uppercase tracking-[0.15em] text-[10.5px]">
        {body}
      </div>
    )
  // ministerial + bureau → chip (inline, rendered BEFORE page title)
  return (
    <div className="cls-chip inline-flex items-center ms-5 mt-2 py-1 px-2.5 rounded-full bg-[color-mix(in_oklab,var(--ink)_6%,transparent)] font-mono text-[10.5px]">
      ● {body}
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Do not `.reverse()` any nav-item array** in RTL (CLAUDE.md Rule 4). `forceRTL(true)` + `dir="rtl"` + `flexDirection:row` auto-flips.
- **Do not use `textAlign: "right"`** inside shell. Use `text-start`/`text-end` Tailwind logical utilities.
- **Do not add `ml-*/mr-*/pl-*/pr-*/left-*/right-*` classes.** Use `ms-*/me-*/ps-*/pe-*/start-*/end-*`.
- **Do not mount AppShell INSIDE `LanguageProvider`'s return.** AppShell is a downstream consumer of provider contexts — provider order is fixed in `App.tsx`.
- **Do not introduce a new Vite plugin** for SVG conversion. D-07 forbids `vite-plugin-svgr`.
- **Do not preserve `MobileBottomTabBar.tsx` as a fallback.** D-05 requires full deletion.

## Don't Hand-Roll

| Problem                                        | Don't Build                                     | Use Instead                                                                                          | Why                                                                                  |
| ---------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Focus trap in mobile drawer                    | Custom `useEffect` keyboard listener            | HeroUI `Drawer` (React Aria internals)                                                               | WCAG focus-trap + ESC + scroll-lock solved; inline rolling fails on Safari/VoiceOver |
| RTL flip of drawer slide direction             | `isRTL ? translateX(100%) : translateX(-100%)`  | `placement="start"` + `html[dir="rtl"]` CSS cascade (already in `app.css:707`)                       | HeroUI auto-flips; CSS cascade is the single source of truth                         |
| Auto-close drawer on navigation                | Custom route-change listener                    | `useRouter().subscribe('onBeforeNavigate', ...)` from TanStack Router                                | Existing API; avoids race condition with React-render double-fire                    |
| Active-route detection                         | Manual `location.pathname` compare              | `useRouterState({ select: s => s.location.pathname })`                                               | Existing; TanStack Router's own selector avoids re-render storms                     |
| Cookie persistence for sidebar collapsed state | Custom `document.cookie` write                  | shadcn `SidebarProvider` built-in `sidebar_state`                                                    | Already tested in Phases 1-32; reuse proven path                                     |
| Locale-formatted date in classification        | `Intl.DateTimeFormat` rolled in-line            | Existing project date formatter if present; else `Intl.DateTimeFormat(i18n.language, opts)` directly | `Intl` is in-browser; no hand-roll needed — just call with `i18n.language`           |
| 44×44 touch target wrapping                    | Manual `position: relative; padding: 10px` hack | Tailwind `min-h-11 min-w-11` on the interactive element                                              | Utility-class-driven; verified in CLAUDE.md                                          |

**Key insight:** Shell chrome is a **composition-first, not logic-first** phase. Every logical primitive (focus trap, route sync, cookie persistence, direction flip, CSS tokens) already lives in the stack; Phase 36's job is to WIRE them, not WRITE them.

## Runtime State Inventory

| Category            | Items Found                                                                                                                                                                                                                                                                                                                                                  | Action Required                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Stored data         | **None** — shell chrome has no DB writes, no user-generated content, no server state. Nav item counts (`tasks`, `approvals`, `engagements`) come from existing TanStack Query hooks — Phase 36 consumes, does not mutate.                                                                                                                                    | None                                                         |
| Live service config | **None** — no Edge Functions, no webhooks, no external services touched. Supabase auth session already in place.                                                                                                                                                                                                                                             | None                                                         |
| OS-registered state | **None** — frontend-only, no systemd/launchd/pm2/Task Scheduler involvement.                                                                                                                                                                                                                                                                                 | None                                                         |
| Secrets/env vars    | **None** — no new env vars. i18n bundles loaded at build; no new secrets.                                                                                                                                                                                                                                                                                    | None                                                         |
| Build artifacts     | `frontend/dist/` will rebuild cleanly on `pnpm build`; no stale `.d.ts` or package-generated folders. **However:** the 4 deleted files (`MainLayout.tsx`, `AppSidebar.tsx`, `SiteHeader.tsx`, `MobileBottomTabBar.tsx`) may leave dangling `*.test.tsx` or `*.stories.tsx` siblings. Plan must grep for test/story files referencing the deleted components. | Grep & delete orphaned test files alongside source deletions |

**Canonical question:** After the 4 layout files are deleted, what runtime still references them? Answer: the test files (if any) — see final grep audit in plan Wave 0.

## Common Pitfalls

### Pitfall 1: SVG class-based styling with no stylesheet

**What goes wrong:** Placing the raw GASTAT_LOGO.svg contents (with `class="cls-1"` etc.) into a React component yields **invisible paths** because CSS classes have no bindings.

**Why it happens:** SVG exporters (Adobe Illustrator's "SVG Code" option) embed paths with class references expecting an external `<style>` block that was stripped before the file landed in the handoff.

**How to avoid:** During SVG → TSX conversion, (a) strip all `class="cls-N"` attributes, (b) add `fill="currentColor"` to every path (or once on the outer `<svg>`), (c) verify visually at 22×22 before committing.

**Warning signs:** The logo renders as a 22×22 empty box in early dev. If seen, inspect DOM — paths will be there but invisible.

### Pitfall 2: FOUC/flash on direction switch

**What goes wrong:** Component remounts or re-layouts during direction change, causing visible 100ms+ flash.

**Why it happens:** Some app-shells re-mount children when direction attr changes. Phase 33 D-09 + bootstrap.js prevent this **only if** AppShell stays mounted across direction changes.

**How to avoid:** Never conditionally mount AppShell based on direction. The `<html>` direction attribute + CSS var cascade repaints WITHOUT React re-renders. All direction-specific class swaps happen via `data-direction` attribute selectors, not JSX conditionals.

**Warning signs:** Direction-switcher click causes visible flicker; Chrome DevTools Performance tab shows React commit on direction change.

### Pitfall 3: Double-mounted HeroUI Drawer instances

**What goes wrong:** When Tweaks drawer + Sidebar drawer both mount, focus-trap scopes conflict — Tab leaks out of the nested drawer.

**Why it happens:** React Aria's focus scope is global-by-default; nested `FocusScope` must be `contain`-mode with explicit restoration.

**How to avoid:** Verify that HeroUI v3 Drawer uses React Aria's `FocusScope contain` at the top of each Drawer instance (they should — it's the React Aria default). Vitest component test: mount both, Tab-cycle through one, confirm focus stays inside.

**Warning signs:** Pressing Tab inside the mobile sidebar jumps focus to the Tweaks drawer's first input.

### Pitfall 4: `lg:hidden` vs `md:hidden` confusion

**What goes wrong:** Hamburger button visible on 1025-1280px range (desktop) because `md:hidden` hides at ≥768px while the requirement is "hide at ≥1024px".

**Why it happens:** Tailwind `md` = 768px, `lg` = 1024px. UI-SPEC correctly locked `lg:hidden`; but handoff JSX may use `@media (min-width: 1024px)` raw, which maps to `lg`, not `md`.

**How to avoid:** Use `lg:hidden` on hamburger; `hidden lg:flex` on sidebar grid column; verify at 1024px breakpoint.

### Pitfall 5: Classification chip rendering outside `<main>`

**What goes wrong:** For ministerial/bureau directions, chip appears BEFORE the topbar instead of at the page-head start.

**Why it happens:** The chip's DOM position is "inline at `<main>`'s page-head start" — not a shell-level sibling. If ClassificationBar is rendered at AppShell level like the ribbon, the chip will land in the wrong place.

**How to avoid:** ClassificationBar has TWO render modes:

- For `chancery` (marginalia) + `situation` (ribbon) → render at AppShell level, between topbar and `<main>`.
- For `ministerial` + `bureau` (chip) → render inside `<main>` via a **slot** or a `<Portal>` target, OR let the page-level `<Outlet>` render its own chip via a `usePageHead()` hook.

Recommendation for the plan: **ClassificationBar renders ALL variants at AppShell level, but uses absolute/fixed positioning for the chip** to simulate the "inline at page-head" visual. Concretely: chip positioned `absolute; top:56px + (ribbon_height or 0); inset-inline-start: 20px`. This keeps SHELL-03's "single component" promise.

### Pitfall 6: Arabic Direction-switcher labels

**What goes wrong:** Direction switcher buttons show Arabic labels in LTR English mode, or vice versa.

**Why it happens:** Direction ≠ Locale. `direction` is one of 4 design-system modes (chancery/situation/ministerial/bureau); `locale` is en/ar. Both can vary independently.

**How to avoid:** Labels come from i18n (`t('shell.direction.chancery')`) — i18n keys resolve based on current `i18n.language`, not direction.

## Code Examples

### AppShell skeleton (wire only, no markup)

```tsx
// frontend/src/components/layout/AppShell.tsx
// Source: Composition derived from CONTEXT.md D-01 + UI-SPEC §Layout Tokens
import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Drawer, DrawerContent } from '@heroui/react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ClassificationBar } from './ClassificationBar'

export function AppShell({ children }: { children: ReactNode }): React.ReactElement {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  // Auto-close drawer on route change (UI-SPEC §Drawer states)
  useEffect(() => {
    return router.subscribe('onBeforeNavigate', () => setSidebarOpen(false))
  }, [router])

  return (
    <SidebarProvider>
      <div
        className="grid min-h-screen"
        style={{
          gridTemplateColumns: '256px 1fr',
          gridTemplateRows: 'auto auto 1fr',
        }}
      >
        {/* Desktop sidebar — hidden on ≤1024 */}
        <aside className="hidden lg:block row-span-3 col-start-1 bg-[var(--sidebar-bg)] border-e border-[var(--line)]">
          <Sidebar mode="desktop" />
        </aside>

        {/* Topbar */}
        <header className="col-start-2 lg:col-start-2 col-span-full lg:col-span-1 row-start-1 h-14 border-b border-[var(--line)] bg-[var(--surface)]">
          <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        </header>

        {/* Classification (ribbon / marginalia / chip via single component) */}
        <ClassificationBar className="col-start-2 row-start-2" />

        {/* Main */}
        <main className="col-start-2 row-start-3 overflow-y-auto">{children}</main>

        {/* Mobile drawer sidebar */}
        <Drawer
          isOpen={sidebarOpen}
          onOpenChange={setSidebarOpen}
          placement="start"
          size="xs"
          className="lg:hidden"
          hideCloseButton
        >
          <DrawerContent>
            <Sidebar mode="drawer" onNavigate={() => setSidebarOpen(false)} />
          </DrawerContent>
        </Drawer>
      </div>
    </SidebarProvider>
  )
}
```

### GastatLogo TSX (class-stripped, currentColor)

```tsx
// frontend/src/components/brand/GastatLogo.tsx
// Source: D-07 + research finding (SVG has empty <defs>, no <style>, class-driven paths)
// Strategy: <svg fill="currentColor"> inherits to all child paths.
import type { SVGProps } from 'react'

interface GastatLogoProps extends Omit<SVGProps<SVGSVGElement>, 'fill'> {
  size?: number
  className?: string
}

export function GastatLogo({ size = 22, className, ...rest }: GastatLogoProps): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 162.98 233.12"
      width={size}
      height={size}
      fill="currentColor"
      role="img"
      aria-label="GASTAT"
      className={className}
      {...rest}
    >
      {/* 38 <path> elements from handoff — class attrs stripped */}
      {/* cls-1 through cls-12 groupings merged; all inherit currentColor from <svg fill> */}
      <path d="M52.23,203.44c-1.87,0-3.37,1.5-3.37,3.37v16.72c0,1.84,1.5,3.37,3.37,3.37s3.37-1.5,3.37-3.37v-16.72c0-1.84-1.5-3.37-3.37-3.37Z" />
      {/* …37 more paths, all from handoff SVG, class attribute stripped… */}
    </svg>
  )
}
```

**Note on innerHTML:** GastatLogo uses JSX `<path>` children — React renders the 38 paths natively, no unsafe inner-HTML injection path.

## State of the Art

| Old Approach                                 | Current Approach                                                        | When Changed      | Impact                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------ |
| Dual mobile nav (drawer + bottom-tab-bar)    | Single drawer triggered by hamburger                                    | Phase 36 D-05     | Removes tab-bar maintenance + duplicated nav data source                 |
| `MainLayout.tsx` composite (1 file)          | 4 specialized components (AppShell, Sidebar, Topbar, ClassificationBar) | Phase 36 D-01     | Each responsibility isolated; easier RTL verification + per-tier mocking |
| `SiteHeader.tsx` Tweaks gear (Phase 34 D-05) | `Topbar.tsx` Tweaks button (Phase 36)                                   | Phase 36          | Same hook (`useTweaksOpen`); only the JSX container changes              |
| physical-property margins (`ml-*`/`mr-*`)    | logical-property margins (`ms-*`/`me-*`)                                | CLAUDE.md ongoing | RTL auto-handled; no JS-level flip logic                                 |
| shadcn `Sheet` for overlays                  | HeroUI v3 `Drawer`                                                      | Phase 34 D-01     | React Aria accessibility superior; compound pattern consistent           |

**Deprecated/outdated:**

- `MobileBottomTabBar.tsx`: obsolete pattern — full-screen drawer covers the same affordance more accessibly.
- Inline `style={{fontFamily}}` (any): Phase 35 D-01 replaced with `font-display`/`font-body`/`font-mono` Tailwind utilities.
- `textAlign: "right"` in RTL: forceRTL flips it — use `writingDirection: "rtl"` or `text-start`/`text-end`.

## Assumptions Log

| #   | Claim                                                                                                                                                        | Section                           | Risk if Wrong                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | [ASSUMED] HeroUI v3 supports TWO concurrently-mounted `Drawer` instances without focus-trap conflict                                                         | Pitfall 3 + Pattern 1             | Medium — if wrong, sidebar drawer needs custom portal + manual focus trap. Mitigation: Wave 0 component test validates both open simultaneously.                                                                                                               |
| A2  | [ASSUMED] Handoff SVG class-based styling (no `<style>`/`<defs>`) indicates single-color intent                                                              | Standard Stack ⚠ Special Handling | Low — user's D-07 explicitly wants currentColor tint, so single-color intent matches. If the original had multi-color shades, user can request follow-up phase.                                                                                                |
| A3  | [ASSUMED] `_protected.tsx` is the ONLY file importing `MainLayout` from outside `MainLayout.tsx` itself                                                      | D-04 impact scope                 | Low — grep confirmed only 2 files (the component file + `_protected.tsx`). [VERIFIED via grep]                                                                                                                                                                 |
| A4  | [ASSUMED] `scripts/check-deleted-components.sh` uses a filename list and can be extended by adding 4 new entries                                             | CI-gate pattern                   | Low — script exists [VERIFIED]; exact extension syntax verified by plan at implementation time.                                                                                                                                                                |
| A5  | [ASSUMED] Phase 36 ClassificationBar for ministerial/bureau chip mode can use absolute positioning inside AppShell rather than rendering inside page content | Pitfall 5 + Pattern 4             | Medium — if handoff visual parity requires chip to scroll with page content, chip must render inside page-level `<Outlet>`. Mitigation: prototype in plan task 36-03 and visually compare against handoff screenshots (`/tmp/…/reference/dashboard.png` etc.). |
| A6  | [ASSUMED] TanStack Router v5's `router.subscribe('onBeforeNavigate', …)` is the correct API for drawer-close-on-navigate                                     | AppShell skeleton code example    | Low — standard pattern; if API differs, fallback is `useRouterState` + `useEffect` on pathname change.                                                                                                                                                         |

**If this table is empty:** (Not empty — 6 assumptions flagged. None are blockers; all have low-effort mitigations.)

## Open Questions

1. **Classification chip DOM position — inside or outside `<main>`?**
   - What we know: UI-SPEC locks "single `<ClassificationBar>` component." Handoff `shell.jsx:193-208` renders all three variants from one component, but the chip's styling (`.cls-chip`) uses `margin: 8px 0 0 20px` which suggests it sits inside a page's flex/grid context.
   - What's unclear: Whether chip should scroll with page content (implying it's inside `<main>`) or stay pinned to the topbar edge (implying AppShell-level absolute positioning).
   - Recommendation: Plan task 36-03 prototypes BOTH; implementer picks by visual fidelity to handoff PNG references.

2. **Nav item count badges — where do they come from for drawer mode?**
   - What we know: `createNavigationGroups(counts: { tasks, approvals, engagements })` is the existing factory signature.
   - What's unclear: Whether Phase 36 keeps plumbing counts (from existing TanStack Query hooks) into the sidebar, or skips badges for now.
   - Recommendation: Plan task 36-03 keeps the plumbing (one-line forward); it's pre-existing.

3. **Does the desktop-sidebar `.sb-foot` "v2.0 · Synced" sync dot need a realtime connection indicator, or is it static for Phase 36?**
   - What we know: UI-SPEC calls it out as `font-mono 10.5px opacity 0.6` — visual only.
   - What's unclear: Whether the green dot (`var(--ok)`) indicates live Supabase connection or just a static "we shipped OK" marker.
   - Recommendation: Static for Phase 36. Realtime-indicator = future phase.

4. **Notification bell badge count source.**
   - What we know: UI-SPEC defers dropdown behavior to Phase 42 but says "badge count from `useNotifications` hook (if mounted) OR hardcoded 0."
   - What's unclear: Whether `useNotifications` hook exists in current codebase.
   - Recommendation: Plan task 36-03 checks; if absent, hardcode to `0` with a `TODO(Phase-42)` comment.

## Environment Availability

| Dependency                            | Required By            | Available | Version                     | Fallback |
| ------------------------------------- | ---------------------- | --------- | --------------------------- | -------- |
| Node.js 20.19+                        | Build + dev            | ✓         | project-standard            | —        |
| pnpm 10.29.1+                         | Workspace mgmt         | ✓         | project-standard            | —        |
| `@heroui/react`                       | Drawer primitive       | ✓         | 3.0.3 [VERIFIED]            | —        |
| `@heroui/styles`                      | HeroUI runtime         | ✓         | 3.0.3 [VERIFIED]            | —        |
| `lucide-react`                        | Icons                  | ✓         | project-standard            | —        |
| `react-i18next`                       | i18n                   | ✓         | project-standard            | —        |
| `@tanstack/react-router`              | Route state            | ✓         | v5                          | —        |
| `vitest`                              | Unit + component tests | ✓         | 4.1.2 [VERIFIED]            | —        |
| `@testing-library/react`              | Component tests        | ✓         | 16.3.2 [VERIFIED]           | —        |
| `@playwright/test`                    | E2E smoke              | ✓         | 1.58.2 [VERIFIED]           | —        |
| `@axe-core/playwright`                | Accessibility check    | ✓         | 4.11.1 [VERIFIED]           | —        |
| Handoff SVG file                      | SHELL-05               | ✓         | 6704 bytes [VERIFIED]       | —        |
| Handoff JSX source `shell.jsx`        | All shell composition  | ✓         | 8930 bytes [VERIFIED]       | —        |
| `scripts/check-deleted-components.sh` | CI gate extension      | ✓         | Phase 34 pattern [VERIFIED] | —        |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.
**Phase 36 is fully green on environment readiness.**

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Framework          | Vitest 4.1.2 (unit + component) + Playwright 1.58.2 (E2E) + axe-core 4.11.1 (a11y)                                                   |
| Config files       | `frontend/vitest.config.ts`, `frontend/playwright.config.ts`, `frontend/vitest.a11y.config.ts` (verified via `package.json` scripts) |
| Quick run command  | `pnpm -C frontend test -- src/components/layout/AppShell.test.tsx` (<10s single-file)                                                |
| Full suite command | `pnpm -C frontend test` + `pnpm -C frontend test:a11y` + `pnpm -C frontend test:e2e -- --grep "Phase 36"`                            |

### Phase Requirements → Test Map

| Req ID   | Behavior                                                                                                                                                                   | Test Type                          | Automated Command                                                                                    | File Exists?         |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------- |
| SHELL-01 | Sidebar renders 3 nav sections (Operations / Dossiers / Administration) + footer with `v2.0 · ● Synced` line                                                               | component (Vitest + RTL)           | `pnpm -C frontend test -- src/components/layout/Sidebar.test.tsx`                                    | ❌ Wave 0            |
| SHELL-01 | Active nav item gets a 2px `::before` bar anchored to `inset-inline-start:0` with `var(--accent)` background                                                               | component (getComputedStyle)       | `pnpm -C frontend test -- src/components/layout/Sidebar.test.tsx -t "active accent bar"`             | ❌ Wave 0            |
| SHELL-01 | Administration section hidden when `isAdmin === false`                                                                                                                     | component                          | `pnpm -C frontend test -- src/components/layout/Sidebar.test.tsx -t "admin gate"`                    | ❌ Wave 0            |
| SHELL-02 | Topbar renders 7 items in LTR JSX order: hamburger, search, direction switcher, bell, theme, locale, Tweaks                                                                | component                          | `pnpm -C frontend test -- src/components/layout/Topbar.test.tsx -t "item order"`                     | ❌ Wave 0            |
| SHELL-02 | ⌘K kbd hint hidden at ≤1024px via `lg:inline hidden`                                                                                                                       | component (viewport-mock)          | `pnpm -C frontend test -- src/components/layout/Topbar.test.tsx -t "kbd hint responsive"`            | ❌ Wave 0            |
| SHELL-02 | Tweaks button calls `useTweaksOpen()` when clicked                                                                                                                         | component (mock hook)              | `pnpm -C frontend test -- src/components/layout/Topbar.test.tsx -t "tweaks trigger"`                 | ❌ Wave 0            |
| SHELL-03 | ClassificationBar returns `null` when `useClassification()` → `false`                                                                                                      | component                          | `pnpm -C frontend test -- src/components/layout/ClassificationBar.test.tsx -t "visibility gate"`     | ❌ Wave 0            |
| SHELL-03 | `direction="chancery"` renders `.cls-marginalia` (italic, em-dash wrap)                                                                                                    | component (assert by class + text) | `pnpm -C frontend test -- src/components/layout/ClassificationBar.test.tsx -t "chancery marginalia"` | ❌ Wave 0            |
| SHELL-03 | `direction="situation"` renders `.cls-ribbon` (full-width bar, mono uppercase)                                                                                             | component                          | `pnpm -C frontend test -- src/components/layout/ClassificationBar.test.tsx -t "situation ribbon"`    | ❌ Wave 0            |
| SHELL-03 | `direction="ministerial"` and `direction="bureau"` both render `.cls-chip`                                                                                                 | component (parameterized)          | `pnpm -C frontend test -- src/components/layout/ClassificationBar.test.tsx -t "chip variants"`       | ❌ Wave 0            |
| SHELL-04 | At ≤1024px viewport, hamburger is visible; sidebar is NOT in DOM grid                                                                                                      | component (viewport-mock)          | `pnpm -C frontend test -- src/components/layout/AppShell.test.tsx -t "responsive drawer mode"`       | ❌ Wave 0            |
| SHELL-04 | Hamburger click opens HeroUI Drawer with focus trap; ESC closes                                                                                                            | component + a11y                   | `pnpm -C frontend test -- src/components/layout/AppShell.test.tsx -t "drawer open close"`            | ❌ Wave 0            |
| SHELL-04 | In RTL (`dir="rtl"`), drawer slide direction flips (test via snapshot of `transform` style)                                                                                | component (jsdom-rtl)              | `pnpm -C frontend test -- src/components/layout/AppShell.test.tsx -t "drawer rtl flip"`              | ❌ Wave 0            |
| SHELL-04 | At ≤640px, drawer width = 100vw; topbar wraps with `flex-wrap`                                                                                                             | component                          | `pnpm -C frontend test -- src/components/layout/AppShell.test.tsx -t "phone layout"`                 | ❌ Wave 0            |
| SHELL-05 | `GastatLogo` renders an `<svg>` with `viewBox="0 0 162.98 233.12"` and `fill="currentColor"`                                                                               | component                          | `pnpm -C frontend test -- src/components/brand/GastatLogo.test.tsx`                                  | ❌ Wave 0            |
| SHELL-05 | Logo's parent wrapper `.sb-mark` with `color: var(--accent)` tints the logo (integration test verifies `getComputedStyle`)                                                 | component                          | `pnpm -C frontend test -- src/components/brand/GastatLogo.test.tsx -t "accent tint"`                 | ❌ Wave 0            |
| a11y     | AppShell passes axe-core with no serious/critical issues in 4 directions × 2 locales                                                                                       | a11y                               | `pnpm -C frontend test:a11y -- src/components/layout/AppShell.a11y.test.tsx`                         | ❌ Wave 0            |
| a11y     | Tab order: Sidebar → Topbar → Main (no traps outside drawer mode)                                                                                                          | E2E (Playwright)                   | `pnpm -C frontend test:e2e -- --grep "shell tab order"`                                              | ❌ Wave 0            |
| visual   | 4 directions × 2 locales × 3 breakpoints (320/768/1280) = 24 screenshots; at minimum spot-check classification chrome in all 4 directions for both LTR/RTL (8 screenshots) | visual-smoke (Playwright)          | `pnpm -C frontend test:e2e -- --grep "shell chrome smoke"`                                           | ❌ Wave 0            |
| E2E      | Route change preserves shell chrome — no remount, no flicker (Playwright perf trace)                                                                                       | E2E                                | `pnpm -C frontend test:e2e -- --grep "shell no remount"`                                             | ❌ Wave 0            |
| E2E      | Direction switch re-paints entire shell atomically (no intermediate frames via Chrome Performance mark)                                                                    | E2E                                | `pnpm -C frontend test:e2e -- --grep "direction atomic"`                                             | ❌ Wave 0            |
| CI       | `MainLayout.tsx`/`AppSidebar.tsx`/`SiteHeader.tsx`/`MobileBottomTabBar.tsx` absent from repo at end of phase                                                               | shell script                       | `bash scripts/check-deleted-components.sh`                                                           | ✅ (extend existing) |

### Sampling Rate

- **Per task commit:** `pnpm -C frontend test -- src/components/layout` (runs all shell component tests; ~20 seconds)
- **Per wave merge:** Full Vitest + a11y suites + Phase 36 E2E grep
- **Phase gate (before `/gsd-verify-work`):** Full Vitest (`pnpm -C frontend test`) green + a11y green + 8-screenshot visual smoke green + CI gate script returns exit 0

### Wave 0 Gaps

- [ ] `frontend/src/components/layout/AppShell.test.tsx` — SHELL-04 + integration
- [ ] `frontend/src/components/layout/Sidebar.test.tsx` — SHELL-01
- [ ] `frontend/src/components/layout/Topbar.test.tsx` — SHELL-02
- [ ] `frontend/src/components/layout/ClassificationBar.test.tsx` — SHELL-03
- [ ] `frontend/src/components/brand/GastatLogo.test.tsx` — SHELL-05
- [ ] `frontend/src/components/layout/AppShell.a11y.test.tsx` — axe-core for AppShell in 8 direction×locale combos
- [ ] `frontend/tests/e2e/phase-36-shell.spec.ts` — route-change stability + direction-atomic + drawer open-close
- [ ] `frontend/tests/e2e/phase-36-shell-smoke.spec.ts` — 8-screenshot visual smoke (4 directions × 2 locales, classification chrome spot-check, mobile 320px width)
- [ ] `scripts/check-deleted-components.sh` — extend filename list with 4 new entries (MainLayout, AppSidebar, SiteHeader, MobileBottomTabBar)
- [ ] `frontend/src/i18n/locales/en.json` — add `shell.*` namespace (all keys from UI-SPEC §Copywriting Contract)
- [ ] `frontend/src/i18n/locales/ar.json` — add `shell.*` Arabic translations (Tajawal compatible)

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                                                                                                 |
| --------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no      | Auth gate is in `_protected.tsx` `beforeLoad` — UNCHANGED by Phase 36. AppShell sees only authenticated users.                                                   |
| V3 Session Management | no      | Supabase handles session; AppShell consumes `useAuthStore.user` only.                                                                                            |
| V4 Access Control     | partial | `isAdmin` check gates Administration sidebar section (UI-level only; backend RLS policies remain the source of truth)                                            |
| V5 Input Validation   | partial | Search input is visual-only in Phase 36 (palette behavior deferred). Still must HTML-escape any user-typed content that is echoed — not in scope for the chrome. |
| V6 Cryptography       | no      | No secrets, no tokens, no crypto in shell.                                                                                                                       |
| V14 Config            | no      | No new env vars; bootstrap.js already reads localStorage safely with try/catch.                                                                                  |

### Known Threat Patterns for React 19 + HeroUI + TanStack Router

| Pattern                                | STRIDE                       | Standard Mitigation                                                                                                                                                                                  |
| -------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| XSS via i18n translation injection     | Tampering                    | i18next default escapes values; do NOT use `Trans` with `<span>` without escapes for user-generated content. Phase 36 uses only static key → text pairs — SAFE.                                      |
| Focus trap bypass in nested overlay    | Denial (a11y)                | HeroUI Drawer uses React Aria `FocusScope contain` — tested via Playwright Tab cycle in E2E suite                                                                                                    |
| Unsafe HTML injection into logo markup | XSS (if dynamic)             | GastatLogo renders JSX `<path>` children only — no innerHTML-style injection path. SAFE.                                                                                                             |
| Clickjacking on mobile drawer backdrop | Spoofing                     | Backdrop has `pointer-events: auto`; drawer below has `z-60`. Standard HeroUI behavior.                                                                                                              |
| Information disclosure via aria-label  | Info Disclosure              | Classification level (`restricted`) is echoed in visible DOM — acceptable per spec (it's the feature). Verify no PII leaks in badge counts (the counts are already displayed to authenticated user). |
| Admin-link visibility on non-admin     | Elevation of Priv (UI-layer) | Sidebar Administration section renders only when `isAdmin === true` — but the real gate is backend RLS + route `beforeLoad`. UI hide is defense-in-depth, not the control.                           |

**Phase 36 is LOW security risk** — pure chrome, no new data flow, no new endpoints, no new auth surfaces.

## Sources

### Primary (HIGH confidence)

- `.planning/phases/36-shell-chrome/36-CONTEXT.md` — user-locked decisions D-01..D-08 and discretion areas (authoritative scope)
- `.planning/phases/36-shell-chrome/36-UI-SPEC.md` — checker-approved 6/6 visual contract (locks classification component shape, topbar item order, drawer trigger icon, active-bar implementation, user card anatomy)
- `.planning/phases/33-token-engine/33-CONTEXT.md` — `DesignProvider`/`applyTokens()` pattern (referenced in CONTEXT §Carry-forward)
- `.planning/phases/34-tweaks-drawer/34-CONTEXT.md` — HeroUI Drawer compound pattern, `useTweaksOpen()` hook, `id.classif` / `id.locale` localStorage keys
- `.planning/phases/35-typography-stack/35-CONTEXT.md` — `font-display`/`font-body`/`font-mono` Tailwind utilities via `@theme` self-reference
- `/tmp/inteldossier-handoff/inteldossier/project/src/shell.jsx` — handoff JSX source (8930 bytes, 11 files total in `/src/`, verified)
- `/tmp/inteldossier-handoff/inteldossier/project/reference/GASTAT_LOGO.svg` — authoritative brand mark (6704 bytes, 38 path elements, class-driven with empty `<defs>`, no `<style>`)
- `frontend/src/components/layout/navigation-config.ts` — already has `id: 'operations' | 'dossiers' | 'administration'` — CONTEXT D-03 already satisfied
- `frontend/public/bootstrap.js` — FOUC pre-paint script reading 6 localStorage keys, writing `html.dir`/`html.lang`/`data-*`/CSS vars
- `frontend/routes/_protected.tsx` — confirmed sole external consumer of `MainLayout` import
- `frontend/package.json` — HeroUI v3.0.3, Vitest 4.1.2, Playwright 1.58.2, axe-core 4.11.1 all verified present
- `scripts/check-deleted-components.sh` — Phase 34 CI gate, exists and extensible
- `CLAUDE.md` §Web/Tailwind RTL Requirements — logical-property mandate, mobile-first breakpoints, 44×44 touch targets

### Secondary (MEDIUM confidence)

- HeroUI v3 compound-component pattern inferred from `@heroui/react@3.0.3` + Phase 34 precedent (no Context7 hit for v3 beta; relying on installed package + in-repo usage)

### Tertiary (LOW confidence — flag for validation at implementation time)

- A1: HeroUI v3 Drawer two-concurrent-instance focus-trap isolation — Wave 0 Vitest component test required
- A5: Classification chip DOM position (AppShell-absolute vs page-inline) — visual prototype against handoff PNG required

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all packages already installed and version-verified in `package.json`
- Architecture: HIGH — UI-SPEC locked every major shape; research confirmed upstream `navigation-config.ts` already matches the 3-section model
- Classification chrome shape: HIGH — UI-SPEC locked single-component approach
- GASTAT SVG conversion path: MEDIUM — research surfaced unexpected class-based structure; provided adaptation path
- HeroUI Drawer concurrency: MEDIUM — not documented explicitly; proven by Phase 34 pattern + React Aria defaults; Wave 0 test will harden
- Pitfalls: HIGH — 6 concrete pitfalls with root-cause + prevention + warning signs
- Environment readiness: HIGH — every dep verified; zero missing
- Validation architecture: HIGH — 21 test bindings mapped 1:1 to requirements + a11y + visual + CI gate

**Research date:** 2026-04-22
**Valid until:** 2026-05-06 (14 days — fast-moving HeroUI v3 beta may release a minor; re-verify version + Drawer API if >14 days before implementation)
