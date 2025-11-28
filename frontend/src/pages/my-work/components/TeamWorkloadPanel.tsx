/**
 * Team Workload Panel Component
 * Shows team members' workload for managers
 * Mobile-first, RTL-compatible
 */
import { useTranslation } from 'react-i18next';
import { Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { TeamMemberWorkload } from '@/types/unified-work.types';
import { cn } from '@/lib/utils';

interface TeamWorkloadPanelProps {
  teamMembers: TeamMemberWorkload[];
  isLoading: boolean;
}

export function TeamWorkloadPanel({ teamMembers, isLoading }: TeamWorkloadPanelProps) {
  const { t, i18n } = useTranslation('my-work');
  const isRTL = i18n.language === 'ar';

  if (isLoading) {
    return (
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-48 shrink-0">
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (teamMembers.length === 0) {
    return null;
  }

  // Get initials from email
  const getInitials = (email: string) => {
    const name = email.split('@')[0] || 'U';
    const parts = name.split(/[._-]/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Card className="mb-4 sm:mb-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-2 px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-start">
          <Users className="h-5 w-5" />
          {t('team.title', 'Team Workload')}
          <Badge variant="secondary" className="ms-2">
            {teamMembers.length} {t('team.members', 'members')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {teamMembers.map((member) => {
              const hasOverdue = member.overdue_count > 0;
              const workloadPct = Math.min((member.total_active / 20) * 100, 100); // Assume 20 is max capacity

              return (
                <Card
                  key={member.user_id}
                  className={cn(
                    'w-48 shrink-0 transition-all hover:shadow-md',
                    hasOverdue && 'border-red-200 dark:border-red-800'
                  )}
                >
                  <CardContent className="p-3">
                    {/* Member Info */}
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(member.user_email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate text-start">
                          {member.user_email.split('@')[0]}
                        </p>
                        {hasOverdue && (
                          <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{member.overdue_count} {t('team.overdue', 'overdue')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Workload Stats */}
                    <div className="space-y-2">
                      {/* Total Active */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground text-start">
                          {t('team.active', 'Active')}
                        </span>
                        <span className="font-medium">{member.total_active}</span>
                      </div>

                      {/* Workload Bar */}
                      <Progress
                        value={workloadPct}
                        className={cn(
                          'h-1.5',
                          workloadPct > 80 && 'bg-red-100 [&>div]:bg-red-500',
                          workloadPct > 60 && workloadPct <= 80 && 'bg-orange-100 [&>div]:bg-orange-500'
                        )}
                      />

                      {/* On-Time Rate */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-muted-foreground flex items-center gap-1 text-start">
                          <TrendingUp className="h-3 w-3" />
                          {t('team.onTime', 'On-time')}
                        </span>
                        <span
                          className={cn(
                            'font-medium',
                            member.on_time_rate_30d >= 80
                              ? 'text-green-600 dark:text-green-400'
                              : member.on_time_rate_30d >= 60
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                          )}
                        >
                          {member.on_time_rate_30d}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
