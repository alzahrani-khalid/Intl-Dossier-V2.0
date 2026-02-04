/**
 * Dossier Field Assist Edge Function
 *
 * Takes a dossier type and user description, then uses AI to generate
 * bilingual (EN/AR) field values for name, description, and suggested tags.
 *
 * Request:
 * POST /functions/v1/dossier-field-assist
 * {
 *   dossier_type: DossierType
 *   description: string
 *   language?: 'en' | 'ar'
 * }
 *
 * Response:
 * {
 *   name_en: string
 *   name_ar: string
 *   description_en: string
 *   description_ar: string
 *   suggested_tags: string[]
 * }
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

// Valid dossier types
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

interface FieldAssistRequest {
  dossier_type: DossierType;
  description: string;
  language?: 'en' | 'ar';
}

interface GeneratedFields {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  suggested_tags: string[];
}

// Type-specific context for better AI generation
const TYPE_CONTEXT: Record<DossierType, { en: string; ar: string; suggestedTags: string[] }> = {
  country: {
    en: 'a country dossier for tracking bilateral relations, diplomatic ties, and country-specific information',
    ar: 'ملف دولة لتتبع العلاقات الثنائية والروابط الدبلوماسية والمعلومات الخاصة بالدولة',
    suggestedTags: ['bilateral', 'diplomatic', 'relations'],
  },
  organization: {
    en: 'an organization dossier for tracking international bodies, agencies, or partner institutions',
    ar: 'ملف منظمة لتتبع الهيئات الدولية أو الوكالات أو المؤسسات الشريكة',
    suggestedTags: ['organization', 'partnership', 'institutional'],
  },
  forum: {
    en: 'a forum dossier for tracking multilateral conferences, summits, and recurring events',
    ar: 'ملف منتدى لتتبع المؤتمرات متعددة الأطراف والقمم والفعاليات المتكررة',
    suggestedTags: ['forum', 'multilateral', 'conference'],
  },
  engagement: {
    en: 'an engagement dossier for tracking specific meetings, visits, or diplomatic events',
    ar: 'ملف مشاركة لتتبع اجتماعات أو زيارات أو فعاليات دبلوماسية محددة',
    suggestedTags: ['engagement', 'meeting', 'event'],
  },
  topic: {
    en: 'a topic dossier for tracking policy areas, thematic briefs, or strategic initiatives',
    ar: 'ملف موضوع لتتبع مجالات السياسة أو الإحاطات الموضوعية أو المبادرات الاستراتيجية',
    suggestedTags: ['topic', 'policy', 'thematic'],
  },
  working_group: {
    en: 'a working group dossier for tracking committees, task forces, or collaborative bodies',
    ar: 'ملف مجموعة عمل لتتبع اللجان أو فرق العمل أو الهيئات التعاونية',
    suggestedTags: ['working-group', 'committee', 'coordination'],
  },
  person: {
    en: 'a person dossier for tracking VIPs, officials, or key stakeholders',
    ar: 'ملف شخص لتتبع كبار الشخصيات أو المسؤولين أو أصحاب المصلحة الرئيسيين',
    suggestedTags: ['person', 'contact', 'stakeholder'],
  },
};

/**
 * Generate fallback fields when AI is unavailable
 */
