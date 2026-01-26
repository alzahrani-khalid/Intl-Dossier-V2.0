/**
 * ForumDossierDetail - Tab-based layout for Forum dossiers
 * Updated for: Phase 2 Tab-Based Layout (matching Country/Organization dossier pattern)
 *
 * Component Library Decision:
 * - Checked: Aceternity UI > Aceternity Pro > Kibo-UI
 * - Selected: Custom tab implementation with horizontal scroll (mobile)
 * - Reason: Consistent UX with other dossier types, URL state persistence
 *
 * Responsive Strategy:
 * - Base: Horizontal scrollable tabs with fade indicators
 * - lg: Full-width tabs without scroll
 * - Content: Responsive padding (p-4 sm:p-6)
 *
 * RTL Support:
 * - Logical properties: ms-*, me-*, ps-*, pe-*, start-*, end-*
 * - Gradient directions: bg-gradient-to-e, bg-gradient-to-s
 * - Icon flipping: rotate-180 for directional icons
 *
 * Accessibility:
 * - ARIA: role="tablist", role="tab", aria-selected, aria-controls
 * - Keyboard: Tab navigation through tabs, Enter/Space to select
 * - Focus: Visible focus ring (focus:ring-2 focus:ring-blue-500)
 *
 * Performance:
 * - Lazy loading: Tab content loaded on demand
 * - Suspense: Loading skeletons for each tab
 *
 * Feature: 028-type-specific-dossier-pages (Phase 2)
 */

