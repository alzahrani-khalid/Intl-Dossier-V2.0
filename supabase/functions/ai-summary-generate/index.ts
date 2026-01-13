/**
 * AI Summary Generation Edge Function
 * Feature: ai-summary-generation
 *
 * Generates executive summaries for any entity using AI.
 * Summarizes recent activity, key relationships, open commitments, and strategic importance.
 * Supports customizable summary length and focus areas.
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

// Supported entity types
type EntityType =
  | 'dossier'
  | 'country'
  | 'organization'
  | 'forum'
  | 'person'
  | 'engagement'
  | 'theme';

// Summary length options
type SummaryLength = 'brief' | 'standard' | 'detailed';

// Focus areas for customization
type FocusArea = 'activity' | 'relationships' | 'commitments' | 'strategic' | 'all';

interface GenerateSummaryRequest {
  entity_type: EntityType;
  entity_id: string;
  length?: SummaryLength;
  focus_areas?: FocusArea[];
  date_range_start?: string;
  date_range_end?: string;
  language?: 'en' | 'ar';
}

interface SummaryContent {
  executive_summary: string;
  key_highlights: string[];
  sections: Array<{
    title: string;
    content: string;
    importance: 'high' | 'medium' | 'low';
  }>;
  metadata: {
    entity_type: EntityType;
    entity_id: string;
    generated_at: string;
    data_points_analyzed: number;
    confidence_score: number;
  };
}

interface SummaryResponse {
  en: SummaryContent;
  ar: SummaryContent;
}

// Length configuration for prompts
const lengthConfig: Record<SummaryLength, { words: number; sections: number }> = {
  brief: { words: 150, sections: 2 },
  standard: { words: 300, sections: 4 },
  detailed: { words: 500, sections: 6 },
};

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

    // Parse request body
    const body: GenerateSummaryRequest = await req.json();

    // Validate required fields
    if (!body.entity_type || !body.entity_id) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_REQUEST',
            message_en: 'Entity type and ID are required',
            message_ar: 'نوع الكيان والمعرف مطلوبان',
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const length = body.length || 'standard';
    const focusAreas = body.focus_areas || ['all'];
    const language = body.language || 'en';

    // Fetch entity data based on type
    const entityData = await fetchEntityData(supabaseClient, body.entity_type, body.entity_id);

    if (!entityData) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message_en: 'Entity not found or access denied',
            message_ar: 'الكيان غير موجود أو الوصول مرفوض',
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch related data for context
    const contextData = await fetchContextData(
      supabaseClient,
      body.entity_type,
      body.entity_id,
      focusAreas,
      body.date_range_start,
      body.date_range_end
    );

    // Try AI generation with 60s timeout
    const anythingLlmUrl = Deno.env.get('ANYTHINGLLM_URL');
    const anythingLlmKey = Deno.env.get('ANYTHINGLLM_API_KEY');

    // Initialize AI interaction logger
    const aiLogger = createAIInteractionLogger('ai-summary-generate');
    const clientInfo = extractClientInfo(req);
    let interactionId: string | undefined;
    let startTime = Date.now();

    if (anythingLlmUrl && anythingLlmKey) {
      try {
        // Build the AI prompt
        const prompt = buildSummaryPrompt(
          entityData,
          contextData,
          body.entity_type,
          length,
          focusAreas
        );

        // Log AI interaction start
        try {
          const { data: userProfile } = await supabaseClient
            .from('users')
            .select('organization_id')
            .eq('id', user.id)
            .single();

          const result = await aiLogger.startInteraction({
            organizationId: userProfile?.organization_id || 'unknown',
            userId: user.id,
            interactionType: 'summarization' as AIInteractionType,
            contentType: 'summary' as AIContentType,
            modelProvider: 'ollama',
            modelName: 'llama2',
            userPrompt: prompt,
            targetEntityType: body.entity_type as any,
            targetEntityId: body.entity_id,
            contextSources: contextData.sources.slice(0, 10).map((s) => ({
              type: s.type,
              id: s.id,
              snippet: s.title,
            })),
            dataClassification: 'internal',
            requestIp: clientInfo.ip,
            userAgent: clientInfo.userAgent,
          });
          interactionId = result.interactionId;
        } catch (logError) {
          console.warn('Failed to log AI interaction start:', logError);
        }

        startTime = Date.now();

        // Call AI with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

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
        const summaryData: SummaryResponse = JSON.parse(aiData.textResponse);
        const latencyMs = Date.now() - startTime;

        // Add metadata
        const dataPointsAnalyzed = contextData.sources.length;
        const now = new Date().toISOString();

        summaryData.en.metadata = {
          entity_type: body.entity_type,
          entity_id: body.entity_id,
          generated_at: now,
          data_points_analyzed: dataPointsAnalyzed,
          confidence_score: calculateConfidenceScore(contextData),
        };
        summaryData.ar.metadata = { ...summaryData.en.metadata };

        // Log AI interaction completion
        if (interactionId) {
          try {
            await aiLogger.completeInteraction({
              interactionId,
              status: 'completed',
              aiResponse: aiData.textResponse,
              aiResponseStructured: summaryData,
              latencyMs,
              responseTokenCount: aiData.textResponse?.length || 0,
            });
          } catch (logError) {
            console.warn('Failed to log AI interaction completion:', logError);
          }
        }

        // Save summary to database
        const { data: savedSummary, error: saveError } = await supabaseClient
          .from('ai_summaries')
          .insert({
            entity_type: body.entity_type,
            entity_id: body.entity_id,
            content_en: summaryData.en,
            content_ar: summaryData.ar,
            length: length,
            focus_areas: focusAreas,
            date_range_start: body.date_range_start || null,
            date_range_end: body.date_range_end || null,
            generated_by_user_id: user.id,
            data_points_analyzed: dataPointsAnalyzed,
            confidence_score: summaryData.en.metadata.confidence_score,
          })
          .select()
          .single();

        if (saveError) {
          console.error('Error saving summary:', saveError);
          // Return summary anyway, just don't persist
        }

        return new Response(
          JSON.stringify({
            id: savedSummary?.id || crypto.randomUUID(),
            ...summaryData,
          }),
          {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (aiError) {
        console.warn('AI generation failed or timed out:', aiError);

        // Log AI interaction failure
        if (interactionId) {
          try {
            await aiLogger.completeInteraction({
              interactionId,
              status: 'failed',
              errorMessage: aiError instanceof Error ? aiError.message : 'Unknown error',
              latencyMs: Date.now() - startTime,
            });
          } catch (logError) {
            console.warn('Failed to log AI interaction failure:', logError);
          }
        }

        // Fall through to fallback
      }
    }

    // Fallback: Generate a basic summary from available data
    const fallbackSummary = generateFallbackSummary(
      entityData,
      contextData,
      body.entity_type,
      length,
      focusAreas
    );

    return new Response(
      JSON.stringify({
        error: {
          code: 'AI_UNAVAILABLE',
          message_en:
            'AI service is unavailable. A basic summary has been generated from available data.',
          message_ar: 'خدمة الذكاء الاصطناعي غير متاحة. تم إنشاء ملخص أساسي من البيانات المتاحة.',
        },
        fallback: fallbackSummary,
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
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

/**
 * Fetch entity data based on type
 */
