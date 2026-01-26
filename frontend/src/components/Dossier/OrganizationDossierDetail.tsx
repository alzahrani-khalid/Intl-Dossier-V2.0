/**
 * OrganizationDossierDetail - Tab-based layout for Organization dossiers
 * Updated for: Phase 2 Tab-Based Layout (matching Country dossier pattern)
 *
 * Component Library Decision:
 * - Checked: Aceternity UI > Aceternity Pro > Kibo-UI
 * - Selected: Custom tab implementation with horizontal scroll (mobile)
 * - Reason: Consistent UX with Country dossier, URL state persistence
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

// Section components (Overview tab)
import { InstitutionalProfile } from './sections/InstitutionalProfile'
import { OrgHierarchy } from './sections/OrgHierarchy'

// Shared tab components
import { RelationshipGraph } from '@/components/dossiers/RelationshipGraph'
import { DossierMoUsTab } from '@/components/dossiers/DossierMoUsTab'
import { KeyContactsPanel } from '@/components/KeyContactsPanel'
import { DossierActivityTimeline } from '@/components/Dossier/DossierActivityTimeline'
import { OrganizationTimeline } from '@/components/timeline/OrganizationTimeline'
import { FileText, Upload, ChevronDown, Network } from 'lucide-react'
import { Button } from '@/components/ui/button'

import type { OrganizationDossier } from '@/lib/dossier-type-guards'

interface OrganizationDossierDetailProps {
  dossier: OrganizationDossier
  initialTab?: string
}

type OrganizationTabType =
  | 'overview'
  | 'relationships'
  | 'mous'
  | 'contacts'
  | 'activity'
  | 'documents'

export function OrganizationDossierDetail({ dossier, initialTab }: OrganizationDossierDetailProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()
  const tabsRef = useRef<HTMLDivElement>(null)

  // Active tab state with URL persistence
  const [activeTab, setActiveTab] = useState<OrganizationTabType>(
    (initialTab as OrganizationTabType) || 'overview',
  )

  // Organization hierarchy collapsible state
  const [showHierarchy, setShowHierarchy] = useState(false)

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

  // Tab definitions for organization dossier
  const tabs: Array<{ id: OrganizationTabType; label: string }> = [
    {
      id: 'overview',
      label: t('tabs.organization.overview', 'Overview'),
    },
    {
      id: 'relationships',
      label: t('tabs.organization.relationships', 'Relationships'),
    },
    {
      id: 'mous',
      label: t('tabs.organization.mous', 'MoUs'),
    },
    {
      id: 'contacts',
      label: t('tabs.organization.contacts', 'Contacts'),
    },
    {
      id: 'activity',
      label: t('tabs.organization.activity', 'Activity'),
    },
    {
      id: 'documents',
      label: t('tabs.organization.documents', 'Documents'),
    },
  ]

  const handleTabChange = (tab: OrganizationTabType) => {
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
              aria-label={t('detail.tabs_label', 'Organization dossier sections')}
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
                  className={`
                    flex-shrink-0 min-h-11 py-3 px-3 sm:px-4 md:px-6 border-b-2 font-medium text-xs sm:text-sm md:text-base
                    transition-all duration-200 ease-in-out
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                    focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-t-md
                    cursor-pointer
                  `}
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
          {/* Overview Tab - Institutional Profile Only */}
          {activeTab === 'overview' && (
            <div
              id="overview-panel"
              role="tabpanel"
              aria-labelledby="overview-tab"
              className="space-y-6"
            >
              <InstitutionalProfile dossier={dossier} />
            </div>
          )}

          {/* Relationships Tab - Primary: RelationshipGraph (matching Country dossier pattern) */}
          {activeTab === 'relationships' && (
            <div
              id="relationships-panel"
              role="tabpanel"
              aria-labelledby="relationships-tab"
              className="space-y-6"
            >
              <QueryErrorBoundary>
                <Suspense fallback={<TabSkeleton />}>
                  {/* Primary: RelationshipGraph with Filter (like Country dossier) */}
                  <RelationshipGraph dossierId={dossier.id} />

                  {/* Secondary: Collapsible Organization Hierarchy (org-only feature) */}
                  <Collapsible open={showHierarchy} onOpenChange={setShowHierarchy}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-between min-h-11 px-4 sm:px-6',
                          'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Network className="h-4 w-4" />
                          {t('sections.organization.orgHierarchy', 'Organization Hierarchy')}
                        </span>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform duration-200',
                            showHierarchy && 'rotate-180',
                            isRTL && 'rotate-0', // No flip needed for chevron down
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <OrgHierarchy dossier={dossier} />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
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

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div id="contacts-panel" role="tabpanel" aria-labelledby="contacts-tab">
              <QueryErrorBoundary>
                <Suspense fallback={<TabSkeleton />}>
                  <KeyContactsPanel dossierId={dossier.id} />
                </Suspense>
              </QueryErrorBoundary>
            </div>
          )}

          {/* Activity Tab - Timeline + Activity Feed */}
          {activeTab === 'activity' && (
            <div
              id="activity-panel"
              role="tabpanel"
              aria-labelledby="activity-tab"
              className="space-y-6"
            >
              <QueryErrorBoundary>
                <Suspense fallback={<TabSkeleton />}>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-start">
                      {t('tabs.activity', 'Activity')}
                    </h3>
                    <DossierActivityTimeline dossierId={dossier.id} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-start">
                      {t('timeline.title', 'Timeline')}
                    </h3>
                    <OrganizationTimeline dossierId={dossier.id} />
                  </div>
                </Suspense>
              </QueryErrorBoundary>
            </div>
          )}

          {/* Documents Tab - Empty State (documents table not yet implemented) */}
          {activeTab === 'documents' && (
            <div id="documents-panel" role="tabpanel" aria-labelledby="documents-tab">
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 mb-4">
                  <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('documents.noDocuments', 'No Documents')}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md mb-6">
                  {t(
                    'documents.emptyDescription',
                    'No documents have been attached to this organization dossier yet.',
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
        </div>
      </div>
    </div>
  )
}
