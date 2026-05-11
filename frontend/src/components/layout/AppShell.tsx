/**
 * AppShell.tsx — Phase 36 SHELL-04 implementation (Wave 2).
 *
 * Top-level shell wrapper for every `_protected` route. Composes three Wave-1
 * surfaces into a single responsive grid layout:
 *
 *   <Sidebar />           — 256px column at ≥1025px; overlay drawer below
 *   <Topbar />            — 56px horizontal row, 7 slots, hamburger below lg
 *   <ClassificationBar /> — chancery/situation banner OR ministerial/bureau chip
 *
 * Layout contract (UI-SPEC §"Layout Tokens — Grid" + §"Responsive Contracts"):
 *
 *   ≥1025px  → `lg:grid lg:grid-cols-[16rem_1fr] grid-rows-[auto_auto_1fr]`
 *              sidebar col 1 rows 1–3, topbar col 2 row 1, classif col 2 row 2,
 *              main col 2 row 3.
 *   ≤1024px  → single column, sidebar `lg:block hidden`, drawer takes over.
 *              Drawer panel is 280px wide.
 *   ≤640px   → drawer expands to 100vw (`max-sm:w-screen`), topbar wraps via
 *              `max-sm:flex-wrap` (Topbar owns this breakpoint behavior).
 *
 * Drawer contract (UI-SPEC §"Drawer states" + §"Interaction Contracts"):
 *   1. ESC            → HeroUI Drawer built-in (React Aria FocusScope)
 *   2. Backdrop click → HeroUI Drawer built-in
 *   3. Re-click hamburger → Topbar calls onOpenDrawer; we bridge through
 *                            `toggle` so the second click closes. (Wave 2
 *                            consumers keep the "onOpenDrawer" prop name but
 *                            the closure is a toggle, so idempotent.)
 *   4. Nav-item click → Event delegation on the drawer panel traps clicks on
 *                        `a[href]` descendants and calls `state.close()`.
 *   5. Route change   → `useEffect` on `useRouterState().location.pathname`.
 *
 * RTL contract (CLAUDE.md rule 1–5 + Pitfall 1 in 36-RESEARCH.md):
 *   - Drawer `placement` flips between `'left'` (LTR) and `'right'` (RTL) via
 *     `document.documentElement.dir`. HeroUI v3 Drawer treats placement as a
 *     PHYSICAL edge, so we have to compute the flip ourselves — same pattern
 *     as TweaksDrawer. We read `document.dir` instead of `i18n.dir()` because
 *     the test-env i18n mock omits `dir()`; LanguageProvider keeps the DOM and
 *     the i18n runtime in lockstep in production.
 *   - Zero physical-property Tailwind. Only logical utilities: `border-e`,
 *     `ms-auto`, `ps-*`/`pe-*`, etc.
 *   - Sidebar has `border-e` (inline-end) which flips automatically.
 *
 * Provider mount position (CONTEXT §"Integration Points"):
 *   <DesignProvider>
 *     <LanguageProvider>
 *       <TweaksDisclosureProvider>
 *         <AppShell>               ← THIS FILE — mounts INSIDE the stack
 *           <Outlet />
 *         </AppShell>
 *       </TweaksDisclosureProvider>
 *     </LanguageProvider>
 *   </DesignProvider>
 *
 * Deviation from 36-04 PLAN (Rule 3 — plan hook names are stale):
 *   - Plan referenced `useDirection` from '@/hooks/useDirection'. The real
 *     design-system hook is `useDesignDirection` — Phase 33 renamed it to
 *     avoid collision with the DOM-level `@/hooks/useDirection` which only
 *     reads `document.dir`. We consume `useDesignDirection` here so the
 *     Phase-33 direction (chancery/situation/…) flows into downstream
 *     children via React context, and `i18n.dir()` independently feeds the
 *     physical-placement flip.
 *
 * Pitfall 2 mitigation (FOUC/flash on direction switch):
 *   - The inner tree (Sidebar + Topbar + ClassificationBar + main) stays
 *     mounted across direction changes. `applyTokens()` in DesignProvider
 *     repaints CSS vars on `documentElement` without remounting React.
 *
 * Classification chrome sits outside <main> so the topbar and ribbon/chip stay
 * pinned while page content scrolls independently.
 */

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { useRouterState } from '@tanstack/react-router'
import { Drawer, useOverlayState } from '@heroui/react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { FullscreenLoader } from '@/components/signature-visuals'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ClassificationBar } from './ClassificationBar'

/**
 * Read the current document direction. We intentionally read `document.dir`
 * directly rather than calling `i18n.dir()` because the test-env i18n mock
 * (frontend/tests/setup.ts) only stubs `t` + `language` — `dir()` is absent.
 * In production, `LanguageProvider` keeps `document.dir` and the i18n runtime
 * in lockstep, so reading from the DOM is equivalent and test-safe.
 */
function readDocumentDir(): 'ltr' | 'rtl' {
  if (typeof document === 'undefined') return 'ltr'
  return document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'
}

export interface AppShellProps {
  children: ReactNode
}

