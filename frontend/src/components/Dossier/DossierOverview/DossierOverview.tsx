/**
 * DossierOverview Component
 * Feature: Everything about [Dossier] comprehensive view
 *
 * One-click view that aggregates all connections to a dossier in a structured summary.
 * Sections: Related Dossiers, Documents, Work Items, Calendar Events, Key Contacts,
 * Activity Timeline. Includes export capability for the complete dossier profile.
 *
 * Mobile-first, RTL-supported.
 */

import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  ChevronRight,
  Home,
  Download,
  RefreshCw,
  FileJson,
  FileText,
  File,
  Network,
  FileStack,
  ClipboardList,
  Calendar,
  Users,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDossierOverview, useDossierExport } from '@/hooks/useDossierOverview'
import { DossierTypeIcon } from '../DossierTypeIcon'
import { RelatedDossiersSection } from './sections/RelatedDossiersSection'
import { DocumentsSection } from './sections/DocumentsSection'
import { WorkItemsSection } from './sections/WorkItemsSection'
import { CalendarEventsSection } from './sections/CalendarEventsSection'
import { KeyContactsSection } from './sections/KeyContactsSection'
import { ActivityTimelineSection } from './sections/ActivityTimelineSection'
import type { DossierOverviewProps, ExportFormat } from '@/types/dossier-overview.types'

/**
 * Stat card component for the overview header
 */
