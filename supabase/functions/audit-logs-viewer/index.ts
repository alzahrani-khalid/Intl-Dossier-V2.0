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
 * - Advanced filtering (entity type, user, action, date range, IP, search)
 * - Pagination with cursor-based option
 * - Export functionality (CSV, JSON)
 * - Statistics and analytics
 *
 * Column contract (Phase 93 / AUDIT-42703, D-14):
 * `public.audit_log` really has
 *   id, tenant_id, entity_type, entity_id, action, user_id, timestamp,
 *   old_values, new_values, ip_address, user_agent, session_id, additional_context
 * The handler previously queried table_name/operation/row_id/old_data/new_data/
 * changed_fields/user_email/user_role/request_id — none of which exist — so every
 * route returned a 42703-driven 500. The DB side is now the real columns; the
 * WIRE names the frontend already consumes (AuditLogEntry in
 * frontend/src/types/audit-log.types.ts) are preserved via PostgREST select
 * aliases so no client change is required.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { successResponse, log, corsHeaders } from '../_shared/utils.ts'
import { getCorsHeaders } from '../_shared/cors.ts'

// Types
interface AuditLogFilters {
  table_name?: string
  user_id?: string
  user_email?: string
  operation?: string
  date_from?: string
  date_to?: string
  ip_address?: string
  search?: string
  row_id?: string
  limit?: number
  offset?: number
  cursor?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

/**
 * Client-facing error envelope (D-15).
 *
 * Bilingual message + stable code ONLY. The PostgREST/Postgres error object is
 * never echoed: its `message` names internal columns (this surface used to ship
 * `column audit_log.table_name does not exist` to the browser) and its `code` is
 * a raw SQLSTATE. Diagnostics go to the function log instead.
 *
 * Shape is the flat house contract read by frontend/src/lib/api-client.ts
 * (`message` ?? `message_en` ?? `error`).
 */
function errorEnvelope(
  status: number,
  code: string,
  messageEn: string,
  messageAr: string,
  diagnostic?: unknown,
): Response {
  if (diagnostic !== undefined) {
    log('error', `audit-logs-viewer: ${code}`, { diagnostic })
  }

  return new Response(
    JSON.stringify({ error: messageEn, code, message_en: messageEn, message_ar: messageAr }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  )
}

// External (wire) field name -> real audit_log column, aliased in every select so
// the response shape the frontend reads is unchanged.
const LOG_SELECT = `
      id,
      table_name:entity_type,
      operation:action,
      row_id:entity_id,
      old_data:old_values,
      new_data:new_values,
      user_id,
      ip_address,
      user_agent,
      timestamp,
      session_id
    `

// sort_by is client-supplied. Whitelist it and map to a real column, so a bad
// value is a clean 400 rather than another 42703 500. `user_email` is deliberately
// absent: it lives in public.users, not on audit_log, so it cannot be ordered on.
const SORTABLE_FIELDS: Record<string, string> = {
  timestamp: 'timestamp',
  table_name: 'entity_type',
  operation: 'action',
  row_id: 'entity_id',
  user_id: 'user_id',
  ip_address: 'ip_address',
}

// Fields exposed by GET /distinct/:field, mapped to real columns.
const DISTINCT_FIELDS: Record<string, string> = {
  table_name: 'entity_type',
  operation: 'action',
}

// PostgREST `or()` is a comma/paren-delimited grammar — a raw search term
// containing those characters corrupts the filter string.
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()*]/g, ' ').trim()
}

/**
 * user_email is not a column of audit_log. Resolve the pattern to user ids
 * against public.users so email filtering/search stays functional instead of
 * silently matching nothing.
 *
 * Returns null when the lookup itself failed (caller surfaces a 500).
 */
async function resolveUserIdsByEmail(supabase: any, pattern: string): Promise<string[] | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .ilike('email', `%${pattern}%`)
    .limit(500)

  if (error) {
    log('error', 'Failed to resolve user ids by email', { error })
    return null
  }

  return (data || []).map((u: any) => u.id)
}

