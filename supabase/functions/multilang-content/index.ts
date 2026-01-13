/**
 * Multi-Language Content Edge Function
 * Feature: Multi-language content authoring and storage
 *
 * Handles translation and content management for multi-language entities
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Supported actions
type Action = 'translate' | 'bulk_translate' | 'get_translations' | 'upsert' | 'bulk_upsert';

// Content language type
type ContentLanguage =
  | 'ar'
  | 'en'
  | 'fr'
  | 'es'
  | 'zh'
  | 'ru'
  | 'pt'
  | 'de'
  | 'it'
  | 'ja'
  | 'ko'
  | 'tr'
  | 'fa'
  | 'ur'
  | 'hi';

// Language names for translation context
const LANGUAGE_NAMES: Record<ContentLanguage, string> = {
  ar: 'Arabic',
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  zh: 'Chinese',
  ru: 'Russian',
  pt: 'Portuguese',
  de: 'German',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  tr: 'Turkish',
  fa: 'Persian',
  ur: 'Urdu',
  hi: 'Hindi',
};

// Request types
interface TranslateRequest {
  action: 'translate';
  entity_type: string;
  entity_id: string;
  field_name: string;
  source_language: ContentLanguage;
  target_language: ContentLanguage;
  content?: string;
}

interface BulkTranslateRequest {
  action: 'bulk_translate';
  entity_type: string;
  entity_id: string;
  source_language: ContentLanguage;
  target_language: ContentLanguage;
  fields: string[];
}

interface GetTranslationsRequest {
  action: 'get_translations';
  entity_type: string;
  entity_id: string;
  language?: ContentLanguage;
}

interface UpsertRequest {
  action: 'upsert';
  entity_type: string;
  entity_id: string;
  field_name: string;
  language: ContentLanguage;
  content: string;
  content_format?: string;
  is_primary?: boolean;
}

interface BulkUpsertRequest {
  action: 'bulk_upsert';
  entity_type: string;
  entity_id: string;
  translations: Array<{
    field_name: string;
    language: ContentLanguage;
    content: string;
    content_format?: string;
    is_primary?: boolean;
  }>;
}

type RequestBody =
  | TranslateRequest
  | BulkTranslateRequest
  | GetTranslationsRequest
  | UpsertRequest
  | BulkUpsertRequest;

/**
 * Translate text using AI (AnythingLLM or fallback)
 */
async function translateText(
  content: string,
  sourceLanguage: ContentLanguage,
  targetLanguage: ContentLanguage,
  context?: string
): Promise<{ translated_content: string; confidence: number }> {
  const ANYTHINGLLM_URL = Deno.env.get('ANYTHINGLLM_URL') || 'http://localhost:3001';
  const ANYTHINGLLM_TOKEN = Deno.env.get('ANYTHINGLLM_API_KEY');
  const ANYTHINGLLM_WORKSPACE = Deno.env.get('ANYTHINGLLM_WORKSPACE') || 'dossier';

  const sourceLangName = LANGUAGE_NAMES[sourceLanguage];
  const targetLangName = LANGUAGE_NAMES[targetLanguage];

  const translationPrompt = `You are a professional diplomatic translator. Translate the following text from ${sourceLangName} to ${targetLangName}.

Important guidelines:
- Maintain the original meaning and tone
- Preserve any technical or diplomatic terminology
- Keep proper nouns and organization names consistent
- Maintain formatting (paragraphs, lists, etc.)
${context ? `\nContext: ${context}` : ''}

Text to translate:
${content}

Provide ONLY the translated text, without any explanations or notes.`;

  try {
    const response = await fetch(
      `${ANYTHINGLLM_URL}/api/v1/workspace/${ANYTHINGLLM_WORKSPACE}/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ANYTHINGLLM_TOKEN}`,
        },
        body: JSON.stringify({
          message: translationPrompt,
          mode: 'chat',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`AnythingLLM API error: ${response.status}`);
    }

    const result = await response.json();
    const translatedContent = result.textResponse || result.response || '';

    // Calculate confidence based on response quality
    let confidence = 0.85; // Base confidence for AI translation
    if (translatedContent.length > 0) {
      // Adjust confidence based on length ratio (should be similar)
      const lengthRatio = translatedContent.length / content.length;
      if (lengthRatio >= 0.5 && lengthRatio <= 2.0) {
        confidence = 0.9;
      }
    }

    return {
      translated_content: translatedContent.trim(),
      confidence,
    };
  } catch (error) {
    console.error('Translation error:', error);

    // Fallback: Return original with low confidence if AI fails
    // In production, could use a backup translation service
    return {
      translated_content: content,
      confidence: 0.1,
    };
  }
}

