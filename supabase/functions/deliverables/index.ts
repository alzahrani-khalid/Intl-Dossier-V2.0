/**
 * Edge Function: Deliverables CRUD
 * Feature: commitment-deliverables
 *
 * Handles CRUD operations for MoU deliverables with milestone management,
 * status tracking, health scoring, and document linkage.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

interface DeliverableInput {
  mou_id: string;
  title_en: string;
  title_ar: string;
  description_en?: string | null;
  description_ar?: string | null;
  due_date: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: string;
  responsible_party_type: 'internal' | 'external';
  responsible_user_id?: string | null;
  responsible_contact_name?: string | null;
  responsible_contact_email?: string | null;
  notes?: string | null;
  sort_order?: number;
}

interface MilestoneInput {
  deliverable_id: string;
  title_en: string;
  title_ar: string;
  description_en?: string | null;
  description_ar?: string | null;
  due_date?: string | null;
  weight?: number;
  sort_order?: number;
}

interface BulkStatusInput {
  deliverable_ids: string[];
  status: string;
  notes?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: userData } = await supabaseClient.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Parse path: /deliverables, /deliverables/:id, /deliverables/:id/milestones, etc.
    const deliverableIndex = pathParts.indexOf('deliverables');
    const id =
      pathParts[deliverableIndex + 1] &&
      !['milestones', 'bulk-status', 'health'].includes(pathParts[deliverableIndex + 1])
        ? pathParts[deliverableIndex + 1]
        : null;
    const subResource = pathParts[deliverableIndex + 2] || pathParts[deliverableIndex + 1];
    const subResourceId = pathParts[deliverableIndex + 3];

    // Handle special routes
    if (subResource === 'bulk-status' && req.method === 'POST') {
      return handleBulkStatusUpdate(supabaseClient, req, userId);
    }

    if (subResource === 'health' && req.method === 'GET') {
      const mouId = url.searchParams.get('mou_id');
      if (!mouId) {
        return new Response(JSON.stringify({ error: 'mou_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return handleGetMouHealth(supabaseClient, mouId);
    }

    // Handle milestone routes
    if (id && subResource === 'milestones') {
      return handleMilestones(supabaseClient, req, id, subResourceId, userId);
    }

    // Handle documents routes
    if (id && subResource === 'documents') {
      return handleDocuments(supabaseClient, req, id, subResourceId, userId);
    }

    // Handle history routes
    if (id && subResource === 'history') {
      return handleHistory(supabaseClient, id);
    }

    // Main deliverable CRUD
    switch (req.method) {
      case 'GET':
        return id ? getDeliverable(supabaseClient, id) : listDeliverables(supabaseClient, url);
      case 'POST':
        return createDeliverable(supabaseClient, req, userId);
      case 'PUT':
      case 'PATCH':
        if (!id) {
          return new Response(JSON.stringify({ error: 'Deliverable ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return updateDeliverable(supabaseClient, req, id, userId);
      case 'DELETE':
        if (!id) {
          return new Response(JSON.stringify({ error: 'Deliverable ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return deleteDeliverable(supabaseClient, id);
      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in deliverables function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function listDeliverables(supabase: any, url: URL) {
  const searchParams = url.searchParams;
  const mouId = searchParams.get('mou_id');
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const responsibleUserId = searchParams.get('responsible_user_id');
  const overdue = searchParams.get('overdue') === 'true';
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  let query = supabase.from('mou_deliverables').select(
    `
      *,
      mou:mou_id(id, title, title_ar, reference_number),
      responsible_user:responsible_user_id(id, full_name, email)
    `,
    { count: 'exact' }
  );

  if (mouId) {
    query = query.eq('mou_id', mouId);
  }
  if (status) {
    const statuses = status.split(',');
    query = query.in('status', statuses);
  }
  if (priority) {
    const priorities = priority.split(',');
    query = query.in('priority', priorities);
  }
  if (responsibleUserId) {
    query = query.eq('responsible_user_id', responsibleUserId);
  }
  if (overdue) {
    query = query.lt('due_date', new Date().toISOString().split('T')[0]);
    query = query.not('status', 'in', '("completed","cancelled")');
  }
  if (search) {
    query = query.or(`title_en.ilike.%${search}%,title_ar.ilike.%${search}%`);
  }

  query = query
    .order('sort_order', { ascending: true })
    .order('due_date', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return new Response(
    JSON.stringify({
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: offset + limit < (count || 0),
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getDeliverable(supabase: any, id: string) {
  const { data, error } = await supabase
    .from('mou_deliverables')
    .select(
      `
      *,
      mou:mou_id(id, title, title_ar, reference_number),
      responsible_user:responsible_user_id(id, full_name, email),
      milestones:deliverable_milestones(*),
      documents:deliverable_documents(*)
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) {
    return new Response(JSON.stringify({ error: 'Deliverable not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Calculate health score
  await supabase.rpc('calculate_deliverable_health_score', { p_deliverable_id: id });

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function createDeliverable(supabase: any, req: Request, userId: string) {
  const body: DeliverableInput = await req.json();

  // Validate required fields
  if (
    !body.mou_id ||
    !body.title_en ||
    !body.title_ar ||
    !body.due_date ||
    !body.responsible_party_type
  ) {
    return new Response(
      JSON.stringify({
        error:
          'Missing required fields: mou_id, title_en, title_ar, due_date, responsible_party_type',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate responsible party
  if (body.responsible_party_type === 'internal' && !body.responsible_user_id) {
    return new Response(
      JSON.stringify({ error: 'responsible_user_id is required for internal responsible party' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  if (body.responsible_party_type === 'external' && !body.responsible_contact_name) {
    return new Response(
      JSON.stringify({
        error: 'responsible_contact_name is required for external responsible party',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const deliverableData = {
    ...body,
    status: body.status || 'pending',
    priority: body.priority || 'medium',
    progress: 0,
    sort_order: body.sort_order || 0,
    created_by: userId,
  };

  const { data, error } = await supabase
    .from('mou_deliverables')
    .insert(deliverableData)
    .select(
      `
      *,
      mou:mou_id(id, title, title_ar, reference_number),
      responsible_user:responsible_user_id(id, full_name, email)
    `
    )
    .single();

  if (error) throw error;

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateDeliverable(supabase: any, req: Request, id: string, userId: string) {
  const body = await req.json();

  // Validate responsible party if being updated
  if (body.responsible_party_type === 'internal' && body.responsible_user_id === null) {
    return new Response(
      JSON.stringify({ error: 'responsible_user_id is required for internal responsible party' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  if (body.responsible_party_type === 'external' && !body.responsible_contact_name) {
    return new Response(
      JSON.stringify({
        error: 'responsible_contact_name is required for external responsible party',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const updateData = {
    ...body,
    updated_by: userId,
  };

  // Handle completion
  if (body.status === 'completed' && !body.completed_at) {
    updateData.completed_at = new Date().toISOString();
    updateData.progress = 100;
  }

  const { data, error } = await supabase
    .from('mou_deliverables')
    .update(updateData)
    .eq('id', id)
    .select(
      `
      *,
      mou:mou_id(id, title, title_ar, reference_number),
      responsible_user:responsible_user_id(id, full_name, email)
    `
    )
    .single();

  if (error) throw error;
  if (!data) {
    return new Response(JSON.stringify({ error: 'Deliverable not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Recalculate health score
  await supabase.rpc('calculate_deliverable_health_score', { p_deliverable_id: id });

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteDeliverable(supabase: any, id: string) {
  const { error } = await supabase.from('mou_deliverables').delete().eq('id', id);

  if (error) throw error;

  return new Response(JSON.stringify({ message: 'Deliverable deleted successfully' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleBulkStatusUpdate(supabase: any, req: Request, userId: string) {
  const body: BulkStatusInput = await req.json();

  if (
    !body.deliverable_ids ||
    !Array.isArray(body.deliverable_ids) ||
    body.deliverable_ids.length === 0
  ) {
    return new Response(JSON.stringify({ error: 'deliverable_ids array is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!body.status) {
    return new Response(JSON.stringify({ error: 'status is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await supabase.rpc('bulk_update_deliverable_status', {
    p_deliverable_ids: body.deliverable_ids,
    p_new_status: body.status,
    p_notes: body.notes || null,
    p_updated_by: userId,
  });

  if (error) throw error;

  return new Response(JSON.stringify(data[0] || { updated_count: 0, failed_ids: [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleGetMouHealth(supabase: any, mouId: string) {
  const { data, error } = await supabase.rpc('calculate_mou_deliverables_health', {
    p_mou_id: mouId,
  });

  if (error) throw error;

  return new Response(JSON.stringify(data[0] || null), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleMilestones(
  supabase: any,
  req: Request,
  deliverableId: string,
  milestoneId: string | undefined,
  userId: string
) {
  switch (req.method) {
    case 'GET': {
      let query = supabase
        .from('deliverable_milestones')
        .select('*')
        .eq('deliverable_id', deliverableId)
        .order('sort_order', { ascending: true });

      if (milestoneId) {
        query = query.eq('id', milestoneId).single();
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    case 'POST': {
      const body: MilestoneInput = await req.json();

      if (!body.title_en || !body.title_ar) {
        return new Response(JSON.stringify({ error: 'title_en and title_ar are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const milestoneData = {
        ...body,
        deliverable_id: deliverableId,
        status: 'pending',
        weight: body.weight || 0,
        sort_order: body.sort_order || 0,
      };

      const { data, error } = await supabase
        .from('deliverable_milestones')
        .insert(milestoneData)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    case 'PUT':
    case 'PATCH': {
      if (!milestoneId) {
        return new Response(JSON.stringify({ error: 'Milestone ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const updateData: any = { ...body };

      // Handle completion
      if (body.status === 'completed' && !body.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('deliverable_milestones')
        .update(updateData)
        .eq('id', milestoneId)
        .eq('deliverable_id', deliverableId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    case 'DELETE': {
      if (!milestoneId) {
        return new Response(JSON.stringify({ error: 'Milestone ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('deliverable_milestones')
        .delete()
        .eq('id', milestoneId)
        .eq('deliverable_id', deliverableId);

      if (error) throw error;

      return new Response(JSON.stringify({ message: 'Milestone deleted successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
  }
}

async function handleDocuments(
  supabase: any,
  req: Request,
  deliverableId: string,
  documentId: string | undefined,
  userId: string
) {
  switch (req.method) {
    case 'GET': {
      let query = supabase
        .from('deliverable_documents')
        .select(
          `
          *,
          uploaded_by_user:uploaded_by(id, full_name)
        `
        )
        .eq('deliverable_id', deliverableId)
        .order('uploaded_at', { ascending: false });

      if (documentId) {
        query = query.eq('id', documentId).single();
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    case 'POST': {
      const body = await req.json();

      if (!body.document_url || !body.document_name || !body.file_size_bytes || !body.mime_type) {
        return new Response(
          JSON.stringify({
            error: 'document_url, document_name, file_size_bytes, and mime_type are required',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const documentData = {
        deliverable_id: deliverableId,
        document_url: body.document_url,
        document_name: body.document_name,
        file_size_bytes: body.file_size_bytes,
        mime_type: body.mime_type,
        description: body.description || null,
        uploaded_by: userId,
      };

      const { data, error } = await supabase
        .from('deliverable_documents')
        .insert(documentData)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    case 'DELETE': {
      if (!documentId) {
        return new Response(JSON.stringify({ error: 'Document ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('deliverable_documents')
        .delete()
        .eq('id', documentId)
        .eq('deliverable_id', deliverableId);

      if (error) throw error;

      return new Response(JSON.stringify({ message: 'Document deleted successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
  }
}

async function handleHistory(supabase: any, deliverableId: string) {
  const { data, error } = await supabase
    .from('deliverable_status_history')
    .select(
      `
      *,
      changed_by_user:changed_by(id, full_name)
    `
    )
    .eq('deliverable_id', deliverableId)
    .order('changed_at', { ascending: false });

  if (error) throw error;

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
