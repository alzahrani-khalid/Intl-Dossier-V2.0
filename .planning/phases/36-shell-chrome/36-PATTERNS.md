# Phase 36: shell-chrome — Pattern Map

**Mapped:** 2026-04-22
**Files analyzed:** 16 (5 new components, 6 new tests, 2 new e2e, 3 modified)
**Analogs found:** 16 / 16

---

## File Classification

| New/Modified File                                              | Role                   | Data Flow                                     | Closest Analog                                                                                              | Match Quality                |
| -------------------------------------------------------------- | ---------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `frontend/src/components/layout/AppShell.tsx`                  | layout-wrapper         | request-response (React render)               | `frontend/src/components/layout/MainLayout.tsx`                                                             | exact (same role, same slot) |
| `frontend/src/components/layout/Sidebar.tsx`                   | component              | request-response                              | `frontend/src/components/layout/AppSidebar.tsx`                                                             | exact                        |
| `frontend/src/components/layout/Topbar.tsx`                    | component              | request-response + event-driven (Tweaks open) | `frontend/src/components/layout/SiteHeader.tsx`                                                             | exact                        |
| `frontend/src/components/layout/ClassificationBar.tsx`         | component              | transform (direction → variant)               | `frontend/src/components/tweaks/TweaksDrawer.tsx` (internal switch-by-state pattern)                        | role-match                   |
| `frontend/src/components/brand/GastatLogo.tsx`                 | component (inline SVG) | static-render                                 | lucide-react icon pass-through pattern (used across codebase)                                               | role-match                   |
| `frontend/src/components/layout/AppShell.test.tsx`             | test                   | unit render                                   | `frontend/src/components/tweaks/TweaksDrawer.test.tsx`                                                      | role-match                   |
| `frontend/src/components/layout/Sidebar.test.tsx`              | test                   | unit render                                   | `TweaksDrawer.test.tsx`                                                                                     | role-match                   |
| `frontend/src/components/layout/Topbar.test.tsx`               | test                   | unit render                                   | `TweaksDrawer.test.tsx`                                                                                     | role-match                   |
| `frontend/src/components/layout/ClassificationBar.test.tsx`    | test                   | unit render                                   | `TweaksDrawer.test.tsx`                                                                                     | role-match                   |
| `frontend/src/components/brand/GastatLogo.test.tsx`            | test                   | unit render                                   | `TweaksDrawer.test.tsx`                                                                                     | partial                      |
| `frontend/src/components/layout/AppShell.a11y.test.tsx`        | test (a11y)            | axe-core run                                  | `TweaksDrawer.test.tsx` harness                                                                             | partial                      |
| `frontend/tests/e2e/phase-36-shell.spec.ts`                    | e2e test               | request-response                              | `frontend/tests/e2e/rtl-switching.spec.ts`                                                                  | exact                        |
| `frontend/tests/e2e/phase-36-shell-smoke.spec.ts`              | e2e test               | request-response                              | `rtl-switching.spec.ts`                                                                                     | exact                        |
| `frontend/src/routes/_protected.tsx` (modify)                  | route                  | config                                        | current file — swap `MainLayout` → `AppShell`                                                               | self                         |
| `frontend/src/components/layout/navigation-config.ts` (modify) | config/data            | static export                                 | current file — already has `id: 'operations'\|'dossiers'\|'administration'`; no code change, consumed as-is | self                         |
| `frontend/src/i18n/en/common.json` + `ar/common.json` (modify) | i18n                   | static JSON                                   | current file — add `shell.*` namespace alongside existing `tweaks.*` / `navigation.*`                       | self                         |
| `scripts/check-deleted-components.sh` (modify)                 | CI script              | shell                                         | current file — extend `PATTERNS=()` array with 4 filenames                                                  | self                         |

---

## Pattern Assignments

### `AppShell.tsx` (layout-wrapper)

**Analog:** `frontend/src/components/layout/MainLayout.tsx`

**Imports + props pattern** (MainLayout.tsx:1-24):

```tsx
import { type ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'

import { cn } from '@/lib/utils'
import { useResponsive } from '@/hooks/useResponsive'
import { useDirection } from '@/hooks/useDirection'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { SiteHeader } from './SiteHeader'

interface MainLayoutProps {
  children: ReactNode
  showFAB?: boolean
  showBreadcrumbTrail?: boolean
  showDossierContext?: boolean
}
```

**Core shell composition** (MainLayout.tsx:58-97):

