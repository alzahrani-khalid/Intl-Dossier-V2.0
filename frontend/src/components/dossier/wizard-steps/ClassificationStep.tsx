/**
 * ClassificationStep — Step 2 of the DossierCreateWizard.
 * Sets status and sensitivity level for the dossier.
 */

import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

import { FormWizardStep } from '@/components/ui/form-wizard'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { FieldLabelWithHelp } from '@/components/forms/ContextualHelp'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StepProps } from './shared'

export default function ClassificationStep({
  form,
  updateDraft,
}: StepProps): ReactElement {
  const { t } = useTranslation(['dossier', 'contextual-help'])

  return (
    <FormWizardStep stepId="classification" className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FieldLabelWithHelp
                label={t('dossier:form.status')}
                helpProps={{
                  tooltip: t('contextual-help:dossier.status.tooltip'),
                  title: t('contextual-help:dossier.status.title'),
                  description: t('contextual-help:dossier.status.description'),
                  mode: 'both',
                }}
              />
              <Select
                onValueChange={(value) => {
                  field.onChange(value)
                  updateDraft({ status: value as 'active' | 'inactive' | 'archived' | 'deleted' })
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder={t('dossier:form.selectStatus')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">{t('dossier:status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('dossier:status.inactive')}</SelectItem>
                  <SelectItem value="archived">{t('dossier:status.archived')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sensitivity Level */}
        <FormField
          control={form.control}
          name="sensitivity_level"
          render={({ field }) => (
            <FormItem>
              <FieldLabelWithHelp
                label={t('dossier:form.sensitivityLevel')}
                helpProps={{
                  tooltip: t('contextual-help:dossier.sensitivityLevel.tooltip'),
                  title: t('contextual-help:dossier.sensitivityLevel.title'),
                  description: t('contextual-help:dossier.sensitivityLevel.description'),
                  mode: 'both',
                }}
              />
              <Select
                onValueChange={(value) => {
                  const numValue = Number(value)
                  field.onChange(numValue)
                  updateDraft({ sensitivity_level: numValue })
                }}
                defaultValue={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder={t('dossier:form.selectSensitivity')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[1, 2, 3, 4].map((level) => (
                    <SelectItem key={level} value={String(level)}>
                      {t(`dossier:sensitivityLevel.${level}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>{t('dossier:form.sensitivityDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormWizardStep>
  )
}
