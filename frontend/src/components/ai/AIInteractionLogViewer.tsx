/**
 * AI Interaction Log Viewer Component
 * Feature: ai-interaction-logging
 *
 * Displays comprehensive AI interaction history with:
 * - Interaction timeline
 * - Prompt/response details
 * - User edits tracking
 * - Approval decisions
 * - Governance audit trail
 *
 * Supports mobile-first design and RTL (Arabic)
 */

import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bot,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle,
  XCircle,
  Edit3,
  MessageSquare,
  FileText,
  AlertTriangle,
  Shield,
  Activity,
  Zap,
  DollarSign,
  Eye,
  Sparkles,
} from 'lucide-react'
import {
  useAIInteractions,
  useAIInteraction,
  useAIInteractionAudit,
  useAIInteractionEdits,
  type AIInteractionLog,
  type AIGovernanceAudit,
  type AIUserEdit,
  type AIApprovalDecision,
  type AIInteractionType,
  type AIContentType,
  type AIRunStatus,
  type ListInteractionsParams,
} from '@/hooks/useAIInteractionLogs'
import { cn } from '@/lib/utils'

// Props
interface AIInteractionLogViewerProps {
  organizationId?: string
  userId?: string
  targetEntityType?: string
  targetEntityId?: string
  className?: string
}

interface InteractionDetailViewProps {
  interactionId: string
  onClose: () => void
  className?: string
}

// Icons for interaction types
const INTERACTION_ICONS: Record<
  AIInteractionType,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  generation: Sparkles,
  suggestion: MessageSquare,
  classification: Filter,
  extraction: FileText,
  translation: FileText,
  summarization: FileText,
  analysis: Activity,
  chat: MessageSquare,
}

// Status badges
const STATUS_STYLES: Record<AIRunStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

// Decision styles
const DECISION_STYLES: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  approved_with_edits: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  revision_requested: 'bg-orange-100 text-orange-800',
  pending: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-gray-100 text-gray-800',
  auto_approved: 'bg-blue-100 text-blue-800',
}

/**
 * Main AI Interaction Log Viewer Component
 */
