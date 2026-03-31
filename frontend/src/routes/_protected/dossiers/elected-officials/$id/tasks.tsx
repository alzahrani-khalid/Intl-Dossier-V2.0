/**
 * Elected Official Tasks Tab
 * Shared tab stub -- renders tasks linked to this dossier.
 */

import type { ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute(
  '/_protected/dossiers/elected-officials/$id/tasks',
)({
  component: ElectedOfficialTasksTab,
})

function ElectedOfficialTasksTab(): ReactElement {
  const { t } = useTranslation('dossier-shell')

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t('tabs.tasks')}</h2>
      <p className="text-sm text-muted-foreground">
        Tasks linked to this elected official will appear here.
      </p>
    </div>
  )
}
