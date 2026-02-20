import React from 'react'
import { useTranslation } from 'react-i18next'
import { RequestType } from '../types/intake'

interface TypeSpecificFieldsProps {
  requestType: RequestType
  value?: Record<string, any>
  onChange: (fields: Record<string, any>) => void
}

export const TypeSpecificFields: React.FC<TypeSpecificFieldsProps> = ({
  requestType,
  value = {},
  onChange,
}) => {
  const { t, i18n } = useTranslation('intake')
  const _isRTL = i18n.language === 'ar'

  const handleFieldChange = (fieldName: string, fieldValue: any) => {
    onChange({
      ...value,
      [fieldName]: fieldValue,
    })
  }

  // Render engagement-specific fields
  const renderEngagementFields = () => (
    <div className="space-y-4 rounded-md border border-border bg-muted p-4">
      <h3 className="text-sm font-medium text-foreground">
        {t('form.requestType.options.engagement')} -{' '}
        {t('typeSpecific.engagement.title', 'Additional Information')}
      </h3>

      {/* Partner Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('typeSpecific.engagement.partnerName.label')}
        </label>
        <input
          type="text"
          value={value.partnerName || ''}
          onChange={(e) => handleFieldChange('partnerName', e.target.value)}
          placeholder={t('typeSpecific.engagement.partnerName.placeholder')}
          className="w-full rounded-field border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
        />
      </div>

      {/* Collaboration Type (Multi-select) */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('typeSpecific.engagement.collaborationType.label')}
          <span className="ms-1 text-xs font-normal text-muted-foreground">
            (
            {t('typeSpecific.engagement.collaborationType.selectMultiple', 'Select all that apply')}
            )
          </span>
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            {
              value: 'technical',
              label: t('typeSpecific.engagement.collaborationType.options.technical'),
            },
            {
              value: 'data_sharing',
              label: t('typeSpecific.engagement.collaborationType.options.data_sharing'),
            },
            {
              value: 'capacity_building',
              label: t('typeSpecific.engagement.collaborationType.options.capacity_building'),
            },
            { value: 'other', label: t('typeSpecific.engagement.collaborationType.options.other') },
          ].map((option) => {
            const selectedTypes = value.collaborationTypes || []
            const isChecked = selectedTypes.includes(option.value)
            return (
              <label
                key={option.value}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors ${
                  isChecked
                    ? 'border-primary bg-primary/10'
                    : 'border-input bg-transparent hover:border-muted-foreground/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...selectedTypes, option.value]
                      : selectedTypes.filter((t: string) => t !== option.value)
                    handleFieldChange('collaborationTypes', newTypes)
                  }}
                  className="size-4 rounded border-input text-primary accent-primary focus:ring-ring"
                />
                <span className="text-sm text-muted-foreground">{option.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Expected Duration */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('typeSpecific.engagement.expectedDuration.label')}
        </label>
        <input
          type="text"
          value={value.expectedDuration || ''}
          onChange={(e) => handleFieldChange('expectedDuration', e.target.value)}
          placeholder={t('typeSpecific.engagement.expectedDuration.placeholder')}
          className="w-full rounded-field border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
        />
      </div>
    </div>
  )

  // Render position-specific fields
  const renderPositionFields = () => (
    <div className="space-y-4 rounded-md border border-border bg-muted p-4">
      <h3 className="text-sm font-medium text-foreground">
        {t('form.requestType.options.position')} -{' '}
        {t('typeSpecific.position.title', 'Additional Information')}
      </h3>

      {/* Position Title */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('typeSpecific.position.positionTitle.label')}
        </label>
        <input
          type="text"
          value={value.positionTitle || ''}
          onChange={(e) => handleFieldChange('positionTitle', e.target.value)}
          placeholder={t('typeSpecific.position.positionTitle.placeholder')}
          className="w-full rounded-field border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
        />
      </div>

      {/* Department */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('typeSpecific.position.department.label')}
        </label>
        <input
          type="text"
          value={value.department || ''}
          onChange={(e) => handleFieldChange('department', e.target.value)}
          placeholder={t('typeSpecific.position.department.placeholder')}
          className="w-full rounded-field border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
        />
      </div>

      {/* Required Skills */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('typeSpecific.position.requiredSkills.label')}
        </label>
        <textarea
          value={value.requiredSkills || ''}
          onChange={(e) => handleFieldChange('requiredSkills', e.target.value)}
          placeholder={t('typeSpecific.position.requiredSkills.placeholder')}
          rows={3}
          className="w-full rounded-field border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
        />
      </div>
    </div>
  )

  // Render MoU action-specific fields
  const renderMouActionFields = () => (
    <div className="space-y-4 rounded-md border border-border bg-muted p-4">
      <h3 className="text-sm font-medium text-foreground">
        {t('form.requestType.options.mou_action')} -{' '}
        {t('typeSpecific.mou_action.title', 'Additional Information')}
      </h3>

      {/* MoU Reference */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('typeSpecific.mou_action.mouReference.label')}
        </label>
        <input
          type="text"
          value={value.mouReference || ''}
          onChange={(e) => handleFieldChange('mouReference', e.target.value)}
          placeholder={t('typeSpecific.mou_action.mouReference.placeholder')}
          className="w-full rounded-field border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
        />
      </div>

      {/* Action Type */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('typeSpecific.mou_action.actionType.label')}
        </label>
        <select
          value={value.actionType || ''}
          onChange={(e) => handleFieldChange('actionType', e.target.value)}
          className="w-full rounded-field border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
        >
          <option value="">Select action type...</option>
          <option value="review">{t('typeSpecific.mou_action.actionType.options.review')}</option>
          <option value="amendment">
            {t('typeSpecific.mou_action.actionType.options.amendment')}
          </option>
          <option value="renewal">{t('typeSpecific.mou_action.actionType.options.renewal')}</option>
          <option value="termination">
            {t('typeSpecific.mou_action.actionType.options.termination')}
          </option>
        </select>
      </div>

      {/* Deadline */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('typeSpecific.mou_action.deadline.label')}
        </label>
        <input
          type="date"
          value={value.deadline || ''}
          onChange={(e) => handleFieldChange('deadline', e.target.value)}
          className="w-full rounded-field border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
        />
      </div>
    </div>
  )

  // Render foresight-specific fields
  const renderForesightFields = () => (
    <div className="space-y-4 rounded-md border border-border bg-muted p-4">
      <h3 className="text-sm font-medium text-foreground">
        {t('form.requestType.options.foresight')} -{' '}
        {t('typeSpecific.foresight.title', 'Additional Information')}
      </h3>

      {/* Topic */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('typeSpecific.foresight.topic.label')}
        </label>
        <input
          type="text"
          value={value.topic || ''}
          onChange={(e) => handleFieldChange('topic', e.target.value)}
          placeholder={t('typeSpecific.foresight.topic.placeholder')}
          className="w-full rounded-field border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
        />
      </div>

      {/* Time Horizon */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('typeSpecific.foresight.timeHorizon.label')}
        </label>
        <select
          value={value.timeHorizon || ''}
          onChange={(e) => handleFieldChange('timeHorizon', e.target.value)}
          className="w-full rounded-field border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
        >
          <option value="">Select time horizon...</option>
          <option value="short">{t('typeSpecific.foresight.timeHorizon.options.short')}</option>
          <option value="medium">{t('typeSpecific.foresight.timeHorizon.options.medium')}</option>
          <option value="long">{t('typeSpecific.foresight.timeHorizon.options.long')}</option>
        </select>
      </div>

      {/* Stakeholders */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('typeSpecific.foresight.stakeholders.label')}
        </label>
        <textarea
          value={value.stakeholders || ''}
          onChange={(e) => handleFieldChange('stakeholders', e.target.value)}
          placeholder={t('typeSpecific.foresight.stakeholders.placeholder')}
          rows={3}
          className="w-full rounded-field border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
        />
      </div>
    </div>
  )

  // Render appropriate fields based on request type
  switch (requestType) {
    case 'engagement':
      return renderEngagementFields()
    case 'position':
      return renderPositionFields()
    case 'mou_action':
      return renderMouActionFields()
    case 'foresight':
      return renderForesightFields()
    default:
      return null
  }
}
