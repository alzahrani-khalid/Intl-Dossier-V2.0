/**
 * SignalsQueue — the keyboard-triage orchestrator (Phase 69, Wave 3, D-01/D-02).
 *
 * One component path, two views: rendered globally under /intelligence (no dossierId)
 * and inside each dossier's Signals tab (with dossierId). Wires useSignals (clearance-
 * gated read), useUpdateSignalStatus (acknowledge/dismiss), and useSignalKeyboardTriage
 * (j/k/a/d/e on the <ul> container). The empty state uses generic copy only — it never
 * mentions clearance or hidden items (indistinguishable-empty, D-09).
 *
 * @module components/signals/SignalsQueue
 */

import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDirection } from '@/hooks/useDirection'
import { useSignalKeyboardTriage } from '@/hooks/useSignalKeyboardTriage'
import {
  useSignals,
  useUpdateSignalStatus,
  type Signal,
  type SignalFilters,
  type SignalStatus,
} from '@/domains/signals'
import { SignalRow } from './SignalRow'
import { CaptureSignalForm } from './CaptureSignalForm'
import { EscalateSignalDialog } from './EscalateSignalDialog'

interface SignalsQueueProps {
  dossierId?: string
}

type FilterValue = SignalStatus | 'all'

const FILTER_VALUES: FilterValue[] = ['all', 'new', 'acknowledged', 'dismissed', 'escalated']

export function SignalsQueue({ dossierId }: SignalsQueueProps): React.ReactElement {
  const { t } = useTranslation('intelligence-signals')
  const { isRTL } = useDirection()

  const [filters, setFilters] = useState<SignalFilters>({ status: 'new' })
  const activeFilter: FilterValue = filters.status ?? 'all'

  const containerRef = useRef<HTMLUListElement>(null)
  const [escalateTarget, setEscalateTarget] = useState<Signal | null>(null)
  const [captureOpen, setCaptureOpen] = useState(false)

  const { data: signals = [], isLoading, isError } = useSignals({ ...filters, dossierId })
  const updateStatus = useUpdateSignalStatus()

  const { focusedIndex, setFocusedIndex } = useSignalKeyboardTriage({
    signals,
    containerRef,
    // Suppress triage keys while the escalate dialog is open so `e` can't re-fire over it.
    enabled: escalateTarget === null,
    onAcknowledge: (id) => {
      if (id) updateStatus.mutate({ id, status: 'acknowledged' })
    },
    onDismiss: (id) => {
      if (id) updateStatus.mutate({ id, status: 'dismissed' })
    },
    onEscalate: (signal) => setEscalateTarget(signal),
  })

  const handleFilter = (value: FilterValue): void => {
    setFilters(value === 'all' ? {} : { status: value })
  }

  const emptyHeading =
    dossierId !== undefined
      ? t('queue.emptyDossier')
      : activeFilter === 'dismissed'
        ? t('queue.emptyDismissed')
        : activeFilter === 'escalated'
          ? t('queue.emptyEscalated')
          : t('queue.emptyState.heading')

  return (
    <div>
      {/* Toolbar: filter pills + count + capture */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {FILTER_VALUES.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={activeFilter === value ? 'default' : 'outline'}
            onClick={() => handleFilter(value)}
          >
            {t(`filters.${value}`)}
          </Button>
        ))}
        <span className="[font-size:var(--t-meta)] text-ink-mute ms-2">
          {t('queue.count', { count: signals.length })}
        </span>
        <Button className="ms-auto" size="sm" onClick={() => setCaptureOpen(true)}>
          <Plus className="h-4 w-4 me-2" />
          {t('actions.capture')}
        </Button>
      </div>

      {/* Keyboard hint strip (decorative — real behavior is the keydown handler) */}
      <p
        aria-hidden="true"
        className="[font-size:var(--t-mono-small)] font-mono text-ink-faint mb-4"
      >
        {t('keyboard.hint')}
      </p>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse p-4">
              <div className="mb-3 h-6 w-3/4 rounded bg-line-soft" />
              <div className="mb-2 h-4 w-full rounded bg-line-soft" />
              <div className="h-4 w-2/3 rounded bg-line-soft" />
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && isError && (
        <Card className="p-4 sm:p-8 text-center" role="alert">
          <p className="text-sm text-danger">{t('queue.errorState')}</p>
        </Card>
      )}

      {/* Empty state — generic copy only, never mentions clearance (D-09) */}
      {!isLoading && !isError && signals.length === 0 && (
        <Card className="p-4 sm:p-8 text-center">
          <p className="text-sm font-medium text-ink">{emptyHeading}</p>
          {dossierId === undefined &&
            activeFilter !== 'dismissed' &&
            activeFilter !== 'escalated' && (
              <p className="text-sm text-ink-mute mt-1">{t('queue.emptyState.body')}</p>
            )}
        </Card>
      )}

      {/* Signal list */}
      {!isLoading && !isError && signals.length > 0 && (
        <ul
          role="list"
          ref={containerRef}
          tabIndex={0}
          dir={isRTL ? 'rtl' : 'ltr'}
          aria-activedescendant={signals[focusedIndex]?.id}
          className="rounded-sm border border-line bg-surface outline-none"
        >
          {signals.map((sig, idx) => (
            <SignalRow
              key={sig.id}
              signal={sig}
              isFocused={idx === focusedIndex}
              isRTL={isRTL}
              t={t}
              onClick={() => setFocusedIndex(idx)}
            />
          ))}
        </ul>
      )}

      {/* Escalate dialog — pre-filled from the focused signal (D-10). The hook's
          Step 3 flips status='escalated', so onSuccess only closes the dialog. */}
      <EscalateSignalDialog
        signal={escalateTarget}
        isOpen={escalateTarget !== null}
        onClose={() => setEscalateTarget(null)}
        onSuccess={() => setEscalateTarget(null)}
      />

      {/* Capture drawer */}
      <CaptureSignalForm isOpen={captureOpen} onClose={() => setCaptureOpen(false)} />
    </div>
  )
}
