import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import {
 Calendar,
 MessageSquare,
 Handshake,
 CheckCircle,
 AlertCircle,
 FileText,
 TrendingUp,
 Activity,
 Loader2,
} from 'lucide-react';
import { useDossierStats } from '../hooks/useDossierStats';
import { getHealthScoreColor, getHealthScoreLabel } from '../services/dossier-stats.service';

interface DossierStatsProps {
 dossierId: string;
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

export function DossierStats({ dossierId, onStatClick }: DossierStatsProps) {
 const { t, i18n } = useTranslation('dossiers');
 const navigate = useNavigate();
 const isRTL = i18n.language === 'ar';

 // Fetch dossier stats using TanStack Query hook
 const { data: stats, isLoading, isError, error } = useDossierStats({ dossierId });

 // Show loading skeleton
 if (isLoading) {
 return (
 <div className="space-y-4">
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
 {[...Array(3)].map((_, i) => (
 <Skeleton key={i} className="h-24 w-full" />
 ))}
 </div>
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 {[...Array(4)].map((_, i) => (
 <Skeleton key={i} className="h-24 w-full" />
 ))}
 </div>
 <Skeleton className="h-40 w-full" />
 </div>
 );
 }

 // Show error state
 if (isError) {
 return (
 <Alert variant="destructive">
 <AlertCircle className="size-4" />
 <AlertDescription>
 {t('errors.failedToLoadStats', { ns: 'translation' }) ||
 `Failed to load dossier stats: ${error?.message}`}
 </AlertDescription>
 </Alert>
 );
 }

 // No stats available
 if (!stats) {
 return (
 <Alert>
 <AlertDescription>
 {t('stats.noDataAvailable', { ns: 'translation' }) ||
 'No statistics available for this dossier'}
 </AlertDescription>
 </Alert>
 );
 }

 const healthScore = stats.health?.overallScore ?? null;
 const hasHealthScore = stats.health?.sufficientData ?? false;

 // Handle click to navigate to filtered commitments list
 const handleCommitmentsClick = () => {
 navigate({
 to: '/commitments',
 search: {
 dossierId,
 status: 'active,in_progress',
 },
 });
 };

 return (
 <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Main Stats Grid - Theme aware */}
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
 <StatCard
 icon={<Calendar className="size-5" />}
 label={t('stats.totalEngagements')}
 value={stats.engagements?.total365d ?? 0}
 iconColor="text-info"
 onClick={() => onStatClick?.('engagements')}
 clickable={!!onStatClick && (stats.engagements?.total365d ?? 0) > 0}
 />
 <StatCard
 icon={<FileText className="size-5" />}
 label={t('stats.totalDocuments')}
 value={stats.documents?.total ?? 0}
 iconColor="text-muted-foreground"
 />
 <StatCard
 icon={<Activity className="size-5" />}
 label={t('stats.recentActivity')}
 value={stats.engagements?.recent90d ?? 0}
 iconColor="text-accent"
 />
 </div>

 {/* Commitments Row - Theme aware */}
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <StatCard
 icon={<CheckCircle className="size-5" />}
 label={t('stats.activeCommitments')}
 value={stats.commitments?.active ?? 0}
 iconColor="text-success"
 onClick={handleCommitmentsClick}
 clickable={(stats.commitments?.active ?? 0) > 0}
 />
 <StatCard
 icon={<AlertCircle className="size-5" />}
 label={t('stats.overdueCommitments')}
 value={stats.commitments?.overdue ?? 0}
 iconColor={(stats.commitments?.overdue ?? 0) > 0 ? 'text-destructive' : 'text-muted-foreground'}
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
 <span className={`text-3xl font-bold ${getHealthScoreColor(healthScore)}`}>
 {healthScore}
 </span>
 <span className="text-sm font-medium text-muted-foreground">
 {getHealthScoreLabel(healthScore)}
 </span>
 </div>
 <Progress
 value={healthScore ?? 0}
 className="h-2"
 aria-label={`${t('stats.relationshipHealth')}: ${healthScore} out of 100`}
 />
 <div className="flex justify-between text-xs text-muted-foreground">
 <span>0</span>
 <span>50</span>
 <span>100</span>
 </div>

 {/* Component breakdown tooltip */}
 {stats.health?.components && (
 <div className="space-y-1 rounded-md bg-muted/50 p-2 text-xs">
 <div className="font-medium text-muted-foreground">
 {t('stats.healthComponents', { ns: 'translation' }) || 'Component Breakdown'}
 </div>
 <div className="flex justify-between">
 <span>{t('stats.engagementFrequency', { ns: 'translation' }) || 'Engagement Frequency'}</span>
 <span className="font-medium">{stats.health.components.engagementFrequency}</span>
 </div>
 <div className="flex justify-between">
 <span>{t('stats.commitmentFulfillment', { ns: 'translation' }) || 'Commitment Fulfillment'}</span>
 <span className="font-medium">{stats.health.components.commitmentFulfillment}</span>
 </div>
 <div className="flex justify-between">
 <span>{t('stats.recency', { ns: 'translation' }) || 'Recency'}</span>
 <span className="font-medium">{stats.health.components.recencyScore}</span>
 </div>
 </div>
 )}
 </>
 ) : (
 <div className="py-4 text-center">
 <p className="text-sm text-muted-foreground">
 {stats.health?.reason || t('stats.noHealthScore', { ns: 'translation' }) ||
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