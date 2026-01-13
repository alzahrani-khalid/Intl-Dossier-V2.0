/**
 * Position Consistency Checker Edge Function
 * Feature: position-consistency-checker
 *
 * AI service that analyzes new position statements against existing repository
 * to detect contradictions, gaps, or redundancies. Provides recommendations
 * and flags for human review before approval.
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

// Types
interface ConsistencyCheckRequest {
  position_id: string;
  analysis_type?: 'pre_approval' | 'scheduled' | 'manual' | 'on_edit';
  similarity_threshold?: number;
  include_recommendations?: boolean;
}

interface ConflictResult {
  conflict_id: string;
  conflicting_position_id: string;
  conflicting_position_title_en: string;
  conflicting_position_title_ar: string;
  conflict_type:
    | 'contradiction'
    | 'redundancy'
    | 'gap'
    | 'outdated'
    | 'ambiguity'
    | 'semantic_conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description_en: string;
  description_ar: string;
  evidence_en: string;
  evidence_ar: string;
  suggested_resolution_en?: string;
  suggested_resolution_ar?: string;
  similarity_score: number;
  detected_at: string;
}

interface SimilarPosition {
  position_id: string;
  title_en: string;
  title_ar: string;
  similarity_score: number;
  status: string;
  thematic_category: string | null;
  relationship: 'duplicate' | 'related' | 'supersedes' | 'superseded_by';
}

interface Recommendation {
  type: 'merge' | 'update' | 'deprecate' | 'review' | 'approve' | 'reject';
  priority: 'low' | 'medium' | 'high';
  description_en: string;
  description_ar: string;
  affected_positions?: string[];
  action_items_en?: string[];
  action_items_ar?: string[];
}

interface Gap {
  gap_id: string;
  topic_en: string;
  topic_ar: string;
  description_en: string;
  description_ar: string;
  relevance_score: number;
}

interface ConsistencyCheckResult {
  id: string;
  position_id: string;
  overall_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  conflicts: ConflictResult[];
  similar_positions: SimilarPosition[];
  recommendations: {
    summary_en: string;
    summary_ar: string;
    items: Recommendation[];
  };
  gaps_identified: Gap[];
  requires_human_review: boolean;
  auto_approved: boolean;
  ai_service_available: boolean;
  processing_time_ms: number;
  analyzed_at: string;
}

// Conflict detection keywords (English)
const CONTRADICTION_KEYWORDS_EN = {
  positive: ['approve', 'support', 'allow', 'permit', 'encourage', 'increase', 'expand', 'accept'],
  negative: ['reject', 'oppose', 'prohibit', 'forbid', 'discourage', 'decrease', 'reduce', 'deny'],
};

// Conflict detection keywords (Arabic)
const CONTRADICTION_KEYWORDS_AR = {
  positive: ['موافقة', 'دعم', 'سماح', 'تصريح', 'تشجيع', 'زيادة', 'توسيع', 'قبول'],
  negative: ['رفض', 'معارضة', 'منع', 'حظر', 'تثبيط', 'تخفيض', 'تقليص', 'إنكار'],
};

// Ambiguity indicators
const AMBIGUITY_KEYWORDS_EN = [
  'may',
  'might',
  'could',
  'possibly',
  'perhaps',
  'sometimes',
  'often',
  'usually',
];
const AMBIGUITY_KEYWORDS_AR = ['قد', 'ربما', 'محتمل', 'أحيانا', 'غالبا', 'عادة'];

serve(async (req: Request) => {
  // Handle CORS preflight
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

  const startTime = Date.now();

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
    const body: ConsistencyCheckRequest = await req.json();

    if (!body.position_id) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'MISSING_POSITION_ID',
            message_en: 'Position ID is required',
            message_ar: 'معرف الموقف مطلوب',
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const analysisType = body.analysis_type || 'pre_approval';
    const similarityThreshold = body.similarity_threshold || 0.75;
    const includeRecommendations = body.include_recommendations !== false;

    // Fetch the target position
    const { data: position, error: positionError } = await supabaseClient
      .from('positions')
      .select('*')
      .eq('id', body.position_id)
      .single();

    if (positionError || !position) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'POSITION_NOT_FOUND',
            message_en: 'Position not found or access denied',
            message_ar: 'الموقف غير موجود أو الوصول مرفوض',
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize AI interaction logger
    const aiLogger = createAIInteractionLogger('positions-consistency-check');
    const clientInfo = extractClientInfo(req);
    let interactionId: string | undefined;

    // Fetch all approved/published positions for comparison
    const { data: existingPositions, error: existingError } = await supabaseClient
      .from('positions')
      .select(
        `
        id,
        title_en,
        title_ar,
        content_en,
        content_ar,
        rationale_en,
        rationale_ar,
        status,
        thematic_category,
        created_at,
        updated_at
      `
      )
      .neq('id', body.position_id)
      .in('status', ['approved', 'published']);

    if (existingError) {
      console.error('Error fetching existing positions:', existingError);
    }

    const positionsToCompare = existingPositions || [];

    // Find semantically similar positions using vector embeddings
    let similarPositions: SimilarPosition[] = [];

    try {
      const { data: similarData, error: similarError } = await supabaseClient.rpc(
        'find_similar_positions',
        {
          p_position_id: body.position_id,
          p_similarity_threshold: similarityThreshold,
          p_limit: 10,
        }
      );

      if (!similarError && similarData) {
        similarPositions = similarData.map((sp: any) => ({
          position_id: sp.position_id,
          title_en: sp.title_en,
          title_ar: sp.title_ar,
          similarity_score: sp.similarity_score,
          status: sp.status,
          thematic_category: sp.thematic_category,
          relationship:
            sp.similarity_score >= 0.95
              ? 'duplicate'
              : sp.similarity_score >= 0.85
                ? 'related'
                : 'related',
        }));
      }
    } catch (vectorError) {
      console.warn('Vector similarity search failed:', vectorError);
      // Fallback to text-based similarity if vector search fails
    }

    // Detect conflicts using keyword analysis
    const conflicts: ConflictResult[] = [];

    for (const existingPos of positionsToCompare) {
      const conflictResult = analyzeConflict(position, existingPos);
      if (conflictResult) {
        conflicts.push(conflictResult);
      }
    }

    // Try AI-powered analysis for deeper semantic understanding
    let aiRecommendations: Recommendation[] = [];
    let aiGaps: Gap[] = [];
    let aiServiceAvailable = false;

    const anythingLlmUrl = Deno.env.get('ANYTHINGLLM_URL');
    const anythingLlmKey = Deno.env.get('ANYTHINGLLM_API_KEY');

    if (anythingLlmUrl && anythingLlmKey && includeRecommendations) {
      try {
        // Get user's organization ID for logging
        const { data: userProfile } = await supabaseClient
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        // Prepare AI prompt
        const prompt = buildAIAnalysisPrompt(
          position,
          positionsToCompare.slice(0, 10),
          similarPositions,
          conflicts
        );

        // Log AI interaction start
        try {
          const result = await aiLogger.startInteraction({
            organizationId: userProfile?.organization_id || 'unknown',
            userId: user.id,
            interactionType: 'analysis' as AIInteractionType,
            contentType: 'position' as AIContentType,
            modelProvider: 'ollama',
            modelName: 'llama2',
            userPrompt: prompt,
            targetEntityType: 'position',
            targetEntityId: body.position_id,
            contextSources: positionsToCompare.slice(0, 10).map((p) => ({
              type: 'position',
              id: p.id,
              snippet: p.title_en,
            })),
            dataClassification: 'internal',
            requestIp: clientInfo.ip,
            userAgent: clientInfo.userAgent,
          });
          interactionId = result.interactionId;
        } catch (logError) {
          console.warn('Failed to log AI interaction start:', logError);
        }

        // Call AI with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

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

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiResult = parseAIResponse(aiData.textResponse);
          aiRecommendations = aiResult.recommendations;
          aiGaps = aiResult.gaps;
          aiServiceAvailable = true;

          // Log AI interaction completion
          if (interactionId) {
            try {
              await aiLogger.completeInteraction({
                interactionId,
                status: 'completed',
                aiResponse: aiData.textResponse,
                aiResponseStructured: aiResult,
                latencyMs: Date.now() - startTime,
                responseTokenCount: aiData.textResponse?.length || 0,
              });
            } catch (logError) {
              console.warn('Failed to log AI interaction completion:', logError);
            }
          }
        }
      } catch (aiError) {
        console.warn('AI analysis failed:', aiError);

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
      }
    }

    // Generate fallback recommendations if AI is unavailable
    if (!aiServiceAvailable) {
      aiRecommendations = generateFallbackRecommendations(conflicts, similarPositions);
    }

    // Calculate overall score and risk level
    const { overallScore, riskLevel } = calculateScoreAndRisk(conflicts, similarPositions);

    // Determine if human review is required
    const requiresHumanReview = determineHumanReviewNeeded(
      overallScore,
      conflicts,
      similarPositions
    );

    // Check if auto-approval is possible
    const autoApproved =
      !requiresHumanReview &&
      overallScore >= 80 &&
      conflicts.filter((c) => c.severity === 'high' || c.severity === 'critical').length === 0;

    const processingTimeMs = Date.now() - startTime;

    // Store the consistency check result
    const { data: checkResult, error: insertError } = await supabaseClient
      .from('position_consistency_checks')
      .insert({
        position_id: body.position_id,
        analyzed_by: user.id,
        analysis_type: analysisType,
        overall_score: overallScore,
        risk_level: riskLevel,
        ai_service_available: aiServiceAvailable,
        conflicts: conflicts,
        recommendations: {
          summary_en: generateRecommendationSummary(aiRecommendations, 'en'),
          summary_ar: generateRecommendationSummary(aiRecommendations, 'ar'),
          items: aiRecommendations,
        },
        similar_positions: similarPositions,
        gaps_identified: aiGaps,
        requires_human_review: requiresHumanReview,
        auto_approved: autoApproved,
        ai_interaction_id: interactionId || null,
        processing_time_ms: processingTimeMs,
        review_status: autoApproved ? 'approved' : 'pending_review',
        reviewed_by: autoApproved ? user.id : null,
        reviewed_at: autoApproved ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing consistency check:', insertError);
      throw new Error('Failed to store consistency check result');
    }

    // Update position with last consistency check reference
    await supabaseClient
      .from('positions')
      .update({
        last_consistency_check_id: checkResult.id,
        consistency_score: overallScore,
      })
      .eq('id', body.position_id);

    // Build response
    const response: ConsistencyCheckResult = {
      id: checkResult.id,
      position_id: body.position_id,
      overall_score: overallScore,
      risk_level: riskLevel,
      conflicts: conflicts,
      similar_positions: similarPositions,
      recommendations: {
        summary_en: generateRecommendationSummary(aiRecommendations, 'en'),
        summary_ar: generateRecommendationSummary(aiRecommendations, 'ar'),
        items: aiRecommendations,
      },
      gaps_identified: aiGaps,
      requires_human_review: requiresHumanReview,
      auto_approved: autoApproved,
      ai_service_available: aiServiceAvailable,
      processing_time_ms: processingTimeMs,
      analyzed_at: checkResult.analyzed_at,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message_en: 'An unexpected error occurred during consistency check',
          message_ar: 'حدث خطأ غير متوقع أثناء فحص الاتساق',
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

// Helper Functions

function analyzeConflict(newPosition: any, existingPosition: any): ConflictResult | null {
  const contentNew =
    `${newPosition.content_en || ''} ${newPosition.content_ar || ''}`.toLowerCase();
  const contentExisting =
    `${existingPosition.content_en || ''} ${existingPosition.content_ar || ''}`.toLowerCase();

  // Check for contradictions
  const contradiction = detectContradiction(contentNew, contentExisting);
  if (contradiction) {
    return {
      conflict_id: crypto.randomUUID(),
      conflicting_position_id: existingPosition.id,
      conflicting_position_title_en: existingPosition.title_en,
      conflicting_position_title_ar: existingPosition.title_ar,
      conflict_type: 'contradiction',
      severity: contradiction.severity,
      description_en: `Potential contradiction detected with existing position "${existingPosition.title_en}"`,
      description_ar: `تم اكتشاف تناقض محتمل مع الموقف الحالي "${existingPosition.title_ar}"`,
      evidence_en: contradiction.evidence_en,
      evidence_ar: contradiction.evidence_ar,
      suggested_resolution_en: 'Review both positions and reconcile the conflicting statements',
      suggested_resolution_ar: 'مراجعة كلا الموقفين والتوفيق بين البيانات المتناقضة',
      similarity_score: 0,
      detected_at: new Date().toISOString(),
    };
  }

  // Check for ambiguity
  const ambiguity = detectAmbiguity(contentNew);
  if (ambiguity) {
    return {
      conflict_id: crypto.randomUUID(),
      conflicting_position_id: existingPosition.id,
      conflicting_position_title_en: existingPosition.title_en,
      conflicting_position_title_ar: existingPosition.title_ar,
      conflict_type: 'ambiguity',
      severity: 'low',
      description_en:
        'The new position contains ambiguous language that may conflict with established positions',
      description_ar: 'يحتوي الموقف الجديد على لغة غامضة قد تتعارض مع المواقف الراسخة',
      evidence_en: ambiguity.evidence_en,
      evidence_ar: ambiguity.evidence_ar,
      similarity_score: 0,
      detected_at: new Date().toISOString(),
    };
  }

  // Check for outdated positions (based on date)
  const newDate = new Date(newPosition.created_at || newPosition.updated_at);
  const existingDate = new Date(existingPosition.updated_at || existingPosition.created_at);
  const daysDiff = Math.abs((newDate.getTime() - existingDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff > 365 && existingPosition.thematic_category === newPosition.thematic_category) {
    return {
      conflict_id: crypto.randomUUID(),
      conflicting_position_id: existingPosition.id,
      conflicting_position_title_en: existingPosition.title_en,
      conflicting_position_title_ar: existingPosition.title_ar,
      conflict_type: 'outdated',
      severity: 'medium',
      description_en: `Existing position "${existingPosition.title_en}" in the same category may be outdated (over 1 year old)`,
      description_ar: `الموقف الحالي "${existingPosition.title_ar}" في نفس الفئة قد يكون قديماً (أكثر من عام)`,
      evidence_en: `Last updated: ${existingDate.toISOString().split('T')[0]}`,
      evidence_ar: `آخر تحديث: ${existingDate.toISOString().split('T')[0]}`,
      suggested_resolution_en: 'Consider updating or deprecating the older position',
      suggested_resolution_ar: 'يُنصح بتحديث أو إلغاء الموقف القديم',
      similarity_score: 0,
      detected_at: new Date().toISOString(),
    };
  }

  return null;
}

function detectContradiction(
  contentNew: string,
  contentExisting: string
): {
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence_en: string;
  evidence_ar: string;
} | null {
  // Check English contradictions
  const hasPositiveNew = CONTRADICTION_KEYWORDS_EN.positive.some((kw) => contentNew.includes(kw));
  const hasNegativeNew = CONTRADICTION_KEYWORDS_EN.negative.some((kw) => contentNew.includes(kw));
  const hasPositiveExisting = CONTRADICTION_KEYWORDS_EN.positive.some((kw) =>
    contentExisting.includes(kw)
  );
  const hasNegativeExisting = CONTRADICTION_KEYWORDS_EN.negative.some((kw) =>
    contentExisting.includes(kw)
  );

  if ((hasPositiveNew && hasNegativeExisting) || (hasNegativeNew && hasPositiveExisting)) {
    return {
      severity: 'high',
      evidence_en: 'Opposing stance keywords detected between new and existing positions',
      evidence_ar: 'تم اكتشاف كلمات دالة على موقف متعارض بين الموقف الجديد والحالي',
    };
  }

  // Check Arabic contradictions
  const hasPositiveNewAr = CONTRADICTION_KEYWORDS_AR.positive.some((kw) => contentNew.includes(kw));
  const hasNegativeNewAr = CONTRADICTION_KEYWORDS_AR.negative.some((kw) => contentNew.includes(kw));
  const hasPositiveExistingAr = CONTRADICTION_KEYWORDS_AR.positive.some((kw) =>
    contentExisting.includes(kw)
  );
  const hasNegativeExistingAr = CONTRADICTION_KEYWORDS_AR.negative.some((kw) =>
    contentExisting.includes(kw)
  );

  if ((hasPositiveNewAr && hasNegativeExistingAr) || (hasNegativeNewAr && hasPositiveExistingAr)) {
    return {
      severity: 'high',
      evidence_en: 'Opposing stance keywords detected in Arabic content between positions',
      evidence_ar: 'تم اكتشاف كلمات دالة على موقف متعارض في المحتوى العربي',
    };
  }

  return null;
}

function detectAmbiguity(content: string): { evidence_en: string; evidence_ar: string } | null {
  const ambiguousEn = AMBIGUITY_KEYWORDS_EN.filter((kw) => content.includes(kw));
  const ambiguousAr = AMBIGUITY_KEYWORDS_AR.filter((kw) => content.includes(kw));

  if (ambiguousEn.length >= 3 || ambiguousAr.length >= 2) {
    return {
      evidence_en: `Ambiguous terms found: ${ambiguousEn.join(', ')}`,
      evidence_ar: `المصطلحات الغامضة الموجودة: ${ambiguousAr.join(', ')}`,
    };
  }

  return null;
}

function buildAIAnalysisPrompt(
  position: any,
  existingPositions: any[],
  similarPositions: SimilarPosition[],
  detectedConflicts: ConflictResult[]
): string {
  const positionsContext = existingPositions
    .slice(0, 5)
    .map(
      (p, i) =>
        `${i + 1}. [${p.status}] ${p.title_en}: ${(p.content_en || '').substring(0, 200)}...`
    )
    .join('\n');

  const similarContext =
    similarPositions.length > 0
      ? similarPositions
          .map((sp) => `- ${sp.title_en} (similarity: ${(sp.similarity_score * 100).toFixed(1)}%)`)
          .join('\n')
      : 'No highly similar positions found';

  const conflictContext =
    detectedConflicts.length > 0
      ? detectedConflicts
          .map(
            (c) =>
              `- ${c.conflict_type.toUpperCase()}: ${c.conflicting_position_title_en} (${c.severity})`
          )
          .join('\n')
      : 'No obvious conflicts detected';

  return `Analyze this new position statement for consistency with our existing position repository.

NEW POSITION TO ANALYZE:
Title (EN): ${position.title_en}
Title (AR): ${position.title_ar}
Content (EN): ${position.content_en || 'N/A'}
Content (AR): ${position.content_ar || 'N/A'}
Rationale (EN): ${position.rationale_en || 'N/A'}
Category: ${position.thematic_category || 'Uncategorized'}

EXISTING POSITIONS IN REPOSITORY:
${positionsContext}

SIMILAR POSITIONS (by semantic analysis):
${similarContext}

DETECTED CONFLICTS (preliminary analysis):
${conflictContext}

Please analyze and return JSON with this structure:
{
  "semantic_conflicts": [
    {
      "position_id": "uuid",
      "conflict_type": "contradiction|redundancy|gap|semantic_conflict",
      "severity": "low|medium|high|critical",
      "explanation_en": "English explanation",
      "explanation_ar": "Arabic explanation"
    }
  ],
  "recommendations": [
    {
      "type": "merge|update|deprecate|review|approve|reject",
      "priority": "low|medium|high",
      "description_en": "English description",
      "description_ar": "Arabic description",
      "action_items_en": ["action 1", "action 2"],
      "action_items_ar": ["الإجراء 1", "الإجراء 2"]
    }
  ],
  "gaps": [
    {
      "topic_en": "Topic in English",
      "topic_ar": "الموضوع بالعربية",
      "description_en": "What gap this position fills",
      "description_ar": "ما الفجوة التي يسدها هذا الموقف",
      "relevance_score": 0.85
    }
  ],
  "overall_assessment_en": "Brief assessment in English",
  "overall_assessment_ar": "تقييم موجز بالعربية"
}`;
}

function parseAIResponse(responseText: string): {
  recommendations: Recommendation[];
  gaps: Gap[];
} {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { recommendations: [], gaps: [] };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const recommendations: Recommendation[] = (parsed.recommendations || []).map((rec: any) => ({
      type: rec.type || 'review',
      priority: rec.priority || 'medium',
      description_en: rec.description_en || rec.description || '',
      description_ar: rec.description_ar || '',
      action_items_en: rec.action_items_en || [],
      action_items_ar: rec.action_items_ar || [],
    }));

    const gaps: Gap[] = (parsed.gaps || []).map((gap: any) => ({
      gap_id: crypto.randomUUID(),
      topic_en: gap.topic_en || gap.topic || '',
      topic_ar: gap.topic_ar || '',
      description_en: gap.description_en || gap.description || '',
      description_ar: gap.description_ar || '',
      relevance_score: gap.relevance_score || 0.5,
    }));

    return { recommendations, gaps };
  } catch (error) {
    console.warn('Failed to parse AI response:', error);
    return { recommendations: [], gaps: [] };
  }
}

function generateFallbackRecommendations(
  conflicts: ConflictResult[],
  similarPositions: SimilarPosition[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Recommendations based on conflicts
  const criticalConflicts = conflicts.filter((c) => c.severity === 'critical');
  const highConflicts = conflicts.filter((c) => c.severity === 'high');

  if (criticalConflicts.length > 0) {
    recommendations.push({
      type: 'reject',
      priority: 'high',
      description_en: `Critical conflicts detected with ${criticalConflicts.length} existing position(s). Immediate review required.`,
      description_ar: `تم اكتشاف تعارضات حرجة مع ${criticalConflicts.length} موقف/مواقف حالية. المراجعة الفورية مطلوبة.`,
      affected_positions: criticalConflicts.map((c) => c.conflicting_position_id),
      action_items_en: [
        'Review all critical conflicts',
        'Consult with policy team',
        'Consider revising position content',
      ],
      action_items_ar: [
        'مراجعة جميع التعارضات الحرجة',
        'استشارة فريق السياسات',
        'النظر في تعديل محتوى الموقف',
      ],
    });
  }

  if (highConflicts.length > 0) {
    recommendations.push({
      type: 'review',
      priority: 'high',
      description_en: `${highConflicts.length} high-severity conflict(s) require attention before approval.`,
      description_ar: `${highConflicts.length} تعارض/تعارضات عالية الخطورة تتطلب الاهتمام قبل الموافقة.`,
      affected_positions: highConflicts.map((c) => c.conflicting_position_id),
    });
  }

  // Recommendations based on similar positions
  const duplicates = similarPositions.filter((sp) => sp.relationship === 'duplicate');
  if (duplicates.length > 0) {
    recommendations.push({
      type: 'merge',
      priority: 'medium',
      description_en: `${duplicates.length} potentially duplicate position(s) found. Consider merging.`,
      description_ar: `تم العثور على ${duplicates.length} موقف/مواقف مكررة محتملة. يُنصح بالدمج.`,
      affected_positions: duplicates.map((d) => d.position_id),
      action_items_en: [
        'Compare content of similar positions',
        'Determine if merging is appropriate',
        'Update or deprecate redundant positions',
      ],
      action_items_ar: [
        'مقارنة محتوى المواقف المتشابهة',
        'تحديد مدى ملاءمة الدمج',
        'تحديث أو إلغاء المواقف الزائدة',
      ],
    });
  }

  // If no issues found, recommend approval
  if (
    conflicts.length === 0 &&
    similarPositions.filter((sp) => sp.similarity_score > 0.9).length === 0
  ) {
    recommendations.push({
      type: 'approve',
      priority: 'low',
      description_en:
        'No significant conflicts or duplicates detected. Position appears consistent with existing repository.',
      description_ar:
        'لم يتم اكتشاف تعارضات أو تكرارات كبيرة. يبدو الموقف متسقاً مع المستودع الحالي.',
    });
  }

  return recommendations;
}

function calculateScoreAndRisk(
  conflicts: ConflictResult[],
  similarPositions: SimilarPosition[]
): { overallScore: number; riskLevel: 'low' | 'medium' | 'high' | 'critical' } {
  let score = 100;

  // Deduct points for conflicts
  for (const conflict of conflicts) {
    switch (conflict.severity) {
      case 'critical':
        score -= 30;
        break;
      case 'high':
        score -= 20;
        break;
      case 'medium':
        score -= 10;
        break;
      case 'low':
        score -= 5;
        break;
    }
  }

  // Deduct points for high-similarity duplicates
  const duplicates = similarPositions.filter((sp) => sp.similarity_score >= 0.95);
  score -= duplicates.length * 15;

  // Ensure score stays within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (score >= 80) {
    riskLevel = 'low';
  } else if (score >= 60) {
    riskLevel = 'medium';
  } else if (score >= 40) {
    riskLevel = 'high';
  } else {
    riskLevel = 'critical';
  }

  // Override to critical if there are critical conflicts
  if (conflicts.some((c) => c.severity === 'critical')) {
    riskLevel = 'critical';
  }

  return { overallScore: score, riskLevel };
}

function determineHumanReviewNeeded(
  score: number,
  conflicts: ConflictResult[],
  similarPositions: SimilarPosition[]
): boolean {
  // Human review is required if:
  // 1. Score is below 80
  if (score < 80) return true;

  // 2. Any high or critical severity conflicts exist
  if (conflicts.some((c) => c.severity === 'high' || c.severity === 'critical')) {
    return true;
  }

  // 3. Potential duplicates exist (similarity >= 90%)
  if (similarPositions.some((sp) => sp.similarity_score >= 0.9)) {
    return true;
  }

  // 4. More than 3 conflicts of any severity
  if (conflicts.length > 3) return true;

  return false;
}

function generateRecommendationSummary(
  recommendations: Recommendation[],
  lang: 'en' | 'ar'
): string {
  if (recommendations.length === 0) {
    return lang === 'en'
      ? 'No specific recommendations at this time.'
      : 'لا توجد توصيات محددة في الوقت الحالي.';
  }

  const highPriority = recommendations.filter((r) => r.priority === 'high');
  const approvalRec = recommendations.find((r) => r.type === 'approve');

  if (approvalRec) {
    return lang === 'en'
      ? 'Position appears consistent and ready for approval.'
      : 'يبدو الموقف متسقاً وجاهزاً للموافقة.';
  }

  if (highPriority.length > 0) {
    return lang === 'en'
      ? `${highPriority.length} high-priority issue(s) require attention before proceeding.`
      : `${highPriority.length} مسألة/مسائل ذات أولوية عالية تتطلب الاهتمام قبل المتابعة.`;
  }

  return lang === 'en'
    ? `${recommendations.length} recommendation(s) for review.`
    : `${recommendations.length} توصية/توصيات للمراجعة.`;
}
