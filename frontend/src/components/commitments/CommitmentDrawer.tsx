/**
 * CommitmentDrawer — globally-mounted wrapper that opens CommitmentDetailDrawer
 * in place from a `commitment` URL search param (see useCommitmentDrawer).
 *
 * Phase 87 Plan 09 — F23 peek counter + chevrons over visible commitment cards
 * registered by WorkBoard (param-agnostic usePeekPaging, replace:true paging).
 */

import { type ReactElement, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useCommitmentDrawer } from '@/hooks/useCommitmentDrawer'
import { usePeekPaging } from '@/hooks/usePeekPaging'
import { usePeekStore } from '@/store/peekStore'
import { CommitmentDetailDrawer } from './CommitmentDetailDrawer'

export function CommitmentDrawer(): ReactElement {
  const { open, commitmentId, closeCommitment } = useCommitmentDrawer()
  const navigate = useNavigate()
  const { t } = useTranslation('commitment-drawer')

  const navigateToCommitment = useCallback(
    (id: string): void => {
      void navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          commitment: id,
        }),
        replace: true,
      } as unknown as Parameters<typeof navigate>[0])
    },
    [navigate],
  )

  const peek = usePeekPaging(commitmentId ?? undefined, navigateToCommitment)

  const isRegistered = usePeekStore((s) =>
    commitmentId != null ? s.positionOf(commitmentId) !== null : false,
  )

  useEffect(() => {
    if (!open) usePeekStore.getState().clear()
  }, [open])

  const showPeek = open && isRegistered && peek.position != null

  const peekChrome =
    showPeek && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed top-3 end-14 z-[60] flex items-center gap-1"
            data-testid="commitment-drawer-peek"
          >
            <span
              dir="ltr"
              className="font-mono text-sm text-ink-mute"
              data-testid="commitment-drawer-peek-counter"
            >
              {t('peek.counter', { position: peek.position, total: peek.total })}
            </span>
            <button
              type="button"
              className="btn-ghost"
              style={{ minBlockSize: 44, minInlineSize: 44 }}
              onClick={peek.goPrev}
              disabled={!peek.canPrev}
              aria-disabled={!peek.canPrev}
              aria-label={t('peek.prev')}
              data-testid="commitment-drawer-peek-prev"
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              className="btn-ghost"
              style={{ minBlockSize: 44, minInlineSize: 44 }}
              onClick={peek.goNext}
              disabled={!peek.canNext}
              aria-disabled={!peek.canNext}
              aria-label={t('peek.next')}
              data-testid="commitment-drawer-peek-next"
            >
              <ChevronDown size={14} />
            </button>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <CommitmentDetailDrawer
        commitmentId={commitmentId}
        open={open}
        onOpenChange={(next): void => {
          if (!next) {
            closeCommitment()
          }
        }}
      />
      {peekChrome}
    </>
  )
}
