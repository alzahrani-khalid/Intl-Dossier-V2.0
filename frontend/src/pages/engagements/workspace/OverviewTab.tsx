/**
 * OverviewTab — Stub placeholder
 * Full implementation in Plan 03.
 */

import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

export default function OverviewTab(): ReactElement {
  const { t } = useTranslation('workspace')

  return (
    <div className="py-8 text-center text-muted-foreground">
      <p className="text-lg font-medium">{t('tabs.overview')}</p>
      <p className="text-sm mt-1">{t('header.loading')}</p>
    </div>
  )
}
