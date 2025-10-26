import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { useEngagement } from '@/hooks/useEngagement';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Users, FileText, ArrowLeft, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { EngagementPositionsSection } from '@/components/positions/EngagementPositionsSection';
import { EngagementKanbanDialog } from '@/components/assignments/EngagementKanbanDialog';
import { useEngagementKanban } from '@/hooks/useEngagementKanban';

export const Route = createFileRoute('/_protected/engagements/$engagementId')({
  component: EngagementDetailPage,
});

function EngagementDetailPage() {
  const { engagementId } = Route.useParams();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const locale = isRTL ? ar : enUS;
  const [kanbanOpen, setKanbanOpen] = useState(false);

  const { data: engagement, isLoading, error } = useEngagement(engagementId);
  const { columns, stats, handleDragEnd } = useEngagementKanban(engagementId);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">{t('common.error')}</CardTitle>
            <CardDescription>{t('engagements.loadError')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!engagement) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('engagements.notFound')}</CardTitle>
            <CardDescription>{t('engagements.notFoundDescription')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const engagementTypeMap: Record<string, string> = {
    meeting: t('engagements.types.meeting'),
    consultation: t('engagements.types.consultation'),
    coordination: t('engagements.types.coordination'),
    workshop: t('engagements.types.workshop'),
    conference: t('engagements.types.conference'),
    site_visit: t('engagements.types.siteVisit'),
    other: t('engagements.types.other'),
  };

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/engagements">
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{isRTL ? engagement.name_ar : engagement.name_en}</h1>
            <p className="text-muted-foreground">
              {t('engagements.detail')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setKanbanOpen(true)}
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            {t('engagements.viewKanban', 'View Kanban Board')}
          </Button>
          <Badge variant="secondary">
            {engagementTypeMap[engagement.engagement_type] || engagement.engagement_type}
          </Badge>
        </div>
      </div>

      {/* Engagement details card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('engagements.information')}</CardTitle>
          <CardDescription>{t('engagements.informationDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Engagement Date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{t('engagements.date')}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(engagement.created_at), 'PPP', { locale })}
              </p>
            </div>
          </div>

          {/* Location */}
          {(isRTL ? engagement.location_ar : engagement.location_en) && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">{t('engagements.location')}</p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? engagement.location_ar : engagement.location_en}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {(isRTL ? engagement.description_ar : engagement.description_en) && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">{t('engagements.description')}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {isRTL ? engagement.description_ar : engagement.description_en}
                </p>
              </div>
            </div>
          )}

          {/* Created by */}
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{t('engagements.createdBy')}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(engagement.created_at), 'PPp', { locale })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Positions Section */}
      <EngagementPositionsSection engagementId={engagementId} />

      {/* Action button */}
      <div className="flex justify-end">
        <Button size="lg" asChild>
          <Link
            to="/engagements/$engagementId/after-action"
            params={{ engagementId }}
          >
            {t('engagements.logAfterAction')}
          </Link>
        </Button>
      </div>

      {/* Kanban Dialog */}
      <EngagementKanbanDialog
        open={kanbanOpen}
        onClose={() => setKanbanOpen(false)}
        engagementTitle={isRTL ? (engagement?.name_ar || '') : (engagement?.name_en || '')}
        columns={columns}
        stats={stats || { total: 0, todo: 0, in_progress: 0, review: 0, done: 0, progressPercentage: 0 }}
        onDragEnd={handleDragEnd}
      />

      {/* Outlet for nested routes like after-action */}
      <Outlet />
    </div>
  );
}
