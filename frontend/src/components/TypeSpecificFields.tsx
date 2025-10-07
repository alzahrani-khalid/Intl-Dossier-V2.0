import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  RequestType,
  EngagementFields,
  PositionFields,
  MouActionFields,
  ForesightFields,
} from '../types/intake';

interface TypeSpecificFieldsProps {
  requestType: RequestType;
  value?: Record<string, any>;
  onChange: (fields: Record<string, any>) => void;
}

export const TypeSpecificFields: React.FC<TypeSpecificFieldsProps> = ({
  requestType,
  value = {},
  onChange,
}) => {
  const { t, i18n } = useTranslation('intake');
  const isRTL = i18n.language === 'ar';

  const handleFieldChange = (fieldName: string, fieldValue: any) => {
    onChange({
      ...value,
      [fieldName]: fieldValue,
    });
  };

  // Render engagement-specific fields
  const renderEngagementFields = () => (
    <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-gray-200">
      <h3 className="text-sm font-medium text-gray-900">
        {t('intake.form.requestType.options.engagement')} - {t('intake.typeSpecific.engagement.title', 'Additional Information')}
      </h3>

      {/* Partner Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('intake.typeSpecific.engagement.partnerName.label')}
        </label>
        <input
          type="text"
          value={value.partnerName || ''}
          onChange={(e) => handleFieldChange('partnerName', e.target.value)}
          placeholder={t('intake.typeSpecific.engagement.partnerName.placeholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Collaboration Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('intake.typeSpecific.engagement.collaborationType.label')}
        </label>
        <select
          value={value.collaborationType || ''}
          onChange={(e) => handleFieldChange('collaborationType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select type...</option>
          <option value="technical">
            {t('intake.typeSpecific.engagement.collaborationType.options.technical')}
          </option>
          <option value="data_sharing">
            {t('intake.typeSpecific.engagement.collaborationType.options.data_sharing')}
          </option>
          <option value="capacity_building">
            {t('intake.typeSpecific.engagement.collaborationType.options.capacity_building')}
          </option>
          <option value="other">
            {t('intake.typeSpecific.engagement.collaborationType.options.other')}
          </option>
        </select>
      </div>

      {/* Expected Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('intake.typeSpecific.engagement.expectedDuration.label')}
        </label>
        <input
          type="text"
          value={value.expectedDuration || ''}
          onChange={(e) => handleFieldChange('expectedDuration', e.target.value)}
          placeholder={t('intake.typeSpecific.engagement.expectedDuration.placeholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  // Render position-specific fields
  const renderPositionFields = () => (
    <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-gray-200">
      <h3 className="text-sm font-medium text-gray-900">
        {t('intake.form.requestType.options.position')} - {t('intake.typeSpecific.position.title', 'Additional Information')}
      </h3>

      {/* Position Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('intake.typeSpecific.position.positionTitle.label')}
        </label>
        <input
          type="text"
          value={value.positionTitle || ''}
          onChange={(e) => handleFieldChange('positionTitle', e.target.value)}
          placeholder={t('intake.typeSpecific.position.positionTitle.placeholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Department */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('intake.typeSpecific.position.department.label')}
        </label>
        <input
          type="text"
          value={value.department || ''}
          onChange={(e) => handleFieldChange('department', e.target.value)}
          placeholder={t('intake.typeSpecific.position.department.placeholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Required Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('intake.typeSpecific.position.requiredSkills.label')}
        </label>
        <textarea
          value={value.requiredSkills || ''}
          onChange={(e) => handleFieldChange('requiredSkills', e.target.value)}
          placeholder={t('intake.typeSpecific.position.requiredSkills.placeholder')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  // Render MoU action-specific fields
  const renderMouActionFields = () => (
    <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-gray-200">
      <h3 className="text-sm font-medium text-gray-900">
        {t('intake.form.requestType.options.mou_action')} - {t('intake.typeSpecific.mou_action.title', 'Additional Information')}
      </h3>

      {/* MoU Reference */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('intake.typeSpecific.mou_action.mouReference.label')}
        </label>
        <input
          type="text"
          value={value.mouReference || ''}
          onChange={(e) => handleFieldChange('mouReference', e.target.value)}
          placeholder={t('intake.typeSpecific.mou_action.mouReference.placeholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Action Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('intake.typeSpecific.mou_action.actionType.label')}
        </label>
        <select
          value={value.actionType || ''}
          onChange={(e) => handleFieldChange('actionType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select action type...</option>
          <option value="review">
            {t('intake.typeSpecific.mou_action.actionType.options.review')}
          </option>
          <option value="amendment">
            {t('intake.typeSpecific.mou_action.actionType.options.amendment')}
          </option>
          <option value="renewal">
            {t('intake.typeSpecific.mou_action.actionType.options.renewal')}
          </option>
          <option value="termination">
            {t('intake.typeSpecific.mou_action.actionType.options.termination')}
          </option>
        </select>
      </div>

      {/* Deadline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('intake.typeSpecific.mou_action.deadline.label')}
        </label>
        <input
          type="date"
          value={value.deadline || ''}
          onChange={(e) => handleFieldChange('deadline', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  // Render foresight-specific fields
  const renderForesightFields = () => (
    <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-gray-200">
      <h3 className="text-sm font-medium text-gray-900">
        {t('intake.form.requestType.options.foresight')} - {t('intake.typeSpecific.foresight.title', 'Additional Information')}
      </h3>

      {/* Topic */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('intake.typeSpecific.foresight.topic.label')}
        </label>
        <input
          type="text"
          value={value.topic || ''}
          onChange={(e) => handleFieldChange('topic', e.target.value)}
          placeholder={t('intake.typeSpecific.foresight.topic.placeholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Time Horizon */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('intake.typeSpecific.foresight.timeHorizon.label')}
        </label>
        <select
          value={value.timeHorizon || ''}
          onChange={(e) => handleFieldChange('timeHorizon', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select time horizon...</option>
          <option value="short">
            {t('intake.typeSpecific.foresight.timeHorizon.options.short')}
          </option>
          <option value="medium">
            {t('intake.typeSpecific.foresight.timeHorizon.options.medium')}
          </option>
          <option value="long">
            {t('intake.typeSpecific.foresight.timeHorizon.options.long')}
          </option>
        </select>
      </div>

      {/* Stakeholders */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('intake.typeSpecific.foresight.stakeholders.label')}
        </label>
        <textarea
          value={value.stakeholders || ''}
          onChange={(e) => handleFieldChange('stakeholders', e.target.value)}
          placeholder={t('intake.typeSpecific.foresight.stakeholders.placeholder')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  // Render appropriate fields based on request type
  switch (requestType) {
    case 'engagement':
      return renderEngagementFields();
    case 'position':
      return renderPositionFields();
    case 'mou_action':
      return renderMouActionFields();
    case 'foresight':
      return renderForesightFields();
    default:
      return null;
  }
};