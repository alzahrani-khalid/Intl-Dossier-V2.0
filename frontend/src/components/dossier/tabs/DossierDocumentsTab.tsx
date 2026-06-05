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

interface DossierDocumentsTabProps {
  dossierId: string
}

export function DossierDocumentsTab({ dossierId }: DossierDocumentsTabProps): ReactElement {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const { data, isLoading } = useQuery({
    queryKey: ['dossier-tab', 'documents', dossierId],
    queryFn: () => fetchDossierOverview({ dossier_id: dossierId, include_sections: ['documents'] }),
    staleTime: STALE_TIME.NORMAL,
  })

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
