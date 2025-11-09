/**
 * AssignmentQueue Component - Assignment Engine
 *
 * Displays assignment queue with real-time updates and filtering.
 * Features:
 * - Table view with work item details, priority, required skills, queue position
 * - Real-time updates via Supabase Realtime (queue count and positions)
 * - Filters: priority, work_item_type, unit_id
 * - Pagination with page size selector
 * - Bilingual support (Arabic/English)
 *
 * @see specs/013-assignment-engine-sla/tasks.md#T054
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssignmentQueue } from '@/hooks/useAssignmentQueue';
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from '@/components/ui/table';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AssignmentQueueProps {
 unitId?: string;
 className?: string;
}

export function AssignmentQueue({ unitId, className }: AssignmentQueueProps) {
 const { t, i18n } = useTranslation(['assignments', 'common']);

 // Filters
 const [priorityFilter, setPriorityFilter] = useState<
 'urgent' | 'high' | 'normal' | 'low' | undefined
 >(undefined);
 const [workItemTypeFilter, setWorkItemTypeFilter] = useState<
 'ticket' | 'dossier' | undefined
 >(undefined);

 // Pagination
 const [page, setPage] = useState(1);
 const [pageSize, setPageSize] = useState(10);

 // Fetch queue with filters
 const { data, isLoading, isError, error } = useAssignmentQueue({
 priority: priorityFilter,
 work_item_type: workItemTypeFilter,
 unit_id: unitId,
 page,
 page_size: pageSize,
 });

 // Priority badge color
 const getPriorityColor = (priority: string): string => {
 switch (priority) {
 case 'urgent':
 return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
 case 'high':
 return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
 case 'normal':
 return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
 case 'low':
 return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
 default:
 return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
 }
 };

 // Work item type badge color
 const getWorkItemTypeColor = (type: string): string => {
 switch (type) {
 case 'ticket':
 return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
 case 'dossier':
 return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
 default:
 return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
 }
 };

 // Format skills array for display
 const formatSkills = (skills: Array<{skill_id: string; skill_name_en: string; skill_name_ar: string}>): string => {
 if (skills.length === 0) return t('common:none');
 const skillNames = skills.map(s => i18n.language === 'ar' ? s.skill_name_ar : s.skill_name_en);
 if (skillNames.length <= 2) return skillNames.join(', ');
 return `${skillNames.slice(0, 2).join(', ')} +${skillNames.length - 2}`;
 };

 const totalPages = data ? Math.ceil(data.total_count / pageSize) : 0;

 const isRTL = i18n.language === 'ar';

 return (
 <div className={cn('assignment-queue space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Filters */}
 <div className={cn('flex flex-wrap gap-4 items-center', { 'flex-row-reverse': isRTL })}>
 <div className="flex-1 min-w-[200px]">
 <label className="text-sm font-medium mb-2 block">
 {t('assignments:queue.filterPriority')}
 </label>
 <Select
 value={priorityFilter || 'all'}
 onValueChange={(value) =>
 setPriorityFilter(value === 'all' ? undefined : (value as any))
 }
 >
 <SelectTrigger>
 <SelectValue placeholder={t('assignments:queue.allPriorities')} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{t('assignments:queue.allPriorities')}</SelectItem>
 <SelectItem value="urgent">{t('common:priority.urgent')}</SelectItem>
 <SelectItem value="high">{t('common:priority.high')}</SelectItem>
 <SelectItem value="normal">{t('common:priority.normal')}</SelectItem>
 <SelectItem value="low">{t('common:priority.low')}</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="flex-1 min-w-[200px]">
 <label className="text-sm font-medium mb-2 block">
 {t('assignments:queue.filterWorkItemType')}
 </label>
 <Select
 value={workItemTypeFilter || 'all'}
 onValueChange={(value) =>
 setWorkItemTypeFilter(value === 'all' ? undefined : (value as any))
 }
 >
 <SelectTrigger>
 <SelectValue placeholder={t('assignments:queue.allTypes')} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{t('assignments:queue.allTypes')}</SelectItem>
 <SelectItem value="ticket">{t('common:workItemType.ticket')}</SelectItem>
 <SelectItem value="dossier">{t('common:workItemType.dossier')}</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="flex-1 min-w-[150px]">
 <label className="text-sm font-medium mb-2 block">
 {t('assignments:queue.pageSize')}
 </label>
 <Select
 value={pageSize.toString()}
 onValueChange={(value) => {
 setPageSize(parseInt(value));
 setPage(1); // Reset to first page
 }}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="10">10</SelectItem>
 <SelectItem value="25">25</SelectItem>
 <SelectItem value="50">50</SelectItem>
 <SelectItem value="100">100</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>

 {/* Queue Stats */}
 {data && (
 <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
 <div>
 <span className="font-medium">{t('assignments:queue.totalItems')}:</span>{' '}
 {data.total_count}
 </div>
 <div>
 <span className="font-medium">{t('assignments:queue.showing')}:</span>{' '}
 {(page - 1) * pageSize + 1}-
 {Math.min(page * pageSize, data.total_count)} {t('common:of')} {data.total_count}
 </div>
 </div>
 )}

 {/* Loading State */}
 {isLoading && (
 <div className="flex justify-center items-center py-12">
 <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
 <span className="ms-3 text-gray-600 dark:text-gray-400">
 {t('assignments:queue.loading')}
 </span>
 </div>
 )}

 {/* Error State */}
 {isError && (
 <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
 <p className="text-red-700 dark:text-red-400">
 {t('assignments:queue.error')}: {error?.message}
 </p>
 </div>
 )}

 {/* Queue Table */}
 {!isLoading && !isError && data && (
 <div className="border rounded-lg overflow-hidden">
 <div className="px-4 py-2 text-sm text-muted-foreground text-center border-b">
 {data.items.length === 0
 ? t('assignments:queue.emptyQueue')
 : t('assignments:queue.queueSummary', { count: data.total_count })}
 </div>
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>{t('assignments:queue.position')}</TableHead>
 <TableHead>{t('assignments:queue.workItemId')}</TableHead>
 <TableHead>{t('assignments:queue.workItemType')}</TableHead>
 <TableHead>{t('assignments:queue.priority')}</TableHead>
 <TableHead>{t('assignments:queue.requiredSkills')}</TableHead>
 <TableHead>{t('assignments:queue.createdAt')}</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {data.items.length === 0 ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center text-gray-500 py-8">
 {t('assignments:queue.noItemsFound')}
 </TableCell>
 </TableRow>
 ) : (
 data.items.map((item, index) => (
 <TableRow key={item.queue_id}>
 <TableCell className="font-mono">
 {(page - 1) * pageSize + index + 1}
 </TableCell>
 <TableCell className="font-medium">{item.work_item_id}</TableCell>
 <TableCell>
 <Badge className={cn(getWorkItemTypeColor(item.work_item_type), { 'me-auto': !isRTL, 'ms-auto': isRTL })}>
 {t(`common:workItemType.${item.work_item_type}`)}
 </Badge>
 </TableCell>
 <TableCell>
 <Badge className={cn(getPriorityColor(item.priority), { 'me-auto': !isRTL, 'ms-auto': isRTL })}>
 {t(`common:priority.${item.priority}`)}
 </Badge>
 </TableCell>
 <TableCell className="text-sm text-gray-600 dark:text-gray-400">
 {formatSkills(item.required_skills || [])}
 </TableCell>
 <TableCell
 className="text-sm text-gray-600 dark:text-gray-400"
 dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
 >
 {new Date(item.queued_at).toLocaleString(
 i18n.language === 'ar' ? 'ar-SA' : 'en-US',
 {
 dateStyle: 'short',
 timeStyle: 'short',
 }
 )}
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>
 )}

 {/* Pagination */}
 {!isLoading && !isError && data && totalPages > 1 && (
 <div className="flex items-center justify-between">
 <div className="text-sm text-gray-600 dark:text-gray-400">
 {t('assignments:queue.page')} {page} {t('common:of')} {totalPages}
 </div>
 <div className="flex gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage((p) => Math.max(1, p - 1))}
 disabled={page === 1}
 >
 <ChevronLeft className="w-4 h-4" />
 {t('common:previous')}
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
 disabled={page === totalPages}
 >
 {t('common:next')}
 <ChevronRight className="w-4 h-4" />
 </Button>
 </div>
 </div>
 )}
 </div>
 );
}