export const AIInteractionLogViewer: React.FC<AIInteractionLogViewerProps> = ({
  organizationId,
  userId,
  targetEntityType,
  targetEntityId,
  className = '',
}) => {
  const { t, i18n } = useTranslation('ai-interactions')
  const isRTL = i18n.language === 'ar'

  const [filters, setFilters] = useState<ListInteractionsParams>({
    organizationId,
    userId,
    limit: 20,
    offset: 0,
  })
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Fetch interactions
  const { data, isLoading, error, refetch } = useAIInteractions(filters)

  const interactions = data?.data || []
  const totalCount = data?.metadata?.total || 0

  // Toggle row expansion
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  // Format duration
  const formatDuration = (ms: number | null | undefined) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  // Get icon for interaction type
  const getInteractionIcon = (type: AIInteractionType) => {
    const IconComponent = INTERACTION_ICONS[type] || Bot
    return <IconComponent size={18} />
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('animate-pulse space-y-3', className)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-gray-200" />
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn('rounded-lg border border-red-200 bg-red-50 p-4 text-red-800', className)}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{t('error.load_failed', 'Failed to load AI interactions')}</span>
        </div>
      </div>
    )
  }

  // Empty state
  if (interactions.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-500',
          className,
        )}
      >
        <Bot size={48} className="mx-auto mb-4 text-gray-300" />
        <p>{t('empty.no_interactions', 'No AI interactions found')}</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filters.interactionType || ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                interactionType: (e.target.value as AIInteractionType) || undefined,
              }))
            }
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">{t('filter.all_types', 'All Types')}</option>
            <option value="generation">{t('type.generation', 'Generation')}</option>
            <option value="suggestion">{t('type.suggestion', 'Suggestion')}</option>
            <option value="analysis">{t('type.analysis', 'Analysis')}</option>
            <option value="chat">{t('type.chat', 'Chat')}</option>
          </select>

          <select
            value={filters.status || ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: (e.target.value as AIRunStatus) || undefined,
              }))
            }
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">{t('filter.all_statuses', 'All Statuses')}</option>
            <option value="completed">{t('status.completed', 'Completed')}</option>
            <option value="failed">{t('status.failed', 'Failed')}</option>
            <option value="running">{t('status.running', 'Running')}</option>
          </select>
        </div>

        <div className="text-sm text-gray-500">
          {t('showing', 'Showing')} {interactions.length} {t('of', 'of')} {totalCount}
        </div>
      </div>

      {/* Interaction List */}
      <div className="space-y-3">
        {interactions.map((interaction: AIInteractionLog) => {
          const isExpanded = expandedRows.has(interaction.id)
          const hasDecision =
            interaction.ai_approval_decisions && interaction.ai_approval_decisions.length > 0
          const hasEdits = interaction.ai_user_edits && interaction.ai_user_edits.length > 0
          const latestDecision = hasDecision ? interaction.ai_approval_decisions![0] : null

          return (
            <div
              key={interaction.id}
              className="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Main Row */}
              <div className="cursor-pointer p-4" onClick={() => toggleRow(interaction.id)}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: Type and Content */}
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex size-10 items-center justify-center rounded-full',
                        interaction.status === 'completed'
                          ? 'bg-green-100 text-green-600'
                          : interaction.status === 'failed'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600',
                      )}
                    >
                      {getInteractionIcon(interaction.interaction_type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {t(`type.${interaction.interaction_type}`, interaction.interaction_type)}
                        </span>
                        <span className="text-gray-400">-</span>
                        <span className="text-gray-600">
                          {t(`content.${interaction.content_type}`, interaction.content_type)}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            STATUS_STYLES[interaction.status],
                          )}
                        >
                          {t(`status.${interaction.status}`, interaction.status)}
                        </span>

                        {/* Decision Badge */}
                        {latestDecision && (
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-medium',
                              DECISION_STYLES[latestDecision.decision],
                            )}
                          >
                            {t(`decision.${latestDecision.decision}`, latestDecision.decision)}
                          </span>
                        )}
                      </div>

                      {/* Prompt Preview */}
                      <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                        {interaction.user_prompt}
                      </p>

                      {/* Metadata */}
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatTimestamp(interaction.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap size={12} />
                          {formatDuration(interaction.latency_ms)}
                        </span>
                        {interaction.total_tokens && (
                          <span className="flex items-center gap-1">
                            <Activity size={12} />
                            {interaction.total_tokens} tokens
                          </span>
                        )}
                        {interaction.estimated_cost_usd && (
                          <span className="flex items-center gap-1">
                            <DollarSign size={12} />${interaction.estimated_cost_usd.toFixed(4)}
                          </span>
                        )}
                        {hasEdits && (
                          <span className="flex items-center gap-1 text-orange-500">
                            <Edit3 size={12} />
                            {interaction.ai_user_edits!.length} {t('edits', 'edits')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expand/View Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedInteractionId(interaction.id)
                      }}
                      className="rounded-md border border-gray-200 p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                      aria-label={t('view_details', 'View Details')}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="rounded-md p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                      aria-label={isExpanded ? t('collapse', 'Collapse') : t('expand', 'Expand')}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Prompt */}
                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                        <User size={14} />
                        {t('prompt', 'Prompt')}
                      </h4>
                      <div className="rounded-md bg-white p-3 text-sm text-gray-600 shadow-sm">
                        {interaction.user_prompt}
                      </div>
                    </div>

                    {/* Response */}
                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Bot size={14} />
                        {t('response', 'Response')}
                      </h4>
                      <div className="max-h-40 overflow-y-auto rounded-md bg-white p-3 text-sm text-gray-600 shadow-sm">
                        {interaction.ai_response || t('no_response', 'No response')}
                      </div>
                    </div>
                  </div>

                  {/* Model Info */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span>
                      <strong>{t('model', 'Model')}:</strong> {interaction.model_provider}/
                      {interaction.model_name}
                    </span>
                    <span>
                      <strong>{t('classification', 'Classification')}:</strong>{' '}
                      {t(
                        `classification.${interaction.data_classification}`,
                        interaction.data_classification,
                      )}
                    </span>
                    {interaction.contains_pii && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <AlertTriangle size={12} />
                        {t('contains_pii', 'Contains PII')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalCount > (filters.limit || 20) && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                offset: Math.max(0, (prev.offset || 0) - (prev.limit || 20)),
              }))
            }
            disabled={(filters.offset || 0) === 0}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm disabled:opacity-50"
          >
            {t('previous', 'Previous')}
          </button>
          <span className="text-sm text-gray-500">
            {Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1} /{' '}
            {Math.ceil(totalCount / (filters.limit || 20))}
          </span>
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                offset: (prev.offset || 0) + (prev.limit || 20),
              }))
            }
            disabled={(filters.offset || 0) + (filters.limit || 20) >= totalCount}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm disabled:opacity-50"
          >
            {t('next', 'Next')}
          </button>
        </div>
      )}

      {/* Detail View Modal */}
      {selectedInteractionId && (
        <InteractionDetailView
          interactionId={selectedInteractionId}
          onClose={() => setSelectedInteractionId(null)}
        />
      )}
    </div>
  )
}

