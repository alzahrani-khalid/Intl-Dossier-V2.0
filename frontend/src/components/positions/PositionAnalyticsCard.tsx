/**
 * PositionAnalyticsCard Component (T048)
 * Display position usage analytics with trends
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Eye, Link2, FileText, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePositionAnalytics } from '@/hooks/usePositionAnalytics';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export interface PositionAnalyticsCardProps {
 positionId: string;
 className?: string;
}

export const PositionAnalyticsCard: React.FC<PositionAnalyticsCardProps> = ({
 positionId,
 className = '',
}) => {
 const { t, i18n } = useTranslation();
 const locale = i18n.language === 'ar' ? ar : enUS;

 const { data: analytics, isLoading, error } = usePositionAnalytics(positionId);

 if (isLoading) {
 return (
 <Card className={className}>
 <CardHeader>
 <CardTitle>{t('positions.analytics.title')}</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex items-center justify-center py-8">
 <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
 </div>
 </CardContent>
 </Card>
 );
 }

 if (error || !analytics) {
 return (
 <Card className={className}>
 <CardHeader>
 <CardTitle>{t('positions.analytics.title')}</CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-center text-sm text-muted-foreground">{t('positions.analytics.error')}</p>
 </CardContent>
 </Card>
 );
 }

 const {
 view_count,
 attachment_count,
 briefing_pack_count,
 last_viewed_at,
 last_attached_at,
 popularity_score,
 usage_rank,
 trend_data,
 } = analytics;

 // Calculate trend direction
 const getTrendDirection = (current: number, previous: number) => {
 if (current > previous) return 'up';
 if (current < previous) return 'down';
 return 'stable';
 };

 // Get popularity badge variant
 const getPopularityVariant = (score: number) => {
 if (score >= 0.8) return 'default';
 if (score >= 0.5) return 'secondary';
 return 'outline';
 };

 return (
 <Card className={className}>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <TrendingUp className="h-5 w-5" />
 {t('positions.analytics.title')}
 </CardTitle>
 <CardDescription>{t('positions.analytics.description')}</CardDescription>
 </CardHeader>

 <CardContent className="space-y-6">
 {/* Popularity Rank */}
 {usage_rank && (
 <div className="flex items-center justify-between rounded-lg border bg-primary/5 p-4">
 <div className="flex items-center gap-3">
 <Award className="h-8 w-8 text-primary" />
 <div>
 <p className="text-sm font-medium">{t('positions.analytics.rank')}</p>
 <p className="text-2xl font-bold">#{usage_rank}</p>
 </div>
 </div>
 <Badge variant={getPopularityVariant(popularity_score || 0)}>
 {t('positions.analytics.popularityScore')}: {((popularity_score || 0) * 100).toFixed(0)}%
 </Badge>
 </div>
 )}

 {/* Metrics Grid */}
 <div className="grid gap-4 sm:grid-cols-3">
 {/* Views */}
 <div className="space-y-2 rounded-lg border p-4">
 <div className="flex items-center justify-between">
 <Eye className="h-5 w-5 text-muted-foreground" />
 {trend_data?.views && (
 <TrendIcon direction={getTrendDirection(view_count, trend_data.views.previous)} />
 )}
 </div>
 <p className="text-2xl font-bold">{view_count}</p>
 <p className="text-xs text-muted-foreground">{t('positions.analytics.views')}</p>
 {last_viewed_at && (
 <p className="text-xs text-muted-foreground">
 {t('positions.analytics.lastViewed')}:{' '}
 {format(new Date(last_viewed_at), 'PP', { locale })}
 </p>
 )}
 </div>

 {/* Attachments */}
 <div className="space-y-2 rounded-lg border p-4">
 <div className="flex items-center justify-between">
 <Link2 className="h-5 w-5 text-muted-foreground" />
 {trend_data?.attachments && (
 <TrendIcon
 direction={getTrendDirection(attachment_count, trend_data.attachments.previous)}
 />
 )}
 </div>
 <p className="text-2xl font-bold">{attachment_count}</p>
 <p className="text-xs text-muted-foreground">{t('positions.analytics.attachments')}</p>
 {last_attached_at && (
 <p className="text-xs text-muted-foreground">
 {t('positions.analytics.lastAttached')}:{' '}
 {format(new Date(last_attached_at), 'PP', { locale })}
 </p>
 )}
 </div>

 {/* Briefing Packs */}
 <div className="space-y-2 rounded-lg border p-4">
 <div className="flex items-center justify-between">
 <FileText className="h-5 w-5 text-muted-foreground" />
 {trend_data?.briefings && (
 <TrendIcon
 direction={getTrendDirection(briefing_pack_count, trend_data.briefings.previous)}
 />
 )}
 </div>
 <p className="text-2xl font-bold">{briefing_pack_count}</p>
 <p className="text-xs text-muted-foreground">{t('positions.analytics.briefingPacks')}</p>
 </div>
 </div>

 {/* Trend Chart Placeholder */}
 {trend_data?.daily && trend_data.daily.length > 0 && (
 <div className="space-y-2">
 <p className="text-sm font-medium">{t('positions.analytics.usageTrend')}</p>
 <div className="flex h-32 items-end justify-between gap-1 rounded-lg border p-4">
 {trend_data.daily.slice(-7).map((day: any, i: number) => {
 const maxValue = Math.max(...trend_data.daily.map((d: any) => d.total));
 const height = (day.total / maxValue) * 100;
 return (
 <div
 key={i}
 className="flex-1 rounded-t bg-primary transition-all hover:opacity-80"
 style={{ height: `${height}%`, minHeight: '4px' }}
 title={`${day.date}: ${day.total}`}
 />
 );
 })}
 </div>
 <p className="text-xs text-muted-foreground text-center">
 {t('positions.analytics.last7Days')}
 </p>
 </div>
 )}
 </CardContent>
 </Card>
 );
};

// Trend Icon Component
const TrendIcon: React.FC<{ direction: 'up' | 'down' | 'stable' }> = ({ direction }) => {
 if (direction === 'up') {
 return <TrendingUp className="h-4 w-4 text-green-600" />;
 }
 if (direction === 'down') {
 return <TrendingUp className="h-4 w-4 rotate-180 text-red-600" />;
 }
 return <div className="h-4 w-4" />; // Stable - no icon
};
