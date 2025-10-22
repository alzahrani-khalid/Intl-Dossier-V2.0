/**
 * Dossier Detail Page (T039)
 *
 * Displays comprehensive dossier information with tabs
 * Components: DossierHeader, DossierStats, DossierTimeline, KeyContactsPanel, DossierActions
 * Tabs: Timeline (default), Positions, MoUs, Commitments, Files, Intelligence
 * Accessibility: Tab navigation, focus management
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDossier } from '../../../hooks/useDossier';
import { useArchiveDossier } from '../../../hooks/useArchiveDossier';
import { useTimelineEvents } from '../../../hooks/useTimelineEvents';
import { DossierHeader } from '../../../components/DossierHeader';
import { DossierStats } from '../../../components/DossierStats';
import { DossierTimeline } from '../../../components/DossierTimeline';
import { DossierActions } from '../../../components/DossierActions';
import { KeyContactsPanel } from '../../../components/KeyContactsPanel';
import { ConflictDialog } from '../../../components/ConflictDialog';
import { DossierPositionsTab } from '../../../components/positions/DossierPositionsTab';
import { RelationshipGraph } from '../../../components/dossiers/RelationshipGraph';
import { DossierMoUsTab } from '../../../components/dossiers/DossierMoUsTab';
import { DossierIntelligenceTab } from '../../../components/dossiers/DossierIntelligenceTab';
import type { ConflictError } from '../../../types/dossier';

// Search params for tabs and filters
interface DossierDetailSearchParams {
  tab?: string;
  event_type?: string;
}

export const Route = createFileRoute('/_protected/dossiers/$id')({
  component: DossierDetailPage,
  validateSearch: (search: Record<string, unknown>): DossierDetailSearchParams => {
    return {
      tab: search.tab as string | undefined,
      event_type: search.event_type as string | undefined,
    };
  },
});

type TabType = 'timeline' | 'relationships' | 'positions' | 'mous' | 'intelligence' | 'contacts' | 'commitments' | 'files';

function DossierDetailPage() {
  const { t } = useTranslation('dossiers');
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const searchParams = Route.useSearch();

  // Active tab state
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.tab as TabType) || 'timeline'
  );

  // Conflict dialog state (unused for now, but will be needed when edit functionality is added)
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictData] = useState<ConflictError | null>(null);

  // Fetch dossier with includes
  const {
    data: dossier,
    isLoading,
    error,
  } = useDossier(id, ['stats', 'owners', 'contacts', 'recent_briefs']);

  // Build timeline filters from URL params (supports comma-separated values)
  const timelineFilters = searchParams.event_type
    ? { event_type: searchParams.event_type.split(',') as any[] }
    : undefined;

  // Fetch timeline events
  const {
    data: timelineData,
    isLoading: isLoadingTimeline,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useTimelineEvents(id, timelineFilters);

  // Flatten timeline events from pages
  const timelineEvents = timelineData?.pages.flatMap((page) => page.events) ?? [];

  // Mutations (updateMutation unused until edit functionality is added)
  const archiveMutation = useArchiveDossier(id);

  // Handlers
  const handleEdit = () => {
    // TODO: Open edit modal or navigate to edit page
    console.log('Edit dossier', id);
  };

  const handleArchive = async () => {
    if (!confirm(t('detail.confirm_archive'))) return;

    try {
      await archiveMutation.mutateAsync();
      navigate({ to: '/dossiers' });
    } catch (error) {
      console.error('Failed to archive dossier:', error);
    }
  };

  const handleGenerateBrief = () => {
    // TODO: Navigate to brief generation page when route is implemented
    console.log('Generate brief for dossier', id);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Update URL to reflect active tab
    navigate({
      search: { tab } as any,
      replace: true,
    });
  };

  const handleConflictResolve = (resolution: 'keep-mine' | 'use-theirs' | 'cancel') => {
    if (resolution === 'use-theirs') {
      // Refresh the page to get latest data
      window.location.reload();
    } else if (resolution === 'keep-mine') {
      // Keep local changes - retry with force flag
      // This would need to be implemented in the mutation
      console.log('Force update with local changes');
    }
    setShowConflictDialog(false);
  };

  const handleStatClick = (statType: 'engagements' | 'positions' | 'mous') => {
    // Map stat types to their corresponding tabs and event filters
    const tabMap: Record<typeof statType, TabType> = {
      engagements: 'timeline',
      positions: 'positions',
      mous: 'mous',
    };

    const eventTypeMap: Record<typeof statType, string | undefined> = {
      engagements: 'engagement',
      positions: 'position',
      mous: 'mou',
    };

    // Navigate to tab with event_type filter for timeline
    const targetTab = tabMap[statType];
    const eventType = eventTypeMap[statType];

    setActiveTab(targetTab);
    navigate({
      search: {
        tab: targetTab,
        ...(targetTab === 'timeline' && eventType ? { event_type: eventType } : {}),
      } as any,
      replace: true,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              </div>
              <div className="space-y-6">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const isNotFound = error instanceof Error && error.message === 'DOSSIER_NOT_FOUND';

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
            role="alert"
          >
            <h2 className="text-lg font-medium text-red-800 dark:text-red-200">
              {isNotFound
                ? t('detail.not_found_title', 'Dossier Not Found')
                : t('detail.error_title', 'Error Loading Dossier')}
            </h2>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              {isNotFound
                ? t('detail.not_found_message', 'The dossier you are looking for does not exist or may have been removed. This could be due to a data integrity issue where an assignment references a non-existent dossier.')
                : (error instanceof Error ? error.message : t('detail.error_generic', 'An unexpected error occurred while loading the dossier.'))}
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => navigate({ to: '/my-work/waiting' })}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {t('detail.back_to_waiting_queue', 'Back to Waiting Queue')}
              </button>
              <button
                onClick={() => navigate({ to: '/dossiers' })}
                className="inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {t('detail.back_to_hub', 'Go to Dossiers')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dossier) return null;

  // Tab definitions
  const tabs: Array<{ id: TabType; label: string; disabled?: boolean }> = [
    { id: 'timeline', label: t('tabs.timeline') },
    { id: 'relationships', label: t('tabs.relationships') },
    { id: 'positions', label: t('tabs.positions') },
    { id: 'mous', label: t('tabs.mous') },
    { id: 'intelligence', label: t('tabs.intelligence') },
    { id: 'contacts', label: t('tabs.contacts') },
    { id: 'commitments', label: t('tabs.commitments'), disabled: true },
    { id: 'files', label: t('tabs.files'), disabled: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Dossier Header */}
      <DossierHeader
        dossier={dossier}
        onEdit={handleEdit}
        onArchive={handleArchive}
        onGenerateBrief={handleGenerateBrief}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
            {/* Stats Cards */}
            {dossier.stats && (
              <div>
                <DossierStats stats={dossier.stats} onStatClick={handleStatClick} />
              </div>
            )}

            {/* Tabs Navigation - Mobile First Responsive */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="border-b border-gray-200 dark:border-gray-700">
                {/* Mobile: Horizontal Scrollable Tabs */}
                <nav
                  className="-mb-px flex overflow-x-auto scrollbar-hide px-4 sm:px-6"
                  aria-label={t('detail.tabs_label')}
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
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Panels - Responsive Padding */}
              <div className="p-4 sm:p-6">
                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                  <div
                    id="timeline-panel"
                    role="tabpanel"
                    aria-labelledby="timeline-tab"
                  >
                    <DossierTimeline
                      dossierId={id}
                      events={timelineEvents}
                      isLoading={isLoadingTimeline}
                      isFetchingNextPage={isFetchingNextPage}
                      hasNextPage={hasNextPage}
                      onLoadMore={fetchNextPage}
                      activeFilter={searchParams.event_type}
                    />
                  </div>
                )}

                {/* Relationships Tab */}
                {activeTab === 'relationships' && (
                  <div
                    id="relationships-panel"
                    role="tabpanel"
                    aria-labelledby="relationships-tab"
                  >
                    <RelationshipGraph dossierId={id} />
                  </div>
                )}

                {/* Positions Tab */}
                {activeTab === 'positions' && (
                  <div
                    id="positions-panel"
                    role="tabpanel"
                    aria-labelledby="positions-tab"
                  >
                    <DossierPositionsTab dossierId={id} />
                  </div>
                )}

                {/* MoUs Tab */}
                {activeTab === 'mous' && (
                  <div
                    id="mous-panel"
                    role="tabpanel"
                    aria-labelledby="mous-tab"
                  >
                    <DossierMoUsTab dossierId={id} />
                  </div>
                )}

                {/* Intelligence Tab */}
                {activeTab === 'intelligence' && (
                  <div
                    id="intelligence-panel"
                    role="tabpanel"
                    aria-labelledby="intelligence-tab"
                  >
                    <DossierIntelligenceTab dossierId={id} />
                  </div>
                )}

                {/* Contacts Tab */}
                {activeTab === 'contacts' && (
                  <div
                    id="contacts-panel"
                    role="tabpanel"
                    aria-labelledby="contacts-tab"
                  >
                    <KeyContactsPanel dossierId={id} />
                  </div>
                )}

                {/* Other tabs - placeholder */}
                {!['timeline', 'relationships', 'positions', 'mous', 'intelligence', 'contacts'].includes(activeTab) && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p>{t('detail.tab_coming_soon')}</p>
                  </div>
                )}
              </div>
            </div>

          {/* Actions Panel */}
          <DossierActions dossierId={id} />
        </div>
      </main>

      {/* Conflict Dialog - shown when edit conflicts occur */}
      {showConflictDialog && conflictData && dossier && (
        <ConflictDialog
          open={showConflictDialog}
          currentData={dossier}
          remoteData={{} as any}
          onResolve={handleConflictResolve}
        />
      )}
    </div>
  );
}