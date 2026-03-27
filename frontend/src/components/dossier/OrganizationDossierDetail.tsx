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

import { useState, Suspense } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import QueryErrorBoundary from '@/components/query-error-boundary/QueryErrorBoundary'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

// Section components (Overview tab)
import { InstitutionalProfile } from './sections/InstitutionalProfile'
import { OrgHierarchy } from './sections/OrgHierarchy'

// Shared tab components
import { RelationshipGraph } from '@/components/dossiers/RelationshipGraph'
import { DossierMoUsTab } from '@/components/dossiers/DossierMoUsTab'
import { KeyContactsPanel } from '@/components/key-contacts-panel/KeyContactsPanel'
import { DossierActivityTimeline } from '@/components/dossier/DossierActivityTimeline'
import { OrganizationTimeline } from '@/components/timeline/OrganizationTimeline'
import { FileText, Upload, ChevronDown, Network } from 'lucide-react'
import { Button } from '@/components/ui/button'

import type { OrganizationDossier } from '@/lib/dossier-type-guards'
import { useDirection } from '@/hooks/useDirection'

function OrgTabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

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
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()
const navigate = useNavigate()
  // Active tab state with URL persistence
  const [activeTab, setActiveTab] = useState<OrganizationTabType>(
    (initialTab as OrganizationTabType) || 'overview',
  )

  // Organization hierarchy collapsible state
  const [showHierarchy, setShowHierarchy] = useState(false)

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

  return (
    <div className="space-y-6">
      {/* Tabs Navigation - HeroUI v3 Styled */}
      <div className="bg-card text-card-foreground rounded-lg shadow border border-border">
        <Tabs
          value={activeTab}
          onValueChange={(value) => handleTabChange(value as OrganizationTabType)}
        >
          <div className="px-4 sm:px-6 pt-3">
            <TabsList
              className="w-full justify-start overflow-x-auto flex-nowrap h-auto"
              aria-label={t('detail.tabs_label', 'Organization dossier sections')}
            >
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex-shrink-0 text-xs sm:text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

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
                <Suspense fallback={<OrgTabSkeleton />}>
                  {/* Primary: RelationshipGraph with Filter (like Country dossier) */}
                  <RelationshipGraph dossierId={dossier.id} />

                  {/* Secondary: Collapsible Organization Hierarchy (org-only feature) */}
                  <Collapsible open={showHierarchy} onOpenChange={setShowHierarchy}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-between min-h-11 px-4 sm:px-6',
                          'hover:bg-accent/50',
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
                      <div className="rounded-lg border border-border p-4">
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
                <Suspense fallback={<OrgTabSkeleton />}>
                  <DossierMoUsTab dossierId={dossier.id} />
                </Suspense>
              </QueryErrorBoundary>
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div id="contacts-panel" role="tabpanel" aria-labelledby="contacts-tab">
              <QueryErrorBoundary>
                <Suspense fallback={<OrgTabSkeleton />}>
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
                <Suspense fallback={<OrgTabSkeleton />}>
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
                <div className="rounded-full bg-muted p-4 mb-4">
                  <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t('documents.noDocuments', 'No Documents')}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6">
                  {t(
                    'documents.emptyDescription',
                    'No documents have been attached to this organization dossier yet.',
                  )}
                </p>
                <Button variant="outline" disabled className="gap-2">
                  <Upload className="h-4 w-4" />
                  {t('documents.upload', 'Upload Document')}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
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
