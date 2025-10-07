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
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ icon, label, value, iconColor = 'text-muted-foreground' }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className={`flex-shrink-0 ${iconColor}`} aria-hidden="true">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground truncate">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export function DossierStats({ stats }: DossierStatsProps) {
  const { t } = useTranslation('dossiers');

  // Calculate health score color and status
  const getHealthScoreColor = (score: number | null): string => {
    if (score === null) return 'bg-gray-500';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
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
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label={t('stats.totalEngagements')}
          value={stats.total_engagements}
          iconColor="text-blue-500"
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          label={t('stats.totalPositions')}
          value={stats.total_positions}
          iconColor="text-purple-500"
        />
        <StatCard
          icon={<Handshake className="h-5 w-5" />}
          label={t('stats.totalMous')}
          value={stats.total_mous}
          iconColor="text-green-500"
        />
      </div>

      {/* Commitments Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard
          icon={<CheckCircle className="h-5 w-5" />}
          label={t('stats.activeCommitments')}
          value={stats.active_commitments}
          iconColor="text-green-600"
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5" />}
          label={t('stats.overdueCommitments')}
          value={stats.overdue_commitments}
          iconColor={stats.overdue_commitments > 0 ? 'text-red-500' : 'text-muted-foreground'}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label={t('stats.totalDocuments')}
          value={stats.total_documents}
          iconColor="text-gray-500"
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label={t('stats.recentActivity')}
          value={stats.recent_activity_count}
          iconColor="text-indigo-500"
        />
      </div>

      {/* Relationship Health Score Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
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
              <div className="text-center py-4">
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