function generateFallbackFields(
  dossierType: DossierType,
  description: string,
  preferredLanguage: 'en' | 'ar'
): GeneratedFields {
  const context = TYPE_CONTEXT[dossierType];
  const isArabic = /[\u0600-\u06FF]/.test(description);

  // Extract a name from the description (first sentence or first 50 chars)
  const firstPart = description.split(/[.،!?]/)[0].trim();
  const nameBase = firstPart.length > 50 ? firstPart.slice(0, 47) + '...' : firstPart;

  // Generate bilingual names
  const typeLabels: Record<DossierType, { en: string; ar: string }> = {
    country: { en: 'Country', ar: 'دولة' },
    organization: { en: 'Organization', ar: 'منظمة' },
    forum: { en: 'Forum', ar: 'منتدى' },
    engagement: { en: 'Engagement', ar: 'مشاركة' },
    topic: { en: 'Topic', ar: 'موضوع' },
    working_group: { en: 'Working Group', ar: 'مجموعة عمل' },
    person: { en: 'Person', ar: 'شخص' },
  };

  const typeLabel = typeLabels[dossierType];

  let name_en: string;
  let name_ar: string;
  let description_en: string;
  let description_ar: string;

  if (isArabic) {
    name_ar = nameBase;
    name_en = `${typeLabel.en} Dossier`;
    description_ar = description.length > 200 ? description.slice(0, 197) + '...' : description;
    description_en = `${typeLabel.en} dossier for tracking and managing related information.`;
  } else {
    name_en = nameBase;
    name_ar = `ملف ${typeLabel.ar}`;
    description_en = description.length > 200 ? description.slice(0, 197) + '...' : description;
    description_ar = `ملف ${typeLabel.ar} لتتبع وإدارة المعلومات ذات الصلة.`;
  }

  // Extract potential tags from description
  const words = description.toLowerCase().split(/\s+/);
  const extractedTags = words
    .filter((word) => word.length > 4 && /^[a-z-]+$/.test(word))
    .slice(0, 2);

  const suggested_tags = [...context.suggestedTags, ...extractedTags].slice(0, 5);

  return {
    name_en,
    name_ar,
    description_en,
    description_ar,
    suggested_tags,
  };
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
    const body: FieldAssistRequest = await req.json();

    // Validate required fields
    if (!body.dossier_type || !body.description) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message_en: 'dossier_type and description are required',
            message_ar: 'نوع الملف والوصف مطلوبان',
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate dossier type
    if (!VALID_DOSSIER_TYPES.includes(body.dossier_type)) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message_en: `Invalid dossier_type. Must be one of: ${VALID_DOSSIER_TYPES.join(', ')}`,
            message_ar: `نوع الملف غير صالح. يجب أن يكون أحد: ${VALID_DOSSIER_TYPES.join(', ')}`,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate description length
    if (body.description.trim().length < 10) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message_en: 'Description must be at least 10 characters',
            message_ar: 'يجب أن يكون الوصف 10 أحرف على الأقل',
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const preferredLanguage = body.language || 'en';
    const context = TYPE_CONTEXT[body.dossier_type];

    // Try AI generation with AnythingLLM
    const anythingLlmUrl = Deno.env.get('ANYTHINGLLM_URL');
    const anythingLlmKey = Deno.env.get('ANYTHINGLLM_API_KEY');

    // Initialize AI interaction logger
    const aiLogger = createAIInteractionLogger('dossier-field-assist');
    const clientInfo = extractClientInfo(req);
    let interactionId: string | undefined;

    if (anythingLlmUrl && anythingLlmKey) {
      try {
        // Prepare AI prompt
        const prompt = `You are a diplomatic dossier assistant. Generate structured fields for ${context.en}.

User's description: "${body.description}"

Generate the following fields in JSON format:
1. name_en: A concise, professional English name (max 60 characters)
2. name_ar: The equivalent Arabic name (max 60 characters)
3. description_en: A professional English description (max 200 characters)
4. description_ar: The equivalent Arabic description (max 200 characters)
5. suggested_tags: An array of 3-5 relevant tags in English (lowercase, hyphenated)

The response MUST be valid JSON only, no additional text:
{
  "name_en": "...",
  "name_ar": "...",
  "description_en": "...",
  "description_ar": "...",
  "suggested_tags": ["tag1", "tag2", "tag3"]
}`;

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
            interactionType: 'generation' as AIInteractionType,
            contentType: 'extraction' as AIContentType,
            modelProvider: 'ollama',
            modelName: 'llama2',
            userPrompt: prompt,
            targetEntityType: 'dossier',
            contextSources: [
              {
                type: 'user_input',
                id: 'description',
                snippet: body.description.slice(0, 100),
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

        // Call AI with timeout (30 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

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
        const latencyMs = Date.now() - startTime;

        // Parse AI response
        let generatedFields: GeneratedFields;

        try {
          // Try to extract JSON from the response
          const responseText = aiData.textResponse || '';
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);

          if (jsonMatch) {
            generatedFields = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }

          // Validate required fields
          if (!generatedFields.name_en || !generatedFields.name_ar) {
            throw new Error('Missing required fields');
          }

          // Ensure suggested_tags is an array
          if (!Array.isArray(generatedFields.suggested_tags)) {
            generatedFields.suggested_tags = context.suggestedTags;
          }
        } catch (parseError) {
          console.warn('Failed to parse AI response, using fallback:', parseError);
          generatedFields = generateFallbackFields(
            body.dossier_type,
            body.description,
            preferredLanguage
          );
        }

        // Log AI interaction completion
        if (interactionId) {
          try {
            await aiLogger.completeInteraction({
              interactionId,
              status: 'completed',
              aiResponse: aiData.textResponse,
              aiResponseStructured: generatedFields,
              latencyMs,
              responseTokenCount: aiData.textResponse?.length || 0,
            });
          } catch (logError) {
            console.warn('Failed to log AI interaction completion:', logError);
          }
        }

        return new Response(JSON.stringify(generatedFields), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (aiError) {
        console.warn('AI generation failed:', aiError);

        // Log AI interaction failure
        if (interactionId) {
          try {
            await aiLogger.completeInteraction({
              interactionId,
              status: 'failed',
              errorMessage: aiError instanceof Error ? aiError.message : 'Unknown error',
              latencyMs: 0,
            });
          } catch (logError) {
            console.warn('Failed to log AI interaction failure:', logError);
          }
        }

        // Fall through to fallback
      }
    }

    // Fallback: Generate fields without AI
    const fallbackFields = generateFallbackFields(
      body.dossier_type,
      body.description,
      preferredLanguage
    );

    return new Response(JSON.stringify(fallbackFields), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
