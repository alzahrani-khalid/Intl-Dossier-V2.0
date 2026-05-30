/**
 * Engagement Briefs Edge Function
 * Feature: engagement-brief-linking
 *
 * Manual brief management for engagement dossiers. The `engagement_briefs`
 * object is a VIEW (UNION of `briefs` + `ai_briefs` filtered by
 * engagement_dossier_id), so:
 *   - list/context read it via SECURITY DEFINER RPCs;
 *   - a manual brief is INSERTed into the underlying `briefs` table (with
 *     engagement_dossier_id set) and surfaces in the view as a classic brief;
 *   - unlink clears briefs/ai_briefs.engagement_dossier_id via the existing RPC.
 *
 * Briefs are composed deterministically from the engagement's real context —
 * participants, positions, commitments, agenda — with NO external AI dependency.
 *
 * Endpoints:
 * - GET    /engagement-briefs/:engagementId             - List briefs for an engagement
 * - GET    /engagement-briefs/:engagementId/context     - Context for brief composition
 * - POST   /engagement-briefs/:engagementId/generate    - Create a manual brief from context
 * - POST   /engagement-briefs/:engagementId/link/:briefId   - Link an existing brief
 * - DELETE /engagement-briefs/:engagementId/link/:briefId   - Unlink a brief
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers are inlined (rather than importing ../_shared/cors.ts) so the
// function deploys as a single self-contained module. Mirrors the shared
// wildcard policy used by sibling functions.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

interface GenerateBriefRequest {
  custom_prompt?: string;
  language?: 'en' | 'ar';
  date_range_start?: string;
  date_range_end?: string;
}

interface LinkBriefRequest {
  brief_type: 'legacy' | 'ai';
}

// Engagement row returned by the access-verification query.
interface EngagementRow {
  id: string;
  engagement_type: string;
  engagement_status: string;
  dossier: { id: string; name_en: string; name_ar: string; status?: string };
}

// Best-effort shape of the get_engagement_brief_context payload. Every field is
// optional so brief composition never throws on a missing key.
interface BriefContext {
  engagement?: { name_en?: string; name_ar?: string; objectives_en?: string; objectives_ar?: string };
  participants?: Array<{ name_en?: string; name_ar?: string; role?: string }>;
  agenda?: Array<{ title_en?: string; title_ar?: string }>;
  positions?: Array<{ title_en?: string; title_ar?: string; stance?: string }>;
  commitments?: Array<{ title_en?: string; title_ar?: string; status?: string }>;
  recent_interactions?: Array<{ event_title_en?: string; event_title_ar?: string; event_date?: string }>;
  host_country?: { name_en?: string; name_ar?: string };
  host_organization?: { name_en?: string; name_ar?: string };
}

interface ManualBrief {
  title_en: string;
  title_ar: string;
  summary_en: string;
  summary_ar: string;
  content_en: string;
  content_ar: string;
}

// Bilingual error response helper
function errorResponse(code: string, messageEn: string, messageAr: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: { code, message_en: messageEn, message_ar: messageAr } }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

// Parse URL path to extract engagement ID and action
function parseUrl(url: URL): { engagementId: string | null; action: string | null; briefId: string | null } {
  const pathParts = url.pathname.split('/').filter(Boolean);
  // Path: /engagement-briefs/:engagementId[/action[/:briefId]]
  const engagementIndex = pathParts.indexOf('engagement-briefs');

  if (engagementIndex === -1) {
    return { engagementId: null, action: null, briefId: null };
  }

  const engagementId = pathParts[engagementIndex + 1] || null;
  const action = pathParts[engagementIndex + 2] || null;
  const briefId = pathParts[engagementIndex + 3] || null;

  return { engagementId, action, briefId };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('UNAUTHORIZED', 'Missing authorization header', 'رأس التفويض مفقود', 401);
    }
    // Pass the JWT explicitly to getUser so validation does not depend on the
    // client library threading the global Authorization header (a bare
    // getUser() under older supabase-js pins rejected tokens that the @2 build
    // accepts — the bug already fixed in sibling functions).
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user context (RLS applies)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return errorResponse('UNAUTHORIZED', 'Invalid user session', 'جلسة مستخدم غير صالحة', 401);
    }

    // Parse URL
    const url = new URL(req.url);
    const { engagementId, action, briefId } = parseUrl(url);

    if (!engagementId) {
      return errorResponse('MISSING_ID', 'Engagement ID is required', 'معرف الارتباط مطلوب', 400);
    }

    // Verify engagement exists / the user can access it (RLS-scoped read).
    // The dossiers embed is pinned to the shared-PK FK (engagement_dossiers.id ->
    // dossiers.id); engagement_dossiers also has host_country_id / host_organization_id
    // / parent_forum_id FKs to dossiers, so an un-pinned `dossiers!inner` embed is
    // ambiguous (PostgREST PGRST201) and would 404 every request.
    const { data: engagement, error: engagementError } = await supabaseClient
      .from('engagement_dossiers')
      .select(
        `
        id,
        engagement_type,
        engagement_status,
        dossier:dossiers!engagement_dossiers_id_fkey(
          id,
          name_en,
          name_ar,
          status
        )
      `,
      )
      .eq('id', engagementId)
      .single();

    if (engagementError || !engagement) {
      return errorResponse(
        'NOT_FOUND',
        'Engagement not found or access denied',
        'الارتباط غير موجود أو الوصول مرفوض',
        404,
      );
    }

    // Route request based on method and action
    switch (req.method) {
      case 'GET':
        if (action === 'context') {
          return handleGetContext(supabaseClient, engagementId);
        }
        return handleListBriefs(supabaseClient, engagementId, url);

      case 'POST':
        if (action === 'generate') {
          return handleCreateManualBrief(
            req,
            supabaseClient,
            user,
            token,
            engagementId,
            engagement as unknown as EngagementRow,
          );
        }
        if (action === 'link' && briefId) {
          return handleLinkBrief(req, supabaseClient, engagementId, briefId);
        }
        return errorResponse('INVALID_ACTION', 'Invalid action', 'إجراء غير صالح', 400);

      case 'DELETE':
        if (action === 'link' && briefId) {
          return handleUnlinkBrief(req, supabaseClient, engagementId, briefId);
        }
        return errorResponse('INVALID_ACTION', 'Invalid action', 'إجراء غير صالح', 400);

      default:
        return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 'الطريقة غير مسموح بها', 405);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 'حدث خطأ غير متوقع', 500);
  }
});

// Service-role client for privileged writes (used after the user + engagement
// access has already been verified with the RLS-scoped user client above).
function getServiceClient(): ReturnType<typeof createClient> {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
}

// The org/tenant is carried by the access-token `org_id` claim (briefs RLS keys
// on `organization_id = auth.jwt() ->> 'org_id'`); it is not stored on users or
// dossiers. Decode it from the JWT, falling back to user.app_metadata.
function decodeOrgId(token: string, user: { app_metadata?: Record<string, unknown> }): string | null {
  const keys = ['org_id', 'organization_id', 'tenant_id'];
  try {
    const part = token.split('.')[1];
    if (part) {
      const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
      const claims = JSON.parse(atob(padded)) as Record<string, unknown>;
      for (const k of keys) {
        if (typeof claims[k] === 'string') return claims[k] as string;
      }
    }
  } catch (_) {
    // fall through to app_metadata
  }
  const md = user.app_metadata ?? {};
  for (const k of keys) {
    if (typeof md[k] === 'string') return md[k] as string;
  }
  return null;
}

/**
 * GET /engagement-briefs/:engagementId
 * List all briefs linked to an engagement.
 */
