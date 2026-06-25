/**
 * CopilotDrawer — the responsive copilot shell (AGENT-01, D-04).
 *
 * Mirrors DossierDrawer: a Radix Sheet side="right" at `w-[min(720px,92vw)]` on the
 * desktop (the `.drawer` class carries `--shadow-lg` — the ONLY allowed shadow), and a
 * mobile BottomSheet (showHandle, snapPreset large) at ≤768px. ONE data path — both
 * render the same `<CopilotSurface/>`; only the chrome differs per breakpoint (D-04).
 *
 * The mobile shadow-override + breakpoint switch reuse the DossierDrawer
 * useSyncExternalStore matchMedia('(max-width: 768px)') idiom (jsdom-safe: falls back to
 * desktop when matchMedia is unavailable, so unit/SSR render the Sheet).
 *
 * The drawer container is dir="rtl" in Arabic so Tajawal applies (copilot-theme.css)
 * and the message/composer rows mirror via logical properties — no physical left/right.
 *
 * This component is DYNAMIC-IMPORTED at the _protected mount so the assistant-ui +
 * markdown weight stays out of the entry chunk (Bundle Size ceiling — threat T-72-SC).
 *
 * The error surface is the ErrorBoundary at the mount (a render fault in the
 * conversational surface shows the neutral role="alert" copy); a transport/stream
 * failure surfaces inside assistant-ui's own error part. Both stay indistinguishable-empty.
 */
import type { ReactElement } from 'react'
import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet'
import { useDirection } from '@/hooks/useDirection'
import { useCopilotDrawer } from './useCopilotDrawer'
import { CopilotSurface } from './CopilotSurface'
import './copilot-theme.css'

/**
 * Override the drawer's default open-focus (which would land on the close / header
 * toggle button) and put the caret in the composer so the analyst can type at once.
 * preventDefault must run synchronously to stop Radix; the focus is deferred a frame so
 * the composer is mounted. Scoped to the opened content node (no global query churn).
 */
function focusComposerOnOpen(event: Event): void {
  event.preventDefault()
  const content = event.currentTarget as HTMLElement | null
  requestAnimationFrame(() => {
    const input = content?.querySelector<HTMLTextAreaElement>('.copilot-composer__input') ?? null
    input?.focus()
  })
}

/**
 * jsdom-safe matchMedia subscription (mirrors DossierDrawer). Returns true ≤768px so the
 * mobile BottomSheet renders; falls back to desktop where matchMedia is missing.
 */
function useIsMobileNarrow(): boolean {
  return useSyncExternalStore(
    (cb): (() => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return (): void => {}
      }
      const mq = window.matchMedia('(max-width: 768px)')
      mq.addEventListener('change', cb)
      return (): void => mq.removeEventListener('change', cb)
    },
    (): boolean => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return false
      }
      return window.matchMedia('(max-width: 768px)').matches
    },
    (): boolean => false, // SSR fallback — desktop default
  )
}

export function CopilotDrawer(): ReactElement | null {
  const { open, context, closeCopilot } = useCopilotDrawer()
  const { t } = useTranslation('copilot')
  const { isRTL } = useDirection()
  const isMobileNarrow = useIsMobileNarrow()

  if (!open) return null

  // Mobile (≤768px): the same conversational surface inside a BottomSheet. One data path.
  if (isMobileNarrow) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(v) => {
          if (!v) closeCopilot()
        }}
        snapPreset="large"
      >
        <BottomSheetContent
          showHandle
          padding="none"
          className="copilot-mobile-sheet"
          dir={isRTL ? 'rtl' : 'ltr'}
          aria-label={t('title')}
          onOpenAutoFocus={focusComposerOnOpen}
        >
          <CopilotSurface context={context} />
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  // Desktop: the 720px right slide-over (mirrors DossierDrawer width + shadow class).
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) closeCopilot()
      }}
    >
      <SheetContent
        side="right"
        accessibleTitle={t('title')}
        dir={isRTL ? 'rtl' : 'ltr'}
        className="drawer flex flex-col w-[min(720px,92vw)] max-md:w-screen max-md:border-0 max-md:shadow-none p-0 gap-0"
        onOpenAutoFocus={focusComposerOnOpen}
      >
        <CopilotSurface context={context} />
      </SheetContent>
    </Sheet>
  )
}

export default CopilotDrawer
