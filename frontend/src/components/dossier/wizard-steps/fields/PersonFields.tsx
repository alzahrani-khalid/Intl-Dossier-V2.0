/** Person extension fields for the dossier wizard. */
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
import { Textarea } from '@/components/ui/textarea'
import type { ExtensionFieldProps } from '../shared'

export default function PersonFields({ form, direction }: ExtensionFieldProps): ReactElement {
  const { t } = useTranslation(['dossier'])
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="extension_data.title_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.person.titleEn')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('dossier:form.person.titleEnPlaceholder')} className="min-h-11" />
              </FormControl>
              <FormDescription>{t('dossier:form.person.titleDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="extension_data.title_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.person.titleAr')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('dossier:form.person.titleArPlaceholder')} className="min-h-11" dir={direction} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="extension_data.photo_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('dossier:form.person.photoUrl')}</FormLabel>
            <FormControl>
              <Input {...field} type="url" placeholder={t('dossier:form.person.photoUrlPlaceholder')} className="min-h-11" />
            </FormControl>
            <FormDescription>{t('dossier:form.person.photoUrlDescription')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="extension_data.biography_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.person.biographyEn')}</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder={t('dossier:form.person.biographyEnPlaceholder')} className="min-h-[120px]" rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="extension_data.biography_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.person.biographyAr')}</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder={t('dossier:form.person.biographyArPlaceholder')} className="min-h-[120px]" dir={direction} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
