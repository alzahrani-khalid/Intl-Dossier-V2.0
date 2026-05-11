/**
 * TweaksDisclosureProvider — Phase 34 Plan 34-04.
 *
 * Owns the open/close state of the Tweaks Drawer. Exposed via `useTweaksOpen`.
 * Pair consumers:
 *   - `<TweaksDrawer />` (this plan) — reads `isOpen`/`close`, mounts the drawer
 *   - SiteHeader gear trigger (Plan 34-06) — reads `toggle`, drives the trigger
 *
 * Keeps state deliberately minimal (no ref/focus-return concerns — HeroUI v3's
 * DialogTrigger + React Aria `<Modal>` handle focus return automatically when
 * the trigger Button is rendered inside the drawer's state-owning subtree).
 */

import { createContext, useCallback, useMemo, useState, type ReactElement, type ReactNode } from 'react'

export interface TweaksDisclosure {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const TweaksDisclosureContext = createContext<TweaksDisclosure | null>(null)

export function TweaksDisclosureProvider({ children }: { children: ReactNode }): ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const open = useCallback((): void => setIsOpen(true), [])
  const close = useCallback((): void => setIsOpen(false), [])
  const toggle = useCallback((): void => setIsOpen((v) => !v), [])

  const value = useMemo<TweaksDisclosure>(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  )

  return (
    <TweaksDisclosureContext.Provider value={value}>{children}</TweaksDisclosureContext.Provider>
  )
}