```tsx
return (
  <>
    <SidebarProvider
      dir={direction}
      defaultOpen={getStoredSidebarOpen()}
      style={
        {
          '--sidebar-width': '16rem',
          '--header-height': '3.5rem',
          '--content-margin': '0.375rem',
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className={cn('bg-muted/40 flex flex-1 flex-col overflow-y-auto', isMobile && 'pb-16')}>
          {/* breadcrumb, dossier context, children */}
          <div className="@container/main flex-1 p-4 sm:p-6 lg:p-8 xl:mx-auto xl:w-full xl:max-w-[1600px]">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    <MobileBottomTabBar />
    {displayFAB && <ContextAwareFAB ... />}
    <Toaster ... />
  </>
)
```

**Cookie-persisted sidebar open helper** (MainLayout.tsx:26-34):

```tsx
function getStoredSidebarOpen(): boolean {
  try {
    const stored = localStorage.getItem('sidebar_state')
    if (stored === 'false') return false
    return true
  } catch {
    return true
  }
}
```

**Copy as-is:**

- `SidebarProvider dir={direction} defaultOpen={...} style={{...CSS vars}}` wrapper
- `<SidebarInset>` as the main-content slot
- `getStoredSidebarOpen()` helper (cookie/localStorage `sidebar_state` key — preserved per UI-SPEC §"Collapsed-state persistence")
- `children` prop pattern (AppShell is a pass-through wrapper)
- `useDirection()` hook consumption

**Change:**

- Rename `MainLayoutProps` → `AppShellProps`; drop `showBreadcrumbTrail` + `showDossierContext` + `showFAB` props (UI-SPEC §"Out of scope" removes breadcrumb + dossier-context + FAB from the shell)
- Replace `<AppSidebar />` + `<SiteHeader />` with new `<Sidebar />` + `<Topbar />` compositions
- Remove `<MobileBottomTabBar />` (D-05 deletes it)
- Remove `<ContextAwareFAB>` (move to per-page rendering — UI-SPEC `Out of scope`)
- Add `<ClassificationBar />` rendered between `<Topbar />` and `<main>` when `useClassification().classif === true`
- `<main>` at AppShell boundary is `p-0` (UI-SPEC: "page-level controls its own `var(--pad)`")

**Key deviations:**

