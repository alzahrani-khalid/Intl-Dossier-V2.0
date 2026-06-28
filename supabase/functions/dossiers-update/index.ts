import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

// Class-Table-Inheritance extension table per dossier type. Mirrors
// dossiers-create exactly — engagement extends `engagement_dossiers` (NOT
// `engagements`); elected_official is a person_subtype, not a distinct type.
const EXTENSION_TABLE_BY_TYPE: Record<string, string> = {
  country: 'countries',
  organization: 'organizations',
  forum: 'forums',
  engagement: 'engagement_dossiers',
  topic: 'topics',
  working_group: 'working_groups',
  person: 'persons',
}

const VALID_STATUSES = ['active', 'inactive', 'archived'] as const

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface DossierUpdateRequest {
  id: string
  name_en?: string
  name_ar?: string
  abbreviation?: string
  description_en?: string
  description_ar?: string
  status?: 'active' | 'inactive' | 'archived'
  // 1-4: 1=Public, 2=Internal, 3=Confidential, 4=Secret (integer column).
  sensitivity_level?: number
  tags?: string[]
  metadata?: Record<string, unknown>
  extensionData?: Record<string, unknown>
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Contract: POST { id, ...fields } — matches services/dossier-api.ts updateDossier().
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
      },
    )
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization')
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
        },
      )
    }

    // User-scoped client: every dossiers/extension mutation runs through RLS, so
    // a caller can only update dossiers their policies allow (authz mirrors the
    // read/create paths — no service-role escalation for the writes).
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    )

    // Service-role client is used ONLY for the non-critical MV refresh.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Resolve the current user from the JWT (passed directly, matching
    // dossiers-create/get — a bare getUser() 401s valid tokens on @2.39).
    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token)

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
        },
      )
    }

    // Parse and validate request body
    const body: DossierUpdateRequest = await req.json()

    const validationErrors: string[] = []

    if (!body.id || !UUID_REGEX.test(body.id)) {
      validationErrors.push('id is required and must be a valid UUID')
    }
    if (body.name_en !== undefined && (body.name_en.length < 2 || body.name_en.length > 200)) {
      validationErrors.push('name_en must be between 2 and 200 characters')
    }
    if (body.name_ar !== undefined && (body.name_ar.length < 2 || body.name_ar.length > 200)) {
      validationErrors.push('name_ar must be between 2 and 200 characters')
    }
    if (body.abbreviation !== undefined && body.abbreviation.length > 20) {
      validationErrors.push('abbreviation must be <= 20 characters')
    }
    if (
      body.status !== undefined &&
      !VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])
    ) {
      validationErrors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`)
    }
    if (
      body.sensitivity_level !== undefined &&
      (typeof body.sensitivity_level !== 'number' ||
        !Number.isInteger(body.sensitivity_level) ||
        body.sensitivity_level < 1 ||
        body.sensitivity_level > 4)
    ) {
      validationErrors.push('sensitivity_level must be an integer between 1 and 4')
    }
    if (
      body.tags !== undefined &&
      (body.tags.length > 20 || body.tags.some((tag) => tag.length > 50))
    ) {
      validationErrors.push('tags must have max 20 items, each <= 50 characters')
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
        },
      )
    }

    // Fetch the existing dossier (RLS applies) — needed to resolve `type` for the
    // extension table and to return a clean 404 before any write.
    const { data: existing, error: fetchError } = await supabaseClient
      .from('dossiers')
      .select('id, type')
      .eq('id', body.id)
      .single()

    if (fetchError || !existing) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message_en: 'Dossier not found',
            message_ar: 'الملف غير موجود',
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Build the base update object — only the fields the caller actually sent.
    const updateData: Record<string, unknown> = { updated_by: user.id }
    if (body.name_en !== undefined) updateData.name_en = body.name_en.trim()
    if (body.name_ar !== undefined) updateData.name_ar = body.name_ar.trim()
    if (body.abbreviation !== undefined)
      updateData.abbreviation = body.abbreviation.trim() || null
    if (body.description_en !== undefined) updateData.description_en = body.description_en || null
    if (body.description_ar !== undefined) updateData.description_ar = body.description_ar || null
    if (body.status !== undefined) updateData.status = body.status
    if (body.sensitivity_level !== undefined) updateData.sensitivity_level = body.sensitivity_level
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.metadata !== undefined) updateData.metadata = body.metadata

    const { data: updatedDossier, error: updateError } = await supabaseClient
      .from('dossiers')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating dossier:', updateError)

      // Unique name+type constraint (idx_dossiers_unique_name_type)
      if (updateError.code === '23505') {
        return new Response(
          JSON.stringify({
            error: {
              code: 'DUPLICATE_DOSSIER',
              message_en: `A ${existing.type} dossier with this name already exists.`,
              message_ar: 'يوجد ملف بهذا الاسم بالفعل.',
            },
          }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

      // RLS denial
      if (updateError.code === '42501') {
        return new Response(
          JSON.stringify({
            error: {
              code: 'FORBIDDEN',
              message_en: 'You do not have permission to update this dossier',
              message_ar: 'ليس لديك إذن لتحديث هذا الملف',
            },
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

      return new Response(
        JSON.stringify({
          error: {
            code: 'UPDATE_ERROR',
            message_en: 'Failed to update dossier',
            message_ar: 'فشل في تحديث الملف',
            details: updateError,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Update the type-specific extension row (Class Table Inheritance). Upsert on
    // the shared id keeps the write idempotent and self-heals a missing row.
    let extensionResult: Record<string, unknown> | null = null
    if (body.extensionData && Object.keys(body.extensionData).length > 0) {
      const extensionTable = EXTENSION_TABLE_BY_TYPE[existing.type]
      if (extensionTable) {
        const { data: extData, error: extError } = await supabaseClient
          .from(extensionTable)
          .upsert({ id: body.id, ...body.extensionData }, { onConflict: 'id' })
          .select()
          .single()

        if (extError) {
          console.error(`Failed to update extension data for ${existing.type}:`, extError)
          return new Response(
            JSON.stringify({
              error: {
                code: 'EXTENSION_UPDATE_ERROR',
                message_en: `Failed to update ${existing.type} details.`,
                message_ar: `فشل في تحديث تفاصيل ${existing.type}.`,
                details: extError,
              },
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          )
        }
        extensionResult = extData
      }
    }

    // Refresh the dossier list materialized view (non-blocking; needs elevated perms).
    supabaseAdmin.rpc('refresh_dossier_list_mv').then(({ error }) => {
      if (error) {
        console.warn('Failed to refresh materialized view (non-critical):', error)
      }
    })

    const result = extensionResult
      ? { ...updatedDossier, extension: extensionResult }
      : updatedDossier

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
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
      },
    )
  }
})
