/**
 * AISummaryPanel Component
 * Feature: ai-summary-generation
 *
 * Panel for generating and displaying AI summaries for any entity
 * Supports customizable length and focus areas
 */

import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useAISummary } from '@/hooks/useAISummary'
import { formatAIError } from '@/utils/ai-errors'
import {
  Loader2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Activity,
  Users,
  CheckSquare,
  Target,
  Grid3X3,
  Copy,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  SummaryEntityType,
  SummaryLength,
  SummaryFocusArea,
  SummaryContent,
} from '@/types/ai-summary.types'

export interface AISummaryPanelProps {
  entityType: SummaryEntityType
  entityId: string
  entityName?: string
  onSummaryGenerated?: (summaryId: string) => void
  className?: string
}

type GenerationPhase = 'idle' | 'generating' | 'success' | 'error' | 'fallback'

// Focus area icons mapping
const focusAreaIcons: Record<SummaryFocusArea, React.ReactNode> = {
  all: <Grid3X3 className="h-4 w-4" />,
  activity: <Activity className="h-4 w-4" />,
  relationships: <Users className="h-4 w-4" />,
  commitments: <CheckSquare className="h-4 w-4" />,
  strategic: <Target className="h-4 w-4" />,
}

export function AISummaryPanel({
  entityType,
  entityId,
  entityName,
  onSummaryGenerated,
  className,
}: AISummaryPanelProps) {
  const { t, i18n } = useTranslation('ai-summary')
  const isRTL = i18n.language === 'ar'
  const currentLang = i18n.language as 'en' | 'ar'

  // Options state
  const [length, setLength] = useState<SummaryLength>('standard')
  const [focusAreas, setFocusAreas] = useState<SummaryFocusArea[]>(['all'])
  const [showOptions, setShowOptions] = useState(false)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  // Summary generation
  const { generate, summary, isGenerating, progress, error, retry, reset } = useAISummary()

  // Determine phase
  const phase: GenerationPhase = useMemo(() => {
    if (error === 'AI_UNAVAILABLE_FALLBACK' && summary) return 'fallback'
    if (error && error !== 'AI_UNAVAILABLE_FALLBACK') return 'error'
    if (summary) return 'success'
    if (isGenerating) return 'generating'
    return 'idle'
  }, [error, summary, isGenerating])

  // Get summary content in current language
  const summaryContent: SummaryContent | null = useMemo(() => {
    if (!summary) return null
    return currentLang === 'ar' ? summary.ar : summary.en
  }, [summary, currentLang])

  // Format error
  const formattedError =
    error && error !== 'AI_UNAVAILABLE_FALLBACK' ? formatAIError(error, t) : null

  const handleGenerate = async () => {
    await generate({
      entityType,
      entityId,
      length,
      focusAreas,
      language: currentLang,
    })
  }

  // Call callback when summary is generated
  useEffect(() => {
    if (summary?.id && onSummaryGenerated && (phase === 'success' || phase === 'fallback')) {
      onSummaryGenerated(summary.id)
    }
  }, [summary?.id, onSummaryGenerated, phase])

  const handleFocusAreaToggle = (area: SummaryFocusArea) => {
    if (area === 'all') {
      setFocusAreas(['all'])
    } else {
      setFocusAreas((prev) => {
        const newAreas = prev.filter((a) => a !== 'all')
        if (newAreas.includes(area)) {
          const filtered = newAreas.filter((a) => a !== area)
          return filtered.length === 0 ? ['all'] : filtered
        }
        return [...newAreas, area]
      })
    }
  }

  const handleCopySection = async (title: string, content: string) => {
    try {
      await navigator.clipboard.writeText(`${title}\n\n${content}`)
      setCopiedSection(title)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  const handleReset = () => {
    reset()
    setShowOptions(false)
  }

  return (
    <Card className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={cn('h-5 w-5 text-primary', isRTL && 'rotate-180')} />
            <CardTitle className="text-lg">{t('title', 'AI Summary')}</CardTitle>
          </div>
          {summary && (
            <Badge variant="outline" className="text-xs">
              {t(
                `confidence.${getConfidenceLevel(summaryContent?.metadata.confidence_score || 0)}`,
                getConfidenceLevel(summaryContent?.metadata.confidence_score || 0),
              )}
            </Badge>
          )}
        </div>
        <CardDescription>
          {entityName
            ? t('descriptionWithName', 'Generate an executive summary for {{name}}', {
                name: entityName,
              })
            : t('description', 'Generate an executive summary using AI analysis')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Generating state */}
        {phase === 'generating' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('generating', 'Generating summary...')}
              </span>
              <span className="text-muted-foreground font-mono">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        )}

        {/* Error state */}
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
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  {t('startOver', 'Start over')}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Fallback warning */}
        {phase === 'fallback' && (
          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">
              {t('fallback.title', 'Basic Summary Generated')}
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              {t(
                'fallback.message',
                'AI service was unavailable. A basic summary was generated from available data.',
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Success state - Display summary */}
        {(phase === 'success' || phase === 'fallback') && summaryContent && (
          <div className="space-y-4">
            {/* Executive Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {t('sections.executiveSummary', 'Executive Summary')}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() =>
                    handleCopySection('Executive Summary', summaryContent.executive_summary)
                  }
                >
                  {copiedSection === 'Executive Summary' ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {summaryContent.executive_summary}
              </p>
            </div>

            {/* Key Highlights */}
            {summaryContent.key_highlights.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('sections.keyHighlights', 'Key Highlights')}
                </Label>
                <ul className="list-disc list-inside space-y-1">
                  {summaryContent.key_highlights.map((highlight, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sections */}
            {summaryContent.sections.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('sections.details', 'Details')}</Label>
                {summaryContent.sections.map((section, idx) => (
                  <Collapsible key={idx} defaultOpen={section.importance === 'high'}>
                    <div className="border rounded-lg">
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              section.importance === 'high'
                                ? 'destructive'
                                : section.importance === 'medium'
                                  ? 'default'
                                  : 'secondary'
                            }
                            className="text-xs"
                          >
                            {t(`importance.${section.importance}`, section.importance)}
                          </Badge>
                          <span className="font-medium text-sm">{section.title}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-3 pb-3 pt-0">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {section.content}
                          </p>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
              <span>
                {t('metadata.dataPoints', '{{count}} data points analyzed', {
                  count: summaryContent.metadata.data_points_analyzed,
                })}
              </span>
              <span>•</span>
              <span>
                {t('metadata.generatedAt', 'Generated {{date}}', {
                  date: new Date(summaryContent.metadata.generated_at).toLocaleDateString(
                    currentLang === 'ar' ? 'ar-SA' : 'en-US',
                  ),
                })}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button variant="outline" onClick={handleReset} className="gap-1 flex-1">
                <Sparkles className={cn('h-4 w-4', isRTL && 'rotate-180')} />
                {t('generateAnother', 'Generate New Summary')}
              </Button>
            </div>
          </div>
        )}

        {/* Idle state - Options and generate button */}
        {phase === 'idle' && (
          <>
            {/* Options toggle */}
            <Collapsible open={showOptions} onOpenChange={setShowOptions}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-1">
                  {showOptions ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      {t('hideOptions', 'Hide options')}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      {t('showOptions', 'Customize summary')}
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-4 mt-4">
                {/* Length selector */}
                <div className="space-y-2">
                  <Label className="text-sm">{t('options.length', 'Summary Length')}</Label>
                  <Select value={length} onValueChange={(v) => setLength(v as SummaryLength)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brief">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {t('length.brief', 'Brief (~150 words)')}
                        </div>
                      </SelectItem>
                      <SelectItem value="standard">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {t('length.standard', 'Standard (~300 words)')}
                        </div>
                      </SelectItem>
                      <SelectItem value="detailed">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {t('length.detailed', 'Detailed (~500 words)')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Focus areas */}
                <div className="space-y-2">
                  <Label className="text-sm">{t('options.focus', 'Focus Areas')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        'all',
                        'activity',
                        'relationships',
                        'commitments',
                        'strategic',
                      ] as SummaryFocusArea[]
                    ).map((area) => (
                      <div
                        key={area}
                        className={cn(
                          'flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors',
                          focusAreas.includes(area) && 'border-primary bg-primary/5',
                        )}
                        onClick={() => handleFocusAreaToggle(area)}
                      >
                        <Checkbox
                          checked={focusAreas.includes(area)}
                          onCheckedChange={() => handleFocusAreaToggle(area)}
                        />
                        {focusAreaIcons[area]}
                        <span className="text-sm">{t(`focus.${area}`, area)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Generate button */}
            <Button onClick={handleGenerate} disabled={!entityId} className="w-full min-h-11">
              <Sparkles className={cn('h-4 w-4 me-2', isRTL && 'rotate-180')} />
              {t('generate', 'Generate Summary')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Get confidence level label based on score
 */
function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.7) return 'high'
  if (score >= 0.4) return 'medium'
  return 'low'
}

export default AISummaryPanel
