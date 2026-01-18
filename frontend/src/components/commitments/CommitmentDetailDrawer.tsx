/**
 * CommitmentDetailDrawer Component v1.2
 * Feature: 031-commitments-management
 * Updated for: 035-dossier-context (Smart Dossier Context Inheritance)
 * Tasks: T055, T058, T059, T060
 *
 * Displays detailed commitment information in a side drawer:
 * - Full commitment details with status timeline (T058)
 * - Dossier link navigation with inheritance info (T059, T025)
 * - Edit mode toggle with CommitmentForm (T060)
 * - Evidence display and upload
 * - Mobile-first, RTL-compatible, 44x44px touch targets
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  Edit,
  ExternalLink,
  FileText,
  User,
  CheckCircle,
  AlertTriangle,
  Download,
  Upload,
  Loader2,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCommitment } from '@/hooks/useCommitments'
import { useDossier } from '@/hooks/useDossier'
import { useWorkItemDossierLinks } from '@/hooks/useWorkItemDossierLinks'
import { getEvidenceUrl } from '@/services/commitments.service'
import { type Commitment, PRIORITY_COLORS, STATUS_COLORS } from '@/types/commitment.types'
import { isCommitmentOverdue, getDaysUntilDue } from '@/services/commitments.service'
import { StatusDropdown } from './StatusDropdown'
import { StatusTimeline } from './StatusTimeline'
import { CommitmentForm } from './CommitmentForm'
import { EvidenceUpload } from './EvidenceUpload'
import { DeliverablesTimeline } from './deliverables'
import { DossierContextBadge } from '@/components/Dossier'

export interface CommitmentDetailDrawerProps {
  commitmentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommitmentDetailDrawer({
  commitmentId,
  open,
  onOpenChange,
}: CommitmentDetailDrawerProps) {
  const { t, i18n } = useTranslation('commitments')
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  // State
  const [isEditing, setIsEditing] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Fetch commitment details
  const {
    data: commitment,
    isLoading,
    isError,
  } = useCommitment(commitmentId ?? '', { enabled: !!commitmentId && open })

  // Fetch dossier details for displaying name
  const { data: dossier } = useDossier(commitment?.dossier_id ?? '', undefined, {
    enabled: !!commitment?.dossier_id,
  })

  // Fetch dossier links to show inheritance info (T025)
  const { links: dossierLinks } = useWorkItemDossierLinks('commitment', commitmentId ?? '', {
    enabled: !!commitmentId && open,
  })

  // Get dossier display name based on language
  const dossierDisplayName = dossier
    ? isRTL
      ? dossier.name_ar || dossier.name_en
      : dossier.name_en
    : commitment?.dossier_id

  // Reset edit mode when drawer closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsEditing(false)
    }
    onOpenChange(newOpen)
  }

  // T059: Navigate to dossier (using type-specific routes)
  const handleNavigateToDossier = () => {
    if (commitment?.dossier_id && dossier?.type) {
      onOpenChange(false)
      // Map dossier type to route segment (pluralize for route)
      const typeToRoute: Record<string, string> = {
        country: 'countries',
        organization: 'organizations',
        person: 'persons',
        engagement: 'engagements',
        forum: 'forums',
        working_group: 'working_groups',
      }
      const routeSegment = typeToRoute[dossier.type] || 'countries'
      navigate({
        to: `/dossiers/${routeSegment}/$id`,
        params: { id: commitment.dossier_id },
      })
    }
  }

  // Handle evidence download
  const handleDownloadEvidence = async () => {
    if (!commitment?.proof_url) return

    setIsDownloading(true)
    try {
      const { signedUrl } = await getEvidenceUrl(commitment.proof_url)
      window.open(signedUrl, '_blank')
    } catch (error) {
      console.error('Failed to get evidence URL:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  // Format dates
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Calculate overdue status
  const overdue = commitment ? isCommitmentOverdue(commitment.due_date, commitment.status) : false
  const daysUntilDue = commitment ? getDaysUntilDue(commitment.due_date) : 0

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side={isRTL ? 'left' : 'right'}
          className="w-full sm:max-w-lg overflow-y-auto"
          dir={isRTL ? 'rtl' : 'ltr'}
          accessibleTitle={t('detail.title', 'Commitment Details')}
        >
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              <SheetHeader>
                <Skeleton className="h-8 w-3/4" />
              </SheetHeader>
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="size-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('errors.loadFailed')}</p>
            </div>
          )}

          {/* Content */}
          {commitment && !isLoading && (
            <>
              {/* T060: Edit Mode */}
              {isEditing ? (
                <>
                  <SheetHeader>
                    <SheetTitle className="text-start">{t('actions.edit')}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <CommitmentForm
                      dossierId={commitment.dossier_id}
                      commitment={commitment}
                      onSuccess={() => setIsEditing(false)}
                      onCancel={() => setIsEditing(false)}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Header with title and actions */}
                  <SheetHeader className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <SheetTitle className="text-start text-lg flex-1">
                        {commitment.title || t('card.noTitle')}
                      </SheetTitle>
                      {commitment.status !== 'cancelled' && commitment.status !== 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                          className="min-h-11 shrink-0"
                        >
                          <Edit className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                          {t('actions.edit')}
                        </Button>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <StatusDropdown
                        commitmentId={commitment.id}
                        currentStatus={commitment.status}
                      />
                    </div>
                  </SheetHeader>

                  <div className="mt-6 space-y-6">
                    {/* Description */}
                    {commitment.description && (
                      <div>
                        <p className="text-sm text-muted-foreground text-start">
                          {commitment.description}
                        </p>
                      </div>
                    )}

                    <Separator />

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Due Date */}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground text-start">
                          {t('form.dueDate')}
                        </p>
                        <div
                          className={`flex items-center gap-1.5 text-sm ${
                            overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''
                          }`}
                        >
                          {overdue ? (
                            <AlertTriangle className="size-4" />
                          ) : (
                            <Calendar className="size-4" />
                          )}
                          <span>
                            {formatDate(commitment.due_date)}
                            {overdue &&
                              ` (${Math.abs(daysUntilDue)} ${t('card.overdueDays', { days: '' }).trim()})`}
                          </span>
                        </div>
                      </div>

                      {/* Priority */}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground text-start">
                          {t('form.priority')}
                        </p>
                        <Badge
                          variant="outline"
                          className={`${PRIORITY_COLORS[commitment.priority].bg} ${PRIORITY_COLORS[commitment.priority].text}`}
                        >
                          {t(`priority.${commitment.priority}`)}
                        </Badge>
                      </div>

                      {/* Owner Type */}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground text-start">
                          {t('form.ownerType')}
                        </p>
                        <div className="flex items-center gap-1.5 text-sm">
                          <User className="size-4" />
                          <span>{t(`ownerType.${commitment.owner_type}`)}</span>
                        </div>
                      </div>

                      {/* Tracking Mode */}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground text-start">
                          {t('form.trackingMode')}
                        </p>
                        <span className="text-sm">{t(`form.${commitment.tracking_mode}`)}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* T059, T025, T041: Dossier Link with Inheritance Info using DossierContextBadge */}
                    {commitment.dossier_id && (
                      <>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground text-start">
                            {t('detail.dossier')}
                          </p>
                          {/* Use DossierContextBadge for consistent visual */}
                          {dossierLinks.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {dossierLinks.map((link) => (
                                <DossierContextBadge
                                  key={link.id}
                                  dossierId={link.dossier_id}
                                  dossierType={(link.dossier?.type as any) ?? 'country'}
                                  nameEn={link.dossier?.name_en ?? dossierDisplayName ?? ''}
                                  nameAr={link.dossier?.name_ar}
                                  inheritanceSource={link.inheritance_source}
                                  isPrimary={link.is_primary}
                                  size="default"
                                />
                              ))}
                            </div>
                          ) : (
                            /* Fallback to button if no links loaded yet */
                            <Button
                              variant="outline"
                              onClick={handleNavigateToDossier}
                              className="min-h-11 w-full justify-start"
                            >
                              <FileText className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                              <span className="truncate flex-1 text-start">
                                {dossierDisplayName}
                              </span>
                              <ExternalLink className="size-4 shrink-0" />
                            </Button>
                          )}
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Deliverables Timeline - Interactive milestone tracking */}
                    {commitment.status !== 'cancelled' && (
                      <>
                        <DeliverablesTimeline
                          commitmentId={commitment.id}
                          commitmentDueDate={commitment.due_date}
                          isCompact
                        />
                        <Separator />
                      </>
                    )}

                    {/* Evidence Section */}
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground text-start font-medium">
                        {t('detail.evidence')}
                      </p>

                      {commitment.proof_url ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <CheckCircle className="size-5 text-green-600 dark:text-green-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-start">
                                {t('evidence.uploadSuccess')}
                              </p>
                              {commitment.evidence_submitted_at && (
                                <p className="text-xs text-muted-foreground text-start">
                                  {t('detail.evidenceSubmittedAt')}:{' '}
                                  {formatDateTime(commitment.evidence_submitted_at)}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            onClick={handleDownloadEvidence}
                            disabled={isDownloading}
                            className="min-h-11"
                          >
                            {isDownloading ? (
                              <Loader2
                                className={`size-4 animate-spin ${isRTL ? 'ms-2' : 'me-2'}`}
                              />
                            ) : (
                              <Download className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                            )}
                            {t('actions.downloadEvidence')}
                          </Button>
                        </div>
                      ) : commitment.proof_required ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <AlertTriangle className="size-5 text-yellow-600 dark:text-yellow-400" />
                            <p className="text-sm text-start">
                              {t('form.proofRequiredDescription')}
                            </p>
                          </div>
                          {commitment.status !== 'cancelled' &&
                            commitment.status !== 'completed' && (
                              <Button
                                variant="outline"
                                onClick={() => setShowUploadDialog(true)}
                                className="min-h-11"
                              >
                                <Upload className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                                {t('actions.uploadEvidence')}
                              </Button>
                            )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-start">
                          {t('detail.noEvidence')}
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* T058: Status Timeline */}
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground text-start font-medium">
                        {t('detail.statusHistory')}
                      </p>
                      <StatusTimeline
                        commitmentId={commitment.id}
                        createdAt={commitment.created_at}
                        createdBy={commitment.created_by}
                      />
                    </div>

                    <Separator />

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div className="space-y-1">
                        <p className="text-start">{t('detail.createdAt')}</p>
                        <p className="text-start font-medium text-foreground">
                          {formatDateTime(commitment.created_at)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-start">{t('detail.updatedAt')}</p>
                        <p className="text-start font-medium text-foreground">
                          {formatDateTime(commitment.updated_at)}
                        </p>
                      </div>
                      {commitment.completed_at && (
                        <div className="space-y-1 col-span-2">
                          <p className="text-start">{t('detail.completedAt')}</p>
                          <p className="text-start font-medium text-foreground">
                            {formatDateTime(commitment.completed_at)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Evidence Upload Dialog */}
      {commitment && (
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent
            className="max-w-md max-h-[90vh] overflow-y-auto"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <DialogHeader>
              <DialogTitle className="text-start">{t('evidence.title')}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground text-start mb-4">
              {t('evidence.description')}
            </p>
            <EvidenceUpload
              commitmentId={commitment.id}
              onSuccess={() => setShowUploadDialog(false)}
              onCancel={() => setShowUploadDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
