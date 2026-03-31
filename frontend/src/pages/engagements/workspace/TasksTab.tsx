/**
 * TasksTab — Stub placeholder
 * Full implementation in Plan 04.
 */

import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

export default function TasksTab(): ReactElement {
  const { t } = useTranslation('workspace')

  return (
    <div className="py-8 text-center text-muted-foreground">
      <p className="text-lg font-medium">{t('tabs.tasks')}</p>
      <p className="text-sm mt-1">{t('empty.tasks.heading')}</p>
    </div>
  )
}
