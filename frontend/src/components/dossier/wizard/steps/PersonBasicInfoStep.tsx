/**
 * PersonBasicInfoStep — Phase 32 D-24 replacement for SharedBasicInfoStep
 * on person + elected-official wizards (D-27).
 *
 * Field order (D-24):
 *   1. AI field assist (inherited from shared step shape)
 *   2. Honorific select (curated 12 labels + Other reveal)
 *   3. First/Last name pairs (EN row then AR row)
 *   4. Known-as (EN + AR)
 *   5. photo_url
 *   6. Nationality (required DossierPicker filtered to country — D-26 form name is nationality_id)
 *   7. Date of birth (optional) + Gender (optional: female | male only)
 *   8. Bilingual description (EN + AR, optional)
 *   9. Tags
 *  10. Collapsible Classification — sensitivity_level ONLY (no manual status per D-23)
 *
 * Abbreviation is intentionally absent — it is not a person identity concept
 * and was dropped from this flow per PBI-01.
 */
import type { ReactElement } from 'react'
import { useEffect } from 'react'
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
import { DossierPicker } from '@/components/work-creation/DossierPicker'
import { useDirection } from '@/hooks/useDirection'
import type { DossierType } from '@/services/dossier-api'
import type { GeneratedFields } from '@/hooks/useAIFieldAssist'
import { CURATED_HONORIFICS, HONORIFIC_OTHER } from './honorific-map'

interface PersonBasicInfoStepProps<T extends FieldValues> {
  form: UseFormReturn<T>
  dossierType?: DossierType
  onAIGenerate?: (fields: GeneratedFields) => void
  isAIGenerating?: boolean
  showDuplicateWarning?: boolean
  duplicateMessage?: string
}

