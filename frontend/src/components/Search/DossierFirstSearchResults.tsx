/**
 * DossierFirstSearchResults Component
 * Feature: Dossier-first search experience
 *
 * Displays search results in two sections:
 * - DOSSIERS: Matching dossiers with type badges and key stats
 * - RELATED WORK: Items linked to matching dossiers
 *
 * Mobile-first, RTL-compatible design.
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Globe,
  Building2,
  Users,
  Briefcase,
  Target,
  BookOpen,
  User,
  FileText,
  ScrollText,
  Calendar,
  Network,
  ChevronDown,
  Folder,
  ListTodo,
  TrendingUp,
  Vote,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDossierRouteSegment } from '@/lib/dossier-routes'
import type { DossierType } from '@/lib/dossier-type-guards'
import type {
  DossierSearchResult,
  RelatedWorkItem,
  DossierFirstSearchResultsProps,
  RelatedWorkType,
  RELATED_WORK_TYPE_CONFIG,
} from '@/types/dossier-search.types'

// Dossier type configuration with icons and colors
const dossierTypeConfig: Record<
  DossierType,
  {
    icon: React.ComponentType<{ className?: string }>
    color: string
    bgColor: string
  }
> = {
  country: {
    icon: Globe,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  organization: {
    icon: Building2,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  forum: {
    icon: Users,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  engagement: {
    icon: Briefcase,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  topic: {
    icon: Target,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  working_group: {
    icon: BookOpen,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  person: {
    icon: User,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
  },
  elected_official: {
    icon: Vote,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
  },
}

// Related work type configuration
const relatedWorkTypeConfig: Record<
  RelatedWorkType,
  {
    icon: React.ComponentType<{ className?: string }>
    label_en: string
    label_ar: string
    color: string
    bgColor: string
  }
> = {
  position: {
    icon: FileText,
    label_en: 'Position',
    label_ar: 'موقف',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  document: {
    icon: FileText,
    label_en: 'Document',
    label_ar: 'وثيقة',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  mou: {
    icon: ScrollText,
    label_en: 'MoU',
    label_ar: 'مذكرة تفاهم',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  engagement: {
    icon: Briefcase,
    label_en: 'Engagement',
    label_ar: 'مشاركة',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  task: {
    icon: ListTodo,
    label_en: 'Task',
    label_ar: 'مهمة',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  commitment: {
    icon: TrendingUp,
    label_en: 'Commitment',
    label_ar: 'التزام',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  intake: {
    icon: Folder,
    label_en: 'Request',
    label_ar: 'طلب',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
}

// Loading skeleton for dossier card
function DossierCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <Skeleton className="size-12 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading skeleton for related work item
function WorkItemSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  )
}

// Dossier search result card
interface DossierCardProps {
  dossier: DossierSearchResult
  searchQuery?: string
  onClick?: (dossier: DossierSearchResult) => void
}

function DossierCard({ dossier, searchQuery, onClick }: DossierCardProps) {
  const { i18n, t } = useTranslation('dossier-search')
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  const config = dossierTypeConfig[dossier.type]
  const Icon = config.icon

  const name = isRTL ? dossier.name_ar : dossier.name_en
  const description = isRTL ? dossier.description_ar : dossier.description_en

  // Highlight search query in text
  const highlightText = (text: string, query?: string) => {
    if (!query || !text) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(
      regex,
      '<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">$1</mark>',
    )
  }

  const handleClick = () => {
    if (onClick) {
      onClick(dossier)
    } else {
      // Navigate to dossier detail page
      const routeSegment = getDossierRouteSegment(dossier.type)
      navigate({ to: `/dossiers/${routeSegment}/${dossier.id}` })
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-start rounded-lg border border-gray-200 p-4 transition-all',
        'hover:border-blue-500 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-400',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-start gap-3">
        {/* Dossier type icon */}
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-lg',
            config.bgColor,
          )}
        >
          <Icon className={cn('size-6', config.color)} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Type badge + status row */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'inline-flex items-center gap-1 border-0 font-medium',
                config.bgColor,
                config.color,
              )}
            >
              <Icon className="size-3" />
              {t(`types.${dossier.type}`)}
            </Badge>

            {dossier.status === 'archived' && (
              <Badge variant="secondary" className="text-xs">
                {t('status.archived')}
              </Badge>
            )}
          </div>

          {/* Name */}
          <h3
            className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100"
            dangerouslySetInnerHTML={{
              __html: highlightText(name, searchQuery),
            }}
          />

          {/* Description */}
          {description && (
            <p className="mb-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}

          {/* Key stats */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {dossier.stats.total_engagements > 0 && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="size-3" />
                {dossier.stats.total_engagements} {t('stats.engagements')}
              </span>
            )}
            {dossier.stats.total_documents > 0 && (
              <span className="inline-flex items-center gap-1">
                <FileText className="size-3" />
                {dossier.stats.total_documents} {t('stats.documents')}
              </span>
            )}
            {dossier.stats.total_positions > 0 && (
              <span className="inline-flex items-center gap-1">
                <FileText className="size-3" />
                {dossier.stats.total_positions} {t('stats.positions')}
              </span>
            )}
            {dossier.stats.total_work_items > 0 && (
              <span className="inline-flex items-center gap-1">
                <ListTodo className="size-3" />
                {dossier.stats.total_work_items} {t('stats.workItems')}
              </span>
            )}
            {dossier.stats.related_dossiers_count > 0 && (
              <span className="inline-flex items-center gap-1">
                <Network className="size-3" />
                {dossier.stats.related_dossiers_count} {t('stats.related')}
              </span>
            )}
          </div>

          {/* Tags */}
          {dossier.tags && dossier.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {dossier.tags.slice(0, 3).map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {dossier.tags.length > 3 && (
                <span className="text-xs text-gray-400">+{dossier.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

// Related work item card with dossier context badge
interface WorkItemCardProps {
  item: RelatedWorkItem
  searchQuery?: string
  onClick?: (item: RelatedWorkItem) => void
}

function WorkItemCard({ item, searchQuery, onClick }: WorkItemCardProps) {
  const { i18n, t } = useTranslation('dossier-search')
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  const workConfig = relatedWorkTypeConfig[item.type]
  const dossierConfig = dossierTypeConfig[item.dossier_context.type]
  const WorkIcon = workConfig.icon
  const DossierIcon = dossierConfig.icon

  const title = isRTL ? item.title_ar : item.title_en
  const dossierName = isRTL ? item.dossier_context.name_ar : item.dossier_context.name_en

  // Highlight search query
  const highlightText = (text: string, query?: string) => {
    if (!query || !text) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(
      regex,
      '<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">$1</mark>',
    )
  }

  const handleClick = () => {
    if (onClick) {
      onClick(item)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-start rounded-lg border border-gray-200 p-3 transition-all',
        'hover:border-blue-500 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-400',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-start gap-3">
        {/* Work type icon */}
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            workConfig.bgColor,
          )}
        >
          <WorkIcon className={cn('size-5', workConfig.color)} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Type badge + dossier context row */}
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'inline-flex items-center gap-1 border-0 text-xs font-medium',
                workConfig.bgColor,
                workConfig.color,
              )}
            >
              <WorkIcon className="size-3" />
              {isRTL ? workConfig.label_ar : workConfig.label_en}
            </Badge>

            {/* Dossier context badge */}
            <Badge
              variant="outline"
              className={cn(
                'inline-flex items-center gap-1 border-gray-300 text-xs',
                'dark:border-gray-600',
              )}
            >
              <DossierIcon className={cn('size-3', dossierConfig.color)} />
              <span className="max-w-24 truncate">{dossierName}</span>
            </Badge>

            {/* Inheritance indicator */}
            {item.inheritance_source && item.inheritance_source !== 'direct' && (
              <span className="text-xs text-gray-400">
                ({t(`inheritance.${item.inheritance_source}`)})
              </span>
            )}
          </div>

          {/* Title */}
          <h4
            className="mb-1 font-medium text-gray-900 dark:text-gray-100"
            dangerouslySetInnerHTML={{
              __html: highlightText(title, searchQuery),
            }}
          />

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {item.deadline && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3" />
                {new Date(item.deadline).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
              </span>
            )}

            {item.priority && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  item.priority === 'urgent' && 'border-red-300 text-red-600',
                  item.priority === 'high' && 'border-orange-300 text-orange-600',
                  item.priority === 'medium' && 'border-yellow-300 text-yellow-600',
                  item.priority === 'low' && 'border-gray-300 text-gray-600',
                )}
              >
                {t(`priority.${item.priority}`)}
              </Badge>
            )}

            {item.status && <span className="text-gray-400">{item.status}</span>}
          </div>
        </div>
      </div>
    </button>
  )
}

