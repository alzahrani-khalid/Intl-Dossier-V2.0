/**
 * Supabase Edge Function: Waiting Queue Filters
 *
 * GET /assignments - Filter and retrieve waiting queue assignments
 * GET /preferences - Get user filter preferences
 * POST /preferences - Save user filter preferences
 *
 * Tasks: T077 [US5], T078 [US5], T080 [US5]
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Security utilities (embedded to avoid import issues)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(uuid: string): boolean {
  if (typeof uuid !== 'string') return false;
  return UUID_REGEX.test(uuid);
}

function createSafeErrorResponse(
  error: unknown,
  fallbackMessage = 'An error occurred'
): { error: string; message: string } {
  console.error('Error details:', error);
  if (error instanceof Error) {
    const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
    return {
      error: 'INTERNAL_ERROR',
      message: isDevelopment ? error.message : fallbackMessage,
    };
  }
  return {
    error: 'INTERNAL_ERROR',
    message: fallbackMessage,
  };
}

function validateContentType(req: Request): boolean {
  const contentType = req.headers.get('content-type');
  return contentType === 'application/json' || contentType?.startsWith('application/json');
}

function sanitizeText(input: unknown, maxLength = 5000): string {
  if (typeof input !== 'string') {
    return '';
  }
  let sanitized = input.substring(0, maxLength);
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  return sanitized.trim();
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Note: Redis caching disabled for now to avoid connection issues
// Can be re-enabled later when Redis is properly configured

interface FilterCriteria {
  priority?: ('low' | 'medium' | 'high' | 'urgent')[];
  aging?: ('0-2' | '3-6' | '7+')[];
  type?: ('dossier' | 'ticket' | 'position' | 'task')[];
  assignee?: string;
  status?: 'pending' | 'assigned';
  sort_by?: 'assigned_at_asc' | 'assigned_at_desc' | 'priority_asc' | 'priority_desc';
  page?: number;
  page_size?: number;
}

/**
 * Validate filter parameters
 */
function validateFilters(filters: FilterCriteria): { valid: boolean; error?: string } {
  // Validate priority array
  if (filters.priority) {
    if (!Array.isArray(filters.priority) || filters.priority.length === 0) {
      return { valid: false, error: 'Priority must be a non-empty array' };
    }
    for (const p of filters.priority) {
      if (!['low', 'medium', 'high', 'urgent'].includes(p)) {
        return { valid: false, error: 'Invalid priority value. Must be: low, medium, high, or urgent' };
      }
    }
  }

  // Validate aging array
  if (filters.aging) {
    if (!Array.isArray(filters.aging) || filters.aging.length === 0) {
      return { valid: false, error: 'Aging must be a non-empty array' };
    }
    for (const a of filters.aging) {
      if (!['0-2', '3-6', '7+'].includes(a)) {
        return { valid: false, error: 'Invalid aging value. Must be: 0-2, 3-6, or 7+' };
      }
    }
  }

  // Validate type array
  if (filters.type) {
    if (!Array.isArray(filters.type) || filters.type.length === 0) {
      return { valid: false, error: 'Type must be a non-empty array' };
    }
    for (const t of filters.type) {
      if (!['dossier', 'ticket', 'position', 'task'].includes(t)) {
        return { valid: false, error: 'Invalid type value. Must be: dossier, ticket, position, or task' };
      }
    }
  }

  if (filters.status && !['pending', 'assigned'].includes(filters.status)) {
    return { valid: false, error: 'Invalid status value. Must be: pending or assigned' };
  }

  if (filters.assignee && !isValidUUID(filters.assignee)) {
    return { valid: false, error: 'Invalid assignee UUID format' };
  }

  if (filters.page !== undefined && (filters.page < 1 || !Number.isInteger(filters.page))) {
    return { valid: false, error: 'Invalid page value. Must be a positive integer' };
  }

  if (filters.page_size !== undefined && (filters.page_size < 1 || filters.page_size > 100 || !Number.isInteger(filters.page_size))) {
    return { valid: false, error: 'Invalid page_size value. Must be between 1 and 100' };
  }

  if (filters.sort_by && !['assigned_at_asc', 'assigned_at_desc', 'priority_asc', 'priority_desc'].includes(filters.sort_by)) {
    return { valid: false, error: 'Invalid sort_by value' };
  }

  return { valid: true };
}

