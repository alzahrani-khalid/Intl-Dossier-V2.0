/**
 * Edge Function: work-item-dossiers
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * CRUD operations for work item to dossier links.
 * POST: Create links
 * GET: List links for a work item
 * DELETE: Soft-delete a link
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

type WorkItemType = 'task' | 'commitment' | 'intake';
type InheritanceSource = 'direct' | 'engagement' | 'after_action' | 'position' | 'mou';
type ContextEntityType = 'engagement' | 'after_action_record' | 'position' | 'mou';

interface CreateLinkRequest {
  work_item_type: WorkItemType;
  work_item_id: string;
  dossier_ids: string[];
  inheritance_source: InheritanceSource;
  inherited_from_type?: ContextEntityType;
  inherited_from_id?: string;
  is_primary?: boolean;
}

interface WorkItemDossierLink {
  id: string;
  work_item_type: WorkItemType;
  work_item_id: string;
  dossier_id: string;
  inheritance_source: InheritanceSource;
  inherited_from_type: ContextEntityType | null;
  inherited_from_id: string | null;
  inheritance_path: any[];
  display_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

interface DossierReference {
  id: string;
  name_en: string;
  name_ar: string;
  type: string;
  status: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          error: 'Missing authorization header',
          code: 'UNAUTHORIZED',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create client with user token for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Invalid token or user not found',
          code: 'UNAUTHORIZED',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);

    // Route based on HTTP method
    switch (req.method) {
      case 'POST':
        return await handleCreate(supabase, req, user.id);
      case 'GET':
        return await handleList(supabase, url);
      case 'DELETE':
        return await handleDelete(supabase, url, user.id);
      default:
        return new Response(
          JSON.stringify({
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED',
          }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * POST: Create work item dossier links
 */
