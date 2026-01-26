import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { getDossierDetailPath } from '../_shared/dossier-routes.ts';

// All supported dossier types
const VALID_DOSSIER_TYPES = [
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person',
  'elected_official',
] as const;

type DossierType = (typeof VALID_DOSSIER_TYPES)[number];

interface DossierCreateRequest {
  name_en: string;
  name_ar: string;
  type: DossierType;
  description_en?: string;
  description_ar?: string;
  status?: 'active' | 'inactive' | 'archived';
  sensitivity_level?: number; // 1-4: 1=Public, 2=Internal, 3=Confidential, 4=Secret
  tags?: string[];
  metadata?: Record<string, unknown>;
  extensionData?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
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

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user by passing the JWT token directly
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

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

    // Parse and validate request body
    const body: DossierCreateRequest = await req.json();

    // Validation
    const validationErrors: string[] = [];

    if (!body.name_en || body.name_en.length > 200) {
      validationErrors.push('name_en is required and must be <= 200 characters');
    }
    if (!body.name_ar || body.name_ar.length > 200) {
      validationErrors.push('name_ar is required and must be <= 200 characters');
    }
    if (!VALID_DOSSIER_TYPES.includes(body.type as DossierType)) {
      validationErrors.push(`type must be one of: ${VALID_DOSSIER_TYPES.join(', ')}`);
    }
    if (
      body.sensitivity_level !== undefined &&
      (typeof body.sensitivity_level !== 'number' ||
        body.sensitivity_level < 1 ||
        body.sensitivity_level > 4)
    ) {
      validationErrors.push('sensitivity_level must be a number between 1 and 4');
    }
    if (body.tags && (body.tags.length > 20 || body.tags.some((tag) => tag.length > 50))) {
      validationErrors.push('tags must have max 20 items, each <= 50 characters');
    }

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message_en: 'Validation failed',
            message_ar: 'فشل التحقق من الصحة',
            details: validationErrors,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert dossier (RLS policy will check permissions)
    const { data: dossier, error: insertError } = await supabaseClient
      .from('dossiers')
      .insert({
        name_en: body.name_en,
        name_ar: body.name_ar,
        type: body.type,
        description_en: body.description_en || null,
        description_ar: body.description_ar || null,
        status: body.status || 'active',
        sensitivity_level: body.sensitivity_level || 1, // Default: Public
        tags: body.tags || [],
        metadata: body.metadata || {},
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating dossier:', insertError);

      // Check if it's a permission error
      if (insertError.code === '42501') {
        return new Response(
          JSON.stringify({
            error: {
              code: 'FORBIDDEN',
              message_en: 'You do not have permission to create dossiers',
              message_ar: 'ليس لديك إذن لإنشاء الملفات',
            },
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: {
            code: 'INSERT_ERROR',
            message_en: 'Failed to create dossier',
            message_ar: 'فشل في إنشاء الملف',
            details: insertError,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Auto-assign creator as owner
    const { error: ownerError } = await supabaseClient.from('dossier_owners').insert({
      dossier_id: dossier.id,
      user_id: user.id,
      role_type: 'owner',
    });

    if (ownerError) {
      console.warn('Failed to assign owner (non-critical):', ownerError);
      // Non-critical error - dossier was created successfully
    }

    // Handle extension data for specific types
    let extensionResult = null;
    if (body.extensionData && Object.keys(body.extensionData).length > 0) {
      const extensionTableMap: Record<string, string> = {
        country: 'countries',
        organization: 'organizations',
        forum: 'forums',
        engagement: 'engagements',
        topic: 'topics',
        working_group: 'working_groups',
        person: 'persons',
        elected_official: 'elected_officials',
      };

      const extensionTable = extensionTableMap[body.type];
      if (extensionTable) {
        const { data: extData, error: extError } = await supabaseClient
          .from(extensionTable)
          .insert({
            id: dossier.id,
            ...body.extensionData,
          })
          .select()
          .single();

        if (extError) {
          console.warn(`Failed to insert extension data for ${body.type}:`, extError);
          // Non-critical - base dossier was created
        } else {
          extensionResult = extData;
        }
      }
    }

    // Refresh the materialized view to include the new dossier
    // This is non-blocking - we don't wait for it to complete
    supabaseClient.rpc('refresh_dossier_list_mv').then(({ error }) => {
      if (error) {
        console.warn('Failed to refresh materialized view (non-critical):', error);
      }
    });

    // Return dossier with extension data if available
    const result = extensionResult ? { ...dossier, extension: extensionResult } : dossier;

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        Location: getDossierDetailPath(dossier.id, dossier.type),
      },
    });
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