/**
 * Attach user_email / user_role to audit rows. audit_log has no declared FK to
 * public.users, so a PostgREST embed is not available — this is a second query
 * keyed on the page's distinct user_ids.
 *
 * Enrichment is best-effort: audit rows are the payload, and a users-table
 * failure degrades the two derived fields to null (logged) rather than 500-ing
 * the whole listing.
 */
async function attachUsers(supabase: any, rows: any[]): Promise<any[]> {
  const ids = [...new Set(rows.map((r) => r?.user_id).filter(Boolean))]

  if (ids.length === 0) {
    return rows.map((r) => ({ ...r, user_email: null, user_role: null }))
  }

  const { data, error } = await supabase.from('users').select('id, email, role').in('id', ids)

  if (error) {
    log('error', 'Failed to resolve audit users', { error })
  }

  const byId = new Map<string, { email: string | null; role: string | null }>(
    (data || []).map((u: any) => [u.id, u]),
  )

  return rows.map((r) => ({
    ...r,
    user_email: byId.get(r?.user_id)?.email ?? null,
    user_role: byId.get(r?.user_id)?.role ?? null,
  }))
}

// Helper function to build audit log query
function buildAuditQuery(
  supabase: any,
  filters: AuditLogFilters,
  includeCount: boolean = true,
  emailUserIds?: string[] | null,
) {
  let query = supabase
    .from('audit_log')
    .select(LOG_SELECT, { count: includeCount ? 'exact' : undefined })

  // Apply filters
  if (filters.table_name) {
    query = query.eq('entity_type', filters.table_name)
  }

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id)
  }

  if (filters.user_email) {
    // Empty match list is meaningful: no user matched, so no audit row can.
    query = query.in('user_id', emailUserIds || [])
  }

  if (filters.operation) {
    query = query.eq('action', filters.operation)
  }

  if (filters.date_from) {
    query = query.gte('timestamp', filters.date_from)
  }

  if (filters.date_to) {
    query = query.lte('timestamp', filters.date_to)
  }

  if (filters.ip_address) {
    query = query.eq('ip_address', filters.ip_address)
  }

  if (filters.row_id) {
    query = query.eq('entity_id', filters.row_id)
  }

  if (filters.search) {
    // Search across entity_type/action, plus any user whose email matched.
    const term = sanitizeSearchTerm(filters.search)
    const clauses = [`entity_type.ilike.%${term}%`, `action.ilike.%${term}%`]
    if (emailUserIds && emailUserIds.length > 0) {
      clauses.push(`user_id.in.(${emailUserIds.join(',')})`)
    }
    query = query.or(clauses.join(','))
  }

  // Apply sorting (whitelisted above)
  const sortBy = SORTABLE_FIELDS[filters.sort_by || 'timestamp']
  const sortOrder = filters.sort_order === 'asc' ? true : false
  query = query.order(sortBy, { ascending: sortOrder })

  return query
}

// Convert audit logs to CSV
function toCSV(logs: any[]): string {
  if (logs.length === 0) return ''

  const headers = [
    'id',
    'timestamp',
    'table_name',
    'operation',
    'row_id',
    'user_email',
    'user_role',
    'ip_address',
  ]

  const csvRows = [headers.join(',')]

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
    ].map((val) => `"${String(val).replace(/"/g, '""')}"`)

    csvRows.push(row.join(','))
  }

  return csvRows.join('\n')
}

/**
 * Resolve the user-id list an email filter/search needs, if any.
 * Returns `undefined` when no email lookup is required, `null` when it failed.
 */
async function resolveEmailFilter(
  supabase: any,
  filters: AuditLogFilters,
): Promise<string[] | null | undefined> {
  const pattern = filters.user_email || (filters.search ? sanitizeSearchTerm(filters.search) : '')
  if (!pattern) return undefined
  return await resolveUserIdsByEmail(supabase, pattern)
}

