/**
 * Working Groups List Page (Phase 40 — list-pages, plan 08)
 *
 * Replaced body — ListPageShell + GenericListPage + useWorkingGroups (LIST-03).
 * Mobile-first, RTL-compatible, WCAG AA compliant.
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useMemo, type ReactNode } from 'react'
import {
  ListPageShell,
  GenericListPage,
  GenericListSkeleton,
  type GenericListPageItem,
} from '@/components/list-page'
import { useWorkingGroups } from '@/hooks/useWorkingGroups'
import { getDossierRouteSegment } from '@/lib/dossier-routes'
import { DossierGlyph } from '@/components/signature-visuals'
import { useDirection } from '@/hooks/useDirection'

interface DossierListSearch {
  page: number
  search?: string
}

export const Route = createFileRoute('/_protected/dossiers/working_groups/')({
  component: WorkingGroupsListPageRoute,
  validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
    page: Math.max(1, Number(search.page) || 1),
    search:
      typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
  }),
})

export const WG_STATUS_TONE: Record<string, string> = {
  active: 'chip-ok',
  completed: 'chip-info',
  on_hold: 'chip-warn',
}

export interface WorkingGroupsListPageProps {
  page: number
  search?: string
  onItemNavigate: (id: string) => void
}

export function WorkingGroupsListPage({
  page,
  search,
  onItemNavigate,
}: WorkingGroupsListPageProps): ReactNode {
  const { t } = useTranslation(['working-groups', 'list-pages'])
  const { isRTL } = useDirection()

  const { data, isLoading } = useWorkingGroups({ search, page, limit: 20 })

  const rows = data?.data ?? []

  const items = useMemo<GenericListPageItem[]>(
    () =>
      rows.map((wg) => {
        const statusKey = wg.status ?? 'active'
        const chipClass = WG_STATUS_TONE[statusKey] ?? 'chip-default'
        return {
          id: wg.id,
          primary: isRTL ? (wg.name_ar ?? wg.name_en) : wg.name_en,
          secondary: isRTL ? (wg.name_en ?? '') : (wg.name_ar ?? ''),
          statusLabel: t(`working-groups:status.${statusKey}`, { defaultValue: statusKey }),
          statusChipClass: chipClass,
          icon: <DossierGlyph type="working_group" name={wg.name_en} size={32} />,
        }
      }),
    [rows, isRTL, t],
  )

  const handleItemClick = (item: GenericListPageItem): void => {
    onItemNavigate(item.id)
  }

  const isEmpty = !isLoading && rows.length === 0

  return (
    <ListPageShell
      title={t('working-groups:title', { defaultValue: 'Working Groups' })}
      subtitle={t('working-groups:subtitle', { defaultValue: 'Committees and task forces' })}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyState={
        <div
          className="flex flex-col items-center justify-center py-12 text-center"
          data-testid="working-groups-empty"
        >
          <p className="text-base font-semibold">
            {t('working-groups:empty.title', { defaultValue: 'No working groups yet' })}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('working-groups:empty.description', {
              defaultValue: 'Working group dossiers will appear here.',
            })}
          </p>
        </div>
      }
    >
      {isLoading ? (
        <GenericListSkeleton rows={6} />
      ) : (
        <GenericListPage items={items} onItemClick={handleItemClick} />
      )}
    </ListPageShell>
  )
}

function WorkingGroupsListPageRoute(): ReactNode {
  const { page, search } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const handleNavigate = (id: string): void => {
    void navigate({
      to: `/dossiers/${getDossierRouteSegment('working_group')}/${id}`,
    })
  }

  return <WorkingGroupsListPage page={page} search={search} onItemNavigate={handleNavigate} />
}
