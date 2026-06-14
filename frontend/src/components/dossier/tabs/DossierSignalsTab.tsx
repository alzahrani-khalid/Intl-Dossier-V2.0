/**
 * DossierSignalsTab — per-dossier Signals tab (Phase 69, Wave 4, D-01).
 *
 * A thin wrapper: it delegates ALL rendering, filtering, keyboard triage, capture,
 * and escalate behavior to SignalsQueue by passing the dossierId through. This keeps
 * the one-component-path decision (D-01) — the global /intelligence queue and the
 * per-dossier tab are the SAME SignalsQueue, filtered by dossierId. The clearance
 * gate (read_signals INVOKER RPC) still applies per dossier (SIGNAL-04).
 *
 * @module components/dossier/tabs/DossierSignalsTab
 */

import type { ReactElement } from 'react'
import { useDirection } from '@/hooks/useDirection'
import { SignalsQueue } from '@/components/signals/SignalsQueue'

interface DossierSignalsTabProps {
  dossierId: string
}

export function DossierSignalsTab({ dossierId }: DossierSignalsTabProps): ReactElement {
  const { isRTL } = useDirection()

  return (
    <div className="p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <SignalsQueue dossierId={dossierId} />
    </div>
  )
}
