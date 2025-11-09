/**
 * EngagementTimeline Component
 *
 * Type-specific timeline wrapper for Engagement dossiers
 * Default event types:
 * - Calendar events (primary) - event schedule, sessions
 * - Commitments - action items
 * - Decisions - outcomes
 * - Documents - agendas, minutes
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EnhancedVerticalTimeline } from './EnhancedVerticalTimeline';
import { TimelineFilters } from './TimelineFilters';
import { useUnifiedTimeline, getDefaultEventTypes, getAvailableEventTypes } from '@/hooks/useUnifiedTimeline';
import type { TimelineFilters as ITimelineFilters } from '@/types/timeline.types';

interface EngagementTimelineProps {
  dossierId: string;
  className?: string;
}

export function EngagementTimeline({ dossierId, className }: EngagementTimelineProps) {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);

  const defaultEventTypes = getDefaultEventTypes('Engagement');
  const availableEventTypes = getAvailableEventTypes('Engagement');

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
    dossierType: 'Engagement',
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
        emptyMessage={t('timeline.empty.engagement')}
      />
    </div>
  );
}
