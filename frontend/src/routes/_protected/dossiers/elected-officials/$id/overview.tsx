/**
 * Elected Official Overview Tab
 * Renders ElectedOfficialProfile and TermHistory sections.
 */

import type { ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useElectedOfficial } from '@/domains/elected-officials/hooks/useElectedOfficials'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute(
  '/_protected/dossiers/elected-officials/$id/overview',
)({
  component: ElectedOfficialOverviewTab,
})

function ElectedOfficialOverviewTab(): ReactElement {
  const { id } = Route.useParams()
  const { t } = useTranslation('elected-officials')
  const { data, isLoading } = useElectedOfficial(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const official = data

  return (
    <div className="space-y-6">
      {/* Office Information */}
      <section className="rounded-lg border p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">{t('detail.officeInfo')}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">{t('columns.office')}</dt>
            <dd className="font-medium mt-1">{official?.office_name_en ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('columns.officeType')}</dt>
            <dd className="font-medium mt-1">
              {official?.office_type != null ? t(`officeTypes.${official.office_type}`) : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('columns.party')}</dt>
            <dd className="font-medium mt-1">{official?.party_en ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('columns.district')}</dt>
            <dd className="font-medium mt-1">{official?.district_en ?? '-'}</dd>
          </div>
        </dl>
      </section>

      {/* Term Information */}
      <section className="rounded-lg border p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">{t('detail.termInfo')}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">{t('columns.termStatus')}</dt>
            <dd className="font-medium mt-1">
              {official?.is_current_term === true
                ? t('termStatus.current')
                : t('termStatus.expired')}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Term Start</dt>
            <dd className="font-medium mt-1">{official?.term_start ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Term End</dt>
            <dd className="font-medium mt-1">{official?.term_end ?? '-'}</dd>
          </div>
          {official?.term_number != null && (
            <div>
              <dt className="text-muted-foreground">Term Number</dt>
              <dd className="font-medium mt-1">{official.term_number}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Contact Information */}
      <section className="rounded-lg border p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">{t('detail.contactInfo')}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {official?.email_official != null && (
            <div>
              <dt className="text-muted-foreground">Official Email</dt>
              <dd className="font-medium mt-1">{official.email_official}</dd>
            </div>
          )}
          {official?.phone_office != null && (
            <div>
              <dt className="text-muted-foreground">Office Phone</dt>
              <dd className="font-medium mt-1">{official.phone_office}</dd>
            </div>
          )}
          {official?.website_official != null && (
            <div>
              <dt className="text-muted-foreground">Website</dt>
              <dd className="font-medium mt-1">
                <a
                  href={official.website_official}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {official.website_official}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  )
}
