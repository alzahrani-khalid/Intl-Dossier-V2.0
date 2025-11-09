/**
 * PositionList Component (T043)
 * Virtual scrolling position list with context filtering and search
 */

import React, { useRef, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { PositionCard } from './PositionCard';
import type { Position } from '@/types/position';

export interface PositionListProps {
 positions: Position[];
 context?: 'dossier' | 'engagement' | 'all' | 'library';
 contextId?: string;
 onPositionClick?: (position: Position) => void;
 onAttach?: (positionId: string) => void;
 onDetach?: (positionId: string) => void;
 isLoading?: boolean;
 emptyMessage?: string;
 hideFilters?: boolean;
 layout?: 'grid' | 'list'; // New prop for layout mode
}

export const PositionList: React.FC<PositionListProps> = ({
 positions,
 context = 'all',
 contextId,
 onPositionClick,
 onAttach,
 onDetach,
 isLoading = false,
 emptyMessage,
 hideFilters = false,
 layout = 'list', // Default to list for backward compatibility
}) => {
 const { t, i18n } = useTranslation('positions');
 const parentRef = useRef<HTMLDivElement>(null);

 // Search and filter state
 const [searchInput, setSearchInput] = useState('');
 const [statusFilter, setStatusFilter] = useState<string>('all');
 const [typeFilter, setTypeFilter] = useState<string>('all');
 const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');

 // Debounced search (300ms)
 const debouncedSearch = useDebouncedValue(searchInput, 300);

 // Filtered positions
 const filteredPositions = useMemo(() => {
 let filtered = [...positions];

 // Search filter
 if (debouncedSearch) {
 const searchLower = debouncedSearch.toLowerCase();
 const lang = i18n.language;
 filtered = filtered.filter((position) => {
 const title = lang === 'ar' ? position.title_ar : position.title_en;
 const content = lang === 'ar' ? position.content_ar : position.content_en;
 return (
 title.toLowerCase().includes(searchLower) ||
 content?.toLowerCase().includes(searchLower)
 );
 });
 }

 // Status filter
 if (statusFilter !== 'all') {
 filtered = filtered.filter((p) => p.status === statusFilter);
 }

 // Type filter
 if (typeFilter !== 'all') {
 filtered = filtered.filter((p) => p.position_type_id === typeFilter);
 }

 // Date range filter
 if (dateRangeFilter !== 'all') {
 const now = new Date();
 const filterDate = new Date();

 switch (dateRangeFilter) {
 case '7d':
 filterDate.setDate(now.getDate() - 7);
 break;
 case '30d':
 filterDate.setDate(now.getDate() - 30);
 break;
 case '90d':
 filterDate.setDate(now.getDate() - 90);
 break;
 }

 filtered = filtered.filter((p) => new Date(p.created_at) >= filterDate);
 }

 return filtered;
 }, [positions, debouncedSearch, statusFilter, typeFilter, dateRangeFilter, i18n.language]);

 // Virtual scrolling setup
 const virtualizer = useVirtualizer({
 count: filteredPositions.length,
 getScrollElement: () => parentRef.current,
 estimateSize: () => 120, // Estimated position card height
 overscan: 5, // Render 5 extra items above/below viewport
 });

 const isRTL = i18n.language === 'ar';

 if (isLoading && positions.length === 0) {
 return layout === 'grid' ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {/* Skeleton loading cards - Grid */}
 {Array.from({ length: 6 }).map((_, i) => (
 <div key={i} className="rounded-lg border bg-card p-4 animate-pulse">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1 space-y-2">
 <div className="h-5 bg-muted rounded w-3/4" />
 <div className="h-4 bg-muted rounded w-1/2" />
 </div>
 <div className="h-6 w-20 bg-muted rounded" />
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="space-y-3">
 {/* Skeleton loading cards - List */}
 {Array.from({ length: 3 }).map((_, i) => (
 <div key={i} className="rounded-lg border bg-card p-4 animate-pulse">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1 space-y-2">
 <div className="h-5 bg-muted rounded w-3/4" />
 <div className="h-4 bg-muted rounded w-1/2" />
 </div>
 <div className="h-6 w-20 bg-muted rounded" />
 </div>
 </div>
 ))}
 </div>
 );
 }

 return (
 <div className="flex flex-col gap-4">
 {/* Search and Filter Controls - only show if not hidden */}
 {!hideFilters && (
 <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
 {/* Search Input */}
 <div className="relative">
 <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`} />
 <Input
 type="search"
 placeholder={t('search.placeholder')}
 value={searchInput}
 onChange={(e) => setSearchInput(e.target.value)}
 className={isRTL ? 'pe-10' : 'ps-10'}
 aria-label={t('search.label')}
 />
 </div>

 {/* Filter Controls */}
 <div className="flex flex-wrap gap-2">
 <Select value={statusFilter} onValueChange={setStatusFilter}>
 <SelectTrigger className="w-[180px]" aria-label={t('filter.status')}>
 <SelectValue placeholder={t('filter.status')} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{t('filter.all')}</SelectItem>
 <SelectItem value="draft">{t('status.draft')}</SelectItem>
 <SelectItem value="under_review">{t('status.under_review')}</SelectItem>
 <SelectItem value="approved">{t('status.approved')}</SelectItem>
 <SelectItem value="published">{t('status.published')}</SelectItem>
 <SelectItem value="unpublished">{t('status.unpublished')}</SelectItem>
 </SelectContent>
 </Select>

 <Select value={typeFilter} onValueChange={setTypeFilter}>
 <SelectTrigger className="w-[180px]" aria-label={t('filter.type')}>
 <SelectValue placeholder={t('filter.type')} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{t('filter.all')}</SelectItem>
 <SelectItem value="policy_brief">{t('type.policy_brief')}</SelectItem>
 <SelectItem value="talking_point">{t('type.talking_point')}</SelectItem>
 <SelectItem value="statement">{t('type.statement')}</SelectItem>
 </SelectContent>
 </Select>

 <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
 <SelectTrigger className="w-[180px]" aria-label={t('filter.dateRange')}>
 <SelectValue placeholder={t('filter.dateRange')} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{t('filter.allTime')}</SelectItem>
 <SelectItem value="7d">{t('filter.last7Days')}</SelectItem>
 <SelectItem value="30d">{t('filter.last30Days')}</SelectItem>
 <SelectItem value="90d">{t('filter.last90Days')}</SelectItem>
 </SelectContent>
 </Select>

 {(statusFilter !== 'all' || typeFilter !== 'all' || dateRangeFilter !== 'all' || searchInput) && (
 <Button
 variant="ghost"
 size="sm"
 onClick={() => {
 setSearchInput('');
 setStatusFilter('all');
 setTypeFilter('all');
 setDateRangeFilter('all');
 }}
 >
 <Filter className="me-2 h-4 w-4" />
 {t('filter.clear')}
 </Button>
 )}
 </div>

 {/* Results count */}
 <p className="text-sm text-muted-foreground">
 {t('results.count', { count: filteredPositions.length, total: positions.length })}
 </p>
 </div>
 )}

 {/* Position Display - Grid or Virtual Scrolling List */}
 {filteredPositions.length === 0 ? (
 <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
 <p className="text-center text-muted-foreground">
 {emptyMessage || t('empty.noResults')}
 </p>
 {!hideFilters && (statusFilter !== 'all' || typeFilter !== 'all' || dateRangeFilter !== 'all' || searchInput) && (
 <Button
 variant="link"
 onClick={() => {
 setSearchInput('');
 setStatusFilter('all');
 setTypeFilter('all');
 setDateRangeFilter('all');
 }}
 className="mt-2"
 >
 {t('empty.clearFilters')}
 </Button>
 )}
 </div>
 ) : layout === 'grid' ? (
 // Grid Layout
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label={t('list.label')}>
 {filteredPositions.map((position, index) => (
 <div key={position.id} role="listitem" aria-posinset={index + 1} aria-setsize={filteredPositions.length}>
 <PositionCard
 position={position}
 onClick={() => onPositionClick?.(position)}
 onAttach={onAttach ? () => onAttach(position.id) : undefined}
 onDetach={onDetach ? () => onDetach(position.id) : undefined}
 context={context}
 />
 </div>
 ))}
 </div>
 ) : (
 // Virtual Scrolling List Layout
 <div
 ref={parentRef}
 className="relative h-[600px] overflow-auto rounded-lg border"
 role="list"
 aria-label={t('list.label')}
 >
 <div
 style={{
 height: `${virtualizer.getTotalSize()}px`,
 width: '100%',
 position: 'relative',
 }}
 >
 {virtualizer.getVirtualItems().map((virtualItem) => {
 const position = filteredPositions[virtualItem.index];
 return (
 <div
 key={virtualItem.key}
 style={{
 position: 'absolute',
 top: 0,
 left: 0,
 width: '100%',
 height: `${virtualItem.size}px`,
 transform: `translateY(${virtualItem.start}px)`,
 }}
 role="listitem"
 aria-posinset={virtualItem.index + 1}
 aria-setsize={filteredPositions.length}
 >
 <PositionCard
 position={position}
 onClick={() => onPositionClick?.(position)}
 onAttach={onAttach ? () => onAttach(position.id) : undefined}
 onDetach={onDetach ? () => onDetach(position.id) : undefined}
 context={context}
 />
 </div>
 );
 })}
 </div>
 </div>
 )}
 </div>
 );
};
