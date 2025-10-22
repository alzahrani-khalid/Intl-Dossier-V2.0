/**
 * AI Extraction Status Component
 *
 * Shows sync loading indicator OR async progress with estimated time
 * Displays extraction results with confidence scores
 * Flags low-confidence items (<0.7)
 *
 * Mobile-first, RTL-safe
 */

import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExtractionResult {
  extraction_id: string;
  decisions: Array<{
    description: string;
    rationale: string | null;
    decision_maker: string;
    confidence_score: number;
  }>;
  commitments: Array<{
    description: string;
    owner_name: string;
    due_date: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    confidence_score: number;
  }>;
  risks: Array<{
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    likelihood: 'rare' | 'unlikely' | 'possible' | 'likely' | 'certain';
    mitigation_strategy?: string;
    confidence_score: number;
  }>;
  follow_up_actions: Array<{
    description: string;
    confidence_score: number;
  }>;
  processing_time_ms?: number;
}

interface AIExtractionStatusProps {
  mode: 'sync' | 'async';
  status: 'idle' | 'processing' | 'completed' | 'error';
  result?: ExtractionResult;
  error?: string;
  estimatedTimeMs?: number;
  progressPercent?: number;
  onAcceptSuggestions?: (result: ExtractionResult) => void;
  onRejectSuggestions?: () => void;
}

const CONFIDENCE_THRESHOLD = 0.7;

