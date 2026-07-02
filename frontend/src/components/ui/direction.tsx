import { useLayoutEffect, useSyncExternalStore, type ReactNode, type ReactElement } from 'react'
import { DirectionProvider as RadixDirectionProvider } from '@radix-ui/react-direction'
import i18n, { getDirection } from '@/i18n'

/**
 * DirectionProvider — the single runtime direction owner (RTLB-01).
 *
 * Derives `dir` from `i18n.language`, performs the only runtime `<html dir/lang>`
 * writes, and bridges the same value into Radix's direction context so every
 * Radix portal (Popover/Tooltip/Dropdown/Sheet/dossier drawer) flips in lockstep
 * with the document. The DOM write (useLayoutEffect) and the Radix context update
 * (render) land in the SAME React commit, so document and portals agree before
 * the next paint — no dual-mechanism double-flip (RESEARCH Pitfall 1/2).
 *
 * The pre-paint set in `public/bootstrap.js` (first frame) and the
 * `ThemeErrorBoundary` crash-fallback (post-crash only) are the sole whitelisted
 * non-owner writers. Mounted once in App.tsx above the router and every portal
 * spawner. This module publishes only `DirectionProvider`; the app-facing
 * direction hook stays `@/hooks/useDirection` (no direction hook is re-emitted
 * here — that avoids the three-hooks naming collision).
 */
function subscribe(onStoreChange: () => void): () => void {
  i18n.on('languageChanged', onStoreChange)
  return () => i18n.off('languageChanged', onStoreChange)
}

export function DirectionProvider({ children }: { children: ReactNode }): ReactElement {
  const language = useSyncExternalStore(subscribe, () => i18n.language)
  const dir = getDirection(language)

  // Same commit as the Radix context update → document + portals flip before paint.
  useLayoutEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = language
  }, [dir, language])

  return <RadixDirectionProvider dir={dir}>{children}</RadixDirectionProvider>
}
