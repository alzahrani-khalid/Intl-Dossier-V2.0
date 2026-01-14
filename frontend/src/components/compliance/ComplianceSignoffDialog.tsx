/**
 * ComplianceSignoffDialog Component
 * Feature: compliance-rules-management
 *
 * Modal dialog for signing off on compliance violations.
 * Supports approve, reject, escalate, and waive actions.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Check, X, AlertTriangle, ArrowUpRight, FileX, Calendar, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type {
  ComplianceViolation,
  SignoffAction,
  SignoffViolationInput,
} from '@/types/compliance.types'
import { SEVERITY_COLORS, SIGNOFF_ACTION_LABELS } from '@/types/compliance.types'
import { useSignoffViolation } from '@/hooks/useComplianceRules'
import { toast } from 'sonner'

interface ComplianceSignoffDialogProps {
  violation: ComplianceViolation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface SignoffFormData {
  action: SignoffAction
  justification: string
  conditions: string
  waiver_valid_until: string
}

const ACTION_ICONS: Record<SignoffAction, typeof Check> = {
  approve: Check,
  reject: X,
  request_info: AlertTriangle,
  escalate: ArrowUpRight,
  waive: FileX,
}

export function ComplianceSignoffDialog({
  violation,
  open,
  onOpenChange,
  onSuccess,
}: ComplianceSignoffDialogProps) {
  const { t, i18n } = useTranslation('compliance')
  const isRTL = i18n.language === 'ar'

  const signoffMutation = useSignoffViolation()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<SignoffFormData>({
    defaultValues: {
      action: 'approve',
      justification: '',
      conditions: '',
      waiver_valid_until: '',
    },
  })

  const selectedAction = watch('action')

  const onSubmit = async (data: SignoffFormData) => {
    if (!violation) return

    const input: SignoffViolationInput = {
      violation_id: violation.id,
      action: data.action,
      justification: data.justification,
      conditions: data.conditions ? data.conditions.split('\n').filter((c) => c.trim()) : undefined,
      waiver_valid_until:
        data.action === 'waive' && data.waiver_valid_until
          ? new Date(data.waiver_valid_until).toISOString()
          : undefined,
    }

    try {
      await signoffMutation.mutateAsync(input)
      toast.success(t('messages.signoffSuccess'))
      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(t('messages.signoffFailed'))
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  if (!violation) return null

  const severityColors = SEVERITY_COLORS[violation.severity]

  const getRuleName = () => {
    if (violation.rule) {
      return isRTL ? violation.rule.name_ar : violation.rule.name_en
    }
    return violation.rule_code
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{t('signoff.title')}</DialogTitle>
          <DialogDescription>{t('signoff.subtitle')}</DialogDescription>
        </DialogHeader>

        {/* Violation Summary */}
        <div className={`rounded-lg border p-4 ${severityColors.bg} ${severityColors.border}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className={`font-medium ${severityColors.text}`}>{getRuleName()}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRTL
                  ? violation.entity_name_ar || violation.entity_name_en
                  : violation.entity_name_en || violation.entity_name_ar}
              </p>
            </div>
            <Badge variant="outline" className={`${severityColors.bg} ${severityColors.text}`}>
              {t(`severity.${violation.severity}`)}
            </Badge>
          </div>
        </div>

        <Separator />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Action Selection */}
          <div className="space-y-3">
            <Label>{t('signoff.action')}</Label>
            <RadioGroup
              defaultValue="approve"
              onValueChange={(value) => {
                // This is handled by react-hook-form
              }}
              className="grid grid-cols-2 gap-3"
            >
              {(['approve', 'reject', 'escalate', 'waive'] as SignoffAction[]).map((action) => {
                const Icon = ACTION_ICONS[action]
                return (
                  <div key={action} className="relative">
                    <RadioGroupItem
                      value={action}
                      id={`action-${action}`}
                      className="peer sr-only"
                      {...register('action')}
                    />
                    <Label
                      htmlFor={`action-${action}`}
                      className={`flex items-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-colors
                          peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                          hover:bg-muted/50`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{t(`signoffActions.${action}`)}</span>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {/* Justification */}
          <div className="space-y-2">
            <Label htmlFor="justification">
              {t('signoff.justification')}
              <span className="text-destructive ms-1">*</span>
            </Label>
            <Textarea
              id="justification"
              placeholder={t('signoff.justificationPlaceholder')}
              rows={4}
              {...register('justification', {
                required: t('validation.justificationRequired'),
              })}
              className={errors.justification ? 'border-destructive' : ''}
            />
            {errors.justification && (
              <p className="text-sm text-destructive">{errors.justification.message}</p>
            )}
          </div>

          {/* Conditions (optional) */}
          <div className="space-y-2">
            <Label htmlFor="conditions">{t('signoff.conditions')}</Label>
            <Textarea
              id="conditions"
              placeholder={t('signoff.conditionsPlaceholder')}
              rows={2}
              {...register('conditions')}
            />
          </div>

          {/* Waiver expiration (only for waive action) */}
          {selectedAction === 'waive' && (
            <div className="space-y-2">
              <Label htmlFor="waiver_valid_until" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('signoff.waiverValidUntil')}
              </Label>
              <Input
                id="waiver_valid_until"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                {...register('waiver_valid_until')}
              />
              <p className="text-xs text-muted-foreground">{t('signoff.waiverScopeSingle')}</p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('signoff.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={signoffMutation.isPending}
              className={
                selectedAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : selectedAction === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : ''
              }
            >
              {signoffMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t('signoff.confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ComplianceSignoffDialog