async function handleListBriefs(
  supabase: ReturnType<typeof createClient>,
  engagementId: string,
  url: URL,
): Promise<Response> {
  const briefType = url.searchParams.get('type'); // 'all', 'legacy', 'ai'
  const status = url.searchParams.get('status');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const { data: briefs, error } = await supabase.rpc('get_engagement_briefs', {
    p_engagement_id: engagementId,
  });

  if (error) {
    console.error('Error fetching briefs:', error);
    return errorResponse('FETCH_ERROR', 'Failed to fetch briefs', 'فشل في جلب الموجزات', 500);
  }

  let filteredBriefs = briefs || [];

  if (briefType && briefType !== 'all') {
    filteredBriefs = filteredBriefs.filter((b: { brief_type: string }) => b.brief_type === briefType);
  }

  if (status) {
    filteredBriefs = filteredBriefs.filter((b: { status: string }) => b.status === status);
  }

  const total = filteredBriefs.length;
  const paginatedBriefs = filteredBriefs.slice(offset, offset + limit);

  return new Response(
    JSON.stringify({
      data: paginatedBriefs,
      pagination: { total, limit, offset, has_more: offset + limit < total },
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

/**
 * GET /engagement-briefs/:engagementId/context
 * Get context data for brief composition.
 */
async function handleGetContext(
  supabase: ReturnType<typeof createClient>,
  engagementId: string,
): Promise<Response> {
  const { data: context, error } = await supabase.rpc('get_engagement_brief_context', {
    p_engagement_id: engagementId,
  });

  if (error) {
    console.error('Error fetching context:', error);
    return errorResponse('FETCH_ERROR', 'Failed to fetch brief context', 'فشل في جلب سياق الموجز', 500);
  }

  return new Response(JSON.stringify(context), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * POST /engagement-briefs/:engagementId/generate
 * Compose a manual brief from the engagement's real context (no AI) and persist
 * it to the underlying `briefs` table so the engagement_briefs view surfaces it.
 */
async function handleCreateManualBrief(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  user: { id: string; app_metadata?: Record<string, unknown> },
  token: string,
  engagementId: string,
  engagement: EngagementRow,
): Promise<Response> {
  const body: GenerateBriefRequest = await req.json().catch(() => ({}));
  const lang: 'en' | 'ar' = body.language === 'ar' ? 'ar' : 'en';

  // Gather real engagement context (best effort — the brief still composes from
  // the engagement name alone if the RPC returns nothing).
  let context: BriefContext = {};
  const { data: ctx, error: ctxError } = await supabase.rpc('get_engagement_brief_context', {
    p_engagement_id: engagementId,
  });
  if (!ctxError && ctx) {
    context = ctx as BriefContext;
  }

  const nameEn = engagement?.dossier?.name_en || 'Engagement';
  const nameAr = engagement?.dossier?.name_ar || engagement?.dossier?.name_en || 'الارتباط';
  const brief = buildManualBrief(nameEn, nameAr, context, body.custom_prompt);

  const admin = getServiceClient();

  // briefs.tenant_id is NOT NULL and briefs RLS keys on organization_id = the
  // JWT 'org_id' claim; neither users nor dossiers carry it. Read it from the
  // access token (we already verified the user and engagement access above, and
  // write with the service-role client).
  const orgId = decodeOrgId(token, user);
  if (!orgId) {
    return errorResponse(
      'NO_ORG',
      'Could not determine your organization from the session',
      'تعذّر تحديد منظمتك من الجلسة',
      400,
    );
  }
  const tenantId = orgId;
  const organizationId = orgId;

  const title = lang === 'ar' ? brief.title_ar : brief.title_en;
  const summary = lang === 'ar' ? brief.summary_ar : brief.summary_en;

  // Insert into `briefs` (the legacy/classic brief table the view unions). status
  // is left to its default ('draft'); is_deleted defaults false. The view exposes
  // this row as brief_type='legacy', source='legacy'.
  const insertPayload: Record<string, unknown> = {
    type: 'engagement',
    purpose: 'Manual engagement brief',
    title,
    summary,
    content: { format: 'markdown', en: brief.content_en, ar: brief.content_ar },
    created_by: user.id,
    last_modified_by: user.id,
    tenant_id: tenantId,
    organization_id: organizationId,
    engagement_dossier_id: engagementId,
  };

  const { data: inserted, error: insertError } = await admin
    .from('briefs')
    .insert(insertPayload)
    .select('id, title, summary, status, engagement_dossier_id, created_at')
    .single();

  if (insertError) {
    console.error('Error creating manual brief:', insertError);
    return errorResponse('SAVE_ERROR', `Failed to save brief: ${insertError.message}`, 'فشل في حفظ الموجز', 500);
  }

  return new Response(JSON.stringify({ data: { ...inserted, brief_type: 'legacy', source: 'manual' } }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * POST /engagement-briefs/:engagementId/link/:briefId
 * Link an existing brief to the engagement.
 */
async function handleLinkBrief(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  engagementId: string,
  briefId: string,
): Promise<Response> {
  const body: LinkBriefRequest = await req.json().catch(() => ({ brief_type: 'legacy' }));
  const briefType = body.brief_type || 'legacy';

  const { data: success, error } = await supabase.rpc('link_brief_to_engagement', {
    p_brief_id: briefId,
    p_engagement_id: engagementId,
    p_brief_type: briefType,
  });

  if (error) {
    console.error('Error linking brief:', error);
    return errorResponse('LINK_ERROR', 'Failed to link brief to engagement', 'فشل في ربط الموجز بالارتباط', 500);
  }

  if (!success) {
    return errorResponse(
      'ALREADY_LINKED',
      'Brief is already linked or does not exist',
      'الموجز مرتبط بالفعل أو غير موجود',
      400,
    );
  }

  return new Response(
    JSON.stringify({ success: true, message_en: 'Brief linked successfully', message_ar: 'تم ربط الموجز بنجاح' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

/**
 * DELETE /engagement-briefs/:engagementId/link/:briefId
 * Unlink a brief from the engagement. The list surfaces view rows keyed by the
 * underlying briefs/ai_briefs id; the RPC clears engagement_dossier_id so the
 * row drops out of the view.
 */
async function handleUnlinkBrief(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  engagementId: string,
  briefId: string,
): Promise<Response> {
  const url = new URL(req.url);
  const briefType = url.searchParams.get('brief_type') || 'legacy';

  const { data: success, error } = await supabase.rpc('unlink_brief_from_engagement', {
    p_brief_id: briefId,
    p_brief_type: briefType,
  });

  if (error) {
    console.error('Error unlinking brief:', error);
    return errorResponse(
      'UNLINK_ERROR',
      'Failed to unlink brief from engagement',
      'فشل في إلغاء ربط الموجز من الارتباط',
      500,
    );
  }

  if (!success) {
    return errorResponse(
      'NOT_LINKED',
      'Brief is not linked to this engagement',
      'الموجز غير مرتبط بهذا الارتباط',
      400,
    );
  }

  return new Response(
    JSON.stringify({ success: true, message_en: 'Brief unlinked successfully', message_ar: 'تم إلغاء ربط الموجز بنجاح' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

/**
 * Compose a bilingual manual brief from the engagement context.
 */
function buildManualBrief(
  nameEn: string,
  nameAr: string,
  ctx: BriefContext,
  customPrompt?: string,
): ManualBrief {
  const participants = ctx.participants ?? [];
  const positions = ctx.positions ?? [];
  const commitments = ctx.commitments ?? [];

  const summary_en =
    `Pre-meeting brief for ${nameEn}. Includes ${participants.length} participant(s), ` +
    `${positions.length} relevant position(s), and ${commitments.length} active commitment(s).`;
  const summary_ar =
    `موجز ما قبل الاجتماع لـ ${nameAr}. يشمل ${participants.length} مشارك، ` +
    `و${positions.length} موقف ذي صلة، و${commitments.length} التزام نشط.`;

  return {
    title_en: `Brief: ${nameEn}`,
    title_ar: `موجز: ${nameAr}`,
    summary_en,
    summary_ar,
    content_en: buildContent('en', nameEn, ctx, customPrompt),
    content_ar: buildContent('ar', nameAr, ctx, customPrompt),
  };
}

/**
 * Render a markdown brief body in the requested language from real context.
 */
function buildContent(
  lang: 'en' | 'ar',
  name: string,
  ctx: BriefContext,
  customPrompt?: string,
): string {
  const isAr = lang === 'ar';
  const T = {
    title: isAr ? 'موجز الاجتماع' : 'Meeting Brief',
    host: isAr ? 'معلومات المضيف' : 'Host Information',
    hostCountry: isAr ? 'الدولة المضيفة' : 'Host Country',
    hostOrg: isAr ? 'المنظمة المضيفة' : 'Host Organization',
    participants: isAr ? 'المشاركون الرئيسيون' : 'Key Participants',
    agenda: isAr ? 'بنود الأجندة' : 'Agenda Items',
    positions: isAr ? 'المواقف ذات الصلة' : 'Relevant Positions',
    commitments: isAr ? 'الالتزامات النشطة' : 'Active Commitments',
    interactions: isAr ? 'التفاعلات الأخيرة' : 'Recent Interactions',
    notes: isAr ? 'ملاحظات' : 'Notes',
    recommendations: isAr ? 'التوصيات' : 'Recommendations',
    none: isAr ? 'لا يوجد' : 'None recorded',
    stance: isAr ? 'الموقف' : 'Stance',
    status: isAr ? 'الحالة' : 'Status',
    fillIn: isAr ? '_أضف توصياتك هنا._' : '_Add your recommendations here._',
    unknown: isAr ? 'غير معروف' : 'Unknown',
  };

  const pick = (en?: string, ar?: string): string => (isAr ? ar || en : en || ar) || T.unknown;
  const lines: string[] = [`# ${T.title}: ${name}`, ''];

  if (ctx.host_country || ctx.host_organization) {
    lines.push(`## ${T.host}`);
    if (ctx.host_country) lines.push(`- ${T.hostCountry}: ${pick(ctx.host_country.name_en, ctx.host_country.name_ar)}`);
    if (ctx.host_organization)
      lines.push(`- ${T.hostOrg}: ${pick(ctx.host_organization.name_en, ctx.host_organization.name_ar)}`);
    lines.push('');
  }

  const participants = ctx.participants ?? [];
  lines.push(`## ${T.participants} (${participants.length})`);
  if (participants.length === 0) {
    lines.push(`- ${T.none}`);
  } else {
    participants.slice(0, 20).forEach((p) => {
      const role = p.role ? ` — ${p.role}` : '';
      lines.push(`- ${pick(p.name_en, p.name_ar)}${role}`);
    });
  }
  lines.push('');

  const agenda = ctx.agenda ?? [];
  if (agenda.length > 0) {
    lines.push(`## ${T.agenda} (${agenda.length})`);
    agenda.slice(0, 20).forEach((a, i) => lines.push(`${i + 1}. ${pick(a.title_en, a.title_ar)}`));
    lines.push('');
  }

  const positions = ctx.positions ?? [];
  if (positions.length > 0) {
    lines.push(`## ${T.positions} (${positions.length})`);
    positions.slice(0, 20).forEach((p) => {
      const stance = p.stance ? ` (${T.stance}: ${p.stance})` : '';
      lines.push(`- ${pick(p.title_en, p.title_ar)}${stance}`);
    });
    lines.push('');
  }

  const commitments = ctx.commitments ?? [];
  if (commitments.length > 0) {
    lines.push(`## ${T.commitments} (${commitments.length})`);
    commitments.slice(0, 20).forEach((c) => {
      const status = c.status ? ` (${T.status}: ${c.status})` : '';
      lines.push(`- ${pick(c.title_en, c.title_ar)}${status}`);
    });
    lines.push('');
  }

  const interactions = ctx.recent_interactions ?? [];
  if (interactions.length > 0) {
    lines.push(`## ${T.interactions} (${interactions.length})`);
    interactions.slice(0, 10).forEach((r) => {
      const date = r.event_date ? ` (${r.event_date})` : '';
      lines.push(`- ${pick(r.event_title_en, r.event_title_ar)}${date}`);
    });
    lines.push('');
  }

  if (customPrompt && customPrompt.trim()) {
    lines.push(`## ${T.notes}`, customPrompt.trim(), '');
  }

  lines.push(`## ${T.recommendations}`, T.fillIn, '');

  return lines.join('\n');
}
