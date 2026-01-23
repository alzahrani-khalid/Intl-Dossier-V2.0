/**
 * GroupedSearchResults Component
 * Feature: Cross-Entity Search Disambiguation
 *
 * Displays search results grouped by entity type for better clarity.
 * Each group has a collapsible header with count and entity type icon.
 *
 * Mobile-first, RTL-compatible design.
 */

import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronDown,
  ChevronUp,
  Globe,
  Building2,
  Users,
  Briefcase,
  Target,
  BookOpen,
  User,
  FileText,
  ScrollText,
  Layers,
  List,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchResultCard, SearchResultData } from './SearchResultCard'

type ViewMode = 'grouped' | 'flat'

interface GroupedSearchResultsProps {
  results: SearchResultData[]
  searchQuery?: string
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  defaultViewMode?: ViewMode
  showMatchReasons?: boolean
  showRelationships?: boolean
}

// Entity type configuration
const entityTypeConfig: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>
    label: { en: string; ar: string }
    color: string
    bgColor: string
    order: number
  }
> = {
  country: {
    icon: Globe,
    label: { en: 'Countries', ar: 'الدول' },
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    order: 1,
  },
  organization: {
    icon: Building2,
    label: { en: 'Organizations', ar: 'المنظمات' },
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    order: 2,
  },
  forum: {
    icon: Users,
    label: { en: 'Forums', ar: 'المنتديات' },
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    order: 3,
  },
  engagement: {
    icon: Briefcase,
    label: { en: 'Engagements', ar: 'المشاركات' },
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    order: 4,
  },
  theme: {
    icon: Target,
    label: { en: 'Themes', ar: 'المواضيع' },
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    order: 5,
  },
  working_group: {
    icon: BookOpen,
    label: { en: 'Working Groups', ar: 'مجموعات العمل' },
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    order: 6,
  },
  person: {
    icon: User,
    label: { en: 'People', ar: 'الأشخاص' },
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    order: 7,
  },
  position: {
    icon: FileText,
    label: { en: 'Positions', ar: 'المواقف' },
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    order: 8,
  },
  document: {
    icon: FileText,
    label: { en: 'Documents', ar: 'الوثائق' },
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    order: 9,
  },
  mou: {
    icon: ScrollText,
    label: { en: 'MoUs', ar: 'مذكرات التفاهم' },
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    order: 10,
  },
}

interface ResultGroup {
  type: string
  results: SearchResultData[]
  config: (typeof entityTypeConfig)[string]
}

function LoadingSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <Skeleton className="size-12 rounded-lg" />
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  )
}

function GroupHeader({
  group,
  isExpanded,
  onToggle,
  isRTL,
}: {
  group: ResultGroup
  isExpanded: boolean
  onToggle: () => void
  isRTL: boolean
}) {
  const Icon = group.config.icon

  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex w-full items-center justify-between rounded-lg px-4 py-3 transition-colors',
        group.config.bgColor,
        'hover:opacity-90',
      )}
      aria-expanded={isExpanded}
    >
      <div className="flex items-center gap-3">
        <div className={cn('rounded-md p-2', group.config.bgColor)}>
          <Icon className={cn('size-5', group.config.color)} />
        </div>
        <div className="text-start">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {isRTL ? group.config.label.ar : group.config.label.en}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {group.results.length} {isRTL ? 'نتيجة' : 'results'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono">
          {group.results.length}
        </Badge>
        {isExpanded ? (
          <ChevronUp className="size-5 text-gray-500" />
        ) : (
          <ChevronDown className="size-5 text-gray-500" />
        )}
      </div>
    </button>
  )
}

