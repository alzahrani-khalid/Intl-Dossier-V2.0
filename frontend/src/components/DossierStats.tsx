import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import {
  Calendar,
  MessageSquare,
  Handshake,
  CheckCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  Activity,
} from 'lucide-react';
import type { DossierStats as Stats } from '../types/dossier';

interface DossierStatsProps {
  stats: Stats;
  onStatClick?: (statType: 'engagements' | 'positions' | 'mous') => void;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  clickable?: boolean;
}

function StatCard({
  icon,
  label,
  value,
  iconColor = 'text-muted-foreground',
  onClick,
  clickable = false
}: StatCardProps) {
  const baseClasses = "flex items-center gap-3 rounded-lg bg-muted/50 p-3 transition-all duration-200";
  const interactiveClasses = clickable
    ? "cursor-pointer hover:bg-muted hover:shadow-sm active:scale-[0.98]"
    : "";

  const Component = clickable ? 'button' : 'div';

  return (
    <Component
      className={`${baseClasses} ${interactiveClasses}`}
      onClick={clickable ? onClick : undefined}
      type={clickable ? "button" : undefined}
      aria-label={clickable ? `${label}: ${value}. Click to view details` : undefined}
    >
      <div className={`shrink-0 ${iconColor}`} aria-hidden="true">
        {icon}
      </div>
      <div className="min-w-0 flex-1 text-start">
        <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </Component>
  );
}

export function DossierStats({ stats, onStatClick }: DossierStatsProps) {
  const { t } = useTranslation('dossiers');

  // Calculate health score color and status - Theme aware
  const getHealthScoreColor = (score: number | null): string => {
    if (score === null) return 'bg-muted';
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-info';
    if (score >= 40) return 'bg-warning';
    return 'bg-destructive';
  };

  const getHealthScoreLabel = (score: number | null): string => {
    if (score === null) return t('stats.relationshipHealth');
    if (score >= 80) return t('health.excellent', { ns: 'translation' }) || 'Excellent';
    if (score >= 60) return t('health.good', { ns: 'translation' }) || 'Good';
    if (score >= 40) return t('health.fair', { ns: 'translation' }) || 'Fair';
    return t('health.needsAttention', { ns: 'translation' }) || 'Needs Attention';
  };

  const healthScore = stats.relationship_health_score ?? 0;
  const hasHealthScore = stats.relationship_health_score !== null;

  return (
    <div className="space-y-4">
      {/* Main Stats Grid - Theme aware */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<Calendar className="size-5" />}
          label={t('stats.totalEngagements')}
          value={stats.total_engagements}
          iconColor="text-info"
          onClick={() => onStatClick?.('engagements')}
          clickable={!!onStatClick && stats.total_engagements > 0}
        />
        <StatCard
          icon={<MessageSquare className="size-5" />}
          label={t('stats.totalPositions')}
          value={stats.total_positions}
          iconColor="text-secondary"
          onClick={() => onStatClick?.('positions')}
          clickable={!!onStatClick && stats.total_positions > 0}
        />
        <StatCard
          icon={<Handshake className="size-5" />}
          label={t('stats.totalMous')}
          value={stats.total_mous}
          iconColor="text-success"
          onClick={() => onStatClick?.('mous')}
          clickable={!!onStatClick && stats.total_mous > 0}
        />
      </div>

      {/* Commitments Row - Theme aware */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          icon={<CheckCircle className="size-5" />}
          label={t('stats.activeCommitments')}
          value={stats.active_commitments}
          iconColor="text-success"
        />
        <StatCard
          icon={<AlertCircle className="size-5" />}
          label={t('stats.overdueCommitments')}
          value={stats.overdue_commitments}
          iconColor={stats.overdue_commitments > 0 ? 'text-destructive' : 'text-muted-foreground'}
        />
      </div>

      {/* Additional Metrics - Theme aware */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          icon={<FileText className="size-5" />}
          label={t('stats.totalDocuments')}
          value={stats.total_documents}
          iconColor="text-muted-foreground"
        />
        <StatCard
          icon={<Activity className="size-5" />}
          label={t('stats.recentActivity')}
          value={stats.recent_activity_count}
          iconColor="text-accent"
        />
      </div>

      {/* Relationship Health Score Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="size-4" />
            {t('stats.relationshipHealth')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hasHealthScore ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{healthScore}</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {getHealthScoreLabel(healthScore)}
                  </span>
                </div>
                <Progress
                  value={healthScore}
                  className="h-2"
                  aria-label={`${t('stats.relationshipHealth')}: ${healthScore} out of 100`}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('stats.noHealthScore', { ns: 'translation' }) ||
                    'Not enough data to calculate health score'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}