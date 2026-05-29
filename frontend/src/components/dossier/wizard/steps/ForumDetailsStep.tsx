/**
 * ForumDetailsStep -- Second step of the Forum wizard (Plan 29-03, Task 2).
 *
 * Renders a single-select DossierPicker for the organizing body filtered to
 * organization dossiers. The field is optional.
 *
 * Note: a forum_type selector previously lived here but was removed because the
 * `forums` table has no forum_type column (it silently dropped user input). To
 * reintroduce categorization, add a `forums.forum_type` column and restore the
 * field + its mapping in forum.config.ts.
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'

import { FormWizardStep } from '@/components/ui/form-wizard'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { DossierPicker } from '@/components/work-creation/DossierPicker'
import type { ForumFormData } from '../schemas/forum.schema'

interface ForumDetailsStepProps {
  form: UseFormReturn<ForumFormData>
}

export function ForumDetailsStep({ form }: ForumDetailsStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard'])

  return (
    <FormWizardStep stepId="forum-details" className="space-y-6 max-w-xl">
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
