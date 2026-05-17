import { useState, lazy, Suspense, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from '@tanstack/react-router'
import { SLACountdown } from '../components/sla-countdown/SLACountdown'
import { TriagePanel } from '../components/triage-panel/TriagePanel'
import { DuplicateComparison } from '../components/duplicate-comparison/DuplicateComparison'
import { InputDialog } from '../components/input-dialog/InputDialog'
import { useTicket, useConvertTicket, useCloseTicket } from '../hooks/useIntakeApi'
import { useAuthStore } from '../store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useDirection } from '@/hooks/useDirection'
import { IntakePromotionDialog } from '@/components/engagements/IntakePromotionDialog'
import { ConvertedTicketBanner } from '@/components/engagements/ConvertedTicketBanner'
import { usePromoteIntake } from '@/domains/engagements/hooks/useLifecycle'
import type { IntakePromotionRequest } from '@/types/lifecycle.types'

// Lazy load EntityLinkManager for performance (Task T049)
const EntityLinkManager = lazy(() => import('../components/entity-links/EntityLinkManager'))

// Roles that have permission to restore deleted links
const STEWARD_PLUS_ROLES = ['steward', 'admin', 'coordinator', 'system']

const statusVariants: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#TicketDetail
  submitted: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#TicketDetail
  triaged: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#TicketDetail
  assigned: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#TicketDetail
  in_progress: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#TicketDetail
  converted: 'bg-green-500/15 text-green-700 dark:text-green-400',
  closed: 'bg-muted text-muted-foreground',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#TicketDetail
  merged: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
}

