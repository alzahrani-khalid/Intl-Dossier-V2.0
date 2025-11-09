/**
 * TaskCard Component
 * Feature: 025-unified-tasks-model
 * User Story: US1 - View My Tasks with Clear Titles
 * Task: T033
 *
 * Displays task.title as primary text with mobile-first responsive design and RTL support
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { SLAIndicator } from './SLAIndicator';
import type { Database } from '../../../../backend/src/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskCardProps {
 task: Task;
 onClick?: (task: Task) => void;
 showEngagement?: boolean;
 showWorkItem?: boolean;
 className?: string;
}

export function TaskCard({
 task,
 onClick,
 showEngagement = false,
 showWorkItem = true,
 className = '',
}: TaskCardProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 const getPriorityColor = (priority: string): string => {
 const colors = {
 urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
 high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
 medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
 low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
 };
 return colors[priority as keyof typeof colors] || colors.medium;
 };

 const getStatusColor = (status: string): string => {
 const colors = {
 pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
 in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
 review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
 completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
 cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
 };
 return colors[status as keyof typeof colors] || colors.pending;
 };

 const isCompleted = task.status === 'completed' || task.status === 'cancelled';

 return (
 <Card
 className={`hover:shadow-md transition-shadow cursor-pointer ${className}`}
 onClick={() => onClick?.(task)}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <CardContent className="p-4 sm:p-6">
 {/* Header: Badges and Metadata */}
 <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
 <div className="flex flex-wrap gap-2">
 <Badge className={getPriorityColor(task.priority)}>
 {t(`priority.${task.priority}`, task.priority)}
 </Badge>
 <Badge className={getStatusColor(task.status)}>
 {t(`status.${task.status}`, task.status)}
 </Badge>
 {showWorkItem && task.work_item_type && (
 <Badge variant="outline">
 {t(`work_item.${task.work_item_type}`, task.work_item_type)}
 </Badge>
 )}
 </div>

 {/* SLA Indicator - T078: Integrated SLAIndicator component */}
 <SLAIndicator
 deadline={task.sla_deadline}
 isCompleted={isCompleted}
 completedAt={task.completed_at}
 mode="badge"
 />
 </div>

 {/* Task Title (Primary Display) - Mobile-first, RTL-compatible */}
 <h3 className={`text-sm sm:text-base md:text-lg font-semibold mb-2 ${isRTL ? 'text-end' : 'text-start'}`}>
 {task.title}
 </h3>

 {/* Description Preview */}
 {task.description && (
 <p className={`text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 ${isRTL ? 'text-end' : 'text-start'}`}>
 {task.description}
 </p>
 )}

 {/* Footer: Timestamps */}
 <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground ${isRTL ? 'text-end' : 'text-start'}`}>
 <div>
 {t('created', 'Created')}: {new Date(task.created_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
 </div>
 {task.sla_deadline && (
 <div>
 {t('due', 'Due')}: {new Date(task.sla_deadline).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
 </div>
 )}
 </div>
 </CardContent>
 </Card>
 );
}
