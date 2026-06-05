/**
 * DossierWorkItemsTab
 *
 * Type-agnostic tab that surfaces the work items (tasks, commitments, intakes)
 * linked to a dossier. A thin pass-through to the already-tested WorkItemsSection,
 * fetched under a dedicated per-tab query key (never the shared overview key, which
 * ignores include_sections and would cause partial-cache collisions). Reusable
 * across every dossier type — takes only { dossierId }.
 */

import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { fetchDossierOverview } from '@/services/dossier-overview.service'
import { STALE_TIME } from '@/lib/query-tiers'
import { WorkItemsSection } from '@/components/dossier/dossier-overview/sections/WorkItemsSection'

interface DossierWorkItemsTabProps {
  dossierId: string
}

export function DossierWorkItemsTab({ dossierId }: DossierWorkItemsTabProps): ReactElement {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const { data, isLoading } = useQuery({
    queryKey: ['dossier-tab', 'work_items', dossierId],
    queryFn: () =>
      fetchDossierOverview({ dossier_id: dossierId, include_sections: ['work_items'] }),
    staleTime: STALE_TIME.NORMAL,
  })

  return (
    <div className="p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <WorkItemsSection
        data={data?.work_items ?? null}
        dossierId={dossierId}
        isRTL={isRTL}
        isLoading={isLoading}
      />
    </div>
  )
}
