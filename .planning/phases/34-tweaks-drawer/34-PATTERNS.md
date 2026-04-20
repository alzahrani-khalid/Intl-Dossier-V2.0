# Phase 34: tweaks-drawer — Pattern Map

**Mapped:** 2026-04-20
**Files analyzed:** 19 (create: 11 · modify: 6 · delete-sweep: referenced)
**Analogs found:** 17 / 19

## File Classification

| New/Modified File                                                                                                                                                                        | Role                                 | Data Flow                                                      | Closest Analog                                                                                                                                            | Match Quality                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `frontend/src/components/tweaks/TweaksDrawer.tsx`                                                                                                                                        | UI component (compound wrapper)      | DesignProvider consumer + localStorage via hooks + i18next I/O | `frontend/src/components/ui/heroui-modal.tsx` (HeroUI compound wrapper) + `frontend/src/components/language-toggle/LanguageToggle.tsx` (segmented toggle) | role-match (new primitive: `Drawer` not `Modal`) |
| `frontend/src/components/tweaks/use-tweaks-open.ts` + `TweaksDisclosureProvider.tsx`                                                                                                     | Hook + Context provider              | React state (boolean)                                          | `frontend/src/contexts/ChatContext.tsx` (open/close Context)                                                                                              | exact                                            |
| `frontend/src/components/tweaks/index.ts`                                                                                                                                                | Barrel export                        | —                                                              | `frontend/src/design-system/tokens/index.ts` (re-export pattern)                                                                                          | exact                                            |
| `frontend/src/components/tweaks/TweaksDrawer.test.tsx`                                                                                                                                   | Test (integration/RTL)               | React Testing Library + i18next                                | `frontend/tests/unit/design-system/buildTokens.test.ts` (vitest describe/it shape)                                                                        | role-match                                       |
| `frontend/src/components/tweaks/persistence.test.tsx`                                                                                                                                    | Test (localStorage round-trip)       | jsdom localStorage + DesignProvider mount                      | `frontend/tests/unit/design-system/applyTokens.test.ts`                                                                                                   | role-match                                       |
| `frontend/src/design-system/directionDefaults.ts`                                                                                                                                        | Utility (pure map + applier)         | Pure function                                                  | `frontend/src/design-system/tokens/densities.ts` (const record + helper)                                                                                  | exact                                            |
| `frontend/src/design-system/directionDefaults.test.ts`                                                                                                                                   | Test (unit)                          | vitest pure-fn                                                 | `frontend/tests/unit/design-system/buildTokens.test.ts`                                                                                                   | exact                                            |
| `frontend/tests/bootstrap/migrator.test.ts`                                                                                                                                              | Test (unit, jsdom bootstrap harness) | Read file text + exec in sandbox + assert localStorage         | `frontend/tests/unit/design-system/fouc-bootstrap.test.ts`                                                                                                | exact (regex-scrape + vitest harness pattern)    |
| `frontend/tests/e2e/tweaks/focus-trap.spec.ts`                                                                                                                                           | Test (Playwright)                    | browser DOM + focus assertions                                 | `frontend/tests/e2e/rtl-switching.spec.ts`                                                                                                                | role-match                                       |
| `frontend/tests/e2e/tweaks/redirect.spec.ts`                                                                                                                                             | Test (Playwright)                    | URL navigation assertion                                       | `frontend/tests/e2e/rtl-switching.spec.ts` (auth bypass shape)                                                                                            | role-match                                       |
| `frontend/src/i18n/label-parity.test.ts`                                                                                                                                                 | Test (unit)                          | JSON key diff                                                  | `frontend/tests/unit/design-system/fouc-bootstrap.test.ts` (file read + assert)                                                                           | partial                                          |
| `scripts/check-deleted-components.sh`                                                                                                                                                    | CI gate (bash)                       | grep exit codes                                                | no close analog                                                                                                                                           | none (minimal script)                            |
| `frontend/src/components/layout/SiteHeader.tsx`                                                                                                                                          | UI component (edit)                  | Inject gear trigger                                            | self (current file)                                                                                                                                       | self-reference                                   |
| `frontend/src/routes/_protected/themes.tsx`                                                                                                                                              | Route (rewrite as redirect)          | TanStack Router `beforeLoad`                                   | `frontend/src/routes/_protected/accessibility.tsx` (minimal `createFileRoute` shape)                                                                      | role-match                                       |
| `frontend/public/bootstrap.js`                                                                                                                                                           | Bootstrap config (edit)              | localStorage I/O, pre-paint DOM writes                         | self (current file)                                                                                                                                       | self-reference                                   |
| `frontend/src/i18n/index.ts`                                                                                                                                                             | Config (edit — one-line addition)    | i18next detection config                                       | self                                                                                                                                                      | self-reference                                   |
| `frontend/src/i18n/en/common.json` + `ar/common.json`                                                                                                                                    | i18n resource (edit — add keys)      | —                                                              | self                                                                                                                                                      | self-reference                                   |
| `frontend/src/routeTree.gen.ts`                                                                                                                                                          | Auto-generated (regen only)          | —                                                              | auto                                                                                                                                                      | N/A                                              |
| Deletion targets (`Themes.tsx`, `LanguageToggle.tsx`, `LanguageSwitcher.tsx` × 2, `theme-toggle.tsx`, `useTheme.ts`, `theme-provider.tsx`, `ThemeSelector.tsx`, `navigationData.ts:123`) | Cleanup                              | —                                                              | grep sweep                                                                                                                                                | N/A                                              |