async function handleCreate(supabase: any, req: Request, userId: string): Promise<Response> {
  const body: CreateLinkRequest = await req.json();

  // Validate required fields
  if (!body.work_item_type || !body.work_item_id || !body.dossier_ids?.length) {
    return new Response(
      JSON.stringify({
        error: 'Missing required fields: work_item_type, work_item_id, dossier_ids',
        code: 'INVALID_REQUEST',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate work_item_type
  const validWorkItemTypes: WorkItemType[] = ['task', 'commitment', 'intake'];
  if (!validWorkItemTypes.includes(body.work_item_type)) {
    return new Response(
      JSON.stringify({
        error: `Invalid work_item_type: ${body.work_item_type}`,
        code: 'INVALID_REQUEST',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate inheritance_source
  const validSources: InheritanceSource[] = [
    'direct',
    'engagement',
    'after_action',
    'position',
    'mou',
  ];
  if (!validSources.includes(body.inheritance_source || 'direct')) {
    return new Response(
      JSON.stringify({
        error: `Invalid inheritance_source: ${body.inheritance_source}`,
        code: 'INVALID_REQUEST',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate inheritance metadata consistency
  const source = body.inheritance_source || 'direct';
  if (source === 'direct' && (body.inherited_from_type || body.inherited_from_id)) {
    return new Response(
      JSON.stringify({
        error: 'Direct links should not have inherited_from fields',
        code: 'INVALID_REQUEST',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  if (source !== 'direct' && (!body.inherited_from_type || !body.inherited_from_id)) {
    return new Response(
      JSON.stringify({
        error: 'Non-direct links require inherited_from_type and inherited_from_id',
        code: 'INVALID_REQUEST',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Build inheritance path
  let inheritancePath: any[] = [];
  if (body.inherited_from_type && body.inherited_from_id) {
    inheritancePath = [
      {
        type: body.inherited_from_type,
        id: body.inherited_from_id,
      },
    ];
  }

  // Create links for each dossier
  const linksToInsert = body.dossier_ids.map((dossierId, index) => ({
    work_item_type: body.work_item_type,
    work_item_id: body.work_item_id,
    dossier_id: dossierId,
    inheritance_source: source,
    inherited_from_type: body.inherited_from_type || null,
    inherited_from_id: body.inherited_from_id || null,
    inheritance_path: inheritancePath,
    display_order: index,
    is_primary: index === 0 && body.is_primary !== false,
    created_by: userId,
    updated_by: userId,
  }));

  const { data, error } = await supabase.from('work_item_dossiers').insert(linksToInsert).select();

  if (error) {
    console.error('Insert error:', error);

    // Handle unique constraint violation
    if (error.code === '23505') {
      return new Response(
        JSON.stringify({
          error: 'One or more dossier links already exist',
          code: 'DUPLICATE_LINK',
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to create dossier links',
        code: 'INTERNAL_ERROR',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(
    JSON.stringify({
      links: data,
      created_count: data.length,
    }),
    {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * GET: List dossier links for a work item
 */
async function handleList(supabase: any, url: URL): Promise<Response> {
  const workItemType = url.searchParams.get('work_item_type');
  const workItemId = url.searchParams.get('work_item_id');

  if (!workItemType || !workItemId) {
    return new Response(
      JSON.stringify({
        error: 'Missing required parameters: work_item_type, work_item_id',
        code: 'INVALID_REQUEST',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Fetch links with dossier details
  const { data: links, error: linksError } = await supabase
    .from('work_item_dossiers')
    .select(
      `
      id,
      work_item_type,
      work_item_id,
      dossier_id,
      inheritance_source,
      inherited_from_type,
      inherited_from_id,
      inheritance_path,
      display_order,
      is_primary,
      created_at,
      updated_at,
      dossiers (
        id,
        name_en,
        name_ar,
        type,
        status
      )
    `
    )
    .eq('work_item_type', workItemType)
    .eq('work_item_id', workItemId)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (linksError) {
    console.error('Query error:', linksError);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch dossier links',
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Find primary dossier
  const primaryLink = links?.find((l: any) => l.is_primary);
  const primaryDossier: DossierReference | null = primaryLink?.dossiers
    ? {
        id: primaryLink.dossiers.id,
        name_en: primaryLink.dossiers.name_en,
        name_ar: primaryLink.dossiers.name_ar,
        type: primaryLink.dossiers.type,
        status: primaryLink.dossiers.status,
      }
    : null;

  // Transform response
  const transformedLinks = (links || []).map((link: any) => ({
    id: link.id,
    work_item_type: link.work_item_type,
    work_item_id: link.work_item_id,
    dossier_id: link.dossier_id,
    inheritance_source: link.inheritance_source,
    inherited_from_type: link.inherited_from_type,
    inherited_from_id: link.inherited_from_id,
    inheritance_path: link.inheritance_path,
    display_order: link.display_order,
    is_primary: link.is_primary,
    created_at: link.created_at,
    updated_at: link.updated_at,
    dossier: link.dossiers
      ? {
          id: link.dossiers.id,
          name_en: link.dossiers.name_en,
          name_ar: link.dossiers.name_ar,
          type: link.dossiers.type,
          status: link.dossiers.status,
        }
      : null,
  }));

  return new Response(
    JSON.stringify({
      links: transformedLinks,
      primary_dossier: primaryDossier,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * DELETE: Soft-delete a dossier link
 */
async function handleDelete(supabase: any, url: URL, userId: string): Promise<Response> {
  // Extract link_id from path: /work-item-dossiers/{link_id}
  const pathParts = url.pathname.split('/');
  const linkId = pathParts[pathParts.length - 1];

  // If no link_id in path, try query param
  const linkIdParam = linkId !== 'work-item-dossiers' ? linkId : url.searchParams.get('link_id');

  if (!linkIdParam) {
    return new Response(
      JSON.stringify({
        error: 'Missing link_id parameter',
        code: 'INVALID_REQUEST',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Soft delete by setting deleted_at
  const { error } = await supabase
    .from('work_item_dossiers')
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('id', linkIdParam)
    .is('deleted_at', null);

  if (error) {
    console.error('Delete error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete dossier link',
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
