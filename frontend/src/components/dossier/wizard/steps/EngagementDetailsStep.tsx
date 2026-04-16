import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'

import { FormWizardStep } from '@/components/ui/form-wizard'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDirection } from '@/hooks/useDirection'
import type { EngagementFormData } from '../schemas/engagement.schema'

interface EngagementDetailsStepProps {
  form: UseFormReturn<EngagementFormData>
}

const ENGAGEMENT_TYPES = [
  'bilateral_meeting',
  'mission',
  'delegation',
  'summit',
  'working_group',
  'roundtable',
  'official_visit',
  'consultation',
  'forum_session',
  'other',
] as const

const ENGAGEMENT_CATEGORIES = [
  'diplomatic',
  'statistical',
  'technical',
  'economic',
  'cultural',
  'educational',
  'research',
  'other',
] as const

export function EngagementDetailsStep({ form }: EngagementDetailsStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard'])
  const { direction } = useDirection()

  return (
    <FormWizardStep stepId="engagement-details" className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="engagement_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:engagement.type_label')} *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={(field.value as string | undefined) ?? ''}
              >
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder={t('form-wizard:engagement.type_placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ENGAGEMENT_TYPES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {t(`form-wizard:engagement.types.${v}`)}
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
          name="engagement_category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:engagement.category_label')} *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={(field.value as string | undefined) ?? ''}
              >
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder={t('form-wizard:engagement.category_placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ENGAGEMENT_CATEGORIES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {t(`form-wizard:engagement.categories.${v}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:engagement.start_date_label')} *</FormLabel>
              <FormControl>
                <Input {...field} type="date" className="min-h-11" required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:engagement.end_date_label')} *</FormLabel>
              <FormControl>
                <Input {...field} type="date" className="min-h-11" required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="location_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:engagement.location_en_label')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="min-h-11"
                  placeholder={t('form-wizard:engagement.location_en_placeholder')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:engagement.location_ar_label')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="min-h-11"
                  dir={direction}
                  placeholder={t('form-wizard:engagement.location_ar_placeholder')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormWizardStep>
  )
}
