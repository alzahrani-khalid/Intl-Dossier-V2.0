import { useState, useEffect, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HeroUIChip } from '@/components/ui/heroui-chip'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save, Send, Loader2, AlertCircle, Shield, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DecisionList, type Decision } from '../decision-list/DecisionList'
import { CommitmentEditor, type Commitment } from '../commitment-editor/CommitmentEditor'
import { RiskList, type Risk } from '../risk-list/RiskList'
import { FollowUpList } from '../follow-up-list/FollowUpList'
import { AttachmentUploader } from '../attachment-uploader/AttachmentUploader'
import { AIExtractionButton } from '../ai-extraction-button/AIExtractionButton'
import { useToast } from '@/hooks/useToast'

interface FollowUpAction {
  id?: string
  description: string
  assigned_to?: string
  target_date?: Date
  completed: boolean
}

export interface AfterActionFormData {
  id?: string
  engagement_id: string
  dossier_id: string
  is_confidential: boolean
  attendees: string[]
  decisions: Decision[]
  commitments: Commitment[]
  risks: Risk[]
  follow_ups: FollowUpAction[]
  notes?: string
  version?: number
}

interface AfterActionFormProps {
  initialData?: Partial<AfterActionFormData>
  engagementId: string
  dossierId: string
  onSave: (data: AfterActionFormData, isDraft: boolean) => Promise<void>
  onPublish?: (data: AfterActionFormData) => Promise<void>
  readOnly?: boolean
  canPublish?: boolean
  availableUsers?: Array<{ id: string; name: string }>
  className?: string
  /** Notified whenever the form's unsaved-changes (dirty) state changes. */
  onDirtyChange?: (dirty: boolean) => void
}

