/**
 * PendingWorkByDossier Component
 * Feature: Dossier-Centric Dashboard Redesign
 *
 * Displays pending work items grouped by dossier.
 * Each dossier shows quick stats and top urgent items.
 * Mobile-first design with RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import {
  ListTodo,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckSquare,
  FileCheck,
  ClipboardList,
  Globe2,
  Building2,
  Users,
  Calendar,
  Folder,
  UserCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { usePendingWorkByDossier } from '@/hooks/useDossierDashboard'
import type {
  PendingWorkByDossierProps,
  PendingWorkByDossierItem,
} from '@/types/dossier-dashboard.types'
import type { DossierType } from '@/types/dossier-context.types'
import type { WorkSource } from '@/types/unified-work.types'
import { getDossierDetailPath } from '@/lib/dossier-routes'

// =============================================================================
// Icons
// =============================================================================

const workTypeIcons: Record<WorkSource, typeof CheckSquare> = {
  task: CheckSquare,
  commitment: FileCheck,
  intake: ClipboardList,
}

const dossierTypeIcons: Record<DossierType, typeof Globe2> = {
  country: Globe2,
  organization: Building2,
  forum: Calendar,
  theme: Folder,
  working_group: Users,
  person: UserCircle,
  engagement: Calendar,
  topic: Folder,
}

const dossierTypeColors: Record<DossierType, string> = {
  country: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  organization: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
  forum: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30',
  theme: 'text-teal-500 bg-teal-50 dark:bg-teal-950/30',
  working_group: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
  person: 'text-pink-500 bg-pink-50 dark:bg-pink-950/30',
  engagement: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
  topic: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
}

// =============================================================================
// Component
// =============================================================================

export function PendingWorkByDossier({
  maxDossiers = 5,
  defaultExpanded = false,
  filters,
  className,
}: PendingWorkByDossierProps) {
  const { t, i18n } = useTranslation('dossier-dashboard')
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  // Fetch pending work
  const { data, isLoading, isError, error, refetch } = usePendingWorkByDossier({
    ...filters,
    limit: maxDossiers,
    sort_by: filters?.sort_by || 'overdue_count',
    sort_order: filters?.sort_order || 'desc',
  })

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4">
        <div className="flex items-center gap-2">
          <ListTodo className="size-5 text-primary" />
          <CardTitle className="text-lg">
            {t('pendingWork.title', 'Pending Work by Dossier')}
          </CardTitle>
        </div>
        {!isLoading && data && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {data.total_pending} {t('pendingWork.total', 'total')}
            </Badge>
            {data.total_overdue > 0 && (
              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                <AlertTriangle className="size-3" />
                {data.total_overdue} {t('pendingWork.overdue', 'overdue')}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <DossierWorkItemSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-destructive mb-2">
              {error?.message || t('pendingWork.error', 'Failed to load pending work')}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="min-h-11">
              {t('common.retry', 'Try Again')}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && data?.items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ListTodo className="size-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              {t('pendingWork.empty', 'No pending work across your dossiers')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('pendingWork.emptyHint', 'All caught up!')}
            </p>
          </div>
        )}

        {/* Dossier Work List */}
        {!isLoading && !isError && data && data.items.length > 0 && (
          <div className="space-y-2">
            {data.items.map((item) => (
              <DossierWorkItem
                key={item.dossier.id}
                item={item}
                defaultExpanded={defaultExpanded}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// DossierWorkItem Sub-component
// =============================================================================

interface DossierWorkItemProps {
  item: PendingWorkByDossierItem
  defaultExpanded?: boolean
}

function DossierWorkItem({ item, defaultExpanded = false }: DossierWorkItemProps) {
  const { t, i18n } = useTranslation('dossier-dashboard')
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'
  const [isOpen, setIsOpen] = useState(defaultExpanded)

  const DossierIcon = dossierTypeIcons[item.dossier.type] || Folder

  // Get dossier name
  const dossierName = isRTL ? item.dossier.name_ar || item.dossier.name_en : item.dossier.name_en

  // Navigate to dossier
  const handleDossierClick = () => {
    const path = getDossierDetailPath(item.dossier.id, item.dossier.type)
    navigate({ to: path })
  }

  // Navigate to work item
  const handleWorkItemClick = (workItem: { id: string; work_item_type: WorkSource }) => {
    switch (workItem.work_item_type) {
      case 'task':
        navigate({ to: '/tasks/$id', params: { id: workItem.id } })
        break
      case 'commitment':
        navigate({ to: '/commitments', search: { id: workItem.id } })
        break
      case 'intake':
        navigate({ to: '/intake/tickets/$id', params: { id: workItem.id } })
        break
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          'border rounded-lg',
          item.summary.overdue_count > 0 && 'border-red-200 dark:border-red-900/50',
        )}
      >
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'w-full flex items-center gap-3 p-3 text-start',
              'transition-colors hover:bg-muted/50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
            )}
          >
            {/* Dossier Icon */}
            <div
              className={cn(
                'flex items-center justify-center size-10 rounded-lg shrink-0',
                dossierTypeColors[item.dossier.type],
              )}
            >
              <DossierIcon className="size-5" />
            </div>

            {/* Dossier Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{dossierName}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {item.summary.total_pending} {t('pendingWork.pending', 'pending')}
                </span>
                {item.summary.overdue_count > 0 && (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertTriangle className="size-3" />
                    {item.summary.overdue_count}
                  </span>
                )}
                {item.summary.due_today_count > 0 && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Clock className="size-3" />
                    {item.summary.due_today_count} {t('pendingWork.dueToday', 'today')}
                  </span>
                )}
              </div>
            </div>

            {/* Stats Summary */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-xs">
                <CheckSquare className="size-3 me-1" />
                {item.summary.by_source.tasks}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <FileCheck className="size-3 me-1" />
                {item.summary.by_source.commitments}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <ClipboardList className="size-3 me-1" />
                {item.summary.by_source.intakes}
              </Badge>
            </div>

            {/* Chevron */}
            {isOpen ? (
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight
                className={cn('size-4 shrink-0 text-muted-foreground', isRTL && 'rotate-180')}
              />
            )}
          </button>
        </CollapsibleTrigger>

        {/* Expanded Content */}
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            {/* Mobile Stats */}
            <div className="flex sm:hidden items-center gap-2 py-2 border-t">
              <Badge variant="outline" className="text-xs">
                <CheckSquare className="size-3 me-1" />
                {item.summary.by_source.tasks} {t('pendingWork.tasks', 'tasks')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <FileCheck className="size-3 me-1" />
                {item.summary.by_source.commitments}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <ClipboardList className="size-3 me-1" />
                {item.summary.by_source.intakes}
              </Badge>
            </div>

            {/* Urgent Items */}
            {item.urgent_items.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('pendingWork.urgentItems', 'Most urgent')}:
                </p>
                {item.urgent_items.map((urgent) => {
                  const WorkIcon = workTypeIcons[urgent.work_item_type] || CheckSquare
                  return (
                    <button
                      key={urgent.id}
                      onClick={() => handleWorkItemClick(urgent)}
                      className={cn(
                        'w-full flex items-center gap-2 p-2 rounded-md text-start',
                        'bg-muted/50 hover:bg-muted transition-colors',
                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                      )}
                    >
                      <WorkIcon
                        className={cn(
                          'size-4 shrink-0',
                          urgent.work_item_type === 'task' && 'text-blue-500',
                          urgent.work_item_type === 'commitment' && 'text-purple-500',
                          urgent.work_item_type === 'intake' && 'text-green-500',
                        )}
                      />
                      <span className="flex-1 text-sm truncate">{urgent.title}</span>
                      {urgent.is_overdue && (
                        <AlertTriangle className="size-4 text-red-500 shrink-0" />
                      )}
                      <ChevronRight
                        className={cn(
                          'size-4 text-muted-foreground shrink-0',
                          isRTL && 'rotate-180',
                        )}
                      />
                    </button>
                  )
                })}
              </div>
            )}

            {/* View All Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={handleDossierClick}
            >
              {t('pendingWork.viewAllInDossier', 'View all in dossier')}
              <ChevronRight className={cn('size-4 ms-1', isRTL && 'rotate-180')} />
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function DossierWorkItemSkeleton() {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="size-4" />
      </div>
    </div>
  )
}

export default PendingWorkByDossier