async function fetchEntityData(
  supabase: any,
  entityType: EntityType,
  entityId: string
): Promise<any | null> {
  const tableMap: Record<EntityType, string> = {
    dossier: 'dossiers',
    country: 'countries',
    organization: 'organizations',
    forum: 'forums',
    person: 'persons',
    engagement: 'engagements',
    theme: 'themes',
  };

  const table = tableMap[entityType];
  if (!table) return null;

  const { data, error } = await supabase.from(table).select('*').eq('id', entityId).single();

  if (error) {
    console.error(`Error fetching ${entityType}:`, error);
    return null;
  }

  return data;
}

interface ContextSource {
  type: string;
  id: string;
  title: string;
  date?: string;
  content?: string;
}

interface ContextData {
  recentActivity: any[];
  relationships: any[];
  commitments: any[];
  positions: any[];
  engagements: any[];
  sources: ContextSource[];
}

/**
 * Fetch related context data for the entity
 */
async function fetchContextData(
  supabase: any,
  entityType: EntityType,
  entityId: string,
  focusAreas: FocusArea[],
  dateRangeStart?: string,
  dateRangeEnd?: string
): Promise<ContextData> {
  const context: ContextData = {
    recentActivity: [],
    relationships: [],
    commitments: [],
    positions: [],
    engagements: [],
    sources: [],
  };

  const shouldFetch = (area: FocusArea) => focusAreas.includes('all') || focusAreas.includes(area);

  // Fetch timeline/activity if needed
  if (shouldFetch('activity')) {
    let activityQuery = supabase
      .from('dossier_timeline')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(20);

    // Filter by entity based on type
    if (entityType === 'dossier') {
      activityQuery = activityQuery.eq('dossier_id', entityId);
    }

    if (dateRangeStart) {
      activityQuery = activityQuery.gte('event_date', dateRangeStart);
    }
    if (dateRangeEnd) {
      activityQuery = activityQuery.lte('event_date', dateRangeEnd);
    }

    const { data: activities } = await activityQuery;
    if (activities) {
      context.recentActivity = activities;
      context.sources.push(
        ...activities.map((a: any) => ({
          type: 'timeline_event',
          id: a.id,
          title: a.event_title_en || a.event_title_ar || 'Activity',
          date: a.event_date,
        }))
      );
    }
  }

  // Fetch relationships if needed
  if (shouldFetch('relationships')) {
    const { data: relationships } = await supabase
      .from('dossier_relationships')
      .select(
        '*, related_dossier:dossiers!dossier_relationships_related_dossier_id_fkey(id, name_en, name_ar, type)'
      )
      .or(`source_dossier_id.eq.${entityId},target_dossier_id.eq.${entityId}`)
      .limit(15);

    if (relationships) {
      context.relationships = relationships;
      context.sources.push(
        ...relationships.map((r: any) => ({
          type: 'relationship',
          id: r.id,
          title: r.related_dossier?.name_en || 'Related entity',
        }))
      );
    }
  }

  // Fetch commitments if needed
  if (shouldFetch('commitments')) {
    const { data: commitments } = await supabase
      .from('commitments')
      .select('*')
      .eq('dossier_id', entityId)
      .order('deadline', { ascending: true })
      .limit(10);

    if (commitments) {
      context.commitments = commitments;
      context.sources.push(
        ...commitments.map((c: any) => ({
          type: 'commitment',
          id: c.id,
          title: c.description_en || c.description_ar || 'Commitment',
          date: c.deadline,
        }))
      );
    }
  }

  // Fetch positions if entity supports it
  if (shouldFetch('strategic')) {
    const { data: positions } = await supabase
      .from('positions')
      .select('*')
      .eq('dossier_id', entityId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);

    if (positions) {
      context.positions = positions;
      context.sources.push(
        ...positions.map((p: any) => ({
          type: 'position',
          id: p.id,
          title: p.title_en || p.title_ar || 'Position',
        }))
      );
    }
  }

  // Fetch engagements
  if (shouldFetch('activity') || shouldFetch('strategic')) {
    const { data: engagements } = await supabase
      .from('engagements')
      .select('*')
      .eq('dossier_id', entityId)
      .order('engagement_date', { ascending: false })
      .limit(10);

    if (engagements) {
      context.engagements = engagements;
      context.sources.push(
        ...engagements.map((e: any) => ({
          type: 'engagement',
          id: e.id,
          title: e.title_en || e.title_ar || 'Engagement',
          date: e.engagement_date,
        }))
      );
    }
  }

  return context;
}