## Pattern Assignments

### `frontend/src/components/tweaks/TweaksDrawer.tsx` (UI component)

**Primary analog:** `frontend/src/components/ui/heroui-modal.tsx` (HeroUI v3 compound wrapper already in codebase)
**Secondary analog:** `frontend/src/components/language-toggle/LanguageToggle.tsx` (segmented pill pattern for Mode/Density/Locale sections; RTL logical `end-/start-` usage)

**Imports shape to replicate** (from `heroui-modal.tsx` lines 12–16):

```tsx
import * as React from 'react'
import { X } from 'lucide-react'
import { Modal, Button, useOverlayState } from '@heroui/react'
import { cn } from '@/lib/utils'
import { useDomDirection } from '@/hooks/useDomDirection'
```

**For TweaksDrawer, substitute as:**

```tsx
import * as React from 'react'
import { Settings2, X } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, Slider, Switch } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useDesignDirection, useMode, useHue, useDensity } from '@/design-system/hooks'
import { useTweaksOpen } from './use-tweaks-open'
```

**Segmented-pill active/inactive pattern** (from `LanguageToggle.tsx` lines 29–48, the sliding background pattern is what the Mode/Density/Locale pills should replicate in simplified form):

```tsx
className={cn(
  'relative flex items-center rounded-lg transition-all duration-300',
  'bg-background border border-border',
  isRTL ? 'end-[3px]' : 'start-[3px]', // logical positioning
)}
```

**Divergences:**

- Drawer uses HeroUI `Drawer` compound (NOT `Modal`), with `DrawerContent`, `DrawerHeader`, `DrawerBody` per RESEARCH Pattern 1.
- `placement={isRTL ? 'left' : 'right'}` — dynamic per Pitfall 1 (HeroUI v3 `placement` is physical, not logical).
- `classNames={{ base: 'w-full sm:!w-[360px]' }}` for D-04 responsive width.
- Do NOT replicate `heroui-modal.tsx`'s Context wrapper — use the new `useTweaksOpen` hook instead (App-level disclosure, not component-local).
- Per UI-SPEC: 4 font-sizes only (11/13/14/16), 2 weights only (400/600), accent reserved for 7 specific roles.

---

### `frontend/src/components/tweaks/use-tweaks-open.ts` + `TweaksDisclosureProvider.tsx`

**Analog:** `frontend/src/contexts/ChatContext.tsx`

**Shape to replicate** (from `ChatContext.tsx` lines 12–50):

```tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface ChatContextValue extends ChatContextState {
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

export function ChatProvider({ children }: ChatProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const openChat = useCallback(() => setIsOpen(true), [])
  const closeChat = useCallback(() => setIsOpen(false), [])
  // ...
}
```

**Divergences:**

- Name: `TweaksDisclosureProvider` / `useTweaksOpen` (per RESEARCH Pattern 4).
- Slim: only `{ isOpen, open, close, toggle }` — no sessionId/lastActivity tracking.
- Throw descriptive error if hook used outside provider (not silent `undefined`), matching `useMode`/`useHue` pattern from `frontend/src/design-system/hooks/useMode.ts` lines 19–23:
  ```tsx
  if (!ctx) {
    throw new Error('useTweaksOpen must be used within a <TweaksDisclosureProvider>')
  }
  ```