- **DO NOT** import `LanguageProvider` / `DesignProvider` / `TweaksDisclosureProvider` inside AppShell — AppShell mounts INSIDE these providers (established in `frontend/src/App.tsx`). Read direction/locale/classif via hooks only.
- **DO NOT** re-write `html.dir` / `html.lang` — `bootstrap.js` owns pre-paint; `LanguageProvider` owns runtime cascade. AppShell only consumes.
- Toaster stays (it's global chrome).

---

### `Sidebar.tsx` (component)

**Analog:** `frontend/src/components/layout/AppSidebar.tsx`

**Hook wiring + config consumption** (AppSidebar.tsx:35-65):

```tsx
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>): React.ReactElement {
  const { t, i18n } = useTranslation('common')
  const isRTL = i18n.language === 'ar'
  const { user } = useAuth()
  const location = useLocation()
  const { setOpenMobile, setOpen, toggleSidebar, open, openMobile, isMobile } = useSidebar()
  const { data: workCounts } = useWorkQueueCounts()

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const groups = useMemo(
    () =>
      createNavigationGroups(
        { tasks: workCounts?.intake ?? 0, approvals: workCounts?.waiting ?? 0, engagements: 0 },
        isAdmin,
      ),
    [workCounts?.intake, workCounts?.waiting, isAdmin],
  )

  // Auto-close mobile sidebar on navigation
  const prevPathnameRef = useRef(location.pathname)
  if (prevPathnameRef.current !== location.pathname) {
    prevPathnameRef.current = location.pathname
    setOpenMobile(false)
  }
```

**Brand-header slot** (AppSidebar.tsx:88-110):

```tsx
<SidebarHeader className="relative pb-1">
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton size="lg" asChild tooltip="GASTAT Dossier" className="h-10 ...">
        <Link to="/dashboard">
          <div className="bg-card text-foreground flex aspect-square size-8 items-center justify-center rounded-md border border-border">
            <span className="text-sm font-bold">G</span>
          </div>
          <div className="grid flex-1 text-start text-sm leading-tight">
            <span className="truncate font-semibold">GASTAT Dossier</span>
            <span className="truncate text-xs text-muted-foreground">
              {t('navigation.workspace', 'Workspace')}
            </span>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
  {/* User avatar */}
  <div className="mt-1 px-2">
    <NavUser />
  </div>
</SidebarHeader>
```

**Nav consumption via createNavigationGroups** (AppSidebar.tsx:131-167 — the `<NavMain groups={groups} />` call) drives all 3 sections (Operations / Dossiers / Administration).

**Copy as-is:**

- `useTranslation('common')` + `useAuth()` + `useSidebar()` hook triple
- `useMemo(createNavigationGroups(...), [...])` pattern
- Auto-close-on-navigation via `prevPathnameRef` render-time check (lines 61-65) — reused for drawer auto-close per UI-SPEC §"Close triggers: any nav-item click → auto-close on route change"
- `isAdmin` gate (line 44) — **PRESERVES the `navigation-config.ts:169` admin gate** (UI-SPEC §"Nav section taxonomy: rendered only when isAdmin === true")
- Consumption of `navigation-config.ts` via `createNavigationGroups()` — do NOT re-implement routing

**Change:**

- Replace placeholder `<span>G</span>` logo with `<GastatLogo size={22} className="text-[var(--accent)]" />` inside `.sb-mark` wrapper (SHELL-05 + D-07)
- Replace shadcn `<Sidebar collapsible="icon">` chrome with the handoff's flat 256px composition: `.sb-brand` → `.sb-user` → `.sb-nav` (3 sections) → `.sb-foot`
- Active-nav `::before` 2px accent bar using `before:absolute before:inset-inline-start-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-[2px] before:bg-[var(--accent)] before:content-[""]` (UI-SPEC §"Active-nav 2px accent bar — LOCKED implementation")
- Footer: `v2.0 · ● Synced` line using `font-mono` + `var(--ok)` dot (UI-SPEC §"Sidebar Anatomy §4")
- User card per UI-SPEC §"User card anatomy" (avatar 30×30 initials, name 13px/500, role 10.5px mute)
- **Hamburger overlay drawer** for ≤1024px: wrap the whole Sidebar in HeroUI `<Drawer>` (reuse Phase-34 `TweaksDrawer.tsx` compound-component pattern — see ClassificationBar analog below), `placement={isRTL ? 'right' : 'left'}`

**Key deviations:**

- `navigation-config.ts` is CONSUMED, never re-implemented. The three groups come verbatim from `createNavigationGroups()`.
- **NO `.reverse()`** on `groups.map()` — `forceRTL` handles direction.
- **NO `textAlign: "right"`** — use `text-start` + `writingDirection` cascade from `html[dir="rtl"]`.

---

### `Topbar.tsx` (component)

**Analog:** `frontend/src/components/layout/SiteHeader.tsx`

**Full file (101 lines) — key patterns:**

**Hook wiring** (SiteHeader.tsx:20-34):

```tsx
export function SiteHeader() {
  const { isRTL, direction } = useDirection()
  const { toggleSidebar, open, openMobile, isMobile } = useSidebar()
  const { t } = useTranslation('common')
  const { isOpen: isTweaksOpen, toggle: toggleTweaks } = useTweaksOpen()

  const isExpanded = isMobile ? openMobile : open
  const ToggleIcon = isRTL
    ? isExpanded ? PanelRightCloseIcon : PanelRightOpenIcon
    : isExpanded ? PanelLeftCloseIcon : PanelLeftOpenIcon
```

**Sticky header + logical spacing** (SiteHeader.tsx:36-41):

```tsx
<header
  dir={direction}
  className="bg-background/40 sticky top-0 z-50 flex h-14 sm:h-[var(--header-height)] w-full shrink-0 items-center gap-2 border-b backdrop-blur-md md:rounded-ss-xl md:rounded-se-xl"
>
  <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
```

**Tweaks button wiring (canonical pattern — preserve)** (SiteHeader.tsx:73-91):

```tsx
{
  /* Tweaks drawer trigger */
}
;<Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="size-11 min-h-11 min-w-11 text-muted-foreground hover:bg-accent/80 hover:text-foreground"
      onClick={toggleTweaks}
      aria-label={t('tweaks.open')}
      aria-expanded={isTweaksOpen}
    >
      <Settings2 className="size-5" />
      <span className="sr-only">{t('tweaks.open')}</span>
    </Button>
  </TooltipTrigger>
  <TooltipContent side={isRTL ? 'left' : 'right'} sideOffset={8}>
    <p className="text-xs">{t('tweaks.open')}</p>
  </TooltipContent>
</Tooltip>
```

**End-cluster with `ms-auto`** (SiteHeader.tsx:69):

```tsx
<div className="ms-auto flex items-center gap-1">
```

**Copy as-is:**

- `useTweaksOpen()` hook import from `@/components/tweaks` — **unchanged trigger API per Phase 34 D-05** (CONTEXT §Claude's Discretion: "Keep the same trigger API")
- `useDirection()` + `useTranslation('common')` + `useSidebar()` hook triple
- `aria-label={t('tweaks.open')}` + `aria-expanded={isTweaksOpen}` pattern
- `ms-auto` for the end cluster (logical property — works in RTL automatically)
- `dir={direction}` attribute on `<header>`
- Sticky + backdrop-blur pattern

**Change:**

- Replace 3-item layout (toggle / search / notifications+tweaks+usermenu) with the 7-item UI-SPEC layout:
  1. Hamburger (`Menu` icon, `lg:hidden`, 44×44 on phone, 36×36 on tablet) → opens sidebar drawer
  2. Search pill (flex-1 `max-w-[520px]`, `Search` icon 16px, `<kbd>⌘K</kbd>` hidden ≤1024px)
  3. `.tb-right` cluster at `ms-auto`:
  4. Direction switcher (`.tb-dir` segmented group, 4 buttons — UI-SPEC §"Topbar Anatomy item 3")
  5. Bell + badge (`Bell` + absolute `top-0.5 end-0.5`)
  6. Theme toggle (Sun/Moon based on `useMode()`)
  7. Locale switcher (`EN` / `ع` segmented)
  8. Tweaks button (reuse pattern above; icon changes from `Settings2` → `Sliders`, label visible ≥640px)
- Height `min-h-14 h-14` desktop; phone wraps to `min-h-[52px] h-auto flex-wrap` with search moving to `order-10 basis-full`
- Remove `<NotificationPanel>` dropdown UI — bell becomes trigger-only (UI-SPEC: Phase 42 owns dropdown content)
- Remove `<UserMenu>` (moved to sidebar user card per UI-SPEC §"Sidebar Anatomy §2")

**Key deviations:**

- `<kbd dir="ltr" unicode-bidi-isolate>⌘K</kbd>` — UI-SPEC §"RTL Mirroring Rules — `⌘K` kbd: isolate"
- Direction switcher uses `border-inline-end` between buttons (NOT `border-r`) — UI-SPEC RTL rules
- Notification badge uses `end-0.5` not `right-0.5`
- Touch targets: all icon buttons `min-h-11 min-w-11` (44×44) — global CLAUDE.md rule

---

### `ClassificationBar.tsx` (component)

**Analog (closest):** `frontend/src/components/tweaks/TweaksDrawer.tsx` — single-component-with-internal-switch pattern. No existing classification UI in codebase.

**Hook-driven conditional render pattern** (TweaksDrawer.tsx:48-68):

```tsx
export function TweaksDrawer(): ReactElement {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'

  const { isOpen, close } = useTweaksOpen()
  const { direction, setDirection } = useDesignDirection()
  const { mode, setMode } = useMode()
  // ... 6 hooks reading DesignProvider state
```

**Internal switch-by-variant pattern** (TweaksDrawer.tsx:102-127, DIRECTIONS-mapped button block):

```tsx
{
  DIRECTIONS.map((d) => {
    const active = direction === d
    return (
      <button
        key={d}
        type="button"
        onClick={(): void => handleDirection(d)}
        aria-pressed={active}
        className={cn(
          'flex flex-col items-start gap-xs p-[10px] rounded-[var(--radius-sm)] border text-start min-h-11',
          active
            ? 'bg-accent-soft border-accent text-accent-ink'
            : 'bg-surface border-line text-ink',
        )}
      >
        ...
      </button>
    )
  })
}
```

**Copy as-is:**

- `useClassification()` hook from `@/design-system/hooks` — same source TweaksDrawer uses (line 57): `const { classif } = useClassification()`. Early-return `null` when `!classif`.
- `useDirection()` hook for variant selection
- `useTranslation()` for copywriting (new `shell.classification.*` keys)
- Single-component internal-switch pattern (CONTEXT locked: "single `<ClassificationBar direction={...}>` with an internal switch" — UI-SPEC §"Classification Chrome (SHELL-03) — Component Shape Decision")

**Change (vs TweaksDrawer):**

- NOT a drawer — this is inline chrome. Drop `Drawer/DrawerContent/useOverlayState` entirely.
- Switch structure:
  ```tsx
  if (!classif) return null
  switch (direction) {
    case 'chancery':
      return <div className="cls-marginalia ...">— {content} —</div>
    case 'situation':
      return (
        <div className="cls-ribbon bg-[var(--accent)] text-[var(--accent-fg)] ...">{content}</div>
      )
    case 'ministerial':
    case 'bureau':
      return <span className="cls-chip ms-5 mt-2 ...">● {content}</span>
  }
  ```
- Content contract per UI-SPEC:
  `{workspace} · {classification level} · {handling note} · {session date} · {user initials}`
  assembled from `t('shell.classification.workspace')`, `document.documentElement.dataset.classification`, `t('shell.classification.handleSecurely')`, locale-formatted date, `auth.user.full_name` initials.

**DOM position:**

- Chancery (marginalia) + Situation (ribbon) render INSIDE `AppShell` between `<Topbar />` and `<main>`.
- Ministerial/Bureau (chip) render INSIDE `<main>` at page-head start — `AppShell` passes this variant through a portal or renders it inline at start of main (UI-SPEC §"Per-direction DOM anatomy").

**Key deviations:**

- **NO `textAlign: "right"`** — use `text-center` (ribbon + marginalia are centered per UI-SPEC §"RTL Mirroring Rules" — "symmetric").
- Use `ms-5 mt-2` for chip (logical margin — UI-SPEC explicit).
- Return `null` when `classif === false` — same pattern as handoff `shell.jsx:196`.

---

### `GastatLogo.tsx` (component)

**Analog:** No existing inline-SVG React brand component. Closest pattern is the lucide-icon pass-through used throughout codebase (e.g., `<Settings2 className="size-5" />` in SiteHeader.tsx:84).

**Source SVG:** `/tmp/inteldossier-handoff/inteldossier/project/reference/GASTAT_LOGO.svg` (6704 bytes — verified exists via Glob).

**Target shape (per CONTEXT D-07 + UI-SPEC §"GASTAT Logo Rules"):**

```tsx
interface GastatLogoProps {
  className?: string
  size?: number
}

export function GastatLogo({ className, size = 22 }: GastatLogoProps): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="..." /* preserve from source */
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* every fill/stroke/gradient-stop color → currentColor */}
    </svg>
  )
}
```

**Copy as-is:**

- Props shape `{ className?, size? }` (matches lucide-react icon convention)
- `aria-hidden="true" focusable="false"` pattern (idiomatic for decorative SVGs)
- `viewBox` and `stroke-width` preserved from source (UI-SPEC §"GASTAT Logo Rules")

**Change (vs raw handoff SVG):**

- Every `fill="…"`, `stroke="…"`, `stop-color="…"` → `currentColor`
- Wrap in named-export React function (NOT default export per CLAUDE.md §"Module Design: Named exports")
- Explicit return type `ReactElement` per CLAUDE.md §"Code Style: Explicit Return Types"

**Key deviations:**

- **NO `rotate-180` in RTL** — brand preserves orientation (UI-SPEC §"RTL Mirroring Rules — GASTAT logo: no flip").
- **NO `filter: hue-rotate` / `mask-image` hacks** — tint via `currentColor` + parent `color: var(--accent)`.
- **NO `vite-plugin-svgr`** added — component is hand-converted TSX (CONTEXT D-07: "No new Vite plugin").

---

### Test files — unit tests

**Analog:** `frontend/src/components/tweaks/TweaksDrawer.test.tsx`

**Harness with real i18n** (TweaksDrawer.test.tsx:14-40):

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Must be declared BEFORE any `import` that transitively pulls react-i18next.
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')
  return actual
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'

import i18n from '@/i18n'
import { DesignProvider } from '@/design-system/DesignProvider'
import { TweaksDisclosureProvider } from './TweaksDisclosureProvider'

function Harness({ children }: { children: ReactNode }): ReactElement {
  return (
    <I18nextProvider i18n={i18n}>
      <DesignProvider>
        <TweaksDisclosureProvider>{children}</TweaksDisclosureProvider>
      </DesignProvider>
    </I18nextProvider>
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
})
```

**Bilingual render assertion** (TweaksDrawer.test.tsx:56-91):

```tsx
it('renders 6 section headings in English once opened', async () => {
  const user = userEvent.setup()
  render(
    <Harness>
      ...
      <TweaksDrawer />
    </Harness>,
  )
  await user.click(screen.getByText('open'))
  expect(await screen.findByText('Direction')).toBeTruthy()
  // ...
})

it('renders 6 section headings in Arabic once opened', async () => {
  await i18n.changeLanguage('ar')
  // same render, Arabic assertions: الاتجاه, المظهر, ...
})
```

**Copy as-is:**

- `vi.mock('react-i18next', ... importOriginal)` at top of file (critical — default global mock omits `tweaks.*` keys; shell test needs real `t()` to resolve `shell.*` keys)
- `Harness` wrapping `I18nextProvider` + `DesignProvider` + `TweaksDisclosureProvider` (AppShell tests need all three; Sidebar/Topbar tests need all three for hook consumers)
- `beforeEach(async () => { await i18n.changeLanguage('en') })` reset between tests
- Paired EN + AR render assertions (every shell component must render both locales)
- `toBeTruthy()` on found elements (no `jest-dom` installed — UI-SPEC note in TweaksDrawer test line 68)

**Change per-file:**

- `AppShell.test.tsx`: asserts presence of `<Sidebar>`, `<Topbar>`, `<main>` slots; tests `children` pass-through
- `Sidebar.test.tsx`: asserts 3 section headings (Operations / Dossiers / Administration if isAdmin); tests `isAdmin: false` hides Admin section (matches config line 169 gate); tests active-state `::before` class applied to current route
- `Topbar.test.tsx`: asserts all 7 controls render; tests Tweaks button calls `useTweaksOpen().toggle`; tests direction-switcher active state inverts on click
- `ClassificationBar.test.tsx`: asserts `classif: false` → renders null; asserts `direction: chancery` → `.cls-marginalia`; `situation` → `.cls-ribbon`; `ministerial/bureau` → `.cls-chip`; content string assembly
- `GastatLogo.test.tsx`: asserts `currentColor` on every `fill`/`stroke` attr; asserts `size` prop controls width/height; asserts `aria-hidden="true"`

**`AppShell.a11y.test.tsx` (additional):**

- Use same `Harness` but add `axe-core` run via `@axe-core/react` or `vitest-axe`
- Assert 0 violations on rendered shell (both EN + AR locales)
- Test focus trap when drawer opens (React Aria should handle via HeroUI Drawer)

---

### E2E specs — `frontend/tests/e2e/phase-36-shell*.spec.ts`

**Analog:** `frontend/tests/e2e/rtl-switching.spec.ts`

**Auth-bypass + locale-seed helper pattern** (rtl-switching.spec.ts:1-20):

```ts
import { test, expect, type Page } from '@playwright/test'

async function authBypass(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const payload = {
      state: {
        user: { id: 'test-user', email: 'test@example.com', name: 'Test' },
        isAuthenticated: true,
      },
      version: 0,
    }
    localStorage.setItem('auth-storage', JSON.stringify(payload))
  })
}

