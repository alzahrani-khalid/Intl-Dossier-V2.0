import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Bot } from 'lucide-react'
import { useTriageSuggestions, useApplyTriage } from '@/hooks/useIntakeApi'
import { useDirection } from '@/hooks/useDirection'

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
      setReasonError(t('triage.overrideReasonRequired', 'Please provide a reason for the override'))
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
    if (!score) return t('triage.confidence.unknown', 'Unknown')
    if (score >= 0.8) return t('triage.confidence.high', 'High')
    if (score >= 0.6) return t('triage.confidence.medium', 'Medium')
    return t('triage.confidence.low', 'Low')
  }

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block size-8 animate-spin rounded-full border-b-2 border-primary"></div>
        <p className="mt-4 text-ink-mute">
          {t('triage.loadingSuggestions', 'Analyzing ticket...')}
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
                {t('triage.aiUnavailable', 'AI Triage Temporarily Unavailable')}
              </h3>
            </div>
            <p className="text-sm text-warning">
              {t(
                'triage.aiUnavailableMessage',
                'AI triage suggestions are currently unavailable. Please perform manual triage or try again later.',
              )}
            </p>
          </div>
        )}

        {/* Fallback to manual triage */}
        <div className="rounded-lg bg-muted p-6">
          <h3 className="mb-4 text-lg font-semibold text-ink">
            {t('triage.manualTriage', 'Manual Triage')}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t('triage.sensitivity', 'Sensitivity Level')}
              </label>
              <select
                value={overrideValues.suggested_sensitivity || ''}
                onChange={(e) =>
                  setOverrideValues({ ...overrideValues, suggested_sensitivity: e.target.value })
                }
                className="w-full rounded-md border-line bg-surface text-ink"
              >
                <option value="">{t('common.select', 'Select...')}</option>
                <option value="public">{t('triage.sensitivityLevels.public', 'Public')}</option>
                <option value="internal">
                  {t('triage.sensitivityLevels.internal', 'Internal')}
                </option>
                <option value="confidential">
                  {t('triage.sensitivityLevels.confidential', 'Confidential')}
                </option>
                <option value="secret">{t('triage.sensitivityLevels.secret', 'Secret')}</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t('triage.urgency', 'Urgency')}
              </label>
              <select
                value={overrideValues.suggested_urgency || ''}
                onChange={(e) =>
                  setOverrideValues({ ...overrideValues, suggested_urgency: e.target.value })
                }
                className="w-full rounded-md border-line bg-surface text-ink"
              >
                <option value="">{t('common.select', 'Select...')}</option>
                <option value="low">{t('queue.urgency.low', 'Low')}</option>
                <option value="medium">{t('queue.urgency.medium', 'Medium')}</option>
                <option value="high">{t('queue.urgency.high', 'High')}</option>
                <option value="critical">{t('queue.urgency.critical', 'Critical')}</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t('triage.assignedUnit', 'Assigned Unit')}
              </label>
              <input
                type="text"
                value={overrideValues.suggested_unit || ''}
                onChange={(e) =>
                  setOverrideValues({ ...overrideValues, suggested_unit: e.target.value })
                }
                placeholder={t('triage.assignedUnitPlaceholder', 'Enter unit name')}
                className="w-full rounded-md border-line bg-surface text-ink"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t('triage.reason', 'Reason')}
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
              <textarea
                value={overrideReason}
                onChange={(e) => {
                  setOverrideReason(e.target.value)
                  if (reasonError !== '') setReasonError('')
                }}
                placeholder={t('triage.reasonPlaceholder', 'Explain your triage decision')}
                rows={3}
                aria-required="true"
                aria-invalid={reasonError !== ''}
                className="w-full rounded-md border-line bg-surface text-ink aria-[invalid=true]:border-destructive"
              />
            </div>

            <button
              onClick={handleApplyOverride}
              disabled={applyTriageMutation.isPending || !overrideReason.trim()}
              className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {applyTriageMutation.isPending
                ? t('triage.applying', 'Applying...')
                : t('triage.applyManualTriage', 'Apply Manual Triage')}
            </button>
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
            {/* CLAUDE.md no-emoji rule: 🤖 replaced with Bot lucide icon. */}
            <Bot className="h-5 w-5 text-info" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-info">
                {t('triage.aiSuggestions', 'AI-Powered Suggestions')}
              </h3>
              <p className="text-sm text-info">
                {t('triage.modelInfo', 'Model')}: {suggestions.modelInfo?.name || 'Unknown'}
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
                  {t('triage.requestType', 'Request Type')}
                </label>
                <p className="font-semibold text-ink">
                  {t(`intake.form.requestType.options.${suggestions.requestType}`)}
                </p>
              </div>
            )}

            {suggestions.sensitivity && (
              <div className="rounded-lg bg-muted p-4">
                <label className="mb-1 block text-sm font-medium text-ink">
                  {t('triage.sensitivity', 'Sensitivity')}
                </label>
                <p className="font-semibold capitalize text-ink">{suggestions.sensitivity}</p>
              </div>
            )}

            {suggestions.urgency && (
              <div className="rounded-lg bg-muted p-4">
                <label className="mb-1 block text-sm font-medium text-ink">
                  {t('triage.urgency', 'Urgency')}
                </label>
                <p className="font-semibold text-ink">
                  {t(`queue.urgency.${suggestions.urgency}`)}
                </p>
              </div>
            )}

            {suggestions.suggestedUnit && (
              <div className="rounded-lg bg-muted p-4">
                <label className="mb-1 block text-sm font-medium text-ink">
                  {t('triage.assignedUnit', 'Assigned Unit')}
                </label>
                <p className="font-semibold text-ink">{suggestions.suggestedUnit}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 border-t border-line pt-4">
            <button
              onClick={handleAcceptSuggestions}
              disabled={applyTriageMutation.isPending}
              className="flex-1 rounded-md bg-success px-4 py-2 text-success-foreground hover:bg-success/90 disabled:opacity-50"
            >
              {applyTriageMutation.isPending
                ? t('triage.applying', 'Applying...')
                : t('triage.acceptSuggestions', 'Accept AI Suggestions')}
            </button>
            <button
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
              className="flex-1 rounded-md bg-warning px-4 py-2 text-warning-foreground hover:bg-warning/90"
            >
              {t('triage.override', 'Override')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-ink">
            {t('triage.overrideTitle', 'Override AI Suggestions')}
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t('triage.sensitivity', 'Sensitivity Level')}
              </label>
              <select
                value={overrideValues.suggested_sensitivity || ''}
                onChange={(e) =>
                  setOverrideValues({ ...overrideValues, suggested_sensitivity: e.target.value })
                }
                className="w-full rounded-md border-line bg-surface text-ink"
              >
                <option value="public">{t('triage.sensitivityLevels.public', 'Public')}</option>
                <option value="internal">
                  {t('triage.sensitivityLevels.internal', 'Internal')}
                </option>
                <option value="confidential">
                  {t('triage.sensitivityLevels.confidential', 'Confidential')}
                </option>
                <option value="secret">{t('triage.sensitivityLevels.secret', 'Secret')}</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t('triage.urgency', 'Urgency')}
              </label>
              <select
                value={overrideValues.suggested_urgency || ''}
                onChange={(e) =>
                  setOverrideValues({ ...overrideValues, suggested_urgency: e.target.value })
                }
                className="w-full rounded-md border-line bg-surface text-ink"
              >
                <option value="low">{t('queue.urgency.low', 'Low')}</option>
                <option value="medium">{t('queue.urgency.medium', 'Medium')}</option>
                <option value="high">{t('queue.urgency.high', 'High')}</option>
                <option value="critical">{t('queue.urgency.critical', 'Critical')}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-ink">
                {t('triage.assignedUnit', 'Assigned Unit')}
              </label>
              <input
                type="text"
                value={overrideValues.suggested_unit || ''}
                onChange={(e) =>
                  setOverrideValues({ ...overrideValues, suggested_unit: e.target.value })
                }
                className="w-full rounded-md border-line bg-surface text-ink"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-ink">
                {t('triage.overrideReasonLabel', 'Reason for Override *')}
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
              <textarea
                value={overrideReason}
                onChange={(e) => {
                  setOverrideReason(e.target.value)
                  if (reasonError !== '') setReasonError('')
                }}
                placeholder={t(
                  'triage.overrideReasonPlaceholder',
                  'Explain why you are overriding the AI suggestions',
                )}
                rows={3}
                aria-required="true"
                aria-invalid={reasonError !== ''}
                className="w-full rounded-md border-line bg-surface text-ink aria-[invalid=true]:border-destructive"
              />
            </div>
          </div>

          <div className="flex gap-3 border-t border-line pt-4">
            <button
              onClick={handleApplyOverride}
              disabled={applyTriageMutation.isPending || !overrideReason.trim()}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {applyTriageMutation.isPending
                ? t('triage.applying', 'Applying...')
                : t('triage.applyOverride', 'Apply Override')}
            </button>
            <button
              onClick={() => {
                setIsOverriding(false)
                setOverrideValues({})
                setOverrideReason('')
                setReasonError('')
              }}
              className="rounded-md border border-line px-4 py-2 text-ink hover:bg-muted"
            >
              {t('common.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
