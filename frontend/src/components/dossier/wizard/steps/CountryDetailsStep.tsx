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
import { useCountryAutoFill } from '../hooks/useCountryAutoFill'
import type { CountryFormData } from '../schemas/country.schema'

interface CountryDetailsStepProps {
  form: UseFormReturn<CountryFormData>
}

const REGIONS = ['asia', 'africa', 'europe', 'americas', 'oceania', 'antarctic'] as const

export function CountryDetailsStep({ form }: CountryDetailsStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard'])
  const { direction } = useDirection()

  const nameEn = form.watch('name_en')
  useCountryAutoFill(nameEn, form)

  return (
    <FormWizardStep stepId="country-details" className="space-y-6">
      {/* ISO Code pair */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ISO Alpha-2 */}
        <FormField
          control={form.control}
          name="iso_code_2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:country.iso_code_2')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  maxLength={2}
                  className="min-h-11 uppercase font-mono"
                  placeholder={t('form-wizard:country.iso_code_2_ph')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ISO Alpha-3 */}
        <FormField
          control={form.control}
          name="iso_code_3"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:country.iso_code_3')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  maxLength={3}
                  className="min-h-11 uppercase font-mono"
                  placeholder={t('form-wizard:country.iso_code_3_ph')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Region dropdown */}
      <FormField
        control={form.control}
        name="region"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form-wizard:country.region')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value as string}>
              <FormControl>
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder={t('form-wizard:country.region_ph')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {REGIONS.map((region) => (
                  <SelectItem key={region} value={region}>
                    {t(`form-wizard:regions.${region}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Capital pair */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Capital EN */}
        <FormField
          control={form.control}
          name="capital_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:country.capital_en')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="min-h-11"
                  placeholder={t('form-wizard:country.capital_en_ph')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Capital AR */}
        <FormField
          control={form.control}
          name="capital_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:country.capital_ar')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="min-h-11"
                  dir={direction}
                  placeholder={t('form-wizard:country.capital_ar_ph')}
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
