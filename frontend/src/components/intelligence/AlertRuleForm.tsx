import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DossierSelector, type SelectedDossier } from '@/components/dossier/DossierSelector'
import { useDirection } from '@/hooks/useDirection'
import type {
  AlertChannel,
  AlertRule,
  AlertSeverityFilter,
} from '@/domains/signals/hooks/useAlertRules'
import type { DossierType } from '@/lib/dossier-type-guards'

const DOSSIER_TYPES = [
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person',
] as const

const SEVERITIES: AlertSeverityFilter[] = ['high', 'urgent']
const OPTIONAL_CHANNELS: AlertChannel[] = ['smtp', 'webhook']

const alertRuleSchema = z.object({
  dossier_id: z.string().min(1),
  dossier_type: z.enum(DOSSIER_TYPES),
  condition_type: z.literal('new_signal'),
  condition_config: z.object({
    severity_filter: z.array(z.enum(['high', 'urgent'])).optional(),
  }),
  channels: z.array(z.enum(['in_app', 'smtp', 'webhook'])).min(1),
  is_active: z.boolean(),
})

export type AlertRuleFormData = z.infer<typeof alertRuleSchema>

interface AlertRuleFormProps {
  isOpen: boolean
  initialValues?: Partial<AlertRule> | null
  onSave: (values: AlertRuleFormData) => Promise<void> | void
  onDelete?: (id: string) => Promise<void> | void
  onClose: () => void
}

function selectedDossierFromInitial(
  initialValues?: Partial<AlertRule> | null,
  fallback = '',
): SelectedDossier[] {
  if (!initialValues?.dossier_id) return []
  return [
    {
      id: initialValues.dossier_id,
      type: initialValues.dossier_type ?? 'topic',
      name_en: initialValues.dossier_name_en ?? fallback,
      name_ar: initialValues.dossier_name_ar ?? null,
    },
  ]
}

function toDefaultValues(initialValues?: Partial<AlertRule> | null): AlertRuleFormData {
  return {
    dossier_id: initialValues?.dossier_id ?? '',
    dossier_type: initialValues?.dossier_type ?? 'topic',
    condition_type: 'new_signal',
    condition_config: {
      severity_filter: initialValues?.condition_config?.severity_filter ?? [],
    },
    channels: initialValues?.channels?.includes('in_app')
      ? initialValues.channels
      : ['in_app', ...(initialValues?.channels ?? [])],
    is_active: initialValues?.is_active ?? true,
  }
}