export function AfterActionForm({
  initialData,
  engagementId,
  dossierId,
  onSave,
  onPublish,
  readOnly = false,
  canPublish = false,
  availableUsers = [],
  className,
  onDirtyChange,
}: AfterActionFormProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  // Form state
  const [formData, setFormData] = useState<AfterActionFormData>({
    engagement_id: engagementId,
    dossier_id: dossierId,
    is_confidential: initialData?.is_confidential || false,
    attendees: initialData?.attendees || [],
    decisions: initialData?.decisions || [],
    commitments: initialData?.commitments || [],
    risks: initialData?.risks || [],
    follow_ups: initialData?.follow_ups || [],
    notes: initialData?.notes || '',
    version: initialData?.version,
    ...(initialData?.id && { id: initialData.id }),
  })

  // attendeesInput holds only the in-progress name; committed attendees live in
  // formData.attendees (string[]). Typing a name and pressing Enter/comma (or
  // blurring) commits it as a removable chip.
  const [attendeesInput, setAttendeesInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const addAttendee = (raw: string): void => {
    const name = raw.trim()
    if (name.length === 0) return
    setFormData((prev) => {
      const isDuplicate = prev.attendees.some((a) => a.toLowerCase() === name.toLowerCase())
      if (isDuplicate || prev.attendees.length >= 100) return prev
      return { ...prev, attendees: [...prev.attendees, name] }
    })
    setAttendeesInput('')
  }

  const removeAttendee = (index: number): void => {
    setFormData((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((_, i) => i !== index),
    }))
  }

  const handleAttendeeKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addAttendee(attendeesInput)
    } else if (
      e.key === 'Backspace' &&
      attendeesInput.length === 0 &&
      formData.attendees.length > 0
    ) {
      // Backspace on an empty input removes the last chip (standard tag-input affordance).
      removeAttendee(formData.attendees.length - 1)
    }
  }

  // Mark form as dirty when changes occur
  useEffect(() => {
    if (!initialData) return
    setIsDirty(true)
  }, [formData, initialData])

  // Surface an unsaved-changes signal to the parent. Unlike the edit-mode
  // `isDirty` above (which gates the save button), this reflects whether the
  // form currently holds any user-entered content, so create-mode pages can
  // warn before navigation/unload.
  useEffect(() => {
    if (!onDirtyChange) return
    const hasContent =
      formData.attendees.length > 0 ||
      attendeesInput.trim().length > 0 ||
      (formData.notes ?? '').trim().length > 0 ||
      formData.decisions.length > 0 ||
      formData.commitments.length > 0 ||
      formData.risks.length > 0 ||
      formData.follow_ups.length > 0
    onDirtyChange(hasContent)
  }, [
    formData.attendees,
    attendeesInput,
    formData.notes,
    formData.decisions,
    formData.commitments,
    formData.risks,
    formData.follow_ups,
    onDirtyChange,
  ])

  const handleSaveDraft = async () => {
    setSaving(true)
    setError(null)

    try {
      await onSave(formData, true)
      setIsDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('afterActions.form.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!onPublish) return

    // Validate form
    if (formData.attendees.length === 0) {
      setError(t('afterActions.form.attendeesRequired'))
      return
    }

    if (formData.attendees.length > 100) {
      setError(t('afterActions.form.attendeesMax'))
      return
    }

    setPublishing(true)
    setError(null)

    try {
      await onPublish(formData)
      setIsDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('afterActions.form.publishFailed'))
    } finally {
      setPublishing(false)
    }
  }

  // Stable identity for an extracted/existing row: prefer its id, otherwise a
  // normalized (lowercased, whitespace-collapsed) description so re-extractions
  // of the same source do not duplicate semantically identical rows.
  const rowKey = (row: { id?: string; description?: string }): string => {
    if (row.id != null && row.id !== '') return `id:${row.id}`
    return `desc:${(row.description ?? '').trim().toLowerCase().replace(/\s+/g, ' ')}`
  }

  // Append only rows whose key is not already present (in existing rows or
  // earlier in this same batch). Returns the merged list plus add/skip counts.
  const mergeUnique = <T extends { id?: string; description?: string }>(
    existing: T[],
    incoming: T[],
  ): { merged: T[]; added: number; skipped: number } => {
    const seen = new Set(existing.map(rowKey))
    const merged = [...existing]
    let added = 0
    let skipped = 0
    for (const row of incoming) {
      const key = rowKey(row)
      if (seen.has(key)) {
        skipped += 1
        continue
      }
      seen.add(key)
      merged.push(row)
      added += 1
    }
    return { merged, added, skipped }
  }

  const handleAIExtraction = (extractedData: {
    decisions?: Decision[]
    commitments?: Commitment[]
    risks?: Risk[]
    follow_ups?: FollowUpAction[]
  }): void => {
    const newDecisions = extractedData.decisions?.filter((d) => (d.ai_confidence || 0) >= 0.5) ?? []
    const newCommitments =
      extractedData.commitments?.filter((c) => (c.ai_confidence || 0) >= 0.5) ?? []
    const newRisks = extractedData.risks?.filter((r) => (r.ai_confidence || 0) >= 0.5) ?? []
    const newFollowUps = extractedData.follow_ups ?? []

    let totalAdded = 0
    let totalSkipped = 0

    setFormData((prev) => {
      const decisions = mergeUnique(prev.decisions, newDecisions)
      const commitments = mergeUnique(prev.commitments, newCommitments)
      const risks = mergeUnique(prev.risks, newRisks)
      const followUps = mergeUnique(prev.follow_ups, newFollowUps)

      totalAdded = decisions.added + commitments.added + risks.added + followUps.added
      totalSkipped = decisions.skipped + commitments.skipped + risks.skipped + followUps.skipped

      return {
        ...prev,
        decisions: decisions.merged,
        commitments: commitments.merged,
        risks: risks.merged,
        follow_ups: followUps.merged,
      }
    })

    toast({
      title: t('afterActions.ai.extractionSummary', {
        added: totalAdded,
        skipped: totalSkipped,
      }),
      variant: totalAdded > 0 ? 'success' : 'default',
    })
  }

  const isFormValid = () => {
    return (
      formData.attendees.length > 0 &&
      formData.attendees.length <= 100 &&
      (formData.decisions.length > 0 ||
        formData.commitments.length > 0 ||
        formData.risks.length > 0 ||
        formData.follow_ups.length > 0)
    )
  }

  return (
    <form
      className={cn('space-y-6', className)}
      onSubmit={(e) => {
        e.preventDefault()
        handleSaveDraft()
      }}
    >
      {/* Header with AI Extraction */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {t('afterActions.form.title')}
              {formData.is_confidential && <Shield className="size-5 text-warning" />}
            </CardTitle>
            {!readOnly && <AIExtractionButton onExtract={handleAIExtraction as any} />}
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('afterActions.form.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Attendees */}
          <div className="space-y-2">
            <Label htmlFor="attendees">{t('afterActions.form.attendees')} *</Label>
            {formData.attendees.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label={t('afterActions.form.attendees')}>
                {formData.attendees.map((name, index) => (
                  <li key={`${name}-${index}`}>
                    <HeroUIChip
                      variant="secondary"
                      className="inline-flex items-center gap-1 ps-2.5 pe-1 py-1"
                    >
                      <span className="truncate">{name}</span>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => removeAttendee(index)}
                          aria-label={t('afterActions.form.removeAttendee', { name })}
                          className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </HeroUIChip>
                  </li>
                ))}
              </ul>
            )}
            <Input
              id="attendees"
              type="text"
              value={attendeesInput}
              onChange={(e) => setAttendeesInput(e.target.value)}
              onKeyDown={handleAttendeeKeyDown}
              onBlur={() => addAttendee(attendeesInput)}
              placeholder={t('afterActions.form.attendeesPlaceholder')}
              disabled={readOnly}
              aria-required="true"
              aria-describedby="attendees-help"
            />
            <p id="attendees-help" className="text-xs text-muted-foreground">
              {t('afterActions.form.attendeesHelp')} ({formData.attendees.length}/100)
            </p>
          </div>

          {/* Confidential Flag */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="confidential"
              checked={formData.is_confidential}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_confidential: !!checked }))
              }
              disabled={readOnly}
            />
            <Label
              htmlFor="confidential"
              className="flex cursor-pointer items-center gap-2 text-sm font-normal"
            >
              {formData.is_confidential && <Shield className="size-4 text-warning" />}
              {t('afterActions.form.confidential')}
            </Label>
          </div>
          {formData.is_confidential && (
            <Alert className="border-warning">
              <Shield className="size-4 text-warning" />
              <AlertDescription className="text-warning">
                {t('afterActions.form.confidentialWarning')}
              </AlertDescription>
            </Alert>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('afterActions.form.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder={t('afterActions.form.notesPlaceholder')}
              rows={4}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Decisions */}
      <DecisionList
        decisions={formData.decisions}
        onChange={(decisions) => setFormData((prev) => ({ ...prev, decisions }))}
        readOnly={readOnly}
      />

      <Separator />

      {/* Commitments */}
      <CommitmentEditor
        commitments={formData.commitments}
        onChange={(commitments) => setFormData((prev) => ({ ...prev, commitments }))}
        readOnly={readOnly}
        availableUsers={availableUsers}
      />

      <Separator />

      {/* Risks */}
      <RiskList
        risks={formData.risks}
        onChange={(risks) => setFormData((prev) => ({ ...prev, risks }))}
        readOnly={readOnly}
      />

      <Separator />

      {/* Follow-up Actions */}
      <FollowUpList
        followUpActions={formData.follow_ups}
        onChange={(follow_ups) => setFormData((prev) => ({ ...prev, follow_ups }))}
        readOnly={readOnly}
      />

      <Separator />

      {/* Attachments */}
      <AttachmentUploader
        attachmentIds={[]}
        onChange={() => {}}
        maxFiles={10}
        maxFileSize={100 * 1024 * 1024} // 100MB
      />

      {/* Action Buttons */}
      {!readOnly && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={saving || publishing || !isDirty}
                className="flex-1"
                variant="outline"
              >
                {saving ? (
                  <>
                    <Loader2 className="me-2 size-4 animate-spin" />
                    {t('afterActions.form.saving')}
                  </>
                ) : (
                  <>
                    <Save className="me-2 size-4" />
                    {t('afterActions.form.saveDraft')}
                  </>
                )}
              </Button>

              {canPublish && onPublish && (
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={saving || publishing || !isFormValid()}
                  className="flex-1"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="me-2 size-4 animate-spin" />
                      {t('afterActions.form.publishing')}
                    </>
                  ) : (
                    <>
                      <Send className="me-2 size-4" />
                      {t('afterActions.form.publish')}
                    </>
                  )}
                </Button>
              )}
            </div>

            {!isFormValid() && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {t('afterActions.form.publishRequirements')}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </form>
  )
}