import { useState, Suspense, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import QueryErrorBoundary from '@/components/QueryErrorBoundary'
import { Building2, CalendarDays, Target, FileText, Files, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Section components (existing forum sections)
import { MemberOrganizations } from './sections/MemberOrganizations'
import { MeetingSchedule } from './sections/MeetingSchedule'
import { DeliverablesTracker } from './sections/DeliverablesTracker'
import { DecisionLogs } from './sections/DecisionLogs'

// Shared tab components
import { RelationshipGraph } from '@/components/dossiers/RelationshipGraph'
import { DossierMoUsTab } from '@/components/dossiers/DossierMoUsTab'
import { DossierActivityTimeline } from '@/components/Dossier/DossierActivityTimeline'
import { DossierTimeline } from '@/components/DossierTimeline'
import { CommentList } from '@/components/comments'

import type { ForumDossier } from '@/lib/dossier-type-guards'

interface ForumDossierDetailProps {
  dossier: ForumDossier
  initialTab?: string
}

type ForumTabType =
  | 'overview'
  | 'members'
  | 'schedule'
  | 'deliverables'
  | 'decisions'
  | 'relationships'
  | 'mous'
  | 'documents'
  | 'timeline'
  | 'activity'
  | 'comments'

export function ForumDossierDetail({ dossier, initialTab }: ForumDossierDetailProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()
  const tabsRef = useRef<HTMLDivElement>(null)

  // Active tab state with URL persistence
  const [activeTab, setActiveTab] = useState<ForumTabType>(
    (initialTab as ForumTabType) || 'overview',
  )

  // Scroll indicators state
  const [canScrollStart, setCanScrollStart] = useState(false)
  const [canScrollEnd, setCanScrollEnd] = useState(false)

  // Check scroll position for fade indicators
  const checkScroll = useCallback(() => {
    const el = tabsRef.current
    if (!el) return

    const { scrollLeft, scrollWidth, clientWidth } = el
    const threshold = 10

    if (isRTL) {
      // RTL scroll direction is inverted
      setCanScrollEnd(scrollLeft < -threshold)
      setCanScrollStart(scrollLeft > -(scrollWidth - clientWidth - threshold))
    } else {
      setCanScrollStart(scrollLeft > threshold)
      setCanScrollEnd(scrollLeft < scrollWidth - clientWidth - threshold)
    }
  }, [isRTL])

  // Initialize scroll check
  useEffect(() => {
    checkScroll()
    const el = tabsRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
    }
    return () => {
      if (el) {
        el.removeEventListener('scroll', checkScroll)
      }
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll])

  // Tab definitions for forum dossier (text-only labels)
  const tabs: Array<{ id: ForumTabType; label: string }> = [
    { id: 'overview', label: t('tabs.forum.overview', 'Overview') },
    { id: 'members', label: t('tabs.forum.members', 'Members') },
    { id: 'schedule', label: t('tabs.forum.sessions', 'Sessions') },
    { id: 'deliverables', label: t('tabs.forum.deliverables', 'Deliverables') },
    { id: 'decisions', label: t('tabs.forum.decisions', 'Decisions') },
    { id: 'relationships', label: t('tabs.forum.relationships', 'Relationships') },
    { id: 'mous', label: t('tabs.forum.mous', 'MoUs') },
    { id: 'documents', label: t('tabs.forum.documents', 'Documents') },
    { id: 'timeline', label: t('tabs.forum.timeline', 'Timeline') },
    { id: 'activity', label: t('tabs.forum.activity', 'Activity') },
    { id: 'comments', label: t('tabs.forum.comments', 'Comments') },
  ]

  const handleTabChange = (tab: ForumTabType) => {
    setActiveTab(tab)
    // Update URL to reflect active tab
    navigate({
      search: { tab } as any,
      replace: true,
    })
  }

  // Tab panel loading skeleton
  const TabSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Tabs Navigation - Mobile First Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700 relative">
          {/* Mobile: Horizontal Scrollable Tabs with Fade Indicators */}
          <div className="relative">
            {/* Start fade indicator */}
            {canScrollStart && (
              <div
                className="absolute start-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-e from-white dark:from-gray-800 to-transparent pointer-events-none z-10"
                aria-hidden="true"
              />
            )}

            {/* Tab navigation */}
            <nav
              ref={tabsRef}
              className="-mb-px flex overflow-x-auto scrollbar-hide px-4 sm:px-6"
              aria-label={t('detail.tabs_label', 'Forum dossier sections')}
              role="tablist"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  role="tab"
                  id={`${tab.id}-tab`}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`${tab.id}-panel`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  className={cn(
                    'flex-shrink-0 min-h-11 py-3 px-3 sm:px-4 md:px-6 border-b-2 font-medium text-xs sm:text-sm md:text-base',
                    'transition-all duration-200 ease-in-out',
                    'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-t-md',
                    'cursor-pointer',
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50',
                  )}
                >
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* End fade indicator */}
            {canScrollEnd && (
              <div
                className="absolute end-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-s from-white dark:from-gray-800 to-transparent pointer-events-none z-10"
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        {/* Tab Panels - Responsive Padding */}
        <div className="p-4 sm:p-6">
          {/* Overview Tab - Forum Summary */}
          {activeTab === 'overview' && (
            <div
              id="overview-panel"
              role="tabpanel"
              aria-labelledby="overview-tab"
              className="space-y-6"
            >
              {/* Forum Description */}
              <div className="prose prose-sm sm:prose max-w-none dark:prose-invert">
                <h3 className="text-lg font-semibold text-start mb-4">
                  {t('sections.shared.overview', 'Overview')}
                </h3>
                {dossier.description_en || dossier.description_ar ? (
                  <p className="text-gray-600 dark:text-gray-400 text-start">
                    {isRTL
                      ? dossier.description_ar || dossier.description_en
                      : dossier.description_en || dossier.description_ar}
                  </p>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500 text-start italic">
                    {t('sections.collapsible.empty', 'No data available')}
                  </p>
                )}
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                  <Building2 className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">
                    {dossier.extension?.member_organizations?.length || 0}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('tabs.forum.members', 'Members')}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                  <CalendarDays className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">
                    {dossier.extension?.meeting_frequency ? 1 : 0}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('tabs.forum.schedule', 'Meetings')}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                  <Target className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold">
                    {dossier.extension?.deliverables?.length || 0}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('tabs.forum.deliverables', 'Deliverables')}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">
                    {dossier.extension?.forum_type === 'working_group' ? 1 : 0}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('tabs.forum.decisions', 'Decisions')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div id="members-panel" role="tabpanel" aria-labelledby="members-tab">
              <QueryErrorBoundary>
                <Suspense fallback={<TabSkeleton />}>
                  <MemberOrganizations dossier={dossier} />
                </Suspense>
              </QueryErrorBoundary>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div id="schedule-panel" role="tabpanel" aria-labelledby="schedule-tab">
              <QueryErrorBoundary>
                <Suspense fallback={<TabSkeleton />}>
                  <MeetingSchedule dossier={dossier} />
                </Suspense>
              </QueryErrorBoundary>
            </div>
          )}

          {/* Deliverables Tab */}
          {activeTab === 'deliverables' && (
            <div id="deliverables-panel" role="tabpanel" aria-labelledby="deliverables-tab">
              <QueryErrorBoundary>
                <Suspense fallback={<TabSkeleton />}>
                  <DeliverablesTracker dossier={dossier} />
                </Suspense>
              </QueryErrorBoundary>
            </div>
          )}

          {/* Decisions Tab */}
          {activeTab === 'decisions' && (
            <div id="decisions-panel" role="tabpanel" aria-labelledby="decisions-tab">
              <QueryErrorBoundary>
                <Suspense fallback={<TabSkeleton />}>
                  <DecisionLogs dossier={dossier} />
                </Suspense>
              </QueryErrorBoundary>
            </div>
          )}

          {/* Relationships Tab */}
          {activeTab === 'relationships' && (
            <div id="relationships-panel" role="tabpanel" aria-labelledby="relationships-tab">
              <QueryErrorBoundary>
                <Suspense fallback={<TabSkeleton />}>
                  <RelationshipGraph dossierId={dossier.id} />
                </Suspense>
              </QueryErrorBoundary>
            </div>
          )}

          {/* MoUs Tab */}
          {activeTab === 'mous' && (
            <div id="mous-panel" role="tabpanel" aria-labelledby="mous-tab">
              <QueryErrorBoundary>
                <Suspense fallback={<TabSkeleton />}>
                  <DossierMoUsTab dossierId={dossier.id} />
                </Suspense>
              </QueryErrorBoundary>
            </div>
          )}

          {/* Documents Tab - Empty State */}
          {activeTab === 'documents' && (
            <div id="documents-panel" role="tabpanel" aria-labelledby="documents-tab">
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 mb-4">
                  <Files className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('documents.noDocuments', 'No Documents')}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md mb-6">
                  {t(
                    'documents.forumEmptyDescription',
                    'No documents have been attached to this forum dossier yet.',
                  )}
                </p>
                <Button variant="outline" disabled className="gap-2">
                  <Upload className="h-4 w-4" />
                  {t('documents.upload', 'Upload Document')}
                </Button>
                <p className="text-xs text-gray-400 mt-2">
                  {t('documents.comingSoon', 'Document uploads coming soon')}
                </p>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div id="timeline-panel" role="tabpanel" aria-labelledby="timeline-tab">
              <QueryErrorBoundary>
                <Suspense fallback={<TabSkeleton />}>
                  <DossierTimeline dossierId={dossier.id} />
                </Suspense>
              </QueryErrorBoundary>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div id="activity-panel" role="tabpanel" aria-labelledby="activity-tab">
              <QueryErrorBoundary>
                <Suspense fallback={<TabSkeleton />}>
                  <DossierActivityTimeline dossierId={dossier.id} />
                </Suspense>
              </QueryErrorBoundary>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div id="comments-panel" role="tabpanel" aria-labelledby="comments-tab">
              <QueryErrorBoundary>
                <Suspense fallback={<TabSkeleton />}>
                  <CommentList
                    entityType="forum"
                    entityId={dossier.id}
                    showReplies={true}
                    maxDepth={3}
                    defaultVisibility="public"
                    title={undefined}
                  />
                </Suspense>
              </QueryErrorBoundary>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
