/**
 * AddToDossierDialogs - Dialog components for "Add to Dossier" actions
 *
 * Provides dialog modals for each action type:
 * - Intake, Task, Commitment creation
 * - Position, Event scheduling
 * - Relationship, Brief generation, Document upload
 *
 * Each dialog includes:
 * - Pre-filled dossier context badge
 * - Form fields specific to action type
 * - Automatic inheritance_source tracking ('direct')
 *
 * Mobile-first, RTL-compatible, WCAG AA compliant.
 *
 * @module AddToDossierDialogs
 * @see specs/035-dossier-context
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Inbox,
  CheckSquare,
  Handshake,
  MessageSquare,
  Calendar,
  GitBranch,
  FileText,
  Upload,
  Loader2,
  Info,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useCreateTask } from '@/hooks/useTasks'
import { useCreateCommitment } from '@/hooks/useCommitments'
import { useCreateTicket } from '@/hooks/useIntakeApi'
import { useCreatePosition } from '@/hooks/useCreatePosition'
import { useCreateCalendarEvent } from '@/hooks/useCreateCalendarEvent'
import { useCreateRelationship } from '@/hooks/useCreateRelationship'
import { useGenerateBrief } from '@/hooks/useGenerateBrief'
import { useUploadDocument } from '@/hooks/useUploadDocument'
import { useCreateWorkItemDossierLinks } from '@/hooks/useCreateWorkItemDossierLinks'
import type { CreateWorkItemDossierLinksRequest } from '@/hooks/useCreateWorkItemDossierLinks'
import type { Dossier } from '@/lib/dossier-type-guards'
import type { ActionDialogState, DossierContextForAction } from '@/hooks/useAddToDossierActions'
import type { AddToDossierActionType } from './AddToDossierMenu'

// =============================================================================
// Types
// =============================================================================

export interface AddToDossierDialogsProps {
  dossier: Dossier
  dialogStates: ActionDialogState
  onClose: (actionType: AddToDossierActionType) => void
  dossierContext: DossierContextForAction
  /** Use sheet (bottom drawer) on mobile */
  useSheetOnMobile?: boolean
}

interface ActionDialogProps {
  isOpen: boolean
  onClose: () => void
  dossier: Dossier
  dossierContext: DossierContextForAction
  isRTL: boolean
}

// =============================================================================
// Helpers
// =============================================================================

function buildDossierLinkPayload(
  workItemType: 'task' | 'commitment' | 'intake',
  workItemId: string,
  ctx: DossierContextForAction,
): CreateWorkItemDossierLinksRequest {
  return {
    work_item_type: workItemType,
    work_item_id: workItemId,
    dossier_ids: [ctx.dossier_id],
    inheritance_source: ctx.inheritance_source,
    is_primary: true,
  }
}

// =============================================================================
// Shared Components
// =============================================================================

