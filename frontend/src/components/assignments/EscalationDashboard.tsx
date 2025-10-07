import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { CalendarIcon, TrendingUp, AlertTriangle, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * EscalationDashboard Component - T083
 * Displays escalation statistics and reporting data
 *
 * Features:
 * - Summary statistics (total, avg/day, most common reason)
 * - Time series chart
 * - Breakdowns by unit, assignee, work type
 * - Date range filtering
 * - Bilingual support (AR/EN)
 * - Accessibility (ARIA labels, keyboard navigation)
 */

interface EscalationReport {
  summary: {
    total_escalations: number;
    avg_escalations_per_day: number;
    most_common_reason: string;
    affected_assignments: number;
  };
  time_series: Array<{
    date: string;
    count: number;
    reason_breakdown: { [reason: string]: number };
  }>;
  by_unit: Array<{
    unit_id: string;
    unit_name: string;
    escalation_count: number;
    percentage: number;
  }>;
  by_assignee: Array<{
    assignee_id: string;
    assignee_name: string;
    escalation_count: number;
    total_assignments: number;
    escalation_rate: number;
  }>;
  by_work_type: Array<{
    work_item_type: string;
    escalation_count: number;
    percentage: number;
  }>;
  metadata: {
    start_date: string;
    end_date: string;
    filters: {
      unit_id?: string;
      assignee_id?: string;
      work_item_type?: string;
    };
    group_by: string;
  };
}

export function EscalationDashboard() {
  const { t, i18n } = useTranslation('assignments');
  const isRTL = i18n.language === 'ar';

  // State for filters
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week'>('day');
  const [unitFilter] = useState<string>('');
  const [workTypeFilter] = useState<string>('');

  // Fetch escalation report data
  const { data: report, isLoading, error } = useQuery<EscalationReport>({
    queryKey: ['escalation-report', dateRange, groupBy, unitFilter, workTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: dateRange.start.toISOString(),
        end_date: dateRange.end.toISOString(),
        group_by: groupBy,
      });

      if (unitFilter) params.append('unit_id', unitFilter);
      if (workTypeFilter) params.append('work_item_type', workTypeFilter);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/escalations-report?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch escalation report');
      }

      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Calculate trend (comparing first half vs second half of time series)
  const trend = useMemo(() => {
    if (!report?.time_series || report.time_series.length < 2) return null;

    const midpoint = Math.floor(report.time_series.length / 2);
    const firstHalf = report.time_series.slice(0, midpoint);
    const secondHalf = report.time_series.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      percentage: Math.abs(change).toFixed(1),
    };
  }, [report?.time_series]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {t('escalation_dashboard.error_loading')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn('space-y-6', isRTL && 'rtl')}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('escalation_dashboard.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('escalation_dashboard.description')}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-start font-normal',
                  !dateRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="me-2 h-4 w-4" />
                {dateRange.start && dateRange.end ? (
                  <>
                    {format(dateRange.start, 'MMM dd')} - {format(dateRange.end, 'MMM dd, yyyy')}
                  </>
                ) : (
                  <span>{t('escalation_dashboard.select_date_range')}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.start, to: dateRange.end }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ start: range.from, end: range.to });
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Group By */}
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'day' | 'week')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">{t('escalation_dashboard.group_by_day')}</SelectItem>
              <SelectItem value="week">{t('escalation_dashboard.group_by_week')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('escalation_dashboard.total_escalations')}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : report?.summary.total_escalations.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {!isLoading && trend && (
                <span className={cn(
                  'flex items-center gap-1',
                  trend.direction === 'up' && 'text-destructive',
                  trend.direction === 'down' && 'text-green-600'
                )}>
                  {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
                  {trend.percentage}% {t('escalation_dashboard.from_previous_period')}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('escalation_dashboard.avg_per_day')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : report?.summary.avg_escalations_per_day.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('escalation_dashboard.most_common_reason')}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {isLoading ? '...' : t(`escalation_dashboard.reason.${report?.summary.most_common_reason}`)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('escalation_dashboard.affected_assignments')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : report?.summary.affected_assignments.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">{t('escalation_dashboard.timeline')}</TabsTrigger>
          <TabsTrigger value="units">{t('escalation_dashboard.by_unit')}</TabsTrigger>
          <TabsTrigger value="staff">{t('escalation_dashboard.by_staff')}</TabsTrigger>
          <TabsTrigger value="work_type">{t('escalation_dashboard.by_work_type')}</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('escalation_dashboard.escalation_timeline')}</CardTitle>
              <CardDescription>
                {t('escalation_dashboard.escalation_timeline_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">{t('common.loading')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {report?.time_series.map((item) => (
                    <div
                      key={item.date}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-24 text-sm font-medium">
                        {format(new Date(item.date), 'MMM dd')}
                      </div>
                      <div className="flex-1">
                        <div
                          className="h-6 bg-destructive/20 rounded-full overflow-hidden"
                          style={{
                            width: `${Math.min(100, (item.count / (report.summary.total_escalations / report.time_series.length)) * 100)}%`,
                          }}
                        >
                          <div className="h-full bg-destructive rounded-full" />
                        </div>
                      </div>
                      <div className="w-12 text-end font-semibold">
                        {item.count}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('escalation_dashboard.by_unit')}</CardTitle>
              <CardDescription>
                {t('escalation_dashboard.by_unit_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoading ? (
                  <p className="text-muted-foreground">{t('common.loading')}</p>
                ) : (
                  report?.by_unit.map((unit) => (
                    <div key={unit.unit_id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="font-medium">{unit.unit_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {unit.escalation_count} {t('escalation_dashboard.escalations')} ({unit.percentage.toFixed(1)}%)
                        </div>
                      </div>
                      <div
                        className="h-2 bg-destructive rounded-full"
                        style={{ width: `${unit.percentage}%`, minWidth: '20px' }}
                      />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('escalation_dashboard.by_staff')}</CardTitle>
              <CardDescription>
                {t('escalation_dashboard.by_staff_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoading ? (
                  <p className="text-muted-foreground">{t('common.loading')}</p>
                ) : (
                  report?.by_assignee.slice(0, 10).map((assignee) => (
                    <div key={assignee.assignee_id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                      <div>
                        <div className="font-medium">{assignee.assignee_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignee.escalation_count} / {assignee.total_assignments} {t('escalation_dashboard.assignments')}
                        </div>
                      </div>
                      <div className={cn(
                        'text-sm font-semibold px-2 py-1 rounded',
                        assignee.escalation_rate > 20 && 'bg-destructive/20 text-destructive',
                        assignee.escalation_rate <= 20 && assignee.escalation_rate > 10 && 'bg-yellow-500/20 text-yellow-700',
                        assignee.escalation_rate <= 10 && 'bg-green-500/20 text-green-700'
                      )}>
                        {assignee.escalation_rate.toFixed(1)}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work_type" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('escalation_dashboard.by_work_type')}</CardTitle>
              <CardDescription>
                {t('escalation_dashboard.by_work_type_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoading ? (
                  <p className="text-muted-foreground">{t('common.loading')}</p>
                ) : (
                  report?.by_work_type.map((workType) => (
                    <div key={workType.work_item_type} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="font-medium capitalize">{workType.work_item_type}</div>
                        <div className="text-sm text-muted-foreground">
                          {workType.escalation_count} {t('escalation_dashboard.escalations')} ({workType.percentage.toFixed(1)}%)
                        </div>
                      </div>
                      <div
                        className="h-2 bg-destructive rounded-full"
                        style={{ width: `${workType.percentage}%`, minWidth: '20px' }}
                      />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