// Handler for listing audit logs
async function handleListAuditLogs(supabase: any, filters: AuditLogFilters): Promise<Response> {
  const limit = Math.min(filters.limit || 50, 100)
  const offset = filters.offset || 0

  const emailUserIds = await resolveEmailFilter(supabase, filters)
  if (emailUserIds === null) {
    return errorEnvelope(
      500,
      'DB_ERROR',
      'Failed to fetch audit logs',
      'فشل في جلب سجلات التدقيق',
      'user email resolution failed',
    )
  }

  let query = buildAuditQuery(supabase, filters, true, emailUserIds)
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return errorEnvelope(
      500,
      'DB_ERROR',
      'Failed to fetch audit logs',
      'فشل في جلب سجلات التدقيق',
      error,
    )
  }

  const enrichedLogs = await attachUsers(supabase, data || [])

  return successResponse(enrichedLogs, 200, undefined, {
    total: count || 0,
    limit,
    offset,
    has_more: (count || 0) > offset + limit,
  })
}

// Handler for getting single audit log
async function handleGetAuditLog(supabase: any, logId: string): Promise<Response> {
  const { data, error } = await supabase
    .from('audit_log')
    .select(LOG_SELECT)
    .eq('id', logId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return errorEnvelope(404, 'NOT_FOUND', 'Audit log not found', 'سجل التدقيق غير موجود')
    }
    return errorEnvelope(
      500,
      'DB_ERROR',
      'Failed to fetch audit log',
      'فشل في جلب سجل التدقيق',
      error,
    )
  }

  // Also get related logs (same entity)
  const { data: relatedLogs } = await supabase
    .from('audit_log')
    .select('id, timestamp, operation:action, user_id')
    .eq('entity_type', data.table_name)
    .eq('entity_id', data.row_id)
    .neq('id', logId)
    .order('timestamp', { ascending: false })
    .limit(10)

  const [enrichedLog, ...enrichedRelated] = await attachUsers(supabase, [
    data,
    ...(relatedLogs || []),
  ])

  return successResponse({
    log: enrichedLog,
    related_logs: enrichedRelated,
  })
}

