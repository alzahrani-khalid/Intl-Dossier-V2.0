/**
 * TopicBasicInfoStep -- Wraps SharedBasicInfoStep with inline theme_category Select.
 *
 * Topic is the simplest wizard (2 steps: basic + review). The theme_category
 * dropdown is rendered below the shared basic info fields via a fragment.
 * SharedBasicInfoStep renders its own <FormWizardStep stepId="basic"> internally.
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'

import { SharedBasicInfoStep } from '../SharedBasicInfoStep'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TopicFormData } from '../schemas/topic.schema'

const THEME_CATEGORIES = ['policy', 'technical', 'strategic', 'operational'] as const

interface TopicBasicInfoStepProps {
  form: UseFormReturn<TopicFormData>
}

export function TopicBasicInfoStep({ form }: TopicBasicInfoStepProps): ReactElement {
  const { t } = useTranslation('form-wizard')

  return (
    <>
      <SharedBasicInfoStep form={form} dossierType="topic" />
      <div className="mt-6 px-1">
        <FormField
          control={form.control}
          name="theme_category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('topic.theme_category')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder={t('topic.theme_category_ph')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {THEME_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`topic.themes.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  )
}
