/**
 * Engagement Briefs Edge Function
 * Feature: engagement-brief-linking
 *
 * Handles AI-generated briefs for engagement dossiers with automatic context gathering.
 * Briefs pull recent interactions, positions, and commitments from related entities.
 *
 * Endpoints:
 * - GET  /engagement-briefs/:engagementId - List briefs for an engagement
 * - POST /engagement-briefs/:engagementId/generate - Generate new brief with AI
 * - POST /engagement-briefs/:engagementId/link/:briefId - Link existing brief
 * - DELETE /engagement-briefs/:engagementId/link/:briefId - Unlink brief
 * - GET  /engagement-briefs/:engagementId/context - Get context for brief generation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import {
  createAIInteractionLogger,
  extractClientInfo,
  type AIInteractionType,
  type AIContentType,
} from '../_shared/ai-interaction-logger.ts';

interface GenerateBriefRequest {
  custom_prompt?: string;
  language?: 'en' | 'ar';
  date_range_start?: string;
  date_range_end?: string;
}

interface LinkBriefRequest {
  brief_type: 'legacy' | 'ai';
}

// Bilingual error response helper
function errorResponse(code: string, messageEn: string, messageAr: string, status: number) {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message_en: messageEn,
        message_ar: messageAr,
      },
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Parse URL path to extract engagement ID and action
function parseUrl(url: URL): {
  engagementId: string | null;
  action: string | null;
  briefId: string | null;
} {
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
      return errorResponse(
        'UNAUTHORIZED',
        'Missing authorization header',
        'رأس التفويض مفقود',
        401
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
      return errorResponse('UNAUTHORIZED', 'Invalid user session', 'جلسة مستخدم غير صالحة', 401);
    }

    // Parse URL
    const url = new URL(req.url);
    const { engagementId, action, briefId } = parseUrl(url);

    if (!engagementId) {
      return errorResponse('MISSING_ID', 'Engagement ID is required', 'معرف الارتباط مطلوب', 400);
    }

    // Verify engagement exists
    const { data: engagement, error: engagementError } = await supabaseClient
      .from('engagement_dossiers')
      .select(
        `
        id,
        engagement_type,
        engagement_status,
        dossier:dossiers!inner(
          id,
          name_en,
          name_ar,
          status
        )
      `
      )
      .eq('id', engagementId)
      .single();

    if (engagementError || !engagement) {
      return errorResponse(
        'NOT_FOUND',
        'Engagement not found or access denied',
        'الارتباط غير موجود أو الوصول مرفوض',
        404
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
          return handleGenerateBrief(req, supabaseClient, user, engagementId, engagement);
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
        return errorResponse(
          'METHOD_NOT_ALLOWED',
          'Method not allowed',
          'الطريقة غير مسموح بها',
          405
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      'حدث خطأ غير متوقع',
      500
    );
  }
});

/**
 * GET /engagement-briefs/:engagementId
 * List all briefs linked to an engagement
 */
