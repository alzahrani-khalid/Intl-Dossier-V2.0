import { useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from '@tanstack/react-router';
import { SLACountdown } from '../components/SLACountdown';
import { TriagePanel } from '../components/TriagePanel';
import { DuplicateComparison } from '../components/DuplicateComparison';
import { useTicket, useUpdateTicket, useConvertTicket, useCloseTicket } from '../hooks/useIntakeApi';

// Lazy load EntityLinkManager for performance (Task T049)
const EntityLinkManager = lazy(() => import('../components/entity-links/EntityLinkManager'));

export function TicketDetail() {
 const { t, i18n } = useTranslation('intake');
 const { id } = useParams({ strict: false });
 const navigate = useNavigate();
 const [activeTab, setActiveTab] = useState<'details' | 'triage' | 'duplicates' | 'history' | 'links'>('details');

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
 <div className="py-12 text-center">
 <div className="inline-block size-12 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white"></div>
 <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading', 'Loading...')}</p>
 </div>
 </div>
 );
 }

 if (error || !ticket) {
 return (
 <div className="container mx-auto px-4 py-8">
 <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
 {t('ticketDetail.error', 'Failed to load ticket. Please try again.')}
 </div>
 </div>
 );
 }

 return (
 <div className="container mx-auto px-4 py-8" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
 {/* Header */}
 <div className="mb-6">
 <div className="mb-4 flex items-center justify-between">
 <div>
 <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
 {ticket.ticket_number}
 </h1>
 <p className="text-gray-600 dark:text-gray-400">
 {i18n.language === 'ar' && ticket.title_ar ? ticket.title_ar : ticket.title}
 </p>
 </div>
 <div className="flex items-center gap-3">
 <span
 className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${getStatusBadgeColor(
 ticket.status
 )}`}
 >
 {t(`queue.status.${ticket.status}`)}
 </span>
 <button
 onClick={() => navigate({ to: '/intake/queue' })}
 className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
 >
 {t('common.back', 'Back to Queue')}
 </button>
 </div>
 </div>

 {/* SLA Indicators */}
 {ticket.status !== 'closed' && ticket.status !== 'converted' && ticket.submitted_at && (
 <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
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
 <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
 <nav className="-mb-px flex">
 {['details', 'triage', 'duplicates', 'history', 'links'].map((tab) => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab as typeof activeTab)}
 className={`border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
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
 <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
 {activeTab === 'details' && (
 <div className="space-y-6">
 {/* Basic Information */}
 <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
 {t('ticketDetail.requestType', 'Request Type')}
 </label>
 <p className="text-gray-900 dark:text-white">
 {t(`form.requestType.options.${ticket.requestType}`)}
 </p>
 </div>
 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
 {t('ticketDetail.urgency', 'Urgency')}
 </label>
 <p className="text-gray-900 dark:text-white">
 {t(`queue.urgency.${ticket.urgency}`)}
 </p>
 </div>
 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
 {t('ticketDetail.sensitivity', 'Sensitivity')}
 </label>
 <p className="capitalize text-gray-900 dark:text-white">{ticket.sensitivity}</p>
 </div>
 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
 {t('ticketDetail.priority', 'Priority')}
 </label>
 <p className="text-gray-900 dark:text-white">
 {t(`queue.priority.${ticket.priority}`)}
 </p>
 </div>
 </div>

 {/* Description */}
 <div>
 <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
 {t('ticketDetail.description', 'Description')}
 </label>
 <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
 <p className="whitespace-pre-wrap text-gray-900 dark:text-white">
 {i18n.language === 'ar' && ticket.description_ar ? ticket.description_ar : ticket.description}
 </p>
 </div>
 </div>

 {/* Type-Specific Fields */}
 {ticket.type_specific_fields && Object.keys(ticket.type_specific_fields).length > 0 && (
 <div>
 <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
 {t('ticketDetail.additionalInfo', 'Additional Information')}
 </label>
 <div className="space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
 {Object.entries(ticket.type_specific_fields).map(([key, value]) => (
 <div key={key} className="flex justify-between">
 <span className="capitalize text-gray-600 dark:text-gray-400">{key}:</span>
 <span className="text-gray-900 dark:text-white">{String(value)}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Attachments */}
 {attachments && attachments.length > 0 && (
 <div>
 <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
 {t('ticketDetail.attachments', 'Attachments')}
 </label>
 <div className="space-y-2">
 {attachments.map((attachment: any) => (
 <div
 key={attachment.id}
 className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-900"
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
 <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
 {t('common.download', 'Download')}
 </button>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Actions */}
 {ticket.status !== 'closed' && ticket.status !== 'converted' && (
 <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
 {ticket.status === 'triaged' && (
 <button
 onClick={() => {
 const targetType = window.prompt(t('ticketDetail.convertPrompt', 'Enter target type (dossier/engagement/position):'));
 if (targetType) {
 convertMutation.mutate({ targetType: targetType as 'dossier' | 'engagement' | 'position' });
 }
 }}
 disabled={convertMutation.isPending}
 className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
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
 className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
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

 {activeTab === 'links' && (
 <Suspense
 fallback={
 <div className="flex items-center justify-center py-12">
 <div className="inline-block size-12 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white"></div>
 <p className="ms-4 text-gray-600 dark:text-gray-400">{t('common.loading', 'Loading...')}</p>
 </div>
 }
 >
 <EntityLinkManager
 intakeId={ticket.id}
 organizationId={ticket.organization_id}
 classificationLevel={ticket.classification_level || 0}
 canRestore={false} // TODO: Check user role for steward+ permission
 enableReorder={true}
 />
 </Suspense>
 )}
 </div>
 </div>
 );
}