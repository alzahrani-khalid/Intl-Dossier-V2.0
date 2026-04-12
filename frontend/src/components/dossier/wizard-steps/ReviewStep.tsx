/** ReviewStep — Step 4: read-only summary before submission. */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { FormWizardStep } from '@/components/ui/form-wizard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { DossierType } from '@/services/dossier-api'
import type { ReviewStepProps } from './Shared'
import { typeIcons } from './Shared'
export default function ReviewStep({
  formValues,
  selectedType,
  direction,
  isRTL,
  organizingBodyName,
}: ReviewStepProps): ReactElement {
  const { t } = useTranslation(['dossier'])

  return (
    <FormWizardStep stepId="review" className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedType &&
              (() => {
                const Icon = typeIcons[selectedType as DossierType]
                return Icon ? <Icon className="h-5 w-5 text-primary" /> : null
              })()}
            <CardTitle className="text-lg">
              {formValues.abbreviation && (
                <span className="text-muted-foreground me-2">({formValues.abbreviation})</span>
              )}
              {isRTL ? formValues.name_ar : formValues.name_en}
            </CardTitle>
            <Badge variant="outline" className="ms-auto">
              {selectedType && t(`dossier:type.${selectedType}`)}
            </Badge>
          </div>
          {(formValues.description_en || formValues.description_ar) && (
            <CardDescription>
              {isRTL ? formValues.description_ar : formValues.description_en}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t('dossier:form.nameEn')}</p>
              <p className="font-medium">{formValues.name_en || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('dossier:form.nameAr')}</p>
              <p className="font-medium" dir={direction}>
                {formValues.name_ar || '-'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t('dossier:form.status')}</p>
              <Badge variant="outline">{t(`dossier:status.${formValues.status}`)}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">{t('dossier:form.sensitivityLevel')}</p>
              <Badge variant="outline">
                {t(`dossier:sensitivityLevel.${formValues.sensitivity_level}`)}
              </Badge>
            </div>
          </div>

          {/* Person review */}
          {selectedType === 'person' && formValues.extension_data?.title_en && (
            <>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('dossier:form.person.titleEn')}</p>
                  <p className="font-medium">{formValues.extension_data.title_en}</p>
                </div>
                {formValues.extension_data.title_ar && (
                  <div>
                    <p className="text-muted-foreground">{t('dossier:form.person.titleAr')}</p>
                    <p className="font-medium" dir={direction}>
                      {formValues.extension_data.title_ar}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Country review */}
          {selectedType === 'country' && formValues.extension_data?.iso_code_2 && (
            <>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('dossier:field.isoCode')}</p>
                  <p className="font-medium uppercase">
                    {formValues.extension_data.iso_code_2} / {formValues.extension_data.iso_code_3}
                  </p>
                </div>
                {formValues.extension_data.region && (
                  <div>
                    <p className="text-muted-foreground">{t('dossier:field.region')}</p>
                    <p className="font-medium">{formValues.extension_data.region}</p>
                  </div>
                )}
                {formValues.extension_data.capital_en && (
                  <div>
                    <p className="text-muted-foreground">{t('dossier:field.capital')}</p>
                    <p className="font-medium">{formValues.extension_data.capital_en}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Organization review */}
          {selectedType === 'organization' && formValues.extension_data?.org_type && (
            <>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('dossier:form.organization.type')}</p>
                  <Badge variant="outline" className="capitalize">
                    {formValues.extension_data.org_type}
                  </Badge>
                </div>
                {formValues.extension_data.org_code && (
                  <div>
                    <p className="text-muted-foreground">{t('dossier:form.organization.code')}</p>
                    <p className="font-medium">{formValues.extension_data.org_code}</p>
                  </div>
                )}
                {formValues.extension_data.website && (
                  <div>
                    <p className="text-muted-foreground">
                      {t('dossier:form.organization.website')}
                    </p>
                    <p className="font-medium text-primary truncate">
                      {formValues.extension_data.website}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Engagement review */}
          {selectedType === 'engagement' && formValues.extension_data?.engagement_type && (
            <>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('dossier:form.engagement.type')}</p>
                  <Badge variant="outline" className="capitalize">
                    {formValues.extension_data.engagement_type?.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('dossier:form.engagement.category')}</p>
                  <Badge variant="outline" className="capitalize">
                    {formValues.extension_data.engagement_category}
                  </Badge>
                </div>
              </div>
              {(formValues.extension_data.location_en || formValues.extension_data.location_ar) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
                  {formValues.extension_data.location_en && (
                    <div>
                      <p className="text-muted-foreground">
                        {t('dossier:form.engagement.locationEn')}
                      </p>
                      <p className="font-medium">{formValues.extension_data.location_en}</p>
                    </div>
                  )}
                  {formValues.extension_data.location_ar && (
                    <div>
                      <p className="text-muted-foreground">
                        {t('dossier:form.engagement.locationAr')}
                      </p>
                      <p className="font-medium" dir={direction}>
                        {formValues.extension_data.location_ar}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Forum review */}
          {selectedType === 'forum' &&
            formValues.extension_data?.organizing_body_id &&
            organizingBodyName && (
              <>
                <Separator />
                <div className="text-sm">
                  <p className="text-muted-foreground">{t('dossier:form.forum.organizingBody')}</p>
                  <p className="font-medium">{organizingBodyName}</p>
                </div>
              </>
            )}

          {/* Topic review */}
          {selectedType === 'topic' && formValues.extension_data?.theme_category && (
            <>
              <Separator />
              <div className="text-sm">
                <p className="text-muted-foreground">{t('dossier:form.topic.category')}</p>
                <Badge variant="outline">
                  {t(`dossier:form.topic.categories.${formValues.extension_data.theme_category}`)}
                </Badge>
              </div>
            </>
          )}

          {/* Working Group review */}
          {selectedType === 'working_group' && (
            <>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {formValues.extension_data?.wg_status && (
                  <div>
                    <p className="text-muted-foreground">{t('dossier:form.workingGroup.status')}</p>
                    <Badge variant="outline" className="capitalize">
                      {t(
                        `dossier:form.workingGroup.statuses.${formValues.extension_data.wg_status}`,
                      )}
                    </Badge>
                  </div>
                )}
                {formValues.extension_data?.established_date && (
                  <div>
                    <p className="text-muted-foreground">
                      {t('dossier:form.workingGroup.establishedDate')}
                    </p>
                    <p className="font-medium">{formValues.extension_data.established_date}</p>
                  </div>
                )}
              </div>
              {(formValues.extension_data?.mandate_en || formValues.extension_data?.mandate_ar) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
                  {formValues.extension_data.mandate_en && (
                    <div>
                      <p className="text-muted-foreground">
                        {t('dossier:form.workingGroup.mandateEn')}
                      </p>
                      <p className="font-medium line-clamp-3">
                        {formValues.extension_data.mandate_en}
                      </p>
                    </div>
                  )}
                  {formValues.extension_data.mandate_ar && (
                    <div>
                      <p className="text-muted-foreground">
                        {t('dossier:form.workingGroup.mandateAr')}
                      </p>
                      <p className="font-medium line-clamp-3" dir={direction}>
                        {formValues.extension_data.mandate_ar}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </FormWizardStep>
  )
}
