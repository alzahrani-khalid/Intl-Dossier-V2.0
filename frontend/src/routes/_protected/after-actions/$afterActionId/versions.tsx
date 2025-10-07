import { createFileRoute, Link } from '@tanstack/react-router';
import { useAfterActionVersions } from '@/hooks/useAfterAction';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VersionHistoryViewer } from '@/components/VersionHistoryViewer';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/_protected/after-actions/$afterActionId/versions')({
  component: VersionHistoryPage,
});

function VersionHistoryPage() {
  const { afterActionId } = Route.useParams();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const { data: versions, isLoading, error } = useAfterActionVersions(afterActionId);

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
            <CardDescription>{t('afterActions.versions.loadError')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link
            to="/after-actions/$afterActionId"
            params={{ afterActionId }}
          >
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('afterActions.versions.title')}</h1>
          <p className="text-muted-foreground">
            {t('afterActions.versions.description')}
          </p>
        </div>
      </div>

      {/* Version History Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('afterActions.versions.history')}</CardTitle>
          <CardDescription>
            {versions && versions.length > 0
              ? t('afterActions.versions.count', { count: versions.length })
              : t('afterActions.versions.noVersions')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {versions && versions.length > 0 ? (
            <VersionHistoryViewer
              afterActionId={afterActionId}
              versions={versions}
            />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t('afterActions.versions.noVersionsDescription')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