async function seedLocale(page: Page, locale: 'en' | 'ar'): Promise<void> {
  await page.addInitScript((l: 'en' | 'ar'): void => {
    localStorage.setItem('id.locale', l)
  }, locale)
}
```

**Assertion pattern** (rtl-switching.spec.ts:22-34):

```ts
test('RTL layout applies when id.locale=ar is seeded', async ({ page }) => {
  await authBypass(page)
  await seedLocale(page, 'ar')
  await page.goto('/responsive-demo')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
})
```

**Copy as-is:**

- `authBypass()` helper — writes `auth-storage` localStorage key
- `seedLocale()` helper — writes `id.locale` per Phase 34 D-12 canonical key
- `addInitScript` for pre-navigation state seeding
- `test('desc', async ({ page }) => { ... })` structure (Playwright bare `test`, no `describe` required)

**Change:**

- `phase-36-shell.spec.ts` — full matrix:
  - 4 directions × 2 locales × 3 breakpoints (phone 375px / tablet 1000px / desktop 1440px) = 24 visual scenarios
  - Each test: `authBypass` → `seedDirection` (new helper writing `id.dir`) → `seedLocale` → `page.setViewportSize()` → navigate → assert shell geometry (sidebar width 256px desktop / drawer ≤1024px / 100vw phone)
  - Assert hamburger hidden ≥1025px, shown ≤1024px
  - Assert classification variant matches direction (`.cls-marginalia` / `.cls-ribbon` / `.cls-chip`)
  - Assert Tweaks button opens drawer (click + `expect(page.getByRole('dialog'))`)
- `phase-36-shell-smoke.spec.ts` — quick smoke:
  - 1 test per locale × phone viewport
  - Assert shell renders without console errors
  - Assert no layout overflow at 320px

**Key deviations:**

- Seeding `id.dir` (new helper) + `id.locale` + optional `id.classif` before navigation — atomic pre-paint state
- No `beforeEach` needed (each test is self-contained per rtl-switching pattern)
- Screenshots optional but useful: `await page.screenshot({ path: 'phase-36-${dir}-${locale}-${bp}.png' })` for visual-regression baseline if desired

---

### `_protected.tsx` (modify)

**File path:** `frontend/src/routes/_protected.tsx`

**Current state** (line 2 + line 61-65):

```tsx
import { MainLayout } from '@/components/layout/MainLayout'
// ...
return (
  <ChatProvider>
    <MainLayout>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </MainLayout>
    // ...
  </ChatProvider>
)
```

**Change:** Two-line swap:

1. Line 2: `import { MainLayout } from '@/components/layout/MainLayout'` → `import { AppShell } from '@/components/layout/AppShell'`
2. Line 61: `<MainLayout>` → `<AppShell>` (+ closing tag line 65)

**Key deviations:** None — this is a pure alias swap. No logic change.

---

### `navigation-config.ts` (modify or verify)

**File path:** `frontend/src/components/layout/navigation-config.ts`

**Already-correct state** (lines 34-41):

```ts
export interface NavigationGroup {
  id: 'operations' | 'dossiers' | 'administration'
  label: string
  icon: LucideIcon
  items: NavigationItem[]
  collapsible?: boolean
  defaultOpen?: boolean
}
```

**Already exports `createNavigationGroups(counts, isAdmin)`** (lines 53-219) with the 3-section taxonomy UI-SPEC §"Nav section taxonomy (LOCKED MAPPING)" requires verbatim.

**Change:**

- **Verification-only in most cases.** The new `Sidebar.tsx` consumes `createNavigationGroups()` as-is. D-03 says "preserve + extend with `section` discriminator" — but the discriminator `id` already exists. No code change required unless UI-SPEC reveals a missing item.
- If any icon in UI-SPEC §"Icon Inventory" differs from current config (e.g., UI-SPEC says `UsersRound` for working-groups — config line 155 already has it), leave alone.
- **Legacy `createNavigationSections()` function (lines 222-238) stays** — Karpathy Rule 3 ("don't delete pre-existing code unless asked").

**Key deviations:** This file is LOAD-BEARING — touch only if UI-SPEC mismatches config.

---

### i18n locale files (modify)

**Files:** `frontend/src/i18n/en/common.json` + `frontend/src/i18n/ar/common.json`

**Current pattern** (common.json:1095-1111 — `tweaks` namespace for Phase 34):

```json
"tweaks": {
  "title": "Tweaks",
  "open": "Open tweaks",
  "direction": {
    "label": "Direction",
    "chancery": { "name": "Chancery", "tagline": "Formal, warm amber" },
    ...
  }
}
```

`navigation.*` namespace already exists at `common.json:106`.

**Change:** Add NEW top-level `shell` namespace next to existing `tweaks` and `navigation`. Per UI-SPEC §"Copywriting Contract" — ~25 keys:

```json
"shell": {
  "appName": "Intl-Dossier",
  "workspace": "GASTAT · Intelligence Workspace",
  "user": { "noRole": "Member" },
  "footer": { "sync": "v2.0 · Synced" },
  "search": { "placeholder": "Search dossiers, tasks, people…", "kbd": "⌘K" },
  "direction": {
    "chancery": "Chancery", "situation": "Situation Room",
    "ministerial": "Ministerial", "bureau": "Bureau"
  },
  "theme": { "toggle": "Toggle theme" },
  "notifications": { "open": "Open notifications" },
  "tweaks": "Tweaks",
  "menu": { "open": "Open navigation menu", "close": "Close navigation menu" },
  "classification": {
    "workspace": "GASTAT", "handleSecurely": "Handle via secure channels",
    "session": "Session:"
  },
  "brand": { "mark": "GASTAT" },
  "empty": {
    "noNav": { "title": "No workspaces available", "body": "Contact your administrator to request access." }
  },
  "error": { "mount": "The workspace couldn't load. Refresh to retry." }
}
```

**Key deviations:**

- Mirror structure EXACTLY in `ar/common.json` with Arabic copy per UI-SPEC §"Copywriting Contract" table
- Keep `tweaks.*` namespace UNTOUCHED (Phase 34 owns it)
- Keep `navigation.*` namespace UNTOUCHED (Phase 36 sidebar reuses existing `navigation.operations` / `.dossiers` / `.administration` keys)

---

### `check-deleted-components.sh` (modify)

**File path:** `scripts/check-deleted-components.sh`

**Current pattern** (lines 6-19 — Phase 34 deletion sweep):

```bash
PATTERNS=(
  "from.*language-toggle/LanguageToggle"
  "from.*language-switcher/LanguageSwitcher"
  "from.*language-switcher/language-switcher"
  "from.*pages/Themes"
  "from.*hooks/useTheme"
  "from.*components/ui/theme-toggle"
  "from.*theme-provider/theme-provider"
  "from.*theme-provider/useTheme"
  "from.*theme-selector/ThemeSelector"
  "to=[\"']/themes[\"']"
  "navigate\\(['\"]/themes['\"]"
)
```

**Loop + grep pattern** (lines 22-27):

```bash
for p in "${PATTERNS[@]}"; do
  if grep -rn --include="*.ts" --include="*.tsx" -E "$p" frontend/src 2>/dev/null; then
    echo "FAIL: stale reference matching /$p/" >&2
    FAIL=1
  fi
