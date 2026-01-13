/**
 * InitiateRenewalDialog Component
 * Feature: commitment-renewal-workflow
 *
 * Dialog for initiating an MoU renewal process with form inputs.
 * Mobile-first, RTL-aware design.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addMonths } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { Calendar as CalendarIcon, RefreshCw, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useInitiateRenewal } from '@/hooks/useMouRenewals'
import { type InitiateRenewalInput } from '@/types/mou-renewal.types'

interface MouSummary {
  id: string
  title_en: string
  title_ar: string
  reference_number: string
  expiry_date: string
  renewal_period_months?: number | null
}

interface InitiateRenewalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mou: MouSummary
  onSuccess?: () => void
}

const renewalPeriodOptions = [
  { value: '6', label: '6 months' },
  { value: '12', label: '1 year' },
  { value: '24', label: '2 years' },
  { value: '36', label: '3 years' },
  { value: '60', label: '5 years' },
]

export function InitiateRenewalDialog({
  open,
  onOpenChange,
  mou,
  onSuccess,
}: InitiateRenewalDialogProps) {
  const { t, i18n } = useTranslation('mou-renewals')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  const initiateMutation = useInitiateRenewal()

  const mouTitle = isRTL ? mou.title_ar : mou.title_en
  const defaultPeriod = mou.renewal_period_months || 12
  const currentExpiry = new Date(mou.expiry_date)
  const proposedExpiry = addMonths(currentExpiry, defaultPeriod)

  // Form schema
  const formSchema = z.object({
    renewal_period_months: z.number().min(1).max(120),
    proposed_expiry_date: z.date().optional(),
    notes_en: z.string().max(2000).optional(),
    notes_ar: z.string().max(2000).optional(),
  })

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      renewal_period_months: defaultPeriod,
      proposed_expiry_date: proposedExpiry,
      notes_en: '',
      notes_ar: '',
    },
  })

  // Update proposed expiry when period changes
  const watchPeriod = form.watch('renewal_period_months')
  const calculatedExpiry = addMonths(currentExpiry, watchPeriod || defaultPeriod)

  const handleSubmit = async (values: FormValues) => {
    const input: InitiateRenewalInput = {
      mou_id: mou.id,
      renewal_period_months: values.renewal_period_months,
      proposed_expiry_date: values.proposed_expiry_date
        ? format(values.proposed_expiry_date, 'yyyy-MM-dd')
        : undefined,
      notes_en: values.notes_en || undefined,
      notes_ar: values.notes_ar || undefined,
    }

    try {
      await initiateMutation.mutateAsync(input)
      onOpenChange(false)
      onSuccess?.()
      form.reset()
    } catch {
      // Error is handled by the mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-lg', isRTL && 'text-right')} dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {t('dialogs.initiateRenewal.title')}
          </DialogTitle>
          <DialogDescription>{t('dialogs.initiateRenewal.description')}</DialogDescription>
        </DialogHeader>

        {/* MoU Summary */}
        <div className="rounded-lg border bg-muted/50 p-3">
          <p className="text-sm font-medium">{mouTitle}</p>
          <p className="text-xs text-muted-foreground">{mou.reference_number}</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarIcon className="h-3 w-3" />
            <span>
              {t('currentExpiry')}: {format(currentExpiry, 'PP', { locale: dateLocale })}
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Renewal Period */}
            <FormField
              control={form.control}
              name="renewal_period_months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.renewalPeriod')}</FormLabel>
                  <Select
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('form.selectPeriod')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {renewalPeriodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(`periods.${option.value}`, option.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('form.proposedExpiry')}:{' '}
                    <strong>{format(calculatedExpiry, 'PP', { locale: dateLocale })}</strong>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Expiry Date (optional) */}
            <FormField
              control={form.control}
              name="proposed_expiry_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('form.customExpiryDate')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-start font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                          {field.value
                            ? format(field.value, 'PP', { locale: dateLocale })
                            : t('form.selectDate')}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date <= currentExpiry}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>{t('form.customExpiryDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes (English) */}
            <FormField
              control={form.control}
              name="notes_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.notesEn')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('form.notesPlaceholder')}
                      className="min-h-[80px] resize-none"
                      dir="ltr"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes (Arabic) */}
            <FormField
              control={form.control}
              name="notes_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.notesAr')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('form.notesPlaceholderAr')}
                      className="min-h-[80px] resize-none"
                      dir="rtl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={initiateMutation.isPending}>
                {initiateMutation.isPending && (
                  <Loader2 className={cn('h-4 w-4 animate-spin', isRTL ? 'ms-2' : 'me-2')} />
                )}
                {t('actions.initiateRenewal')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default InitiateRenewalDialog
