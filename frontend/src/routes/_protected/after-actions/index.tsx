import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useAfterActionsAll } from '@/hooks/useAfterAction'
import { PageHeader } from '@/components/layout/PageHeader'
import { AfterActionsTable } from '@/components/after-actions/AfterActionsTable'

export const Route = createFileRoute('/_protected/after-actions/')({
  component: AfterActionsListPage,
})

function AfterActionsListPage(): React.JSX.Element {
  const { t, i18n } = useTranslation('after-actions-page')
  const isRTL = i18n.language === 'ar'
  const { data, isLoading, error } = useAfterActionsAll()
  const rows = data?.data ?? []

  return (
    <section
      role="region"
      aria-label={t('title')}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-loading={isLoading ? 'true' : 'false'}
      className="page flex min-w-0 flex-col gap-[var(--gap)]"
    >
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <AfterActionsTable rows={rows} isLoading={isLoading} error={error ?? null} />
    </section>
  )
}