export function AIExtractionStatus({
  mode,
  status,
  result,
  error,
  estimatedTimeMs,
  progressPercent = 0,
  onAcceptSuggestions,
  onRejectSuggestions
}: AIExtractionStatusProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  /**
   * Get confidence badge variant
   */
  const getConfidenceBadge = (score: number) => {
    if (score >= 0.9) {
      return { variant: 'default' as const, label: t('ai.confidence.high'), icon: TrendingUp };
    }
    if (score >= CONFIDENCE_THRESHOLD) {
      return { variant: 'secondary' as const, label: t('ai.confidence.medium'), icon: null };
    }
    return { variant: 'destructive' as const, label: t('ai.confidence.low'), icon: AlertTriangle };
  };

  /**
   * Format processing time
   */
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  /**
   * Render loading state
   */
  if (status === 'idle') {
    return null;
  }

  if (status === 'processing') {
    return (
      <Card dir={isRTL ? 'rtl' : 'ltr'}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
            <div className="flex-1">
              <CardTitle className="text-base sm:text-lg">
                {t('ai.extraction.processing')}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {mode === 'sync' ? t('ai.extraction.sync_mode') : t('ai.extraction.async_mode')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {mode === 'async' && estimatedTimeMs && (
            <>
              <Progress value={progressPercent} className="mb-2" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('ai.extraction.estimated_time', { time: formatTime(estimatedTimeMs) })}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  /**
   * Render error state
   */
  if (status === 'error') {
    return (
      <Alert variant="destructive" dir={isRTL ? 'rtl' : 'ltr'}>
        <AlertTriangle className={`h-4 w-4 ${isRTL ? 'ms-0 me-2' : 'me-0 ms-2'}`} />
        <AlertDescription className="text-sm">
          {error || t('ai.extraction.error')}
        </AlertDescription>
      </Alert>
    );
  }

  /**
   * Render completed state with results
   */
  if (status === 'completed' && result) {
    const totalItems =
      result.decisions.length +
      result.commitments.length +
      result.risks.length +
      result.follow_up_actions.length;

    const lowConfidenceItems = [
      ...result.decisions.filter(d => d.confidence_score < CONFIDENCE_THRESHOLD),
      ...result.commitments.filter(c => c.confidence_score < CONFIDENCE_THRESHOLD),
      ...result.risks.filter(r => r.confidence_score < CONFIDENCE_THRESHOLD),
      ...result.follow_up_actions.filter(a => a.confidence_score < CONFIDENCE_THRESHOLD)
    ];

    return (
      <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Success header */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <CardTitle className="text-base sm:text-lg">
                  {t('ai.extraction.completed')}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t('ai.extraction.found_items', { count: totalItems })}
                  {result.processing_time_ms && (
                    <span className="ms-2">
                      ({formatTime(result.processing_time_ms)})
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Low confidence warning */}
        {lowConfidenceItems.length > 0 && (
          <Alert>
            <AlertTriangle className={`h-4 w-4 ${isRTL ? 'ms-0 me-2' : 'me-0 ms-2'}`} />
            <AlertDescription className="text-sm">
              {t('ai.extraction.low_confidence_warning', { count: lowConfidenceItems.length })}
            </AlertDescription>
          </Alert>
        )}

        {/* Extraction results summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {result.decisions.length > 0 && (
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm">{t('ai.extraction.decisions')}</CardTitle>
                <div className="text-2xl font-bold">{result.decisions.length}</div>
              </CardHeader>
            </Card>
          )}

          {result.commitments.length > 0 && (
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm">{t('ai.extraction.commitments')}</CardTitle>
                <div className="text-2xl font-bold">{result.commitments.length}</div>
              </CardHeader>
            </Card>
          )}

          {result.risks.length > 0 && (
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm">{t('ai.extraction.risks')}</CardTitle>
                <div className="text-2xl font-bold">{result.risks.length}</div>
              </CardHeader>
            </Card>
          )}

          {result.follow_up_actions.length > 0 && (
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm">{t('ai.extraction.actions')}</CardTitle>
                <div className="text-2xl font-bold">{result.follow_up_actions.length}</div>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Detailed results preview */}
        <div className="space-y-3">
          {/* Decisions */}
          {result.decisions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base">
                  {t('ai.extraction.decisions')} ({result.decisions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.decisions.slice(0, 3).map((decision, idx) => {
                  const badge = getConfidenceBadge(decision.confidence_score);
                  return (
                    <div key={idx} className="p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm flex-1">{decision.description}</p>
                        <Badge variant={badge.variant} className="flex-shrink-0 text-xs">
                          {badge.icon && <badge.icon className={`h-3 w-3 ${isRTL ? 'ms-1' : 'me-1'}`} />}
                          {(decision.confidence_score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('ai.extraction.decision_maker')}: {decision.decision_maker}
                      </p>
                    </div>
                  );
                })}
                {result.decisions.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{result.decisions.length - 3} {t('common.more')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Commitments */}
          {result.commitments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base">
                  {t('ai.extraction.commitments')} ({result.commitments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.commitments.slice(0, 3).map((commitment, idx) => {
                  const badge = getConfidenceBadge(commitment.confidence_score);
                  return (
                    <div key={idx} className="p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm flex-1">{commitment.description}</p>
                        <Badge variant={badge.variant} className="flex-shrink-0 text-xs">
                          {badge.icon && <badge.icon className={`h-3 w-3 ${isRTL ? 'ms-1' : 'me-1'}`} />}
                          {(commitment.confidence_score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{t('ai.extraction.owner')}: {commitment.owner_name}</span>
                        <span>{t('ai.extraction.due')}: {commitment.due_date}</span>
                      </div>
                    </div>
                  );
                })}
                {result.commitments.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{result.commitments.length - 3} {t('common.more')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action buttons */}
        {(onAcceptSuggestions || onRejectSuggestions) && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onAcceptSuggestions && (
              <button
                onClick={() => onAcceptSuggestions(result)}
                className="h-11 px-6 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                {t('ai.extraction.accept_suggestions')}
              </button>
            )}
            {onRejectSuggestions && (
              <button
                onClick={onRejectSuggestions}
                className="h-11 px-6 bg-secondary text-secondary-foreground rounded-md font-medium text-sm hover:bg-secondary/80 transition-colors"
              >
                {t('ai.extraction.reject_suggestions')}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
