/** Working Group extension fields for the dossier wizard. */
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ExtensionFieldProps } from '../shared'

export default function WorkingGroupFields({ form, direction }: ExtensionFieldProps): ReactElement {
  const { t } = useTranslation(['dossier'])
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="extension_data.wg_status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('dossier:form.workingGroup.status')}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder={t('dossier:form.workingGroup.statusPlaceholder')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="active">{t('dossier:form.workingGroup.statuses.active')}</SelectItem>
                <SelectItem value="suspended">{t('dossier:form.workingGroup.statuses.suspended')}</SelectItem>
                <SelectItem value="disbanded">{t('dossier:form.workingGroup.statuses.disbanded')}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="extension_data.established_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('dossier:form.workingGroup.establishedDate')}</FormLabel>
            <FormControl>
              <Input {...field} type="date" className="min-h-11" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="extension_data.mandate_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.workingGroup.mandateEn')}</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder={t('dossier:form.workingGroup.mandateEnPlaceholder')} className="min-h-[100px]" rows={4} />
              </FormControl>
              <FormDescription>{t('dossier:form.workingGroup.mandateDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="extension_data.mandate_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.workingGroup.mandateAr')}</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder={t('dossier:form.workingGroup.mandateArPlaceholder')} className="min-h-[100px]" dir={direction} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
