/**
 * Position Detail Page (T056)
 *
 * Detailed view of a single position with analytics and related engagements
 * Features: Full content display, version history, analytics card, cross-navigation
 * Integration: Accessible from library, dossier, and engagement contexts
 */

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { usePosition } from '../../../hooks/usePosition'
import { usePositionAnalytics } from '../../../hooks/usePositionAnalytics'
import { useEngagementPositions } from '../../../hooks/useEngagementPositions'
import { PositionAnalyticsCard } from '../../../components/positions/PositionAnalyticsCard'
import { PositionEditor } from '../../../components/positions/PositionEditor'
import { Button } from '../../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { Separator } from '../../../components/ui/separator'
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Building,
  Link as LinkIcon,
  Edit,
  Archive,
  TrendingUp,
} from 'lucide-react'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

export const Route = createFileRoute('/_protected/positions/$positionId')({
  component: PositionDetailPage,
})

function PositionDetailPage() {
  const { positionId } = Route.useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation(['positions', 'common'])
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? ar : enUS

  // Fetch position data
  const { data: position, isLoading, error } = usePosition(positionId)

  // Fetch analytics
  const { data: analytics } = usePositionAnalytics(positionId)

  // Fetch related engagements (where this position is attached)
  // Note: This would need a new endpoint or query parameter
  // For now, we'll show a placeholder

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('common:error')}
            </CardTitle>
            <CardDescription>
              {error instanceof Error && error.message.includes('404')
                ? t('positions:detail.not_found')
                : t('positions:detail.error_loading')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate({ to: '/positions' })} variant="outline">
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              {t('positions:detail.back_to_library')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!position) return null

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
    approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
    published: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
    archived: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/positions' })}
                className="mb-4"
              >
                <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                {t('positions:detail.back_to_library')}
              </Button>

              {/* Title and Metadata */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {isRTL ? position.title_ar : position.title_en}
                  </h1>
                  <Badge className={statusColors[position.status]}>
                    {t(`positions:status.${position.status}`)}
                  </Badge>
                  <Badge variant="outline">{t(`positions:type.${position.type}`)}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(position.updated_at), 'PPP', { locale })}
                  </span>
                  {position.created_by && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {position.created_by}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {position.status !== 'archived' && (
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                  {t('positions:detail.edit')}
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Archive className="h-4 w-4" />
                {position.status === 'archived'
                  ? t('positions:detail.restore')
                  : t('positions:detail.archive')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column - Position Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Position Content */}
            <Card>
              <CardHeader>
                <CardTitle>{t('positions:detail.content_title')}</CardTitle>
                <CardDescription>{t('positions:detail.content_description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  {/* English Content */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      {t('positions:detail.english_version')}
                    </h3>
                    <div className="whitespace-pre-wrap">{position.content_en}</div>
                  </div>

                  <Separator className="my-6" />

                  {/* Arabic Content */}
                  <div className="space-y-4 text-end" dir="rtl">
                    <h3 className="text-lg font-semibold">
                      {t('positions:detail.arabic_version')}
                    </h3>
                    <div className="whitespace-pre-wrap">{position.content_ar}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Engagements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  {t('positions:detail.related_engagements')}
                </CardTitle>
                <CardDescription>
                  {t('positions:detail.related_engagements_description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* This would be populated with actual engagement data */}
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">{t('positions:detail.no_related_engagements')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Analytics and Metadata */}
          <div className="space-y-6">
            {/* Analytics Card */}
            {analytics && <PositionAnalyticsCard positionId={positionId} analytics={analytics} />}

            {/* Metadata Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('positions:detail.metadata_title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('positions:detail.dossier')}
                  </p>
                  {position.dossier_id ? (
                    <Link
                      to={getDossierDetailPath(position.dossier_id, position.dossier_type)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {t('positions:detail.view_dossier')}
                    </Link>
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {t('positions:detail.no_dossier')}
                    </p>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('positions:detail.created')}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {format(new Date(position.created_at), 'PPP', { locale })}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('positions:detail.last_updated')}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {format(new Date(position.updated_at), 'PPP', { locale })}
                  </p>
                </div>

                {position.version && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('positions:detail.version')}
                      </p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        v{position.version}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
