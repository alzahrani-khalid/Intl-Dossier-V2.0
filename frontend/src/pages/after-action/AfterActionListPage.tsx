/**
 * After-Action List Page
 * Feature: 022-after-action-structured
 *
 * Page for listing after-action records for a dossier with filtering
 * by status and pagination support.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from '@tanstack/react-router';
import { useAfterActionList } from '@/hooks/use-after-action';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
 AlertCircle,
 Loader2,
 Plus,
 Search,
 FileText,
 Calendar,
 User,
 Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function AfterActionListPage() {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();

 // Get dossier_id from URL params
 const dossierId = searchParams.get('dossier_id');

 // Filter state
 const [statusFilter, setStatusFilter] = useState<string>('all');
 const [searchQuery, setSearchQuery] = useState('');
 const [page, setPage] = useState(1);
 const pageSize = 10;

 // Fetch after-actions list
 const {
 data: afterActionsData,
 isLoading,
 error,
 } = useAfterActionList({
 dossier_id: dossierId,
 status: statusFilter !== 'all' ? statusFilter : undefined,
 search: searchQuery || undefined,
 page,
 limit: pageSize,
 });

 const afterActions = afterActionsData?.data || [];
 const totalCount = afterActionsData?.total || 0;
 const totalPages = Math.ceil(totalCount / pageSize);

 const getStatusColor = (status: string) => {
 switch (status) {
 case 'draft':
 return 'bg-gray-100 text-gray-800';
 case 'published':
 return 'bg-green-100 text-green-800';
 case 'edit_pending':
 return 'bg-yellow-100 text-yellow-800';
 default:
 return 'bg-gray-100 text-gray-800';
 }
 };

 const handleCreateNew = () => {
 navigate({
 to: '/after-actions/create',
 search: { dossier_id: dossierId },
 });
 };

 const handleViewAfterAction = (id: string) => {
 navigate({
 to: `/after-actions/${id}`,
 });
 };

 // Loading state
 if (isLoading && page === 1) {
 return (
 <div
 className={cn(
 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl',
 isRTL && 'rtl'
 )}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <div className="flex items-center justify-center min-h-[400px]">
 <Loader2 className="h-8 w-8 animate-spin text-primary" />
 </div>
 </div>
 );
 }

 // Error state
 if (error) {
 return (
 <div
 className={cn(
 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl',
 isRTL && 'rtl'
 )}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <Alert variant="destructive">
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>
 {t('afterActions.list.errorLoading')}
 </AlertDescription>
 </Alert>
 </div>
 );
 }

 return (
 <div
 className={cn(
 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl',
 isRTL && 'rtl'
 )}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 {/* Page Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
 <div>
 <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-start">
 {t('afterActions.list.title')}
 </h1>
 <p className="text-sm sm:text-base text-muted-foreground mt-2 text-start">
 {t('afterActions.list.subtitle', { count: totalCount })}
 </p>
 </div>

 {/* Create Button */}
 {dossierId && (
 <Button
 variant="default"
 onClick={handleCreateNew}
 className=" px-4 sm:px-6"
 >
 <Plus className="h-4 w-4 me-2" />
 {t('afterActions.list.createNew')}
 </Button>
 )}
 </div>

 {/* Filters */}
 <Card className="mb-6">
 <CardContent className="pt-6">
 <div className="flex flex-col sm:flex-row gap-4">
 {/* Search */}
 <div className="flex-1">
 <div className="relative">
 <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 type="text"
 placeholder={t('afterActions.list.searchPlaceholder')}
 value={searchQuery}
 onChange={(e) => {
 setSearchQuery(e.target.value);
 setPage(1); // Reset to first page on search
 }}
 className="ps-10"
 />
 </div>
 </div>

 {/* Status Filter */}
 <div className="w-full sm:w-48">
 <Select
 value={statusFilter}
 onValueChange={(value) => {
 setStatusFilter(value);
 setPage(1); // Reset to first page on filter
 }}
 >
 <SelectTrigger>
 <Filter className="h-4 w-4 me-2" />
 <SelectValue placeholder={t('afterActions.list.filterByStatus')} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{t('afterActions.list.allStatuses')}</SelectItem>
 <SelectItem value="draft">{t('afterActions.status.draft')}</SelectItem>
 <SelectItem value="published">{t('afterActions.status.published')}</SelectItem>
 <SelectItem value="edit_pending">{t('afterActions.status.edit_pending')}</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* After-Actions List */}
 {afterActions.length === 0 ? (
 <Card>
 <CardContent className="py-12 text-center">
 <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
 <p className="text-muted-foreground mb-4">
 {searchQuery || statusFilter !== 'all'
 ? t('afterActions.list.noResultsFound')
 : t('afterActions.list.noAfterActions')}
 </p>
 {dossierId && !searchQuery && statusFilter === 'all' && (
 <Button variant="default" onClick={handleCreateNew}>
 <Plus className="h-4 w-4 me-2" />
 {t('afterActions.list.createFirst')}
 </Button>
 )}
 </CardContent>
 </Card>
 ) : (
 <div className="space-y-4">
 {afterActions.map((afterAction: any) => (
 <Card
 key={afterAction.id}
 className="cursor-pointer hover:shadow-md transition-shadow"
 onClick={() => handleViewAfterAction(afterAction.id)}
 >
 <CardHeader>
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1">
 <CardTitle className="text-lg sm:text-xl text-start">
 {afterAction.title}
 </CardTitle>
 {afterAction.description && (
 <p className="text-sm text-muted-foreground mt-2 text-start line-clamp-2">
 {afterAction.description}
 </p>
 )}
 </div>
 <Badge className={getStatusColor(afterAction.status)}>
 {t(`afterActions.status.${afterAction.status}`)}
 </Badge>
 </div>
 </CardHeader>
 <CardContent>
 <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
 {/* Creator */}
 <div className="flex items-center gap-1">
 <User className="h-4 w-4" />
 <span>{afterAction.created_by_name}</span>
 </div>

 {/* Created Date */}
 <div className="flex items-center gap-1">
 <Calendar className="h-4 w-4" />
 <span>{format(new Date(afterAction.created_at), 'PP')}</span>
 </div>

 {/* Counts */}
 {afterAction.decisions_count > 0 && (
 <Badge variant="outline">
 {t('afterActions.list.decisionsCount', { count: afterAction.decisions_count })}
 </Badge>
 )}
 {afterAction.commitments_count > 0 && (
 <Badge variant="outline">
 {t('afterActions.list.commitmentsCount', { count: afterAction.commitments_count })}
 </Badge>
 )}
 {afterAction.risks_count > 0 && (
 <Badge variant="outline">
 {t('afterActions.list.risksCount', { count: afterAction.risks_count })}
 </Badge>
 )}
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 )}

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="flex items-center justify-center gap-2 mt-6">
 <Button
 variant="outline"
 onClick={() => setPage(Math.max(1, page - 1))}
 disabled={page === 1 || isLoading}
 >
 {t('afterActions.list.previous')}
 </Button>
 <span className="text-sm text-muted-foreground px-4">
 {t('afterActions.list.pageInfo', { current: page, total: totalPages })}
 </span>
 <Button
 variant="outline"
 onClick={() => setPage(Math.min(totalPages, page + 1))}
 disabled={page === totalPages || isLoading}
 >
 {t('afterActions.list.next')}
 </Button>
 </div>
 )}
 </div>
 );
}

export default AfterActionListPage;
