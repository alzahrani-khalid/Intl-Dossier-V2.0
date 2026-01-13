/**
 * Content Translation Edge Function
 * Feature: translation-service
 *
 * Provides automatic translation between Arabic and English using AI.
 * Supports translating text content for bilingual fields, documents,
 * and provides draft translations for user review and correction.
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

// Supported translation directions
type TranslationDirection = 'en_to_ar' | 'ar_to_en' | 'auto';

// Content types that can be translated
type TranslatableContentType =
  | 'title'
  | 'description'
  | 'summary'
  | 'content'
  | 'comment'
  | 'position'
  | 'commitment'
  | 'document'
  | 'general';

interface TranslateRequest {
  text: string;
  direction?: TranslationDirection;
  content_type?: TranslatableContentType;
  preserve_formatting?: boolean;
  entity_type?: string;
  entity_id?: string;
  field_name?: string;
}

interface TranslateResponse {
  original_text: string;
  translated_text: string;
  source_language: 'en' | 'ar';
  target_language: 'en' | 'ar';
  confidence: number;
  content_type: TranslatableContentType;
  metadata: {
    translation_id: string;
    translated_at: string;
    model_used: string;
    char_count: number;
    latency_ms: number;
  };
}

interface BatchTranslateRequest {
  items: Array<{
    id: string;
    text: string;
    field_name?: string;
  }>;
  direction?: TranslationDirection;
  content_type?: TranslatableContentType;
  entity_type?: string;
  entity_id?: string;
}

interface BatchTranslateResponse {
  translations: Array<{
    id: string;
    original_text: string;
    translated_text: string;
    confidence: number;
  }>;
  source_language: 'en' | 'ar';
  target_language: 'en' | 'ar';
  metadata: {
    batch_id: string;
    translated_at: string;
    total_items: number;
    total_chars: number;
    latency_ms: number;
  };
}

/**
 * Detect the language of input text
 */
function detectLanguage(text: string): 'en' | 'ar' {
  // Arabic Unicode range detection
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const arabicMatches = (text.match(arabicPattern) || []).length;
  const totalChars = text.replace(/\s/g, '').length;

  // If more than 30% Arabic characters, consider it Arabic
  return arabicMatches / totalChars > 0.3 ? 'ar' : 'en';
}

/**
 * Build translation prompt based on content type
 */
function buildTranslationPrompt(
  text: string,
  sourceLanguage: 'en' | 'ar',
  targetLanguage: 'en' | 'ar',
  contentType: TranslatableContentType,
  preserveFormatting: boolean
): string {
  const languageNames = {
    en: 'English',
    ar: 'Arabic',
  };

  const contentTypeInstructions: Record<TranslatableContentType, string> = {
    title: 'This is a title/heading. Keep it concise and professional.',
    description: 'This is a description. Maintain the informative tone and clarity.',
    summary: 'This is a summary/abstract. Preserve the key points and professional tone.',
    content: 'This is content/body text. Maintain the original structure and meaning.',
    comment: 'This is a comment/note. Keep the conversational or formal tone as appropriate.',
    position: 'This is a policy position statement. Use formal, diplomatic language.',
    commitment: 'This is a commitment/obligation. Maintain precise, actionable language.',
    document:
      'This is document content. Preserve structure, formatting markers, and professional tone.',
    general: 'Translate accurately while maintaining natural language flow.',
  };

  const formattingInstruction = preserveFormatting
    ? 'Preserve any formatting markers (line breaks, bullet points, numbering) exactly as in the original.'
    : 'You may adjust formatting for natural flow in the target language.';

  const rtlNote =
    targetLanguage === 'ar'
      ? 'Ensure the Arabic text reads naturally from right to left.'
      : 'Ensure the English text reads naturally from left to right.';

  return `Translate the following text from ${languageNames[sourceLanguage]} to ${languageNames[targetLanguage]}.

${contentTypeInstructions[contentType]}
${formattingInstruction}
${rtlNote}

IMPORTANT:
- Return ONLY the translated text, without any explanations or notes.
- Do not include phrases like "Translation:" or "Here is the translation:".
- Maintain professional terminology appropriate for government/diplomatic contexts.
- For proper nouns (names, organizations), keep them recognizable in the target language.

Text to translate:
${text}`;
}