/**
 * Build the AI prompt for summary generation
 */
function buildSummaryPrompt(
  entity: any,
  context: ContextData,
  entityType: EntityType,
  length: SummaryLength,
  focusAreas: FocusArea[]
): string {
  const config = lengthConfig[length];
  const entityName =
    entity.name_en || entity.title_en || entity.name || entity.title || 'Unknown Entity';
  const entityNameAr = entity.name_ar || entity.title_ar || entityName;

  let focusInstructions = '';
  if (!focusAreas.includes('all')) {
    const focusMap: Record<FocusArea, string> = {
      activity: 'recent activities and events',
      relationships: 'key relationships and connections',
      commitments: 'open commitments and obligations',
      strategic: 'strategic importance and positions',
      all: '',
    };
    focusInstructions = `Focus primarily on: ${focusAreas.map((f) => focusMap[f]).join(', ')}.`;
  }

  const activitySummary =
    context.recentActivity.length > 0
      ? context.recentActivity
          .slice(0, 5)
          .map(
            (a, i) =>
              `${i + 1}. [${a.event_type}] ${a.event_title_en || a.event_title_ar} (${a.event_date})`
          )
          .join('\n')
      : 'No recent activity';

  const relationshipSummary =
    context.relationships.length > 0
      ? context.relationships
          .slice(0, 5)
          .map(
            (r, i) =>
              `${i + 1}. ${r.relationship_type}: ${r.related_dossier?.name_en || 'Related entity'}`
          )
          .join('\n')
      : 'No relationships';

  const commitmentSummary =
    context.commitments.length > 0
      ? context.commitments
          .slice(0, 5)
          .map(
            (c, i) =>
              `${i + 1}. ${c.description_en || c.description_ar} (Status: ${c.status}, Deadline: ${c.deadline || 'N/A'})`
          )
          .join('\n')
      : 'No open commitments';

  const positionSummary =
    context.positions.length > 0
      ? context.positions
          .slice(0, 3)
          .map(
            (p, i) =>
              `${i + 1}. ${p.title_en || p.title_ar}: ${(p.content_en || p.content_ar || '').substring(0, 100)}...`
          )
          .join('\n')
      : 'No approved positions';

  return `Generate a bilingual executive summary for this ${entityType}.

Entity: ${entityName} / ${entityNameAr}
Type: ${entityType}
${entity.summary_en ? `Current Summary: ${entity.summary_en}` : ''}

${focusInstructions}

Recent Activity (${context.recentActivity.length} items):
${activitySummary}

Key Relationships (${context.relationships.length} total):
${relationshipSummary}

Open Commitments (${context.commitments.length} total):
${commitmentSummary}

Strategic Positions (${context.positions.length} approved):
${positionSummary}

Generate a ${length} summary (approximately ${config.words} words) with ${config.sections} focused sections.

Return JSON with this exact structure:
{
  "en": {
    "executive_summary": "A concise ${config.words}-word overview in English...",
    "key_highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
    "sections": [
      {"title": "Section Title", "content": "Section content...", "importance": "high|medium|low"}
    ]
  },
  "ar": {
    "executive_summary": "نظرة عامة موجزة بالعربية...",
    "key_highlights": ["النقطة الأولى", "النقطة الثانية", "النقطة الثالثة"],
    "sections": [
      {"title": "عنوان القسم", "content": "محتوى القسم...", "importance": "high|medium|low"}
    ]
  }
}`;
}