function DossierContextBadge({
  dossierContext,
  isRTL,
}: {
  dossierContext: DossierContextForAction
  isRTL: boolean
}) {
  const { t } = useTranslation('dossier')

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4">
      <Info className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{t('addToDossier.context.linkedTo')}</p>
        <p className="text-sm font-medium truncate">
          {isRTL
            ? dossierContext.dossier_name_ar || dossierContext.dossier_name_en
            : dossierContext.dossier_name_en}
        </p>
      </div>
      <Badge variant="secondary" className="shrink-0 text-xs">
        {dossierContext.inheritance_source}
      </Badge>
    </div>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// =============================================================================
// Intake Dialog
// =============================================================================

function IntakeDialog({
  isOpen,
  onClose,
  dossier: _dossier,
  dossierContext,
  isRTL,
}: ActionDialogProps) {
  const { t } = useTranslation('dossier')
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [requestType, setRequestType] = React.useState<string>('engagement')
  const [urgency, setUrgency] = React.useState<string>('medium')

  const createTicket = useCreateTicket()
  const createLinks = useCreateWorkItemDossierLinks()

  const isSubmitting = createTicket.isPending || createLinks.isPending

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setRequestType('engagement')
    setUrgency('medium')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await createTicket.mutateAsync({
        title,
        description,
        requestType: requestType as 'engagement' | 'position' | 'mou_action' | 'foresight',
        urgency: urgency as 'low' | 'medium' | 'high' | 'critical',
        dossierId: dossierContext.dossier_id,
      })

      if (result?.id) {
        await createLinks.mutateAsync(buildDossierLinkPayload('intake', result.id, dossierContext))
      }

      toast.success(t('addToDossier.success.intake'))
      resetForm()
      onClose()
    } catch {
      toast.error(t('addToDossier.error.intake'))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            {t('addToDossier.dialogs.intake.title')}
          </DialogTitle>
          <DialogDescription>{t('addToDossier.dialogs.intake.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DossierContextBadge dossierContext={dossierContext} isRTL={isRTL} />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="intake-title">{t('form.nameEn')}</Label>
              <Input
                id="intake-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('form.nameEnPlaceholder')}
                required
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="intake-description">{t('form.descriptionEn')}</Label>
              <Textarea
                id="intake-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('form.descriptionEnPlaceholder')}
                rows={3}
              />
            </div>

            <SelectField
              id="intake-request-type"
              label={t('addToDossier.form.requestType')}
              value={requestType}
              onChange={setRequestType}
              options={[
                { value: 'engagement', label: t('addToDossier.form.requestTypes.engagement') },
                { value: 'position', label: t('addToDossier.form.requestTypes.position') },
                { value: 'mou_action', label: t('addToDossier.form.requestTypes.mou_action') },
                { value: 'foresight', label: t('addToDossier.form.requestTypes.foresight') },
              ]}
            />

            <SelectField
              id="intake-urgency"
              label={t('addToDossier.form.urgency')}
              value={urgency}
              onChange={setUrgency}
              options={[
                { value: 'low', label: t('addToDossier.form.urgencyLevels.low') },
                { value: 'medium', label: t('addToDossier.form.urgencyLevels.medium') },
                { value: 'high', label: t('addToDossier.form.urgencyLevels.high') },
                { value: 'critical', label: t('addToDossier.form.urgencyLevels.critical') },
              ]}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="min-h-11">
              {t('action.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !title} className="min-h-11">
              {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t('form.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Task Dialog
// =============================================================================

function TaskDialog({
  isOpen,
  onClose,
  dossier: _dossier,
  dossierContext,
  isRTL,
}: ActionDialogProps) {
  const { t } = useTranslation('dossier')
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [priority, setPriority] = React.useState<string>('medium')

  const createTask = useCreateTask()
  const createLinks = useCreateWorkItemDossierLinks()

  const isSubmitting = createTask.isPending || createLinks.isPending

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority('medium')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await createTask.mutateAsync({
        title,
        description,
        assignee_id: '', // Will be assigned by the system or later
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
      })

      if (result?.id) {
        await createLinks.mutateAsync(buildDossierLinkPayload('task', result.id, dossierContext))
      }

      toast.success(t('addToDossier.success.task'))
      resetForm()
      onClose()
    } catch {
      toast.error(t('addToDossier.error.task'))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            {t('addToDossier.dialogs.task.title')}
          </DialogTitle>
          <DialogDescription>{t('addToDossier.dialogs.task.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DossierContextBadge dossierContext={dossierContext} isRTL={isRTL} />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">{t('form.nameEn')}</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('form.nameEnPlaceholder')}
                required
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">{t('form.descriptionEn')}</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('form.descriptionEnPlaceholder')}
                rows={3}
              />
            </div>

            <SelectField
              id="task-priority"
              label={t('addToDossier.form.priority')}
              value={priority}
              onChange={setPriority}
              options={[
                { value: 'low', label: t('addToDossier.form.priorityLevels.low') },
                { value: 'medium', label: t('addToDossier.form.priorityLevels.medium') },
                { value: 'high', label: t('addToDossier.form.priorityLevels.high') },
                { value: 'urgent', label: t('addToDossier.form.priorityLevels.urgent') },
              ]}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="min-h-11">
              {t('action.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !title} className="min-h-11">
              {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t('form.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Commitment Dialog
// =============================================================================

function CommitmentDialog({
  isOpen,
  onClose,
  dossier: _dossier,
  dossierContext,
  isRTL,
}: ActionDialogProps) {
  const { t } = useTranslation('dossier')
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [dueDate, setDueDate] = React.useState('')
  const [ownerType, setOwnerType] = React.useState<string>('internal')

  const createCommitment = useCreateCommitment()
  const createLinks = useCreateWorkItemDossierLinks()

  const isSubmitting = createCommitment.isPending || createLinks.isPending

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDueDate('')
    setOwnerType('internal')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await createCommitment.mutateAsync({
        title,
        description,
        dossier_id: dossierContext.dossier_id,
        due_date: dueDate,
        owner_type: ownerType as 'internal' | 'external',
      })

      if (result?.id) {
        await createLinks.mutateAsync(
          buildDossierLinkPayload('commitment', result.id, dossierContext),
        )
      }

      toast.success(t('addToDossier.success.commitment'))
      resetForm()
      onClose()
    } catch {
      toast.error(t('addToDossier.error.commitment'))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5" />
            {t('addToDossier.dialogs.commitment.title')}
          </DialogTitle>
          <DialogDescription>{t('addToDossier.dialogs.commitment.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DossierContextBadge dossierContext={dossierContext} isRTL={isRTL} />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commitment-title">{t('form.nameEn')}</Label>
              <Input
                id="commitment-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('form.nameEnPlaceholder')}
                required
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commitment-description">{t('form.descriptionEn')}</Label>
              <Textarea
                id="commitment-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('form.descriptionEnPlaceholder')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commitment-due-date">{t('addToDossier.form.dueDate')}</Label>
              <Input
                id="commitment-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="min-h-11"
              />
            </div>

            <SelectField
              id="commitment-owner-type"
              label={t('addToDossier.form.ownerType')}
              value={ownerType}
              onChange={setOwnerType}
              options={[
                { value: 'internal', label: t('addToDossier.form.ownerTypes.internal') },
                { value: 'external', label: t('addToDossier.form.ownerTypes.external') },
              ]}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="min-h-11">
              {t('action.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title || !dueDate}
              className="min-h-11"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t('form.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Position Dialog
// =============================================================================

function PositionDialog({
  isOpen,
  onClose,
  dossier: _dossier,
  dossierContext,
  isRTL,
}: ActionDialogProps) {
  const { t } = useTranslation('dossier')
  const [title, setTitle] = React.useState('')
  const [content, setContent] = React.useState('')

  const createPosition = useCreatePosition()

  const isSubmitting = createPosition.isPending

  const resetForm = () => {
    setTitle('')
    setContent('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createPosition.mutateAsync({
        position_type_id: dossierContext.dossier_id,
        title_en: title,
        title_ar: '',
        content_en: content,
        audience_groups: [],
      })

      toast.success(t('addToDossier.success.position'))
      resetForm()
      onClose()
    } catch {
      toast.error(t('addToDossier.error.position'))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('addToDossier.dialogs.position.title')}
          </DialogTitle>
          <DialogDescription>{t('addToDossier.dialogs.position.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DossierContextBadge dossierContext={dossierContext} isRTL={isRTL} />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="position-title">{t('form.nameEn')}</Label>
              <Input
                id="position-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('form.nameEnPlaceholder')}
                required
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position-content">{t('form.descriptionEn')}</Label>
              <Textarea
                id="position-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('form.descriptionEnPlaceholder')}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="min-h-11">
              {t('action.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !title} className="min-h-11">
              {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t('form.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Event Dialog
// =============================================================================

function EventDialog({
  isOpen,
  onClose,
  dossier: _dossier,
  dossierContext,
  isRTL,
}: ActionDialogProps) {
  const { t } = useTranslation('dossier')
  const [title, setTitle] = React.useState('')
  const [date, setDate] = React.useState('')
  const [entryType, setEntryType] = React.useState<string>('internal_meeting')

  const createEvent = useCreateCalendarEvent()

  const isSubmitting = createEvent.isPending

  const resetForm = () => {
    setTitle('')
    setDate('')
    setEntryType('internal_meeting')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createEvent.mutateAsync({
        entry_type: entryType as
          | 'internal_meeting'
          | 'deadline'
          | 'reminder'
          | 'holiday'
          | 'training'
          | 'review'
          | 'other',
        title_en: title,
        title_ar: '',
        start_datetime: date,
        linked_item_type: 'dossier',
        linked_item_id: dossierContext.dossier_id,
      })

      toast.success(t('addToDossier.success.event'))
      resetForm()
      onClose()
    } catch {
      toast.error(t('addToDossier.error.event'))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('addToDossier.dialogs.event.title')}
          </DialogTitle>
          <DialogDescription>{t('addToDossier.dialogs.event.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DossierContextBadge dossierContext={dossierContext} isRTL={isRTL} />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">{t('form.nameEn')}</Label>
              <Input
                id="event-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('form.nameEnPlaceholder')}
                required
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-date">{t('sections.engagement.date')}</Label>
              <Input
                id="event-date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="min-h-11"
              />
            </div>

            <SelectField
              id="event-entry-type"
              label={t('addToDossier.form.entryType')}
              value={entryType}
              onChange={setEntryType}
              options={[
                {
                  value: 'internal_meeting',
                  label: t('addToDossier.form.entryTypes.internal_meeting'),
                },
                { value: 'deadline', label: t('addToDossier.form.entryTypes.deadline') },
                { value: 'reminder', label: t('addToDossier.form.entryTypes.reminder') },
                { value: 'training', label: t('addToDossier.form.entryTypes.training') },
                { value: 'review', label: t('addToDossier.form.entryTypes.review') },
                { value: 'other', label: t('addToDossier.form.entryTypes.other') },
              ]}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="min-h-11">
              {t('action.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !title || !date} className="min-h-11">
              {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t('form.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Relationship Dialog
// =============================================================================

function RelationshipDialog({
  isOpen,
  onClose,
  dossier: _dossier,
  dossierContext,
  isRTL,
}: ActionDialogProps) {
  const { t } = useTranslation('dossier')
  const [targetDossierId, setTargetDossierId] = React.useState('')
  const [relationshipType, setRelationshipType] = React.useState<string>('collaborates_with')

  const createRelationship = useCreateRelationship(dossierContext.dossier_id)

  const isSubmitting = createRelationship.isPending

  const resetForm = () => {
    setTargetDossierId('')
    setRelationshipType('collaborates_with')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createRelationship.mutateAsync({
        child_dossier_id: targetDossierId,
        relationship_type: relationshipType as
          | 'member_of'
          | 'participates_in'
          | 'collaborates_with'
          | 'monitors'
          | 'is_member'
          | 'hosts',
      })

      toast.success(t('addToDossier.success.relationship'))
      resetForm()
      onClose()
    } catch {
      toast.error(t('addToDossier.error.relationship'))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {t('addToDossier.dialogs.relationship.title')}
          </DialogTitle>
          <DialogDescription>
            {t('addToDossier.dialogs.relationship.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DossierContextBadge dossierContext={dossierContext} isRTL={isRTL} />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="relationship-target">{t('addToDossier.form.targetDossier')}</Label>
              <Input
                id="relationship-target"
                value={targetDossierId}
                onChange={(e) => setTargetDossierId(e.target.value)}
                placeholder={t('addToDossier.form.targetDossierPlaceholder')}
                required
                className="min-h-11"
              />
            </div>

            <SelectField
              id="relationship-type"
              label={t('addToDossier.form.relationshipType')}
              value={relationshipType}
              onChange={setRelationshipType}
              options={[
                { value: 'member_of', label: t('addToDossier.form.relationshipTypes.member_of') },
                {
                  value: 'participates_in',
                  label: t('addToDossier.form.relationshipTypes.participates_in'),
                },
                {
                  value: 'collaborates_with',
                  label: t('addToDossier.form.relationshipTypes.collaborates_with'),
                },
                { value: 'monitors', label: t('addToDossier.form.relationshipTypes.monitors') },
                { value: 'hosts', label: t('addToDossier.form.relationshipTypes.hosts') },
              ]}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="min-h-11">
              {t('action.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !targetDossierId} className="min-h-11">
              {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t('form.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Brief Dialog
// =============================================================================

function BriefDialog({
  isOpen,
  onClose,
  dossier: _dossier,
  dossierContext,
  isRTL,
}: ActionDialogProps) {
  const { t } = useTranslation('dossier')
  const { generate, isGenerating, progress, error } = useGenerateBrief()

  const handleGenerate = async () => {
    try {
      await generate({
        dossierId: dossierContext.dossier_id,
        language: isRTL ? 'ar' : 'en',
      })
      toast.success(t('addToDossier.success.brief'))
      onClose()
    } catch {
      toast.error(t('addToDossier.error.brief'))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('addToDossier.dialogs.brief.title')}
          </DialogTitle>
          <DialogDescription>{t('addToDossier.dialogs.brief.description')}</DialogDescription>
        </DialogHeader>

        <DossierContextBadge dossierContext={dossierContext} isRTL={isRTL} />

        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">
              {t('addToDossier.actions.brief.description')}
            </p>
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">{progress}%</p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose} className="min-h-11">
            {t('action.cancel')}
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating} className="min-h-11">
            {isGenerating && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {t('addToDossier.actions.brief.label')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Document Dialog
// =============================================================================

function DocumentDialog({
  isOpen,
  onClose,
  dossier: _dossier,
  dossierContext,
  isRTL,
}: ActionDialogProps) {
  const { t } = useTranslation('dossier')
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [documentType, setDocumentType] = React.useState<string>('report')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const { uploadDocument, isUploading } = useUploadDocument('dossier', dossierContext.dossier_id)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setDocumentType('report')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = () => {
    if (!selectedFile) return

    uploadDocument(
      { file: selectedFile, documentType },
      {
        onSuccess: () => {
          toast.success(t('addToDossier.success.document'))
          resetForm()
          onClose()
        },
        onError: () => {
          toast.error(t('addToDossier.error.document'))
        },
      },
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('addToDossier.dialogs.document.title')}
          </DialogTitle>
          <DialogDescription>{t('addToDossier.dialogs.document.description')}</DialogDescription>
        </DialogHeader>

        <DossierContextBadge dossierContext={dossierContext} isRTL={isRTL} />

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'w-full p-8 border-2 border-dashed rounded-lg',
              'flex flex-col items-center justify-center gap-2',
              'hover:border-primary/50 hover:bg-muted/50 transition-colors',
              'cursor-pointer',
            )}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {selectedFile ? selectedFile.name : t('addToDossier.actions.document.description')}
            </p>
          </button>

          <SelectField
            id="document-type"
            label={t('addToDossier.form.documentType')}
            value={documentType}
            onChange={setDocumentType}
            options={[
              { value: 'report', label: t('addToDossier.form.documentTypes.report') },
              { value: 'memo', label: t('addToDossier.form.documentTypes.memo') },
              { value: 'briefing', label: t('addToDossier.form.documentTypes.briefing') },
              {
                value: 'correspondence',
                label: t('addToDossier.form.documentTypes.correspondence'),
              },
              { value: 'other', label: t('addToDossier.form.documentTypes.other') },
            ]}
          />
        </div>

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose} className="min-h-11">
            {t('action.cancel')}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            className="min-h-11"
          >
            {isUploading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {t('addToDossier.actions.document.label')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Main Export: AddToDossierDialogs
// =============================================================================

export function AddToDossierDialogs({
  dossier,
  dialogStates,
  onClose,
  dossierContext,
}: AddToDossierDialogsProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const commonProps = {
    dossier,
    dossierContext,
    isRTL,
  }

  return (
    <>
      <IntakeDialog
        {...commonProps}
        isOpen={dialogStates.intake}
        onClose={() => onClose('intake')}
      />
      <TaskDialog {...commonProps} isOpen={dialogStates.task} onClose={() => onClose('task')} />
      <CommitmentDialog
        {...commonProps}
        isOpen={dialogStates.commitment}
        onClose={() => onClose('commitment')}
      />
      <PositionDialog
        {...commonProps}
        isOpen={dialogStates.position}
        onClose={() => onClose('position')}
      />
      <EventDialog {...commonProps} isOpen={dialogStates.event} onClose={() => onClose('event')} />
      <RelationshipDialog
        {...commonProps}
        isOpen={dialogStates.relationship}
        onClose={() => onClose('relationship')}
      />
      <BriefDialog {...commonProps} isOpen={dialogStates.brief} onClose={() => onClose('brief')} />
      <DocumentDialog
        {...commonProps}
        isOpen={dialogStates.document}
        onClose={() => onClose('document')}
      />
    </>
  )
}
