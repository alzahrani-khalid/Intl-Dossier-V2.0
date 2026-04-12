/** Organization extension fields for the dossier wizard. */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ExtensionFieldProps } from '../Shared'

export default function OrganizationFields({ form }: ExtensionFieldProps): ReactElement {
  const { t } = useTranslation(['dossier'])
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="extension_data.org_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.organization.code')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('dossier:form.organization.codePlaceholder')}
                  className="min-h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="extension_data.org_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('dossier:form.organization.type')} <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder={t('dossier:form.organization.typePlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="government">
                    {t('dossier:form.organization.types.government')}
                  </SelectItem>
                  <SelectItem value="ngo">{t('dossier:form.organization.types.ngo')}</SelectItem>
                  <SelectItem value="private">
                    {t('dossier:form.organization.types.private')}
                  </SelectItem>
                  <SelectItem value="international">
                    {t('dossier:form.organization.types.international')}
                  </SelectItem>
                  <SelectItem value="academic">
                    {t('dossier:form.organization.types.academic')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="extension_data.website"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('dossier:form.organization.website')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="url"
                placeholder={t('dossier:form.organization.websitePlaceholder')}
                className="min-h-11"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
