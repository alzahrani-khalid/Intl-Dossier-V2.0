import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, ExternalLink, LayoutGrid } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface EngagementContextBannerProps {
  engagementId: string;
  engagementTitle: string;
  engagementType: string;
  startDate: string;
  endDate?: string;
  progressPercentage: number;
  totalAssignments: number;
  completedAssignments: number;
  onShowKanban?: () => void;
}

export function EngagementContextBanner({
  engagementId,
  engagementTitle,
  engagementType,
  startDate,
  endDate,
  progressPercentage,
  totalAssignments,
  completedAssignments,
  onShowKanban,
}: EngagementContextBannerProps): JSX.Element {
  const { t, i18n } = useTranslation('assignments');
  const isRTL = i18n.language === 'ar';

  const formatDateRange = (): string => {
    const start = new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(startDate));

    if (endDate) {
      const end = new Intl.DateTimeFormat(i18n.language, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(endDate));
      return `${start} - ${end}`;
    }

    return start;
  };

  const getTypeColor = (): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (engagementType) {
      case 'minister_visit':
        return 'destructive';
      case 'trade_mission':
        return 'default';
      case 'conference':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card
      dir={isRTL ? 'rtl' : 'ltr'}
      className="border-l-4 border-l-primary bg-primary/5"
    >
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={getTypeColor()}>
                  {t(`engagement.type_${engagementType}`)}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDateRange()}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{engagementTitle}</h3>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/engagements/$engagementId" params={{ engagementId }}>
                  <ExternalLink className="h-4 w-4 me-2" />
                  {t('engagement.viewFull')}
                </Link>
              </Button>
              {onShowKanban && (
                <Button onClick={onShowKanban} variant="outline" size="sm">
                  <LayoutGrid className="h-4 w-4 me-2" />
                  {t('engagement.showKanban')}
                </Button>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('engagement.progress')}:
              </span>
              <span className="font-medium">
                {Math.round(progressPercentage)}% ({completedAssignments}/{totalAssignments} {t('engagement.tasksCompleted')})
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
