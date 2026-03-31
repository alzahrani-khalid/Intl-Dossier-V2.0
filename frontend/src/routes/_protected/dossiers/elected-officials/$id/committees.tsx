/**
 * Elected Official Committees Tab
 * Displays committee_assignments JSONB from the person record.
 * Extra tab unique to elected officials.
 */

import type { ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useElectedOfficial } from '@/domains/elected-officials/hooks/useElectedOfficials'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDirection } from '@/hooks/useDirection'
import { Users } from 'lucide-react'

export const Route = createFileRoute('/_protected/dossiers/elected-officials/$id/committees')({
  component: ElectedOfficialCommitteesTab,
})

function ElectedOfficialCommitteesTab(): ReactElement {
  const { id } = Route.useParams()
  const { t } = useTranslation('elected-officials')
  const { isRTL } = useDirection()
  const { data, isLoading } = useElectedOfficial(id)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    )
  }

  const committees = data?.committee_assignments ?? []

  if (committees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
        <Users className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
        <h3 className="text-base sm:text-lg font-semibold mb-2">{t('committees.empty')}</h3>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t('committees.title')}</h2>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">{t('committees.name')}</TableHead>
              <TableHead className="text-start">{t('committees.role')}</TableHead>
              <TableHead className="text-start">{t('committees.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {committees.map((committee, idx) => (
              <TableRow key={idx} className="min-h-11">
                <TableCell className="font-medium">
                  {isRTL ? (committee.name_ar ?? committee.name_en) : committee.name_en}
                </TableCell>
                <TableCell>
                  {t(`committees.roles.${committee.role}`, { defaultValue: committee.role })}
                </TableCell>
                <TableCell>
                  {committee.is_active ? (
                    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 rounded-full px-2 py-0.5 text-xs">
                      {t('committees.active')}
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="text-muted-foreground rounded-full px-2 py-0.5 text-xs"
                    >
                      {t('committees.inactive')}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {committees.map((committee, idx) => (
          <div key={idx} className="p-3 sm:p-4 rounded-lg border bg-card min-h-11">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="font-semibold text-sm">
                {isRTL ? (committee.name_ar ?? committee.name_en) : committee.name_en}
              </h3>
              {committee.is_active ? (
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 rounded-full px-2 py-0.5 text-xs flex-shrink-0">
                  {t('committees.active')}
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-muted-foreground rounded-full px-2 py-0.5 text-xs flex-shrink-0"
                >
                  {t('committees.inactive')}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t(`committees.roles.${committee.role}`, { defaultValue: committee.role })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
