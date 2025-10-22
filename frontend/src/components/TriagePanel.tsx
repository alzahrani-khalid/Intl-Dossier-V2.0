import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTriageSuggestions, useApplyTriage, useAIHealthCheck } from '../hooks/useIntakeApi';

interface TriageSuggestion {
  suggested_type?: string;
  suggested_sensitivity?: string;
  suggested_urgency?: string;
  suggested_assignee?: string;
  suggested_unit?: string;
  confidence_score?: number;
  model_name?: string;
}

interface TriagePanelProps {
  ticketId: string;
  onSuccess?: () => void;
}

export function TriagePanel({ ticketId, onSuccess }: TriagePanelProps) {
  const { t, i18n } = useTranslation('intake');
  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideValues, setOverrideValues] = useState<Partial<TriageSuggestion>>({});
  const [overrideReason, setOverrideReason] = useState('');

  // Fetch AI triage suggestions using the hook
  const {
    data: suggestions,
    isLoading,
    error
  } = useTriageSuggestions(ticketId);

  // Check AI health (disabled for now - falls back to checking suggestions response)
  // const { data: aiHealthData } = useAIHealthCheck();
  const aiAvailable = !error;

  // Apply triage mutation using the hook
  const applyTriageMutation = useApplyTriage(ticketId);

  const handleAcceptSuggestions = () => {
    if (!suggestions) return;
    applyTriageMutation.mutate(
      {
        decision_type: 'ai_suggestion',
        suggested_type: suggestions.suggested_type,
        suggested_sensitivity: suggestions.suggested_sensitivity,
        suggested_urgency: suggestions.suggested_urgency,
        suggested_assignee: suggestions.suggested_assignee,
        suggested_unit: suggestions.suggested_unit,
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  const handleApplyOverride = () => {
    if (!overrideReason.trim()) {
      alert(t('triage.overrideReasonRequired', 'Please provide a reason for the override'));
      return;
    }

    applyTriageMutation.mutate(
      {
        decision_type: 'manual_override',
        suggested_type: overrideValues.suggested_type,
        suggested_sensitivity: overrideValues.suggested_sensitivity,
        suggested_urgency: overrideValues.suggested_urgency,
        suggested_assignee: overrideValues.suggested_assignee,
        suggested_unit: overrideValues.suggested_unit,
        override_reason: overrideReason,
        override_reason_ar: i18n.language === 'ar' ? overrideReason : undefined,
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  const getConfidenceColor = (score?: number): string => {
    if (!score) return 'text-gray-500';
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getConfidenceLabel = (score?: number): string => {
    if (!score) return t('triage.confidence.unknown', 'Unknown');
    if (score >= 0.8) return t('triage.confidence.high', 'High');
    if (score >= 0.6) return t('triage.confidence.medium', 'Medium');
    return t('triage.confidence.low', 'Low');
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          {t('triage.loadingSuggestions', 'Analyzing ticket...')}
        </p>
      </div>
    );
  }

  if (error || !suggestions) {
    return (
      <div className="space-y-4">
        {!aiAvailable && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xl text-yellow-600 dark:text-yellow-400">⚠️</span>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
                {t('triage.aiUnavailable', 'AI Triage Temporarily Unavailable')}
              </h3>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              {t('triage.aiUnavailableMessage', 'AI triage suggestions are currently unavailable. Please perform manual triage or try again later.')}
            </p>
          </div>
        )}

        {/* Fallback to manual triage */}
        <div className="rounded-lg bg-gray-50 p-6 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {t('triage.manualTriage', 'Manual Triage')}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('triage.sensitivity', 'Sensitivity Level')}
              </label>
              <select
                value={overrideValues.suggested_sensitivity || ''}
                onChange={(e) =>
                  setOverrideValues({ ...overrideValues, suggested_sensitivity: e.target.value })
                }
                className="w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">{t('common.select', 'Select...')}</option>
                <option value="public">{t('triage.sensitivityLevels.public', 'Public')}</option>
                <option value="internal">{t('triage.sensitivityLevels.internal', 'Internal')}</option>
                <option value="confidential">{t('triage.sensitivityLevels.confidential', 'Confidential')}</option>
                <option value="secret">{t('triage.sensitivityLevels.secret', 'Secret')}</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('triage.urgency', 'Urgency')}
              </label>
              <select
                value={overrideValues.suggested_urgency || ''}
                onChange={(e) =>
                  setOverrideValues({ ...overrideValues, suggested_urgency: e.target.value })
                }
                className="w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">{t('common.select', 'Select...')}</option>
                <option value="low">{t('queue.urgency.low', 'Low')}</option>
                <option value="medium">{t('queue.urgency.medium', 'Medium')}</option>
                <option value="high">{t('queue.urgency.high', 'High')}</option>
                <option value="critical">{t('queue.urgency.critical', 'Critical')}</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('triage.assignedUnit', 'Assigned Unit')}
              </label>
              <input
                type="text"
                value={overrideValues.suggested_unit || ''}
                onChange={(e) =>
                  setOverrideValues({ ...overrideValues, suggested_unit: e.target.value })
                }
                placeholder={t('triage.assignedUnitPlaceholder', 'Enter unit name')}
                className="w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('triage.reason', 'Reason')}
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder={t('triage.reasonPlaceholder', 'Explain your triage decision')}
                rows={3}
                className="w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <button
              onClick={handleApplyOverride}
              disabled={applyTriageMutation.isPending || !overrideReason.trim()}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {applyTriageMutation.isPending
                ? t('triage.applying', 'Applying...')
                : t('triage.applyManualTriage', 'Apply Manual Triage')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Status Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl text-blue-600 dark:text-blue-400">🤖</span>
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                {t('triage.aiSuggestions', 'AI-Powered Suggestions')}
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {t('triage.modelInfo', 'Model')}: {suggestions.model_name || 'Unknown'}
              </p>
            </div>
          </div>
          <div
            className={`rounded-full px-3 py-1 text-sm font-semibold ${getConfidenceColor(
              suggestions.confidence_score
            )} bg-white dark:bg-gray-800`}
          >
            {getConfidenceLabel(suggestions.confidence_score)}
          </div>
        </div>
      </div>

      {/* Suggestions Display */}
      {!isOverriding ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {suggestions.suggested_type && (
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('triage.requestType', 'Request Type')}
                </label>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {t(`intake.form.requestType.options.${suggestions.suggested_type}`)}
                </p>
              </div>
            )}

            {suggestions.suggested_sensitivity && (
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('triage.sensitivity', 'Sensitivity')}
                </label>
                <p className="font-semibold capitalize text-gray-900 dark:text-white">
                  {suggestions.suggested_sensitivity}
                </p>
              </div>
            )}

            {suggestions.suggested_urgency && (
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('triage.urgency', 'Urgency')}
                </label>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {t(`queue.urgency.${suggestions.suggested_urgency}`)}
                </p>
              </div>
            )}

            {suggestions.suggested_unit && (
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('triage.assignedUnit', 'Assigned Unit')}
                </label>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {suggestions.suggested_unit}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              onClick={handleAcceptSuggestions}
              disabled={applyTriageMutation.isPending}
              className="flex-1 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {applyTriageMutation.isPending
                ? t('triage.applying', 'Applying...')
                : t('triage.acceptSuggestions', 'Accept AI Suggestions')}
            </button>
            <button
              onClick={() => {
                setIsOverriding(true);
                setOverrideValues(suggestions);
              }}
              className="flex-1 rounded-md bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
            >
              {t('triage.override', 'Override')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('triage.overrideTitle', 'Override AI Suggestions')}
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('triage.sensitivity', 'Sensitivity Level')}
              </label>
              <select
                value={overrideValues.suggested_sensitivity || ''}
                onChange={(e) =>
                  setOverrideValues({ ...overrideValues, suggested_sensitivity: e.target.value })
                }
                className="w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="public">{t('triage.sensitivityLevels.public', 'Public')}</option>
                <option value="internal">{t('triage.sensitivityLevels.internal', 'Internal')}</option>
                <option value="confidential">{t('triage.sensitivityLevels.confidential', 'Confidential')}</option>
                <option value="secret">{t('triage.sensitivityLevels.secret', 'Secret')}</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('triage.urgency', 'Urgency')}
              </label>
              <select
                value={overrideValues.suggested_urgency || ''}
                onChange={(e) =>
                  setOverrideValues({ ...overrideValues, suggested_urgency: e.target.value })
                }
                className="w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="low">{t('queue.urgency.low', 'Low')}</option>
                <option value="medium">{t('queue.urgency.medium', 'Medium')}</option>
                <option value="high">{t('queue.urgency.high', 'High')}</option>
                <option value="critical">{t('queue.urgency.critical', 'Critical')}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('triage.assignedUnit', 'Assigned Unit')}
              </label>
              <input
                type="text"
                value={overrideValues.suggested_unit || ''}
                onChange={(e) =>
                  setOverrideValues({ ...overrideValues, suggested_unit: e.target.value })
                }
                className="w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('triage.overrideReason', 'Reason for Override')} *
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder={t('triage.overrideReasonPlaceholder', 'Explain why you are overriding the AI suggestions')}
                rows={3}
                className="w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              onClick={handleApplyOverride}
              disabled={applyTriageMutation.isPending || !overrideReason.trim()}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {applyTriageMutation.isPending
                ? t('triage.applying', 'Applying...')
                : t('triage.applyOverride', 'Apply Override')}
            </button>
            <button
              onClick={() => {
                setIsOverriding(false);
                setOverrideValues({});
                setOverrideReason('');
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {t('common.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}