/**
 * Read the persisted sidebar-expanded flag so desktop preference survives reloads.
 * We leave the localStorage key name identical to MainLayout's (`sidebar_state`)
 * so Phase-35 users experience no reset when Plan 36-05 swaps the mount point.
 */
function getStoredSidebarOpen(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem('sidebar_state') !== 'false'
  } catch {
    return true
  }
}

export function AppShell({ children }: AppShellProps): ReactElement {
  const { t } = useTranslation()
  const isRTL = readDocumentDir() === 'rtl'
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // Plain React boolean for drawer openness. We bridge it into HeroUI's
  // `UseOverlayStateReturn` shape via `useOverlayState({ isOpen, onOpenChange })`
  // — the same pattern the Phase-34 TweaksDrawer uses. This ensures ESC +
  // backdrop-click + focus-scope wiring all hit React-Aria's expected contract.
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const overlayState = useOverlayState({
    isOpen,
    onOpenChange: (open: boolean): void => {
      setIsOpen(open)
    },
  })

  // Preserve desktop preference — read once on mount, used only as a data
  // attribute for downstream styles (the actual grid column is fixed at 16rem).
  const storedOpenRef = useRef<boolean>(getStoredSidebarOpen())

  // Close trigger #5: route change. Compare pathname in a ref so the effect
  // only fires when it actually changes; first mount is a no-op because the
  // drawer starts closed.
  const prevPathRef = useRef<string>(pathname)
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname
      setIsOpen(false)
    }
  }, [pathname])

  // Close trigger #4: nav-item click inside the drawer. We delegate at the
  // panel root rather than wrapping each nav anchor — keeps Sidebar.tsx
  // single-responsibility (desktop + drawer both render the same markup).
  const handlePanelClick = useCallback((event: React.MouseEvent<HTMLDivElement>): void => {
    const target = event.target as HTMLElement
    if (target.closest('a[href]')) {
      setIsOpen(false)
    }
  }, [])

  // Topbar's `onOpenDrawer` is semantically a toggle — the plan calls for
  // "re-click hamburger closes" (Close trigger #3). We wire it to a local
  // toggler so the same button opens and closes without Topbar needing to
  // know drawer state.
  const handleToggleDrawer = useCallback((): void => {
    setIsOpen((prev) => !prev)
  }, [])

  return (
    <div
      className={cn(
        'app appshell relative min-h-screen w-full',
        'grid grid-rows-[auto_auto_1fr]',
        'lg:grid-cols-[16rem_1fr]',
        'bg-[var(--bg)] text-[var(--ink)]',
      )}
      data-sidebar-default={storedOpenRef.current ? 'open' : 'closed'}
    >
      {/* Desktop sidebar column — hidden below lg breakpoint; drawer replaces it. */}
      <aside
        className={cn(
          'sidebar appshell-aside',
          'hidden lg:block',
          'lg:col-start-1 lg:row-span-full',
          'border-e border-[var(--line)]',
          'bg-[var(--sidebar-bg)]',
        )}
      >
        <Sidebar />
      </aside>

      {/* Topbar — row 1 of main column on desktop, row 1 full-width on mobile. */}
      <div className="appshell-top lg:col-start-2 lg:row-start-1">
        <Topbar onOpenDrawer={handleToggleDrawer} />
      </div>

      {/* Classification chrome — row 2 of main column. */}
      <div className="appshell-classif relative lg:col-start-2 lg:row-start-2">
        <ClassificationBar />
      </div>

      {/* Main content — row 3 of main column. `overflow-y-auto` keeps the
          topbar + classif pinned while page content scrolls independently.
          tabIndex={0} + aria-label make the scroll region keyboard-reachable
          and announceable (closes axe `scrollable-region-focusable` violation
          on every _protected route — Plan 43-11). */}
      <main
        tabIndex={0}
        aria-label={t('shell.main.region')}
        className={cn(
          'appshell-main',
          'main',
          'lg:col-start-2 lg:row-start-3',
          'overflow-y-auto',
          'bg-[var(--bg)]',
          'focus-visible:outline-2',
          'focus-visible:outline-offset-2',
          'focus-visible:outline-[var(--accent)]',
        )}
      >
        <Suspense fallback={<FullscreenLoader open />}>{children}</Suspense>
      </main>

      {/* Mobile overlay drawer — only engages below lg. HeroUI Drawer renders
          into a portal, so the `lg:hidden` guard goes on its root class via
          `classNames.wrapper` + `classNames.base`. Placement flips between
          'left' (LTR) and 'right' (RTL) via `document.dir` (Pitfall 1). */}
      <Drawer state={overlayState}>
        <Drawer.Backdrop>
          <Drawer.Content placement={isRTL ? 'right' : 'left'}>
            <Drawer.Dialog
              aria-label={t('shell.menu.open')}
              className={cn('w-[280px] max-sm:w-screen lg:hidden p-0')}
            >
              <Drawer.Body className="p-0">
                <div
                  className="appshell-drawer-panel h-full w-full"
                  onClick={handlePanelClick}
                  role="presentation"
                >
                  <Sidebar />
                </div>
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </div>
  )
}
