/** Country extension fields for the dossier wizard. */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { ExtensionFieldProps } from '../Shared'

export default function CountryFields({ form, direction }: ExtensionFieldProps): ReactElement {
  const { t } = useTranslation(['dossier'])
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="extension_data.iso_code_2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('dossier:form.country.isoCode2')} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('dossier:form.country.isoCode2Placeholder')}
                  maxLength={2}
                  className="min-h-11 uppercase"
                  required
                />
              </FormControl>
              <FormDescription>{t('dossier:form.country.isoCode2Description')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="extension_data.iso_code_3"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('dossier:form.country.isoCode3')} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('dossier:form.country.isoCode3Placeholder')}
                  maxLength={3}
                  className="min-h-11 uppercase"
                  required
                />
              </FormControl>
              <FormDescription>{t('dossier:form.country.isoCode3Description')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="extension_data.region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.country.region')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('dossier:form.country.regionPlaceholder')}
                  className="min-h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="extension_data.capital_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.country.capitalEn')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('dossier:form.country.capitalEnPlaceholder')}
                  className="min-h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="extension_data.capital_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.country.capitalAr')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('dossier:form.country.capitalArPlaceholder')}
                  className="min-h-11"
                  dir={direction}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
