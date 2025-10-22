import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { IntakeFormData, RequestType, Urgency } from '../types/intake';
import { TypeSpecificFields } from './TypeSpecificFields';
import { AttachmentUploader } from './AttachmentUploader';
import { useCreateTicket, useGetSLAPreview } from '../hooks/useIntakeApi';

// Validation schema
const createIntakeSchema = (t: any) =>
  z.object({
    requestType: z.enum(['engagement', 'position', 'mou_action', 'foresight'], {
      required_error: t('intake.form.requestType.required'),
    }),
    title: z
      .string()
      .min(3, t('intake.form.title.minLength'))
      .max(200, t('intake.form.title.maxLength')),
    titleAr: z.string().max(200, t('intake.form.title.maxLength')).optional(),
    description: z
      .string()
      .min(10, t('intake.form.description.minLength'))
      .max(5000, t('intake.form.description.maxLength')),
    descriptionAr: z
      .string()
      .max(5000, t('intake.form.description.maxLength'))
      .optional(),
    urgency: z.enum(['low', 'medium', 'high', 'critical'], {
      required_error: t('intake.form.urgency.required'),
    }),
    dossierId: z.string().uuid().optional(),
    typeSpecificFields: z.record(z.any()).optional(),
    attachmentIds: z.array(z.string().uuid()).optional(),
  });

