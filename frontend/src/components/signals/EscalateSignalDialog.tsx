/**
 * EscalateSignalDialog — compact escalate dialog (Phase 69, Wave 4, D-10).
 *
 * Mirrors waiting-queue/EscalationDialog.tsx (RTL shell, logical spacing,
 * h-11 touch targets, flex-col-reverse footer) but is purpose-built for signals:
 * pre-filled from the signal (title/body → task, priority = signal.severity 1:1),
 * an assignee field (required by tasks-create), and an optional deadline. It is NOT
 * the full task-create form and NOT one-click (D-10).
 *
 * On confirm it calls useSignalEscalate (the 3-step hook): tasks-create →
 * work-item-dossiers (copies the signal's dossier links) → intelligence_event
 * UPDATE (status='escalated'). The hook's Step 3 already flips the status, so the
 * success handler only closes the dialog and toasts — no redundant updateStatus.
 *
 * @module components/signals/EscalateSignalDialog
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUp, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { useDirection } from '@/hooks/useDirection'
import { useAuth } from '@/contexts/auth.context'
import { useSignalEscalate, type Signal, type SignalSeverity } from '@/domains/signals'

interface EscalateSignalDialogProps {
  /** The signal being escalated — pre-fill source. Null when closed. */
  signal: Signal | null
  /** Dossier UUIDs linked to the signal — copied onto the new task (D-11). */
  dossierIds?: string[]
  /** Whether the dialog is open. */
  isOpen: boolean
  /** Callback when the dialog closes (cancel or after success). */
  onClose: () => void
  /** Callback after a successful escalation. */
  onSuccess?: () => void
}

const SEVERITY_VALUES: SignalSeverity[] = ['low', 'medium', 'high', 'urgent']
const BODY_MAX = 500

export function EscalateSignalDialog({
  signal,
  dossierIds,
  isOpen,
  onClose,
  onSuccess,
}: EscalateSignalDialogProps): React.ReactElement {
  const { t } = useTranslation('intelligence-signals')
  const { isRTL } = useDirection()
  const { toast } = useToast()
  const { user } = useAuth()

  const signalEscalate = useSignalEscalate()
  const isLoading = signalEscalate.isPending

  // Pre-filled, editable form state (D-10 field pre-fill map).
  const [title, setTitle] = useState<string>(signal?.title ?? '')
  const [body, setBody] = useState<string>(signal?.content ?? '')
  const [priority, setPriority] = useState<SignalSeverity>(signal?.severity ?? 'medium')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [slaDeadline, setSlaDeadline] = useState<string>('')

  // Reset the form whenever the source signal changes (re-open on a different row).
  useEffect(() => {
    if (signal) {
      setTitle(signal.title)
      setBody(signal.content)
      setPriority(signal.severity)
      setAssigneeId('')
      setSlaDeadline('')
    }
  }, [signal])

  const handleEscalate = async (): Promise<void> => {
    if (!signal || !title.trim()) return

    // tasks-create requires assignee_id; fall back to the current user when empty
    // (the field shows an inline warning but does not block — see render below).
    const effectiveAssigneeId = assigneeId.trim() || user?.id || ''

    try {
      await signalEscalate.mutateAsync({
        signalId: signal.id,
        title: title.trim(),
        body: body.trim(),
        priority,
        assigneeId: effectiveAssigneeId || undefined,
        slaDeadline: slaDeadline || undefined,
        dossierIds: dossierIds ?? [],
      })

      toast({ title: t('toast.escalateSuccess'), variant: 'success' })
      onSuccess?.()
      onClose()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('queue.errorState')
      toast({ title: message, variant: 'destructive' })
    }
  }

  const assigneeMissing = assigneeId.trim() === '' && (user?.id ?? '') === ''

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="ps-4 pe-4 sm:ps-6 sm:pe-6 max-w-md sm:max-w-lg"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 [font-size:var(--t-card-title)]">
            <ArrowUp className={`h-5 w-5 text-accent ${isRTL ? 'rotate-180' : ''}`} />
            {t('dialog.escalateTitle')}
          </DialogTitle>
          <DialogDescription className="text-sm text-start text-ink-mute">
            {t('dialog.escalateDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title (pre-filled, editable, required) */}
          <div className="space-y-2">
            <Label htmlFor="escalate-title" className="text-start block">
              {t('form.titleLabel')}
            </Label>
            <Input
              id="escalate-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-start"
              disabled={isLoading}
              aria-required="true"
              aria-label={t('form.titleLabel')}
            />
          </div>

          {/* Body (pre-filled, editable, 500-char limit) */}
          <div className="space-y-2">
            <Label htmlFor="escalate-body" className="text-start block">
              {t('form.bodyLabel')}
            </Label>
            <Textarea
              id="escalate-body"
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
              className="min-h-24 text-start resize-none"
              maxLength={BODY_MAX}
              disabled={isLoading}
              aria-label={t('form.bodyLabel')}
            />
            <div className="flex justify-end">
              <span className="[font-size:var(--t-meta)] text-ink-mute">
                {body.length}/{BODY_MAX}
              </span>
            </div>
          </div>

          {/* Priority (pre-filled from signal.severity, 1:1 map) */}
          <div className="space-y-2">
            <Label htmlFor="escalate-priority" className="text-start block">
              {t('form.severityLabel')}
            </Label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as SignalSeverity)}
              disabled={isLoading}
            >
              <SelectTrigger id="escalate-priority" className="text-start">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`severity.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee (optional input; tasks-create requires one — falls back to self) */}
          <div className="space-y-2">
            <Label htmlFor="escalate-assignee" className="text-start block">
              {t('form.assigneeLabel')}
            </Label>
            <Input
              id="escalate-assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              placeholder={t('form.assigneePlaceholder')}
              className="text-start"
              disabled={isLoading}
              aria-label={t('form.assigneeLabel')}
            />
            {assigneeMissing && (
              <p className="[font-size:var(--t-meta)] text-warning text-start">
                {t('form.assigneeRequired')}
              </p>
            )}
          </div>

          {/* Deadline (optional) */}
          <div className="space-y-2">
            <Label htmlFor="escalate-deadline" className="text-start block">
              {t('form.deadlineLabel')}
            </Label>
            <Input
              id="escalate-deadline"
              type="date"
              value={slaDeadline}
              onChange={(e) => setSlaDeadline(e.target.value)}
              className="text-start"
              disabled={isLoading}
              aria-label={t('form.deadlineLabel')}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="h-11 min-w-11 ps-4 pe-4 sm:ps-6 sm:pe-6 w-full sm:w-auto"
            aria-label={t('dialog.cancelEscalation')}
          >
            {t('dialog.cancelEscalation')}
          </Button>
          <Button
            type="button"
            onClick={() => void handleEscalate()}
            disabled={isLoading || !title.trim()}
            className="h-11 min-w-11 ps-4 pe-4 sm:ps-6 sm:pe-6 w-full sm:w-auto"
            aria-label={t('actions.escalate')}
          >
            {isLoading ? (
              <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ms-2' : 'me-2'}`} />
            ) : (
              <ArrowUp className={`h-4 w-4 ${isRTL ? 'ms-2 rotate-180' : 'me-2'}`} />
            )}
            {t('actions.escalate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