---

### `frontend/src/design-system/directionDefaults.ts`

**Analog:** `frontend/src/design-system/tokens/densities.ts` (const record + pure-fn helper) — also visible in RESEARCH Example 1 `DIRECTION_DEFAULTS` block.

**Shape to replicate:**

```ts
import type { Direction, Mode, Hue } from './tokens/types'

export const DIRECTION_DEFAULTS = {
  chancery: { mode: 'light' as const, hue: 22 as Hue },
  situation: { mode: 'dark' as const, hue: 190 as Hue },
  ministerial: { mode: 'light' as const, hue: 158 as Hue },
  bureau: { mode: 'light' as const, hue: 32 as Hue },
} as const satisfies Record<Direction, { mode: Mode; hue: Hue }>

export function getDirectionDefaults(dir: Direction): { mode: Mode; hue: Hue } {
  return DIRECTION_DEFAULTS[dir]
}
```

**Divergences:**

- Matches D-16 map exactly. NOTE: Bureau hue in CONTEXT D-16 says `32°`; some upstream notes say `22°` — **use `32°` (CONTEXT D-16 is the source of truth)**.

---

### `frontend/src/routes/_protected/themes.tsx` (rewrite)

**Analog:** `frontend/src/routes/_protected/accessibility.tsx` (minimal 6-line `createFileRoute` shape)

**Current (to replace):**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import Themes from '../../pages/Themes'

export const Route = createFileRoute('/_protected/themes')({
  component: Themes,
})
```

**Target** (per RESEARCH Example 2):

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/themes')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
})
```

**Divergences:** No `component`, no page import. Delete `frontend/src/pages/Themes.tsx` as part of cleanup plan. Regenerate `routeTree.gen.ts` after edit (Vite plugin auto-handles on `pnpm dev`).

---

### `frontend/public/bootstrap.js` (edit)

**Analog:** self (lines 1–45 already in file).

**Current shape (EXISTING — 45 lines, ES5-safe IIFE):**

```js
;(function () {
  try {
    var dir = localStorage.getItem('id.dir') || 'chancery'
    var mode = localStorage.getItem('id.theme') || 'light'
    var hue = parseInt(localStorage.getItem('id.hue') || '22', 10)
    if (isNaN(hue)) hue = 22
    var density = localStorage.getItem('id.density') || 'regular'
    // ... palette lookup ...
    var r = document.documentElement
    r.classList.toggle('dark', mode === 'dark')
    r.setAttribute('data-direction', dir)
    r.setAttribute('data-density', density)
    // ... style.setProperty calls ...
  } catch (e) {
    /* silent */
  }
})()
```

**Extension pattern to add** (per RESEARCH Bootstrap.js Current Shape):

```js
// --- Phase 34 D-12: one-time i18nextLng → id.locale migrator ---
try {
  if (!localStorage.getItem('id.locale')) {
    var legacy = localStorage.getItem('i18nextLng')
    if (legacy === 'en' || legacy === 'ar') {
      localStorage.setItem('id.locale', legacy)
    }
    localStorage.removeItem('i18nextLng')
  }
} catch (e) {}

// --- Phase 34 D-14: apply classif + locale pre-paint ---
var classif = localStorage.getItem('id.classif') === 'true'
var locale = localStorage.getItem('id.locale') || 'en'
r.lang = locale
r.dir = locale === 'ar' ? 'rtl' : 'ltr'
r.dataset.classification = classif ? 'show' : 'hide'
```

**Divergences:**

- MUST stay ES5 (no arrows, no `const`/`let`, no template literals) — same constraint as existing file.
- Insert block BEFORE the existing `try/catch` close, OR add a new IIFE after — planner picks. Respect ~2 KB total-size budget from Phase 33 D-03.

---

### `frontend/src/i18n/index.ts` (edit — 2-line addition)

**Analog:** self (lines 434–437).

**Current:**

```ts
detection: {
  order: ['localStorage', 'cookie', 'htmlTag', 'navigator'],
  caches: ['localStorage', 'cookie'],
},
```

**Target (D-12):**

```ts
detection: {
  order: ['localStorage', 'cookie', 'htmlTag', 'navigator'],
  caches: ['localStorage', 'cookie'],
  lookupLocalStorage: 'id.locale',
  lookupCookie: 'id.locale',
},
```

