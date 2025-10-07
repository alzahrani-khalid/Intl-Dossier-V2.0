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
import { DossierHeader } from '../../../components/DossierHeader';
import { DossierStats } from '../../../components/DossierStats';
import { DossierTimeline } from '../../../components/DossierTimeline';
import { DossierActions } from '../../../components/DossierActions';
import { KeyContactsPanel } from '../../../components/KeyContactsPanel';
import { ConflictDialog } from '../../../components/ConflictDialog';
import { DossierPositionsTab } from '../../../components/positions/DossierPositionsTab';
import type { ConflictError } from '../../../types/dossier';

// Search params for tabs
interface DossierDetailSearchParams {
  tab?: string;
}

export const Route = createFileRoute('/_protected/dossiers/$id')({
  component: DossierDetailPage,
  validateSearch: (search: Record<string, unknown>): DossierDetailSearchParams => {
    return {
      tab: search.tab as string | undefined,
    };
  },
});

type TabType = 'timeline' | 'positions' | 'mous' | 'commitments' | 'files' | 'intelligence';

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
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
            role="alert"
          >
            <h2 className="text-lg font-medium text-red-800 dark:text-red-200">
              {error instanceof Error && error.message.includes('404')
                ? t('detail.not_found_title')
                : t('detail.error_title')}
            </h2>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              {error instanceof Error ? error.message : t('detail.error_generic')}
            </p>
            <button
              onClick={() => navigate({ to: '/dossiers' })}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {t('detail.back_to_hub')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dossier) return null;

  // Tab definitions
  const tabs: Array<{ id: TabType; label: string; disabled?: boolean }> = [
    { id: 'timeline', label: t('tabs.timeline') },
    { id: 'positions', label: t('tabs.positions') },
    { id: 'mous', label: t('tabs.mous'), disabled: true },
    { id: 'commitments', label: t('tabs.commitments'), disabled: true },
    { id: 'files', label: t('tabs.files'), disabled: true },
    { id: 'intelligence', label: t('tabs.intelligence'), disabled: true },
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            {dossier.stats && (
              <div>
                <DossierStats stats={dossier.stats} />
              </div>
            )}

            {/* Tabs Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav
                  className="-mb-px flex space-x-8 px-6"
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
                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                        ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }
                        ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                      `}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Panels */}
              <div className="p-6">
                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                  <div
                    id="timeline-panel"
                    role="tabpanel"
                    aria-labelledby="timeline-tab"
                  >
                    <DossierTimeline dossierId={id} />
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

                {/* Other tabs - placeholder */}
                {activeTab !== 'timeline' && activeTab !== 'positions' && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p>{t('detail.tab_coming_soon')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Panel */}
            <DossierActions dossierId={id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Contacts Panel */}
            <KeyContactsPanel dossierId={id} />

            {/* Recent Briefs */}
            {dossier.recent_briefs && dossier.recent_briefs.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {t('detail.recent_briefs_title')}
                </h3>
                <div className="space-y-3">
                  {dossier.recent_briefs.slice(0, 3).map((brief) => (
                    <div
                      key={brief.id}
                      className="border-l-4 border-blue-500 ps-4 py-2"
                    >
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(brief.generated_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                        {brief.summary_en}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => console.log('View all briefs for dossier', id)}
                  className="mt-4 w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {t('detail.view_all_briefs')}
                </button>
              </div>
            )}
          </div>
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