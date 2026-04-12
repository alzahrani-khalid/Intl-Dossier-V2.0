/** Engagement extension fields for the dossier wizard. */
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

export default function EngagementFields({ form, direction }: ExtensionFieldProps): ReactElement {
  const { t } = useTranslation(['dossier'])
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="extension_data.engagement_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('dossier:form.engagement.type')} <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder={t('dossier:form.engagement.typePlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="meeting">
                    {t('dossier:form.engagement.types.meeting')}
                  </SelectItem>
                  <SelectItem value="consultation">
                    {t('dossier:form.engagement.types.consultation')}
                  </SelectItem>
                  <SelectItem value="coordination">
                    {t('dossier:form.engagement.types.coordination')}
                  </SelectItem>
                  <SelectItem value="workshop">
                    {t('dossier:form.engagement.types.workshop')}
                  </SelectItem>
                  <SelectItem value="conference">
                    {t('dossier:form.engagement.types.conference')}
                  </SelectItem>
                  <SelectItem value="site_visit">
                    {t('dossier:form.engagement.types.site_visit')}
                  </SelectItem>
                  <SelectItem value="ceremony">
                    {t('dossier:form.engagement.types.ceremony')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="extension_data.engagement_category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('dossier:form.engagement.category')} <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder={t('dossier:form.engagement.categoryPlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bilateral">
                    {t('dossier:form.engagement.categories.bilateral')}
                  </SelectItem>
                  <SelectItem value="multilateral">
                    {t('dossier:form.engagement.categories.multilateral')}
                  </SelectItem>
                  <SelectItem value="regional">
                    {t('dossier:form.engagement.categories.regional')}
                  </SelectItem>
                  <SelectItem value="internal">
                    {t('dossier:form.engagement.categories.internal')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="extension_data.location_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.engagement.locationEn')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('dossier:form.engagement.locationEnPlaceholder')}
                  className="min-h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="extension_data.location_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.engagement.locationAr')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('dossier:form.engagement.locationArPlaceholder')}
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