**Divergences:** Zero — pure additive config. The existing `switchLanguage` helper + `languageChanged` listener (lines 463–477 per RESEARCH) already handle `<html dir/lang>` — no change needed there.

---

### `frontend/src/components/layout/SiteHeader.tsx` (edit)

**Analog:** self (existing structure with `LanguageToggle` block at line 69–72).

**Import changes:**

- Remove: `import { LanguageToggle } from '@/components/language-toggle/LanguageToggle'` (line 13)
- Add: `import { Settings2 } from 'lucide-react'` (augment existing lucide import cluster)
- Add: `import { useTweaksOpen } from '@/components/tweaks'`

**Replace block** (lines 69–72) following existing Tooltip-wrapped ghost-button shape at lines 39–57:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="size-11 min-h-11 min-w-11 text-muted-foreground hover:bg-accent/80 hover:text-foreground"
      onClick={() => toggleOpen()}
      aria-label={t('tweaks.open')}
      aria-expanded={isOpen}
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

**Divergences:**

- Size bumped from `size-9` (existing sidebar trigger) to `size-11` (44×44 minimum touch target mandated by D-05 + CLAUDE.md).
- Remove the outer `<div className="hidden md:flex">` — Tweaks gear is ALWAYS visible.
- `useSidebar()` pattern already present for the sidebar-toggle button — mirror it with `useTweaksOpen()`.

---

### `frontend/tests/bootstrap/migrator.test.ts` (NEW)

**Analog:** `frontend/tests/unit/design-system/fouc-bootstrap.test.ts` (only existing test that reads `bootstrap.js` text for verification)

**Shape to replicate** (from `fouc-bootstrap.test.ts` lines 14–34):

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const BOOTSTRAP_PATH = resolve(__dirname, '../../public/bootstrap.js')
const source = readFileSync(BOOTSTRAP_PATH, 'utf8')
```

**Divergences:**

- The existing test regex-scrapes palette literals against a TS source of truth. The new migrator test needs to **execute the IIFE in a jsdom sandbox** with a stubbed `localStorage`. Two viable harness approaches — planner picks one:
  1. **Script-tag injection in jsdom:** use jsdom's `runScripts: 'outside-only'`, inject a `<script>` element whose text is the bootstrap source, assert on `localStorage` state after.
  2. **vm.Script sandbox:** node's built-in `vm.createContext({ localStorage, document })` + `new vm.Script(source).runInContext(ctx)` — isolates execution from the vitest process.
- Add 3 test cases: (a) migrator runs only when canonical key absent, (b) junk legacy value is discarded (not copied), (c) no-op when both keys present.

---

### `frontend/src/components/tweaks/TweaksDrawer.test.tsx` + `persistence.test.tsx`

**Analog:** `frontend/tests/unit/design-system/buildTokens.test.ts` (vitest structure) + `heroui-modal.tsx` (MUI + RTL render shape)

**Shape from `buildTokens.test.ts` lines 1–22:**

```ts
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
// ... 4 × 2 × 3 × 3 matrix pattern from buildTokens
```

**For TweaksDrawer test coverage:**

- THEME-01 — render drawer, assert 6 section headings (Direction / Mode / Hue / Density / Classification / Locale) exist.
- THEME-02 — click each control, assert `localStorage.getItem('id.*')` matches.
- SC-4 — fireEvent keyDown `Escape`, assert drawer closes.
- Mount under `DesignProvider` + i18n provider (match how existing tests wrap).

**Divergences:** Uses `@testing-library/react` + `userEvent`; existing buildTokens test is pure function-level. New file is React component integration test.

---

### `frontend/tests/e2e/tweaks/focus-trap.spec.ts` + `redirect.spec.ts`

**Analog:** `frontend/tests/e2e/rtl-switching.spec.ts`

**Shape to replicate** (lines 1–15):

```ts
import { test, expect } from '@playwright/test'

async function authBypass(page: any) {
  await page.addInitScript(() => {
    const payload = { state: { user: {...}, isAuthenticated: true }, version: 0 }
    localStorage.setItem('auth-storage', JSON.stringify(payload))
  })
}

