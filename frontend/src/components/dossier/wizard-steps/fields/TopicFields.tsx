/** Topic extension fields for the dossier wizard. */
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ExtensionFieldProps } from '../Shared'

export default function TopicFields({ form }: ExtensionFieldProps): ReactElement {
  const { t } = useTranslation(['dossier'])
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="extension_data.theme_category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t('dossier:form.topic.category')} <span className="text-destructive">*</span>
            </FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder={t('dossier:form.topic.categoryPlaceholder')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="policy">{t('dossier:form.topic.categories.policy')}</SelectItem>
                <SelectItem value="technical">
                  {t('dossier:form.topic.categories.technical')}
                </SelectItem>
                <SelectItem value="strategic">
                  {t('dossier:form.topic.categories.strategic')}
                </SelectItem>
                <SelectItem value="operational">
                  {t('dossier:form.topic.categories.operational')}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>{t('dossier:form.topic.categoryDescription')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
