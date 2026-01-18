/**
 * Country Dossier Detail Component (Feature 028 + 029 - Tab-Based Interface)
 * Updated for: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * Tab-based country dossier layout with dedicated tabs for:
 * - Intelligence (with refresh button)
 * - Activity (work items linked to dossier) - NEW
 * - Timeline
 * - Relationships
 * - Positions
 * - MoUs
 * - Contacts
 *
 * Mobile-first responsive with horizontal scrollable tabs
 * RTL support with logical properties
 * URL state management for active tab
 */

import { useState, lazy, Suspense } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import QueryErrorBoundary from '@/components/QueryErrorBoundary'

// Lazy load intelligence dashboard for better performance
const IntelligenceTabContent = lazy(() =>
  import('@/components/intelligence/IntelligenceTabContent').then((module) => ({
    default: module.IntelligenceTabContent,
  })),
)
import { CountryTimeline } from '@/components/timeline/CountryTimeline'
import { DossierActivityTimeline } from '@/components/Dossier/DossierActivityTimeline'
import { RelationshipGraph } from '@/components/dossiers/RelationshipGraph'
import { DossierPositionsTab } from '@/components/positions/DossierPositionsTab'
import { DossierMoUsTab } from '@/components/dossiers/DossierMoUsTab'
import { KeyContactsPanel } from '@/components/KeyContactsPanel'
import { CommentList } from '@/components/comments'
import { MultiLanguageContentEditor } from '@/components/multilingual'
import type { CountryDossier } from '@/lib/dossier-type-guards'
import type {
  TranslatableEntityType,
  MultiLangFieldConfig,
} from '@/types/multilingual-content.types'

// Field configuration for multi-language content editing
const COUNTRY_MULTILANG_FIELDS: MultiLangFieldConfig[] = [
  { fieldName: 'name', labelKey: 'dossierFields.name', type: 'input', required: true },
  { fieldName: 'description', labelKey: 'dossierFields.description', type: 'textarea', rows: 4 },
  { fieldName: 'capital', labelKey: 'fields.capital', type: 'input' },
]

interface CountryDossierDetailProps {
  dossier: CountryDossier
  initialTab?: string
}

type CountryTabType =
  | 'intelligence'
  | 'activity'
  | 'timeline'
  | 'relationships'
  | 'positions'
  | 'mous'
  | 'contacts'
  | 'comments'
  | 'languages'

