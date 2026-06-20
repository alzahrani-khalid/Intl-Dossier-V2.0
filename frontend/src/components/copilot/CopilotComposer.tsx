/**
 * CopilotComposer — the pinned bottom-edge input (textarea + send + stop).
 *
 * Built on assistant-ui's ComposerPrimitive. The textarea is --t-body on --surface
 * with a 1px solid --line edge + accent focus ring; Send is `.btn-primary` (its fill
 * resolves from --accent — the resting-state accent control). The Stop control shows
 * ONLY while a response is streaming (ComposerPrimitive.Cancel inside ThreadPrimitive.If
 * running). Padding is logical (ps/pe via the .copilot-composer rule). Icon controls
 * declare aria-labels from the copilot namespace.
 *
 * The send arrow flips under RTL (rotate-180) so it points toward the inline-end in
 * both directions.
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Square } from 'lucide-react'
import { ComposerPrimitive, ThreadPrimitive } from '@assistant-ui/react'
import { useDirection } from '@/hooks/useDirection'

export function CopilotComposer(): ReactElement {
  const { t } = useTranslation('copilot')
  const { isRTL } = useDirection()

  return (
    <ComposerPrimitive.Root className="copilot-composer">
      <ComposerPrimitive.Input
        className="copilot-composer__input"
        placeholder={t('composer.placeholder')}
        aria-label={t('aria.sendMessage')}
        rows={1}
        autoFocus
        submitOnEnter
      />

      {/* Send — only when NOT running. .btn-primary draws its fill from --accent. */}
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <button
            type="button"
            className="btn-primary inline-flex h-9 min-h-11 w-9 min-w-11 items-center justify-center rounded-[var(--radius-sm)]"
            aria-label={t('aria.sendMessage')}
          >
            <Send size={16} className={isRTL ? 'rotate-180' : undefined} />
          </button>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>

      {/* Stop — only while streaming. */}
      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <button
            type="button"
            className="btn-ghost inline-flex h-9 min-h-11 w-9 min-w-11 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--line)]"
            aria-label={t('aria.stopStream')}
          >
            <Square size={14} />
          </button>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </ComposerPrimitive.Root>
  )
}