interface IntakeFormProps {
  initialData?: Partial<IntakeFormData>;
  mode?: 'create' | 'edit';
  onSuccess?: (ticketId: string, ticketNumber: string) => void;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({
  initialData,
  mode = 'create',
  onSuccess,
}) => {
  const { t, i18n } = useTranslation('intake');
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<{
    id: string;
    ticketNumber: string;
  } | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<IntakeFormData>({
    resolver: zodResolver(createIntakeSchema(t)),
    defaultValues: initialData || {
      requestType: 'engagement',
      urgency: 'medium',
    },
  });

  const requestType = watch('requestType');
  const urgency = watch('urgency');

  // API hooks
  const createTicketMutation = useCreateTicket();
  const { data: slaPreview } = useGetSLAPreview(urgency);

  // Handle form submission
  const onSubmit = async (data: IntakeFormData) => {
    try {
      const payload = {
        ...data,
        attachments: attachmentIds,
      };

      const result = await createTicketMutation.mutateAsync(payload);

      setCreatedTicket({
        id: result.id,
        ticketNumber: result.ticketNumber,
      });
      setShowSuccess(true);

      if (onSuccess) {
        onSuccess(result.id, result.ticketNumber);
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  // Handle attachment uploads
  const handleAttachmentsChange = (newAttachmentIds: string[]) => {
    setAttachmentIds(newAttachmentIds);
    setValue('attachmentIds', newAttachmentIds);
  };

  // Success modal
  if (showSuccess && createdTicket) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="size-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              {t('intake.success.title')}
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              {t('intake.success.message', { ticketNumber: createdTicket.ticketNumber })}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => navigate({ to: `/intake/tickets/${createdTicket.id}` })}
                className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                {t('intake.success.viewTicket')}
              </button>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  setCreatedTicket(null);
                  reset();
                  setAttachmentIds([]);
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              >
                {t('intake.success.createAnother')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="rounded-lg bg-white p-6 shadow">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">{t('intake.title')}</h1>
          <p className="text-sm text-gray-600">{t('intake.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Request Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('intake.form.requestType.label')}
              <span className="ms-1 text-red-500">*</span>
            </label>
            <select
              {...register('requestType')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('intake.form.requestType.placeholder')}</option>
              <option value="engagement">
                {t('intake.form.requestType.options.engagement')}
              </option>
              <option value="position">
                {t('intake.form.requestType.options.position')}
              </option>
              <option value="mou_action">
                {t('intake.form.requestType.options.mou_action')}
              </option>
              <option value="foresight">
                {t('intake.form.requestType.options.foresight')}
              </option>
            </select>
            {errors.requestType && (
              <p className="mt-1 text-sm text-red-600">{errors.requestType.message}</p>
            )}
          </div>

          {/* Title (English) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('intake.form.title.label')}
              <span className="ms-1 text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder={t('intake.form.title.placeholder')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Title (Arabic) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('intake.form.titleAr.label')}
            </label>
            <input
              type="text"
              {...register('titleAr')}
              placeholder={t('intake.form.titleAr.placeholder')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="rtl"
            />
            {errors.titleAr && (
              <p className="mt-1 text-sm text-red-600">{errors.titleAr.message}</p>
            )}
          </div>

          {/* Description (English) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('intake.form.description.label')}
              <span className="ms-1 text-red-500">*</span>
            </label>
            <textarea
              {...register('description')}
              placeholder={t('intake.form.description.placeholder')}
              rows={5}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Description (Arabic) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('intake.form.descriptionAr.label')}
            </label>
            <textarea
              {...register('descriptionAr')}
              placeholder={t('intake.form.descriptionAr.placeholder')}
              rows={5}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="rtl"
            />
            {errors.descriptionAr && (
              <p className="mt-1 text-sm text-red-600">{errors.descriptionAr.message}</p>
            )}
          </div>

          {/* Urgency Level */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('intake.form.urgency.label')}
              <span className="ms-1 text-red-500">*</span>
            </label>
            <select
              {...register('urgency')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('intake.form.urgency.placeholder')}</option>
              <option value="low">{t('intake.form.urgency.options.low')}</option>
              <option value="medium">{t('intake.form.urgency.options.medium')}</option>
              <option value="high">{t('intake.form.urgency.options.high')}</option>
              <option value="critical">{t('intake.form.urgency.options.critical')}</option>
            </select>
            {errors.urgency && (
              <p className="mt-1 text-sm text-red-600">{errors.urgency.message}</p>
            )}
          </div>

          {/* Type-Specific Fields */}
          {requestType && (
            <TypeSpecificFields
              requestType={requestType}
              value={watch('typeSpecificFields')}
              onChange={(fields) => setValue('typeSpecificFields', fields)}
            />
          )}

          {/* Attachments */}
          <AttachmentUploader
            attachmentIds={attachmentIds}
            onChange={handleAttachmentsChange}
            maxFileSize={25 * 1024 * 1024} // 25MB
            maxTotalSize={100 * 1024 * 1024} // 100MB
          />

          {/* SLA Preview */}
          {slaPreview && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 text-sm font-medium text-blue-900">
                {t('intake.slaPreview.title')}
              </h3>
              <div className="space-y-1 text-sm text-blue-700">
                <p>
                  {t('intake.slaPreview.acknowledgment')}: {slaPreview.acknowledgmentMinutes}{' '}
                  {t('intake.slaPreview.minutes')}
                </p>
                <p>
                  {t('intake.slaPreview.resolution')}: {slaPreview.resolutionHours}{' '}
                  {t('intake.slaPreview.hours')}
                </p>
                {slaPreview.businessHoursOnly && (
                  <p className="text-xs">{t('intake.slaPreview.businessHours')}</p>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {createTicketMutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{t('intake.error.message')}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={() => navigate({ to: '/intake' })}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t('intake.actions.cancel')}
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t('intake.actions.reset')}
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('requestType', 'engagement');
                setValue('title', 'New Partnership with ExampleCorp');
                setValue('titleAr', 'شراكة جديدة مع شركة المثال');
                setValue(
                  'description',
                  'Initial discussion for a strategic partnership with ExampleCorp to expand our market reach in the new region. This involves exploring potential joint ventures and co-marketing opportunities.'
                );
                setValue(
                  'descriptionAr',
                  'مناقشة أولية لشراكة استراتيجية مع شركة المثال لتوسيع نطاق وصولنا إلى السوق في المنطقة الجديدة. يتضمن ذلك استكشاف المشاريع المشتركة المحتملة وفرص التسويق المشترك.'
                );
                setValue('urgency', 'high');
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t('intake.actions.fillMock')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="size-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t('intake.actions.submitting')}
                </span>
              ) : (
                t('intake.actions.submit')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};