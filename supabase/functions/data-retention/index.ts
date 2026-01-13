import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

interface RetentionPolicy {
  id?: string;
  code: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  entity_type: string;
  document_class?: string;
  sensitivity_level?: number;
  dossier_type?: string;
  retention_days: number;
  warning_days: number;
  action: string;
  archive_storage_bucket?: string;
  archive_path_template?: string;
  status: string;
  priority: number;
  regulatory_reference?: string;
  compliance_notes?: string;
}

interface LegalHold {
  id?: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  reference_number: string;
  entity_type?: string;
  entity_ids?: string[];
  keywords?: string[];
  date_range_start?: string;
  date_range_end?: string;
  custodians?: string[];
  status: string;
  reason_en: string;
  reason_ar: string;
  legal_matter?: string;
  effective_date: string;
  expiry_date?: string;
  notify_custodians?: boolean;
}

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

    // Check admin role
    const isAdmin = user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';

    // Extract path and determine action
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const resource = pathParts[pathParts.length - 2] || pathParts[pathParts.length - 1];
    const resourceId =
      pathParts[pathParts.length - 1] !== resource ? pathParts[pathParts.length - 1] : null;

    // Route based on method and path
    switch (req.method) {
      case 'GET':
        return handleGet(supabaseClient, url, resource, resourceId);

      case 'POST':
        if (!isAdmin) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'FORBIDDEN',
                message_en: 'Admin access required',
                message_ar: 'يلزم وصول المشرف',
              },
            }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        return handlePost(supabaseClient, req, url, resource, user.id);

      case 'PUT':
      case 'PATCH':
        if (!isAdmin) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'FORBIDDEN',
                message_en: 'Admin access required',
                message_ar: 'يلزم وصول المشرف',
              },
            }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        return handleUpdate(supabaseClient, req, resourceId, resource, user.id);

      case 'DELETE':
        if (!isAdmin) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'FORBIDDEN',
                message_en: 'Admin access required',
                message_ar: 'يلزم وصول المشرف',
              },
            }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        return handleDelete(supabaseClient, resourceId, resource);

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