done
```

**Change:** Append to the `PATTERNS=()` array (do NOT replace — Karpathy Rule 3):

```bash
# Phase 36 deletion sweep
"from.*layout/MainLayout"
"from.*layout/AppSidebar"
"from.*layout/SiteHeader"
"from.*layout/MobileBottomTabBar"
```

Also add file-existence sentinels (same style as line 30's `grep -n "path: '/themes'"`):

```bash
# Phase 36 file-existence sentinels
for f in MainLayout AppSidebar SiteHeader MobileBottomTabBar; do
  if [ -f "frontend/src/components/layout/${f}.tsx" ]; then
    echo "FAIL: frontend/src/components/layout/${f}.tsx still exists" >&2
    FAIL=1
  fi
done
```

**Key deviations:**

- Preserve Phase-34 patterns — don't remove them.
- Sentinel loop is ADDITIVE (new), not replacement.
- Keep `set -euo pipefail` header and exit pattern.

---

## Shared Patterns

### Hook consumption (applies to AppShell, Sidebar, Topbar, ClassificationBar)

**Source:** `frontend/src/design-system/hooks` (Phase 33 established)
**Apply to:** Every new component in Phase 36

```tsx
import {
  useDesignDirection,
  useMode,
  useHue,
  useDensity,
  useClassification,
  useLocale,
} from '@/design-system/hooks'

