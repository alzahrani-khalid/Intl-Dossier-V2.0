/**
 * Elected Official Docs Tab
 * Shared tab stub -- renders documents linked to this dossier.
 */

import type { ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_protected/dossiers/elected-officials/$id/docs')({
  component: ElectedOfficialDocsTab,
})

function ElectedOfficialDocsTab(): ReactElement {
  const { t } = useTranslation('dossier-shell')

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t('tabs.docs')}</h2>
      <p className="text-sm text-muted-foreground">
        Documents linked to this elected official will appear here.
      </p>
    </div>
  )
}
