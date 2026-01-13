// Custom Report Builder Edge Function
// Handles CRUD operations for reports, schedules, and report execution

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

interface ReportConfiguration {
  entities: string[];
  columns: Array<{
    id: string;
    fieldId: string;
    label?: string;
    labelAr?: string;
    width?: number;
    visible: boolean;
    order: number;
  }>;
  filters: {
    id: string;
    logic: 'and' | 'or';
    filters: Array<{
      id: string;
      fieldId: string;
      operator: string;
      value: unknown;
      valueEnd?: unknown;
    }>;
    groups: unknown[];
  };
  groupings: Array<{
    id: string;
    fieldId: string;
    label?: string;
    labelAr?: string;
  }>;
  aggregations: Array<{
    id: string;
    fieldId: string;
    function: string;
    label?: string;
    labelAr?: string;
  }>;
  sorting: Array<{
    id: string;
    fieldId: string;
    direction: 'asc' | 'desc';
  }>;
  visualization: {
    type: string;
    title?: string;
    titleAr?: string;
    xAxisFieldId?: string;
    yAxisFieldId?: string;
    colorFieldId?: string;
    sizeFieldId?: string;
    showLegend?: boolean;
    showLabels?: boolean;
    showGrid?: boolean;
    colors?: string[];
    height?: number;
  };
  limit?: number;
  offset?: number;
}

// Helper functions
function extractIdFromPath(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  const idIndex = parts.findIndex((p) => p === 'custom-reports') + 1;
  if (idIndex > 0 && parts[idIndex]) {
    const id = parts[idIndex];
    // Check if it's a valid UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return id;
    }
  }
  return null;
}

function extractSubResource(pathname: string): {
  subResource: string | null;
  subId: string | null;
} {
  const parts = pathname.split('/').filter(Boolean);
  const idIndex = parts.findIndex((p) => p === 'custom-reports') + 1;
  if (idIndex > 0 && parts[idIndex + 1]) {
    const subResource = parts[idIndex + 1];
    const subId = parts[idIndex + 2] || null;
    return { subResource, subId };
  }
  return { subResource: null, subId: null };
}

