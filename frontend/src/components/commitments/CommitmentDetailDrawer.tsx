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
import { getEvidenceUrl } from '@/services/commitments.service'
import { type Commitment, PRIORITY_COLORS, STATUS_COLORS } from '@/types/commitment.types'
import { isCommitmentOverdue, getDaysUntilDue } from '@/services/commitments.service'
import { StatusDropdown } from './StatusDropdown'
import { StatusTimeline } from './StatusTimeline'
import { CommitmentForm } from './CommitmentForm'
import { EvidenceUpload } from './EvidenceUpload'
import { DeliverablesTimeline } from './deliverables'
import { DossierLinksWidget } from '@/components/Dossier'

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

  // Reset edit mode when drawer closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsEditing(false)
    }
    onOpenChange(newOpen)
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
          className="w-full overflow-y-auto sm:max-w-lg"
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
              <AlertTriangle className="mb-4 size-12 text-muted-foreground" />
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
                      <SheetTitle className="flex-1 text-start text-lg">
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
                        <p className="text-start text-sm text-muted-foreground">
                          {commitment.description}
                        </p>
                      </div>
                    )}

                    <Separator />

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Due Date */}
                      <div className="space-y-1">
                        <p className="text-start text-xs text-muted-foreground">
                          {t('form.dueDate')}
                        </p>
                        <div
                          className={`flex items-center gap-1.5 text-sm ${
                            overdue ? 'font-medium text-red-600 dark:text-red-400' : ''
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
                        <p className="text-start text-xs text-muted-foreground">
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
                        <p className="text-start text-xs text-muted-foreground">
                          {t('form.ownerType')}
                        </p>
                        <div className="flex items-center gap-1.5 text-sm">
                          <User className="size-4" />
                          <span>{t(`ownerType.${commitment.owner_type}`)}</span>
                        </div>
                      </div>

                      {/* Tracking Mode */}
                      <div className="space-y-1">
                        <p className="text-start text-xs text-muted-foreground">
                          {t('form.trackingMode')}
                        </p>
                        <span className="text-sm">{t(`form.${commitment.tracking_mode}`)}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Linked Dossiers Widget - Reusable widget showing dossier context */}
                    <DossierLinksWidget
                      workItemType="commitment"
                      workItemId={commitment.id}
                      editable={
                        commitment.status !== 'cancelled' && commitment.status !== 'completed'
                      }
                      showCard={false}
                      compact
                      showEmptyState={true}
                    />

                    <Separator />

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
                      <p className="text-start text-xs font-medium text-muted-foreground">
                        {t('detail.evidence')}
                      </p>

                      {commitment.proof_url ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                            <CheckCircle className="size-5 text-green-600 dark:text-green-400" />
                            <div className="flex-1">
                              <p className="text-start text-sm font-medium">
                                {t('evidence.uploadSuccess')}
                              </p>
                              {commitment.evidence_submitted_at && (
                                <p className="text-start text-xs text-muted-foreground">
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
                          <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                            <AlertTriangle className="size-5 text-yellow-600 dark:text-yellow-400" />
                            <p className="text-start text-sm">
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
                        <p className="text-start text-sm text-muted-foreground">
                          {t('detail.noEvidence')}
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* T058: Status Timeline */}
                    <div className="space-y-3">
                      <p className="text-start text-xs font-medium text-muted-foreground">
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
                        <div className="col-span-2 space-y-1">
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
            className="max-h-[90vh] max-w-md overflow-y-auto"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <DialogHeader>
              <DialogTitle className="text-start">{t('evidence.title')}</DialogTitle>
            </DialogHeader>
            <p className="mb-4 text-start text-sm text-muted-foreground">
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
