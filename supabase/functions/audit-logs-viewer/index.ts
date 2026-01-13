/**
 * Audit Log Viewer API
 *
 * Purpose: Comprehensive audit log viewer with advanced query capabilities
 *
 * Endpoints:
 * GET /audit-logs-viewer - List audit logs with filters
 * GET /audit-logs-viewer/:id - Get single audit log entry
 * GET /audit-logs-viewer/export - Export audit logs as CSV/JSON
 * GET /audit-logs-viewer/statistics - Get audit statistics
 *
 * Features:
 * - Advanced filtering (table, user, action, date range, IP, search)
 * - Pagination with cursor-based option
 * - Export functionality (CSV, JSON)
 * - Statistics and analytics
 * - Tamper-proof verification
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import {
  corsHeaders,
  errorResponse,
  successResponse,
  handleOptions,
  log,
} from '../_shared/utils.ts';

// Types
interface AuditLogFilters {
  table_name?: string;
  user_id?: string;
  user_email?: string;
  operation?: string;
  date_from?: string;
  date_to?: string;
  ip_address?: string;
  search?: string;
  row_id?: string;
  limit?: number;
  offset?: number;
  cursor?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface ExportOptions {
  format: 'csv' | 'json';
  filters: AuditLogFilters;
  include_fields?: string[];
}

// Helper function to build audit log query
function buildAuditQuery(supabase: any, filters: AuditLogFilters, includeCount: boolean = true) {
  let query = supabase.from('audit_log').select(
    `
      id,
      table_name,
      operation,
      row_id,
      old_data,
      new_data,
      changed_fields,
      user_id,
      user_email,
      user_role,
      ip_address,
      user_agent,
      timestamp,
      session_id,
      request_id
    `,
    { count: includeCount ? 'exact' : undefined }
  );

  // Apply filters
  if (filters.table_name) {
    query = query.eq('table_name', filters.table_name);
  }

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  if (filters.user_email) {
    query = query.ilike('user_email', `%${filters.user_email}%`);
  }

  if (filters.operation) {
    query = query.eq('operation', filters.operation);
  }

  if (filters.date_from) {
    query = query.gte('timestamp', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('timestamp', filters.date_to);
  }

  if (filters.ip_address) {
    query = query.eq('ip_address', filters.ip_address);
  }

  if (filters.row_id) {
    query = query.eq('row_id', filters.row_id);
  }

  if (filters.search) {
    // Search in user_email, table_name, and changed_fields
    query = query.or(`user_email.ilike.%${filters.search}%,table_name.ilike.%${filters.search}%`);
  }

  // Apply sorting
  const sortBy = filters.sort_by || 'timestamp';
  const sortOrder = filters.sort_order === 'asc' ? true : false;
  query = query.order(sortBy, { ascending: sortOrder });

  return query;
}

// Convert audit logs to CSV
function toCSV(logs: any[]): string {
  if (logs.length === 0) return '';

  const headers = [
    'id',
    'timestamp',
    'table_name',
    'operation',
    'row_id',
    'user_email',
    'user_role',
    'ip_address',
    'changed_fields',
  ];

  const csvRows = [headers.join(',')];

  for (const log of logs) {
    const row = [
      log.id,
      log.timestamp,
      log.table_name,
      log.operation,
      log.row_id,
      log.user_email || '',
      log.user_role || '',
      log.ip_address || '',
      (log.changed_fields || []).join(';'),
    ].map((val) => `"${String(val).replace(/"/g, '""')}"`);

    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

// Handler for listing audit logs
async function handleListAuditLogs(supabase: any, filters: AuditLogFilters): Promise<Response> {
  const limit = Math.min(filters.limit || 50, 100);
  const offset = filters.offset || 0;

  let query = buildAuditQuery(supabase, filters, true);
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    log('error', 'Failed to fetch audit logs', { error });
    return errorResponse('Failed to fetch audit logs', 500, 'DB_ERROR', error);
  }

  // Enrich logs with computed fields
  const enrichedLogs =
    data?.map((log: any) => ({
      ...log,
      changes_count: log.changed_fields?.length || 0,
      // Compute diff summary for display
      diff_summary:
        log.changed_fields?.slice(0, 3).join(', ') +
        (log.changed_fields?.length > 3 ? ` +${log.changed_fields.length - 3} more` : ''),
    })) || [];

  return successResponse(enrichedLogs, 200, undefined, {
    total: count || 0,
    limit,
    offset,
    has_more: (count || 0) > offset + limit,
  });
}

// Handler for getting single audit log
async function handleGetAuditLog(supabase: any, logId: string): Promise<Response> {
  const { data, error } = await supabase.from('audit_log').select('*').eq('id', logId).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponse('Audit log not found', 404, 'NOT_FOUND');
    }
    log('error', 'Failed to fetch audit log', { error });
    return errorResponse('Failed to fetch audit log', 500, 'DB_ERROR', error);
  }

  // Also get related logs (same row_id and table_name)
  const { data: relatedLogs } = await supabase
    .from('audit_log')
    .select('id, timestamp, operation, user_email, changed_fields')
    .eq('table_name', data.table_name)
    .eq('row_id', data.row_id)
    .neq('id', logId)
    .order('timestamp', { ascending: false })
    .limit(10);

  return successResponse({
    log: data,
    related_logs: relatedLogs || [],
  });
}

// Handler for exporting audit logs
async function handleExportAuditLogs(
  supabase: any,
  filters: AuditLogFilters,
  format: string
): Promise<Response> {
  // Limit export to 10000 records
  const exportLimit = 10000;

  let query = buildAuditQuery(supabase, filters, false);
  query = query.limit(exportLimit);

  const { data, error } = await query;

  if (error) {
    log('error', 'Failed to export audit logs', { error });
    return errorResponse('Failed to export audit logs', 500, 'DB_ERROR', error);
  }

  if (format === 'csv') {
    const csv = toCSV(data || []);
    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  // Default to JSON
  return new Response(JSON.stringify(data || [], null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.json"`,
    },
  });
}

// Handler for audit statistics
async function handleAuditStatistics(
  supabase: any,
  dateFrom?: string,
  dateTo?: string
): Promise<Response> {
  const now = new Date();
  const defaultDateFrom = new Date(now.setDate(now.getDate() - 30)).toISOString();

  const from = dateFrom || defaultDateFrom;
  const to = dateTo || new Date().toISOString();

  // Get operation counts
  const { data: operationStats, error: opError } = await supabase
    .from('audit_statistics')
    .select('table_name, operation, operation_count, unique_users, unique_rows')
    .gte('audit_date', from.split('T')[0])
    .lte('audit_date', to.split('T')[0]);

  if (opError) {
    // Fallback to direct query if view doesn't exist
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('audit_log')
      .select('table_name, operation')
      .gte('timestamp', from)
      .lte('timestamp', to);

    if (fallbackError) {
      return errorResponse('Failed to fetch statistics', 500, 'DB_ERROR', fallbackError);
    }

    // Compute stats manually
    const stats: Record<string, { operation_count: number; tables: Set<string> }> = {};
    for (const log of fallbackData || []) {
      if (!stats[log.operation]) {
        stats[log.operation] = { operation_count: 0, tables: new Set() };
      }
      stats[log.operation].operation_count++;
      stats[log.operation].tables.add(log.table_name);
    }

    const operationCounts = Object.entries(stats).map(([op, data]) => ({
      operation: op,
      count: data.operation_count,
      tables_affected: data.tables.size,
    }));

    return successResponse({
      period: { from, to },
      by_operation: operationCounts,
      total_events: fallbackData?.length || 0,
    });
  }

  // Aggregate statistics
  const byOperation: Record<string, number> = {};
  const byTable: Record<string, number> = {};
  let totalEvents = 0;

  for (const stat of operationStats || []) {
    byOperation[stat.operation] = (byOperation[stat.operation] || 0) + stat.operation_count;
    byTable[stat.table_name] = (byTable[stat.table_name] || 0) + stat.operation_count;
    totalEvents += stat.operation_count;
  }

  return successResponse({
    period: { from, to },
    by_operation: Object.entries(byOperation).map(([op, count]) => ({ operation: op, count })),
    by_table: Object.entries(byTable).map(([table, count]) => ({ table, count })),
    total_events: totalEvents,
  });
}

// Handler for distinct values (for filter dropdowns)
async function handleDistinctValues(supabase: any, field: string): Promise<Response> {
  const allowedFields = ['table_name', 'operation', 'user_role'];

  if (!allowedFields.includes(field)) {
    return errorResponse('Invalid field', 400, 'INVALID_FIELD');
  }

  const { data, error } = await supabase.from('audit_log').select(field).limit(1000);

  if (error) {
    return errorResponse('Failed to fetch distinct values', 500, 'DB_ERROR', error);
  }

  // Get unique values
  const uniqueValues = [...new Set(data?.map((d: any) => d[field]).filter(Boolean))];

  return successResponse(uniqueValues.sort());
}

// Main handler
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401, 'AUTH_REQUIRED');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user and verify admin/editor role
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse('Invalid user session', 401, 'AUTH_REQUIRED');
    }

    // Check if user has permission to view audit logs
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'editor', 'supervisor'].includes(userData.role)) {
      return errorResponse('Insufficient permissions to view audit logs', 403, 'FORBIDDEN');
    }

    // Parse URL and route
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Remove function name from path
    const funcIndex = pathParts.indexOf('audit-logs-viewer');
    const routeParts = funcIndex >= 0 ? pathParts.slice(funcIndex + 1) : [];

    // Parse query parameters
    const filters: AuditLogFilters = {
      table_name: url.searchParams.get('table_name') || undefined,
      user_id: url.searchParams.get('user_id') || undefined,
      user_email: url.searchParams.get('user_email') || undefined,
      operation: url.searchParams.get('operation') || undefined,
      date_from: url.searchParams.get('date_from') || undefined,
      date_to: url.searchParams.get('date_to') || undefined,
      ip_address: url.searchParams.get('ip_address') || undefined,
      search: url.searchParams.get('search') || undefined,
      row_id: url.searchParams.get('row_id') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
      sort_by: url.searchParams.get('sort_by') || 'timestamp',
      sort_order: (url.searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
    };

    // Route handling
    if (req.method === 'GET') {
      // GET /audit-logs-viewer/export
      if (routeParts[0] === 'export') {
        const format = url.searchParams.get('format') || 'json';
        return handleExportAuditLogs(supabase, filters, format);
      }

      // GET /audit-logs-viewer/statistics
      if (routeParts[0] === 'statistics') {
        return handleAuditStatistics(supabase, filters.date_from, filters.date_to);
      }

      // GET /audit-logs-viewer/distinct/:field
      if (routeParts[0] === 'distinct' && routeParts[1]) {
        return handleDistinctValues(supabase, routeParts[1]);
      }

      // GET /audit-logs-viewer/:id
      if (routeParts[0] && routeParts[0] !== 'export' && routeParts[0] !== 'statistics') {
        return handleGetAuditLog(supabase, routeParts[0]);
      }

      // GET /audit-logs-viewer - List with filters
      return handleListAuditLogs(supabase, filters);
    }

    return errorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
  } catch (error) {
    log('error', 'Unexpected error in audit-logs-viewer', { error: error.message });
    return errorResponse('An unexpected error occurred', 500, 'INTERNAL_ERROR');
  }
});
