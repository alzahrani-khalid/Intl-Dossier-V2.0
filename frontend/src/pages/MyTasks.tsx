/**
 * MyTasks Page
 * Feature: 025-unified-tasks-model
 * User Story: US1 - View My Tasks with Clear Titles
 * User Story: US2 - Track Team Collaboration
 * Task: T035, T049
 *
 * Renamed from MyAssignments, fetches from unified tasks table with title display
 * Includes "Contributed" filter option to view tasks user contributed to
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useMyTasks, useContributedTasks } from '../hooks/use-tasks';
import { TaskCard } from '../components/tasks/TaskCard';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AlertCircle, CheckCircle2, Filter, UserCheck, Users } from 'lucide-react';
import type { Database } from '../../../backend/src/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type ViewType = 'assigned' | 'contributed';

export function MyTasksPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  const [viewType, setViewType] = useState<ViewType>('assigned');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Fetch tasks based on view type (US2 - T049)
  const { data: assignedTasks, isLoading: isLoadingAssigned, error: assignedError } = useMyTasks();
  const { data: contributedTasks, isLoading: isLoadingContributed, error: contributedError } = useContributedTasks();

  // Determine which data to use based on view type
  const tasks = viewType === 'assigned' ? assignedTasks : contributedTasks;
  const isLoading = viewType === 'assigned' ? isLoadingAssigned : isLoadingContributed;
  const error = viewType === 'assigned' ? assignedError : contributedError;

  const handleTaskClick = (task: Task) => {
    navigate({ to: `/tasks/${task.id}` });
  };

  // Filter tasks based on selected filters
  const filteredTasks = React.useMemo(() => {
    if (!tasks) return [];

    let filtered = tasks;

    // Status filter (T080: Added "breached_sla" filter option)
    if (statusFilter === 'active') {
      filtered = filtered.filter(t => !['completed', 'cancelled'].includes(t.status));
    } else if (statusFilter === 'breached_sla') {
      // T080: Breached SLA filter - tasks where sla_deadline < now() AND status != 'completed'
      const now = Date.now();
      filtered = filtered.filter(t => {
        if (!t.sla_deadline || ['completed', 'cancelled'].includes(t.status)) return false;
        return new Date(t.sla_deadline).getTime() < now;
      });
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    return filtered;
  }, [tasks, statusFilter, priorityFilter]);

  // Calculate summary stats
  const summary = React.useMemo(() => {
    if (!tasks) return { active: 0, atRisk: 0, breached: 0 };

    const now = Date.now();
    const activeTasks = tasks.filter(t => !['completed', 'cancelled'].includes(t.status));

    const atRisk = activeTasks.filter(t => {
      if (!t.sla_deadline) return false;
      const deadline = new Date(t.sla_deadline).getTime();
      const created = new Date(t.created_at).getTime();
      const total = deadline - created;
      const remaining = deadline - now;
      return remaining > 0 && (remaining / total) < 0.25; // < 25% time remaining
    }).length;

    const breached = activeTasks.filter(t => {
      if (!t.sla_deadline) return false;
      return new Date(t.sla_deadline).getTime() < now;
    }).length;

    return {
      active: activeTasks.length,
      atRisk,
      breached,
    };
  }, [tasks]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {error.message || t('failed_to_load_tasks', 'Failed to load tasks. Please try again.')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div>
        <h1 className={`text-2xl font-bold sm:text-3xl md:text-4xl ${isRTL ? 'text-end' : 'text-start'}`}>
          {t('my_tasks', 'My Tasks')}
        </h1>
        <p className={`mt-1 text-sm text-muted-foreground sm:text-base ${isRTL ? 'text-end' : 'text-start'}`}>
          {t('my_tasks_description', 'View and manage tasks assigned to you')}
        </p>
      </div>

      {/* View Type Tabs (US2 - T049) */}
      <Tabs value={viewType} onValueChange={(value) => setViewType(value as ViewType)} className="w-full">
        <TabsList className="mx-auto grid w-full max-w-md grid-cols-2 sm:mx-0">
          <TabsTrigger value="assigned" className="flex items-center gap-2">
            <UserCheck className="size-4" />
            {t('assigned_to_me', 'Assigned to Me')}
          </TabsTrigger>
          <TabsTrigger value="contributed" className="flex items-center gap-2">
            <Users className="size-4" />
            {t('contributed', 'Tasks I Contributed To')}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary Stats - Mobile-first grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium text-muted-foreground ${isRTL ? 'text-end' : 'text-start'}`}>
              {t('total_active', 'Total Active')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold sm:text-3xl ${isRTL ? 'text-end' : 'text-start'}`}>
              {isLoading ? '...' : summary.active}
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium text-yellow-700 dark:text-yellow-300 ${isRTL ? 'text-end' : 'text-start'}`}>
              {t('at_risk', 'At Risk (< 25% SLA)')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-yellow-700 dark:text-yellow-300 sm:text-3xl ${isRTL ? 'text-end' : 'text-start'}`}>
              {isLoading ? '...' : summary.atRisk}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium text-red-700 dark:text-red-300 ${isRTL ? 'text-end' : 'text-start'}`}>
              {t('sla_breached', 'SLA Breached')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-red-700 dark:text-red-300 sm:text-3xl ${isRTL ? 'text-end' : 'text-start'}`}>
              {isLoading ? '...' : summary.breached}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Mobile-first: stacked on mobile, row on desktop */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="size-5" />
            <CardTitle>{t('filters', 'Filters')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Status Filter */}
            <div className="flex-1">
              <label className={`mb-2 block text-sm font-medium ${isRTL ? 'text-end' : 'text-start'}`}>
                {t('status', 'Status')}
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select_status', 'Select status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all', 'All')}</SelectItem>
                  <SelectItem value="active">{t('active', 'Active')}</SelectItem>
                  <SelectItem value="breached_sla">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="size-4 text-red-500" />
                      {t('breached_sla', 'Breached SLA')}
                    </span>
                  </SelectItem>
                  <SelectItem value="pending">{t('pending', 'Pending')}</SelectItem>
                  <SelectItem value="in_progress">{t('in_progress', 'In Progress')}</SelectItem>
                  <SelectItem value="review">{t('review', 'Review')}</SelectItem>
                  <SelectItem value="completed">{t('completed', 'Completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('cancelled', 'Cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="flex-1">
              <label className={`mb-2 block text-sm font-medium ${isRTL ? 'text-end' : 'text-start'}`}>
                {t('priority', 'Priority')}
              </label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select_priority', 'Select priority')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all', 'All')}</SelectItem>
                  <SelectItem value="urgent">{t('urgent', 'Urgent')}</SelectItem>
                  <SelectItem value="high">{t('high', 'High')}</SelectItem>
                  <SelectItem value="medium">{t('medium', 'Medium')}</SelectItem>
                  <SelectItem value="low">{t('low', 'Low')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('active');
                  setPriorityFilter('all');
                }}
                className="w-full sm:w-auto"
              >
                {t('reset', 'Reset')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        <h2 className={`text-lg font-semibold sm:text-xl ${isRTL ? 'text-end' : 'text-start'}`}>
          {t('tasks', 'Tasks')} ({filteredTasks.length})
        </h2>

        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {t('loading_tasks', 'Loading tasks...')}
            </CardContent>
          </Card>
        ) : filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={handleTaskClick}
                showWorkItem={true}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <CheckCircle2 className="mx-auto mb-2 size-12 text-green-500" />
              <p>{t('no_tasks', 'No tasks found')}</p>
              <p className="mt-1 text-sm">
                {statusFilter !== 'all' || priorityFilter !== 'all'
                  ? t('try_adjusting_filters', 'Try adjusting your filters')
                  : t('no_tasks_assigned', 'You have no tasks assigned')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default MyTasksPage;