// Handler for exporting audit logs
async function handleExportAuditLogs(
  supabase: any,
  filters: AuditLogFilters,
  format: string,
): Promise<Response> {
  // Limit export to 10000 records
  const exportLimit = 10000

  const emailUserIds = await resolveEmailFilter(supabase, filters)
  if (emailUserIds === null) {
    return errorEnvelope(
      500,
      'DB_ERROR',
      'Failed to export audit logs',
      'فشل في تصدير سجلات التدقيق',
      'user email resolution failed',
    )
  }

  let query = buildAuditQuery(supabase, filters, false, emailUserIds)
  query = query.limit(exportLimit)

  const { data, error } = await query

  if (error) {
    return errorEnvelope(
      500,
      'DB_ERROR',
      'Failed to export audit logs',
      'فشل في تصدير سجلات التدقيق',
      error,
    )
  }

  const rows = await attachUsers(supabase, data || [])

  if (format === 'csv') {
    const csv = toCSV(rows)
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  }

  // Default to JSON
  return new Response(JSON.stringify(rows, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}

/**
 * Handler for audit statistics.
 *
 * D-26: statistics are aggregated in-function from audit_log rows over the date
 * range. There is no pre-aggregated view backing this route.
 */
async function handleAuditStatistics(
  supabase: any,
  dateFrom?: string,
  dateTo?: string,
): Promise<Response> {
  const now = new Date()
  const defaultDateFrom = new Date(now.setDate(now.getDate() - 30)).toISOString()

  const from = dateFrom || defaultDateFrom
  const to = dateTo || new Date().toISOString()

  const { data, error } = await supabase
    .from('audit_log')
    .select('entity_type, action')
    .gte('timestamp', from)
    .lte('timestamp', to)

  if (error) {
    return errorEnvelope(
      500,
      'DB_ERROR',
      'Failed to fetch statistics',
      'فشل في جلب الإحصائيات',
      error,
    )
  }

  // Compute stats manually
  const stats: Record<string, { operation_count: number; tables: Set<string> }> = {}
  for (const row of data || []) {
    if (!stats[row.action]) {
      stats[row.action] = { operation_count: 0, tables: new Set() }
    }
    stats[row.action].operation_count++
    stats[row.action].tables.add(row.entity_type)
  }

  const operationCounts = Object.entries(stats).map(([op, d]) => ({
    operation: op,
    count: d.operation_count,
    tables_affected: d.tables.size,
  }))

  return successResponse({
    period: { from, to },
    by_operation: operationCounts,
    total_events: data?.length || 0,
  })
}

// Handler for distinct values (for filter dropdowns)
async function handleDistinctValues(supabase: any, field: string): Promise<Response> {
  const column = DISTINCT_FIELDS[field]

  if (!column) {
    return errorEnvelope(
      400,
      'INVALID_FIELD',
      `Unsupported field. Allowed: ${Object.keys(DISTINCT_FIELDS).join(', ')}`,
      `حقل غير مدعوم. المسموح: ${Object.keys(DISTINCT_FIELDS).join(', ')}`,
    )
  }

  const { data, error } = await supabase.from('audit_log').select(column).limit(1000)

  if (error) {
    return errorEnvelope(
      500,
      'DB_ERROR',
      'Failed to fetch distinct values',
      'فشل في جلب القيم المميزة',
      error,
    )
  }

  // Get unique values
  const uniqueValues = [...new Set(data?.map((d: any) => d[column]).filter(Boolean))]

  return successResponse(uniqueValues.sort())
}

// Main handler
async function handleRequest(req: Request, corsHeaders: Record<string, string>) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorEnvelope(
        401,
        'AUTH_REQUIRED',
        'Missing authorization header',
        'ترويسة التفويض مفقودة',
      )
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    )

    // Get current user and verify admin role
    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return errorEnvelope(401, 'AUTH_REQUIRED', 'Invalid user session', 'جلسة المستخدم غير صالحة')
    }

    // Check if user has permission to view audit logs. Gated to admin + super_admin to
    // match the route guard (requireAdmin) and the Sidebar admin-nav, which both accept
    // both roles — so a super_admin who can open the page also gets data, not a 403.
    // Role is read from public.users.role (the single authorization truth).
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return errorEnvelope(
        403,
        'FORBIDDEN',
        'Insufficient permissions to view audit logs',
        'صلاحيات غير كافية لعرض سجلات التدقيق',
      )
    }

    // Parse URL and route
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)

    // Remove function name from path
    const funcIndex = pathParts.indexOf('audit-logs-viewer')
    const routeParts = funcIndex >= 0 ? pathParts.slice(funcIndex + 1) : []

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
    }

    if (!SORTABLE_FIELDS[filters.sort_by || 'timestamp']) {
      return errorEnvelope(
        400,
        'INVALID_SORT_FIELD',
        `Unsupported sort field. Allowed: ${Object.keys(SORTABLE_FIELDS).join(', ')}`,
        `حقل ترتيب غير مدعوم. المسموح: ${Object.keys(SORTABLE_FIELDS).join(', ')}`,
      )
    }

    // Route handling
    if (req.method === 'GET') {
      // GET /audit-logs-viewer/export
      if (routeParts[0] === 'export') {
        const format = url.searchParams.get('format') || 'json'
        return handleExportAuditLogs(supabase, filters, format)
      }

      // GET /audit-logs-viewer/statistics
      if (routeParts[0] === 'statistics') {
        return handleAuditStatistics(supabase, filters.date_from, filters.date_to)
      }

      // GET /audit-logs-viewer/distinct/:field
      if (routeParts[0] === 'distinct' && routeParts[1]) {
        return handleDistinctValues(supabase, routeParts[1])
      }

      // GET /audit-logs-viewer/:id
      if (routeParts[0] && routeParts[0] !== 'export' && routeParts[0] !== 'statistics') {
        return handleGetAuditLog(supabase, routeParts[0])
      }

      // GET /audit-logs-viewer - List with filters
      return handleListAuditLogs(supabase, filters)
    }

    return errorEnvelope(
      405,
      'METHOD_NOT_ALLOWED',
      'Method not allowed',
      'الطريقة غير مسموح بها',
    )
  } catch (error) {
    log('error', 'Unexpected error in audit-logs-viewer', { error: error.message })
    return errorEnvelope(
      500,
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      'حدث خطأ غير متوقع',
    )
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const response = await handleRequest(req, corsHeaders)
  const headers = new Headers(response.headers)
  headers.delete('Access-Control-Max-Age')
  for (const [name, value] of Object.entries(corsHeaders)) headers.set(name, value)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
})
