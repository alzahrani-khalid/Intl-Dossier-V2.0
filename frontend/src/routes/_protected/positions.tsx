/**
 * Standalone Positions Library (T055)
 *
 * Global positions library accessible from all accessible dossiers
 * Features: Advanced search, multi-filter, analytics dashboard, quick navigation
 * Integration: Top-level navigation route
 */

import { createFileRoute, Link, Outlet, useMatches } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePositions } from '../../hooks/usePositions';
import { PositionList } from '../../components/positions/PositionList';
import { AttachPositionDialog } from '../../components/positions/AttachPositionDialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { FileText, Plus, TrendingUp, Search } from 'lucide-react';
import type { PositionStatus, PositionType } from '../../types/position';

// Search params for filters
interface PositionsSearchParams {
 search?: string;
 status?: PositionStatus;
 type?: PositionType;
 sort?: 'title' | 'updated_at' | 'created_at' | 'popularity';
 order?: 'asc' | 'desc';
}

export const Route = createFileRoute('/_protected/positions')({
 component: () => <Outlet />,
 validateSearch: (search: Record<string, unknown>): PositionsSearchParams => {
 return {
 search: search.search as string | undefined,
 status: search.status as PositionStatus | undefined,
 type: search.type as PositionType | undefined,
 sort: (search.sort as any) || 'updated_at',
 order: (search.order as any) || 'desc',
 };
 },
});