// Section header component
interface SectionHeaderProps {
  title: string
  count: number
  total: number
  isExpanded: boolean
  onToggle: () => void
}

function SectionHeader({ title, count, total, isExpanded, onToggle }: SectionHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex w-full items-center justify-between rounded-lg px-4 py-3',
        'bg-gray-50 dark:bg-gray-800/50',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'transition-colors',
      )}
      aria-expanded={isExpanded}
    >
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <Badge variant="secondary" className="font-mono">
          {count}
          {total > count && `/${total}`}
        </Badge>
      </div>
      <ChevronDown
        className={cn('size-5 text-gray-500 transition-transform', isExpanded && 'rotate-180')}
      />
    </button>
  )
}

// Main component
export function DossierFirstSearchResults({
  dossiers,
  relatedWork,
  dossiersTotal,
  relatedWorkTotal,
  isLoading = false,
  searchQuery,
  hasMoreDossiers = false,
  hasMoreWork = false,
  onLoadMoreDossiers,
  onLoadMoreWork,
  onDossierClick,
  onWorkItemClick,
}: DossierFirstSearchResultsProps) {
  const { t, i18n } = useTranslation('dossier-search')
  const isRTL = i18n.language === 'ar'

  const [dossiersExpanded, setDossiersExpanded] = React.useState(true)
  const [workExpanded, setWorkExpanded] = React.useState(true)

  // Empty state
  if (!isLoading && dossiers.length === 0 && relatedWork.length === 0) {
    return (
      <div className="py-12 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="mb-4 text-6xl">🔍</div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('empty.title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">{t('empty.description')}</p>
      </div>
    )
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Section 1: DOSSIERS */}
      <section>
        <SectionHeader
          title={t('sections.dossiers')}
          count={dossiers.length}
          total={dossiersTotal}
          isExpanded={dossiersExpanded}
          onToggle={() => setDossiersExpanded(!dossiersExpanded)}
        />

        {dossiersExpanded && (
          <div className="mt-4 space-y-3">
            {isLoading && dossiers.length === 0 ? (
              // Loading skeletons
              <>
                <DossierCardSkeleton />
                <DossierCardSkeleton />
                <DossierCardSkeleton />
              </>
            ) : dossiers.length > 0 ? (
              // Dossier results
              <>
                {dossiers.map((dossier) => (
                  <DossierCard
                    key={dossier.id}
                    dossier={dossier}
                    searchQuery={searchQuery}
                    onClick={onDossierClick}
                  />
                ))}

                {/* Load more button */}
                {hasMoreDossiers && onLoadMoreDossiers && (
                  <div className="pt-4 text-center">
                    <button
                      onClick={onLoadMoreDossiers}
                      className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {t('loadMore.dossiers')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              // No dossiers found
              <div className="py-6 text-center text-gray-500 dark:text-gray-400">
                {t('empty.noDossiers')}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Section 2: RELATED WORK */}
      <section>
        <SectionHeader
          title={t('sections.relatedWork')}
          count={relatedWork.length}
          total={relatedWorkTotal}
          isExpanded={workExpanded}
          onToggle={() => setWorkExpanded(!workExpanded)}
        />

        {workExpanded && (
          <div className="mt-4 space-y-3">
            {isLoading && relatedWork.length === 0 ? (
              // Loading skeletons
              <>
                <WorkItemSkeleton />
                <WorkItemSkeleton />
                <WorkItemSkeleton />
              </>
            ) : relatedWork.length > 0 ? (
              // Related work results
              <>
                {relatedWork.map((item) => (
                  <WorkItemCard
                    key={item.id}
                    item={item}
                    searchQuery={searchQuery}
                    onClick={onWorkItemClick}
                  />
                ))}

                {/* Load more button */}
                {hasMoreWork && onLoadMoreWork && (
                  <div className="pt-4 text-center">
                    <button
                      onClick={onLoadMoreWork}
                      className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {t('loadMore.relatedWork')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              // No related work found
              <div className="py-6 text-center text-gray-500 dark:text-gray-400">
                {t('empty.noRelatedWork')}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