test('...', async ({ page }) => {
  await authBypass(page)
  await page.goto('/')
  // ...
})
```

**For focus-trap.spec.ts:**

- 2 test cases — LTR (default), RTL (pre-set `localStorage['id.locale']='ar'` via addInitScript BEFORE page.goto so bootstrap applies `dir="rtl"`).
- Open drawer, Tab through all controls, assert focus stays inside drawer.
- Press Escape, assert drawer closes AND focus returns to gear trigger.

**For redirect.spec.ts:**

- `page.goto('/themes')`; assert final URL is `/` and no `Themes` page rendered.

**Divergences:** Note — RESEARCH flags that `rtl-switching.spec.ts` uses `switch language` dropdown that's about to be deleted (LanguageSwitcher). This e2e MUST be updated in cleanup plan to use Tweaks drawer locale pill OR to seed `id.locale` via `addInitScript` directly.

---

### `frontend/src/i18n/label-parity.test.ts`

**Analog:** `frontend/tests/unit/design-system/fouc-bootstrap.test.ts` (JSON file read + iterate + assert)

**Shape:**

```ts
import enCommon from './en/common.json'
import arCommon from './ar/common.json'
import { describe, expect, it } from 'vitest'

describe('tweaks.* label parity', () => {
  const tweaksKeys = (obj: Record<string, unknown> /* flatten nested 'tweaks.*' leaves */) =>
    it('every EN tweaks.* key exists in AR', () => {
      const enKeys = tweaksKeys(enCommon)
      const arKeys = tweaksKeys(arCommon)
      expect(arKeys).toEqual(expect.arrayContaining(enKeys))
    })
})
```

---

### `scripts/check-deleted-components.sh` (NEW CI gate)

**No close analog.** Minimal bash script:

```bash
#!/usr/bin/env bash
set -euo pipefail
PATTERNS=(
  "from.*language-toggle/LanguageToggle"
  "from.*language-switcher/LanguageSwitcher"
  "from.*pages/Themes"
  "from.*hooks/useTheme"
  "from.*components/ui/theme-toggle"
  "to=[\"']/themes[\"']"
)
for p in "${PATTERNS[@]}"; do
  if grep -rn --include="*.ts" --include="*.tsx" -E "$p" frontend/src; then
    echo "FAIL: stale reference to deleted component: $p" >&2
    exit 1
  fi
done
echo "OK: zero references to deleted components"
```

---

## Shared Patterns

### Pattern S-1: HeroUI v3 Drawer compound (primary new primitive)

**Source:** RESEARCH Pattern 1 (verified via `heroui-modal.tsx` shape — same facade philosophy applies)
**Apply to:** `TweaksDrawer.tsx`

```tsx
import { Drawer, DrawerContent, DrawerHeader, DrawerBody } from '@heroui/react'

;<Drawer
  isOpen={isOpen}
  onOpenChange={(open) => !open && close()}
  placement={isRTL ? 'left' : 'right'} // physical — dynamic flip per Pitfall 1
  classNames={{ base: 'w-full sm:!w-[360px]' }}
>
  <DrawerContent>
    <DrawerHeader>{t('tweaks.title')}</DrawerHeader>
    <DrawerBody className="flex flex-col gap-6">{/* 6 sections */}</DrawerBody>
  </DrawerContent>
</Drawer>
```

### Pattern S-2: DesignProvider hook consumption

**Source:** `frontend/src/design-system/hooks/useMode.ts` lines 8–24 + `useHue.ts` lines 8–24
**Apply to:** `TweaksDrawer.tsx`, all 6 sections.

```tsx
import { useDesignDirection, useMode, useHue, useDensity } from '@/design-system/hooks'

const { direction, setDirection } = useDesignDirection()
const { mode, setMode } = useMode()
const { hue, setHue } = useHue()
const { density, setDensity } = useDensity()
```

**Note — function naming discrepancy:** existing hook is `useDesignDirection` (per Glob output), NOT `useDirection`. Planner must align imports with actual export names. Do NOT import from `@/hooks/useDirection` (that's the legacy RTL hook — different API).

### Pattern S-3: Safe localStorage read/write (for new id.classif, id.locale hooks)

**Source:** `frontend/src/design-system/DesignProvider.tsx` lines 56–72

```ts
const safeGetItem = (key: string): string | null => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
  } catch {
    return null
  }
}
const safeSetItem = (key: string, value: string): void => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
  } catch (err) {
    console.warn('...: failed to persist', key, err)
  }
}
```

**Apply to:** any new classif/locale setter logic. Follow the `id.*` key convention and swallow SecurityError (private browsing).

### Pattern S-4: RTL-logical styling (global rule)

**Source:** CLAUDE.md §Arabic RTL + `LanguageToggle.tsx` line 46 + `SiteHeader.tsx` line 53

- Use `ms-*`/`me-*`/`ps-*`/`pe-*`/`start-*`/`end-*` — never `ml-*`/`mr-*`/`pl-*`/`pr-*`/`left-*`/`right-*`.
- Use `text-start`/`text-end` — never `text-left`/`text-right` (per Pitfall 2).
- Tooltip side prop: `side={isRTL ? 'left' : 'right'}` (physical, mirrors existing SiteHeader).

### Pattern S-5: TanStack Router minimal route shape

**Source:** `frontend/src/routes/_protected/accessibility.tsx` (6-line minimal shape)

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/...')({ ... })
```