const { direction } = useDesignDirection()
const { mode } = useMode()
const { classif } = useClassification()
const { locale } = useLocale()
```

**Canonical direction hook in repo (legacy name):** `useDirection()` from `@/hooks/useDirection` (used by MainLayout + SiteHeader + AppSidebar). Phase 36 components MAY use either `useDirection` (returns `{ isRTL, direction }`) or `useDesignDirection` (returns `{ direction, setDirection }`) depending on need. **Pick one per file and stay consistent.**

### Tweaks trigger (applies to Topbar ONLY)

**Source:** `frontend/src/components/tweaks/use-tweaks-open.ts` (Phase 34 D-05)
**Apply to:** `Topbar.tsx` Tweaks button

```tsx
import { useTweaksOpen } from '@/components/tweaks'
const { isOpen: isTweaksOpen, toggle: toggleTweaks } = useTweaksOpen()
// Button: onClick={toggleTweaks} aria-expanded={isTweaksOpen} aria-label={t('shell.tweaks')}
```

### i18n + RTL cascade (applies to all)

**Source:** `CLAUDE.md §"Web/Tailwind RTL Requirements"`
**Apply to:** Every component rendering text/layout

- `const { t, i18n } = useTranslation('common')`
- Logical props ONLY: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`, `rounded-s-*`, `rounded-e-*`, `border-inline-start/end`
- NEVER: `ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`, `text-right`
- `dir={direction}` on top-level component wrappers
- Tajawal cascade automatic in RTL — NO inline `style={{ fontFamily }}`

