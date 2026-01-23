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
        <p className="text-xs text-muted-foreground">{t('addToDossier.contextBadge.linkedTo')}</p>
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

// =============================================================================
// Intake Dialog
// =============================================================================

function IntakeDialog({ isOpen, onClose, dossier, dossierContext, isRTL }: ActionDialogProps) {
  const { t } = useTranslation('dossier')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // TODO: Integrate with intake service
      // await createIntakeWithDossierContext({
      //   title,
      //   description,
      //   dossierContext,
      // });
      console.log('Creating intake:', { title, description, dossierContext })
      onClose()
    } catch (error) {
      console.error('Failed to create intake:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            {t('addToDossier.dialog.intake.title')}
          </DialogTitle>
          <DialogDescription>
            {t('addToDossier.dialog.intake.subtitle', {
              name: isRTL ? dossier.name_ar : dossier.name_en,
            })}
          </DialogDescription>
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

function TaskDialog({ isOpen, onClose, dossier, dossierContext, isRTL }: ActionDialogProps) {
  const { t } = useTranslation('dossier')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // TODO: Integrate with task service
      console.log('Creating task:', { title, description, dossierContext })
      onClose()
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            {t('addToDossier.dialog.task.title')}
          </DialogTitle>
          <DialogDescription>
            {t('addToDossier.dialog.task.subtitle', {
              name: isRTL ? dossier.name_ar : dossier.name_en,
            })}
          </DialogDescription>
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

function CommitmentDialog({ isOpen, onClose, dossier, dossierContext, isRTL }: ActionDialogProps) {
  const { t } = useTranslation('dossier')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // TODO: Integrate with commitment service
      console.log('Creating commitment:', { title, description, dossierContext })
      onClose()
    } catch (error) {
      console.error('Failed to create commitment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5" />
            {t('addToDossier.dialog.commitment.title')}
          </DialogTitle>
          <DialogDescription>
            {t('addToDossier.dialog.commitment.subtitle', {
              name: isRTL ? dossier.name_ar : dossier.name_en,
            })}
          </DialogDescription>
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
// Position Dialog
// =============================================================================

function PositionDialog({ isOpen, onClose, dossier, dossierContext, isRTL }: ActionDialogProps) {
  const { t } = useTranslation('dossier')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [content, setContent] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // TODO: Integrate with position service
      console.log('Creating position:', { title, content, dossierContext })
      onClose()
    } catch (error) {
      console.error('Failed to create position:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('addToDossier.dialog.position.title')}
          </DialogTitle>
          <DialogDescription>
            {t('addToDossier.dialog.position.subtitle', {
              name: isRTL ? dossier.name_ar : dossier.name_en,
            })}
          </DialogDescription>
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

function EventDialog({ isOpen, onClose, dossier, dossierContext, isRTL }: ActionDialogProps) {
  const { t } = useTranslation('dossier')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [date, setDate] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // TODO: Integrate with calendar service
      console.log('Scheduling event:', { title, date, dossierContext })
      onClose()
    } catch (error) {
      console.error('Failed to schedule event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('addToDossier.dialog.event.title')}
          </DialogTitle>
          <DialogDescription>
            {t('addToDossier.dialog.event.subtitle', {
              name: isRTL ? dossier.name_ar : dossier.name_en,
            })}
          </DialogDescription>
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
  dossier,
  dossierContext,
  isRTL,
}: ActionDialogProps) {
  const { t } = useTranslation('dossier')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // TODO: Integrate with relationship service
      console.log('Adding relationship:', { dossierContext })
      onClose()
    } catch (error) {
      console.error('Failed to add relationship:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {t('addToDossier.dialog.relationship.title')}
          </DialogTitle>
          <DialogDescription>
            {t('addToDossier.dialog.relationship.subtitle', {
              name: isRTL ? dossier.name_ar : dossier.name_en,
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DossierContextBadge dossierContext={dossierContext} isRTL={isRTL} />

          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">
                {/* TODO: Add dossier search/selector component */}
                Dossier selector component will be added here
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="min-h-11">
              {t('action.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-h-11">
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

function BriefDialog({ isOpen, onClose, dossier, dossierContext, isRTL }: ActionDialogProps) {
  const { t } = useTranslation('dossier')
  const [isGenerating, setIsGenerating] = React.useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      // TODO: Integrate with brief generation service
      console.log('Generating brief:', { dossierContext })
      onClose()
    } catch (error) {
      console.error('Failed to generate brief:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('addToDossier.dialog.brief.title')}
          </DialogTitle>
          <DialogDescription>
            {t('addToDossier.dialog.brief.subtitle', {
              name: isRTL ? dossier.name_ar : dossier.name_en,
            })}
          </DialogDescription>
        </DialogHeader>

        <DossierContextBadge dossierContext={dossierContext} isRTL={isRTL} />

        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">
              {t('addToDossier.actions.brief.description')}
            </p>
          </div>
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

function DocumentDialog({ isOpen, onClose, dossier, dossierContext, isRTL }: ActionDialogProps) {
  const { t } = useTranslation('dossier')
  const [isUploading, setIsUploading] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      // TODO: Integrate with document upload service
      console.log('Uploading document:', { file: selectedFile, dossierContext })
      onClose()
    } catch (error) {
      console.error('Failed to upload document:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('addToDossier.dialog.document.title')}
          </DialogTitle>
          <DialogDescription>
            {t('addToDossier.dialog.document.subtitle', {
              name: isRTL ? dossier.name_ar : dossier.name_en,
            })}
          </DialogDescription>
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
