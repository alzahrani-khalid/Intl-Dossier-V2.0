/**
 * SharedBasicInfoStep -- Merged BasicInfoStep + ClassificationStep (INFRA-06).
 * Classification fields appear in a collapsible section, collapsed by default.
 * Generic over form values so type-specific wizards can use it.
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn, FieldValues, Path } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'

import { FormWizardStep } from '@/components/ui/form-wizard'
import { AIFieldAssist } from '@/components/dossier/AIFieldAssist'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { FieldLabelWithHelp } from '@/components/forms/ContextualHelp'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDirection } from '@/hooks/useDirection'
import type { DossierType } from '@/services/dossier-api'
import type { GeneratedFields } from '@/hooks/useAIFieldAssist'

interface SharedBasicInfoStepProps<T extends FieldValues> {
  form: UseFormReturn<T>
  dossierType?: DossierType
  onAIGenerate?: (fields: GeneratedFields) => void
  isAIGenerating?: boolean
  showDuplicateWarning?: boolean
  duplicateMessage?: string
}

export function SharedBasicInfoStep<T extends FieldValues>({
  form,
  dossierType,
  onAIGenerate,
  isAIGenerating,
  showDuplicateWarning,
  duplicateMessage,
}: SharedBasicInfoStepProps<T>): ReactElement {
  const { t } = useTranslation(['dossier', 'form-wizard', 'contextual-help'])
  const { direction } = useDirection()

  return (
    <FormWizardStep stepId="basic" className="space-y-6">
      {/* AI Field Assist */}
      {dossierType != null && onAIGenerate != null && (
        <AIFieldAssist
          dossierType={dossierType}
          onGenerate={onAIGenerate}
          disabled={isAIGenerating ?? false}
          className="mb-2"
        />
      )}

      {/* Bilingual name fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* English Name */}
        <FormField
          control={form.control}
          name={'name_en' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FieldLabelWithHelp
                label={t('dossier:form.nameEn')}
                required
                helpProps={{
                  tooltip: t('contextual-help:dossier.nameEn.tooltip'),
                  title: t('contextual-help:dossier.nameEn.title'),
                  description: t('contextual-help:dossier.nameEn.description'),
                  mode: 'both',
                }}
              />
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('dossier:form.nameEnPlaceholder')}
                  className="min-h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Arabic Name */}
        <FormField
          control={form.control}
          name={'name_ar' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FieldLabelWithHelp
                label={t('dossier:form.nameAr')}
                required
                helpProps={{
                  tooltip: t('contextual-help:dossier.nameAr.tooltip'),
                  title: t('contextual-help:dossier.nameAr.title'),
                  description: t('contextual-help:dossier.nameAr.description'),
                  mode: 'both',
                }}
              />
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('dossier:form.nameArPlaceholder')}
                  className="min-h-11"
                  dir={direction}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Abbreviation */}
      <FormField
        control={form.control}
        name={'abbreviation' as Path<T>}
        render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>{t('dossier:form.abbreviation')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t('dossier:form.abbreviationPlaceholder')}
                className="min-h-11 uppercase"
                maxLength={20}
              />
            </FormControl>
            <FormDescription>{t('dossier:form.abbreviationDescription')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Bilingual description fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* English Description */}
        <FormField
          control={form.control}
          name={'description_en' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.descriptionEn')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t('dossier:form.descriptionEnPlaceholder')}
                  className="min-h-[88px]"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Arabic Description */}
        <FormField
          control={form.control}
          name={'description_ar' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.descriptionAr')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t('dossier:form.descriptionArPlaceholder')}
                  className="min-h-[88px]"
                  dir={direction}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Duplicate warning */}
      {showDuplicateWarning === true && duplicateMessage != null && (
        <div className="rounded-lg border border-warning bg-warning/10 p-3 text-sm">
          {duplicateMessage}
        </div>
      )}

      {/* Tags */}
      <FormField
        control={form.control}
        name={'tags' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('dossier:form.tags')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t('dossier:form.tagsPlaceholder')}
                className="min-h-11"
              />
            </FormControl>
            <FormDescription>{t('dossier:form.tagsDescription')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Classification section (INFRA-06) -- collapsible, collapsed by default */}
      <details className="group rounded-lg border">
        <summary className="flex items-center justify-between p-4 cursor-pointer min-h-11 text-sm font-medium">
          <span>{t('form-wizard:classificationTitle')}</span>
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status field */}
            <FormField
              control={form.control}
              name={'status' as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FieldLabelWithHelp
                    label={t('dossier:form.status')}
                    helpProps={{
                      tooltip: t('contextual-help:dossier.status.tooltip'),
                      title: t('contextual-help:dossier.status.title'),
                      description: t('contextual-help:dossier.status.description'),
                      mode: 'both',
                    }}
                  />
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value as string}
                  >
                    <FormControl>
                      <SelectTrigger className="min-h-11">
                        <SelectValue placeholder={t('dossier:form.selectStatus')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">{t('dossier:status.active')}</SelectItem>
                      <SelectItem value="inactive">{t('dossier:status.inactive')}</SelectItem>
                      <SelectItem value="archived">{t('dossier:status.archived')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sensitivity level field */}
            <FormField
              control={form.control}
              name={'sensitivity_level' as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FieldLabelWithHelp
                    label={t('dossier:form.sensitivityLevel')}
                    helpProps={{
                      tooltip: t('contextual-help:dossier.sensitivityLevel.tooltip'),
                      title: t('contextual-help:dossier.sensitivityLevel.title'),
                      description: t('contextual-help:dossier.sensitivityLevel.description'),
                      mode: 'both',
                    }}
                  />
                  <Select
                    onValueChange={(val: string): void => field.onChange(Number(val))}
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger className="min-h-11">
                        <SelectValue placeholder={t('dossier:form.selectSensitivity')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">{t('dossier:sensitivity.1')}</SelectItem>
                      <SelectItem value="2">{t('dossier:sensitivity.2')}</SelectItem>
                      <SelectItem value="3">{t('dossier:sensitivity.3')}</SelectItem>
                      <SelectItem value="4">{t('dossier:sensitivity.4')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('dossier:form.sensitivityDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </details>
    </FormWizardStep>
  )
}
