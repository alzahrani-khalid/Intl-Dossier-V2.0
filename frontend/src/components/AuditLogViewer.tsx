/**
 * Audit Log Viewer Component
 * Purpose: Display audit trail on ticket detail page (FR-009)
 *
 * Features:
 * - Timeline view of events (newest first)
 * - Expand/collapse for before/after diffs
 * - Filter by event type
 * - Bilingual event descriptions
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Filter,
  Shield,
  FileEdit,
  UserPlus,
  GitMerge,
  XCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: Record<string, { old: any; new: any }>;
  mfa_required: boolean;
  mfa_verified: boolean;
  mfa_method?: string;
  ip_address?: string;
}

interface AuditLogViewerProps {
  ticketId: string;
  className?: string;
}

const EVENT_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  create: FileEdit,
  update: FileEdit,
  triage: Filter,
  assign: UserPlus,
  convert: GitMerge,
  merge: GitMerge,
  close: XCircle,
  mfa_verify: Shield,
};

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  ticketId,
  className = '',
}) => {
  const { t, i18n } = useTranslation('intake');
  const isRTL = i18n.language === 'ar';

  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [filterEventType, setFilterEventType] = useState<string>('all');

  // Fetch audit logs
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', ticketId, filterEventType],
    queryFn: async () => {
      const url = new URL('/intake/audit-logs', window.location.origin);
      url.searchParams.set('ticket_id', ticketId);
      if (filterEventType !== 'all') {
        url.searchParams.set('event_type', filterEventType);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      return response.json();
    },
  });

  const logs = data?.logs || [];

  // Filter event types from logs
  const eventTypes = useMemo(() => {
    const types = new Set(logs.map((log: AuditLogEntry) => log.action));
    return ['all', ...Array.from(types)];
  }, [logs]);

  const toggleExpand = (logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getEventIcon = (action: string) => {
    const IconComponent = EVENT_ICONS[action] || Clock;
    return <IconComponent size={18} />;
  };

  const getEventColor = (action: string): string => {
    if (action.includes('create')) return 'text-green-600 bg-green-100';
    if (action.includes('update')) return 'text-blue-600 bg-blue-100';
    if (action.includes('delete') || action.includes('close'))
      return 'text-red-600 bg-red-100';
    if (action.includes('assign')) return 'text-purple-600 bg-purple-100';
    if (action.includes('merge') || action.includes('convert'))
      return 'text-orange-600 bg-orange-100';
    return 'text-gray-600 bg-gray-100';
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-3 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 ${className}`}
      >
        {t('audit.error')}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-500 ${className}`}
      >
        {t('audit.no_logs')}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter */}
      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Filter size={18} className="text-gray-400" />
        <select
          value={filterEventType}
          onChange={(e) => setFilterEventType(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {t(`audit.event_types.${type}`, type)}
            </option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      <div className="relative space-y-4">
        {/* Timeline line */}
        <div
          className={`absolute ${
            isRTL ? 'right-4' : 'left-4'
          } top-0 h-full w-0.5 bg-gray-200`}
        />

        {/* Log entries */}
        {logs.map((log: AuditLogEntry) => {
          const isExpanded = expandedLogs.has(log.id);
          const hasChanges = Object.keys(log.changes).length > 0;
          const eventColor = getEventColor(log.action);

          return (
            <div
              key={log.id}
              className={`relative ${
                isRTL ? 'pe-12 ps-0' : 'pe-0 ps-12'
              }`}
            >
              {/* Event icon */}
              <div
                className={`absolute ${
                  isRTL ? 'right-0' : 'left-0'
                } flex size-8 items-center justify-center rounded-full ${eventColor}`}
              >
                {getEventIcon(log.action)}
              </div>

              {/* Event card */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                {/* Header */}
                <div
                  className={`flex items-start justify-between gap-2 ${
                    isRTL ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">
                        {t(`audit.actions.${log.action}`, log.action)}
                      </h4>
                      {log.mfa_verified && (
                        <Shield size={14} className="text-green-600" title={t('audit.mfa_verified')} />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                      <User size={14} />
                      <span>{log.user_role}</span>
                      <Clock size={14} className={isRTL ? 'me-2' : 'ms-2'} />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div>

                  {/* Expand button */}
                  {hasChanges && (
                    <button
                      onClick={() => toggleExpand(log.id)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      aria-label={isExpanded ? t('audit.collapse') : t('audit.expand')}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  )}
                </div>

                {/* Changes (expanded) */}
                {isExpanded && hasChanges && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    {Object.entries(log.changes).map(([field, { old: oldValue, new: newValue }]) => (
                      <div
                        key={field}
                        className="rounded-md bg-gray-50 p-2 text-sm"
                      >
                        <div className="font-medium text-gray-700">
                          {t(`audit.fields.${field}`, field)}
                        </div>
                        <div className="mt-1 flex items-start gap-2">
                          <div className="flex-1">
                            <div className="text-xs text-gray-500">
                              {t('audit.before')}:
                            </div>
                            <div className="mt-0.5 rounded bg-red-50 px-2 py-1 text-red-800">
                              {JSON.stringify(oldValue)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-500">
                              {t('audit.after')}:
                            </div>
                            <div className="mt-0.5 rounded bg-green-50 px-2 py-1 text-green-800">
                              {JSON.stringify(newValue)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};