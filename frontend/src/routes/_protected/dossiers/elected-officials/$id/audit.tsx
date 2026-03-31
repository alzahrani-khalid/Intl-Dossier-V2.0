/**
 * Elected Official Audit Tab
 * Shared tab stub -- renders audit log for this dossier.
 */

import type { ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute(
  '/_protected/dossiers/elected-officials/$id/audit',
)({
  component: ElectedOfficialAuditTab,
})

function ElectedOfficialAuditTab(): ReactElement {
  const { t } = useTranslation('dossier-shell')

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t('tabs.audit')}</h2>
      <p className="text-sm text-muted-foreground">
        Audit log for this elected official will appear here.
      </p>
    </div>
  )
}