export function CountryDossierDetail({ dossier, initialTab }: CountryDossierDetailProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()

  // Active tab state
  const [activeTab, setActiveTab] = useState<CountryTabType>(
    (initialTab as CountryTabType) || 'intelligence',
  )

  // Ensure extension data exists
  if (!dossier.extension) {
    console.error('Country dossier extension data is missing:', dossier)
  }

  // Tab definitions for country dossier
  const tabs: Array<{ id: CountryTabType; label: string; disabled?: boolean }> = [
    {
      id: 'intelligence',
      label: t('intelligence.title', 'Intelligence Reports'),
    },
    {
      id: 'activity',
      label: t('tabs.activity', 'Activity'),
    },
    {
      id: 'timeline',
      label: t('tabs.timeline', 'Timeline'),
    },
    {
      id: 'relationships',
      label: t('tabs.relationships', 'Relationships'),
    },
    {
      id: 'positions',
      label: t('tabs.positions', 'Positions'),
    },
    {
      id: 'mous',
      label: t('tabs.mous', 'MoUs'),
    },
    {
      id: 'contacts',
      label: t('tabs.contacts', 'Contacts'),
    },
    {
      id: 'comments',
      label: t('tabs.comments', 'Comments'),
    },
    {
      id: 'languages',
      label: t('tabs.languages', 'Languages'),
    },
  ]

  const handleTabChange = (tab: CountryTabType) => {
    setActiveTab(tab)
    // Update URL to reflect active tab
    navigate({
      search: { tab } as any,
      replace: true,
    })
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Tabs Navigation - Mobile First Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700 relative">
          {/* Mobile: Horizontal Scrollable Tabs with Fade Indicators */}
          <div className="relative">
            {/* Scroll fade indicators */}
            <div className="absolute end-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-e from-transparent to-white dark:to-gray-800 pointer-events-none z-10" />
            <nav
              className="-mb-px flex overflow-x-auto scrollbar-hide px-4 sm:px-6"
              aria-label={t('detail.tabs_label', 'Country dossier sections')}
              role="tablist"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && handleTabChange(tab.id)}
                  disabled={tab.disabled}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`${tab.id}-panel`}
                  className={`
                  flex-shrink-0 min-h-11 py-3 px-3 sm:px-4 md:px-6 border-b-2 font-medium text-xs sm:text-sm md:text-base
                  transition-all duration-200 ease-in-out
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                  ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-t-md
                `}
                >
                  <span className="whitespace-nowrap flex items-center gap-1.5">
                    {tab.label}
                    {tab.id === 'intelligence' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black text-white dark:bg-white dark:text-black">
                        Beta
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Panels - Responsive Padding */}
        <div className="p-4 sm:p-6">
          {/* Intelligence Tab (Feature 029 - Comprehensive Dashboard with Filtering) */}
          {activeTab === 'intelligence' && (
            <div id="intelligence-panel" role="tabpanel" aria-labelledby="intelligence-tab">
              <QueryErrorBoundary>
                <Suspense
                  fallback={
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Skeleton className="h-10 w-full sm:w-48" />
                        <Skeleton className="h-10 w-full sm:w-48" />
                        <Skeleton className="h-10 w-full sm:w-32" />
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {[1, 2, 3, 4].map((i) => (
                          <Skeleton key={i} className="h-96 w-full" />
                        ))}
                      </div>
                    </div>
                  }
                >
                  <IntelligenceTabContent dossierId={dossier.id} dossier={dossier} />
                </Suspense>
              </QueryErrorBoundary>
            </div>
          )}

          {/* Activity Tab - Work Items Linked to Dossier */}
          {activeTab === 'activity' && (
            <div id="activity-panel" role="tabpanel" aria-labelledby="activity-tab">
              <DossierActivityTimeline dossierId={dossier.id} />
            </div>
          )}

          {/* Timeline Tab - Unified Timeline with Multi-Source Events */}
          {activeTab === 'timeline' && (
            <div id="timeline-panel" role="tabpanel" aria-labelledby="timeline-tab">
              <CountryTimeline dossierId={dossier.id} />
            </div>
          )}

          {/* Relationships Tab */}
          {activeTab === 'relationships' && (
            <div id="relationships-panel" role="tabpanel" aria-labelledby="relationships-tab">
              <RelationshipGraph dossierId={dossier.id} />
            </div>
          )}

          {/* Positions Tab */}
          {activeTab === 'positions' && (
            <div id="positions-panel" role="tabpanel" aria-labelledby="positions-tab">
              <DossierPositionsTab dossierId={dossier.id} />
            </div>
          )}

          {/* MoUs Tab */}
          {activeTab === 'mous' && (
            <div id="mous-panel" role="tabpanel" aria-labelledby="mous-tab">
              <DossierMoUsTab dossierId={dossier.id} />
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div id="contacts-panel" role="tabpanel" aria-labelledby="contacts-tab">
              <KeyContactsPanel dossierId={dossier.id} />
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div id="comments-panel" role="tabpanel" aria-labelledby="comments-tab">
              <CommentList
                entityType="country"
                entityId={dossier.id}
                showReplies={true}
                maxDepth={3}
                defaultVisibility="public"
                title={null}
              />
            </div>
          )}

          {/* Languages Tab - Multi-language content editing */}
          {activeTab === 'languages' && (
            <div id="languages-panel" role="tabpanel" aria-labelledby="languages-tab">
              <MultiLanguageContentEditor
                entityType={'country' as TranslatableEntityType}
                entityId={dossier.id}
                fields={COUNTRY_MULTILANG_FIELDS}
                defaultLanguage="ar"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
