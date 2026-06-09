/**
 * DossierDocumentsTab
 *
 * Type-agnostic tab that surfaces the documents (positions, MOUs, briefs,
 * attachments) linked to a dossier. A thin pass-through to the already-tested
 * DocumentsSection, fetched under a dedicated per-tab query key. Reusable across
 * every dossier type — takes only { dossierId }.
 */

import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { fetchDossierOverview } from '@/services/dossier-overview.service'
import { STALE_TIME } from '@/lib/query-tiers'
import { DocumentsSection } from '@/components/dossier/dossier-overview/sections/DocumentsSection'
import { Button } from '@/components/ui/button'

interface DossierDocumentsTabProps {
  dossierId: string
}

export function DossierDocumentsTab({ dossierId }: DossierDocumentsTabProps): ReactElement {
  const { t, i18n } = useTranslation('dossier-overview')
  const isRTL = i18n.language === 'ar'

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dossier-tab', 'documents', dossierId],
    queryFn: () => fetchDossierOverview({ dossier_id: dossierId, include_sections: ['documents'] }),
    staleTime: STALE_TIME.NORMAL,
  })

  if (isError) {
    return (
      <div className="p-4 sm:p-6 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error && error.message !== '' ? error.message : t('error.description')}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          {t('actions.retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <DocumentsSection
        data={data?.documents ?? null}
        dossierId={dossierId}
        isRTL={isRTL}
        isLoading={isLoading}
      />
    </div>
  )
}