export function GroupedSearchResults({
  results,
  searchQuery,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  defaultViewMode = 'grouped',
  showMatchReasons = true,
  showRelationships = true,
}: GroupedSearchResultsProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Group results by entity type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResultData[]> = {}

    results.forEach((result) => {
      const type = result.entityType
      if (!groups[type]) {
        groups[type] = []
      }
      groups[type].push(result)
    })

    // Convert to array and sort by order
    const sortedGroups: ResultGroup[] = Object.entries(groups)
      .map(([type, typeResults]) => ({
        type,
        results: typeResults,
        config: entityTypeConfig[type] || entityTypeConfig.document,
      }))
      .sort((a, b) => a.config.order - b.config.order)

    return sortedGroups
  }, [results])

  // Initialize expanded groups (expand all by default)
  React.useEffect(() => {
    if (groupedResults.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(groupedResults.map((g) => g.type)))
    }
  }, [groupedResults])

  const toggleGroup = (type: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedGroups(new Set(groupedResults.map((g) => g.type)))
  }

  const collapseAll = () => {
    setExpandedGroups(new Set())
  }

  // Empty state
  if (!isLoading && results.length === 0) {
    return (
      <div className="py-12 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="mb-4 text-6xl">🔍</div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isRTL ? 'لم يتم العثور على نتائج' : 'No results found'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {isRTL ? 'حاول تعديل البحث أو المرشحات' : 'Try adjusting your search or filters'}
        </p>
      </div>
    )
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* View Mode Toggle & Actions */}
      {results.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1 dark:border-gray-700">
            <button
              onClick={() => setViewMode('grouped')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'grouped'
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
              )}
              title={isRTL ? 'عرض مجمع' : 'Grouped view'}
            >
              <Layers className="size-4" />
              <span className="hidden sm:inline">{isRTL ? 'مجمع' : 'Grouped'}</span>
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'flat'
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
              )}
              title={isRTL ? 'عرض قائمة' : 'List view'}
            >
              <List className="size-4" />
              <span className="hidden sm:inline">{isRTL ? 'قائمة' : 'List'}</span>
            </button>
          </div>

          {/* Expand/Collapse all (only in grouped mode) */}
          {viewMode === 'grouped' && groupedResults.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {isRTL ? 'توسيع الكل' : 'Expand all'}
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={collapseAll}
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {isRTL ? 'طي الكل' : 'Collapse all'}
              </button>
            </div>
          )}

          {/* Results count summary */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {results.length} {isRTL ? 'نتيجة' : 'results'}
            {groupedResults.length > 1 && (
              <>
                {' '}
                {isRTL ? 'في' : 'in'} {groupedResults.length} {isRTL ? 'فئات' : 'categories'}
              </>
            )}
          </div>
        </div>
      )}

      <ScrollArea className="h-full">
        {/* Grouped View */}
        {viewMode === 'grouped' ? (
          <div className="space-y-4" role="list">
            {groupedResults.map((group) => (
              <div
                key={group.type}
                className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <GroupHeader
                  group={group}
                  isExpanded={expandedGroups.has(group.type)}
                  onToggle={() => toggleGroup(group.type)}
                  isRTL={isRTL}
                />
                {expandedGroups.has(group.type) && (
                  <div className="space-y-3 p-4">
                    {group.results.map((result) => (
                      <SearchResultCard
                        key={result.id}
                        result={result}
                        searchQuery={searchQuery}
                        showMatchReasons={showMatchReasons}
                        showRelationships={showRelationships}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Flat View */
          <div className="space-y-3" role="list">
            {results.map((result) => (
              <SearchResultCard
                key={result.id}
                result={result}
                searchQuery={searchQuery}
                showMatchReasons={showMatchReasons}
                showRelationships={showRelationships}
              />
            ))}
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="mt-4 space-y-3">
            {[...Array(3)].map((_, idx) => (
              <LoadingSkeleton key={idx} />
            ))}
          </div>
        )}

        {/* Load more button */}
        {!isLoading && hasMore && onLoadMore && (
          <div className="pt-6 text-center">
            <button
              onClick={onLoadMore}
              className="rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              {isRTL ? 'تحميل المزيد' : 'Load more'}
            </button>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
