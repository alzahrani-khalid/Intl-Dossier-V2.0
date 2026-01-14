/**
 * Entity Templates Edge Function
 * Feature: Entity Creation Templates
 *
 * Endpoints:
 * - GET: List templates for an entity type with context-aware filtering
 * - POST: Create a new template
 * - PUT: Update an existing template
 * - DELETE: Delete a template
 *
 * Query params (GET):
 * - entity_type: template_entity_type (required)
 * - context: JSON string of context conditions
 * - include_recent: boolean (default true)
 * - limit: number (default 20)
 *
 * Actions (POST with action field):
 * - create: Create new template
 * - track-usage: Track template usage
 * - toggle-favorite: Toggle favorite status
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// Types
type TemplateEntityType =
  | 'dossier'
  | 'engagement'
  | 'commitment'
  | 'task'
  | 'intake'
  | 'position'
  | 'contact'
  | 'calendar_event';

type TemplateScope = 'system' | 'team' | 'personal';
type TemplateStatus = 'draft' | 'published' | 'archived';

interface TemplateCreateRequest {
  action: 'create';
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  entity_type: TemplateEntityType;
  scope?: TemplateScope;
  icon?: string;
  color?: string;
  default_values: Record<string, unknown>;
  suggested_relationships?: Array<{
    entity_type: string;
    relationship_type: string;
  }>;
  context_conditions?: Record<string, unknown>;
  keyboard_shortcut?: string;
  tags?: string[];
}

interface TrackUsageRequest {
  action: 'track-usage';
  template_id: string;
}

interface ToggleFavoriteRequest {
  action: 'toggle-favorite';
  template_id: string;
}

type TemplateRequest = TemplateCreateRequest | TrackUsageRequest | ToggleFavoriteRequest;

const VALID_ENTITY_TYPES: TemplateEntityType[] = [
  'dossier',
  'engagement',
  'commitment',
  'task',
  'intake',
  'position',
  'contact',
  'calendar_event',
];

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Missing authorization header',
            message_ar: 'رأس التفويض مفقود',
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with user context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Invalid user session',
            message_ar: 'جلسة مستخدم غير صالحة',
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Route by method
    switch (req.method) {
      case 'GET':
        return await handleGet(req, supabaseClient);
      case 'POST':
        return await handlePost(req, supabaseClient, user.id);
      case 'PUT':
        return await handlePut(req, supabaseClient, user.id);
      case 'DELETE':
        return await handleDelete(req, supabaseClient, user.id);
      default:
        return new Response(
          JSON.stringify({
            error: {
              code: 'METHOD_NOT_ALLOWED',
              message_en: 'Method not allowed',
              message_ar: 'الطريقة غير مسموح بها',
            },
          }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message_en: 'An unexpected error occurred',
          message_ar: 'حدث خطأ غير متوقع',
          correlation_id: crypto.randomUUID(),
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// GET: List templates
async function handleGet(req: Request, supabaseClient: ReturnType<typeof createClient>) {
  const url = new URL(req.url);
  const entityType = url.searchParams.get('entity_type') as TemplateEntityType;
  const contextStr = url.searchParams.get('context') || '{}';
  const includeRecent = url.searchParams.get('include_recent') !== 'false';
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  // Validate entity_type
  if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message_en: `Invalid entity_type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
          message_ar: `نوع الكيان غير صالح. يجب أن يكون واحدًا من: ${VALID_ENTITY_TYPES.join(', ')}`,
        },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Parse context
  let context: Record<string, unknown> = {};
  try {
    context = JSON.parse(contextStr);
  } catch {
    // Ignore parse errors, use empty context
  }

  // Call the RPC function
  const { data, error } = await supabaseClient.rpc('get_entity_templates', {
    p_entity_type: entityType,
    p_context: context,
    p_include_recent: includeRecent,
    p_limit: Math.min(limit, 50), // Cap at 50
  });

  if (error) {
    console.error('Error fetching templates:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'FETCH_ERROR',
          message_en: 'Failed to fetch templates',
          message_ar: 'فشل في جلب القوالب',
          details: error,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(
    JSON.stringify({
      templates: data || [],
      count: data?.length || 0,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// POST: Create template or actions
async function handlePost(
  req: Request,
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
) {
  const body: TemplateRequest = await req.json();

  switch (body.action) {
    case 'create':
      return await createTemplate(supabaseClient, body, userId);
    case 'track-usage':
      return await trackUsage(supabaseClient, body);
    case 'toggle-favorite':
      return await toggleFavorite(supabaseClient, body);
    default:
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_ACTION',
            message_en: 'Invalid action. Use: create, track-usage, toggle-favorite',
            message_ar: 'إجراء غير صالح. استخدم: create, track-usage, toggle-favorite',
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
  }
}

// Create template
async function createTemplate(
  supabaseClient: ReturnType<typeof createClient>,
  body: TemplateCreateRequest,
  userId: string
) {
  // Validation
  const errors: string[] = [];

  if (!body.name_en || body.name_en.length > 200) {
    errors.push('name_en is required and must be <= 200 characters');
  }
  if (!body.name_ar || body.name_ar.length > 200) {
    errors.push('name_ar is required and must be <= 200 characters');
  }
  if (!body.entity_type || !VALID_ENTITY_TYPES.includes(body.entity_type)) {
    errors.push(`entity_type must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
  }
  if (!body.default_values || typeof body.default_values !== 'object') {
    errors.push('default_values must be a valid JSON object');
  }

  if (errors.length > 0) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message_en: 'Validation failed',
          message_ar: 'فشل التحقق من الصحة',
          details: errors,
        },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Insert template
  const { data: template, error: insertError } = await supabaseClient
    .from('entity_templates')
    .insert({
      name_en: body.name_en,
      name_ar: body.name_ar,
      description_en: body.description_en || null,
      description_ar: body.description_ar || null,
      entity_type: body.entity_type,
      scope: body.scope || 'personal',
      status: 'published', // Auto-publish personal templates
      icon: body.icon || 'FileText',
      color: body.color || 'blue',
      default_values: body.default_values,
      suggested_relationships: body.suggested_relationships || [],
      context_conditions: body.context_conditions || {},
      keyboard_shortcut: body.keyboard_shortcut || null,
      created_by: userId,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating template:', insertError);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INSERT_ERROR',
          message_en: 'Failed to create template',
          message_ar: 'فشل في إنشاء القالب',
          details: insertError,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Insert tags if provided
  if (body.tags && body.tags.length > 0) {
    const tagInserts = body.tags.map((tag) => ({
      template_id: template.id,
      tag: tag.toLowerCase().trim(),
    }));

    await supabaseClient.from('entity_template_tags').insert(tagInserts);
  }

  return new Response(JSON.stringify(template), {
    status: 201,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      Location: `/entity-templates/${template.id}`,
    },
  });
}

// Track usage
async function trackUsage(
  supabaseClient: ReturnType<typeof createClient>,
  body: TrackUsageRequest
) {
  if (!body.template_id) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message_en: 'template_id is required',
          message_ar: 'معرف القالب مطلوب',
        },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const { error } = await supabaseClient.rpc('track_template_usage', {
    p_template_id: body.template_id,
  });

  if (error) {
    console.error('Error tracking usage:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'TRACK_ERROR',
          message_en: 'Failed to track usage',
          message_ar: 'فشل في تتبع الاستخدام',
          details: error,
        },
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

// Toggle favorite
async function toggleFavorite(
  supabaseClient: ReturnType<typeof createClient>,
  body: ToggleFavoriteRequest
) {
  if (!body.template_id) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message_en: 'template_id is required',
          message_ar: 'معرف القالب مطلوب',
        },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const { data: isFavorite, error } = await supabaseClient.rpc('toggle_favorite_template', {
    p_template_id: body.template_id,
  });

  if (error) {
    console.error('Error toggling favorite:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'TOGGLE_ERROR',
          message_en: 'Failed to toggle favorite',
          message_ar: 'فشل في تبديل المفضلة',
          details: error,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      is_favorite: isFavorite,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// PUT: Update template
async function handlePut(
  req: Request,
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
) {
  const body = await req.json();

  if (!body.id) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message_en: 'Template ID is required',
          message_ar: 'معرف القالب مطلوب',
        },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Build update object (only allowed fields)
  const updates: Record<string, unknown> = {};
  if (body.name_en) updates.name_en = body.name_en;
  if (body.name_ar) updates.name_ar = body.name_ar;
  if (body.description_en !== undefined) updates.description_en = body.description_en;
  if (body.description_ar !== undefined) updates.description_ar = body.description_ar;
  if (body.icon) updates.icon = body.icon;
  if (body.color) updates.color = body.color;
  if (body.default_values) updates.default_values = body.default_values;
  if (body.suggested_relationships !== undefined)
    updates.suggested_relationships = body.suggested_relationships;
  if (body.context_conditions !== undefined) updates.context_conditions = body.context_conditions;
  if (body.keyboard_shortcut !== undefined) updates.keyboard_shortcut = body.keyboard_shortcut;
  if (body.status) updates.status = body.status;

  const { data: template, error } = await supabaseClient
    .from('entity_templates')
    .update(updates)
    .eq('id', body.id)
    .eq('created_by', userId) // Ensure user owns the template
    .select()
    .single();

  if (error) {
    console.error('Error updating template:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'UPDATE_ERROR',
          message_en: 'Failed to update template',
          message_ar: 'فشل في تحديث القالب',
          details: error,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Update tags if provided
  if (body.tags) {
    // Delete existing tags
    await supabaseClient.from('entity_template_tags').delete().eq('template_id', body.id);

    // Insert new tags
    if (body.tags.length > 0) {
      const tagInserts = body.tags.map((tag: string) => ({
        template_id: body.id,
        tag: tag.toLowerCase().trim(),
      }));

      await supabaseClient.from('entity_template_tags').insert(tagInserts);
    }
  }

  return new Response(JSON.stringify(template), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// DELETE: Delete template
async function handleDelete(
  req: Request,
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
) {
  const url = new URL(req.url);
  const templateId = url.searchParams.get('id');

  if (!templateId) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message_en: 'Template ID is required',
          message_ar: 'معرف القالب مطلوب',
        },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const { error } = await supabaseClient
    .from('entity_templates')
    .delete()
    .eq('id', templateId)
    .eq('created_by', userId); // Ensure user owns the template

  if (error) {
    console.error('Error deleting template:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'DELETE_ERROR',
          message_en: 'Failed to delete template',
          message_ar: 'فشل في حذف القالب',
          details: error,
        },
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
