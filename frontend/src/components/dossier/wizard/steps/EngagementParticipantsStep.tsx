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
import { DossierPicker } from '@/components/work-creation/DossierPicker'
import type { EngagementFormData } from '../schemas/engagement.schema'

interface EngagementParticipantsStepProps {
  form: UseFormReturn<EngagementFormData>
}

export function EngagementParticipantsStep({
  form,
}: EngagementParticipantsStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard'])

  return (
    <FormWizardStep stepId="engagement-participants" className="space-y-6 max-w-2xl">
      <p className="text-sm text-muted-foreground text-start">
        {t('form-wizard:engagement.participants.section_hint')}
      </p>

      {/* Countries */}
      <fieldset className="rounded-lg border border-border p-4 space-y-3">
        <legend className="text-sm font-semibold px-2">
          {t('form-wizard:engagement.participants.countries_label')}
        </legend>
        <FormField
          control={form.control}
          name="participant_country_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">
                {t('form-wizard:engagement.participants.countries_label')}
              </FormLabel>
              <FormControl>
                <DossierPicker
                  multiple
                  values={(field.value as string[] | undefined) ?? []}
                  onValuesChange={(ids) => field.onChange(ids)}
                  filterByDossierType="country"
                  placeholder={t('form-wizard:engagement.participants.countries_placeholder')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </fieldset>

      {/* Organizations */}
      <fieldset className="rounded-lg border border-border p-4 space-y-3">
        <legend className="text-sm font-semibold px-2">
          {t('form-wizard:engagement.participants.organizations_label')}
        </legend>
        <FormField
          control={form.control}
          name="participant_organization_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">
                {t('form-wizard:engagement.participants.organizations_label')}
              </FormLabel>
              <FormControl>
                <DossierPicker
                  multiple
                  values={(field.value as string[] | undefined) ?? []}
                  onValuesChange={(ids) => field.onChange(ids)}
                  filterByDossierType="organization"
                  placeholder={t('form-wizard:engagement.participants.organizations_placeholder')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </fieldset>

      {/* Persons */}
      <fieldset className="rounded-lg border border-border p-4 space-y-3">
        <legend className="text-sm font-semibold px-2">
          {t('form-wizard:engagement.participants.persons_label')}
        </legend>
        <FormField
          control={form.control}
          name="participant_person_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">
                {t('form-wizard:engagement.participants.persons_label')}
              </FormLabel>
              <FormControl>
                <DossierPicker
                  multiple
                  values={(field.value as string[] | undefined) ?? []}
                  onValuesChange={(ids) => field.onChange(ids)}
                  filterByDossierType="person"
                  placeholder={t('form-wizard:engagement.participants.persons_placeholder')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </fieldset>
    </FormWizardStep>
  )
}
