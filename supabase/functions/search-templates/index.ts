/**
 * Supabase Edge Function: Search Templates
 * Feature: advanced-search-filters
 * Description: CRUD operations for saved search templates and presets
 *
 * GET /search-templates - List all accessible templates
 * GET /search-templates/:id - Get a specific template
 * POST /search-templates - Create a new template
 * PUT /search-templates/:id - Update a template
 * DELETE /search-templates/:id - Delete a template
 *
 * Query Parameters (GET list):
 * - category: Filter by category (quick, recent, popular, custom, system)
 * - limit: Max results (default 50)
 * - offset: Pagination offset (default 0)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface SearchTemplate {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  icon: string;
  color: string;
  category: string;
  template_definition: Record<string, unknown>;
  is_system: boolean;
  is_public: boolean;
  created_by: string | null;
  use_count: number;
  created_at: string;
  updated_at: string;
}

interface CreateTemplateRequest {
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  icon?: string;
  color?: string;
  category?: string;
  template_definition: Record<string, unknown>;
  is_public?: boolean;
}

interface UpdateTemplateRequest {
  name_en?: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  icon?: string;
  color?: string;
  category?: string;
  template_definition?: Record<string, unknown>;
  is_public?: boolean;
}

const VALID_CATEGORIES = ['quick', 'recent', 'popular', 'custom', 'system'];
const VALID_COLORS = [
  'blue',
  'green',
  'red',
  'purple',
  'orange',
  'yellow',
  'gray',
  'pink',
  'indigo',
  'teal',
];

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'unauthorized',
          message: 'Authorization header required',
          message_ar: 'مطلوب رأس التفويض',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: 'unauthorized',
          message: 'Invalid or expired token',
          message_ar: 'رمز غير صالح أو منتهي الصلاحية',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const templateId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;

    switch (req.method) {
      case 'GET':
        if (templateId && templateId !== 'search-templates') {
          return await getTemplate(supabase, templateId);
        }
        return await listTemplates(supabase, url, user.id);

      case 'POST':
        return await createTemplate(supabase, req, user.id);

      case 'PUT':
        if (!templateId) {
          return new Response(
            JSON.stringify({
              error: 'bad_request',
              message: 'Template ID is required',
              message_ar: 'معرف القالب مطلوب',
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        return await updateTemplate(supabase, templateId, req, user.id);

      case 'DELETE':
        if (!templateId) {
          return new Response(
            JSON.stringify({
              error: 'bad_request',
              message: 'Template ID is required',
              message_ar: 'معرف القالب مطلوب',
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        return await deleteTemplate(supabase, templateId, user.id);

      default:
        return new Response(
          JSON.stringify({
            error: 'method_not_allowed',
            message: 'Method not allowed',
            message_ar: 'الطريقة غير مسموح بها',
          }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    console.error('Search templates error:', error);
    return new Response(
      JSON.stringify({
        error: 'internal_server_error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        message_ar: 'حدث خطأ غير متوقع',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function listTemplates(supabase: ReturnType<typeof createClient>, url: URL, userId: string) {
  const category = url.searchParams.get('category');
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '50')), 100);
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));
  const sortBy = url.searchParams.get('sort_by') || 'use_count';
  const sortOrder = url.searchParams.get('sort_order') || 'desc';

  // Build query - get public templates and user's own templates
  let query = supabase
    .from('search_templates')
    .select('*', { count: 'exact' })
    .or(`is_public.eq.true,created_by.eq.${userId}`);

  // Apply category filter
  if (category && VALID_CATEGORIES.includes(category)) {
    query = query.eq('category', category);
  }

  // Apply sorting
  const ascending = sortOrder === 'asc';
  switch (sortBy) {
    case 'use_count':
      query = query.order('use_count', { ascending: false });
      break;
    case 'name':
      query = query.order('name_en', { ascending });
      break;
    case 'created_at':
      query = query.order('created_at', { ascending });
      break;
    case 'updated_at':
      query = query.order('updated_at', { ascending });
      break;
    default:
      query = query.order('use_count', { ascending: false });
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('List templates error:', error);
    return new Response(
      JSON.stringify({
        error: 'database_error',
        message: error.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(
    JSON.stringify({
      data: data || [],
      count: count || 0,
      limit,
      offset,
      metadata: {
        has_more: (count || 0) > offset + limit,
        next_offset: (count || 0) > offset + limit ? offset + limit : null,
      },
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function getTemplate(supabase: ReturnType<typeof createClient>, templateId: string) {
  const { data, error } = await supabase
    .from('search_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return new Response(
        JSON.stringify({
          error: 'not_found',
          message: 'Template not found',
          message_ar: 'القالب غير موجود',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    return new Response(
      JSON.stringify({
        error: 'database_error',
        message: error.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Increment use count
  await supabase.rpc('increment_template_use_count', { p_template_id: templateId });

  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function createTemplate(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  userId: string
) {
  const body: CreateTemplateRequest = await req.json();

  // Validate required fields
  if (!body.name_en || !body.name_ar) {
    return new Response(
      JSON.stringify({
        error: 'bad_request',
        message: 'name_en and name_ar are required',
        message_ar: 'name_en و name_ar مطلوبان',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  if (!body.template_definition) {
    return new Response(
      JSON.stringify({
        error: 'bad_request',
        message: 'template_definition is required',
        message_ar: 'template_definition مطلوب',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate category
  const category = body.category || 'custom';
  if (!VALID_CATEGORIES.includes(category)) {
    return new Response(
      JSON.stringify({
        error: 'bad_request',
        message: `Invalid category. Valid categories: ${VALID_CATEGORIES.join(', ')}`,
        message_ar: 'فئة غير صالحة',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Users cannot create system templates
  if (category === 'system') {
    return new Response(
      JSON.stringify({
        error: 'forbidden',
        message: 'Cannot create system templates',
        message_ar: 'لا يمكن إنشاء قوالب النظام',
      }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate color
  const color = body.color || 'blue';
  if (!VALID_COLORS.includes(color)) {
    return new Response(
      JSON.stringify({
        error: 'bad_request',
        message: `Invalid color. Valid colors: ${VALID_COLORS.join(', ')}`,
        message_ar: 'لون غير صالح',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const { data, error } = await supabase
    .from('search_templates')
    .insert({
      name_en: body.name_en,
      name_ar: body.name_ar,
      description_en: body.description_en || null,
      description_ar: body.description_ar || null,
      icon: body.icon || 'search',
      color,
      category,
      template_definition: body.template_definition,
      is_system: false,
      is_public: body.is_public ?? false,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Create template error:', error);
    return new Response(
      JSON.stringify({
        error: 'database_error',
        message: error.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(JSON.stringify({ data }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateTemplate(
  supabase: ReturnType<typeof createClient>,
  templateId: string,
  req: Request,
  userId: string
) {
  // First check if template exists and user owns it
  const { data: existing, error: fetchError } = await supabase
    .from('search_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return new Response(
        JSON.stringify({
          error: 'not_found',
          message: 'Template not found',
          message_ar: 'القالب غير موجود',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    return new Response(
      JSON.stringify({
        error: 'database_error',
        message: fetchError.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Check ownership
  if (existing.created_by !== userId) {
    return new Response(
      JSON.stringify({
        error: 'forbidden',
        message: 'You can only update your own templates',
        message_ar: 'يمكنك تحديث قوالبك فقط',
      }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Check if system template
  if (existing.is_system) {
    return new Response(
      JSON.stringify({
        error: 'forbidden',
        message: 'System templates cannot be modified',
        message_ar: 'لا يمكن تعديل قوالب النظام',
      }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const body: UpdateTemplateRequest = await req.json();

  // Validate category if provided
  if (body.category && !VALID_CATEGORIES.includes(body.category)) {
    return new Response(
      JSON.stringify({
        error: 'bad_request',
        message: `Invalid category. Valid categories: ${VALID_CATEGORIES.join(', ')}`,
        message_ar: 'فئة غير صالحة',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Cannot change to system category
  if (body.category === 'system') {
    return new Response(
      JSON.stringify({
        error: 'forbidden',
        message: 'Cannot change category to system',
        message_ar: 'لا يمكن تغيير الفئة إلى نظام',
      }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate color if provided
  if (body.color && !VALID_COLORS.includes(body.color)) {
    return new Response(
      JSON.stringify({
        error: 'bad_request',
        message: `Invalid color. Valid colors: ${VALID_COLORS.join(', ')}`,
        message_ar: 'لون غير صالح',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {};
  if (body.name_en !== undefined) updates.name_en = body.name_en;
  if (body.name_ar !== undefined) updates.name_ar = body.name_ar;
  if (body.description_en !== undefined) updates.description_en = body.description_en;
  if (body.description_ar !== undefined) updates.description_ar = body.description_ar;
  if (body.icon !== undefined) updates.icon = body.icon;
  if (body.color !== undefined) updates.color = body.color;
  if (body.category !== undefined) updates.category = body.category;
  if (body.template_definition !== undefined)
    updates.template_definition = body.template_definition;
  if (body.is_public !== undefined) updates.is_public = body.is_public;

  const { data, error } = await supabase
    .from('search_templates')
    .update(updates)
    .eq('id', templateId)
    .select()
    .single();

  if (error) {
    console.error('Update template error:', error);
    return new Response(
      JSON.stringify({
        error: 'database_error',
        message: error.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteTemplate(
  supabase: ReturnType<typeof createClient>,
  templateId: string,
  userId: string
) {
  // First check if template exists and user owns it
  const { data: existing, error: fetchError } = await supabase
    .from('search_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return new Response(
        JSON.stringify({
          error: 'not_found',
          message: 'Template not found',
          message_ar: 'القالب غير موجود',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    return new Response(
      JSON.stringify({
        error: 'database_error',
        message: fetchError.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Check ownership
  if (existing.created_by !== userId) {
    return new Response(
      JSON.stringify({
        error: 'forbidden',
        message: 'You can only delete your own templates',
        message_ar: 'يمكنك حذف قوالبك فقط',
      }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Check if system template
  if (existing.is_system) {
    return new Response(
      JSON.stringify({
        error: 'forbidden',
        message: 'System templates cannot be deleted',
        message_ar: 'لا يمكن حذف قوالب النظام',
      }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const { error } = await supabase.from('search_templates').delete().eq('id', templateId);

  if (error) {
    console.error('Delete template error:', error);
    return new Response(
      JSON.stringify({
        error: 'database_error',
        message: error.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
