/**
 * SignalStatusBadge — status pill for a signal (Phase 69, Wave 3).
 *
 * Mirrors the ClassificationBadge config-map pattern from IntelligencePage.tsx, but
 * resolves all colors to IntelDossier design tokens (no raw hex, no Tailwind color
 * literals). Soft backgrounds that are not exposed as @theme utilities are applied via
 * arbitrary `bg-[var(--*-soft)]` so they resolve to the real design-system soft tokens.
 *
 * @module components/signals/SignalStatusBadge
 */

import { useTranslation } from 'react-i18next'
import type { SignalStatus } from '@/domains/signals'

const STATUS_CONFIGS: Record<SignalStatus, string> = {
  new: 'bg-[var(--info-soft)] text-info',
  acknowledged: 'bg-line-soft text-ink-mute',
  dismissed: 'bg-line-soft text-ink-faint',
  escalated: 'bg-accent-soft text-accent-ink',
}

interface SignalStatusBadgeProps {
  status: SignalStatus
}

export function SignalStatusBadge({ status }: SignalStatusBadgeProps): React.ReactElement {
  const { t } = useTranslation('intelligence-signals')

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIGS[status]}`}
    >
      {t(`status.${status}`)}
    </span>
  )
}