### Touch targets (applies to Topbar, Sidebar, ClassificationBar)

**Source:** CLAUDE.md §"Mobile-First & Responsive Design"
**Apply to:** Every interactive element

- Minimum `min-h-11 min-w-11` (44×44)
- Adequate spacing with `gap` property
- Hamburger: `md:h-9 md:w-9 h-11 w-11` (36×36 tablet, 44×44 phone)

### Active-state via `::before` pseudo-element (applies to Sidebar)

**Source:** Handoff `app.css:67` + CONTEXT Claude's Discretion
**Apply to:** `Sidebar.tsx` nav items

```tsx
className={cn(
  'relative',
  isActive && 'before:absolute before:inset-inline-start-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-[2px] before:bg-[var(--accent)] before:content-[""]',
)}
```

No `border-inline-start` alternative — pseudo-element avoids 2px content-shift.

### CSS-var-only colors (applies to all)

**Source:** Phase 33 D-04 DesignProvider owns every var
**Apply to:** Every color value in Phase 36

- `bg-[var(--sidebar-bg)]`, `text-[var(--sidebar-ink)]`, `border-[var(--line)]`, `bg-[var(--accent)]`, `text-[var(--accent-fg)]`, etc.
- **NEVER** raw hex (`#3b82f6`), **NEVER** Tailwind-palette (`bg-gray-500`, `text-blue-600`).
- Only exception: `bg-black/35` for drawer backdrop (same as Phase 34 Tweaks drawer).