export function PositionsLibraryPage() {
 const { t } = useTranslation(['positions', 'common']);
 const navigate = Route.useNavigate();
 const searchParams = Route.useSearch();

 // Local state for filters
 const [searchQuery, setSearchQuery] = useState(searchParams.search || '');
 const [statusFilter, setStatusFilter] = useState<PositionStatus | 'all'>(
 searchParams.status || 'all'
 );
 const [typeFilter, setTypeFilter] = useState<PositionType | 'all'>(
 searchParams.type || 'all'
 );
 const [sortBy, setSortBy] = useState(searchParams.sort || 'updated_at');
 const [sortOrder, setSortOrder] = useState(searchParams.order || 'desc');
 const [showCreateDialog, setShowCreateDialog] = useState(false);

 // Debounce search input
 const debouncedSearch = useDebouncedValue(searchQuery, 300);

 // Fetch positions with filters
 const { data, isLoading, error } = usePositions({
 search: debouncedSearch,
 status: statusFilter === 'all' ? undefined : statusFilter,
 type: typeFilter === 'all' ? undefined : typeFilter,
 sort: sortBy,
 order: sortOrder,
 });

 const positions = useMemo(() => data?.pages?.[0]?.data || [], [data]);
 const totalCount = data?.pages?.[0]?.total || 0;
 const stats = {
 total: totalCount,
 byStatus: {},
 byType: {},
 };

 // Update URL when filters change
 const updateFilters = (updates: Partial<PositionsSearchParams>) => {
 navigate({
 search: {
 ...searchParams,
 ...updates,
 } as any,
 replace: true,
 });
 };

 // Handler for clearing filters
 const handleClearFilters = () => {
 setSearchQuery('');
 setStatusFilter('all');
 setTypeFilter('all');
 updateFilters({ search: undefined, status: undefined, type: undefined });
 };

 const hasActiveFilters =
 searchQuery ||
 statusFilter !== 'all' ||
 typeFilter !== 'all' ||
 sortBy !== 'updated_at';

 return (
 <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
 {/* Page Header */}
 <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div className="space-y-1">
 <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
 <FileText className="h-8 w-8" />
 {t('positions:library.title')}
 </h1>
 <p className="text-gray-500 dark:text-gray-400">
 {t('positions:library.subtitle', { count: totalCount })}
 </p>
 </div>
 <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
 <Plus className="h-5 w-5" />
 {t('positions:library.create_position')}
 </Button>
 </div>

 {/* Quick Stats */}
 <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
 <Card>
 <CardHeader className="pb-2">
 <CardDescription className="text-xs">
 {t('positions:library.stats.total')}
 </CardDescription>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{stats.total}</div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2">
 <CardDescription className="text-xs">
 {t('positions:library.stats.published')}
 </CardDescription>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-green-600 dark:text-green-400">
 {stats.byStatus?.published || 0}
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2">
 <CardDescription className="text-xs">
 {t('positions:library.stats.in_review')}
 </CardDescription>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
 {stats.byStatus?.review || 0}
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2">
 <CardDescription className="text-xs">
 {t('positions:library.stats.drafts')}
 </CardDescription>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
 {stats.byStatus?.draft || 0}
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 </div>

 {/* Main Content */}
 <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 {/* Search and Filters */}
 <Card className="mb-6">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Search className="h-5 w-5" />
 {t('positions:library.search_and_filter')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
 {/* Search Input */}
 <div className="lg:col-span-2">
 <Input
 type="search"
 placeholder={t('positions:library.search_placeholder')}
 value={searchQuery}
 onChange={(e) => {
 setSearchQuery(e.target.value);
 updateFilters({ search: e.target.value || undefined });
 }}
 className="w-full"
 aria-label={t('positions:library.search_label')}
 />
 </div>

 {/* Status Filter */}
 <div>
 <Select
 value={statusFilter}
 onValueChange={(value) => {
 const newStatus = value as PositionStatus | 'all';
 setStatusFilter(newStatus);
 updateFilters({ status: newStatus === 'all' ? undefined : newStatus });
 }}
 >
 <SelectTrigger aria-label={t('positions:library.status_filter')}>
 <SelectValue placeholder={t('positions:library.all_statuses')} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{t('positions:library.all_statuses')}</SelectItem>
 <SelectItem value="draft">{t('positions:status.draft')}</SelectItem>
 <SelectItem value="review">{t('positions:status.review')}</SelectItem>
 <SelectItem value="approved">{t('positions:status.approved')}</SelectItem>
 <SelectItem value="published">{t('positions:status.published')}</SelectItem>
 <SelectItem value="archived">{t('positions:status.archived')}</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Type Filter */}
 <div>
 <Select
 value={typeFilter}
 onValueChange={(value) => {
 const newType = value as PositionType | 'all';
 setTypeFilter(newType);
 updateFilters({ type: newType === 'all' ? undefined : newType });
 }}
 >
 <SelectTrigger aria-label={t('positions:library.type_filter')}>
 <SelectValue placeholder={t('positions:library.all_types')} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{t('positions:library.all_types')}</SelectItem>
 <SelectItem value="statement">{t('positions:type.statement')}</SelectItem>
 <SelectItem value="brief">{t('positions:type.brief')}</SelectItem>
 <SelectItem value="talking_points">
 {t('positions:type.talking_points')}
 </SelectItem>
 <SelectItem value="q_and_a">{t('positions:type.q_and_a')}</SelectItem>
 <SelectItem value="guidance">{t('positions:type.guidance')}</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Sort By */}
 <div>
 <Select
 value={sortBy}
 onValueChange={(value) => {
 setSortBy(value);
 updateFilters({ sort: value as any });
 }}
 >
 <SelectTrigger aria-label={t('positions:library.sort_by')}>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="updated_at">
 {t('positions:library.sort.updated')}
 </SelectItem>
 <SelectItem value="created_at">
 {t('positions:library.sort.created')}
 </SelectItem>
 <SelectItem value="title">{t('positions:library.sort.title')}</SelectItem>
 <SelectItem value="popularity">
 {t('positions:library.sort.popularity')}
 </SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>

 {/* Clear Filters Button */}
 {hasActiveFilters && (
 <div className="mt-4 flex justify-end">
 <Button
 variant="ghost"
 size="sm"
 onClick={handleClearFilters}
 aria-label={t('positions:library.clear_filters')}
 >
 {t('common:clear_filters')}
 </Button>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Positions List */}
 {error ? (
 <div
 className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center"
 role="alert"
 >
 <p className="text-sm text-red-700 dark:text-red-300">
 {error instanceof Error ? error.message : t('positions:library.error_loading')}
 </p>
 </div>
 ) : (
 <PositionList
 positions={positions}
 isLoading={isLoading}
 context="library"
 layout="grid"
 onPositionClick={(position) => {
 navigate({ to: '/positions/$positionId', params: { positionId: position.id } });
 }}
 emptyMessage={
 hasActiveFilters
 ? t('positions:library.no_results')
 : t('positions:library.no_positions')
 }
 />
 )}
 </main>

 {/* Create Position Dialog */}
 {showCreateDialog && (
 <AttachPositionDialog
 open={showCreateDialog}
 onClose={() => setShowCreateDialog(false)}
 context="library"
 />
 )}
 </div>
 );
}
