/**
 * EmptyAttention — Green success banner for empty attention zone
 * Phase 10: Operations Hub Dashboard
 *
 * Shows "All clear" message when no items need attention (D-03).
 */

import { useTranslation } from 'react-i18next'
import { CircleCheck } from 'lucide-react'

export function EmptyAttention(): React.ReactElement {
  const { t } = useTranslation('operations-hub')

  return (
    <div className="flex items-center gap-2 border border-success/50 bg-success/5 rounded-lg p-3 sm:p-4">
      <CircleCheck className="text-success shrink-0" size={20} />
      <span className="text-success font-semibold text-sm">
        {t('zones.attention.empty')}
      </span>
    </div>
  )
}