function StatCard({
  icon: Icon,
  label,
  value,
  variant = 'default',
  isRTL,
}: {
  icon: React.ElementType
  label: string
  value: number
  variant?: 'default' | 'warning' | 'success'
  isRTL: boolean
}) {
  const variantStyles = {
    default: 'bg-card',
    warning: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
    success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  }

  const iconStyles = {
    default: 'text-primary',
    warning: 'text-amber-600 dark:text-amber-400',
    success: 'text-green-600 dark:text-green-400',
  }

  return (
    <Card className={`${variantStyles[variant]} transition-colors`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className={`rounded-lg bg-background/80 p-2 ${iconStyles[variant]}`}>
            <Icon className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground sm:text-sm">{label}</p>
            <p className="text-lg font-bold sm:text-xl">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Loading skeleton for the overview
 */
function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  )
}

/**
 * Main DossierOverview component
 */
export function DossierOverview({
  dossierId,
  className = '',
  onExport,
  showExportButton = true,
}: DossierOverviewProps) {
  const { t, i18n } = useTranslation('dossier-overview')
  const isRTL = i18n.language === 'ar'

  const [activeTab, setActiveTab] = useState('related')

  // Fetch dossier overview
  const { data, isLoading, isError, error, refetch } = useDossierOverview(dossierId)

  // Export functionality
  const { exportDossier, isExporting } = useDossierExport()

  // Handle export
  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (onExport) {
        onExport(format)
        return
      }

      await exportDossier({
        dossier_id: dossierId,
        format,
        include_sections: [
          'related_dossiers',
          'documents',
          'work_items',
          'calendar_events',
          'key_contacts',
          'activity_timeline',
        ],
        language: isRTL ? 'ar' : 'en',
      })
    },
    [dossierId, exportDossier, onExport, isRTL],
  )

  // Tab configuration
  const tabs = useMemo(
    () => [
      {
        id: 'related',
        label: t('tabs.relatedDossiers'),
        icon: Network,
        count: data?.stats.related_dossiers_count || 0,
      },
      {
        id: 'documents',
        label: t('tabs.documents'),
        icon: FileStack,
        count: data?.stats.documents_count || 0,
      },
      {
        id: 'workItems',
        label: t('tabs.workItems'),
        icon: ClipboardList,
        count: data?.stats.work_items_count || 0,
        badge:
          (data?.stats.overdue_work_items || 0) > 0
            ? { value: data?.stats.overdue_work_items, variant: 'destructive' as const }
            : undefined,
      },
      {
        id: 'calendar',
        label: t('tabs.calendarEvents'),
        icon: Calendar,
        count: data?.stats.calendar_events_count || 0,
      },
      {
        id: 'contacts',
        label: t('tabs.keyContacts'),
        icon: Users,
        count: data?.stats.key_contacts_count || 0,
      },
      {
        id: 'activity',
        label: t('tabs.activityTimeline'),
        icon: Activity,
        count: data?.stats.recent_activities_count || 0,
      },
    ],
    [t, data?.stats],
  )

  // Loading state
  if (isLoading) {
    return (
      <div className={`container mx-auto p-4 sm:p-6 lg:px-8 ${className}`}>
        <OverviewSkeleton />
      </div>
    )
  }

  // Error state
  if (isError || !data) {
    return (
      <div className={`container mx-auto p-4 sm:p-6 lg:px-8 ${className}`}>
        <Card className="border-destructive">
          <CardContent className="p-6 text-center sm:p-8">
            <AlertCircle className="mx-auto mb-4 size-12 text-destructive" />
            <h2 className="mb-2 text-lg font-semibold">{t('error.title')}</h2>
            <p className="mb-4 text-muted-foreground">{error?.message || t('error.description')}</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="me-2 size-4" />
              {t('actions.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { dossier, stats } = data

  return (
    <div
      className={`container mx-auto p-4 sm:p-6 lg:p-8 ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Breadcrumbs */}
      <nav
        className="mb-4 flex items-center gap-2 text-sm sm:mb-6 sm:text-base"
        aria-label="Breadcrumb"
      >
        <Link
          to="/dossiers"
          className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground sm:gap-2"
        >
          <Home className="size-4" />
          <span>{t('nav.dossiersHub')}</span>
        </Link>
        <ChevronRight className={`size-4 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`} />
        <span className="truncate font-medium text-foreground">
          {isRTL ? dossier.name_ar : dossier.name_en}
        </span>
      </nav>

      {/* Header */}
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="rounded-lg bg-primary/10 p-2 sm:p-3">
              <DossierTypeIcon type={dossier.type} className="size-6 sm:size-8" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="mb-1 text-xl font-bold sm:mb-2 sm:text-2xl md:text-3xl">
                {isRTL ? dossier.name_ar : dossier.name_en}
              </h1>
              {(dossier.description_en || dossier.description_ar) && (
                <p className="line-clamp-2 text-sm text-muted-foreground sm:text-base">
                  {isRTL ? dossier.description_ar : dossier.description_en}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline">{t(`dossierType.${dossier.type}`)}</Badge>
                <Badge variant={dossier.status === 'active' ? 'default' : 'secondary'}>
                  {t(`status.${dossier.status}`)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="min-h-10">
              <RefreshCw className="me-2 size-4" />
              <span className="hidden sm:inline">{t('actions.refresh')}</span>
            </Button>

            {showExportButton && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" disabled={isExporting} className="min-h-10">
                    <Download className="me-2 size-4" />
                    {isExporting ? t('actions.exporting') : t('actions.export')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    <FileJson className="me-2 size-4" />
                    {t('export.json')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <File className="me-2 size-4" />
                    {t('export.pdf')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('docx')}>
                    <FileText className="me-2 size-4" />
                    {t('export.docx')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="mb-6 sm:mb-8">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          <StatCard
            icon={Network}
            label={t('stats.relatedDossiers')}
            value={stats.related_dossiers_count}
            isRTL={isRTL}
          />
          <StatCard
            icon={FileStack}
            label={t('stats.documents')}
            value={stats.documents_count}
            isRTL={isRTL}
          />
          <StatCard
            icon={ClipboardList}
            label={t('stats.workItems')}
            value={stats.work_items_count}
            isRTL={isRTL}
          />
          <StatCard
            icon={Clock}
            label={t('stats.pendingWork')}
            value={stats.pending_work_items}
            variant={stats.pending_work_items > 0 ? 'warning' : 'default'}
            isRTL={isRTL}
          />
          <StatCard
            icon={AlertCircle}
            label={t('stats.overdueWork')}
            value={stats.overdue_work_items}
            variant={stats.overdue_work_items > 0 ? 'warning' : 'success'}
            isRTL={isRTL}
          />
          <StatCard
            icon={Calendar}
            label={t('stats.upcomingEvents')}
            value={stats.upcoming_events_count}
            isRTL={isRTL}
          />
        </div>
      </section>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 h-auto w-full flex-nowrap justify-start overflow-x-auto p-1 sm:mb-6">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex min-h-10 shrink-0 items-center gap-1 px-2 sm:gap-2 sm:px-4"
            >
              <tab.icon className="size-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="text-xs text-muted-foreground">({tab.count})</span>
              {tab.badge && (
                <Badge variant={tab.badge.variant} className="ms-1 text-xs">
                  {tab.badge.value}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="related" className="mt-0">
          <RelatedDossiersSection data={data.related_dossiers} isRTL={isRTL} />
        </TabsContent>

        <TabsContent value="documents" className="mt-0">
          <DocumentsSection data={data.documents} dossierId={dossierId} isRTL={isRTL} />
        </TabsContent>

        <TabsContent value="workItems" className="mt-0">
          <WorkItemsSection data={data.work_items} dossierId={dossierId} isRTL={isRTL} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <CalendarEventsSection data={data.calendar_events} isRTL={isRTL} />
        </TabsContent>

        <TabsContent value="contacts" className="mt-0">
          <KeyContactsSection data={data.key_contacts} isRTL={isRTL} />
        </TabsContent>

        <TabsContent value="activity" className="mt-0">
          <ActivityTimelineSection
            data={data.activity_timeline}
            dossierId={dossierId}
            isRTL={isRTL}
          />
        </TabsContent>
      </Tabs>

      {/* Generated timestamp */}
      <footer className="mt-6 border-t pt-4 text-xs text-muted-foreground sm:mt-8 sm:text-sm">
        {t('footer.generatedAt', {
          date: new Date(data.generated_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US'),
        })}
      </footer>
    </div>
  )
}

export default DossierOverview
