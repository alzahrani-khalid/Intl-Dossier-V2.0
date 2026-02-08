/**
 * NominationWorkflow Component
 *
 * Manages committee nominations with submission, review, and approval workflow.
 * Mobile-first responsive, RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User,
  FileText,
  Calendar,
  Building2,
  Flag,
  Mail,
  Phone,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Star,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Filter,
  X,
  Download,
  Eye,
  ThumbsUp,
  ThumbsDown,
  ListFilter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  useCommitteeNominations,
  useApproveNomination,
  useUpdateNomination,
} from '@/hooks/useCommittees'
import type {
  NominationWithNames,
  NominationStatus,
  NominatorType,
  MemberRole,
  UpdateNominationRequest,
} from '@/types/committee.types'

interface NominationWorkflowProps {
  committeeId: string
  onSubmitNomination?: () => void
  onViewNominee?: (nomination: NominationWithNames) => void
}

export function NominationWorkflow({
  committeeId,
  onSubmitNomination,
  onViewNominee,
}: NominationWorkflowProps) {
  const { t, i18n } = useTranslation('committees')
  const isRTL = i18n.language === 'ar'

  const [expandedNomination, setExpandedNomination] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<NominationStatus | ''>('')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch nominations
  const {
    data: nominationsData,
    isLoading,
    error,
    refetch,
  } = useCommitteeNominations(committeeId, statusFilter ? { status: statusFilter } : undefined)
  const approveNomination = useApproveNomination()
  const rejectNomination = useUpdateNomination()

  const nominations = nominationsData || []

  // Group by status for summary
  const statusCounts = nominations.reduce(
    (acc, n) => {
      acc[n.status] = (acc[n.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Handle approve
  const handleApprove = async (nomination: NominationWithNames) => {
    if (window.confirm(t('actions.approve', 'Approve this nomination?'))) {
      await approveNomination.mutateAsync({
        data: { nomination_id: nomination.id },
        committeeId,
      })
    }
  }

  // Handle reject
  const handleReject = async (nomination: NominationWithNames) => {
    const reason = window.prompt(t('nominations.statusReason', 'Reason for rejection:'))
    if (reason !== null) {
      await rejectNomination.mutateAsync({
        id: nomination.id,
        committeeId,
        data: { status: 'rejected', status_reason: reason } as UpdateNominationRequest,
      })
    }
  }

  // Status options
  const statusOptions: NominationStatus[] = [
    'pending',
    'under_review',
    'shortlisted',
    'approved',
    'rejected',
    'withdrawn',
    'expired',
  ]

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-start">
            {t('nominations.title', 'Nominations')}
          </h3>
          <p className="text-sm text-muted-foreground text-start">
            {t('nominations.description', 'Manage committee member nominations')}
          </p>
        </div>

        {onSubmitNomination && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 min-h-10 shrink-0"
            onClick={onSubmitNomination}
          >
            <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
            {t('nominations.create', 'Submit Nomination')}
          </Button>
        )}
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatusCard
          label={t('nominationStatus.pending', 'Pending')}
          count={statusCounts['pending'] || 0}
          icon={<Clock className="h-4 w-4" />}
          color="bg-amber-100 text-amber-600"
          isActive={statusFilter === 'pending'}
          onClick={() => setStatusFilter(statusFilter === 'pending' ? '' : 'pending')}
        />
        <StatusCard
          label={t('nominationStatus.under_review', 'Under Review')}
          count={statusCounts['under_review'] || 0}
          icon={<Eye className="h-4 w-4" />}
          color="bg-blue-100 text-blue-600"
          isActive={statusFilter === 'under_review'}
          onClick={() => setStatusFilter(statusFilter === 'under_review' ? '' : 'under_review')}
        />
        <StatusCard
          label={t('nominationStatus.shortlisted', 'Shortlisted')}
          count={statusCounts['shortlisted'] || 0}
          icon={<Star className="h-4 w-4" />}
          color="bg-purple-100 text-purple-600"
          isActive={statusFilter === 'shortlisted'}
          onClick={() => setStatusFilter(statusFilter === 'shortlisted' ? '' : 'shortlisted')}
        />
        <StatusCard
          label={t('nominationStatus.approved', 'Approved')}
          count={statusCounts['approved'] || 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="bg-green-100 text-green-600"
          isActive={statusFilter === 'approved'}
          onClick={() => setStatusFilter(statusFilter === 'approved' ? '' : 'approved')}
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={() => setShowFilters(!showFilters)}
        >
          <ListFilter className="h-4 w-4" />
          {t('common.filters', 'Filters')}
        </Button>

        {statusFilter && (
          <Badge variant="secondary" className="gap-1">
            {t(`nominationStatus.${statusFilter}`, statusFilter)}
            <button className="ms-1 hover:text-destructive" onClick={() => setStatusFilter('')}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>

      {/* Extended Filters */}
      {showFilters && (
        <div className="p-4 rounded-lg border bg-muted/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                {t('filters.nominationStatus', 'Status')}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as NominationStatus | '')}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t('common.all', 'All')}</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {t(`nominationStatus.${status}`, status)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <div className="rounded-full bg-destructive/10 p-4 w-fit mx-auto mb-4">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t('common.error', 'Failed to load data')}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t('common.retry', 'Try Again')}
          </Button>
        </div>
      )}

      {/* Nominations List */}
      {!isLoading && !error && nominations.length > 0 && (
        <div className="space-y-3">
          {nominations.map((nomination) => (
            <NominationCard
              key={nomination.id}
              nomination={nomination}
              isRTL={isRTL}
              isExpanded={expandedNomination === nomination.id}
              onToggleExpand={() =>
                setExpandedNomination(expandedNomination === nomination.id ? null : nomination.id)
              }
              onApprove={handleApprove}
              onReject={handleReject}
              onView={onViewNominee}
              t={t}
              i18n={i18n}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && nominations.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h4 className="text-lg font-medium mb-2">{t('nominations.empty', 'No nominations')}</h4>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {t('nominations.emptyDescription', 'Submit a nomination to get started')}
          </p>
          {onSubmitNomination && (
            <Button variant="default" onClick={onSubmitNomination} className="gap-2 min-h-11">
              <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              {t('nominations.create', 'Submit Nomination')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Status Card Component
interface StatusCardProps {
  label: string
  count: number
  icon: React.ReactNode
  color: string
  isActive: boolean
  onClick: () => void
}

function StatusCard({ label, count, icon, color, isActive, onClick }: StatusCardProps) {
  return (
    <button
      className={cn(
        'p-3 rounded-lg border text-start transition-all',
        isActive ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30',
      )}
      onClick={onClick}
    >
      <div className={cn('rounded-full p-1.5 w-fit mb-2', color)}>{icon}</div>
      <p className="text-2xl font-semibold">{count}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </button>
  )
}

// Nomination Card Component
interface NominationCardProps {
  nomination: NominationWithNames
  isRTL: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onApprove: (nomination: NominationWithNames) => void
  onReject: (nomination: NominationWithNames) => void
  onView?: (nomination: NominationWithNames) => void
  t: ReturnType<typeof useTranslation>['t']
  i18n: { language: string }
}

function NominationCard({
  nomination,
  isRTL,
  isExpanded,
  onToggleExpand,
  onApprove,
  onReject,
  onView,
  t,
  i18n,
}: NominationCardProps) {
  const nomineeName = isRTL
    ? nomination.nominee_name_ar || nomination.nominee_name_en
    : nomination.nominee_name_en || nomination.nominee_name_ar

  const nomineeTitle = isRTL
    ? nomination.nominee_title_ar || nomination.nominee_title_en
    : nomination.nominee_title_en || nomination.nominee_title_ar

  const nominatedByName = isRTL
    ? nomination.nominated_by_name_ar || nomination.nominated_by_name_en
    : nomination.nominated_by_name_en || nomination.nominated_by_name_ar

  const justification = isRTL
    ? nomination.justification_ar || nomination.justification_en
    : nomination.justification_en || nomination.justification_ar

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get status config
  const getStatusConfig = (status: NominationStatus) => {
    switch (status) {
      case 'pending':
        return { icon: <Clock className="h-3 w-3" />, variant: 'secondary' as const }
      case 'under_review':
        return { icon: <Eye className="h-3 w-3" />, variant: 'secondary' as const }
      case 'shortlisted':
        return { icon: <Star className="h-3 w-3" />, variant: 'default' as const }
      case 'approved':
        return { icon: <CheckCircle2 className="h-3 w-3" />, variant: 'default' as const }
      case 'rejected':
        return { icon: <XCircle className="h-3 w-3" />, variant: 'destructive' as const }
      case 'withdrawn':
        return { icon: <X className="h-3 w-3" />, variant: 'outline' as const }
      case 'expired':
        return { icon: <AlertCircle className="h-3 w-3" />, variant: 'outline' as const }
      default:
        return { icon: <Clock className="h-3 w-3" />, variant: 'outline' as const }
    }
  }

  // Get nominator type icon
  const getNominatorIcon = (type: NominatorType) => {
    switch (type) {
      case 'organization':
        return <Building2 className="h-4 w-4" />
      case 'country':
        return <Flag className="h-4 w-4" />
      case 'person':
        return <User className="h-4 w-4" />
      case 'self':
        return <User className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const statusConfig = getStatusConfig(nomination.status)
  const canReview = ['pending', 'under_review'].includes(nomination.status)

  return (
    <div className="rounded-lg border bg-card hover:border-muted-foreground/30 transition-colors">
      {/* Main Row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <h4 className="font-medium text-card-foreground text-start">
                  {nomineeName || t('common.unknown', 'Unknown')}
                </h4>
                {nomineeTitle && <p className="text-sm text-muted-foreground">{nomineeTitle}</p>}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-xs">
                  {t(`memberRoles.${nomination.role}`, nomination.role)}
                </Badge>
                <Badge variant={statusConfig.variant} className="text-xs gap-1">
                  {statusConfig.icon}
                  {t(`nominationStatus.${nomination.status}`, nomination.status)}
                </Badge>
              </div>
            </div>

            {/* Meta Row */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {/* Nominated By */}
              <span className="flex items-center gap-1">
                {getNominatorIcon(nomination.nominated_by_type)}
                {t(`nominatorTypes.${nomination.nominated_by_type}`, nomination.nominated_by_type)}
                {nominatedByName && `: ${nominatedByName}`}
              </span>

              {/* Nomination Date */}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(nomination.nomination_date)}
              </span>
            </div>
          </div>

          {/* Expand Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={onToggleExpand}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t px-4 py-3 bg-muted/30 space-y-4">
          {/* Contact Info */}
          {(nomination.nominee_email || nomination.nominee_phone) && (
            <div className="flex flex-wrap gap-4 text-sm">
              {nomination.nominee_email && (
                <a
                  href={`mailto:${nomination.nominee_email}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {nomination.nominee_email}
                </a>
              )}
              {nomination.nominee_phone && (
                <a
                  href={`tel:${nomination.nominee_phone}`}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <Phone className="h-4 w-4" />
                  {nomination.nominee_phone}
                </a>
              )}
            </div>
          )}

          {/* Justification */}
          {justification && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {t('nominations.justification', 'Justification')}
              </p>
              <p className="text-sm">{justification}</p>
            </div>
          )}

          {/* Documents */}
          <div className="flex flex-wrap gap-2">
            {nomination.cv_url && (
              <a
                href={nomination.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Download className="h-3 w-3" />
                {t('nominations.cvUrl', 'CV')}
              </a>
            )}
            {nomination.nomination_letter_url && (
              <a
                href={nomination.nomination_letter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <FileText className="h-3 w-3" />
                {t('nominations.nominationLetter', 'Letter')}
              </a>
            )}
            {nomination.supporting_documents && nomination.supporting_documents.length > 0 && (
              <span className="text-xs text-muted-foreground">
                +{nomination.supporting_documents.length} {t('common.documents', 'documents')}
              </span>
            )}
          </div>

          {/* Status Reason */}
          {nomination.status_reason && (
            <div className="p-2 rounded bg-muted">
              <p className="text-xs text-muted-foreground mb-1">
                {t('nominations.statusReason', 'Status Reason')}
              </p>
              <p className="text-sm">{nomination.status_reason}</p>
            </div>
          )}

          {/* Review Info */}
          {nomination.reviewed_by && nomination.reviewed_at && (
            <p className="text-xs text-muted-foreground">
              {t('nominations.reviewedBy', 'Reviewed by')}: {nomination.reviewed_by} •{' '}
              {formatDate(nomination.reviewed_at)}
            </p>
          )}

          {/* Actions Row */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {canReview && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2"
                  onClick={() => onApprove(nomination)}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {t('actions.approve', 'Approve')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => onReject(nomination)}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  {t('actions.reject', 'Reject')}
                </Button>
              </>
            )}
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground ms-auto"
                onClick={() => onView(nomination)}
              >
                <Eye className="h-3.5 w-3.5" />
                {t('actions.viewProfile', 'View Profile')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NominationWorkflow
