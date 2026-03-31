/**
 * CalendarTab — Stub placeholder
 * Full implementation in Plan 05.
 */

import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

export default function CalendarTab(): ReactElement {
  const { t } = useTranslation('workspace')

  return (
    <div className="py-8 text-center text-muted-foreground">
      <p className="text-lg font-medium">{t('tabs.calendar')}</p>
      <p className="text-sm mt-1">{t('empty.calendar.heading')}</p>
    </div>
  )
}