export function TicketDetail() {
  const { t } = useTranslation('intake')
  const { isRTL } = useDirection()
  const { id } = useParams({ strict: false })
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<
    'details' | 'triage' | 'duplicates' | 'history' | 'links'
  >('details')

  // Dialog states for replacing browser prompts
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [promoteOpen, setPromoteOpen] = useState(false)

  // Lifecycle promotion hook
  const { mutate: promoteIntake, isPending: isPromoting } = usePromoteIntake()

  const handlePromote = useCallback(
    (data: IntakePromotionRequest): void => {
      promoteIntake(data, {
        onSuccess: (result) => {
          setPromoteOpen(false)
          void navigate({
            to: '/engagements/$engagementId',
            params: { engagementId: result.engagement_id },
          })
        },
      })
    },
    [promoteIntake, navigate],
  )

  // Get current user for permission checks
  const user = useAuthStore((state) => state.user)

  // Check if user has steward+ permission (can restore deleted links)
  const canRestoreLinks = useMemo(() => {
    return user?.role ? STEWARD_PLUS_ROLES.includes(user.role) : false
  }, [user?.role])

  // Use the proper hooks
  const { data: response, isLoading, error } = useTicket(id || '')
  const ticket = (response as any)?.ticket ?? response
  const attachments = (response as any)?.attachments || []

  const convertMutation = useConvertTicket(id || '')
  const closeMutation = useCloseTicket(id || '')

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="border-destructive">
          <CardContent className="p-4 text-destructive">
            {t('ticketDetail.error', 'Failed to load ticket. Please try again.')}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Converted Ticket Banner — shown when ticket was promoted to engagement */}
      {ticket.convertedToId != null && ticket.convertedToId !== '' && (
        <div className="mb-4">
          <ConvertedTicketBanner convertedToId={ticket.convertedToId} />
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-start">
              {ticket.ticketNumber}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1 text-start">
              {isRTL && ticket.titleAr ? ticket.titleAr : ticket.title}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {ticket.status && (
              <Badge
                className={cn(
                  'text-xs px-3 py-1',
                  statusVariants[ticket.status] || 'bg-muted text-muted-foreground',
                )}
              >
                {String(t(`queue.status.${ticket.status}`, ticket.status))}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate({ to: '/my-work/intake' })}>
              {t('common.back', 'Back to Queue')}
            </Button>
          </div>
        </div>

        {/* SLA Indicators */}
        {ticket.status !== 'closed' && ticket.status !== 'converted' && ticket.submittedAt && (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <SLACountdown
              ticketId={ticket.id}
              targetMinutes={ticket.priority === 'urgent' || ticket.priority === 'high' ? 30 : 60}
              eventType="acknowledgment"
              startedAt={ticket.submittedAt}
              initialPaused={false}
              accumulatedPauseMinutes={0}
              canPauseResume={canRestoreLinks}
            />
            <SLACountdown
              ticketId={ticket.id}
              targetMinutes={
                ticket.priority === 'urgent' || ticket.priority === 'high' ? 480 : 1440
              }
              eventType="resolution"
              startedAt={ticket.submittedAt}
              initialPaused={false}
              accumulatedPauseMinutes={0}
              canPauseResume={canRestoreLinks}
            />
          </div>
        )}
      </div>

      {/* Tabs + Content */}
      <Card>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <div className="px-4 sm:px-6 pt-3">
            <TabsList
              className="w-full justify-start overflow-x-auto scrollbar-hide flex-nowrap h-auto"
              aria-label={t('ticketDetail.tabsLabel', 'Ticket sections')}
            >
              {(['details', 'triage', 'duplicates', 'history', 'links'] as const).map((tab) => (
                <TabsTrigger key={tab} value={tab} className="flex-shrink-0 text-xs sm:text-sm">
                  {t(`ticketDetail.tabs.${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        <CardContent className="p-4 sm:p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">
                    {t('ticketDetail.requestType', 'Request Type')}
                  </label>
                  <p className="text-foreground">
                    {ticket.requestType
                      ? String(
                          t(`form.requestType.options.${ticket.requestType}`, ticket.requestType),
                        )
                      : '—'}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">
                    {t('ticketDetail.urgency', 'Urgency')}
                  </label>
                  <p className="text-foreground">
                    {ticket.urgency
                      ? String(t(`queue.urgency.${ticket.urgency}`, ticket.urgency))
                      : '—'}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">
                    {t('ticketDetail.sensitivity', 'Sensitivity')}
                  </label>
                  <p className="capitalize text-foreground">{ticket.sensitivity || '—'}</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">
                    {t('ticketDetail.priority', 'Priority')}
                  </label>
                  <p className="text-foreground">
                    {ticket.priority
                      ? String(t(`queue.priority.${ticket.priority}`, ticket.priority))
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  {t('ticketDetail.description', 'Description')}
                </label>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="whitespace-pre-wrap text-foreground">
                    {isRTL && ticket.descriptionAr ? ticket.descriptionAr : ticket.description}
                  </p>
                </div>
              </div>

              {/* Type-Specific Fields */}
              {ticket.typeSpecificFields && Object.keys(ticket.typeSpecificFields).length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    {t('ticketDetail.additionalInfo', 'Additional Information')}
                  </label>
                  <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                    {Object.entries(ticket.typeSpecificFields).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize text-muted-foreground">{key}:</span>
                        <span className="text-foreground">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {attachments && attachments.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    {t('ticketDetail.attachments', 'Attachments')}
                  </label>
                  <div className="space-y-2">
                    {attachments.map((attachment: any) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📎</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {attachment.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button variant="link" size="sm" className="text-primary">
                          {t('common.download', 'Download')}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {ticket.status !== 'closed' && ticket.status !== 'converted' && (
                <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                  {ticket.requestType === 'engagement' && (
                    <Button
                      onClick={() => setPromoteOpen(true)}
                      disabled={isPromoting}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {t('ticketDetail.promoteToEngagement', 'Promote to Engagement')}
                    </Button>
                  )}
                  {ticket.status === 'triaged' && (
                    <Button
                      onClick={() => setConvertDialogOpen(true)}
                      disabled={convertMutation.isPending}
                      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#TicketDetail
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {t('ticketDetail.convert', 'Convert to Artifact')}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => setCloseDialogOpen(true)}
                    disabled={closeMutation.isPending}
                  >
                    {t('ticketDetail.close', 'Close Ticket')}
                  </Button>
                </div>
              )}

              {/* Convert Dialog */}
              <InputDialog
                open={convertDialogOpen}
                onOpenChange={setConvertDialogOpen}
                title={t('ticketDetail.convertTitle', 'Convert Ticket')}
                description={t(
                  'ticketDetail.convertDescription',
                  'Select the artifact type to convert this ticket into',
                )}
                placeholder={t('ticketDetail.selectType', 'Select type...')}
                inputType="select"
                options={[
                  { value: 'dossier', label: t('ticketDetail.convertOptions.dossier', 'Dossier') },
                  {
                    value: 'engagement',
                    label: t('ticketDetail.convertOptions.engagement', 'Engagement'),
                  },
                  {
                    value: 'position',
                    label: t('ticketDetail.convertOptions.position', 'Position'),
                  },
                ]}
                confirmLabel={t('ticketDetail.convert', 'Convert')}
                isLoading={convertMutation.isPending}
                onConfirm={(targetType) => {
                  convertMutation.mutate(
                    { targetType: targetType as any },
                    { onSuccess: () => setConvertDialogOpen(false) },
                  )
                }}
              />

              {/* Close Dialog */}
              <InputDialog
                open={closeDialogOpen}
                onOpenChange={setCloseDialogOpen}
                title={t('ticketDetail.closeTitle', 'Close Ticket')}
                description={t(
                  'ticketDetail.closeDescription',
                  'Provide a resolution summary for closing this ticket',
                )}
                placeholder={t('ticketDetail.resolutionPlaceholder', 'Enter resolution summary...')}
                inputType="textarea"
                confirmLabel={t('ticketDetail.close', 'Close Ticket')}
                isLoading={closeMutation.isPending}
                onConfirm={(resolution) => {
                  closeMutation.mutate(
                    {
                      resolution,
                      resolutionAr: isRTL ? resolution : undefined,
                    },
                    { onSuccess: () => setCloseDialogOpen(false) },
                  )
                }}
              />

              {/* Intake Promotion Dialog */}
              {ticket.requestType === 'engagement' && (
                <IntakePromotionDialog
                  ticket={ticket}
                  open={promoteOpen}
                  onOpenChange={setPromoteOpen}
                  onPromote={handlePromote}
                  isPending={isPromoting}
                />
              )}
            </div>
          )}

          {activeTab === 'triage' && <TriagePanel ticketId={ticket.id} />}

          {activeTab === 'duplicates' && <DuplicateComparison ticketId={ticket.id} />}

          {activeTab === 'history' && (
            <div className="text-muted-foreground">
              {t('ticketDetail.historyPlaceholder', 'Audit history will be displayed here')}
            </div>
          )}

          {activeTab === 'links' && (
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="inline-block size-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                  <p className="ms-4 text-muted-foreground">{t('common.loading', 'Loading...')}</p>
                </div>
              }
            >
              <EntityLinkManager
                intakeId={ticket.id}
                organizationId={ticket.dossierId}
                classificationLevel={0}
                canRestore={canRestoreLinks}
                enableReorder={true}
              />
            </Suspense>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