async function handleGet(
  supabase: ReturnType<typeof createClient>,
  url: URL,
  resource: string,
  resourceId: string | null
) {
  const searchParams = url.searchParams;

  // Handle different GET operations
  if (resource === 'policies' || resource === 'data-retention') {
    if (resourceId && resourceId !== 'policies') {
      // Get single policy
      const { data, error } = await supabase
        .from('data_retention_policies')
        .select('*')
        .eq('id', resourceId)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'NOT_FOUND',
              message_en: 'Policy not found',
              message_ar: 'السياسة غير موجودة',
            },
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // List policies with filtering
    let query = supabase.from('data_retention_policies').select('*');

    const status = searchParams.get('status');
    const entityType = searchParams.get('entity_type');
    const documentClass = searchParams.get('document_class');

    if (status) query = query.eq('status', status);
    if (entityType) query = query.eq('entity_type', entityType);
    if (documentClass) query = query.eq('document_class', documentClass);

    query = query.order('priority', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'FETCH_ERROR',
            message_en: 'Failed to fetch policies',
            message_ar: 'فشل في جلب السياسات',
            details: error,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (resource === 'legal-holds') {
    if (resourceId && resourceId !== 'legal-holds') {
      // Get single legal hold
      const { data, error } = await supabase
        .from('legal_holds')
        .select('*')
        .eq('id', resourceId)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'NOT_FOUND',
              message_en: 'Legal hold not found',
              message_ar: 'الحجز القانوني غير موجود',
            },
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // List legal holds
    let query = supabase.from('legal_holds').select('*');

    const status = searchParams.get('status');
    if (status) query = query.eq('status', status);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'FETCH_ERROR',
            message_en: 'Failed to fetch legal holds',
            message_ar: 'فشل في جلب الحجوزات القانونية',
            details: error,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (resource === 'statistics') {
    // Get retention statistics
    const { data, error } = await supabase.rpc('get_retention_statistics');

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'FETCH_ERROR',
            message_en: 'Failed to fetch statistics',
            message_ar: 'فشل في جلب الإحصائيات',
            details: error,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (resource === 'expiring') {
    // Get expiring entities
    const daysAhead = parseInt(searchParams.get('days') || '30');
    const entityType = searchParams.get('entity_type') || null;
    const limit = parseInt(searchParams.get('limit') || '100');

    const { data, error } = await supabase.rpc('get_expiring_entities', {
      p_days_ahead: daysAhead,
      p_entity_type: entityType,
      p_limit: limit,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'FETCH_ERROR',
            message_en: 'Failed to fetch expiring entities',
            message_ar: 'فشل في جلب الكيانات المنتهية',
            details: error,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (resource === 'pending-actions') {
    // Get pending retention actions
    const entityType = searchParams.get('entity_type') || null;
    const action = searchParams.get('action') || null;
    const limit = parseInt(searchParams.get('limit') || '100');

    const { data, error } = await supabase.rpc('get_pending_retention_actions', {
      p_entity_type: entityType,
      p_action: action,
      p_limit: limit,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'FETCH_ERROR',
            message_en: 'Failed to fetch pending actions',
            message_ar: 'فشل في جلب الإجراءات المعلقة',
            details: error,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (resource === 'execution-log') {
    // Get execution log
    let query = supabase.from('retention_execution_log').select('*');

    const executionType = searchParams.get('type');
    const policyId = searchParams.get('policy_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (executionType) query = query.eq('execution_type', executionType);
    if (policyId) query = query.eq('policy_id', policyId);

    query = query.order('started_at', { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'FETCH_ERROR',
            message_en: 'Failed to fetch execution log',
            message_ar: 'فشل في جلب سجل التنفيذ',
            details: error,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      error: {
        code: 'NOT_FOUND',
        message_en: 'Resource not found',
        message_ar: 'المورد غير موجود',
      },
    }),
    {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handlePost(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  url: URL,
  resource: string,
  userId: string
) {
  const body = await req.json();

  if (resource === 'policies' || resource === 'data-retention') {
    // Create new policy
    const policy: RetentionPolicy = body;

    const { data, error } = await supabase
      .from('data_retention_policies')
      .insert({
        ...policy,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'CREATE_ERROR',
            message_en: 'Failed to create policy',
            message_ar: 'فشل في إنشاء السياسة',
            details: error,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ data }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (resource === 'legal-holds') {
    // Create new legal hold
    const hold: LegalHold = body;

    const { data, error } = await supabase
      .from('legal_holds')
      .insert({
        ...hold,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'CREATE_ERROR',
            message_en: 'Failed to create legal hold',
            message_ar: 'فشل في إنشاء الحجز القانوني',
            details: error,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Apply legal hold if active
    if (hold.status === 'active' && data) {
      await supabase.rpc('manage_legal_hold', {
        p_legal_hold_id: data.id,
        p_action: 'apply',
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (resource === 'apply-policy') {
    // Apply retention policy to entity
    const { entity_type, entity_id, document_class, sensitivity_level, dossier_type } = body;

    const { data, error } = await supabase.rpc('apply_retention_policy', {
      p_entity_type: entity_type,
      p_entity_id: entity_id,
      p_document_class: document_class || null,
      p_sensitivity_level: sensitivity_level || null,
      p_dossier_type: dossier_type || null,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'APPLY_ERROR',
            message_en: 'Failed to apply retention policy',
            message_ar: 'فشل في تطبيق سياسة الاحتفاظ',
            details: error,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ status_id: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (resource === 'manual-hold') {
    // Set manual hold on entity
    const { entity_type, entity_id, reason, until } = body;

    const { data, error } = await supabase
      .from('entity_retention_status')
      .upsert(
        {
          entity_type,
          entity_id,
          manual_hold: true,
          manual_hold_reason: reason,
          manual_hold_by: userId,
          manual_hold_until: until || null,
        },
        { onConflict: 'entity_type,entity_id' }
      )
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'HOLD_ERROR',
            message_en: 'Failed to set manual hold',
            message_ar: 'فشل في تعيين الحجز اليدوي',
            details: error,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (resource === 'release-hold') {
    // Release legal hold
    const { legal_hold_id } = body;

    const { data, error } = await supabase.rpc('manage_legal_hold', {
      p_legal_hold_id: legal_hold_id,
      p_action: 'release',
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'RELEASE_ERROR',
            message_en: 'Failed to release legal hold',
            message_ar: 'فشل في إطلاق الحجز القانوني',
            details: error,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ affected_count: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      error: {
        code: 'NOT_FOUND',
        message_en: 'Resource not found',
        message_ar: 'المورد غير موجود',
      },
    }),
    {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleUpdate(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  resourceId: string | null,
  resource: string,
  userId: string
) {
  if (!resourceId) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'MISSING_ID',
          message_en: 'Resource ID is required',
          message_ar: 'معرف المورد مطلوب',
        },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const body = await req.json();

  if (resource === 'policies') {
    const { data, error } = await supabase
      .from('data_retention_policies')
      .update({
        ...body,
        updated_by: userId,
      })
      .eq('id', resourceId)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UPDATE_ERROR',
            message_en: 'Failed to update policy',
            message_ar: 'فشل في تحديث السياسة',
            details: error,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (resource === 'legal-holds') {
    const { data, error } = await supabase
      .from('legal_holds')
      .update({
        ...body,
        updated_by: userId,
      })
      .eq('id', resourceId)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UPDATE_ERROR',
            message_en: 'Failed to update legal hold',
            message_ar: 'فشل في تحديث الحجز القانوني',
            details: error,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      error: {
        code: 'NOT_FOUND',
        message_en: 'Resource not found',
        message_ar: 'المورد غير موجود',
      },
    }),
    {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleDelete(
  supabase: ReturnType<typeof createClient>,
  resourceId: string | null,
  resource: string
) {
  if (!resourceId) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'MISSING_ID',
          message_en: 'Resource ID is required',
          message_ar: 'معرف المورد مطلوب',
        },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  if (resource === 'policies') {
    // Soft delete by setting status to archived
    const { error } = await supabase
      .from('data_retention_policies')
      .update({ status: 'archived' })
      .eq('id', resourceId);

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'DELETE_ERROR',
            message_en: 'Failed to delete policy',
            message_ar: 'فشل في حذف السياسة',
            details: error,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (resource === 'legal-holds') {
    // Can only delete if not active
    const { data: hold } = await supabase
      .from('legal_holds')
      .select('status')
      .eq('id', resourceId)
      .single();

    if (hold?.status === 'active') {
      return new Response(
        JSON.stringify({
          error: {
            code: 'CANNOT_DELETE',
            message_en: 'Cannot delete active legal hold. Release it first.',
            message_ar: 'لا يمكن حذف حجز قانوني نشط. قم بتحريره أولاً.',
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { error } = await supabase.from('legal_holds').delete().eq('id', resourceId);

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'DELETE_ERROR',
            message_en: 'Failed to delete legal hold',
            message_ar: 'فشل في حذف الحجز القانوني',
            details: error,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return new Response(
    JSON.stringify({
      error: {
        code: 'NOT_FOUND',
        message_en: 'Resource not found',
        message_ar: 'المورد غير موجود',
      },
    }),
    {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