function errorResponse(
  status: number,
  code: string,
  messageEn: string,
  messageAr: string
): Response {
  return new Response(
    JSON.stringify({
      error: { code, message: { en: messageEn, ar: messageAr } },
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

function successResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getAuthUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

  if (error || !user) {
    return null;
  }

  return user;
}

// Build dynamic query based on report configuration
function buildReportQuery(
  supabase: ReturnType<typeof createClient>,
  config: ReportConfiguration
): { query: string; params: unknown[] } {
  const selectedFields: string[] = [];
  const fromClauses: string[] = [];
  const whereClauses: string[] = [];
  const groupByClauses: string[] = [];
  const orderByClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Add columns to select
  for (const column of config.columns.filter((c) => c.visible)) {
    const [entity, field] = column.fieldId.split('.');
    selectedFields.push(`${entity}.${field}`);
    if (!fromClauses.includes(entity)) {
      fromClauses.push(entity);
    }
  }

  // Add aggregations
  for (const agg of config.aggregations) {
    const [entity, field] = agg.fieldId.split('.');
    const aggFunc = agg.function.toUpperCase();
    const alias = `${agg.function}_${field}`;

    if (agg.function === 'count' && field === '*') {
      selectedFields.push(`COUNT(*) as ${alias}`);
    } else if (agg.function === 'count_distinct') {
      selectedFields.push(`COUNT(DISTINCT ${entity}.${field}) as ${alias}`);
    } else {
      selectedFields.push(`${aggFunc}(${entity}.${field}) as ${alias}`);
    }

    if (!fromClauses.includes(entity)) {
      fromClauses.push(entity);
    }
  }

  // Add groupings
  for (const grouping of config.groupings) {
    const [entity, field] = grouping.fieldId.split('.');
    groupByClauses.push(`${entity}.${field}`);
    if (!selectedFields.includes(`${entity}.${field}`)) {
      selectedFields.push(`${entity}.${field}`);
    }
    if (!fromClauses.includes(entity)) {
      fromClauses.push(entity);
    }
  }

  // Build filter clauses
  function processFilters(filterGroup: typeof config.filters): string {
    const conditions: string[] = [];

    for (const filter of filterGroup.filters) {
      const [entity, field] = filter.fieldId.split('.');
      let condition = '';

      switch (filter.operator) {
        case 'equals':
          condition = `${entity}.${field} = $${paramIndex}`;
          params.push(filter.value);
          paramIndex++;
          break;
        case 'not_equals':
          condition = `${entity}.${field} != $${paramIndex}`;
          params.push(filter.value);
          paramIndex++;
          break;
        case 'contains':
          condition = `${entity}.${field} ILIKE $${paramIndex}`;
          params.push(`%${filter.value}%`);
          paramIndex++;
          break;
        case 'not_contains':
          condition = `${entity}.${field} NOT ILIKE $${paramIndex}`;
          params.push(`%${filter.value}%`);
          paramIndex++;
          break;
        case 'starts_with':
          condition = `${entity}.${field} ILIKE $${paramIndex}`;
          params.push(`${filter.value}%`);
          paramIndex++;
          break;
        case 'ends_with':
          condition = `${entity}.${field} ILIKE $${paramIndex}`;
          params.push(`%${filter.value}`);
          paramIndex++;
          break;
        case 'greater_than':
          condition = `${entity}.${field} > $${paramIndex}`;
          params.push(filter.value);
          paramIndex++;
          break;
        case 'less_than':
          condition = `${entity}.${field} < $${paramIndex}`;
          params.push(filter.value);
          paramIndex++;
          break;
        case 'greater_than_or_equal':
          condition = `${entity}.${field} >= $${paramIndex}`;
          params.push(filter.value);
          paramIndex++;
          break;
        case 'less_than_or_equal':
          condition = `${entity}.${field} <= $${paramIndex}`;
          params.push(filter.value);
          paramIndex++;
          break;
        case 'between':
          condition = `${entity}.${field} BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
          params.push(filter.value, filter.valueEnd);
          paramIndex += 2;
          break;
        case 'in':
          const inValues = Array.isArray(filter.value) ? filter.value : [filter.value];
          const inPlaceholders = inValues.map(() => `$${paramIndex++}`).join(', ');
          condition = `${entity}.${field} IN (${inPlaceholders})`;
          params.push(...inValues);
          break;
        case 'not_in':
          const notInValues = Array.isArray(filter.value) ? filter.value : [filter.value];
          const notInPlaceholders = notInValues.map(() => `$${paramIndex++}`).join(', ');
          condition = `${entity}.${field} NOT IN (${notInPlaceholders})`;
          params.push(...notInValues);
          break;
        case 'is_null':
          condition = `${entity}.${field} IS NULL`;
          break;
        case 'is_not_null':
          condition = `${entity}.${field} IS NOT NULL`;
          break;
      }

      if (condition) {
        conditions.push(condition);
      }
    }

    // Process nested groups
    for (const group of filterGroup.groups as (typeof config.filters)[]) {
      const nestedCondition = processFilters(group);
      if (nestedCondition) {
        conditions.push(`(${nestedCondition})`);
      }
    }

    return conditions.join(` ${filterGroup.logic.toUpperCase()} `);
  }

  const filterCondition = processFilters(config.filters);
  if (filterCondition) {
    whereClauses.push(filterCondition);
  }

  // Add sorting
  for (const sort of config.sorting) {
    const [entity, field] = sort.fieldId.split('.');
    orderByClauses.push(`${entity}.${field} ${sort.direction.toUpperCase()}`);
  }

  // Build the final query
  let query = `SELECT ${selectedFields.join(', ')} FROM ${fromClauses[0]}`;

  // Add JOINs for additional entities (simplified - would need proper join logic)
  // For now, we'll handle single entity queries

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  if (groupByClauses.length > 0) {
    query += ` GROUP BY ${groupByClauses.join(', ')}`;
  }

  if (orderByClauses.length > 0) {
    query += ` ORDER BY ${orderByClauses.join(', ')}`;
  }

  if (config.limit) {
    query += ` LIMIT ${config.limit}`;
  }

  if (config.offset) {
    query += ` OFFSET ${config.offset}`;
  }

  return { query, params };
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const user = await getAuthUser(req, supabase);
    if (!user) {
      return errorResponse(401, 'UNAUTHORIZED', 'Authentication required', 'المصادقة مطلوبة');
    }

    const url = new URL(req.url);
    const pathname = url.pathname;
    const reportId = extractIdFromPath(pathname);
    const { subResource, subId } = extractSubResource(pathname);

    // Route to appropriate handler
    if (subResource === 'schedules') {
      return handleSchedules(req, supabase, user.id, reportId!, subId);
    }

    if (subResource === 'execute') {
      return handleExecute(req, supabase, user.id, reportId!);
    }

    if (subResource === 'preview') {
      return handlePreview(req, supabase, user.id);
    }

    if (subResource === 'share') {
      return handleShare(req, supabase, user.id, reportId!);
    }

    // Main report CRUD
    switch (req.method) {
      case 'GET':
        if (reportId) {
          return getReport(supabase, user.id, reportId);
        }
        return listReports(req, supabase, user.id);

      case 'POST':
        return createReport(req, supabase, user.id);

      case 'PATCH':
      case 'PUT':
        if (!reportId) {
          return errorResponse(400, 'MISSING_ID', 'Report ID is required', 'معرف التقرير مطلوب');
        }
        return updateReport(req, supabase, user.id, reportId);

      case 'DELETE':
        if (!reportId) {
          return errorResponse(400, 'MISSING_ID', 'Report ID is required', 'معرف التقرير مطلوب');
        }
        return deleteReport(supabase, user.id, reportId);

      default:
        return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed', 'الطريقة غير مسموحة');
    }
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred', 'حدث خطأ داخلي');
  }
});

// Report CRUD handlers
async function listReports(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Response> {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const search = url.searchParams.get('search') || '';
  const accessLevel = url.searchParams.get('accessLevel');
  const tags = url.searchParams.get('tags')?.split(',').filter(Boolean);
  const sortBy = url.searchParams.get('sortBy') || 'updated_at';
  const sortOrder = url.searchParams.get('sortOrder') || 'desc';
  const filter = url.searchParams.get('filter'); // 'mine', 'shared', 'favorites'

  let query = supabase.from('custom_reports').select('*', { count: 'exact' });

  // Apply filters
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,name_ar.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  if (accessLevel) {
    query = query.eq('access_level', accessLevel);
  }

  if (tags && tags.length > 0) {
    query = query.contains('tags', tags);
  }

  if (filter === 'mine') {
    query = query.eq('created_by', userId);
  } else if (filter === 'shared') {
    query = query.contains('shared_with', [userId]);
  } else if (filter === 'favorites') {
    query = query.eq('is_favorite', true).eq('created_by', userId);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error listing reports:', error);
    return errorResponse(500, 'LIST_ERROR', 'Failed to list reports', 'فشل في جلب التقارير');
  }

  return successResponse({
    data: data || [],
    total: count || 0,
    page,
    limit,
  });
}

async function getReport(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  reportId: string
): Promise<Response> {
  const { data, error } = await supabase
    .from('custom_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    console.error('Error getting report:', error);
    return errorResponse(404, 'NOT_FOUND', 'Report not found', 'التقرير غير موجود');
  }

  return successResponse(data);
}

async function createReport(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Response> {
  const body = await req.json();

  const { name, nameAr, description, descriptionAr, configuration, accessLevel, tags } = body;

  if (!name || !configuration) {
    return errorResponse(
      400,
      'VALIDATION_ERROR',
      'Name and configuration are required',
      'الاسم والتكوين مطلوبان'
    );
  }

  const { data, error } = await supabase
    .from('custom_reports')
    .insert({
      name,
      name_ar: nameAr,
      description,
      description_ar: descriptionAr,
      configuration,
      access_level: accessLevel || 'private',
      tags: tags || [],
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating report:', error);
    return errorResponse(500, 'CREATE_ERROR', 'Failed to create report', 'فشل في إنشاء التقرير');
  }

  return successResponse(data, 201);
}

async function updateReport(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  userId: string,
  reportId: string
): Promise<Response> {
  const body = await req.json();

  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) updateData.name = body.name;
  if (body.nameAr !== undefined) updateData.name_ar = body.nameAr;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.descriptionAr !== undefined) updateData.description_ar = body.descriptionAr;
  if (body.configuration !== undefined) updateData.configuration = body.configuration;
  if (body.accessLevel !== undefined) updateData.access_level = body.accessLevel;
  if (body.tags !== undefined) updateData.tags = body.tags;
  if (body.isFavorite !== undefined) updateData.is_favorite = body.isFavorite;

  const { data, error } = await supabase
    .from('custom_reports')
    .update(updateData)
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    console.error('Error updating report:', error);
    return errorResponse(500, 'UPDATE_ERROR', 'Failed to update report', 'فشل في تحديث التقرير');
  }

  return successResponse(data);
}

async function deleteReport(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  reportId: string
): Promise<Response> {
  const { error } = await supabase
    .from('custom_reports')
    .delete()
    .eq('id', reportId)
    .eq('created_by', userId);

  if (error) {
    console.error('Error deleting report:', error);
    return errorResponse(500, 'DELETE_ERROR', 'Failed to delete report', 'فشل في حذف التقرير');
  }

  return successResponse({ success: true });
}

// Schedule handlers
async function handleSchedules(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  userId: string,
  reportId: string,
  scheduleId: string | null
): Promise<Response> {
  switch (req.method) {
    case 'GET':
      if (scheduleId) {
        const { data, error } = await supabase
          .from('report_schedules')
          .select('*')
          .eq('id', scheduleId)
          .single();

        if (error) {
          return errorResponse(404, 'NOT_FOUND', 'Schedule not found', 'الجدول غير موجود');
        }
        return successResponse(data);
      }

      const { data: schedules, error: listError } = await supabase
        .from('report_schedules')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: false });

      if (listError) {
        return errorResponse(500, 'LIST_ERROR', 'Failed to list schedules', 'فشل في جلب الجداول');
      }
      return successResponse(schedules);

    case 'POST':
      const createBody = await req.json();
      const { data: newSchedule, error: createError } = await supabase
        .from('report_schedules')
        .insert({
          report_id: reportId,
          name: createBody.name,
          name_ar: createBody.nameAr,
          frequency: createBody.frequency,
          day_of_week: createBody.dayOfWeek,
          day_of_month: createBody.dayOfMonth,
          time: createBody.time,
          timezone: createBody.timezone || 'UTC',
          export_format: createBody.exportFormat || 'pdf',
          recipients: createBody.recipients || [],
          created_by: userId,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating schedule:', createError);
        return errorResponse(
          500,
          'CREATE_ERROR',
          'Failed to create schedule',
          'فشل في إنشاء الجدول'
        );
      }
      return successResponse(newSchedule, 201);

    case 'PATCH':
    case 'PUT':
      if (!scheduleId) {
        return errorResponse(400, 'MISSING_ID', 'Schedule ID is required', 'معرف الجدول مطلوب');
      }

      const updateBody = await req.json();
      const scheduleUpdate: Record<string, unknown> = {};

      if (updateBody.name !== undefined) scheduleUpdate.name = updateBody.name;
      if (updateBody.nameAr !== undefined) scheduleUpdate.name_ar = updateBody.nameAr;
      if (updateBody.frequency !== undefined) scheduleUpdate.frequency = updateBody.frequency;
      if (updateBody.dayOfWeek !== undefined) scheduleUpdate.day_of_week = updateBody.dayOfWeek;
      if (updateBody.dayOfMonth !== undefined) scheduleUpdate.day_of_month = updateBody.dayOfMonth;
      if (updateBody.time !== undefined) scheduleUpdate.time = updateBody.time;
      if (updateBody.timezone !== undefined) scheduleUpdate.timezone = updateBody.timezone;
      if (updateBody.exportFormat !== undefined)
        scheduleUpdate.export_format = updateBody.exportFormat;
      if (updateBody.recipients !== undefined) scheduleUpdate.recipients = updateBody.recipients;
      if (updateBody.isActive !== undefined) scheduleUpdate.is_active = updateBody.isActive;

      const { data: updatedSchedule, error: updateError } = await supabase
        .from('report_schedules')
        .update(scheduleUpdate)
        .eq('id', scheduleId)
        .select()
        .single();

      if (updateError) {
        return errorResponse(
          500,
          'UPDATE_ERROR',
          'Failed to update schedule',
          'فشل في تحديث الجدول'
        );
      }
      return successResponse(updatedSchedule);

    case 'DELETE':
      if (!scheduleId) {
        return errorResponse(400, 'MISSING_ID', 'Schedule ID is required', 'معرف الجدول مطلوب');
      }

      const { error: deleteError } = await supabase
        .from('report_schedules')
        .delete()
        .eq('id', scheduleId);

      if (deleteError) {
        return errorResponse(500, 'DELETE_ERROR', 'Failed to delete schedule', 'فشل في حذف الجدول');
      }
      return successResponse({ success: true });

    default:
      return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed', 'الطريقة غير مسموحة');
  }
}

// Execute report handler
async function handleExecute(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  userId: string,
  reportId: string
): Promise<Response> {
  if (req.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed', 'الطريقة غير مسموحة');
  }

  // Get the report configuration
  const { data: report, error: reportError } = await supabase
    .from('custom_reports')
    .select('configuration')
    .eq('id', reportId)
    .single();

  if (reportError || !report) {
    return errorResponse(404, 'NOT_FOUND', 'Report not found', 'التقرير غير موجود');
  }

  const startTime = Date.now();

  // Create execution record
  const { data: execution, error: execError } = await supabase
    .from('report_executions')
    .insert({
      report_id: reportId,
      status: 'running',
      executed_by: userId,
    })
    .select()
    .single();

  if (execError) {
    return errorResponse(500, 'EXEC_ERROR', 'Failed to start execution', 'فشل في بدء التنفيذ');
  }

  try {
    const config = report.configuration as ReportConfiguration;

    // For simplicity, we'll use Supabase's query builder for single-entity queries
    // In a production system, you'd want to use raw SQL for complex joins
    if (config.entities.length === 0) {
      throw new Error('No entities selected');
    }

    const primaryEntity = config.entities[0];
    let query = supabase.from(primaryEntity).select('*');

    // Apply simple filters
    for (const filter of config.filters.filters) {
      const [, field] = filter.fieldId.split('.');

      switch (filter.operator) {
        case 'equals':
          query = query.eq(field, filter.value);
          break;
        case 'not_equals':
          query = query.neq(field, filter.value);
          break;
        case 'contains':
          query = query.ilike(field, `%${filter.value}%`);
          break;
        case 'greater_than':
          query = query.gt(field, filter.value);
          break;
        case 'less_than':
          query = query.lt(field, filter.value);
          break;
        case 'is_null':
          query = query.is(field, null);
          break;
        case 'is_not_null':
          query = query.not(field, 'is', null);
          break;
      }
    }

    // Apply sorting
    for (const sort of config.sorting) {
      const [, field] = sort.fieldId.split('.');
      query = query.order(field, { ascending: sort.direction === 'asc' });
    }

    // Apply limit
    if (config.limit) {
      query = query.limit(config.limit);
    }

    const { data: results, error: queryError, count } = await query;

    if (queryError) {
      throw queryError;
    }

    const executionTime = Date.now() - startTime;

    // Update execution record
    await supabase
      .from('report_executions')
      .update({
        status: 'completed',
        row_count: results?.length || 0,
        execution_time_ms: executionTime,
        completed_at: new Date().toISOString(),
      })
      .eq('id', execution.id);

    return successResponse({
      executionId: execution.id,
      data: results || [],
      rowCount: results?.length || 0,
      executionTimeMs: executionTime,
    });
  } catch (error) {
    console.error('Execution error:', error);

    // Update execution record with error
    await supabase
      .from('report_executions')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', execution.id);

    return errorResponse(500, 'EXEC_ERROR', 'Report execution failed', 'فشل تنفيذ التقرير');
  }
}

// Preview handler (for testing configurations without saving)
async function handlePreview(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Response> {
  if (req.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed', 'الطريقة غير مسموحة');
  }

  const body = await req.json();
  const config = body.configuration as ReportConfiguration;
  const limit = body.limit || 100;

  if (!config || !config.entities || config.entities.length === 0) {
    return errorResponse(
      400,
      'VALIDATION_ERROR',
      'Configuration with entities is required',
      'التكوين مع الكيانات مطلوب'
    );
  }

  const startTime = Date.now();

  try {
    const primaryEntity = config.entities[0];
    let query = supabase.from(primaryEntity).select('*', { count: 'exact' });

    // Apply simple filters
    for (const filter of config.filters?.filters || []) {
      const [, field] = filter.fieldId.split('.');

      switch (filter.operator) {
        case 'equals':
          query = query.eq(field, filter.value);
          break;
        case 'not_equals':
          query = query.neq(field, filter.value);
          break;
        case 'contains':
          query = query.ilike(field, `%${filter.value}%`);
          break;
        case 'greater_than':
          query = query.gt(field, filter.value);
          break;
        case 'less_than':
          query = query.lt(field, filter.value);
          break;
      }
    }

    // Apply sorting
    for (const sort of config.sorting || []) {
      const [, field] = sort.fieldId.split('.');
      query = query.order(field, { ascending: sort.direction === 'asc' });
    }

    // Apply preview limit
    query = query.limit(limit);

    const { data: results, error: queryError, count } = await query;

    if (queryError) {
      throw queryError;
    }

    const executionTime = Date.now() - startTime;

    return successResponse({
      data: results || [],
      columns: config.columns || [],
      totalCount: count || 0,
      executionTimeMs: executionTime,
    });
  } catch (error) {
    console.error('Preview error:', error);
    return errorResponse(500, 'PREVIEW_ERROR', 'Preview failed', 'فشلت المعاينة');
  }
}

// Share handler
async function handleShare(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  userId: string,
  reportId: string
): Promise<Response> {
  switch (req.method) {
    case 'GET':
      const { data: shares, error: listError } = await supabase
        .from('report_shares')
        .select('*, shared_with_user:shared_with(id, email)')
        .eq('report_id', reportId);

      if (listError) {
        return errorResponse(500, 'LIST_ERROR', 'Failed to list shares', 'فشل في جلب المشاركات');
      }
      return successResponse(shares);

    case 'POST':
      const { sharedWith, permission } = await req.json();

      if (!sharedWith) {
        return errorResponse(400, 'VALIDATION_ERROR', 'User ID is required', 'معرف المستخدم مطلوب');
      }

      const { data: newShare, error: createError } = await supabase
        .from('report_shares')
        .insert({
          report_id: reportId,
          shared_with: sharedWith,
          permission: permission || 'view',
          shared_by: userId,
        })
        .select()
        .single();

      if (createError) {
        if (createError.code === '23505') {
          return errorResponse(
            409,
            'DUPLICATE',
            'Report already shared with this user',
            'التقرير مشترك بالفعل مع هذا المستخدم'
          );
        }
        return errorResponse(
          500,
          'CREATE_ERROR',
          'Failed to share report',
          'فشل في مشاركة التقرير'
        );
      }

      // Also update the shared_with array on the report
      await supabase.rpc('array_append_unique', {
        table_name: 'custom_reports',
        column_name: 'shared_with',
        id: reportId,
        value: sharedWith,
      });

      return successResponse(newShare, 201);

    case 'DELETE':
      const url = new URL(req.url);
      const userToRemove = url.searchParams.get('userId');

      if (!userToRemove) {
        return errorResponse(400, 'VALIDATION_ERROR', 'User ID is required', 'معرف المستخدم مطلوب');
      }

      const { error: deleteError } = await supabase
        .from('report_shares')
        .delete()
        .eq('report_id', reportId)
        .eq('shared_with', userToRemove);

      if (deleteError) {
        return errorResponse(
          500,
          'DELETE_ERROR',
          'Failed to remove share',
          'فشل في إزالة المشاركة'
        );
      }
      return successResponse({ success: true });

    default:
      return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed', 'الطريقة غير مسموحة');
  }
}