/**
 * Build filter query
 */
function buildFilterQuery(supabase: any, filters: FilterCriteria, userId: string) {
  let query = supabase
    .from('assignments')
    .select('*', { count: 'exact' });

  // Default to active assignments
  if (filters.status) {
    query = query.eq('status', filters.status);
  } else {
    query = query.in('status', ['pending', 'assigned']);
  }

  // Priority filter - use .in() for arrays
  if (filters.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority);
  }

  // Type filter - use .in() for arrays
  if (filters.type && filters.type.length > 0) {
    query = query.in('work_item_type', filters.type);
  }

  if (filters.assignee) {
    query = query.eq('assignee_id', filters.assignee);
  }

  // Aging filter - for multiple ranges, use OR logic
  if (filters.aging && filters.aging.length > 0) {
    const now = new Date();
    const agingConditions: string[] = [];

    for (const agingRange of filters.aging) {
      switch (agingRange) {
        case '0-2':
          // 0-2 days ago
          agingConditions.push(`assigned_at.gte.${new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()}`);
          break;
        case '3-6':
          // 3-6 days ago
          agingConditions.push(`and(assigned_at.lte.${new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()},assigned_at.gte.${new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString()})`);
          break;
        case '7+':
          // 7+ days ago
          agingConditions.push(`assigned_at.lte.${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()}`);
          break;
      }
    }

    // Apply OR condition for multiple aging ranges
    if (agingConditions.length === 1) {
      // Single condition - use simple filter
      const condition = agingConditions[0];
      if (condition.startsWith('assigned_at.gte.')) {
        query = query.gte('assigned_at', condition.substring(16));
      } else if (condition.startsWith('assigned_at.lte.')) {
        query = query.lte('assigned_at', condition.substring(16));
      }
    } else if (agingConditions.length > 1) {
      // Multiple conditions - use or() filter
      query = query.or(agingConditions.join(','));
    }
  }

  // Sorting
  const sortBy = filters.sort_by || 'assigned_at_desc';
  switch (sortBy) {
    case 'assigned_at_asc':
      query = query.order('assigned_at', { ascending: true });
      break;
    case 'assigned_at_desc':
      query = query.order('assigned_at', { ascending: false });
      break;
    case 'priority_asc':
      query = query.order('priority', { ascending: true }).order('assigned_at', { ascending: false });
      break;
    case 'priority_desc':
      query = query.order('priority', { ascending: false }).order('assigned_at', { ascending: false });
      break;
  }

  // Pagination
  const page = filters.page || 1;
  const pageSize = Math.min(filters.page_size || 50, 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  return query;
}

/**
 * Calculate aging in days
 */
function calculateAging(assignments: any[]): any[] {
  const now = Date.now();
  return assignments.map(assignment => ({
    ...assignment,
    days_waiting: Math.floor((now - new Date(assignment.assigned_at).getTime()) / (1000 * 60 * 60 * 24))
  }));
}

/**
 * Fetch task details and linked entities for assignments
 */
