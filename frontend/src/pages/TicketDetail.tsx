import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from '@tanstack/react-router';
import { SLACountdown } from '../components/SLACountdown';
import { TriagePanel } from '../components/TriagePanel';
import { DuplicateComparison } from '../components/DuplicateComparison';
import { useTicket, useUpdateTicket, useConvertTicket, useCloseTicket } from '../hooks/useIntakeApi';

export function TicketDetail() {
  const { t, i18n } = useTranslation('intake');
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'details' | 'triage' | 'duplicates' | 'history'>('details');

  // Use the proper hooks
  const { data: response, isLoading, error } = useTicket(id || '');
  const ticket = response?.ticket;
  const attachments = response?.attachments || [];

  const updateMutation = useUpdateTicket(id || '');
  const convertMutation = useConvertTicket(id || '');
  const closeMutation = useCloseTicket(id || '');

  const getStatusBadgeColor = (status: string): string => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-200 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      triaged: 'bg-purple-100 text-purple-800',
      assigned: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      converted: 'bg-green-100 text-green-800',
      closed: 'bg-gray-300 text-gray-700',
      merged: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {t('ticketDetail.error', 'Failed to load ticket. Please try again.')}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {ticket.ticket_number}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {i18n.language === 'ar' && ticket.title_ar ? ticket.title_ar : ticket.title}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full ${getStatusBadgeColor(
                ticket.status
              )}`}
            >
              {t(`queue.status.${ticket.status}`)}
            </span>
            <button
              onClick={() => navigate({ to: '/intake/queue' })}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('common.back', 'Back to Queue')}
            </button>
          </div>
        </div>

        {/* SLA Indicators */}
        {ticket.status !== 'closed' && ticket.status !== 'converted' && ticket.submitted_at && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <SLACountdown
              ticketId={ticket.id}
              targetMinutes={ticket.priority === 'urgent' || ticket.priority === 'high' ? 30 : 60}
              eventType="acknowledgment"
              startedAt={ticket.submitted_at}
            />
            <SLACountdown
              ticketId={ticket.id}
              targetMinutes={ticket.priority === 'urgent' || ticket.priority === 'high' ? 480 : 1440}
              eventType="resolution"
              startedAt={ticket.submitted_at}
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex -mb-px">
          {['details', 'triage', 'duplicates', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {t(`ticketDetail.tabs.${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('ticketDetail.requestType', 'Request Type')}
                </label>
                <p className="text-gray-900 dark:text-white">
                  {t(`intake.form.requestType.options.${ticket.request_type}`)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('ticketDetail.urgency', 'Urgency')}
                </label>
                <p className="text-gray-900 dark:text-white">
                  {t(`queue.urgency.${ticket.urgency}`)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('ticketDetail.sensitivity', 'Sensitivity')}
                </label>
                <p className="text-gray-900 dark:text-white capitalize">{ticket.sensitivity}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('ticketDetail.priority', 'Priority')}
                </label>
                <p className="text-gray-900 dark:text-white">
                  {t(`queue.priority.${ticket.priority}`)}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('ticketDetail.description', 'Description')}
              </label>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {i18n.language === 'ar' && ticket.description_ar ? ticket.description_ar : ticket.description}
                </p>
              </div>
            </div>

            {/* Type-Specific Fields */}
            {ticket.type_specific_fields && Object.keys(ticket.type_specific_fields).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('ticketDetail.additionalInfo', 'Additional Information')}
                </label>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                  {Object.entries(ticket.type_specific_fields).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">{key}:</span>
                      <span className="text-gray-900 dark:text-white">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {attachments && attachments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('ticketDetail.attachments', 'Attachments')}
                </label>
                <div className="space-y-2">
                  {attachments.map((attachment: any) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📎</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {attachment.file_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm">
                        {t('common.download', 'Download')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {ticket.status !== 'closed' && ticket.status !== 'converted' && (
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {ticket.status === 'triaged' && (
                  <button
                    onClick={() => {
                      const targetType = window.prompt(t('ticketDetail.convertPrompt', 'Enter target type (dossier/engagement/position):'));
                      if (targetType) {
                        convertMutation.mutate({ targetType: targetType as 'dossier' | 'engagement' | 'position' });
                      }
                    }}
                    disabled={convertMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {t('ticketDetail.convert', 'Convert to Artifact')}
                  </button>
                )}
                <button
                  onClick={() => {
                    const resolution = window.prompt(t('ticketDetail.closePrompt', 'Enter resolution:'));
                    if (resolution) {
                      closeMutation.mutate({
                        resolution,
                        resolutionAr: i18n.language === 'ar' ? resolution : undefined
                      });
                    }
                  }}
                  disabled={closeMutation.isPending}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  {t('ticketDetail.close', 'Close Ticket')}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'triage' && <TriagePanel ticketId={ticket.id} />}

        {activeTab === 'duplicates' && <DuplicateComparison ticketId={ticket.id} />}

        {activeTab === 'history' && (
          <div className="text-gray-600 dark:text-gray-400">
            {t('ticketDetail.historyPlaceholder', 'Audit history will be displayed here')}
          </div>
        )}
      </div>
    </div>
  );
}