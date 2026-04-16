/**
 * ForumDetailsStep -- Second step of the Forum wizard (Plan 29-03, Task 2).
 *
 * Renders an optional forum_type Select (conference/seminar/workshop/summit) and a
 * single-select DossierPicker for the organizing body filtered to organization dossiers.
 * No required validation — both fields are optional.
 */
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DossierPicker } from '@/components/work-creation/DossierPicker'
import type { ForumFormData } from '../schemas/forum.schema'

interface ForumDetailsStepProps {
  form: UseFormReturn<ForumFormData>
}

const FORUM_TYPES = ['conference', 'seminar', 'workshop', 'summit'] as const

export function ForumDetailsStep({ form }: ForumDetailsStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard'])

  return (
    <FormWizardStep stepId="forum-details" className="space-y-6 max-w-xl">
      <FormField
        control={form.control}
        name="forum_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form-wizard:forum.forum_type_label')}</FormLabel>
            <Select onValueChange={field.onChange} value={(field.value as string) ?? ''}>
              <FormControl>
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder={t('form-wizard:forum.forum_type_placeholder')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {FORUM_TYPES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {t(`form-wizard:forum.forum_types.${v}`)}
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
        name="organizing_body_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form-wizard:forum.organizing_body_label')}</FormLabel>
            <FormControl>
              <DossierPicker
                value={field.value ?? ''}
                onChange={(id): void => field.onChange(id ?? '')}
                filterByDossierType="organization"
                placeholder={t('form-wizard:forum.organizing_body_placeholder')}
              />
            </FormControl>
            <p className="text-xs text-muted-foreground text-start">
              {t('form-wizard:forum.organizing_body_help')}
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormWizardStep>
  )
}
