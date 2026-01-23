/**
 * AI Suggestion Panel Component
 *
 * Displays AI-powered entity link suggestions with confidence scores and reasoning.
 * Implements mobile-first responsive design and RTL support.
 *
 * Features:
 * - Loading state with 2-3 second indicator (SC-002)
 * - Graceful degradation when AI service unavailable
 * - Confidence score visualization
 * - One-click acceptance
 * - Fallback to manual search
 *
 * Mobile-first breakpoints:
 * - Base (320px+): Vertical stacking, full-width cards
 * - sm (640px+): Grid layout with 2 columns
 * - lg (1024px+): Grid layout with 3 columns
 *
 * @module frontend/src/components/entity-links/AISuggestionPanel
 */

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, AlertCircle, Search, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Skeleton } from '../ui/skeleton'
import {
  useAISuggestions,
  useAcceptAISuggestion,
  useAISuggestionAnalytics,
} from '@/hooks/useAiSuggestions'
import type { AILinkSuggestion } from '../../types/ai-suggestions.types'

interface AISuggestionPanelProps {
  intakeId: string
  onManualSearchClick: () => void
  onSuggestionAccepted: (link: any) => void
}

export function AISuggestionPanel({
  intakeId,
  onManualSearchClick,
  onSuggestionAccepted,
}: AISuggestionPanelProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const [suggestionsEnabled, setSuggestionsEnabled] = useState(false)
  const [suggestionStartTime, setSuggestionStartTime] = useState<number | null>(null)

  const analytics = useAISuggestionAnalytics(intakeId)

  // Fetch AI suggestions (only when enabled)
  const {
    data: suggestionsResponse,
    isLoading,
    error,
    refetch,
  } = useAISuggestions(intakeId, {
    enabled: suggestionsEnabled,
  })

  const acceptMutation = useAcceptAISuggestion(intakeId)

  // Track when suggestions are requested
  useEffect(() => {
    if (suggestionsEnabled && !suggestionStartTime) {
      setSuggestionStartTime(Date.now())
    }
  }, [suggestionsEnabled, suggestionStartTime])

  // Track when suggestions are received
  useEffect(() => {
    if (suggestionsResponse && suggestionStartTime) {
      analytics.trackSuggestionGenerated(
        suggestionsResponse.suggestions.length,
        suggestionsResponse.metadata?.cache_hit ?? false,
      )
    }
  }, [suggestionsResponse, suggestionStartTime, analytics])

  const handleGetSuggestions = () => {
    setSuggestionsEnabled(true)
    setSuggestionStartTime(Date.now())
  }

  const handleAcceptSuggestion = (suggestion: AILinkSuggestion) => {
    const acceptStartTime = Date.now()

    acceptMutation.mutate(
      {
        suggestion_id: suggestion.suggestion_id,
        entity_id: suggestion.entity_id,
        entity_type: suggestion.entity_type,
        link_type: suggestion.suggested_link_type,
      },
      {
        onSuccess: (data) => {
          const timeToAccept = Date.now() - acceptStartTime

          analytics.trackSuggestionAccepted(
            suggestion.suggestion_id,
            suggestion.rank,
            suggestion.confidence_score,
            timeToAccept,
          )

          onSuggestionAccepted(data.link)
        },
      },
    )
  }

  const handleFallbackToManualSearch = () => {
    analytics.trackFallbackToManualSearch('user_clicked_manual_search')
    onManualSearchClick()
  }

  // Format confidence score as percentage
  const formatConfidence = (score: number) => {
    return `${Math.round(score * 100)}%`
  }

  // Get confidence badge variant
  const getConfidenceBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 0.85) return 'default' // High confidence (green)
    if (score >= 0.75) return 'secondary' // Medium confidence (blue)
    return 'destructive' // Low confidence (red)
  }

  // Initial state: Show "Get AI Suggestions" button
  if (!suggestionsEnabled) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-start">
            <Sparkles className={`size-5 text-purple-500 ${isRTL ? 'ms-2' : 'me-2'}`} />
            {t('entityLinks.aiSuggestions.title', 'AI-Powered Suggestions')}
          </CardTitle>
          <CardDescription className="text-start">
            {t(
              'entityLinks.aiSuggestions.description',
              'Let AI analyze your intake content and suggest relevant entities to link',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGetSuggestions}
            className="w-full px-4 sm:w-auto"
            variant="default"
          >
            <Sparkles className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            {t('entityLinks.aiSuggestions.getButton', 'Get AI Suggestions')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Loading state: Show skeleton cards (2-3 second indicator)
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-start">
            <RefreshCw
              className={`size-5 animate-spin text-purple-500 ${isRTL ? 'ms-2' : 'me-2'}`}
            />
            {t('entityLinks.aiSuggestions.loading', 'Analyzing intake content...')}
          </CardTitle>
          <CardDescription className="text-start">
            {t('entityLinks.aiSuggestions.loadingDescription', 'This usually takes 2-3 seconds')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="mb-2 h-6 w-3/4" />
                <Skeleton className="mb-4 h-4 w-1/2" />
                <Skeleton className="mb-2 h-16 w-full" />
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state: Show fallback to manual search
  if (error) {
    const errorData = (error as any).response?.data
    const isFallbackAvailable = errorData?.fallback === 'manual_search'

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-start text-destructive">
            <AlertCircle className={`size-5 ${isRTL ? 'ms-2' : 'me-2'}`} />
            {t('entityLinks.aiSuggestions.error', 'AI Service Unavailable')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription className="text-start">
              {errorData?.details ||
                t(
                  'entityLinks.aiSuggestions.errorDescription',
                  'Unable to generate AI suggestions at this time',
                )}
            </AlertDescription>
          </Alert>

          {isFallbackAvailable && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleFallbackToManualSearch} variant="default" className="flex-1 ">
                <Search className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                {t('entityLinks.aiSuggestions.manualSearch', 'Use Manual Search')}
              </Button>

              {errorData?.retry_after && (
                <Button
                  onClick={() => {
                    setSuggestionsEnabled(false)
                    setTimeout(() => setSuggestionsEnabled(true), 1000)
                  }}
                  variant="outline"
                  className=""
                >
                  <RefreshCw className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('entityLinks.aiSuggestions.retry', 'Retry')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Success state: Show suggestions
  const suggestions = suggestionsResponse?.suggestions || []

  if (suggestions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-start">
            {t('entityLinks.aiSuggestions.noResults', 'No Suggestions Found')}
          </CardTitle>
          <CardDescription className="text-start">
            {t(
              'entityLinks.aiSuggestions.noResultsDescription',
              'AI could not find relevant entities. Try manual search.',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleFallbackToManualSearch}
            variant="default"
            className="w-full sm:w-auto "
          >
            <Search className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            {t('entityLinks.aiSuggestions.manualSearch', 'Use Manual Search')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-start">
          <CheckCircle2 className={`size-5 text-green-500 ${isRTL ? 'ms-2' : 'me-2'}`} />
          {t('entityLinks.aiSuggestions.resultsTitle', 'AI Suggestions')}
        </CardTitle>
        <CardDescription className="text-start">
          {t('entityLinks.aiSuggestions.resultsDescription', {
            count: suggestions.length,
            defaultValue: `Found ${suggestions.length} relevant entities. Click to create link.`,
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((suggestion) => (
            <Card
              key={suggestion.suggestion_id}
              className="p-4 transition-colors hover:border-primary"
            >
              <div className="space-y-3">
                {/* Entity name and type */}
                <div>
                  <h4 className="line-clamp-2 text-start text-sm font-semibold sm:text-base">
                    {suggestion.entity_name}
                  </h4>
                  <p className="mt-1 text-start text-xs text-muted-foreground">
                    {t(`entityTypes.${suggestion.entity_type}`, suggestion.entity_type)}
                  </p>
                </div>

                {/* Confidence score */}
                <div className="flex items-center gap-2">
                  <Badge variant={getConfidenceBadgeVariant(suggestion.confidence_score)}>
                    {formatConfidence(suggestion.confidence_score)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t('entityLinks.aiSuggestions.confidence', 'Confidence')}
                  </span>
                </div>

                {/* Reasoning */}
                <p className="line-clamp-3 text-start text-xs text-muted-foreground">
                  {suggestion.reasoning}
                </p>

                {/* Accept button */}
                <Button
                  onClick={() => handleAcceptSuggestion(suggestion)}
                  disabled={acceptMutation.isPending}
                  className="w-full "
                  size="sm"
                >
                  {acceptMutation.isPending ? (
                    <>
                      <RefreshCw className={`size-3 animate-spin ${isRTL ? 'ms-2' : 'me-2'}`} />
                      {t('entityLinks.aiSuggestions.accepting', 'Creating...')}
                    </>
                  ) : (
                    <>
                      {t('entityLinks.aiSuggestions.accept', 'Create Link')}
                      {suggestion.rank === 1 && ' (Primary)'}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Manual search fallback */}
        <div className="mt-4 border-t pt-4">
          <Button
            onClick={handleFallbackToManualSearch}
            variant="outline"
            className="w-full sm:w-auto "
          >
            <Search className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            {t('entityLinks.aiSuggestions.stillUseManualSearch', 'Or use manual search')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
