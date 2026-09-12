/**
 * AppShell.tsx — Phase 36 SHELL-04 implementation (Wave 2).
 *
 * Top-level shell wrapper for every `_protected` route. Composes three Wave-1
 * surfaces into a single responsive grid layout:
 *
 *   <Sidebar />           — 256px column at ≥1025px; overlay drawer below
 *   <Topbar />            — 56px horizontal row, 7 slots, hamburger below lg
 *   <ClassificationBar /> — Linear classification chip (accent dot + label)
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
 *   - Drawer `placement` flips between `'left'` (LTR) and `'right'` (RTL). HeroUI
 *     v3 Drawer treats placement as a PHYSICAL edge, so we compute the flip
 *     ourselves — same pattern as TweaksDrawer. Direction comes from the Radix
 *     direction context supplied by `ui/direction.tsx` DirectionProvider (the
 *     single direction owner), read via `useDirection()`. That context is set
 *     during the owner's render, so it is same-commit fresh — a render-time
 *     `document.dir` read would be one frame stale now that the DOM write lives
 *     in the owner's layout effect. It is test-safe because Radix `useDirection()`
 *     defaults to `'ltr'` without a provider and the RTL-matrix tests wrap the
 *     shell in `RadixDirectionProvider`.
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
 *     Phase-33 direction (Linear) flows into downstream
 *     children via React context, and the Radix direction context
 *     (`ui/direction.tsx`) independently feeds the physical-placement flip.
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
import { useDirection as useRadixDirection } from '@radix-ui/react-direction'

import { cn } from '@/lib/utils'
import { isSettingsPath } from '@/lib/settings-route'
import { FullscreenLoader } from '@/components/signature-visuals'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ClassificationBar } from './ClassificationBar'

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
  // Same-commit fresh: the Radix direction context is supplied by the single
  // direction owner (ui/direction.tsx DirectionProvider). Defaults to 'ltr'
  // without a provider (test-safe).
  const isRTL = useRadixDirection() === 'rtl'
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  // F18 (D-85-03) + NAV-02 (Phase 97, D-04): the settings subtree mounts a
  // single 240px nav column at the ROUTE-LAYOUT level
  // (`routes/_protected/settings.tsx`) — for the index and for every child
  // alike — so the global Sidebar is suppressed across the whole subtree to
  // leave exactly one nav column. Both Sidebar mounts (desktop aside + mobile
  // drawer) and the collapsed 0px desktop rail gate off this one flag, and the
  // flag itself is the shared `isSettingsPath` predicate rather than a local
  // prefix test. This comment previously said SettingsLayout rendered its own
  // column, which was FALSE for every child route: the sidebar was suppressed
  // by prefix while the column was mounted only on an exact match, so children
  // got no navigation at all.
  const isSettingsRoute = isSettingsPath(pathname)

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
        isSettingsRoute ? 'lg:grid-cols-[0px_1fr]' : 'lg:grid-cols-[16rem_1fr]',
        'bg-[var(--bg)] text-[var(--ink)]',
      )}
      data-sidebar-default={storedOpenRef.current ? 'open' : 'closed'}
    >
      {/* Desktop sidebar column — hidden below lg breakpoint; drawer replaces it.
          Suppressed entirely on /settings (F18) so the settings sub-nav is the
          single nav column. */}
      {!isSettingsRoute && (
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
      )}

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
          'left' (LTR) and 'right' (RTL) via `document.dir` (Pitfall 1).
          Not mounted on /settings (F18) — the global Sidebar never appears
          there, and no empty drawer is reachable. */}
      {!isSettingsRoute && (
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
      )}
    </div>
  )
}
