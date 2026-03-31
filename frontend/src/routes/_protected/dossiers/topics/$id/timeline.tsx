/**
 * Topic Timeline Tab Route
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_protected/dossiers/topics/$id/timeline')({
  component: TopicTimelineRoute,
})

function TopicTimelineRoute(): ReactElement {
  const { t } = useTranslation('dossier-shell')

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-muted-foreground text-sm">
        {t('tabs.timeline')} — {t('emptyState.comingSoon', { defaultValue: 'Content coming soon' })}
      </p>
    </div>
  )
}