async function handleListBriefs(
  supabase: ReturnType<typeof createClient>,
  engagementId: string,
  url: URL
) {
  const briefType = url.searchParams.get('type'); // 'all', 'legacy', 'ai'
  const status = url.searchParams.get('status'); // 'completed', 'generating', etc.
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  // Use the RPC function for efficient querying
  const { data: briefs, error } = await supabase.rpc('get_engagement_briefs', {
    p_engagement_id: engagementId,
  });

  if (error) {
    console.error('Error fetching briefs:', error);
    return errorResponse('FETCH_ERROR', 'Failed to fetch briefs', 'فشل في جلب الموجزات', 500);
  }

  // Apply filters
  let filteredBriefs = briefs || [];

  if (briefType && briefType !== 'all') {
    filteredBriefs = filteredBriefs.filter(
      (b: { brief_type: string }) => b.brief_type === briefType
    );
  }

  if (status) {
    filteredBriefs = filteredBriefs.filter((b: { status: string }) => b.status === status);
  }

  // Apply pagination
  const total = filteredBriefs.length;
  const paginatedBriefs = filteredBriefs.slice(offset, offset + limit);

  return new Response(
    JSON.stringify({
      data: paginatedBriefs,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      },
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * GET /engagement-briefs/:engagementId/context
 * Get context data for brief generation
 */
async function handleGetContext(supabase: ReturnType<typeof createClient>, engagementId: string) {
  const { data: context, error } = await supabase.rpc('get_engagement_brief_context', {
    p_engagement_id: engagementId,
  });

  if (error) {
    console.error('Error fetching context:', error);
    return errorResponse(
      'FETCH_ERROR',
      'Failed to fetch brief context',
      'فشل في جلب سياق الموجز',
      500
    );
  }

  return new Response(JSON.stringify(context), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * POST /engagement-briefs/:engagementId/generate
 * Generate a new AI brief for the engagement
 */
async function handleGenerateBrief(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  user: { id: string },
  engagementId: string,
  engagement: {
    id: string;
    engagement_type: string;
    engagement_status: string;
    dossier: { id: string; name_en: string; name_ar: string };
  }
) {
  // Parse request body
  const body: GenerateBriefRequest = await req.json().catch(() => ({}));
  const language = body.language || 'en';

  // Get user's organization
  const { data: userProfile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userProfile?.organization_id) {
    return errorResponse('NO_ORG', 'User has no organization', 'المستخدم ليس لديه منظمة', 400);
  }

  // Get engagement context
  const { data: context, error: contextError } = await supabase.rpc(
    'get_engagement_brief_context',
    {
      p_engagement_id: engagementId,
    }
  );

  if (contextError) {
    console.error('Error fetching context:', contextError);
    return errorResponse(
      'CONTEXT_ERROR',
      'Failed to gather engagement context',
      'فشل في جمع سياق الارتباط',
      500
    );
  }

  // Check for AI service
  const anythingLlmUrl = Deno.env.get('ANYTHINGLLM_URL');
  const anythingLlmKey = Deno.env.get('ANYTHINGLLM_API_KEY');

  // Initialize AI logger
  const aiLogger = createAIInteractionLogger('engagement-briefs');
  const clientInfo = extractClientInfo(req);
  let interactionId: string | undefined;

  if (anythingLlmUrl && anythingLlmKey) {
    try {
      // Build comprehensive prompt
      const prompt = buildBriefPrompt(engagement, context, body.custom_prompt, language);

      // Log AI interaction start
      try {
        const result = await aiLogger.startInteraction({
          organizationId: userProfile.organization_id,
          userId: user.id,
          interactionType: 'generation' as AIInteractionType,
          contentType: 'brief' as AIContentType,
          modelProvider: 'ollama',
          modelName: 'llama2',
          userPrompt: prompt,
          targetEntityType: 'engagement',
          targetEntityId: engagementId,
          contextSources: [
            {
              type: 'engagement_context',
              id: engagementId,
              snippet: `Participants: ${context.participants?.length || 0}, Positions: ${context.positions?.length || 0}`,
            },
          ],
          dataClassification: 'internal',
          requestIp: clientInfo.ip,
          userAgent: clientInfo.userAgent,
        });
        interactionId = result.interactionId;
      } catch (logError) {
        console.warn('Failed to log AI interaction start:', logError);
      }

      const startTime = Date.now();

      // Call AI with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

      const aiResponse = await fetch(`${anythingLlmUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anythingLlmKey}`,
        },
        body: JSON.stringify({
          message: prompt,
          mode: 'chat',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!aiResponse.ok) {
        throw new Error(`AI service returned ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const briefData = parseAIResponse(aiData.textResponse);
      const latencyMs = Date.now() - startTime;

      // Log AI interaction completion
      if (interactionId) {
        try {
          await aiLogger.completeInteraction({
            interactionId,
            status: 'completed',
            aiResponse: aiData.textResponse,
            aiResponseStructured: briefData,
            latencyMs,
            responseTokenCount: aiData.textResponse?.length || 0,
          });
        } catch (logError) {
          console.warn('Failed to log AI interaction completion:', logError);
        }
      }

      // Insert brief into ai_briefs table with engagement link
      const { data: brief, error: insertError } = await supabase
        .from('ai_briefs')
        .insert({
          organization_id: userProfile.organization_id,
          created_by: user.id,
          engagement_dossier_id: engagementId,
          title: briefData.title || `Brief for ${engagement.dossier.name_en}`,
          executive_summary: briefData.executive_summary,
          background: briefData.background,
          key_participants: briefData.key_participants || [],
          relevant_positions: briefData.relevant_positions || [],
          active_commitments: briefData.active_commitments || [],
          historical_context: briefData.historical_context,
          talking_points: briefData.talking_points || [],
          recommendations: briefData.recommendations,
          full_content: briefData,
          citations: briefData.citations || [],
          status: 'completed',
          completed_at: new Date().toISOString(),
          generation_params: {
            language,
            custom_prompt: body.custom_prompt,
            date_range_start: body.date_range_start,
            date_range_end: body.date_range_end,
          },
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting brief:', insertError);
        throw new Error('Failed to save brief');
      }

      return new Response(JSON.stringify(brief), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (aiError) {
      console.warn('AI generation failed:', aiError);

      // Log failure
      if (interactionId) {
        try {
          await aiLogger.completeInteraction({
            interactionId,
            status: 'failed',
            errorMessage: aiError instanceof Error ? aiError.message : 'Unknown error',
          });
        } catch (logError) {
          console.warn('Failed to log AI interaction failure:', logError);
        }
      }

      // Fall through to template response
    }
  }

  // Fallback: Return context for manual brief creation
  return new Response(
    JSON.stringify({
      error: {
        code: 'AI_UNAVAILABLE',
        message_en: 'AI service is unavailable. Use the context below to create a manual brief.',
        message_ar: 'خدمة الذكاء الاصطناعي غير متاحة. استخدم السياق أدناه لإنشاء موجز يدوي.',
      },
      fallback: {
        context,
        template: generateBriefTemplate(engagement, context, language),
      },
    }),
    {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * POST /engagement-briefs/:engagementId/link/:briefId
 * Link an existing brief to the engagement
 */
async function handleLinkBrief(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  engagementId: string,
  briefId: string
) {
  const body: LinkBriefRequest = await req.json().catch(() => ({ brief_type: 'legacy' }));
  const briefType = body.brief_type || 'legacy';

  // Use RPC function to link
  const { data: success, error } = await supabase.rpc('link_brief_to_engagement', {
    p_brief_id: briefId,
    p_engagement_id: engagementId,
    p_brief_type: briefType,
  });

  if (error) {
    console.error('Error linking brief:', error);
    return errorResponse(
      'LINK_ERROR',
      'Failed to link brief to engagement',
      'فشل في ربط الموجز بالارتباط',
      500
    );
  }

  if (!success) {
    return errorResponse(
      'ALREADY_LINKED',
      'Brief is already linked or does not exist',
      'الموجز مرتبط بالفعل أو غير موجود',
      400
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      message_en: 'Brief linked successfully',
      message_ar: 'تم ربط الموجز بنجاح',
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * DELETE /engagement-briefs/:engagementId/link/:briefId
 * Unlink a brief from the engagement
 */
async function handleUnlinkBrief(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  engagementId: string,
  briefId: string
) {
  // Get brief type from query param
  const url = new URL(req.url);
  const briefType = url.searchParams.get('brief_type') || 'legacy';

  // Use RPC function to unlink
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
      500
    );
  }

  if (!success) {
    return errorResponse(
      'NOT_LINKED',
      'Brief is not linked to this engagement',
      'الموجز غير مرتبط بهذا الارتباط',
      400
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      message_en: 'Brief unlinked successfully',
      message_ar: 'تم إلغاء ربط الموجز بنجاح',
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Build AI prompt for brief generation
 */
function buildBriefPrompt(
  engagement: {
    id: string;
    engagement_type: string;
    engagement_status: string;
    dossier: { id: string; name_en: string; name_ar: string };
  },
  context: {
    engagement?: { name_en?: string; name_ar?: string; objectives_en?: string };
    participants?: Array<{ name_en?: string; role?: string }>;
    agenda?: Array<{ title_en?: string }>;
    positions?: Array<{ title_en?: string; stance?: string }>;
    commitments?: Array<{ title_en?: string; status?: string }>;
    recent_interactions?: Array<{ event_title_en?: string; event_date?: string }>;
    host_country?: { name_en?: string };
    host_organization?: { name_en?: string };
  },
  customPrompt?: string,
  language?: string
): string {
  const lang = language || 'en';
  const isArabic = lang === 'ar';

  let prompt = isArabic
    ? `أنشئ موجزًا تنفيذيًا شاملاً لاجتماع ما قبل الارتباط.`
    : `Generate a comprehensive pre-meeting executive brief for the following engagement.`;

  // Engagement details
  prompt += `\n\n## Engagement Details
Name: ${engagement.dossier.name_en} / ${engagement.dossier.name_ar}
Type: ${engagement.engagement_type}
Status: ${engagement.engagement_status}
${context.engagement?.objectives_en ? `Objectives: ${context.engagement.objectives_en}` : ''}`;

  // Host info
  if (context.host_country || context.host_organization) {
    prompt += `\n\n## Host Information`;
    if (context.host_country) {
      prompt += `\nHost Country: ${context.host_country.name_en}`;
    }
    if (context.host_organization) {
      prompt += `\nHost Organization: ${context.host_organization.name_en}`;
    }
  }

  // Participants
  if (context.participants && context.participants.length > 0) {
    prompt += `\n\n## Key Participants (${context.participants.length})`;
    context.participants.slice(0, 10).forEach((p, i) => {
      prompt += `\n${i + 1}. ${p.name_en || 'Unknown'} - ${p.role || 'Participant'}`;
    });
  }

  // Agenda
  if (context.agenda && context.agenda.length > 0) {
    prompt += `\n\n## Agenda Items (${context.agenda.length})`;
    context.agenda.slice(0, 8).forEach((a, i) => {
      prompt += `\n${i + 1}. ${a.title_en || 'Unnamed Item'}`;
    });
  }

  // Relevant positions
  if (context.positions && context.positions.length > 0) {
    prompt += `\n\n## Relevant Positions from Participants (${context.positions.length})`;
    context.positions.slice(0, 5).forEach((p, i) => {
      prompt += `\n${i + 1}. ${p.title_en || 'Position'} - Stance: ${p.stance || 'unknown'}`;
    });
  }

  // Active commitments
  if (context.commitments && context.commitments.length > 0) {
    prompt += `\n\n## Active Commitments (${context.commitments.length})`;
    context.commitments.slice(0, 5).forEach((c, i) => {
      prompt += `\n${i + 1}. ${c.title_en || 'Commitment'} - Status: ${c.status || 'pending'}`;
    });
  }

  // Recent interactions
  if (context.recent_interactions && context.recent_interactions.length > 0) {
    prompt += `\n\n## Recent Interactions (Last 6 months)`;
    context.recent_interactions.slice(0, 5).forEach((r, i) => {
      prompt += `\n${i + 1}. ${r.event_title_en || 'Event'} (${r.event_date || 'Unknown date'})`;
    });
  }

  // Custom prompt
  if (customPrompt) {
    prompt += `\n\n## Additional Instructions\n${customPrompt}`;
  }

  // Output format
  prompt += `\n\n## Required Output Format
Return a JSON object with this structure:
{
  "title": "Brief title",
  "executive_summary": "2-3 paragraph executive summary",
  "background": "Background context",
  "key_participants": [{"name": "Name", "role": "Role", "relevance": "Why important"}],
  "relevant_positions": [{"title": "Position", "stance": "Stance", "source": "Source entity"}],
  "active_commitments": [{"description": "Commitment", "status": "Status", "deadline": "Date if any"}],
  "historical_context": "Historical context paragraph",
  "talking_points": ["Point 1", "Point 2", "Point 3"],
  "recommendations": "Recommendations for the meeting",
  "citations": [{"type": "position|commitment|dossier", "id": "uuid", "title": "Title"}]
}`;

  return prompt;
}

/**
 * Parse AI response to extract JSON
 */
function parseAIResponse(response: string): Record<string, unknown> {
  // Try to extract JSON from the response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      console.warn('Failed to parse JSON from AI response');
    }
  }

  // Fallback: create basic structure from response
  return {
    title: 'Generated Brief',
    executive_summary: response.slice(0, 500),
    background: '',
    key_participants: [],
    relevant_positions: [],
    active_commitments: [],
    historical_context: '',
    talking_points: [],
    recommendations: '',
    citations: [],
  };
}

/**
 * Generate template brief for manual creation
 */
function generateBriefTemplate(
  engagement: {
    id: string;
    engagement_type: string;
    engagement_status: string;
    dossier: { id: string; name_en: string; name_ar: string };
  },
  context: {
    participants?: Array<{ name_en?: string; role?: string }>;
    agenda?: Array<{ title_en?: string }>;
    positions?: Array<{ title_en?: string; stance?: string }>;
    commitments?: Array<{ title_en?: string; status?: string }>;
  },
  language: string
) {
  const isArabic = language === 'ar';

  return {
    title: isArabic
      ? `موجز الاجتماع: ${engagement.dossier.name_ar}`
      : `Meeting Brief: ${engagement.dossier.name_en}`,
    executive_summary: isArabic ? 'أدخل الملخص التنفيذي هنا...' : 'Enter executive summary here...',
    sections: [
      {
        title: isArabic ? 'الخلفية' : 'Background',
        content: '',
      },
      {
        title: isArabic ? 'المشاركون الرئيسيون' : 'Key Participants',
        content:
          context.participants
            ?.slice(0, 5)
            .map((p) => `- ${p.name_en || 'Unknown'} (${p.role || 'Participant'})`)
            .join('\n') || '',
      },
      {
        title: isArabic ? 'نقاط الأجندة' : 'Agenda Points',
        content:
          context.agenda
            ?.slice(0, 5)
            .map((a, i) => `${i + 1}. ${a.title_en || 'Item'}`)
            .join('\n') || '',
      },
      {
        title: isArabic ? 'المواقف ذات الصلة' : 'Relevant Positions',
        content:
          context.positions
            ?.slice(0, 3)
            .map((p) => `- ${p.title_en || 'Position'}: ${p.stance || 'Unknown stance'}`)
            .join('\n') || '',
      },
      {
        title: isArabic ? 'الالتزامات النشطة' : 'Active Commitments',
        content:
          context.commitments
            ?.slice(0, 3)
            .map((c) => `- ${c.title_en || 'Commitment'} (${c.status || 'Pending'})`)
            .join('\n') || '',
      },
      {
        title: isArabic ? 'نقاط النقاش' : 'Talking Points',
        content: '',
      },
      {
        title: isArabic ? 'التوصيات' : 'Recommendations',
        content: '',
      },
    ],
    metadata: {
      engagement_id: engagement.id,
      engagement_type: engagement.engagement_type,
      generated_at: new Date().toISOString(),
      language,
    },
  };
}