/**
 * Main handler
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: { code: 'UNAUTHORIZED', message: 'Missing authorization header' },
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();

    switch (body.action) {
      case 'translate': {
        const { entity_type, entity_id, field_name, source_language, target_language, content } =
          body as TranslateRequest;

        // Get source content if not provided
        let sourceContent = content;
        if (!sourceContent) {
          const { data: existingContent, error: fetchError } = await supabase
            .from('entity_content_translations')
            .select('content')
            .eq('entity_type', entity_type)
            .eq('entity_id', entity_id)
            .eq('field_name', field_name)
            .eq('language', source_language)
            .single();

          if (fetchError || !existingContent) {
            return new Response(
              JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Source content not found' } }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          sourceContent = existingContent.content;
        }

        // Translate the content
        const { translated_content, confidence } = await translateText(
          sourceContent,
          source_language,
          target_language,
          `Entity type: ${entity_type}, Field: ${field_name}`
        );

        // Save the translation
        const { data: savedTranslation, error: saveError } = await supabase.rpc(
          'upsert_multilang_translation',
          {
            p_entity_type: entity_type,
            p_entity_id: entity_id,
            p_field_name: field_name,
            p_language: target_language,
            p_content: translated_content,
            p_content_format: 'plain',
            p_is_primary: false,
            p_is_machine_translated: true,
            p_translation_confidence: confidence,
            p_source_language: source_language,
            p_status: 'draft',
          }
        );

        if (saveError) {
          console.error('Save error:', saveError);
          return new Response(
            JSON.stringify({ error: { code: 'SAVE_FAILED', message: saveError.message } }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            original_content: sourceContent,
            translated_content,
            source_language,
            target_language,
            confidence,
            translation_id: savedTranslation,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'bulk_translate': {
        const { entity_type, entity_id, source_language, target_language, fields } =
          body as BulkTranslateRequest;

        const results = [];

        for (const field_name of fields) {
          // Get source content
          const { data: existingContent } = await supabase
            .from('entity_content_translations')
            .select('content')
            .eq('entity_type', entity_type)
            .eq('entity_id', entity_id)
            .eq('field_name', field_name)
            .eq('language', source_language)
            .single();

          if (!existingContent?.content) {
            results.push({ field_name, success: false, error: 'Source content not found' });
            continue;
          }

          // Translate
          const { translated_content, confidence } = await translateText(
            existingContent.content,
            source_language,
            target_language,
            `Entity type: ${entity_type}, Field: ${field_name}`
          );

          // Save
          const { data: translationId, error: saveError } = await supabase.rpc(
            'upsert_multilang_translation',
            {
              p_entity_type: entity_type,
              p_entity_id: entity_id,
              p_field_name: field_name,
              p_language: target_language,
              p_content: translated_content,
              p_content_format: 'plain',
              p_is_primary: false,
              p_is_machine_translated: true,
              p_translation_confidence: confidence,
              p_source_language: source_language,
              p_status: 'draft',
            }
          );

          results.push({
            field_name,
            success: !saveError,
            translation_id: translationId,
            confidence,
            error: saveError?.message,
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            results,
            source_language,
            target_language,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_translations': {
        const { entity_type, entity_id, language } = body as GetTranslationsRequest;

        const { data: translations, error: fetchError } = await supabase.rpc(
          'get_multilang_translations',
          {
            p_entity_type: entity_type,
            p_entity_id: entity_id,
            p_language: language || null,
          }
        );

        if (fetchError) {
          return new Response(
            JSON.stringify({ error: { code: 'FETCH_FAILED', message: fetchError.message } }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: availableLanguages } = await supabase.rpc(
          'get_multilang_available_languages',
          {
            p_entity_type: entity_type,
            p_entity_id: entity_id,
          }
        );

        return new Response(
          JSON.stringify({
            success: true,
            translations: translations || [],
            available_languages: availableLanguages || [],
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'upsert': {
        const {
          entity_type,
          entity_id,
          field_name,
          language,
          content,
          content_format,
          is_primary,
        } = body as UpsertRequest;

        const { data: translationId, error: saveError } = await supabase.rpc(
          'upsert_multilang_translation',
          {
            p_entity_type: entity_type,
            p_entity_id: entity_id,
            p_field_name: field_name,
            p_language: language,
            p_content: content,
            p_content_format: content_format || 'plain',
            p_is_primary: is_primary || false,
            p_is_machine_translated: false,
            p_translation_confidence: null,
            p_source_language: null,
            p_status: 'published',
          }
        );

        if (saveError) {
          return new Response(
            JSON.stringify({ error: { code: 'SAVE_FAILED', message: saveError.message } }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            translation_id: translationId,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'bulk_upsert': {
        const { entity_type, entity_id, translations } = body as BulkUpsertRequest;

        const results = [];

        for (const t of translations) {
          const { data: translationId, error: saveError } = await supabase.rpc(
            'upsert_multilang_translation',
            {
              p_entity_type: entity_type,
              p_entity_id: entity_id,
              p_field_name: t.field_name,
              p_language: t.language,
              p_content: t.content,
              p_content_format: t.content_format || 'plain',
              p_is_primary: t.is_primary || false,
              p_is_machine_translated: false,
              p_translation_confidence: null,
              p_source_language: null,
              p_status: 'published',
            }
          );

          results.push({
            field_name: t.field_name,
            language: t.language,
            success: !saveError,
            translation_id: translationId,
            error: saveError?.message,
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            results,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: { code: 'INVALID_ACTION', message: 'Unknown action' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
