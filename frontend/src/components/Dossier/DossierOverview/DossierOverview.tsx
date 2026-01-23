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
          <div className={`p-2 rounded-lg bg-background/80 ${iconStyles[variant]}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-lg sm:text-xl font-bold">{value}</p>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
      <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${className}`}>
        <OverviewSkeleton />
      </div>
    )
  }

  // Error state
  if (isError || !data) {
    return (
      <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${className}`}>
        <Card className="border-destructive">
          <CardContent className="p-6 sm:p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">{t('error.title')}</h2>
            <p className="text-muted-foreground mb-4">{error?.message || t('error.description')}</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 me-2" />
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
      className={`container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Breadcrumbs */}
      <nav
        className="flex items-center gap-2 text-sm sm:text-base mb-4 sm:mb-6"
        aria-label="Breadcrumb"
      >
        <Link
          to="/dossiers"
          className="flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>{t('nav.dossiersHub')}</span>
        </Link>
        <ChevronRight className={`h-4 w-4 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`} />
        <span className="text-foreground font-medium truncate">
          {isRTL ? dossier.name_ar : dossier.name_en}
        </span>
      </nav>

      {/* Header */}
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
              <DossierTypeIcon type={dossier.type} className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
                {isRTL ? dossier.name_ar : dossier.name_en}
              </h1>
              {(dossier.description_en || dossier.description_ar) && (
                <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
                  {isRTL ? dossier.description_ar : dossier.description_en}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{t(`dossierType.${dossier.type}`)}</Badge>
                <Badge variant={dossier.status === 'active' ? 'default' : 'secondary'}>
                  {t(`status.${dossier.status}`)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="min-h-10">
              <RefreshCw className="h-4 w-4 me-2" />
              <span className="hidden sm:inline">{t('actions.refresh')}</span>
            </Button>

            {showExportButton && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" disabled={isExporting} className="min-h-10">
                    <Download className="h-4 w-4 me-2" />
                    {isExporting ? t('actions.exporting') : t('actions.export')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    <FileJson className="h-4 w-4 me-2" />
                    {t('export.json')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <File className="h-4 w-4 me-2" />
                    {t('export.pdf')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('docx')}>
                    <FileText className="h-4 w-4 me-2" />
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
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
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-4 sm:mb-6 h-auto p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-1 sm:gap-2 min-h-10 px-2 sm:px-4 shrink-0"
            >
              <tab.icon className="h-4 w-4" />
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
      <footer className="mt-6 sm:mt-8 pt-4 border-t text-xs sm:text-sm text-muted-foreground">
        {t('footer.generatedAt', {
          date: new Date(data.generated_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US'),
        })}
      </footer>
    </div>
  )
}

export default DossierOverview
