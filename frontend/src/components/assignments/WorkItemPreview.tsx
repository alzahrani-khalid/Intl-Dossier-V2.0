import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface WorkItemPreviewProps {
  workItemType: 'dossier' | 'ticket' | 'engagement' | 'position';
  workItemId: string;
  workItemTitle: string;
  contentPreview?: string;
  requiredSkills?: string[];
  viewFullLink: string;
}

export function WorkItemPreview({
  workItemType,
  workItemId,
  workItemTitle,
  contentPreview,
  requiredSkills = [],
  viewFullLink,
}: WorkItemPreviewProps): JSX.Element {
  const { t, i18n } = useTranslation('assignments');
  const isRTL = i18n.language === 'ar';

  const truncateContent = (content: string, maxLength: number = 200): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getTypeIcon = (): JSX.Element => {
    return <FileText className="h-5 w-5" />;
  };

  const getTypeColor = (): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (workItemType) {
      case 'dossier':
        return 'default';
      case 'ticket':
        return 'secondary';
      case 'engagement':
        return 'outline';
      case 'position':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getTypeIcon()}
          {t('workItem.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Work Item Type */}
        <div className="flex items-center gap-2">
          <Badge variant={getTypeColor()}>
            {t(`workItem.type_${workItemType}`)}
          </Badge>
        </div>

        {/* Work Item ID and Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('workItem.id')}:</span>
            <span className="font-mono text-sm font-medium">{workItemId}</span>
          </div>
          <h3 className="text-lg font-semibold">{workItemTitle}</h3>
        </div>

        {/* Content Preview */}
        {contentPreview && (
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">{t('workItem.preview')}:</span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {truncateContent(contentPreview)}
            </p>
          </div>
        )}

        {/* Required Skills */}
        {requiredSkills.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">{t('workItem.requiredSkills')}:</span>
            <div className="flex flex-wrap gap-2">
              {requiredSkills.map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* View Full Link */}
        <div className="pt-2">
          <Button asChild variant="outline" className="w-full">
            <Link to={viewFullLink}>
              <ExternalLink className="h-4 w-4 me-2" />
              {t('workItem.viewFull')}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
