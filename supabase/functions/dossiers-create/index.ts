import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { getDossierDetailPath } from '../_shared/dossier-routes.ts';

// All supported dossier types
// Note: elected_official is now a person_subtype, not a separate dossier type
const VALID_DOSSIER_TYPES = [
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person',
] as const;

type DossierType = (typeof VALID_DOSSIER_TYPES)[number];

// Types with required extension fields (from database NOT NULL constraints)
const TYPES_WITH_REQUIRED_EXTENSION: Partial<Record<DossierType, string[]>> = {
  country: ['iso_code_2', 'iso_code_3'],
  organization: ['org_type'],
  engagement: ['engagement_type', 'engagement_category'],
};

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

    // Create Supabase client with user token (for RLS-protected operations)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Create service_role client for admin operations (MV refresh)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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

    // Validate required extension fields for types that need them
    const requiredFields = TYPES_WITH_REQUIRED_EXTENSION[body.type as DossierType];
    if (requiredFields && requiredFields.length > 0) {
      const extensionData = body.extensionData || {};
      for (const field of requiredFields) {
        if (!extensionData[field]) {
          validationErrors.push(`${field} is required for ${body.type} dossiers`);
        }
      }
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

    // Check for existing dossier with same name+type (pre-check before DB constraint)
    const { data: existingDossier } = await supabaseClient
      .from('dossiers')
      .select('id, name_en, status')
      .ilike('name_en', body.name_en.trim())
      .eq('type', body.type)
      .not('status', 'in', '("deleted","archived")')
      .limit(1)
      .maybeSingle();

    if (existingDossier) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'DUPLICATE_DOSSIER',
            message_en: `A ${body.type} dossier with the name "${body.name_en}" already exists.`,
            message_ar: `ملف ${body.type} بالاسم "${body.name_en}" موجود بالفعل.`,
            existing_id: existingDossier.id,
          },
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert dossier (RLS policy will check permissions)
    // The DB unique constraint idx_dossiers_unique_name_type is the final safety net
    const { data: dossier, error: insertError } = await supabaseClient
      .from('dossiers')
      .insert({
        name_en: body.name_en.trim(),
        name_ar: body.name_ar.trim(),
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

      // Check for unique constraint violation (race condition safety net)
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({
            error: {
              code: 'DUPLICATE_DOSSIER',
              message_en: `A ${body.type} dossier with the name "${body.name_en}" already exists.`,
              message_ar: `ملف ${body.type} بالاسم "${body.name_en}" موجود بالفعل.`,
            },
          }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

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
          console.error(`Failed to insert extension data for ${body.type}:`, extError);

          // ATOMIC ROLLBACK: Delete the base dossier if extension insert fails
          // This ensures we don't have orphaned dossiers without their required extension data
          const { error: deleteError } = await supabaseClient
            .from('dossiers')
            .delete()
            .eq('id', dossier.id);

          if (deleteError) {
            console.error('Failed to rollback dossier after extension error:', deleteError);
          }

          return new Response(
            JSON.stringify({
              error: {
                code: 'EXTENSION_INSERT_ERROR',
                message_en: `Failed to create ${body.type} extension data. The dossier was not created.`,
                message_ar: `فشل في إنشاء بيانات ${body.type} الإضافية. لم يتم إنشاء الملف.`,
                details: extError,
              },
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        } else {
          extensionResult = extData;
        }
      }
    }

    // Refresh the materialized view to include the new dossier
    // Use service_role client since refresh requires elevated permissions
    // This is non-blocking - we don't wait for it to complete
    supabaseAdmin.rpc('refresh_dossier_list_mv').then(({ error }) => {
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
