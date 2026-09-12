import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Bot } from 'lucide-react'
import { useTriageSuggestions, useApplyTriage } from '@/hooks/useIntakeApi'
import { useDirection } from '@/hooks/useDirection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TriageSuggestion {
  suggested_type?: string
  suggested_sensitivity?: string
  suggested_urgency?: string
  suggested_assignee?: string
  suggested_unit?: string
  confidence_score?: number
  model_name?: string
}

// Local typed shim narrowing the stub useTriageSuggestions hook return.
// The hook (re-exported from @/hooks/useIntakeApi) returns UseQueryResult<unknown>
// because its underlying domain stub has not been re-typed yet (47-06 scope ends at
// components/**; the hook surface is owned by 47-07).
interface TriageSuggestionsData {
  requestType?: string
  sensitivity?: import('@/types/intake').Sensitivity
  urgency?: import('@/types/intake').Urgency
  suggestedAssignee?: string
  suggestedUnit?: string
  confidenceScores?: Record<string, number>
  modelInfo?: { modelName?: string; name?: string }
}

interface TriagePanelProps {
  ticketId: string
  onSuccess?: () => void
}

export function TriagePanel({ ticketId, onSuccess }: TriagePanelProps) {
  const { isRTL } = useDirection()
  const { t } = useTranslation('intake')
  const [isOverriding, setIsOverriding] = useState(false)
  const [overrideValues, setOverrideValues] = useState<Partial<TriageSuggestion>>({})
  const [overrideReason, setOverrideReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  // Fetch AI triage suggestions using the hook
  const {
    data: suggestions,
    isLoading,
    error,
  } = useTriageSuggestions(ticketId) as unknown as {
    data: TriageSuggestionsData | undefined
    isLoading: boolean
    error: unknown
  }

  // Check AI health (disabled for now - falls back to checking suggestions response)
  // const { data: aiHealthData } = useAIHealthCheck();
  const aiAvailable = !error

  // Apply triage mutation using the hook
  const applyTriageMutation = useApplyTriage(ticketId)

  const handleAcceptSuggestions = () => {
    if (!suggestions) return
    applyTriageMutation.mutate(
      {
        action: 'accept',
        sensitivity: suggestions.sensitivity,
        urgency: suggestions.urgency,
        assignedTo: suggestions.suggestedAssignee,
        assignedUnit: suggestions.suggestedUnit,
      },
      {
        onSuccess: () => {
          onSuccess?.()
        },
      },
    )
  }

  const handleApplyOverride = () => {
    if (!overrideReason.trim()) {
      setReasonError(t('triage.overrideReasonRequired'))
      return
    }
    setReasonError('')

    applyTriageMutation.mutate(
      {
        action: 'override',
        sensitivity: overrideValues.suggested_sensitivity as
          | import('@/types/intake').Sensitivity
          | undefined,
        urgency: overrideValues.suggested_urgency as import('@/types/intake').Urgency | undefined,
        assignedTo: overrideValues.suggested_assignee,
        assignedUnit: overrideValues.suggested_unit,
        overrideReason: overrideReason,
        overrideReasonAr: isRTL ? overrideReason : undefined,
      },
      {
        onSuccess: () => {
          onSuccess?.()
        },
      },
    )
  }

  // D-58-02-01: confidence-tier mapping — low collapses to danger (skeptical-of-AI
  // semantics), medium → warning, high → success, unknown → ink-faint. Preserves
  // the three-tier visual distinction. See 58-02-PLAN.md.
  const getConfidenceColor = (score?: number): string => {
    if (!score) return 'text-ink-faint'
    if (score >= 0.8) return 'text-success'
    if (score >= 0.6) return 'text-warning'
    return 'text-danger'
  }

  const getConfidenceLabel = (score?: number): string => {
    if (!score) return t('intake:triage.confidence.unknown')
    if (score >= 0.8) return t('intake:triage.confidence.high')
    if (score >= 0.6) return t('intake:triage.confidence.medium')
    return t('intake:triage.confidence.low')
  }

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block size-8 animate-spin rounded-full border-b-2 border-primary"></div>
        <p className="mt-4 text-ink-mute">
          {t('intake:triage.loadingSuggestions')}
        </p>
      </div>
    )
  }

  if (error || !suggestions) {
    return (
      <div className="space-y-4">
        {!aiAvailable && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              {/* D-58-02-02: ⚠️ emoji replaced with AlertTriangle lucide icon (CLAUDE.md no-emoji rule). */}
              <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
              <h3 className="font-semibold text-warning">
                {t('intake:triage.aiUnavailable')}
              </h3>
            </div>
            <p className="text-sm text-warning">
              {t(
                'intake:triage.aiUnavailableMessage',
              )}
            </p>
          </div>
        )}

        {/* Fallback to manual triage */}
        <div className="rounded-lg bg-muted p-6">
          <h3 className="mb-4 text-lg font-semibold text-ink">
            {t('intake:triage.manualTriage')}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t('intake:triage.sensitivity')}
              </label>
              <Select
                value={overrideValues.suggested_sensitivity || undefined}
                onValueChange={(value) =>
                  setOverrideValues({ ...overrideValues, suggested_sensitivity: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('intake:common.select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    {t('intake:triage.sensitivityLevels.public')}
                  </SelectItem>
                  <SelectItem value="internal">
                    {t('intake:triage.sensitivityLevels.internal')}
                  </SelectItem>
                  <SelectItem value="confidential">
                    {t('intake:triage.sensitivityLevels.confidential')}
                  </SelectItem>
                  <SelectItem value="secret">
                    {t('intake:triage.sensitivityLevels.secret')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t('intake:triage.urgency')}
              </label>
              <Select
                value={overrideValues.suggested_urgency || undefined}
                onValueChange={(value) =>
                  setOverrideValues({ ...overrideValues, suggested_urgency: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('intake:common.select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('queue.urgency.low')}</SelectItem>
                  <SelectItem value="medium">{t('queue.urgency.medium')}</SelectItem>
                  <SelectItem value="high">{t('queue.urgency.high')}</SelectItem>
                  <SelectItem value="critical">
                    {t('queue.urgency.critical')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t('intake:triage.assignedUnit')}
              </label>
              <Input
                type="text"
                value={overrideValues.suggested_unit || ''}
                onChange={(e) =>
                  setOverrideValues({ ...overrideValues, suggested_unit: e.target.value })
                }
                placeholder={t('intake:triage.assignedUnitPlaceholder')}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t('intake:triage.reason')}
              </label>
              {reasonError !== '' && (
                <div
                  role="alert"
                  className="mb-2 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{reasonError}</span>
                </div>
              )}
              <Textarea
                value={overrideReason}
                onChange={(e) => {
                  setOverrideReason(e.target.value)
                  if (reasonError !== '') setReasonError('')
                }}
                placeholder={t('intake:triage.reasonPlaceholder')}
                rows={3}
                aria-required="true"
                aria-invalid={reasonError !== ''}
                className="aria-[invalid=true]:border-destructive"
              />
            </div>

            <Button
              type="button"
              onClick={handleApplyOverride}
              disabled={applyTriageMutation.isPending || !overrideReason.trim()}
              className="w-full"
            >
              {applyTriageMutation.isPending
                ? t('intake:triage.applying')
                : t('intake:triage.applyManualTriage')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Status Banner */}
      <div className="rounded-lg border border-info/30 bg-info/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* CLAUDE.md no-emoji rule: robot emoji replaced with Bot lucide icon. */}
            <Bot className="h-5 w-5 text-info" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-info">
                {t('intake:triage.aiSuggestions')}
              </h3>
              <p className="text-sm text-info">
                {t('intake:triage.modelInfo')}: {suggestions.modelInfo?.name || 'Unknown'}
              </p>
            </div>
          </div>
          <div
            className={`rounded-full px-3 py-1 text-sm font-semibold ${getConfidenceColor(
              suggestions.confidenceScores?.type,
            )} bg-surface`}
          >
            {getConfidenceLabel(suggestions.confidenceScores?.type)}
          </div>
        </div>
      </div>

      {/* Suggestions Display */}
      {!isOverriding ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {suggestions.requestType && (
              <div className="rounded-lg bg-muted p-4">
                <label className="mb-1 block text-sm font-medium text-ink">
                  {t('intake:triage.requestType')}
                </label>
                <p className="font-semibold text-ink">
                  {t(`intake:form.requestType.options.${suggestions.requestType}`)}
                </p>
              </div>
            )}

            {suggestions.sensitivity && (
              <div className="rounded-lg bg-muted p-4">
                <label className="mb-1 block text-sm font-medium text-ink">
                  {t('intake:triage.sensitivitySummary')}
                </label>
                <p className="font-semibold capitalize text-ink">{suggestions.sensitivity}</p>
              </div>
            )}

            {suggestions.urgency && (
              <div className="rounded-lg bg-muted p-4">
                <label className="mb-1 block text-sm font-medium text-ink">
                  {t('intake:triage.urgency')}
                </label>
                <p className="font-semibold text-ink">
                  {t(`queue.urgency.${suggestions.urgency}`)}
                </p>
              </div>
            )}

            {suggestions.suggestedUnit && (
              <div className="rounded-lg bg-muted p-4">
                <label className="mb-1 block text-sm font-medium text-ink">
                  {t('intake:triage.assignedUnit')}
                </label>
                <p className="font-semibold text-ink">{suggestions.suggestedUnit}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 border-t border-line pt-4">
            <Button
              type="button"
              onClick={handleAcceptSuggestions}
              disabled={applyTriageMutation.isPending}
              className="flex-1"
            >
              {applyTriageMutation.isPending
                ? t('intake:triage.applying')
                : t('intake:triage.acceptSuggestions')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOverriding(true)
                setOverrideValues({
                  suggested_type: suggestions.requestType,
                  suggested_sensitivity: suggestions.sensitivity,
                  suggested_urgency: suggestions.urgency,
                  suggested_assignee: suggestions.suggestedAssignee,
                  suggested_unit: suggestions.suggestedUnit,
                  confidence_score: suggestions.confidenceScores?.type,
                })
              }}
              className="flex-1"
            >
              {t('intake:triage.override')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-ink">
            {t('intake:triage.overrideTitle')}
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t('intake:triage.sensitivity')}
              </label>
              <Select
                value={overrideValues.suggested_sensitivity || undefined}
                onValueChange={(value) =>
                  setOverrideValues({ ...overrideValues, suggested_sensitivity: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('intake:common.select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    {t('intake:triage.sensitivityLevels.public')}
                  </SelectItem>
                  <SelectItem value="internal">
                    {t('intake:triage.sensitivityLevels.internal')}
                  </SelectItem>
                  <SelectItem value="confidential">
                    {t('intake:triage.sensitivityLevels.confidential')}
                  </SelectItem>
                  <SelectItem value="secret">
                    {t('intake:triage.sensitivityLevels.secret')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t('intake:triage.urgency')}
              </label>
              <Select
                value={overrideValues.suggested_urgency || undefined}
                onValueChange={(value) =>
                  setOverrideValues({ ...overrideValues, suggested_urgency: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('intake:common.select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('queue.urgency.low')}</SelectItem>
                  <SelectItem value="medium">{t('queue.urgency.medium')}</SelectItem>
                  <SelectItem value="high">{t('queue.urgency.high')}</SelectItem>
                  <SelectItem value="critical">
                    {t('queue.urgency.critical')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-ink">
                {t('intake:triage.assignedUnit')}
              </label>
              <Input
                type="text"
                value={overrideValues.suggested_unit || ''}
                onChange={(e) =>
                  setOverrideValues({ ...overrideValues, suggested_unit: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-ink">
                {t('triage.overrideReasonLabel')}
              </label>
              {reasonError !== '' && (
                <div
                  role="alert"
                  className="mb-2 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{reasonError}</span>
                </div>
              )}
              <Textarea
                value={overrideReason}
                onChange={(e) => {
                  setOverrideReason(e.target.value)
                  if (reasonError !== '') setReasonError('')
                }}
                placeholder={t(
                  'intake:triage.overrideReasonPlaceholder',
                )}
                rows={3}
                aria-required="true"
                aria-invalid={reasonError !== ''}
                className="aria-[invalid=true]:border-destructive"
              />
            </div>
          </div>

          <div className="flex gap-3 border-t border-line pt-4">
            <Button
              type="button"
              onClick={handleApplyOverride}
              disabled={applyTriageMutation.isPending || !overrideReason.trim()}
              className="flex-1"
            >
              {applyTriageMutation.isPending
                ? t('intake:triage.applying')
                : t('intake:triage.applyOverride')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOverriding(false)
                setOverrideValues({})
                setOverrideReason('')
                setReasonError('')
              }}
            >
              {t('intake:common.cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
