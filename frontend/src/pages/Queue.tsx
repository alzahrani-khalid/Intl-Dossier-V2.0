import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { SLACountdown } from '../components/SLACountdown';
import { useTicketList } from '../hooks/useIntakeApi';
import type { IntakeTicket } from '../types/intake';

interface QueueFilters {
 status?: string;
 requestType?: string;
 sensitivity?: string;
 urgency?: string;
 assignedUnit?: string;
 search?: string;
}

export function Queue() {
 const { t, i18n } = useTranslation('intake');
 const [filters, setFilters] = useState<QueueFilters>({});
 const [page, setPage] = useState(1);
 const pageSize = 25;

 // Fetch tickets with filters using the TanStack Query hook
 const { data, isLoading, error } = useTicketList({
 status: filters.status,
 requestType: filters.requestType,
 sensitivity: filters.sensitivity,
 urgency: filters.urgency,
 assignedUnit: filters.assignedUnit,
 page,
 limit: pageSize,
 });

 const handleFilterChange = (key: keyof QueueFilters, value: string) => {
 setFilters((prev) => ({
 ...prev,
 [key]: value || undefined,
 }));
 setPage(1); // Reset to first page when filters change
 };

 const clearFilters = () => {
 setFilters({});
 setPage(1);
 };

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

 const getPriorityColor = (priority: string): string => {
 const colors: Record<string, string> = {
 low: 'text-green-600',
 medium: 'text-yellow-600',
 high: 'text-orange-600',
 urgent: 'text-red-600',
 };
 return colors[priority] || 'text-gray-600';
 };

 return (
 <div className="container mx-auto px-4 py-8" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
 {/* Header */}
 <div className="mb-6 flex items-start justify-between">
 <div>
 <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
 {t('queue.title', 'Intake Queue')}
 </h1>
 <p className="text-gray-600 dark:text-gray-400">
 {t('queue.subtitle', 'Manage and triage incoming support requests')}
 </p>
 </div>
 <Link
 to="/intake/new"
 className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
 >
 <svg
 className="me-2 size-5"
 fill="none"
 stroke="currentColor"
 viewBox="0 0 24 24"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M12 4v16m8-8H4"
 />
 </svg>
 {t('queue.createTicket', 'Create New Ticket')}
 </Link>
 </div>

 {/* Filters */}
 <div className="mb-6 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
 <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
 {/* Status Filter */}
 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
 {t('queue.filters.status', 'Status')}
 </label>
 <select
 value={filters.status || ''}
 onChange={(e) => handleFilterChange('status', e.target.value)}
 className="w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
 >
 <option value="">{t('queue.filters.all', 'All')}</option>
 <option value="submitted">{t('queue.status.submitted', 'Submitted')}</option>
 <option value="triaged">{t('queue.status.triaged', 'Triaged')}</option>
 <option value="assigned">{t('queue.status.assigned', 'Assigned')}</option>
 <option value="in_progress">{t('queue.status.in_progress', 'In Progress')}</option>
 </select>
 </div>

 {/* Request Type Filter */}
 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
 {t('queue.filters.requestType', 'Request Type')}
 </label>
 <select
 value={filters.requestType || ''}
 onChange={(e) => handleFilterChange('requestType', e.target.value)}
 className="w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
 >
 <option value="">{t('queue.filters.all', 'All')}</option>
 <option value="engagement">{t('intake.form.requestType.options.engagement')}</option>
 <option value="position">{t('intake.form.requestType.options.position')}</option>
 <option value="mou_action">{t('intake.form.requestType.options.mou_action')}</option>
 <option value="foresight">{t('intake.form.requestType.options.foresight')}</option>
 </select>
 </div>

 {/* Urgency Filter */}
 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
 {t('queue.filters.urgency', 'Urgency')}
 </label>
 <select
 value={filters.urgency || ''}
 onChange={(e) => handleFilterChange('urgency', e.target.value)}
 className="w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
 >
 <option value="">{t('queue.filters.all', 'All')}</option>
 <option value="low">{t('queue.urgency.low', 'Low')}</option>
 <option value="medium">{t('queue.urgency.medium', 'Medium')}</option>
 <option value="high">{t('queue.urgency.high', 'High')}</option>
 <option value="critical">{t('queue.urgency.critical', 'Critical')}</option>
 </select>
 </div>

 {/* Search */}
 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
 {t('queue.filters.search', 'Search')}
 </label>
 <input
 type="text"
 value={filters.search || ''}
 onChange={(e) => handleFilterChange('search', e.target.value)}
 placeholder={t('queue.filters.searchPlaceholder', 'Search tickets...')}
 className="w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
 />
 </div>
 </div>

 {/* Clear Filters Button */}
 {Object.keys(filters).length > 0 && (
 <button
 onClick={clearFilters}
 className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
 >
 {t('queue.filters.clear', 'Clear all filters')}
 </button>
 )}
 </div>

 {/* Tickets List */}
 {isLoading ? (
 <div className="py-12 text-center">
 <div className="inline-block size-12 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white"></div>
 <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading', 'Loading...')}</p>
 </div>
 ) : error ? (
 <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
 {t('queue.error', 'Failed to load tickets. Please try again.')}
 </div>
 ) : !data?.tickets || data.tickets.length === 0 ? (
 <div className="rounded-lg bg-gray-50 p-12 text-center dark:bg-gray-800">
 <p className="text-lg text-gray-600 dark:text-gray-400">
 {t('queue.noTickets', 'No tickets found')}
 </p>
 </div>
 ) : (
 <>
 {/* Tickets Table */}
 <div className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800">
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
 <thead className="bg-gray-50 dark:bg-gray-900">
 <tr>
 <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
 {t('queue.table.ticketNumber', 'Ticket #')}
 </th>
 <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
 {t('queue.table.title', 'Title')}
 </th>
 <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
 {t('queue.table.type', 'Type')}
 </th>
 <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
 {t('queue.table.priority', 'Priority')}
 </th>
 <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
 {t('queue.table.status', 'Status')}
 </th>
 <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
 {t('queue.table.sla', 'SLA')}
 </th>
 <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
 {t('queue.table.created', 'Created')}
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
 {data.tickets.map((ticket: IntakeTicket) => (
 <tr
 key={ticket.id}
 className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
 >
 <td className="whitespace-nowrap px-6 py-4">
 <Link
 to={`/intake/tickets/${ticket.id}`}
 className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
 >
 {ticket.ticket_number}
 </Link>
 </td>
 <td className="px-6 py-4">
 <div className="text-sm font-medium text-gray-900 dark:text-white">
 {i18n.language === 'ar' && ticket.title_ar ? ticket.title_ar : ticket.title}
 </div>
 </td>
 <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
 {t(`intake.form.requestType.options.${ticket.request_type}`)}
 </td>
 <td className="whitespace-nowrap px-6 py-4">
 <span className={`text-sm font-semibold ${getPriorityColor(ticket.priority)}`}>
 {t(`intake.queue.priority.${ticket.priority}`)}
 </span>
 </td>
 <td className="whitespace-nowrap px-6 py-4">
 <span
 className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 ${getStatusBadgeColor(
 ticket.status
 )}`}
 >
 {t(`intake.queue.status.${ticket.status}`)}
 </span>
 </td>
 <td className="px-6 py-4">
 {ticket.status !== 'closed' && ticket.status !== 'converted' && ticket.submitted_at && (
 <SLACountdown
 ticketId={ticket.id}
 targetMinutes={ticket.priority === 'urgent' || ticket.priority === 'high' ? 480 : 1440}
 eventType="resolution"
 startedAt={ticket.submitted_at}
 className="max-w-xs"
 />
 )}
 </td>
 <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
 {new Date(ticket.created_at).toLocaleDateString(i18n.language)}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Pagination */}
 {data.total_pages > 1 && (
 <div className="mt-6 flex items-center justify-between">
 <div className="text-sm text-gray-600 dark:text-gray-400">
 {t('queue.pagination.showing', 'Showing')} {(page - 1) * pageSize + 1} -{' '}
 {Math.min(page * pageSize, data.total_count)} {t('queue.pagination.of', 'of')}{' '}
 {data.total_count} {t('queue.pagination.tickets', 'tickets')}
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => setPage((p) => Math.max(1, p - 1))}
 disabled={page === 1}
 className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
 >
 {t('queue.pagination.previous', 'Previous')}
 </button>
 <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
 {t('queue.pagination.page', 'Page')} {page} {t('queue.pagination.of', 'of')}{' '}
 {data.total_pages}
 </span>
 <button
 onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
 disabled={page === data.total_pages}
 className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
 >
 {t('queue.pagination.next', 'Next')}
 </button>
 </div>
 </div>
 )}
 </>
 )}
 </div>
 );
}