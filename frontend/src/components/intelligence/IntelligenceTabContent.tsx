/**
 * IntelligenceTabContent Component (Feature 029 - User Story 3 - T040)
 *
 * Comprehensive intelligence dashboard with four specialized sections:
 * - Economic Dashboard (GDP, trade, inflation indicators)
 * - Political Analysis (leadership, policy changes, stability)
 * - Security Assessment (threat levels, travel advisories)
 * - Bilateral Opportunities (Saudi-country relations, agreements)
 *
 * Features:
 * - Date range filtering
 * - Confidence level filtering
 * - Historical trends visualization
 * - Data source attribution
 * - Export functionality (placeholder)
 * - Mobile-first responsive grid
 * - RTL support with logical properties
 */

import React, { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAllIntelligence, useRefreshIntelligence } from '@/hooks/useIntelligence'
import { EconomicDashboard } from '@/components/intelligence/EconomicDashboard'
import { PoliticalAnalysis } from '@/components/intelligence/PoliticalAnalysis'
import { SecurityAssessment } from '@/components/intelligence/SecurityAssessment'
import { BilateralOpportunities } from '@/components/intelligence/BilateralOpportunities'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Globe, MapPin, Users, Maximize2, AlertCircle, RefreshCw } from 'lucide-react'
import type { IntelligenceReport } from '@/types/intelligence-reports.types'
import type { CountryDossier } from '@/lib/dossier-type-guards'

interface IntelligenceTabContentProps {
  dossierId: string
  dossier?: CountryDossier
}