export function PersonBasicInfoStep<T extends FieldValues>({
  form,
  dossierType,
  onAIGenerate,
  isAIGenerating,
  showDuplicateWarning,
  duplicateMessage,
}: PersonBasicInfoStepProps<T>): ReactElement {
  const { t } = useTranslation(['dossier', 'form-wizard', 'contextual-help'])
  const { direction } = useDirection()

  // D-03: watch honorific_selection to conditionally reveal Other inputs.
  const honorificSelection = form.watch('honorific_selection' as Path<T>) as unknown as
    | string
    | undefined
  const showOtherInputs = honorificSelection === HONORIFIC_OTHER

  // D-08: keep dossier-level name_en / name_ar in sync with first + last.
  // filterExtensionData also composes these, but useCreateDossierWizard reads
  // name_en/name_ar directly off the form to build the top-level payload, so
  // we mirror the composition here as the user types. Composed name does NOT
  // include honorific (D-09).
  const firstNameEn = form.watch('first_name_en' as Path<T>) as unknown as string | undefined
  const lastNameEn = form.watch('last_name_en' as Path<T>) as unknown as string | undefined
  const firstNameAr = form.watch('first_name_ar' as Path<T>) as unknown as string | undefined
  const lastNameAr = form.watch('last_name_ar' as Path<T>) as unknown as string | undefined

  useEffect(() => {
    const f = (firstNameEn ?? '').trim()
    const l = (lastNameEn ?? '').trim()
    const composed = f !== '' && l !== '' ? `${f} ${l}` : l
    form.setValue('name_en' as Path<T>, composed as never, { shouldDirty: true })
  }, [firstNameEn, lastNameEn, form])

  useEffect(() => {
    const f = (firstNameAr ?? '').trim()
    const l = (lastNameAr ?? '').trim()
    const composed = f !== '' && l !== '' ? `${f} ${l}` : l
    form.setValue('name_ar' as Path<T>, composed as never, { shouldDirty: true })
  }, [firstNameAr, lastNameAr, form])

  return (
    <FormWizardStep stepId="basic" className="space-y-6">
      {/* AI Field Assist (unchanged from shared step) */}
      {dossierType != null && onAIGenerate != null && (
        <AIFieldAssist
          dossierType={dossierType}
          onGenerate={onAIGenerate}
          disabled={isAIGenerating ?? false}
          className="mb-2"
        />
      )}

      {/* D-24 #2: Honorific select */}
      <FormField
        control={form.control}
        name={'honorific_selection' as Path<T>}
        render={({ field }) => (
          <FormItem className="max-w-sm">
            <FieldLabelWithHelp label={t('form-wizard:wizard.person_identity.honorific.label')} />
            <Select
              onValueChange={field.onChange}
              value={(field.value as string | undefined) ?? ''}
            >
              <FormControl>
                <SelectTrigger className="min-h-11">
                  <SelectValue
                    placeholder={t('form-wizard:wizard.person_identity.honorific.placeholder')}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CURATED_HONORIFICS.map((label) => (
                  <SelectItem key={label} value={label}>
                    {label === HONORIFIC_OTHER
                      ? t('form-wizard:wizard.person_identity.honorific.other_label')
                      : label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              {t('form-wizard:wizard.person_identity.honorific.helper')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* D-03: Other reveal — two free-text inputs side-by-side */}
      {showOtherInputs && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={'honorific_en' as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('form-wizard:wizard.person_identity.honorific.other_en_label')}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={(field.value as string | undefined) ?? ''}
                    className="min-h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={'honorific_ar' as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('form-wizard:wizard.person_identity.honorific.other_ar_label')}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={(field.value as string | undefined) ?? ''}
                    dir="rtl"
                    className="min-h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {/* D-24 #3a: EN name pair (first + last, required via superRefine on last) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={'first_name_en' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:wizard.person_identity.first_name.label_en')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={(field.value as string | undefined) ?? ''}
                  className="min-h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={'last_name_en' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FieldLabelWithHelp
                label={t('form-wizard:wizard.person_identity.last_name.label_en')}
                required
              />
              <FormControl>
                <Input
                  {...field}
                  value={(field.value as string | undefined) ?? ''}
                  className="min-h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* D-24 #3b: AR name pair (first + last, required via superRefine on last) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={'first_name_ar' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:wizard.person_identity.first_name.label_ar')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={(field.value as string | undefined) ?? ''}
                  dir="rtl"
                  className="min-h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={'last_name_ar' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FieldLabelWithHelp
                label={t('form-wizard:wizard.person_identity.last_name.label_ar')}
                required
              />
              <FormControl>
                <Input
                  {...field}
                  value={(field.value as string | undefined) ?? ''}
                  dir="rtl"
                  className="min-h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* D-24 #4: known_as (EN + AR, optional) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={'known_as_en' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:wizard.person_identity.known_as.label_en')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={(field.value as string | undefined) ?? ''}
                  className="min-h-11"
                />
              </FormControl>
              <FormDescription>
                {t('form-wizard:wizard.person_identity.known_as.helper')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={'known_as_ar' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:wizard.person_identity.known_as.label_ar')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={(field.value as string | undefined) ?? ''}
                  dir="rtl"
                  className="min-h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* D-24 #5: photo_url (optional, full-width) */}
      <FormField
        control={form.control}
        name={'photo_url' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form-wizard:wizard.person_identity.photo_url.label')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={(field.value as string | undefined) ?? ''}
                type="url"
                placeholder={t('form-wizard:wizard.person_identity.photo_url.placeholder')}
                className="min-h-11"
              />
            </FormControl>
            <FormDescription>
              {t('form-wizard:wizard.person_identity.photo_url.helper')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* D-24 #6: Nationality — required DossierPicker filtered to country (D-26) */}
      <FormField
        control={form.control}
        name={'nationality_id' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FieldLabelWithHelp
              label={t('form-wizard:wizard.person_identity.nationality.label')}
              required
            />
            <FormControl>
              <DossierPicker
                value={(field.value as string | undefined) ?? undefined}
                onChange={(id): void => field.onChange(id ?? '')}
                filterByDossierType="country"
                placeholder={t('form-wizard:wizard.person_identity.nationality.placeholder')}
              />
            </FormControl>
            <FormDescription>
              {t('form-wizard:wizard.person_identity.nationality.helper')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* D-24 #7: DOB + Gender (both optional) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={'date_of_birth' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:wizard.person_identity.dob.label')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={(field.value as string | undefined) ?? ''}
                  type="date"
                  className="min-h-11"
                />
              </FormControl>
              <FormDescription>
                {t('form-wizard:wizard.person_identity.dob.helper')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={'gender' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:wizard.person_identity.gender.label')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={(field.value as string | undefined) ?? ''}
              >
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue
                      placeholder={t('form-wizard:wizard.person_identity.gender.label')}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="female">
                    {t('form-wizard:wizard.person_identity.gender.female')}
                  </SelectItem>
                  <SelectItem value="male">
                    {t('form-wizard:wizard.person_identity.gender.male')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* D-24 #8 divider */}
      <hr className="border-t" />

      {/* D-24 #9: bilingual description */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={'description_en' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.descriptionEn')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={(field.value as string | undefined) ?? ''}
                  placeholder={t('dossier:form.descriptionEnPlaceholder')}
                  className="min-h-[88px]"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={'description_ar' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.descriptionAr')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={(field.value as string | undefined) ?? ''}
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

      {/* D-24 #10: Tags */}
      <FormField
        control={form.control}
        name={'tags' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('dossier:form.tags')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={(field.value as string | undefined) ?? ''}
                placeholder={t('dossier:form.tagsPlaceholder')}
                className="min-h-11"
              />
            </FormControl>
            <FormDescription>{t('dossier:form.tagsDescription')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* D-24 #11: Classification — sensitivity_level ONLY (D-23: no manual status) */}
      <details className="group rounded-lg border">
        <summary className="flex items-center justify-between p-4 cursor-pointer min-h-11 text-sm font-medium">
          <span>{t('form-wizard:classificationTitle')}</span>
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4 space-y-4">
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
                  value={String(field.value ?? 1)}
                >
                  <FormControl>
                    <SelectTrigger className="min-h-11">
                      <SelectValue placeholder={t('dossier:form.selectSensitivity')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">{t('dossier:sensitivityLevel.1')}</SelectItem>
                    <SelectItem value="2">{t('dossier:sensitivityLevel.2')}</SelectItem>
                    <SelectItem value="3">{t('dossier:sensitivityLevel.3')}</SelectItem>
                    <SelectItem value="4">{t('dossier:sensitivityLevel.4')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>{t('dossier:form.sensitivityDescription')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </details>
    </FormWizardStep>
  )
}
