/**
 * OfficeTermStep -- Third step of the Elected Official wizard variant (Phase 30 D-06).
 *
 * Renders 4 semantic sections:
 *   1. Office     — office_name pair (EN/AR, at-least-one required) + country (required DossierPicker) + organization (optional DossierPicker)
 *   2. Constituency — district pair (EN/AR, both optional)
 *   3. Party      — party pair (EN/AR, both optional)
 *   4. Term       — term_start (required) + term_end (optional; empty = ongoing)
 *
 * is_current_term is auto-derived at submit in electedOfficialWizardConfig.filterExtensionData — not shown in UI.
 * Required-ness for elected-official fields is enforced in personSchema.superRefine.
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
import { Input } from '@/components/ui/input'
import { DossierPicker } from '@/components/work-creation/DossierPicker'
import { useDirection } from '@/hooks/useDirection'
import type { PersonFormData } from '../schemas/person.schema'

interface OfficeTermStepProps {
  form: UseFormReturn<PersonFormData>
}

export function OfficeTermStep({ form }: OfficeTermStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard'])
  const { direction } = useDirection()

  return (
    <FormWizardStep stepId="office-term" className="space-y-8">
      {/* ============ Section 1: Office ============ */}
      <section className="space-y-4" aria-labelledby="office-term-office-heading">
        <h3
          id="office-term-office-heading"
          className="text-sm font-semibold text-foreground text-start"
        >
          {t('form-wizard:elected_official.sections.office')}
        </h3>

        {/* Office name bilingual pair (at least one required — superRefine enforces) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="office_name_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form-wizard:elected_official.office_name_en')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    className="min-h-11"
                    placeholder={t('form-wizard:elected_official.office_name_en_ph')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="office_name_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form-wizard:elected_official.office_name_ar')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    className="min-h-11"
                    dir={direction}
                    placeholder={t('form-wizard:elected_official.office_name_ar_ph')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Country picker (required) */}
        <FormField
          control={form.control}
          name="country_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('form-wizard:elected_official.country')}
                <span className="ms-1 text-destructive" aria-hidden="true">*</span>
              </FormLabel>
              <FormControl>
                <DossierPicker
                  value={field.value ?? ''}
                  onChange={(id): void => field.onChange(id ?? '')}
                  filterByDossierType="country"
                  placeholder={t('form-wizard:elected_official.country_ph')}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground text-start">
                {t('form-wizard:elected_official.country_help')}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Organization picker (optional) */}
        <FormField
          control={form.control}
          name="organization_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:elected_official.organization')}</FormLabel>
              <FormControl>
                <DossierPicker
                  value={field.value ?? ''}
                  onChange={(id): void => field.onChange(id ?? '')}
                  filterByDossierType="organization"
                  placeholder={t('form-wizard:elected_official.organization_ph')}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground text-start">
                {t('form-wizard:elected_official.organization_help')}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      {/* ============ Section 2: Constituency ============ */}
      <section className="space-y-4" aria-labelledby="office-term-constituency-heading">
        <h3
          id="office-term-constituency-heading"
          className="text-sm font-semibold text-foreground text-start"
        >
          {t('form-wizard:elected_official.sections.constituency')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="district_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form-wizard:elected_official.district_en')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    className="min-h-11"
                    placeholder={t('form-wizard:elected_official.district_en_ph')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="district_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form-wizard:elected_official.district_ar')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    className="min-h-11"
                    dir={direction}
                    placeholder={t('form-wizard:elected_official.district_ar_ph')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      {/* ============ Section 3: Party ============ */}
      <section className="space-y-4" aria-labelledby="office-term-party-heading">
        <h3
          id="office-term-party-heading"
          className="text-sm font-semibold text-foreground text-start"
        >
          {t('form-wizard:elected_official.sections.party')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="party_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form-wizard:elected_official.party_en')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    className="min-h-11"
                    placeholder={t('form-wizard:elected_official.party_en_ph')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="party_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form-wizard:elected_official.party_ar')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    className="min-h-11"
                    dir={direction}
                    placeholder={t('form-wizard:elected_official.party_ar_ph')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      {/* ============ Section 4: Term ============ */}
      <section className="space-y-4" aria-labelledby="office-term-term-heading">
        <h3
          id="office-term-term-heading"
          className="text-sm font-semibold text-foreground text-start"
        >
          {t('form-wizard:elected_official.sections.term')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="term_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('form-wizard:elected_official.term_start')}
                  <span className="ms-1 text-destructive" aria-hidden="true">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    type="date"
                    className="min-h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="term_end"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form-wizard:elected_official.term_end')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    type="date"
                    className="min-h-11"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground text-start">
                  {t('form-wizard:elected_official.term_end_help')}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>
    </FormWizardStep>
  )
}
