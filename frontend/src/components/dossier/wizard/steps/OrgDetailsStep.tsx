import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'

import { FormWizardStep } from '@/components/ui/form-wizard'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPicker } from '@/components/forms/UserPicker'
import { useDirection } from '@/hooks/useDirection'
import type { OrganizationFormData } from '../schemas/organization.schema'

interface OrgDetailsStepProps {
  form: UseFormReturn<OrganizationFormData>
}

const ORG_TYPES = ['government', 'ngo', 'private', 'international', 'academic'] as const

// 260629-jkn: membership & representation profile. options typed as
// readonly string[] so a single .map() over the union of field configs stays
// callable; field `name`s are precise literals so they remain valid form paths.
const ENUM_FIELDS: ReadonlyArray<{
  name: 'membership_type' | 'importance' | 'representation_level'
  group: string
  options: readonly string[]
}> = [
  {
    name: 'membership_type',
    group: 'membership_types',
    options: ['board_of_directors', 'member', 'participant', 'counterpart_agency'],
  },
  { name: 'importance', group: 'importances', options: ['high', 'medium', 'low'] },
  {
    name: 'representation_level',
    group: 'representation_levels',
    options: ['president', 'specialist'],
  },
]

const FOCAL_GROUPS: ReadonlyArray<{
  role: 'responsible' | 'alternate' | 'support'
  nameEn: 'responsible_name_en' | 'alternate_name_en' | 'support_name_en'
  nameAr: 'responsible_name_ar' | 'alternate_name_ar' | 'support_name_ar'
  userId: 'responsible_user_id' | 'alternate_user_id' | 'support_user_id'
}> = [
  {
    role: 'responsible',
    nameEn: 'responsible_name_en',
    nameAr: 'responsible_name_ar',
    userId: 'responsible_user_id',
  },
  {
    role: 'alternate',
    nameEn: 'alternate_name_en',
    nameAr: 'alternate_name_ar',
    userId: 'alternate_user_id',
  },
  {
    role: 'support',
    nameEn: 'support_name_en',
    nameAr: 'support_name_ar',
    userId: 'support_user_id',
  },
]

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
              <Input {...field} type="date" className="min-h-11" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Engagement profile (260629-jkn) */}
      <hr className="border-t" />
      <h3 className="text-sm font-semibold text-foreground">
        {t('form-wizard:organization.engagement_profile')}
      </h3>

      {ENUM_FIELDS.map((item) => (
        <FormField
          key={item.name}
          control={form.control}
          name={item.name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t(`form-wizard:organization.${item.name}`)}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value as string}>
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder={t(`form-wizard:organization.${item.name}_ph`)} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {item.options.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`form-wizard:organization.${item.group}.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}

      {/* GASTAT focal points */}
      <h4 className="text-sm font-medium text-muted-foreground">
        {t('form-wizard:organization.focal_points')}
      </h4>

      {FOCAL_GROUPS.map((group) => (
        <fieldset key={group.role} className="rounded-lg border border-border p-4 space-y-4">
          <legend className="px-1 text-sm font-medium text-foreground">
            {t(`form-wizard:organization.focal_${group.role}`)}
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name={group.nameEn}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form-wizard:organization.focal_name_en')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="min-h-11"
                      placeholder={t('form-wizard:organization.focal_name_en_ph')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={group.nameAr}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form-wizard:organization.focal_name_ar')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="min-h-11"
                      dir={direction}
                      placeholder={t('form-wizard:organization.focal_name_ar_ph')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name={group.userId}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form-wizard:organization.focal_user')}</FormLabel>
                <FormControl>
                  <UserPicker
                    value={field.value as string | undefined}
                    onChange={(id) => field.onChange(id ?? '')}
                    placeholder={t('form-wizard:organization.focal_user_ph')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>
      ))}
    </FormWizardStep>
  )
}
