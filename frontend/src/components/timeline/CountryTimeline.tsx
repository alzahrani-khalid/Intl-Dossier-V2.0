/**
 * CountryTimeline Component
 *
 * Type-specific timeline wrapper for Country dossiers
 * Default event types:
 * - Intelligence reports (primary)
 * - MoU signings
 * - Calendar events (bilateral meetings, state visits)
 * - Documents (treaties, policies)
 * - Relationships (diplomatic ties)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EnhancedVerticalTimeline } from './EnhancedVerticalTimeline';
import { TimelineFilters } from './TimelineFilters';
import { useUnifiedTimeline, getDefaultEventTypes, getAvailableEventTypes } from '@/hooks/useUnifiedTimeline';
import type { TimelineFilters as ITimelineFilters } from '@/types/timeline.types';

interface CountryTimelineProps {
  dossierId: string;
  className?: string;
}

export function CountryTimeline({ dossierId, className }: CountryTimelineProps) {
  const { t } = useTranslation('dossier');
  const [showFilters, setShowFilters] = useState(false);

  // Initialize with default event types for Country dossiers
  const defaultEventTypes = getDefaultEventTypes('Country');
  const availableEventTypes = getAvailableEventTypes('Country');

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
    dossierType: 'Country',
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
      {/* Filters Section */}
      <TimelineFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableEventTypes={availableEventTypes}
        defaultEventTypes={defaultEventTypes}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={refetch}
      />

      {/* Timeline */}
      <EnhancedVerticalTimeline
        events={events}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        onLoadMore={fetchNextPage}
        error={error}
        emptyMessage={t('timeline.empty.country')}
      />
    </div>
  );
}
