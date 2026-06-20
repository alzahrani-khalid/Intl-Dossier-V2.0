/**
 * DossierAnalyzeButton — the per-dossier "Analyze" affordance (D-04, third of the
 * three Analyze entry points; GRAPH-02).
 *
 * A secondary (`.btn-ghost`, NOT `.btn-primary` — UI-SPEC surfacing contract) action
 * that deep-links to the Network panel's Analyze mode with the dossier entity
 * pre-filled: `/relationships/graph?dossierId=<id>&mode=analyze` (D-02). The query
 * picker in the panel completes the template selection.
 *
 * Token-bound chrome (`.btn-ghost` from the prototype), logical props, RTL-safe
 * (Tajawal applies via the global RTL `.btn-*` rule; the Sparkles glyph is
 * non-directional so it is NOT flipped). Mirrors DrawerCtaRow's ghost-button idiom.
 *
 * Only the (already-accessible) anchor dossier id travels in the URL — the result
 * payload is gated server-side by the caller's JWT (threat T-71-05-INFO-DEEPLINK).
 */
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'

export interface DossierAnalyzeButtonProps {
  /** The dossier UUID to pre-fill as the analytic-query entity. */
  dossierId: string
  /** Optional extra class names appended to the `.btn-ghost` base. */
  className?: string
}

const MIN_TOUCH_TARGET = 44

export function DossierAnalyzeButton({
  dossierId,
  className,
}: DossierAnalyzeButtonProps): React.JSX.Element {
  const { t } = useTranslation('graph')
  const navigate = useNavigate()

  const handleAnalyze = (): void => {
    const params = new URLSearchParams({ dossierId, mode: 'analyze' })
    navigate({ to: `/relationships/graph?${params.toString()}` as string & {} })
  }

  return (
    <button
      type="button"
      className={`btn-ghost inline-flex items-center gap-1${className != null ? ` ${className}` : ''}`}
      style={{ minBlockSize: MIN_TOUCH_TARGET }}
      onClick={handleAnalyze}
      data-testid="dossier-analyze-button"
    >
      <Sparkles size={14} />
      <span>{t('analyze.mode')}</span>
    </button>
  )
}
