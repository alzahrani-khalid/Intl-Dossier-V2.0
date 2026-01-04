/**
 * BriefGenerationPanel Component
 * Feature: 033-ai-brief-generation
 * Task: T024
 *
 * Panel for generating AI briefs with progress indicator, streaming, and retry
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { useGenerateBrief, BriefGenerationParams } from '@/hooks/useGenerateBrief'
import { formatAIError } from '@/utils/ai-errors'
import {
  Loader2,
  Sparkles,
  X,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  RotateCcw,
  PenLine,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BriefGenerationPanelProps {
  engagementId?: string
  dossierId?: string
  onBriefGenerated?: (briefId: string) => void
  onClose?: () => void
  className?: string
}

type GenerationPhase = 'idle' | 'context' | 'generating' | 'success' | 'error' | 'manual'

export function BriefGenerationPanel({
  engagementId,
  dossierId,
  onBriefGenerated,
  onClose,
  className,
}: BriefGenerationPanelProps) {
  const { t, i18n } = useTranslation('ai-brief')
  const isRTL = i18n.language === 'ar'
  const [customPrompt, setCustomPrompt] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [phase, setPhase] = useState<GenerationPhase>('idle')

  // Manual fallback state
  const [manualContent, setManualContent] = useState({
    summary: '',
    background: '',
    recommendations: '',
  })

  const { generate, brief, streamingContent, isGenerating, progress, error, cancel, retry, reset } =
    useGenerateBrief()

  // Track phase based on state changes
  useEffect(() => {
    if (error) {
      setPhase('error')
    } else if (brief && brief.status !== 'generating') {
      setPhase('success')
    } else if (isGenerating) {
      // Determine sub-phase based on progress
      if (progress < 10) {
        setPhase('context')
      } else {
        setPhase('generating')
      }
    } else if (!isGenerating && !brief && !error) {
      setPhase('idle')
    }
  }, [isGenerating, progress, brief, error])

  // Format error using ai-errors utility
  const formattedError = error ? formatAIError(error, t) : null

  const handleGenerate = async () => {
    const params: BriefGenerationParams = {
      engagementId,
      dossierId,
      customPrompt: customPrompt || undefined,
      language: i18n.language as 'en' | 'ar',
    }

    await generate(params)
  }

  const handleViewBrief = () => {
    if (brief?.id && onBriefGenerated) {
      onBriefGenerated(brief.id)
    }
  }

  const handleGenerateAnother = () => {
    reset() // Clear all hook state including brief
    setPhase('idle')
    setCustomPrompt('')
    setShowAdvanced(false)
    setManualContent({ summary: '', background: '', recommendations: '' })
  }

  const handleSwitchToManual = () => {
    reset() // Clear error state
    setPhase('manual')
  }

  const handleManualSubmit = () => {
    // TODO: Implement manual brief submission
    // For now, just show success message
    console.log('Manual brief submitted:', manualContent)
    // In a real implementation, this would call an API to save the manual brief
  }

  const getPhaseLabel = () => {
    switch (phase) {
      case 'context':
        return t('phases.context', 'Gathering context...')
      case 'generating':
        return t('phases.generating', 'Generating brief...')
      case 'success':
        return t('phases.success', 'Complete')
      case 'error':
        return t('phases.error', 'Error')
      default:
        return ''
    }
  }

  return (
    <Card className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={cn('h-5 w-5 text-primary', isRTL && 'rotate-180')} />
            <CardTitle className="text-lg">{t('title', 'Generate AI Brief')}</CardTitle>
          </div>
          {isGenerating && (
            <Button variant="ghost" size="sm" onClick={cancel} className="h-8">
              <X className="h-4 w-4 me-1" />
              {t('cancel', 'Cancel')}
            </Button>
          )}
        </div>
        <CardDescription>
          {t('description', 'Generate a comprehensive brief using AI analysis')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Three-step progress indicator */}
        {(phase === 'context' || phase === 'generating' || phase === 'success') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {/* Step indicators */}
              <div className="flex items-center gap-2 flex-1">
                <StepIndicator
                  step={1}
                  label={t('steps.context', 'Context')}
                  active={phase === 'context'}
                  complete={phase === 'generating' || phase === 'success'}
                />
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-1',
                    phase === 'generating' || phase === 'success' ? 'bg-primary' : 'bg-muted',
                  )}
                />
                <StepIndicator
                  step={2}
                  label={t('steps.generating', 'Generate')}
                  active={phase === 'generating'}
                  complete={phase === 'success'}
                />
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-1',
                    phase === 'success' ? 'bg-primary' : 'bg-muted',
                  )}
                />
                <StepIndicator
                  step={3}
                  label={t('steps.review', 'Review')}
                  active={phase === 'success'}
                  complete={false}
                />
              </div>
            </div>

            {/* Progress bar with percentage */}
            {isGenerating && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {getPhaseLabel()}
                  </span>
                  <span className="text-muted-foreground font-mono">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        )}

        {/* Streaming Content Preview with shimmer effect */}
        {isGenerating && (
          <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto border">
            {streamingContent ? (
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                {streamingContent}
                <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ms-1" />
              </pre>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )}
          </div>
        )}

        {/* Error Display with formatted message and manual fallback option */}
        {phase === 'error' && formattedError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{formattedError.title}</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>{formattedError.message}</p>
              {formattedError.action && (
                <p className="text-sm opacity-80">{formattedError.action}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {formattedError.retryable && (
                  <Button variant="outline" size="sm" onClick={retry} className="gap-1">
                    <RefreshCw className="h-3 w-3" />
                    {t('retry', 'Retry')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchToManual}
                  className="gap-1"
                >
                  <PenLine className="h-3 w-3" />
                  {t('fallback.switchToManual', 'Enter Manually')}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleGenerateAnother} className="gap-1">
                  <RotateCcw className="h-3 w-3" />
                  {t('startOver', 'Start over')}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {phase === 'success' && brief && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-200">
              {t('success', 'Brief generated successfully!')}
            </AlertTitle>
            <AlertDescription className="mt-3">
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">{brief.title}</p>
              <div className="flex items-center gap-2">
                <Button variant="default" size="sm" onClick={handleViewBrief} className="gap-1">
                  <Eye className="h-3 w-3" />
                  {t('viewBrief', 'Open Brief')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAnother}
                  className="gap-1"
                >
                  <Sparkles className={cn('h-3 w-3', isRTL && 'rotate-180')} />
                  {t('generateAnother', 'Generate Another')}
                </Button>
                {onClose && (
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    {t('close', 'Close')}
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Idle state - show options and generate button */}
        {phase === 'idle' && (
          <>
            {/* Advanced Options */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-muted-foreground"
              >
                {showAdvanced
                  ? t('hideAdvanced', 'Hide options')
                  : t('showAdvanced', 'Show options')}
              </Button>

              {showAdvanced && (
                <div className="mt-2 space-y-2">
                  <label className="text-sm font-medium mb-1 block">
                    {t('customPrompt', 'Custom instructions (optional)')}
                  </label>
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={t(
                      'customPromptPlaceholder',
                      'e.g., Focus on trade agreements and recent developments',
                    )}
                    className="resize-none"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-end">
                    {customPrompt.length}/500
                  </p>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!engagementId && !dossierId}
              className="w-full min-h-11"
            >
              <Sparkles className={cn('h-4 w-4 me-2', isRTL && 'rotate-180')} />
              {t('generate', 'Generate Brief')}
            </Button>
          </>
        )}

        {/* Manual Fallback UI */}
        {phase === 'manual' && (
          <div className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
              <PenLine className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-200">
                {t('fallback.title', 'Manual Brief Entry')}
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                {t(
                  'fallback.description',
                  'AI service is unavailable. You can enter the brief details manually.',
                )}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {/* Executive Summary */}
              <div className="space-y-2">
                <Label htmlFor="manual-summary" className="text-sm font-medium">
                  {t('fallback.summary', 'Executive Summary')}
                </Label>
                <Textarea
                  id="manual-summary"
                  value={manualContent.summary}
                  onChange={(e) => setManualContent({ ...manualContent, summary: e.target.value })}
                  placeholder={t(
                    'fallback.summaryPlaceholder',
                    'Enter a brief executive summary...',
                  )}
                  className="resize-none min-h-[100px]"
                  rows={4}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Background */}
              <div className="space-y-2">
                <Label htmlFor="manual-background" className="text-sm font-medium">
                  {t('fallback.background', 'Background')}
                </Label>
                <Textarea
                  id="manual-background"
                  value={manualContent.background}
                  onChange={(e) =>
                    setManualContent({ ...manualContent, background: e.target.value })
                  }
                  placeholder={t(
                    'fallback.backgroundPlaceholder',
                    'Enter background information...',
                  )}
                  className="resize-none min-h-[80px]"
                  rows={3}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <Label htmlFor="manual-recommendations" className="text-sm font-medium">
                  {t('fallback.recommendations', 'Recommendations')}
                </Label>
                <Textarea
                  id="manual-recommendations"
                  value={manualContent.recommendations}
                  onChange={(e) =>
                    setManualContent({ ...manualContent, recommendations: e.target.value })
                  }
                  placeholder={t(
                    'fallback.recommendationsPlaceholder',
                    'Enter your recommendations...',
                  )}
                  className="resize-none min-h-[80px]"
                  rows={3}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleManualSubmit}
                  disabled={!manualContent.summary.trim()}
                  className="flex-1 min-h-11"
                >
                  <CheckCircle className="h-4 w-4 me-2" />
                  {t('fallback.submit', 'Submit Brief')}
                </Button>
                <Button variant="outline" onClick={handleGenerateAnother} className="min-h-11">
                  <RotateCcw className="h-3 w-3 me-2" />
                  {t('startOver', 'Start over')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface StepIndicatorProps {
  step: number
  label: string
  active: boolean
  complete: boolean
}

function StepIndicator({ step, label, active, complete }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
          complete
            ? 'bg-primary text-primary-foreground'
            : active
              ? 'bg-primary/20 text-primary border-2 border-primary'
              : 'bg-muted text-muted-foreground',
        )}
      >
        {complete ? <CheckCircle className="h-3 w-3" /> : step}
      </div>
      <span
        className={cn('text-xs', active || complete ? 'text-foreground' : 'text-muted-foreground')}
      >
        {label}
      </span>
    </div>
  )
}

export default BriefGenerationPanel