export function IntelligenceTabContent({ dossierId, dossier }: IntelligenceTabContentProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  // Track if auto-generation has been attempted
  const [autoGenerationAttempted, setAutoGenerationAttempted] = React.useState(false)

  // Fetch all intelligence data
  const { data: intelligenceData, isLoading, isError, error } = useAllIntelligence(dossierId)

  // Refresh intelligence mutation
  const refreshMutation = useRefreshIntelligence()

  // Auto-generate intelligence when no data exists or data is stale (>1 month)
  useEffect(() => {
    // Skip if already attempted or currently generating
    if (autoGenerationAttempted || refreshMutation.isPending) {
      return
    }

    // Skip if still loading initial data
    if (isLoading) {
      return
    }

    // Case 1: No data exists (404 error or empty response)
    const hasNoData =
      (isError && error?.status === 404) || !intelligenceData || intelligenceData.data.length === 0

    if (hasNoData) {
      setAutoGenerationAttempted(true)
      refreshMutation.mutate(
        {
          entity_id: dossierId,
          intelligence_types: ['economic', 'political', 'security', 'bilateral'],
          force: false,
          priority: 'normal',
        },
        {
          onSuccess: (_data) => {
            // Auto-generation triggered successfully
          },
          onError: (_error) => {
            // Auto-generation failed
          },
        },
      )
      return
    }

    // Case 2: Data exists but is stale (>1 month old)
    if (intelligenceData?.data && intelligenceData.data.length > 0) {
      const oldestRefresh = Math.min(
        ...intelligenceData.data.map((report) =>
          new Date(report.last_refreshed_at || report.created_at).getTime(),
        ),
      )
      const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000 // 30 days

      if (oldestRefresh < oneMonthAgo) {
        setAutoGenerationAttempted(true)
        refreshMutation.mutate({
          entity_id: dossierId,
          intelligence_types: ['economic', 'political', 'security', 'bilateral'],
          force: true, // Force refresh for stale data
          priority: 'normal',
        })
      }
    }
  }, [
    dossierId,
    intelligenceData,
    isLoading,
    isError,
    error,
    autoGenerationAttempted,
    refreshMutation,
  ])

  // No filtering - show all reports
  const filteredReports = useMemo(() => {
    return intelligenceData?.data || []
  }, [intelligenceData])

  // Group reports by intelligence type
  const economicReports = useMemo(
    () => filteredReports.filter((r) => r.intelligence_type === 'economic'),
    [filteredReports],
  )

  const politicalReports = useMemo(
    () => filteredReports.filter((r) => r.intelligence_type === 'political'),
    [filteredReports],
  )

  const securityReports = useMemo(
    () => filteredReports.filter((r) => r.intelligence_type === 'security'),
    [filteredReports],
  )

  const bilateralReports = useMemo(
    () => filteredReports.filter((r) => r.intelligence_type === 'bilateral'),
    [filteredReports],
  )

  // Loading state
  if (isLoading) {
    return (
      <div
        className="space-y-6"
        dir={isRTL ? 'rtl' : 'ltr'}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">
          {t('intelligence.loadingDashboard', 'Loading intelligence dashboard...')}
        </span>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Skeleton className="h-10 w-full sm:w-48" />
          <Skeleton className="h-10 w-full sm:w-48" />
          <Skeleton className="h-10 w-full sm:w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </div>
    )
  }

  // Error state (but not 404, which is handled as empty state)
  if (isError && error?.status !== 404) {
    return (
      <Alert variant="destructive" dir={isRTL ? 'rtl' : 'ltr'}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error
            ? error.message
            : t('intelligence.error', 'Failed to load intelligence dashboard')}
        </AlertDescription>
      </Alert>
    )
  }

  // Handle generate intelligence
  const handleGenerateIntelligence = () => {
    refreshMutation.mutate({
      entity_id: dossierId,
      intelligence_types: ['economic', 'political', 'security', 'bilateral'],
      force: false,
      priority: 'normal',
    })
  }

  // Empty state or generating state
  if (
    (isError && error?.status === 404) ||
    !intelligenceData ||
    intelligenceData.data.length === 0
  ) {
    // Show generating message if auto-generation is in progress
    if (refreshMutation.isPending || (autoGenerationAttempted && !refreshMutation.isError)) {
      return (
        <div
          className="flex flex-col items-center justify-center py-12 px-4 text-center"
          dir={isRTL ? 'rtl' : 'ltr'}
          role="region"
          aria-live="polite"
          aria-busy="true"
        >
          <RefreshCw
            className="h-16 w-16 sm:h-20 sm:w-20 text-primary mb-6 animate-spin"
            aria-hidden="true"
          />

          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2">
            {t('intelligence.generating', 'Generating Intelligence...')}
          </h3>

          <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-md">
            {t(
              'intelligence.generatingDescription',
              'AI is analyzing available data to generate comprehensive intelligence insights. This may take 30-60 seconds.',
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 text-xs text-muted-foreground">
            <span>✓ Economic indicators</span>
            <span>✓ Political analysis</span>
            <span>✓ Security assessment</span>
            <span>✓ Bilateral relations</span>
          </div>
        </div>
      )
    }

    // Show empty state with manual generate button
    return (
      <div
        className="flex flex-col items-center justify-center py-12 px-4 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
        role="region"
        aria-live="polite"
      >
        <AlertCircle
          className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground mb-6"
          aria-hidden="true"
        />

        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2">
          {t('intelligence.noData', 'No Intelligence Available')}
        </h3>

        <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md">
          {t(
            'intelligence.noDataDescription',
            'Generate AI-powered intelligence insights for this country. The system will analyze available data to provide economic, political, security, and bilateral intelligence in both English and Arabic.',
          )}
        </p>

        <Button
          onClick={handleGenerateIntelligence}
          disabled={refreshMutation.isPending}
          size="lg"
          className="h-11 sm:h-12 px-6 sm:px-8 gap-2 min-w-11"
          aria-label={
            refreshMutation.isPending
              ? t('intelligence.generating', 'Generating intelligence...')
              : t('intelligence.generateButton', 'Generate Intelligence')
          }
        >
          <RefreshCw
            className={`h-4 w-4 sm:h-5 sm:w-5 ${refreshMutation.isPending ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>
            {refreshMutation.isPending
              ? t('intelligence.generating', 'Generating...')
              : t('intelligence.generateButton', 'Generate Intelligence')}
          </span>
        </Button>

        {refreshMutation.isError && (
          <Alert variant="destructive" className="mt-6 max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {refreshMutation.error instanceof Error
                ? refreshMutation.error.message
                : t(
                    'intelligence.generateError',
                    'Failed to generate intelligence. Please try again.',
                  )}
            </AlertDescription>
          </Alert>
        )}

        {refreshMutation.isSuccess && (
          <Alert className="mt-6 max-w-md">
            <AlertDescription>
              {t(
                'intelligence.generateSuccess',
                'Intelligence generation started successfully. Data will appear shortly.',
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  return (
    <div
      className="space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
      role="region"
      aria-label={t('intelligence.dashboardLabel', 'Intelligence dashboard')}
    >
      {/* Header with Geographic Context */}
      <div className="flex flex-col gap-4">
        {/* Title */}
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">
            {t('intelligence.dashboardTitle', 'Intelligence Dashboard')}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t(
              'intelligence.dashboardDescription',
              'Comprehensive analysis across economic, political, security, and bilateral dimensions',
            )}
          </p>
        </div>

        {/* Geographic Context Summary - Replaces Filters */}
        {dossier?.extension && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg border">
            {/* ISO Code */}
            <div className="flex items-start gap-2">
              <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {t('geographic.isoCode', 'ISO Code')}
                </p>
                <p className="text-sm font-semibold truncate">
                  {dossier.extension.iso_code_2 || dossier.extension.iso_code_3 || 'N/A'}
                </p>
              </div>
            </div>

            {/* Region */}
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t('geographic.region', 'Region')}</p>
                <p className="text-sm font-semibold truncate">
                  {dossier.extension.region || 'N/A'}
                </p>
              </div>
            </div>

            {/* Capital */}
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {t('geographic.capital', 'Capital')}
                </p>
                <p className="text-sm font-semibold truncate">
                  {(isRTL ? dossier.extension.capital_ar : dossier.extension.capital_en) ||
                    dossier.extension.capital_en ||
                    dossier.extension.capital_ar ||
                    'N/A'}
                </p>
              </div>
            </div>

            {/* Population */}
            <div className="flex items-start gap-2">
              <Users className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {t('geographic.population', 'Population')}
                </p>
                <p className="text-sm font-semibold truncate">
                  {dossier.extension.population
                    ? dossier.extension.population.toLocaleString()
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Area */}
            <div className="flex items-start gap-2">
              <Maximize2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {t('geographic.area', 'Area (km²)')}
                </p>
                <p className="text-sm font-semibold truncate">
                  {dossier.extension.area_sq_km
                    ? dossier.extension.area_sq_km.toLocaleString()
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Report Count */}
        <div className="text-xs text-muted-foreground">
          {t('intelligence.showingReports', 'Showing {{count}} of {{total}} reports', {
            count: filteredReports.length,
            total: intelligenceData.data.length,
          })}
        </div>
      </div>

      {/* Dashboard Sections Grid - Mobile First Responsive */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
        role="list"
        aria-label={t('intelligence.dashboardSectionsLabel', 'Intelligence sections')}
      >
        {/* Economic Dashboard */}
        <EconomicDashboard reports={economicReports} dossierId={dossierId} />

        {/* Political Analysis */}
        <PoliticalAnalysis reports={politicalReports} dossierId={dossierId} />

        {/* Security Assessment */}
        <SecurityAssessment reports={securityReports} dossierId={dossierId} />

        {/* Bilateral Opportunities */}
        <BilateralOpportunities reports={bilateralReports} dossierId={dossierId} />
      </div>
    </div>
  )
}
