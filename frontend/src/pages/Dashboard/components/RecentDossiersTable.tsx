/**
 * Recent Dossiers Table
 *
 * A summary table of recently active dossiers with status badges and progress bars.
 * Uses the existing MyDossiers data.
 */

import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { MoreHorizontal, Eye, Globe, Building2, Users, FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableContainer,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyDossiers } from '@/hooks/useDossierDashboard'
import type { MyDossier } from '@/types/dossier-dashboard.types'

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  country: Globe,
  organization: Building2,
  forum: Users,
}

function getStatusVariant(status: string): 'success' | 'warning' | 'info' | 'secondary' {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'warning'
    case 'archived':
      return 'secondary'
    default:
      return 'info'
  }
}

interface RecentDossiersTableProps {
  className?: string
  maxItems?: number
}

export function RecentDossiersTable({ className, maxItems = 5 }: RecentDossiersTableProps) {
  const { t, i18n } = useTranslation(['dashboard', 'dossiers'])
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()
  const { data, isLoading } = useMyDossiers({
    limit: maxItems,
    sort_by: 'last_activity',
    sort_order: 'desc',
  })

  const dossiers = data?.dossiers ?? []

  const getDisplayName = (d: MyDossier) => (isRTL ? d.name_ar : d.name_en)

  const getCompletionPercent = (d: MyDossier) => {
    const total =
      d.stats.pending_tasks_count +
      d.stats.active_commitments_count +
      d.stats.open_intakes_count +
      d.stats.new_items_count
    if (total === 0) return 100
    const completed = Math.max(0, d.stats.new_items_count - d.stats.pending_tasks_count)
    return Math.round((completed / total) * 100)
  }

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours < 1) return t('dossiers:time.justNow', 'Just now')
    if (diffHours < 24) return t('dossiers:time.hoursAgo', '{{count}}h ago', { count: diffHours })
    const diffDays = Math.floor(diffHours / 24)
    return t('dossiers:time.daysAgo', '{{count}}d ago', { count: diffDays })
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t('dashboard:recentTable.title')}</CardTitle>
        <CardDescription>
          {dossiers.length > 0
            ? t('dashboard:recentTable.title')
            : t('dashboard:recentTable.empty')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((n) => (
              <div key={n} className="flex items-center gap-4">
                <Skeleton className="size-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : dossiers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <FileText className="size-10 mb-3 text-muted-foreground/50" />
            <p className="text-sm">{t('dashboard:recentTable.empty')}</p>
          </div>
        ) : (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dashboard:recentTable.columns.name')}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t('dashboard:recentTable.columns.type')}
                  </TableHead>
                  <TableHead>{t('dashboard:recentTable.columns.status')}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t('dashboard:recentTable.columns.lastActivity')}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t('dashboard:recentTable.columns.pending')}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell w-[120px]">
                    {t('dashboard:recentTable.columns.progress')}
                  </TableHead>
                  <TableHead className="w-[50px]">
                    <span className="sr-only">{t('dashboard:recentTable.columns.actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dossiers.map((dossier) => {
                  const Icon = typeIcons[dossier.type] || FileText
                  const completion = getCompletionPercent(dossier)

                  return (
                    <TableRow key={dossier.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="size-4 shrink-0 text-muted-foreground" />
                          <span className="font-medium truncate max-w-[200px]">
                            {getDisplayName(dossier)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {t(`dossiers:types.${dossier.type}`, dossier.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(dossier.status)} className="text-xs">
                          {t(`dossiers:status.${dossier.status}`, dossier.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                        {formatRelativeTime(dossier.stats.last_activity_at)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="tabular-nums text-sm">
                          {dossier.stats.pending_tasks_count}
                        </span>
                        {dossier.stats.has_overdue && (
                          <Badge variant="destructive" className="ms-1.5 text-[10px] px-1">
                            {dossier.stats.overdue_count}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={completion}
                            className="h-2 flex-1"
                            indicatorColor={
                              completion >= 80
                                ? 'bg-green-500'
                                : completion >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                            }
                          />
                          <span className="text-xs text-muted-foreground w-8 text-end tabular-nums">
                            {completion}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-11 sm:size-8">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">
                                {t('dashboard:recentTable.columns.actions')}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                            <DropdownMenuItem
                              onClick={() =>
                                navigate({
                                  to: `/dossiers/${dossier.type === 'country' ? 'countries' : dossier.type === 'organization' ? 'organizations' : dossier.type === 'forum' ? 'forums' : 'engagements'}/${dossier.id}` as any,
                                })
                              }
                            >
                              <Eye className="size-4 me-2" />
                              {t('dashboard:recentTable.viewDossier')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  )
}
