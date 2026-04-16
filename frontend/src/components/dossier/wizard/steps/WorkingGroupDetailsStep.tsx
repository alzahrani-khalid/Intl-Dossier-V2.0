import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'

import { FormWizardStep } from '@/components/ui/form-wizard'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DossierPicker } from '@/components/work-creation/DossierPicker'
import { useDirection } from '@/hooks/useDirection'
import type { WorkingGroupFormData } from '../schemas/working-group.schema'

interface WorkingGroupDetailsStepProps {
  form: UseFormReturn<WorkingGroupFormData>
}

const WG_STATUSES = ['active', 'inactive', 'pending', 'suspended'] as const

export function WorkingGroupDetailsStep({ form }: WorkingGroupDetailsStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard'])
  const { direction } = useDirection()

  return (
    <FormWizardStep stepId="wg-details" className="space-y-6 max-w-xl">
      <FormField
        control={form.control}
        name="wg_status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form-wizard:workingGroup.status_label')}</FormLabel>
            <Select onValueChange={field.onChange} value={(field.value as string) ?? ''}>
              <FormControl>
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder={t('form-wizard:workingGroup.status_placeholder')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {WG_STATUSES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {t(`form-wizard:workingGroup.statuses.${v}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="established_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form-wizard:workingGroup.established_date_label')}</FormLabel>
            <FormControl>
              <Input {...field} type="date" className="min-h-11" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="mandate_en"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form-wizard:workingGroup.mandate_en_label')}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                className="min-h-[88px]"
                placeholder={t('form-wizard:workingGroup.mandate_en_placeholder')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="mandate_ar"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form-wizard:workingGroup.mandate_ar_label')}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                className="min-h-[88px]"
                dir={direction}
                placeholder={t('form-wizard:workingGroup.mandate_ar_placeholder')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="parent_body_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form-wizard:workingGroup.parent_body_label')}</FormLabel>
            <FormControl>
              <DossierPicker
                value={field.value ?? ''}
                onChange={(id) => field.onChange(id ?? '')}
                filterByDossierType="organization"
                placeholder={t('form-wizard:workingGroup.parent_body_placeholder')}
              />
            </FormControl>
            <p className="text-xs text-muted-foreground text-start">
              {t('form-wizard:workingGroup.parent_body_help')}
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormWizardStep>
  )
}
