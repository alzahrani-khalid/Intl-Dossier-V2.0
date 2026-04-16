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
import type { OrganizationFormData } from '../schemas/organization.schema'

interface OrgDetailsStepProps {
  form: UseFormReturn<OrganizationFormData>
}

const ORG_TYPES = ['government', 'ngo', 'private', 'international', 'academic'] as const

export function OrgDetailsStep({ form }: OrgDetailsStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard'])
  const { direction } = useDirection()

  return (
    <FormWizardStep stepId="org-details" className="space-y-6">
      {/* Organization Type */}
      <FormField
        control={form.control}
        name="org_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form-wizard:organization.org_type')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value as string}>
              <FormControl>
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder={t('form-wizard:organization.org_type_ph')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {ORG_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`form-wizard:organization.org_types.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Organization Code */}
      <FormField
        control={form.control}
        name="org_code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form-wizard:organization.org_code')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                className="min-h-11"
                placeholder={t('form-wizard:organization.org_code_ph')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Website */}
      <FormField
        control={form.control}
        name="website"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form-wizard:organization.website')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="url"
                className="min-h-11"
                placeholder={t('form-wizard:organization.website_ph')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Headquarters pair */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Headquarters EN */}
        <FormField
          control={form.control}
          name="headquarters_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:organization.headquarters_en')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="min-h-11"
                  placeholder={t('form-wizard:organization.headquarters_en_ph')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Headquarters AR */}
        <FormField
          control={form.control}
          name="headquarters_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:organization.headquarters_ar')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="min-h-11"
                  dir={direction}
                  placeholder={t('form-wizard:organization.headquarters_ar_ph')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Founding Date */}
      <FormField
        control={form.control}
        name="founding_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form-wizard:organization.founding_date')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="date"
                className="min-h-11"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormWizardStep>
  )
}