---

## No Analog Found

No files in this phase lack an analog. All 16 new/modified files have at least a partial match.

Noted for planner:

- **`GastatLogo.tsx`** has no existing brand-logo component, but the lucide-icon pass-through pattern is a clean template for `{className, size}` props.
- **`ClassificationBar.tsx`** has no existing classification UI; the TweaksDrawer.tsx internal-switch-by-variant pattern is the closest behavioral analog (same hook-driven conditional render).

---

## Metadata

**Analog search scope:**

- `frontend/src/components/layout/` (all files)
- `frontend/src/components/tweaks/` (Phase 34 analogs)
- `frontend/src/routes/_protected.tsx`
- `frontend/tests/e2e/` (rtl-switching, dossier-rtl-complete, dossier-rtl-mobile)
- `frontend/src/i18n/en/common.json` + `ar/common.json`
- `scripts/check-deleted-components.sh`
- `/tmp/inteldossier-handoff/inteldossier/project/reference/GASTAT_LOGO.svg` (verified present)

**Files scanned:** ~30
**Strong analogs extracted:** 4 primary (MainLayout, AppSidebar, SiteHeader, TweaksDrawer) + 3 supporting (navigation-config, rtl-switching spec, check-deleted-components script)

**Pattern extraction date:** 2026-04-22
