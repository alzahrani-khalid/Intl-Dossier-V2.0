/** BasicInfoStep — Step 1: names, abbreviation, descriptions, duplicate detection. */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react'

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getDossierRouteSegment } from '@/lib/dossier-routes'
import { useDossierNameSimilarity } from '@/hooks/useDossierNameSimilarity'
import type { DossierType } from '@/services/dossier-api'
import type { BasicInfoStepProps } from './Shared'

export default function BasicInfoStep({
  form,
  formValues,
  selectedType,
  direction,
  isRTL,
  updateDraft,
  onAIGenerate,
  currentStep,
}: BasicInfoStepProps): ReactElement {
  const { t } = useTranslation(['dossier', 'form-wizard', 'contextual-help'])

  const {
    similarDossiers,
    isChecking: isCheckingDuplicates,
    hasHighSimilarity,
    hasMediumSimilarity,
    highestMatch,
  } = useDossierNameSimilarity(formValues.name_en || '', formValues.name_ar, {
    type: selectedType as DossierType | undefined,
    threshold: 0.4,
    enabled: currentStep === 1 && (formValues.name_en?.length || 0) >= 3,
  })

  return (
    <FormWizardStep stepId="basic" className="space-y-4">
      {/* AI Field Assist */}
      {selectedType && (
        <AIFieldAssist
          dossierType={selectedType as DossierType}
          onGenerate={onAIGenerate}
          className="mb-2"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* English Name */}
        <FormField
          control={form.control}
          name="name_en"
          render={({ field }) => (
            <FormItem>
              <FieldLabelWithHelp
                label={t('dossier:form.nameEn')}
                required
                helpProps={{
                  tooltip: t('contextual-help:dossier.nameEn.tooltip'),
                  title: t('contextual-help:dossier.nameEn.title'),
                  description: t('contextual-help:dossier.nameEn.description'),
                  formatRequirements: t('contextual-help:dossier.nameEn.formatRequirements', {
                    returnObjects: true,
                  }) as string[],
                  mode: 'both',
                }}
              />
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('dossier:form.nameEnPlaceholder')}
                  className="min-h-11"
                  onChange={(e) => {
                    field.onChange(e)
                    updateDraft({ name_en: e.target.value })
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Arabic Name */}
        <FormField
          control={form.control}
          name="name_ar"
          render={({ field }) => (
            <FormItem>
              <FieldLabelWithHelp
                label={t('dossier:form.nameAr')}
                required
                helpProps={{
                  tooltip: t('contextual-help:dossier.nameAr.tooltip'),
                  title: t('contextual-help:dossier.nameAr.title'),
                  description: t('contextual-help:dossier.nameAr.description'),
                  formatRequirements: t('contextual-help:dossier.nameAr.formatRequirements', {
                    returnObjects: true,
                  }) as string[],
                  mode: 'both',
                }}
              />
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('dossier:form.nameArPlaceholder')}
                  className="min-h-11"
                  dir={direction}
                  onChange={(e) => {
                    field.onChange(e)
                    updateDraft({ name_ar: e.target.value })
                  }}
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
        name="abbreviation"
        render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>{t('dossier:form.abbreviation')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t('dossier:form.abbreviationPlaceholder')}
                className="min-h-11 uppercase"
                maxLength={20}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase()
                  field.onChange(value)
                  updateDraft({ abbreviation: value })
                }}
              />
            </FormControl>
            <FormDescription>{t('dossier:form.abbreviationDescription')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Duplicate Detection Warning */}
      {(isCheckingDuplicates || similarDossiers.length > 0) && (
        <div className="mt-4">
          {isCheckingDuplicates && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('dossier:create.checkingDuplicates', 'Checking for similar dossiers...')}
            </div>
          )}

          {!isCheckingDuplicates && hasHighSimilarity && highestMatch && (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {t(
                  'dossier:create.duplicateWarning.highSimilarity.title',
                  'Potential Duplicate Detected',
                )}
              </AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  {t('dossier:create.duplicateWarning.highSimilarity.description', {
                    similarity: Math.round(highestMatch.highest_similarity * 100),
                    name: isRTL ? highestMatch.name_ar : highestMatch.name_en,
                    type: t(`dossier:type.${highestMatch.type}`),
                  }) ||
                    `A ${highestMatch.type} with ${Math.round(highestMatch.highest_similarity * 100)}% similar name already exists: "${isRTL ? highestMatch.name_ar : highestMatch.name_en}"`}
                </p>
                <a
                  href={`/dossiers/${getDossierRouteSegment(highestMatch.type as DossierType)}/${highestMatch.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm underline"
                >
                  {t('dossier:create.duplicateWarning.viewExisting', 'View existing dossier')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </AlertDescription>
            </Alert>
          )}

          {!isCheckingDuplicates &&
            !hasHighSimilarity &&
            hasMediumSimilarity &&
            similarDossiers.length > 0 && (
              <Alert className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                <AlertTitle className="text-yellow-700 dark:text-yellow-400">
                  {t(
                    'dossier:create.duplicateWarning.mediumSimilarity.title',
                    'Similar Dossiers Found',
                  )}
                </AlertTitle>
                <AlertDescription className="text-yellow-600 dark:text-yellow-300">
                  <p className="mb-2">
                    {t('dossier:create.duplicateWarning.mediumSimilarity.description', {
                      count: similarDossiers.length,
                    }) ||
                      `${similarDossiers.length} dossier(s) with similar names were found. Please verify this is not a duplicate.`}
                  </p>
                  <ul className="list-disc ps-5 space-y-1 text-sm">
                    {similarDossiers.slice(0, 3).map((d) => (
                      <li key={d.id}>
                        <a
                          href={`/dossiers/${getDossierRouteSegment(d.type as DossierType)}/${d.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-yellow-800 dark:hover:text-yellow-200"
                        >
                          {isRTL ? d.name_ar : d.name_en}
                        </a>{' '}
                        ({Math.round(d.highest_similarity * 100)}%{' '}
                        {t('dossier:create.duplicateWarning.match', 'match')})
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* English Description */}
        <FormField
          control={form.control}
          name="description_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dossier:form.descriptionEn')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t('dossier:form.descriptionEnPlaceholder')}
                  className="min-h-[88px]"
                  rows={3}
                  onChange={(e) => {
                    field.onChange(e)
                    updateDraft({ description_en: e.target.value })
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Arabic Description */}
        <FormField
          control={form.control}
          name="description_ar"
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
                  onChange={(e) => {
                    field.onChange(e)
                    updateDraft({ description_ar: e.target.value })
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormWizardStep>
  )
}
