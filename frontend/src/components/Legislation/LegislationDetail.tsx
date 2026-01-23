/**
 * Legislation Detail Component
 * Displays comprehensive legislation information with tabs
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Bell,
  BellOff,
  ExternalLink,
  Calendar,
  User,
  Building,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Plus,
  GitBranch,
  History,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  useLegislation,
  useLegislationSponsors,
  useLegislationAmendments,
  useLegislationDeadlines,
  useLegislationStatusHistory,
  useRelatedLegislations,
  useWatchLegislation,
  useUnwatchLegislation,
  useDeleteLegislation,
  useCompleteLegislationDeadline,
} from '@/hooks/useLegislation'
import {
  STATUS_COLORS,
  PRIORITY_COLORS,
  IMPACT_COLORS,
  type LegislationWithDetails,
  type LegislationSponsor,
  type LegislationAmendment,
  type LegislationDeadline,
  type LegislationStatusHistory,
  type RelatedLegislationWithDetails,
} from '@/types/legislation.types'

interface LegislationDetailProps {
  id: string
  onEdit?: () => void
  onBack?: () => void
}

export function LegislationDetail({ id, onEdit, onBack }: LegislationDetailProps) {
  const { t, i18n } = useTranslation('legislation')
  const isRTL = i18n.language === 'ar'

  const [activeTab, setActiveTab] = useState('overview')

  // Fetch data
  const { data: legislation, isLoading, error } = useLegislation(id)
  const { data: sponsors } = useLegislationSponsors(id)
  const { data: amendments } = useLegislationAmendments(id)
  const { data: deadlines } = useLegislationDeadlines(id)
  const { data: statusHistory } = useLegislationStatusHistory(id)
  const { data: relatedLegislations } = useRelatedLegislations(id)

  // Mutations
  const watchMutation = useWatchLegislation()
  const unwatchMutation = useUnwatchLegislation()
  const deleteMutation = useDeleteLegislation()
  const completeDeadlineMutation = useCompleteLegislationDeadline()

  const handleToggleWatch = () => {
    if (legislation?.is_watching) {
      unwatchMutation.mutate(id)
    } else {
      watchMutation.mutate({ legislation_id: id })
    }
  }

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        onBack?.()
      },
    })
  }

  if (isLoading) {
    return <LegislationDetailSkeleton />
  }

  if (error || !legislation) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h3 className="text-lg font-semibold">{t('errors.notFound')}</h3>
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className={cn('h-4 w-4', isRTL ? 'ms-2 rotate-180' : 'me-2')} />
                {t('common:back')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const title =
    i18n.language === 'ar' && legislation.title_ar ? legislation.title_ar : legislation.title_en

  const statusColors = STATUS_COLORS[legislation.status]
  const priorityColors = PRIORITY_COLORS[legislation.priority]
  const impactColors = IMPACT_COLORS[legislation.impact_level]

  const isWatchingLoading = watchMutation.isPending || unwatchMutation.isPending

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="mt-1">
              <ArrowLeft className={cn('h-5 w-5', isRTL && 'rotate-180')} />
            </Button>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline">{t(`type.${legislation.type}`)}</Badge>
              {legislation.reference_number && (
                <span className="text-sm text-muted-foreground">
                  {legislation.reference_number}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-start sm:text-3xl">{title}</h1>
            {legislation.jurisdiction && (
              <p className="text-muted-foreground mt-1">{legislation.jurisdiction}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleToggleWatch}
            disabled={isWatchingLoading}
            className="min-h-11"
          >
            {isWatchingLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : legislation.is_watching ? (
              <>
                <Bell className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                {t('actions.unwatch')}
              </>
            ) : (
              <>
                <BellOff className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                {t('actions.watch')}
              </>
            )}
          </Button>
          {onEdit && (
            <Button variant="outline" onClick={onEdit} className="min-h-11">
              <Edit className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
              {t('actions.edit')}
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="min-h-11">
                <Trash2 className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                {t('actions.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('messages.confirmDelete')}</AlertDialogTitle>
                <AlertDialogDescription>{t('messages.deleteWarning')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>{t('actions.confirm')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          label={t('form.fields.status')}
          value={t(`status.${legislation.status}`)}
          colors={statusColors}
        />
        <StatusCard
          label={t('priority.label')}
          value={t(`priority.${legislation.priority}`)}
          colors={priorityColors}
        />
        <StatusCard
          label={t('impact.label')}
          value={t(`impact.${legislation.impact_level}`)}
          colors={impactColors}
        />
        {legislation.comment_period_status === 'open' && legislation.comment_period_end && (
          <CommentPeriodCard endDate={legislation.comment_period_end} isRTL={isRTL} />
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="min-h-10">
            <FileText className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="deadlines" className="min-h-10">
            <Calendar className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('tabs.deadlines')}
            {deadlines && deadlines.length > 0 && (
              <Badge variant="secondary" className={cn(isRTL ? 'me-2' : 'ms-2')}>
                {deadlines.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="amendments" className="min-h-10">
            <GitBranch className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('tabs.amendments')}
            {amendments && amendments.length > 0 && (
              <Badge variant="secondary" className={cn(isRTL ? 'me-2' : 'ms-2')}>
                {amendments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sponsors" className="min-h-10">
            <User className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('tabs.sponsors')}
            {sponsors && sponsors.length > 0 && (
              <Badge variant="secondary" className={cn(isRTL ? 'me-2' : 'ms-2')}>
                {sponsors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="related" className="min-h-10">
            <MessageSquare className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('tabs.related')}
          </TabsTrigger>
          <TabsTrigger value="history" className="min-h-10">
            <History className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('tabs.history')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab legislation={legislation} isRTL={isRTL} />
        </TabsContent>

        <TabsContent value="deadlines" className="mt-6">
          <DeadlinesTab
            deadlines={deadlines || []}
            legislationId={id}
            onComplete={(deadlineId) =>
              completeDeadlineMutation.mutate({ id: deadlineId, legislationId: id })
            }
            isRTL={isRTL}
          />
        </TabsContent>

        <TabsContent value="amendments" className="mt-6">
          <AmendmentsTab amendments={amendments || []} isRTL={isRTL} />
        </TabsContent>

        <TabsContent value="sponsors" className="mt-6">
          <SponsorsTab sponsors={sponsors || []} isRTL={isRTL} />
        </TabsContent>

        <TabsContent value="related" className="mt-6">
          <RelatedTab relatedLegislations={relatedLegislations || []} isRTL={isRTL} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <HistoryTab statusHistory={statusHistory || []} isRTL={isRTL} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Sub-components

function StatusCard({
  label,
  value,
  colors,
}: {
  label: string
  value: string
  colors: { bg: string; text: string; border: string }
}) {
  return (
    <Card className={cn('border', colors.border)}>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground text-start">{label}</p>
        <p className={cn('text-lg font-semibold text-start', colors.text)}>{value}</p>
      </CardContent>
    </Card>
  )
}

function CommentPeriodCard({ endDate, isRTL }: { endDate: string; isRTL: boolean }) {
  const { t, i18n } = useTranslation('legislation')
  const daysRemaining = Math.ceil(
    (new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  )

  return (
    <Card className="border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground text-start">{t('commentPeriod.title')}</p>
        <p className="text-lg font-semibold text-amber-700 dark:text-amber-300 text-start">
          {t('commentPeriod.daysRemaining', { count: daysRemaining })}
        </p>
      </CardContent>
    </Card>
  )
}

function OverviewTab({
  legislation,
  isRTL,
}: {
  legislation: LegislationWithDetails
  isRTL: boolean
}) {
  const { t, i18n } = useTranslation('legislation')

  const summary =
    i18n.language === 'ar' && legislation.summary_ar
      ? legislation.summary_ar
      : legislation.summary_en

  const description =
    i18n.language === 'ar' && legislation.description_ar
      ? legislation.description_ar
      : legislation.description_en

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {/* Summary */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-start">{t('form.sections.basic')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-start whitespace-pre-wrap">{summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-start">{t('form.fields.descriptionEn')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-start whitespace-pre-wrap">{description}</p>
            </CardContent>
          </Card>
        )}

        {/* Comment Period Info */}
        {legislation.comment_period_status !== 'not_started' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-start">{t('commentPeriod.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground text-start">
                    {t('commentPeriod.status')}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {t(`commentPeriod.${legislation.comment_period_status}`)}
                  </Badge>
                </div>
                {legislation.comment_period_start && (
                  <div>
                    <p className="text-sm text-muted-foreground text-start">
                      {t('commentPeriod.startDate')}
                    </p>
                    <p className="font-medium text-start">
                      {new Date(legislation.comment_period_start).toLocaleDateString(
                        i18n.language === 'ar' ? 'ar-SA' : 'en-US',
                      )}
                    </p>
                  </div>
                )}
                {legislation.comment_period_end && (
                  <div>
                    <p className="text-sm text-muted-foreground text-start">
                      {t('commentPeriod.endDate')}
                    </p>
                    <p className="font-medium text-start">
                      {new Date(legislation.comment_period_end).toLocaleDateString(
                        i18n.language === 'ar' ? 'ar-SA' : 'en-US',
                      )}
                    </p>
                  </div>
                )}
              </div>
              {legislation.comment_submission_url && (
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <a
                    href={legislation.comment_submission_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('commentPeriod.submitUrl')}
                    <ExternalLink className={cn('h-4 w-4', isRTL ? 'me-2' : 'ms-2')} />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Key Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-start">{t('form.sections.dates')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {legislation.introduced_date && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground text-start">
                    {t('detail.introducedDate')}
                  </p>
                  <p className="font-medium text-start">
                    {new Date(legislation.introduced_date).toLocaleDateString(
                      i18n.language === 'ar' ? 'ar-SA' : 'en-US',
                    )}
                  </p>
                </div>
              </div>
            )}
            {legislation.effective_date && (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground text-start">
                    {t('detail.effectiveDate')}
                  </p>
                  <p className="font-medium text-start">
                    {new Date(legislation.effective_date).toLocaleDateString(
                      i18n.language === 'ar' ? 'ar-SA' : 'en-US',
                    )}
                  </p>
                </div>
              </div>
            )}
            {legislation.expiration_date && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground text-start">
                    {t('detail.expirationDate')}
                  </p>
                  <p className="font-medium text-start">
                    {new Date(legislation.expiration_date).toLocaleDateString(
                      i18n.language === 'ar' ? 'ar-SA' : 'en-US',
                    )}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Links */}
        {(legislation.source_url || legislation.official_text_url) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-start">{t('detail.sources')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {legislation.source_url && (
                <Button asChild variant="outline" className="w-full justify-start">
                  <a href={legislation.source_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                    {t('detail.sourceUrl')}
                  </a>
                </Button>
              )}
              {legislation.official_text_url && (
                <Button asChild variant="outline" className="w-full justify-start">
                  <a href={legislation.official_text_url} target="_blank" rel="noopener noreferrer">
                    <FileText className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                    {t('detail.officialText')}
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tags & Sectors */}
        {(legislation.tags?.length > 0 || legislation.sectors?.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-start">{t('form.fields.tags')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {legislation.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {legislation.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {legislation.sectors?.length > 0 && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground text-start">
                    {t('form.fields.sectors')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {legislation.sectors.map((sector) => (
                      <Badge key={sector} variant="outline">
                        {sector}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Linked Dossier */}
        {legislation.dossier && (
          <Card>
            <CardHeader>
              <CardTitle className="text-start">{t('detail.linkedDossier')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                to={`/dossiers/${legislation.dossier.type}s/${legislation.dossier.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <Building className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-start">
                  {i18n.language === 'ar' && legislation.dossier.name_ar
                    ? legislation.dossier.name_ar
                    : legislation.dossier.name_en}
                </span>
                <ChevronRight className={cn('h-4 w-4 ms-auto', isRTL && 'rotate-180')} />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Version Info */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-start">{t('detail.version')}</p>
                <p className="font-medium text-start">{legislation.version}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-start">{t('detail.lastUpdated')}</p>
                <p className="font-medium text-start">
                  {new Date(legislation.updated_at).toLocaleDateString(
                    i18n.language === 'ar' ? 'ar-SA' : 'en-US',
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DeadlinesTab({
  deadlines,
  legislationId,
  onComplete,
  isRTL,
}: {
  deadlines: LegislationDeadline[]
  legislationId: string
  onComplete: (id: string) => void
  isRTL: boolean
}) {
  const { t, i18n } = useTranslation('legislation')

  const sortedDeadlines = [...deadlines].sort(
    (a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime(),
  )

  if (deadlines.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">{t('deadlines.noDeadlines')}</h3>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sortedDeadlines.map((deadline) => {
        const daysRemaining = Math.ceil(
          (new Date(deadline.deadline_date).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        )
        const isOverdue = daysRemaining < 0 && !deadline.is_completed
        const isToday = daysRemaining === 0

        return (
          <Card
            key={deadline.id}
            className={cn(
              deadline.is_completed && 'opacity-60',
              isOverdue && 'border-red-300 dark:border-red-700',
            )}
          >
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{t(`deadlines.type.${deadline.deadline_type}`)}</Badge>
                    <Badge
                      className={cn(
                        PRIORITY_COLORS[deadline.priority].bg,
                        PRIORITY_COLORS[deadline.priority].text,
                      )}
                    >
                      {t(`priority.${deadline.priority}`)}
                    </Badge>
                    {deadline.is_completed && (
                      <Badge variant="secondary">
                        <CheckCircle2 className="h-3 w-3 me-1" />
                        {t('common:completed')}
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-medium text-start">
                    {i18n.language === 'ar' && deadline.title_ar
                      ? deadline.title_ar
                      : deadline.title_en}
                  </h4>
                  {deadline.description_en && (
                    <p className="text-sm text-muted-foreground text-start mt-1">
                      {i18n.language === 'ar' && deadline.description_ar
                        ? deadline.description_ar
                        : deadline.description_en}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-end">
                    <p className="font-medium">
                      {new Date(deadline.deadline_date).toLocaleDateString(
                        i18n.language === 'ar' ? 'ar-SA' : 'en-US',
                      )}
                    </p>
                    <p
                      className={cn(
                        'text-sm',
                        isOverdue && 'text-red-600 dark:text-red-400',
                        isToday && 'text-amber-600 dark:text-amber-400',
                        !isOverdue && !isToday && 'text-muted-foreground',
                      )}
                    >
                      {isOverdue
                        ? t('deadlines.overdue')
                        : isToday
                          ? t('deadlines.today')
                          : t('deadlines.daysRemaining', { count: daysRemaining })}
                    </p>
                  </div>
                  {!deadline.is_completed && (
                    <Button variant="outline" size="sm" onClick={() => onComplete(deadline.id)}>
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function AmendmentsTab({
  amendments,
  isRTL,
}: {
  amendments: LegislationAmendment[]
  isRTL: boolean
}) {
  const { t, i18n } = useTranslation('legislation')

  if (amendments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">{t('amendments.noAmendments')}</h3>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {amendments.map((amendment) => (
        <Card key={amendment.id}>
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {amendment.amendment_number && (
                  <Badge variant="outline">{amendment.amendment_number}</Badge>
                )}
                <Badge>{t(`amendments.status.${amendment.status}`)}</Badge>
              </div>
              <h4 className="font-medium text-start">
                {i18n.language === 'ar' && amendment.title_ar
                  ? amendment.title_ar
                  : amendment.title_en}
              </h4>
              {amendment.description_en && (
                <p className="text-sm text-muted-foreground text-start">
                  {i18n.language === 'ar' && amendment.description_ar
                    ? amendment.description_ar
                    : amendment.description_en}
                </p>
              )}
              {amendment.proposed_date && (
                <p className="text-sm text-muted-foreground text-start">
                  {t('amendments.form.proposedDate')}:{' '}
                  {new Date(amendment.proposed_date).toLocaleDateString(
                    i18n.language === 'ar' ? 'ar-SA' : 'en-US',
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SponsorsTab({ sponsors, isRTL }: { sponsors: LegislationSponsor[]; isRTL: boolean }) {
  const { t, i18n } = useTranslation('legislation')

  if (sponsors.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">{t('sponsors.noSponsors')}</h3>
        </CardContent>
      </Card>
    )
  }

  const groupedSponsors = sponsors.reduce(
    (acc, sponsor) => {
      if (!acc[sponsor.sponsor_type]) {
        acc[sponsor.sponsor_type] = []
      }
      acc[sponsor.sponsor_type].push(sponsor)
      return acc
    },
    {} as Record<string, LegislationSponsor[]>,
  )

  return (
    <div className="space-y-6">
      {Object.entries(groupedSponsors).map(([type, typedSponsors]) => (
        <div key={type}>
          <h3 className="font-semibold mb-3 text-start">{t(`sponsors.type.${type}`)}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {typedSponsors.map((sponsor) => (
              <Card key={sponsor.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-start">
                        {i18n.language === 'ar' && sponsor.name_ar
                          ? sponsor.name_ar
                          : sponsor.name_en || t('common:unknown')}
                      </p>
                      {sponsor.title_en && (
                        <p className="text-sm text-muted-foreground text-start">
                          {i18n.language === 'ar' && sponsor.title_ar
                            ? sponsor.title_ar
                            : sponsor.title_en}
                        </p>
                      )}
                      {sponsor.affiliation_en && (
                        <p className="text-sm text-muted-foreground text-start">
                          {i18n.language === 'ar' && sponsor.affiliation_ar
                            ? sponsor.affiliation_ar
                            : sponsor.affiliation_en}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function RelatedTab({
  relatedLegislations,
  isRTL,
}: {
  relatedLegislations: RelatedLegislationWithDetails[]
  isRTL: boolean
}) {
  const { t, i18n } = useTranslation('legislation')

  if (relatedLegislations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">{t('related.noRelated')}</h3>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {relatedLegislations.map((rel) => (
        <Card key={rel.id}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">{t(`related.type.${rel.relationship_type}`)}</Badge>
              <Link
                to="/legislation/$id"
                params={{ id: rel.related_legislation.id }}
                className="flex-1"
              >
                <div className="flex items-center gap-3 hover:text-primary transition-colors">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium text-start">
                    {i18n.language === 'ar' && rel.related_legislation.title_ar
                      ? rel.related_legislation.title_ar
                      : rel.related_legislation.title_en}
                  </span>
                  {rel.related_legislation.reference_number && (
                    <span className="text-sm text-muted-foreground">
                      ({rel.related_legislation.reference_number})
                    </span>
                  )}
                  <ChevronRight className={cn('h-4 w-4 ms-auto', isRTL && 'rotate-180')} />
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function HistoryTab({
  statusHistory,
  isRTL,
}: {
  statusHistory: LegislationStatusHistory[]
  isRTL: boolean
}) {
  const { t, i18n } = useTranslation('legislation')

  if (statusHistory.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <History className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">{t('history.noHistory')}</h3>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {statusHistory.map((entry, index) => (
        <Card key={entry.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="p-2 bg-muted rounded-full">
                  <History className="h-4 w-4" />
                </div>
                {index < statusHistory.length - 1 && (
                  <div className="absolute top-10 start-1/2 w-px h-full bg-border -translate-x-1/2" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {entry.from_status && (
                    <>
                      <Badge
                        variant="outline"
                        className={cn(
                          STATUS_COLORS[entry.from_status].bg,
                          STATUS_COLORS[entry.from_status].text,
                        )}
                      >
                        {t(`status.${entry.from_status}`)}
                      </Badge>
                      <ChevronRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
                    </>
                  )}
                  <Badge
                    className={cn(
                      STATUS_COLORS[entry.to_status].bg,
                      STATUS_COLORS[entry.to_status].text,
                    )}
                  >
                    {t(`status.${entry.to_status}`)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground text-start">
                  {new Date(entry.changed_at).toLocaleString(
                    i18n.language === 'ar' ? 'ar-SA' : 'en-US',
                  )}
                </p>
                {entry.change_reason && (
                  <p className="text-sm mt-2 text-start">
                    <span className="font-medium">{t('history.reason')}:</span>{' '}
                    {entry.change_reason}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function LegislationDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-12" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-24" />
        </div>
      </div>
    </div>
  )
}