export function AlertRuleForm({
  isOpen,
  initialValues,
  onSave,
  onDelete,
  onClose,
}: AlertRuleFormProps): React.ReactElement {
  const { t } = useTranslation('intelligence-alerts')
  const { isRTL } = useDirection()
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedDossiers, setSelectedDossiers] = useState<SelectedDossier[]>([])
  const isEdit = initialValues?.id !== undefined

  const form = useForm<AlertRuleFormData>({
    resolver: zodResolver(alertRuleSchema),
    defaultValues: toDefaultValues(initialValues),
  })

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = form

  useEffect(() => {
    if (isOpen) {
      reset(toDefaultValues(initialValues))
      setSelectedDossiers(selectedDossierFromInitial(initialValues, t('rule.untitledDossier')))
      setFormError(null)
    }
  }, [initialValues, isOpen, reset, t])

  const dossierType = watch('dossier_type')
  const dossierId = watch('dossier_id')
  const severities = watch('condition_config.severity_filter') ?? []
  const channels = watch('channels')
  const isActive = watch('is_active')

  const handleDossierTypeChange = (value: DossierType): void => {
    setValue('dossier_type', value, { shouldDirty: true })
    setValue('dossier_id', '', { shouldDirty: true, shouldValidate: true })
    setSelectedDossiers([])
  }

  const handleDossierChange = (ids: string[], dossiers: SelectedDossier[]): void => {
    const selected = dossiers[0]
    setSelectedDossiers(selected ? [selected] : [])
    setValue('dossier_id', ids[0] ?? '', { shouldDirty: true, shouldValidate: true })
    if (selected?.type && DOSSIER_TYPES.includes(selected.type as DossierType)) {
      setValue('dossier_type', selected.type as DossierType, { shouldDirty: true })
    }
  }

  const toggleSeverity = (severity: AlertSeverityFilter): void => {
    const next = severities.includes(severity)
      ? severities.filter((item) => item !== severity)
      : [...severities, severity]
    setValue('condition_config.severity_filter', next, { shouldDirty: true })
  }

  const toggleChannel = (channel: AlertChannel, checked: boolean): void => {
    const without = channels.filter((item) => item !== channel)
    const next = checked ? [...without, channel] : without
    setValue('channels', next.includes('in_app') ? next : ['in_app', ...next], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const submit = async (values: AlertRuleFormData): Promise<void> => {
    setFormError(null)
    try {
      await onSave({
        ...values,
        channels: values.channels.includes('in_app')
          ? values.channels
          : ['in_app', ...values.channels],
      })
      onClose()
    } catch {
      setFormError(t('error.save'))
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (!initialValues?.id || !onDelete) return
    try {
      await onDelete(initialValues.id)
      setConfirmDeleteOpen(false)
      onClose()
    } catch {
      setFormError(t('error.save'))
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-none rounded-none ps-4 pe-4 sm:rounded-none sm:ps-6 sm:pe-6"
          style={{
            width: 'min(100vw, 480px)',
            height: '100dvh',
            insetInlineEnd: 0,
            insetInlineStart: 'auto',
            insetBlockStart: 0,
            insetBlockEnd: 0,
            transform: 'none',
            boxShadow: 'var(--shadow-lg)',
          }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <DialogHeader>
            <DialogTitle className="text-start [font-size:var(--t-card-title)]">
              {isEdit ? t('action.edit') : t('action.add')}
            </DialogTitle>
            <DialogDescription className="text-start text-sm text-ink-mute">
              {t('form.condition')}
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-5 pt-4 pb-4"
            onSubmit={(event) => void handleSubmit(submit)(event)}
          >
            <div className="space-y-2">
              <Label
                htmlFor="alert-dossier-type"
                className="block text-start text-xs uppercase text-ink-mute"
              >
                {t('form.dossier')}
              </Label>
              <select
                id="alert-dossier-type"
                value={dossierType}
                onChange={(event) => handleDossierTypeChange(event.target.value as DossierType)}
                className="id-select-trigger flex w-full rounded-sm border border-line bg-surface ps-3 pe-3 pt-2 pb-2 text-sm text-ink outline-none focus-visible:border-[var(--accent)]"
              >
                {DOSSIER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <DossierSelector
                value={dossierId ? [dossierId] : []}
                selectedDossiers={selectedDossiers}
                onChange={handleDossierChange}
                types={[dossierType]}
                required
                multiple={false}
                error={errors.dossier_id ? t('form.dossierRequired') : undefined}
              />
            </div>

            <div className="space-y-2">
              <Label className="block text-start text-xs uppercase text-ink-mute">
                {t('form.condition')}
              </Label>
              <span className="inline-flex rounded-full bg-[var(--info-soft)] ps-2 pe-2 pt-1 pb-1 font-mono text-xs uppercase text-[var(--info)]">
                {t('chip.newSignal')}
              </span>
            </div>

            <div className="space-y-2">
              <Label className="block text-start text-xs uppercase text-ink-mute">
                {t('form.severityFilter')}
              </Label>
              <div className="flex flex-wrap gap-2">
                {SEVERITIES.map((severity) => (
                  <button
                    key={severity}
                    type="button"
                    onClick={() => toggleSeverity(severity)}
                    className={[
                      'rounded-sm border ps-3 pe-3 pt-2 pb-2 text-sm transition-colors',
                      severities.includes(severity)
                        ? 'border-[var(--accent)] bg-accent-soft text-accent-ink'
                        : 'border-line bg-surface text-ink-mute hover:bg-line-soft',
                    ].join(' ')}
                  >
                    {t(`severity.${severity}`)}
                  </button>
                ))}
              </div>
              <p className="text-start text-sm text-ink-mute">{t('form.severityHelper')}</p>
            </div>

            <div className="space-y-3">
              <Label className="block text-start text-xs uppercase text-ink-mute">
                {t('form.channels')}
              </Label>
              <label className="flex items-start gap-2">
                <Checkbox checked disabled aria-label={t('channel.in_app')} />
                <span className="pt-2 text-start">
                  <span className="block text-sm text-ink">{t('channel.in_app')}</span>
                  <span className="block text-xs text-ink-mute">{t('form.channelDesc.inApp')}</span>
                </span>
              </label>
              {OPTIONAL_CHANNELS.map((channel) => (
                <label key={channel} className="flex items-start gap-2">
                  <Checkbox
                    checked={channels.includes(channel)}
                    onCheckedChange={(checked) => toggleChannel(channel, checked === true)}
                    aria-label={t(`channel.${channel}`)}
                  />
                  <span className="pt-2 text-start">
                    <span className="block text-sm text-ink">{t(`channel.${channel}`)}</span>
                    <span className="block text-xs text-ink-mute">
                      {channel === 'smtp'
                        ? t('form.channelDesc.smtp')
                        : t('form.channelDesc.webhook')}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-sm border border-line bg-bg ps-3 pe-3 pt-3 pb-3">
              <Label htmlFor="alert-active" className="text-start text-sm text-ink">
                {t('form.active')}
              </Label>
              <Switch
                id="alert-active"
                checked={isActive}
                onCheckedChange={(checked) => setValue('is_active', checked, { shouldDirty: true })}
              />
            </div>

            {(formError || errors.dossier_id) && (
              <p className="text-start text-sm text-danger">
                {formError ?? t('form.dossierRequired')}
              </p>
            )}
          </form>

          <DialogFooter className="mt-auto justify-between">
            {isEdit && initialValues?.id && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                className="text-danger sm:me-auto"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                {t('action.delete')}
              </Button>
            ) : (
              <span aria-hidden="true" />
            )}
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t('action.cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmit(submit)()}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin me-2" aria-hidden="true" />}
              {isEdit ? t('action.save') : t('action.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-start">
              {t('confirm.delete.heading')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-start">
              {t('confirm.delete.body')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('confirm.delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-danger text-[var(--danger-fg)] hover:bg-danger"
            >
              {t('confirm.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