/**
 * Generate fallback translation (simple word-by-word or placeholder)
 */
function generateFallbackTranslation(
  text: string,
  sourceLanguage: 'en' | 'ar',
  targetLanguage: 'en' | 'ar'
): string {
  // Return a placeholder indicating translation is needed
  if (targetLanguage === 'ar') {
    return `[الترجمة معلقة] ${text}`;
  }
  return `[Translation pending] ${text}`;
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

    // Parse request body and determine if batch or single
    const url = new URL(req.url);
    const isBatch = url.pathname.endsWith('/batch');

    if (isBatch) {
      return await handleBatchTranslation(req, supabaseClient, user);
    }

    const body: TranslateRequest = await req.json();

    // Validate required fields
    if (!body.text || body.text.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_REQUEST',
            message_en: 'Text to translate is required',
            message_ar: 'النص المراد ترجمته مطلوب',
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Limit text length to prevent abuse
    if (body.text.length > 10000) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'TEXT_TOO_LONG',
            message_en: 'Text exceeds maximum length of 10,000 characters',
            message_ar: 'النص يتجاوز الحد الأقصى البالغ 10,000 حرف',
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const contentType = body.content_type || 'general';
    const preserveFormatting = body.preserve_formatting !== false;

    // Detect source language if direction is auto or not specified
    let sourceLanguage: 'en' | 'ar';
    let targetLanguage: 'en' | 'ar';

    if (body.direction === 'en_to_ar') {
      sourceLanguage = 'en';
      targetLanguage = 'ar';
    } else if (body.direction === 'ar_to_en') {
      sourceLanguage = 'ar';
      targetLanguage = 'en';
    } else {
      // Auto-detect
      sourceLanguage = detectLanguage(body.text);
      targetLanguage = sourceLanguage === 'en' ? 'ar' : 'en';
    }

    // Initialize AI interaction logger
    const aiLogger = createAIInteractionLogger('translate-content');
    const clientInfo = extractClientInfo(req);
    let interactionId: string | undefined;
    const startTime = Date.now();

    // Try AI translation
    const anythingLlmUrl = Deno.env.get('ANYTHINGLLM_URL');
    const anythingLlmKey = Deno.env.get('ANYTHINGLLM_API_KEY');

    let translatedText: string;
    let confidence = 0.95;
    let modelUsed = 'anythingllm';

    if (anythingLlmUrl && anythingLlmKey) {
      try {
        const prompt = buildTranslationPrompt(
          body.text,
          sourceLanguage,
          targetLanguage,
          contentType,
          preserveFormatting
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
            interactionType: 'translation' as AIInteractionType,
            contentType: 'translation' as AIContentType,
            modelProvider: 'ollama',
            modelName: 'llama2',
            userPrompt: prompt,
            targetEntityType: body.entity_type as any,
            targetEntityId: body.entity_id,
            promptVariables: {
              source_language: sourceLanguage,
              target_language: targetLanguage,
              content_type: contentType,
              field_name: body.field_name,
            },
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
        translatedText = aiData.textResponse?.trim() || '';

        // Clean up any unwanted prefixes the AI might have added
        translatedText = translatedText
          .replace(/^(Translation:|Here is the translation:|Translated text:)\s*/i, '')
          .trim();

        const latencyMs = Date.now() - startTime;

        // Log AI interaction completion
        if (interactionId) {
          try {
            await aiLogger.completeInteraction({
              interactionId,
              status: 'completed',
              aiResponse: translatedText,
              aiResponseStructured: {
                source_language: sourceLanguage,
                target_language: targetLanguage,
                original_length: body.text.length,
                translated_length: translatedText.length,
              },
              latencyMs,
              responseTokenCount: translatedText.length,
            });
          } catch (logError) {
            console.warn('Failed to log AI interaction completion:', logError);
          }
        }
      } catch (aiError) {
        console.warn('AI translation failed:', aiError);

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

        // Use fallback
        translatedText = generateFallbackTranslation(body.text, sourceLanguage, targetLanguage);
        confidence = 0.0;
        modelUsed = 'fallback';
      }
    } else {
      // No AI configured, use fallback
      translatedText = generateFallbackTranslation(body.text, sourceLanguage, targetLanguage);
      confidence = 0.0;
      modelUsed = 'fallback';
    }

    const latencyMs = Date.now() - startTime;
    const translationId = crypto.randomUUID();

    // Optionally save translation to history
    if (body.entity_type && body.entity_id && body.field_name) {
      try {
        await supabaseClient.from('translation_history').insert({
          id: translationId,
          entity_type: body.entity_type,
          entity_id: body.entity_id,
          field_name: body.field_name,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          original_text: body.text,
          translated_text: translatedText,
          confidence,
          model_used: modelUsed,
          translated_by_user_id: user.id,
        });
      } catch (saveError) {
        console.warn('Failed to save translation history:', saveError);
        // Non-blocking, continue with response
      }
    }

    const response: TranslateResponse = {
      original_text: body.text,
      translated_text: translatedText,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      confidence,
      content_type: contentType,
      metadata: {
        translation_id: translationId,
        translated_at: new Date().toISOString(),
        model_used: modelUsed,
        char_count: body.text.length,
        latency_ms: latencyMs,
      },
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
 * Handle batch translation requests
 */
async function handleBatchTranslation(
  req: Request,
  supabaseClient: any,
  user: any
): Promise<Response> {
  const body: BatchTranslateRequest = await req.json();

  if (!body.items || body.items.length === 0) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'INVALID_REQUEST',
          message_en: 'Items array is required',
          message_ar: 'مصفوفة العناصر مطلوبة',
        },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  if (body.items.length > 20) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'BATCH_TOO_LARGE',
          message_en: 'Maximum 20 items per batch',
          message_ar: 'الحد الأقصى 20 عنصر لكل دفعة',
        },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const startTime = Date.now();
  const contentType = body.content_type || 'general';

  // Detect language from first non-empty item
  const firstText = body.items.find((item) => item.text?.trim())?.text || '';
  let sourceLanguage: 'en' | 'ar';
  let targetLanguage: 'en' | 'ar';

  if (body.direction === 'en_to_ar') {
    sourceLanguage = 'en';
    targetLanguage = 'ar';
  } else if (body.direction === 'ar_to_en') {
    sourceLanguage = 'ar';
    targetLanguage = 'en';
  } else {
    sourceLanguage = detectLanguage(firstText);
    targetLanguage = sourceLanguage === 'en' ? 'ar' : 'en';
  }

  const anythingLlmUrl = Deno.env.get('ANYTHINGLLM_URL');
  const anythingLlmKey = Deno.env.get('ANYTHINGLLM_API_KEY');

  const translations: BatchTranslateResponse['translations'] = [];
  let totalChars = 0;

  for (const item of body.items) {
    if (!item.text?.trim()) {
      translations.push({
        id: item.id,
        original_text: item.text || '',
        translated_text: '',
        confidence: 1.0,
      });
      continue;
    }

    totalChars += item.text.length;

    if (anythingLlmUrl && anythingLlmKey) {
      try {
        const prompt = buildTranslationPrompt(
          item.text,
          sourceLanguage,
          targetLanguage,
          contentType,
          true
        );

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

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          let translatedText = aiData.textResponse?.trim() || '';
          translatedText = translatedText
            .replace(/^(Translation:|Here is the translation:|Translated text:)\s*/i, '')
            .trim();

          translations.push({
            id: item.id,
            original_text: item.text,
            translated_text: translatedText,
            confidence: 0.95,
          });
        } else {
          throw new Error(`AI returned ${aiResponse.status}`);
        }
      } catch (err) {
        translations.push({
          id: item.id,
          original_text: item.text,
          translated_text: generateFallbackTranslation(item.text, sourceLanguage, targetLanguage),
          confidence: 0.0,
        });
      }
    } else {
      translations.push({
        id: item.id,
        original_text: item.text,
        translated_text: generateFallbackTranslation(item.text, sourceLanguage, targetLanguage),
        confidence: 0.0,
      });
    }
  }

  const latencyMs = Date.now() - startTime;

  const response: BatchTranslateResponse = {
    translations,
    source_language: sourceLanguage,
    target_language: targetLanguage,
    metadata: {
      batch_id: crypto.randomUUID(),
      translated_at: new Date().toISOString(),
      total_items: body.items.length,
      total_chars: totalChars,
      latency_ms: latencyMs,
    },
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
