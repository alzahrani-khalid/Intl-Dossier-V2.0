import { useTranslation } from 'react-i18next';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from './ui/popover';
import { Calendar, FileText, MessageSquare, Handshake, CheckCircle, Lightbulb, Link2, X, Filter, ChevronDown } from 'lucide-react';
import type { TimelineEvent } from '../types/dossier';

interface DossierTimelineProps {
 dossierId: string;
 events?: TimelineEvent[];
 isLoading?: boolean;
 isFetchingNextPage?: boolean;
 hasNextPage?: boolean;
 onLoadMore?: () => void;
 activeFilter?: string;
}

export function DossierTimeline({
 dossierId,
 events = [],
 isLoading,
 isFetchingNextPage,
 hasNextPage,
 onLoadMore,
 activeFilter,
}: DossierTimelineProps) {
 const { t, i18n } = useTranslation('dossiers');
 const isRTL = i18n.language === 'ar';
 const navigate = useNavigate();

 // Parse active filter into array (supports comma-separated values)
 const selectedFilters = activeFilter ? activeFilter.split(',') : [];

 // Available event types (only types with actual data sources)
 // Note: Documents and Intelligence are attached TO events, not standalone timeline entries
 const eventTypes = [
 // From engagements table
 { value: 'engagement', label: t('timeline.types.engagement', 'Engagement') },

 // From calendar_entries table
 { value: 'internal_meeting', label: t('timeline.types.internal_meeting', 'Internal Meeting') },
 { value: 'deadline', label: t('timeline.types.deadline', 'Deadline') },
 { value: 'reminder', label: t('timeline.types.reminder', 'Reminder') },
 { value: 'holiday', label: t('timeline.types.holiday', 'Holiday') },
 { value: 'training', label: t('timeline.types.training', 'Training') },
 { value: 'review', label: t('timeline.types.review', 'Review') },
 { value: 'forum', label: t('timeline.types.forum', 'Forum') },
 { value: 'other', label: t('timeline.types.other', 'Other') },
 ];

 // Intersection observer for infinite scroll
 const { ref: loadMoreRef } = useInView({
 onChange: (inView) => {
 if (inView && hasNextPage && !isFetchingNextPage && onLoadMore) {
 onLoadMore();
 }
 },
 threshold: 0.1,
 });

 // Handler to clear all filters
 const handleClearFilter = () => {
 navigate({
 search: (prev: any) => ({
 ...prev,
 event_type: undefined,
 }),
 replace: true,
 });
 };

 // Handler to toggle a filter
 const handleToggleFilter = (value: string) => {
 const newFilters = selectedFilters.includes(value)
 ? selectedFilters.filter(f => f !== value)
 : [...selectedFilters, value];

 navigate({
 search: (prev: any) => ({
 ...prev,
 event_type: newFilters.length > 0 ? newFilters.join(',') : undefined,
 }),
 replace: true,
 });
 };

 // Get icon based on event type
 const getEventIcon = (type: string) => {
 switch (type) {
 case 'engagement':
 return <Calendar className="size-4" />;
 case 'position':
 return <MessageSquare className="size-4" />;
 case 'mou':
 return <Handshake className="size-4" />;
 case 'commitment':
 return <CheckCircle className="size-4" />;
 case 'document':
 return <FileText className="size-4" />;
 case 'intelligence':
 return <Lightbulb className="size-4" />;
 case 'relationship':
 return <Link2 className="size-4" />;
 default:
 return null;
 }
 };

 // Get badge color based on event type with distinct, vibrant colors
 const getEventBadgeClass = (type: string): string => {
 switch (type) {
 // Engagement events - Blue (primary activity)
 case 'engagement':
 return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';

 // Calendar entry types - Each with unique, vibrant color
 case 'internal_meeting':
 return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';
 case 'deadline':
 return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
 case 'reminder':
 return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
 case 'holiday':
 return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
 case 'training':
 return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
 case 'review':
 return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
 case 'forum':
 return 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200';
 case 'other':
 return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';

 default:
 return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
 }
 };

 // Subscribe to Realtime updates for relationship events
 useEffect(() => {
 if (!dossierId) return;

 // Subscribe to dossier_relationships table
 const channel = supabase
 .channel(`dossier_relationships:${dossierId}`)
 .on(
 'postgres_changes',
 {
 event: 'INSERT',
 schema: 'public',
 table: 'dossier_relationships',
 filter: `parent_dossier_id=eq.${dossierId},child_dossier_id=eq.${dossierId}`,
 },
 () => {
 // Debounce invalidation to avoid too many refetches
 const timeoutId = setTimeout(() => {
 // Trigger refetch by calling onLoadMore if available
 // In practice, this would call queryClient.invalidateQueries(['timeline', dossierId])
 // but we're keeping it simple here
 if (onLoadMore) {
 onLoadMore();
 }
 }, 500);

 return () => clearTimeout(timeoutId);
 }
 )
 .subscribe();

 return () => {
 supabase.removeChannel(channel);
 };
 }, [dossierId, onLoadMore]);

 // Loading skeleton
 if (isLoading) {
 return (
 <div className="space-y-4" role="status" aria-label={t('loading')}>
 {[...Array(5)].map((_, index) => (
 <div key={index} className="flex gap-4">
 <Skeleton className="size-10 shrink-0 rounded-full" />
 <div className="flex-1 space-y-2">
 <Skeleton className="h-4 w-1/4" />
 <Skeleton className="h-4 w-3/4" />
 <Skeleton className="h-3 w-1/2" />
 </div>
 </div>
 ))}
 </div>
 );
 }

 // Empty state
 if (!events || events.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center py-12 text-center">
 <Calendar className="mb-4 size-12 text-muted-foreground" />
 <h3 className="text-lg font-medium">{t('timeline.empty')}</h3>
 </div>
 );
 }

 return (
 <div
 className="space-y-6"
 role="feed"
 aria-label={t('timeline.title')}
 aria-live="polite"
 aria-busy={isFetchingNextPage}
 >
 {/* Compact Multi-Select Filter */}
 <div className="flex items-center justify-end">
 <Popover>
 <PopoverTrigger asChild>
 <Button
 variant="outline"
 size="sm"
 className="h-8 gap-2 text-xs"
 aria-label={t('timeline.selectFilter', 'Select event type filters')}
 >
 <Filter className="size-3" aria-hidden="true" />
 {selectedFilters.length > 0
 ? `${selectedFilters.length} ${t('timeline.filtersSelected', 'selected')}`
 : t('timeline.filterBy', 'Filter')}
 <ChevronDown className="size-3" aria-hidden="true" />
 </Button>
 </PopoverTrigger>
 <PopoverContent className="w-56 p-3" align="end">
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-sm font-medium">
 {t('timeline.filterBy', 'Filter events')}
 </span>
 {selectedFilters.length > 0 && (
 <Button
 variant="ghost"
 size="sm"
 className="h-auto px-2 py-1 text-xs"
 onClick={handleClearFilter}
 >
 {t('timeline.clearAll', 'Clear all')}
 </Button>
 )}
 </div>
 <div className="space-y-2">
 {eventTypes.map((type) => (
 <div key={type.value} className="flex items-center space-x-2">
 <Checkbox
 id={`filter-${type.value}`}
 checked={selectedFilters.includes(type.value)}
 onCheckedChange={() => handleToggleFilter(type.value)}
 />
 <label
 htmlFor={`filter-${type.value}`}
 className="flex-1 cursor-pointer text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
 >
 {type.label}
 </label>
 </div>
 ))}
 </div>
 </div>
 </PopoverContent>
 </Popover>
 </div>

 {/* Active Filter Display */}
 {selectedFilters.length > 0 && (
 <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
 <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
 {t('timeline.activeFilter', 'Filtered by')}:
 </span>
 {selectedFilters.map((filter) => (
 <Badge
 key={filter}
 className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
 aria-label={`${t('timeline.filter')}: ${t(`timeline.types.${filter}`)}`}
 >
 {t(`timeline.types.${filter}`)}
 </Badge>
 ))}
 <button
 onClick={handleClearFilter}
 className="ms-auto flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-200 dark:hover:bg-blue-800"
 aria-label={t('timeline.clearFilter', 'Clear all filters')}
 >
 <X className="size-4" />
 {t('timeline.clearFilter', 'Clear')}
 </button>
 </div>
 )}

 {events.map((event, index) => {
 const title = isRTL ? event.event_title_ar : event.event_title_en;
 const description = isRTL
 ? event.event_description_ar
 : event.event_description_en;
 const eventDate = new Date(event.event_date);

 return (
 <article
 key={`${event.event_type}-${event.source_id}-${index}`}
 className="group flex gap-4"
 role="article"
 aria-label={`${t(`timeline.types.${event.event_type}`)}: ${title}`}
 >
 {/* Timeline dot and line */}
 <div className="flex shrink-0 flex-col items-center">
 <div
 className={`flex size-10 items-center justify-center rounded-full ${getEventBadgeClass(event.event_type)}`}
 aria-hidden="true"
 >
 {getEventIcon(event.event_type)}
 </div>
 {index < events.length - 1 && (
 <div className="mt-2 h-full w-px bg-border" aria-hidden="true" />
 )}
 </div>

 {/* Event content */}
 <div className="min-w-0 flex-1 pb-8">
 <div className="mb-2 flex items-start justify-between gap-2">
 <div className="min-w-0 flex-1">
 <Badge
 className={`${getEventBadgeClass(event.event_type)} mb-2`}
 aria-label={t(`timeline.types.${event.event_type}`)}
 >
 {t(`timeline.types.${event.event_type}`)}
 </Badge>
 <h3 className="mb-1 break-words text-base font-semibold leading-tight">
 {title}
 </h3>
 </div>
 <time
 dateTime={event.event_date}
 className="shrink-0 whitespace-nowrap text-sm text-muted-foreground"
 >
 {eventDate.toLocaleDateString(i18n.language, {
 year: 'numeric',
 month: 'short',
 day: 'numeric',
 })}
 </time>
 </div>

 {description && (
 <p className="break-words text-sm text-muted-foreground">
 {description}
 </p>
 )}

 {/* Metadata badges */}
 {event.metadata && Object.keys(event.metadata).length > 0 && (
 <div className="mt-2 flex flex-wrap gap-2">
 {Object.entries(event.metadata).map(([key, value]) => {
 if (value && typeof value === 'string') {
 // Translate engagement_type
 const displayValue = key === 'engagement_type'
 ? t(`timeline.engagementTypes.${value}`, value)
 : value;

 return (
 <Badge
 key={key}
 variant="outline"
 className="text-xs"
 aria-label={`${key}: ${displayValue}`}
 >
 {displayValue}
 </Badge>
 );
 }
 return null;
 })}
 </div>
 )}
 </div>
 </article>
 );
 })}

 {/* Load more trigger */}
 {hasNextPage && (
 <div
 ref={loadMoreRef}
 className="flex justify-center py-4"
 role="status"
 aria-label={isFetchingNextPage ? t('loading') : t('timeline.loadMore')}
 >
 {isFetchingNextPage ? (
 <div className="space-y-2">
 <Skeleton className="h-10 w-32" />
 <Skeleton className="h-4 w-24" />
 </div>
 ) : (
 <div className="text-sm text-muted-foreground">
 {t('timeline.loadMore')}
 </div>
 )}
 </div>
 )}
 </div>
 );
}