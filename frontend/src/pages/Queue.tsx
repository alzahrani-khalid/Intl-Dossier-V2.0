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
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('queue.title', 'Intake Queue')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('queue.subtitle', 'Manage and triage incoming support requests')}
          </p>
        </div>
        <Link
          to="/intake/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          <svg
            className="w-5 h-5 me-2"
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('queue.filters.status', 'Status')}
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('queue.filters.requestType', 'Request Type')}
            </label>
            <select
              value={filters.requestType || ''}
              onChange={(e) => handleFilterChange('requestType', e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('queue.filters.urgency', 'Urgency')}
            </label>
            <select
              value={filters.urgency || ''}
              onChange={(e) => handleFilterChange('urgency', e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('queue.filters.search', 'Search')}
            </label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder={t('queue.filters.searchPlaceholder', 'Search tickets...')}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading', 'Loading...')}</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {t('queue.error', 'Failed to load tickets. Please try again.')}
        </div>
      ) : !data?.tickets || data.tickets.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t('queue.noTickets', 'No tickets found')}
          </p>
        </div>
      ) : (
        <>
          {/* Tickets Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('queue.table.ticketNumber', 'Ticket #')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('queue.table.title', 'Title')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('queue.table.type', 'Type')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('queue.table.priority', 'Priority')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('queue.table.status', 'Status')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('queue.table.sla', 'SLA')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('queue.table.created', 'Created')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data.tickets.map((ticket: IntakeTicket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/intake/tickets/${ticket.id}`}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          {ticket.ticket_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white font-medium">
                          {i18n.language === 'ar' && ticket.title_ar ? ticket.title_ar : ticket.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {t(`intake.form.requestType.options.${ticket.request_type}`)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${getPriorityColor(ticket.priority)}`}>
                          {t(`intake.queue.priority.${ticket.priority}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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