async function fetchWorkItemDetails(supabase: any, assignments: any[]): Promise<any[]> {
  if (!assignments || assignments.length === 0) return [];

  // All assignments now point to tasks
  const taskIds = assignments.filter(a => a.work_item_type === 'task').map(a => a.work_item_id);

  if (taskIds.length === 0) return assignments;

  // Fetch tasks with engagement details
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      description,
      source,
      status,
      engagement_id,
      engagements (
        id,
        title,
        engagement_type,
        engagement_date,
        location,
        dossier_id,
        dossiers (
          id,
          name_en,
          name_ar
        )
      )
    `)
    .in('id', taskIds);

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
    return assignments;
  }

  // Create task lookup map
  const tasksMap = (tasks || []).reduce((acc: any, t: any) => {
    acc[t.id] = t;
    return acc;
  }, {});

  // Extract all linked entity IDs from task sources
  const allDossierIds: string[] = [];
  const allPositionIds: string[] = [];
  const allTicketIds: string[] = [];

  tasks?.forEach((task: any) => {
    if (task.source?.dossier_ids) {
      allDossierIds.push(...task.source.dossier_ids);
    }
    if (task.source?.position_ids) {
      allPositionIds.push(...task.source.position_ids);
    }
    if (task.source?.ticket_ids) {
      allTicketIds.push(...task.source.ticket_ids);
    }
  });

  // Fetch linked entities in parallel
  const [dossiersResult, positionsResult, ticketsResult] = await Promise.all([
    allDossierIds.length > 0
      ? supabase.from('dossiers').select('id, name_en, name_ar, type, status').in('id', allDossierIds)
      : { data: [], error: null },
    allPositionIds.length > 0
      ? supabase.from('positions').select('id, title_en, title_ar, status').in('id', allPositionIds)
      : { data: [], error: null },
    allTicketIds.length > 0
      ? supabase.from('intake_tickets').select('id, ticket_number, title, title_ar, status').in('id', allTicketIds)
      : { data: [], error: null }
  ]);

  // Create entity lookup maps
  const dossiersMap = (dossiersResult.data || []).reduce((acc: any, d: any) => {
    acc[d.id] = d;
    return acc;
  }, {});

  const positionsMap = (positionsResult.data || []).reduce((acc: any, p: any) => {
    acc[p.id] = p;
    return acc;
  }, {});

  const ticketsMap = (ticketsResult.data || []).reduce((acc: any, t: any) => {
    acc[t.id] = t;
    return acc;
  }, {});

  // Merge task details into assignments
  return assignments.map(assignment => {
    const task = tasksMap[assignment.work_item_id];
    if (!task) return assignment;

    // Build work item from task info
    const workItem: any = {
      title_en: task.title,
      title_ar: task.title, // Tasks don't have separate AR titles yet
      description: task.description,
      status: task.status,
      source_type: task.source?.type,
      linked_entities: [],
      engagement: task.engagements || null // Include engagement details if available
    };

    // Add linked entities based on source type
    if (task.source?.type === 'dossier' && task.source.dossier_ids) {
      workItem.linked_entities = task.source.dossier_ids.map((id: string) => {
        const dossier = dossiersMap[id];
        return dossier ? {
          type: 'dossier',
          id,
          name_en: dossier.name_en,
          name_ar: dossier.name_ar,
          status: dossier.status
        } : null;
      }).filter(Boolean);
    } else if (task.source?.type === 'position' && task.source.position_ids) {
      workItem.linked_entities = task.source.position_ids.map((id: string) => {
        const position = positionsMap[id];
        return position ? {
          type: 'position',
          id,
          title_en: position.title_en,
          title_ar: position.title_ar,
          status: position.status
        } : null;
      }).filter(Boolean);
    } else if (task.source?.type === 'ticket' && task.source.ticket_ids) {
      workItem.linked_entities = task.source.ticket_ids.map((id: string) => {
        const ticket = ticketsMap[id];
        return ticket ? {
          type: 'ticket',
          id,
          ticket_number: ticket.ticket_number,
          title_en: ticket.title,
          title_ar: ticket.title_ar,
          status: ticket.status
        } : null;
      }).filter(Boolean);
    }

    return {
      ...assignment,
      work_item: workItem
    };
  });
}

// Legacy support for old assignments (will be removed after full migration)
async function fetchLegacyWorkItemDetails(supabase: any, assignments: any[]): Promise<any[]> {
  if (!assignments || assignments.length === 0) return [];

  // Group assignments by type
  const dossierIds = assignments.filter(a => a.work_item_type === 'dossier').map(a => a.work_item_id);
  const ticketIds = assignments.filter(a => a.work_item_type === 'ticket').map(a => a.work_item_id);
  const positionIds = assignments.filter(a => a.work_item_type === 'position').map(a => a.work_item_id);

  // Fetch work items in parallel
  const [dossiersResult, ticketsResult, positionsResult] = await Promise.all([
    dossierIds.length > 0
      ? supabase.from('dossiers').select('id, name_en, name_ar, type, status').in('id', dossierIds)
      : { data: [], error: null },
    ticketIds.length > 0
      ? supabase.from('intake_tickets').select('id, ticket_number, title, title_ar, status').in('id', ticketIds)
      : { data: [], error: null },
    positionIds.length > 0
      ? supabase.from('positions').select('id, title_en, title_ar, status').in('id', positionIds)
      : { data: [], error: null }
  ]);

  // Create lookup maps
  const dossiersMap = (dossiersResult.data || []).reduce((acc: any, d: any) => {
    acc[d.id] = d;
    return acc;
  }, {});

  const ticketsMap = (ticketsResult.data || []).reduce((acc: any, t: any) => {
    acc[t.id] = t;
    return acc;
  }, {});

  const positionsMap = (positionsResult.data || []).reduce((acc: any, p: any) => {
    acc[p.id] = p;
    return acc;
  }, {});

  // Merge work item details into assignments
  return assignments.map(assignment => {
    let workItem = null;

    if (assignment.work_item_type === 'dossier' && dossiersMap[assignment.work_item_id]) {
      const dossier = dossiersMap[assignment.work_item_id];
      workItem = {
        title_en: dossier.name_en,
        title_ar: dossier.name_ar,
        type: dossier.type,
        status: dossier.status
      };
    } else if (assignment.work_item_type === 'ticket' && ticketsMap[assignment.work_item_id]) {
      const ticket = ticketsMap[assignment.work_item_id];
      workItem = {
        title_en: ticket.title || ticket.ticket_number,
        title_ar: ticket.title_ar || ticket.ticket_number,
        ticket_number: ticket.ticket_number,
        status: ticket.status
      };
    } else if (assignment.work_item_type === 'position' && positionsMap[assignment.work_item_id]) {
      const position = positionsMap[assignment.work_item_id];
      workItem = {
        title_en: position.title_en,
        title_ar: position.title_ar,
        status: position.status
      };
    }

    return {
      ...assignment,
      work_item: workItem
    };
  });
}

/**
 * Add CORS headers to response
 */
function corsHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey, if-none-match',
    ...additionalHeaders
  };
}

/**
 * Generate ETag for response
 */
async function generateETag(data: any): Promise<string> {
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);
  const dataBuffer = encoder.encode(dataString);

  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `"${hashHex}"`;
}

/**
 * Handle GET /assignments - Filter waiting queue
 */
async function handleGetAssignments(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url);

  // Parse array parameters
  const priorityValues = url.searchParams.getAll('priority');
  const agingValues = url.searchParams.getAll('aging');
  const typeValues = url.searchParams.getAll('type');

  const filters: FilterCriteria = {
    priority: priorityValues.length > 0 ? priorityValues as any : undefined,
    aging: agingValues.length > 0 ? agingValues as any : undefined,
    type: typeValues.length > 0 ? typeValues as any : undefined,
    assignee: url.searchParams.get('assignee') || undefined,
    status: url.searchParams.get('status') as any,
    sort_by: url.searchParams.get('sort_by') as any,
    page: parseInt(url.searchParams.get('page') || '1'),
    page_size: parseInt(url.searchParams.get('page_size') || '50')
  };

  // Remove undefined values
  Object.keys(filters).forEach(key => {
    if (filters[key as keyof FilterCriteria] === null || filters[key as keyof FilterCriteria] === undefined) {
      delete filters[key as keyof FilterCriteria];
    }
  });

  // Validate filters
  const validation = validateFilters(filters);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: corsHeaders({ 'Content-Type': 'application/json' })
    });
  }

  // Note: Redis caching currently disabled

  // Cache miss - execute query
  const query = buildFilterQuery(supabase, filters, userId);
  const { data, error, count } = await query;

  if (error) {
    console.error('Filter query error:', error);
    return new Response(JSON.stringify({ error: 'Failed to retrieve assignments' }), {
      status: 500,
      headers: corsHeaders({ 'Content-Type': 'application/json' })
    });
  }

  // Get unique assignee IDs
  const assigneeIds = [...new Set((data || []).map((a: any) => a.assignee_id).filter(Boolean))];

  // Fetch user details for all assignees
  let usersMap: Record<string, any> = {};
  if (assigneeIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email, language_preference')
      .in('id', assigneeIds);

    if (!usersError && users) {
      usersMap = users.reduce((acc: any, user: any) => {
        acc[user.id] = user;
        return acc;
      }, {});
    }
  }

  // Merge user data into assignments
  const assignmentsWithUsers = (data || []).map((assignment: any) => ({
    ...assignment,
    assignee_name: assignment.assignee_id && usersMap[assignment.assignee_id]
      ? usersMap[assignment.assignee_id].full_name
      : 'Unassigned',
    users: assignment.assignee_id ? usersMap[assignment.assignee_id] || null : null
  }));

  // Fetch and merge work item details
  const assignmentsWithWorkItems = await fetchWorkItemDetails(supabase, assignmentsWithUsers);

  // Calculate aging
  const assignmentsWithAging = calculateAging(assignmentsWithWorkItems);

  // Build result
  const pageSize = filters.page_size || 50;
  const result = {
    data: assignmentsWithAging,
    pagination: {
      page: filters.page || 1,
      page_size: pageSize,
      total_count: count || 0,
      total_pages: Math.ceil((count || 0) / pageSize)
    }
  };

  // Generate ETag
  const etag = await generateETag(result);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: corsHeaders({
      'Content-Type': 'application/json',
      'ETag': etag,
      'Cache-Control': 'max-age=60', // 1 minute (short cache since no Redis)
      'X-Cache': 'DISABLED'
    })
  });
}

/**
 * Handle GET /preferences - Get user filter preferences
 */
async function handleGetPreferences(req: Request, supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('preferences')
    .eq('user_id', userId)
    .eq('preference_key', 'waiting_queue_filters')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    return new Response(JSON.stringify({ error: 'Failed to retrieve preferences' }), {
      status: 500,
      headers: corsHeaders({ 'Content-Type': 'application/json' })
    });
  }

  return new Response(JSON.stringify(data?.preferences || {}), {
    status: 200,
    headers: corsHeaders({ 'Content-Type': 'application/json' })
  });
}

/**
 * Handle POST /preferences - Save user filter preferences
 */
async function handleSavePreferences(req: Request, supabase: any, userId: string) {
  // Validate Content-Type
  if (!validateContentType(req)) {
    return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
      status: 415,
      headers: corsHeaders({ 'Content-Type': 'application/json' })
    });
  }

  const body = await req.json();
  const preferences = body.preferences || {};

  // Validate preferences object size (prevent excessive data)
  const preferencesString = JSON.stringify(preferences);
  if (preferencesString.length > 10000) {
    return new Response(JSON.stringify({ error: 'Preferences data too large (max 10KB)' }), {
      status: 400,
      headers: corsHeaders({ 'Content-Type': 'application/json' })
    });
  }

  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      preference_key: 'waiting_queue_filters',
      preferences: preferences,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,preference_key' });

  if (error) {
    console.error('Save preferences error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save preferences' }), {
      status: 500,
      headers: corsHeaders({ 'Content-Type': 'application/json' })
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: corsHeaders({ 'Content-Type': 'application/json' })
  });
}

/**
 * Main handler
 */
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: corsHeaders({ 'Content-Type': 'application/json' })
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create a client for auth verification
    const authClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get user from token
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: corsHeaders({ 'Content-Type': 'application/json' })
      });
    }

    // Create service role client for queries (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const url = new URL(req.url);
    const path = url.pathname;

    // Route requests
    if (path.endsWith('/assignments') && req.method === 'GET') {
      return await handleGetAssignments(req, supabase, user.id);
    } else if (path.endsWith('/preferences') && req.method === 'GET') {
      return await handleGetPreferences(req, supabase, user.id);
    } else if (path.endsWith('/preferences') && req.method === 'POST') {
      return await handleSavePreferences(req, supabase, user.id);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: corsHeaders({ 'Content-Type': 'application/json' })
    });

  } catch (error) {
    const safeError = createSafeErrorResponse(error, 'Failed to process filter request');
    return new Response(JSON.stringify(safeError), {
      status: 500,
      headers: corsHeaders({ 'Content-Type': 'application/json' })
    });
  }
});