/**
 * Calculate confidence score based on available data
 */
function calculateConfidenceScore(context: ContextData): number {
  let score = 0.5; // Base score

  // Add score based on data availability
  if (context.recentActivity.length >= 5) score += 0.15;
  else if (context.recentActivity.length >= 2) score += 0.1;

  if (context.relationships.length >= 3) score += 0.1;
  if (context.commitments.length >= 2) score += 0.1;
  if (context.positions.length >= 1) score += 0.1;
  if (context.engagements.length >= 2) score += 0.05;

  return Math.min(score, 1.0);
}

/**
 * Generate fallback summary when AI is unavailable
 */
function generateFallbackSummary(
  entity: any,
  context: ContextData,
  entityType: EntityType,
  length: SummaryLength,
  focusAreas: FocusArea[]
): SummaryResponse {
  const entityName = entity.name_en || entity.title_en || entity.name || 'Entity';
  const entityNameAr = entity.name_ar || entity.title_ar || entityName;

  const sections: SummaryContent['sections'] = [];

  // Add sections based on available data
  if (context.recentActivity.length > 0) {
    sections.push({
      title: 'Recent Activity',
      content: `${context.recentActivity.length} recent events recorded. Most recent: ${context.recentActivity[0]?.event_title_en || 'N/A'}`,
      importance: 'medium',
    });
  }

  if (context.relationships.length > 0) {
    sections.push({
      title: 'Relationships',
      content: `${context.relationships.length} relationships identified with other entities.`,
      importance: 'medium',
    });
  }

  if (context.commitments.length > 0) {
    const openCommitments = context.commitments.filter((c: any) => c.status !== 'completed');
    sections.push({
      title: 'Open Commitments',
      content: `${openCommitments.length} open commitments pending action.`,
      importance: openCommitments.length > 3 ? 'high' : 'medium',
    });
  }

  if (context.positions.length > 0) {
    sections.push({
      title: 'Strategic Positions',
      content: `${context.positions.length} approved positions on record.`,
      importance: 'medium',
    });
  }

  const now = new Date().toISOString();

  const enSummary: SummaryContent = {
    executive_summary: `Summary for ${entityName} (${entityType}). This entity has ${context.recentActivity.length} recent activities, ${context.relationships.length} relationships, and ${context.commitments.length} commitments.`,
    key_highlights: [
      `${context.recentActivity.length} recent activities`,
      `${context.relationships.length} relationships`,
      `${context.commitments.length} commitments`,
    ],
    sections: sections,
    metadata: {
      entity_type: entityType,
      entity_id: entity.id,
      generated_at: now,
      data_points_analyzed: context.sources.length,
      confidence_score: calculateConfidenceScore(context),
    },
  };

  const arSections = sections.map((s) => ({
    title: translateTitleToArabic(s.title),
    content: s.content,
    importance: s.importance,
  }));

  const arSummary: SummaryContent = {
    executive_summary: `ملخص لـ ${entityNameAr} (${entityType}). يحتوي هذا الكيان على ${context.recentActivity.length} أنشطة حديثة و ${context.relationships.length} علاقات و ${context.commitments.length} التزامات.`,
    key_highlights: [
      `${context.recentActivity.length} أنشطة حديثة`,
      `${context.relationships.length} علاقات`,
      `${context.commitments.length} التزامات`,
    ],
    sections: arSections,
    metadata: { ...enSummary.metadata },
  };

  return { en: enSummary, ar: arSummary };
}

/**
 * Simple translation helper for section titles
 */
function translateTitleToArabic(title: string): string {
  const translations: Record<string, string> = {
    'Recent Activity': 'النشاط الأخير',
    Relationships: 'العلاقات',
    'Open Commitments': 'الالتزامات المفتوحة',
    'Strategic Positions': 'المواقف الاستراتيجية',
    'Key Highlights': 'النقاط الرئيسية',
  };
  return translations[title] || title;
}
