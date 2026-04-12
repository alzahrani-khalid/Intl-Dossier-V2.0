/** Forum extension fields for the dossier wizard. */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { DossierPicker } from '@/components/work-creation/DossierPicker'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { ForumFieldProps } from '../Shared'

export default function ForumFields({
  form,
  isRTL,
  setOrganizingBodyName,
  onQuickAddOrg,
}: ForumFieldProps): ReactElement {
  const { t } = useTranslation(['dossier'])
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="extension_data.organizing_body_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('dossier:form.forum.organizingBody')}</FormLabel>
            <FormControl>
              <DossierPicker
                value={field.value || undefined}
                onChange={(dossierId, dossier) => {
                  field.onChange(dossierId || '')
                  if (dossier) {
                    form.setValue('extension_data.organizing_body_id', dossier.id)
                    const displayName = isRTL ? dossier.name_ar || dossier.name_en : dossier.name_en
                    setOrganizingBodyName(displayName)
                  } else {
                    setOrganizingBodyName('')
                  }
                }}
                placeholder={t('dossier:form.forum.selectOrganizingBody')}
                filterByDossierType="organization"
                allowQuickAdd
                onQuickAdd={(name) => onQuickAddOrg(name)}
              />
            </FormControl>
            <FormDescription>{t('dossier:form.forum.organizingBodyDescription')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
