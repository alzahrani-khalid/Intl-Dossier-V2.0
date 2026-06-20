/**
 * CaptureSignalForm — drawer to capture a new signal (Phase 69, Wave 3).
 *
 * Right-side drawer (max-width 480px, var(--shadow-lg)) built on the Dialog primitive,
 * mirroring EscalationDialog.tsx's shell + footer pattern. Six fields with inline
 * (not toast) validation. Links to one or more dossiers via DossierSelector, building
 * the dossier_id→type map that useCreateSignal needs for the junction CHECK.
 *
 * @module components/signals/CaptureSignalForm
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DossierSelector, type SelectedDossier } from '@/components/dossier/DossierSelector'
import { useDirection } from '@/hooks/useDirection'
import { useCreateSignal, type SignalSeverity, type SignalCategory } from '@/domains/signals'

const SEVERITY_VALUES: SignalSeverity[] = ['low', 'medium', 'high', 'urgent']
const CATEGORY_VALUES: SignalCategory[] = [
  'political',
  'economic',
  'security',
  'diplomatic',
  'other',
]
const SENSITIVITY_VALUES = [1, 2, 3, 4]

interface CaptureSignalFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (signalId: string) => void
  defaultDossierId?: string
}

const selectClasses =
  'id-select-trigger flex w-full items-center justify-between rounded-sm border border-[var(--line)] bg-[var(--surface)] ps-3 pe-3 py-2 text-[13px] text-[var(--ink)] outline-none focus-visible:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50'

export function CaptureSignalForm({
  isOpen,
  onClose,
  onSuccess,
}: CaptureSignalFormProps): React.ReactElement {
  const { t } = useTranslation('intelligence-signals')
  const { isRTL } = useDirection()
  const createSignal = useCreateSignal()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [severity, setSeverity] = useState<SignalSeverity>('medium')
  const [category, setCategory] = useState<SignalCategory>('political')
  const [sensitivityLevel, setSensitivityLevel] = useState(1)
  const [dossierIds, setDossierIds] = useState<string[]>([])
  const [dossierTypes, setDossierTypes] = useState<Record<string, string>>({})
  const [titleError, setTitleError] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const isLoading = createSignal.isPending

  const handleDossierChange = (ids: string[], dossiers: SelectedDossier[]): void => {
    setDossierIds(ids)
    setDossierTypes(
      dossiers.reduce<Record<string, string>>((acc, d) => {
        acc[d.id] = d.type
        return acc
      }, {}),
    )
  }

  const handleSubmit = (): void => {
    setFormError(null)
    if (!title.trim()) {
      setTitleError(true)
      return
    }
    setTitleError(false)

    createSignal.mutate(
      {
        title: title.trim(),
        body: body.trim(),
        severity,
        category,
        sensitivityLevel,
        dossierIds,
        dossierTypes,
      },
      {
        onSuccess: (result) => {
          onSuccess?.(result.id)
          onClose()
        },
        onError: (error: Error) => {
          setFormError(error.message)
        },
      },
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="ps-4 pe-4 sm:ps-6 sm:pe-6 max-w-[480px]"
        style={{ boxShadow: 'var(--shadow-lg)' }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="text-start [font-size:var(--t-card-title)]">
            {t('dialog.captureTitle')}
          </DialogTitle>
          <DialogDescription className="text-start text-sm text-ink-mute">
            {t('queue.emptyState.body')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {formError !== null && (
            <div role="alert" className="rounded-sm bg-[var(--danger-soft)] ps-3 pe-3 py-2">
              <p className="text-xs text-danger text-start">{formError}</p>
            </div>
          )}

          {/* Title (required) */}
          <div className="space-y-1">
            <Label htmlFor="signal-title" className="text-start">
              {t('form.titleLabel')}
            </Label>
            <Input
              id="signal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('form.titlePlaceholder')}
              aria-required="true"
              disabled={isLoading}
            />
            {titleError && (
              <p className="text-xs text-danger mt-1 text-start">{t('form.titleLabel')}</p>
            )}
          </div>

          {/* Body (optional) */}
          <div className="space-y-1">
            <Label htmlFor="signal-body" className="text-start">
              {t('form.bodyLabel')}
            </Label>
            <Textarea
              id="signal-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('form.bodyPlaceholder')}
              className="min-h-20 resize-none text-start"
              disabled={isLoading}
            />
          </div>

          {/* Severity (required) */}
          <div className="space-y-1">
            <Label htmlFor="signal-severity" className="text-start">
              {t('form.severityLabel')}
            </Label>
            <select
              id="signal-severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as SignalSeverity)}
              aria-required="true"
              disabled={isLoading}
              className={selectClasses}
            >
              {SEVERITY_VALUES.map((value) => (
                <option key={value} value={value}>
                  {t(`severity.${value}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Category (required) */}
          <div className="space-y-1">
            <Label htmlFor="signal-category" className="text-start">
              {t('form.categoryLabel')}
            </Label>
            <select
              id="signal-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as SignalCategory)}
              aria-required="true"
              disabled={isLoading}
              className={selectClasses}
            >
              {CATEGORY_VALUES.map((value) => (
                <option key={value} value={value}>
                  {t(`category.${value}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Sensitivity level (required) — integers only, no clearance labels */}
          <div className="space-y-1">
            <Label htmlFor="signal-sensitivity" className="text-start">
              {t('form.sensitivityLabel')}
            </Label>
            <select
              id="signal-sensitivity"
              value={sensitivityLevel}
              onChange={(e) => setSensitivityLevel(Number(e.target.value))}
              aria-required="true"
              disabled={isLoading}
              className={selectClasses}
            >
              {SENSITIVITY_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          {/* Linked dossiers (optional) */}
          <div className="space-y-1">
            <DossierSelector
              value={dossierIds}
              onChange={handleDossierChange}
              multiple
              required={false}
              label={t('form.dossiersLabel')}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="h-11 min-w-11 ps-4 pe-4 w-full sm:w-auto"
          >
            {t('dialog.discardSignal')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !title.trim()}
            className="h-11 min-w-11 ps-4 pe-4 w-full sm:w-auto"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
            {t('actions.capture')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