/**
 * Detailed view for a single interaction with full audit trail
 */
const InteractionDetailView: React.FC<InteractionDetailViewProps> = ({
  interactionId,
  onClose,
  className = '',
}) => {
  const { t, i18n } = useTranslation('ai-interactions')
  const isRTL = i18n.language === 'ar'

  const { data: interactionData, isLoading: loadingInteraction } = useAIInteraction(interactionId)
  const { data: auditData, isLoading: loadingAudit } = useAIInteractionAudit(interactionId)
  const { data: editsData, isLoading: loadingEdits } = useAIInteractionEdits(interactionId)

  const interaction = interactionData?.data
  const auditTrail = auditData?.data || []
  const userEdits = editsData?.data || []

  const isLoading = loadingInteraction || loadingAudit || loadingEdits

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date)
  }

  // Event type icons
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'interaction_started':
        return <Sparkles size={14} />
      case 'prompt_sent':
        return <User size={14} />
      case 'response_received':
        return <Bot size={14} />
      case 'user_edit':
        return <Edit3 size={14} />
      case 'approved':
        return <CheckCircle size={14} />
      case 'rejected':
        return <XCircle size={14} />
      default:
        return <Activity size={14} />
    }
  }

  // Event type colors
  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'approved':
        return 'text-green-600 bg-green-100'
      case 'rejected':
        return 'text-red-600 bg-red-100'
      case 'user_edit':
        return 'text-orange-600 bg-orange-100'
      case 'response_received':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={cn(
          'max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl',
          className,
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('detail.title', 'AI Interaction Details')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <XCircle size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : interaction ? (
          <div className="p-6 space-y-6">
            {/* Overview */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 font-medium text-gray-900">{t('detail.overview', 'Overview')}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <span className="text-xs text-gray-500">{t('type', 'Type')}</span>
                  <p className="font-medium">{t(`type.${interaction.interaction_type}`)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">{t('content_type', 'Content Type')}</span>
                  <p className="font-medium">{t(`content.${interaction.content_type}`)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">{t('status', 'Status')}</span>
                  <p
                    className={cn(
                      'inline-block rounded-full px-2 py-0.5 text-sm font-medium',
                      STATUS_STYLES[interaction.status],
                    )}
                  >
                    {t(`status.${interaction.status}`)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">{t('model', 'Model')}</span>
                  <p className="font-medium">
                    {interaction.model_provider}/{interaction.model_name}
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className="mt-4 flex flex-wrap gap-4 border-t pt-4 text-sm">
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-gray-400" />
                  {formatTimestamp(interaction.created_at)}
                </span>
                {interaction.latency_ms && (
                  <span className="flex items-center gap-1">
                    <Zap size={14} className="text-gray-400" />
                    {interaction.latency_ms}ms
                  </span>
                )}
                {interaction.total_tokens && (
                  <span className="flex items-center gap-1">
                    <Activity size={14} className="text-gray-400" />
                    {interaction.total_tokens} tokens
                  </span>
                )}
                {interaction.estimated_cost_usd && (
                  <span className="flex items-center gap-1">
                    <DollarSign size={14} className="text-gray-400" />$
                    {interaction.estimated_cost_usd.toFixed(6)}
                  </span>
                )}
              </div>
            </div>

            {/* Prompt & Response */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-medium text-gray-900">
                  <User size={16} />
                  {t('detail.prompt', 'User Prompt')}
                </h3>
                <div className="max-h-48 overflow-y-auto rounded bg-gray-50 p-3 text-sm">
                  {interaction.user_prompt}
                </div>
                {interaction.system_prompt && (
                  <>
                    <h4 className="mb-2 mt-4 text-sm font-medium text-gray-600">
                      {t('detail.system_prompt', 'System Prompt')}
                    </h4>
                    <div className="max-h-32 overflow-y-auto rounded bg-gray-50 p-3 text-xs text-gray-500">
                      {interaction.system_prompt}
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-medium text-gray-900">
                  <Bot size={16} />
                  {t('detail.response', 'AI Response')}
                </h3>
                <div className="max-h-80 overflow-y-auto rounded bg-gray-50 p-3 text-sm">
                  {interaction.ai_response || t('no_response', 'No response')}
                </div>
              </div>
            </div>

            {/* User Edits */}
            {userEdits.length > 0 && (
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-medium text-gray-900">
                  <Edit3 size={16} />
                  {t('detail.user_edits', 'User Edits')} ({userEdits.length})
                </h3>
                <div className="space-y-3">
                  {userEdits.map((edit: AIUserEdit) => (
                    <div key={edit.id} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {t('version', 'Version')} {edit.version_number}
                        </span>
                        <span className="text-xs text-gray-500">
                          {edit.change_percentage.toFixed(1)}% {t('changed', 'changed')}
                        </span>
                      </div>
                      {edit.edit_reason && (
                        <p className="mb-2 text-sm text-gray-600">
                          <strong>{t('reason', 'Reason')}:</strong> {edit.edit_reason}
                        </p>
                      )}
                      {edit.edit_categories && edit.edit_categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {edit.edit_categories.map((cat) => (
                            <span
                              key={cat}
                              className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Trail */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-medium text-gray-900">
                <Shield size={16} />
                {t('detail.audit_trail', 'Governance Audit Trail')}
              </h3>

              <div className="relative space-y-3">
                {/* Timeline line */}
                <div
                  className={cn(
                    'absolute top-0 h-full w-0.5 bg-gray-200',
                    isRTL ? 'end-2' : 'start-2',
                  )}
                />

                {auditTrail.map((event: AIGovernanceAudit) => (
                  <div key={event.id} className={cn('relative', isRTL ? 'pe-8' : 'ps-8')}>
                    {/* Event dot */}
                    <div
                      className={cn(
                        'absolute flex size-5 items-center justify-center rounded-full',
                        getEventColor(event.event_type),
                        isRTL ? 'end-0' : 'start-0',
                      )}
                    >
                      {getEventIcon(event.event_type)}
                    </div>

                    {/* Event content */}
                    <div className="rounded-md bg-gray-50 p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {t(`event.${event.event_type}`, event.event_type)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTimestamp(event.occurred_at)}
                        </span>
                      </div>
                      {Object.keys(event.event_data).length > 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          {Object.entries(event.event_data).map(([key, value]) => (
                            <span key={key} className="me-3">
                              {key}: {JSON.stringify(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            {t('error.not_found', 'Interaction not found')}
          </div>
        )}
      </div>
    </div>
  )
}

export default AIInteractionLogViewer
