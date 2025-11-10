/**
 * OrganizationTimeline Component
 *
 * Type-specific timeline wrapper for Organization dossiers
 * Default event types:
 * - Dossier interactions (primary) - meetings, calls, emails
 * - MoU signings
 * - Calendar events
 * - Documents (agreements, reports)
 * - Relationships (partnerships, affiliations)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EnhancedVerticalTimeline } from './EnhancedVerticalTimeline';
import { TimelineFilters } from './TimelineFilters';
import { useUnifiedTimeline, getDefaultEventTypes, getAvailableEventTypes } from '@/hooks/useUnifiedTimeline';
import type { TimelineFilters as ITimelineFilters } from '@/types/timeline.types';

interface OrganizationTimelineProps {
  dossierId: string;
  className?: string;
}

export function OrganizationTimeline({ dossierId, className }: OrganizationTimelineProps) {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);

  const defaultEventTypes = getDefaultEventTypes('Organization');
  const availableEventTypes = getAvailableEventTypes('Organization');

  const {
    events,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    fetchNextPage,
    refetch,
    filters,
    setFilters,
  } = useUnifiedTimeline({
    dossierId,
    dossierType: 'Organization',
    initialFilters: {
      event_types: defaultEventTypes,
    },
    itemsPerPage: 20,
    enableRealtime: false,
  });

  const handleFiltersChange = (newFilters: ITimelineFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className={className}>
      <TimelineFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableEventTypes={availableEventTypes}
        defaultEventTypes={defaultEventTypes}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={refetch}
      />

      <EnhancedVerticalTimeline
        events={events}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        onLoadMore={fetchNextPage}
        error={error}
        emptyMessage={t('timeline.empty.organization')}
      />
    </div>
  );
}