**Apply to:** `/themes` redirect rewrite.

### Pattern S-6: i18next namespace keys

**Source:** existing `frontend/src/i18n/en/common.json` (verified exists at that path)
**Apply to:** add `tweaks.*` nested object in BOTH `en/common.json` AND `ar/common.json` (mirrored keys). Full label text fixed by UI-SPEC §Copywriting Contract (port handoff `tweaks.jsx` `L` object verbatim).

### Pattern S-7: FOUC bootstrap test harness

**Source:** `frontend/tests/unit/design-system/fouc-bootstrap.test.ts` lines 14–34
**Apply to:** `frontend/tests/bootstrap/migrator.test.ts` (new).

## No Analog Found

| File                                  | Role                | Reason                                                                             |
| ------------------------------------- | ------------------- | ---------------------------------------------------------------------------------- |
| `scripts/check-deleted-components.sh` | CI gate bash script | No existing bash CI scripts in repo; trivial, write from RESEARCH content directly |

## Cleanup Plan — Deletion Targets (for planner's "cleanup" plan)

Per RESEARCH §Grep Audit (all verified line numbers):

| File                                                              | Action                                                                  |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `frontend/src/pages/Themes.tsx`                                   | Delete entirely                                                         |
| `frontend/src/components/language-toggle/LanguageToggle.tsx`      | Delete file + containing folder                                         |
| `frontend/src/components/language-switcher/LanguageSwitcher.tsx`  | Delete                                                                  |
| `frontend/src/components/language-switcher/language-switcher.tsx` | Delete (2nd lowercase copy — NEW grep finding)                          |
| `frontend/src/components/ui/theme-toggle.tsx`                     | Delete (audit call sites first: `grep -rn "ThemeToggle\|theme-toggle"`) |
| `frontend/src/hooks/useTheme.ts`                                  | Delete (Phase 33 D-11 shim)                                             |
| `frontend/src/components/theme-provider/theme-provider.tsx`       | Delete (shim file)                                                      |
| `frontend/src/components/theme-selector/ThemeSelector.tsx`        | Delete (Phase 33 cross-phase flag)                                      |
| `frontend/src/components/modern-nav/navigationData.ts` line 123   | Remove `/themes` nav entry                                              |

**Retrofit targets (replace `useTheme` with `useDesignDirection`/`useMode`):**

- `frontend/src/providers/design-compliance-provider.tsx` line 5,51
- `frontend/src/components/modern-nav/IconRail/IconRail.tsx` line 17,79
- `frontend/src/pages/settings/SettingsPage.tsx` line 11,83
- `frontend/src/components/responsive/{responsive-table,responsive-card,responsive-nav}.tsx` — update import path

**LanguageToggle render-site sweep:**

- `frontend/src/components/layout/SiteHeader.tsx` lines 13,71 (handled in primary plan)
- `frontend/src/components/layout/Header.tsx` lines 6,65 (audit dead-code status first)
- `frontend/src/components/layout/AppSidebar.tsx` lines 16,175
- `frontend/src/auth/LoginPageAceternity.tsx` lines 10,59
- `frontend/src/routes/_protected/responsive-demo.tsx` lines 7,37

## Metadata

**Analog search scope:** `frontend/src/components/**`, `frontend/src/design-system/**`, `frontend/src/contexts/**`, `frontend/src/routes/_protected/**`, `frontend/src/i18n/**`, `frontend/public/**`, `frontend/tests/**`
**Files scanned:** ~20 (guided by RESEARCH grep lines — no speculative search)
**Pattern extraction date:** 2026-04-20
