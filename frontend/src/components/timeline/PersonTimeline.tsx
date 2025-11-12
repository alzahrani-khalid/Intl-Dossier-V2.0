/**
 * PersonTimeline Component
 *
 * Type-specific timeline wrapper for Person dossiers
 * Default event types:
 * - Dossier interactions (primary) - meetings, calls, emails
 * - Positions - career progression
 * - Calendar events - participation in events
 * - Relationships - network growth
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EnhancedVerticalTimeline } from './EnhancedVerticalTimeline';
import { TimelineFilters } from './TimelineFilters';
import { useUnifiedTimeline, getDefaultEventTypes, getAvailableEventTypes } from '@/hooks/useUnifiedTimeline';
import type { TimelineFilters as ITimelineFilters } from '@/types/timeline.types';

interface PersonTimelineProps {
  dossierId: string;
  className?: string;
}

export function PersonTimeline({ dossierId, className }: PersonTimelineProps) {
  const { t } = useTranslation('dossier');
  const [showFilters, setShowFilters] = useState(false);

  const defaultEventTypes = getDefaultEventTypes('Person');
  const availableEventTypes = getAvailableEventTypes('Person');

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
    dossierType: 'Person',
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
        emptyMessage={t('timeline.empty.person')}
      />
    </div>
  );
}
