/**
 * Supabase Edge Function: Semantic Search
 * Feature: 015-search-retrieval-spec
 * Task: T041
 *
 * POST /search-semantic - Semantic search using vector embeddings
 *
 * Request Body:
 * - query: Search query (required)
 * - entity_types: Array of entity types to search (required, must be: positions, documents, briefs)
 * - similarity_threshold: Minimum similarity score (optional, default 0.6, range 0.0-1.0)
 * - limit: Number of results (optional, default 20, max 100)
 * - include_keyword_results: Include exact keyword matches (optional, default false)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const anythingLLMUrl = Deno.env.get('ANYTHINGLLM_URL') ?? '';
const anythingLLMApiKey = Deno.env.get('ANYTHINGLLM_API_KEY') ?? '';

/**
 * Generate embedding for query text using AnythingLLM
 * Falls back to null if embedding generation fails
 */
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  if (!anythingLLMUrl || !anythingLLMApiKey) {
    console.warn('AnythingLLM not configured, embedding generation unavailable');
    return null;
  }

  try {
    const response = await fetch(`${anythingLLMUrl}/api/v1/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anythingLLMApiKey}`,
      },
      body: JSON.stringify({ text: query }),
    });

    if (!response.ok) {
      console.error('AnythingLLM embedding request failed:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.embedding && Array.isArray(data.embedding)) {
      // Normalize to 1536 dimensions if needed
      return normalizeEmbedding(data.embedding, 1536);
    }

    return null;
  } catch (error) {
    console.error('AnythingLLM embedding error:', error);
    return null;
  }
}

/**
 * Normalize embedding to target dimensions (pad or truncate)
 */
function normalizeEmbedding(embedding: number[], targetDim: number): number[] {
  if (embedding.length === targetDim) {
    return embedding;
  }

  if (embedding.length < targetDim) {
    // Pad with zeros
    return [...embedding, ...new Array(targetDim - embedding.length).fill(0)];
  }

  // Truncate
  return embedding.slice(0, targetDim);
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();

    // Parse request body
    const body = await req.json();
    const query = body.query;
    const entityTypes = body.entity_types || ['positions', 'documents', 'briefs'];
    const similarityThreshold = body.similarity_threshold || 0.6;
    const limit = body.limit || 20;
    const includeKeywordResults = body.include_keyword_results || false;

    // Validate query
    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'Query is required and cannot be empty',
          details: {
            message: 'Query is required and cannot be empty',
            message_ar: 'الاستعلام مطلوب ولا يمكن أن يكون فارغًا',
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate entity types
    const validEntityTypes = ['positions', 'documents', 'briefs'];
    const invalidTypes = entityTypes.filter((t: string) => !validEntityTypes.includes(t));
    if (invalidTypes.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: `Invalid entity types: ${invalidTypes.join(', ')}. Must be one of: positions, documents, briefs`,
          message_ar: `أنواع كيانات غير صالحة: ${invalidTypes.join(', ')}. يجب أن تكون واحدة من: positions, documents, briefs`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate similarity threshold
    if (similarityThreshold < 0 || similarityThreshold > 1) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'Similarity threshold must be between 0.0 and 1.0',
          message_ar: 'يجب أن يكون عتبة التشابه بين 0.0 و 1.0',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate limit
    const validatedLimit = Math.min(Math.max(1, limit), 100);

    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'unauthorized',
          message: 'Authorization header required',
          message_ar: 'مطلوب رأس التفويض',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // SECURITY FIX: Generate real embedding using AnythingLLM
    // Previously used placeholder zeros which returned random results
    const embeddingStartTime = Date.now();
    const queryEmbedding = await generateQueryEmbedding(query);
    const embeddingGenTime = Date.now() - embeddingStartTime;

    // If embedding generation failed, fall back to full-text search only
    if (!queryEmbedding) {
      console.warn('Embedding generation failed, falling back to keyword search');

      // Execute keyword search as fallback
      const keywordResults: any[] = [];
      for (const entityType of entityTypes) {
        try {
          const { data, error } = await supabase.rpc('search_entities_fulltext', {
            p_entity_type: entityType,
            p_query: query,
            p_language: 'english',
            p_limit: validatedLimit,
            p_offset: 0,
          });

          if (!error && data && data.length > 0) {
            const results = data.map((item: any) => ({
              id: item.entity_id,
              type: item.entity_type,
              title_en: item.entity_title_en || '',
              title_ar: item.entity_title_ar || '',
              snippet_en: item.entity_snippet_en || '',
              snippet_ar: item.entity_snippet_ar || '',
              similarity_score: Math.min(1.0, item.rank_score / 10),
              updated_at: item.updated_at,
              match_type: 'keyword',
            }));
            keywordResults.push(...results);
          }
        } catch (err) {
          console.error(`Error in fallback keyword search for ${entityType}:`, err);
        }
      }

      keywordResults.sort((a, b) => b.similarity_score - a.similarity_score);

      return new Response(
        JSON.stringify({
          results: keywordResults.slice(0, validatedLimit),
          query: {
            original: query,
            entity_types: entityTypes,
            similarity_threshold: similarityThreshold,
          },
          took_ms: Date.now() - startTime,
          performance: {
            embedding_generation_ms: embeddingGenTime,
            fallback_to_keyword: true,
            total_ms: Date.now() - startTime,
          },
          metadata: {
            total_results: keywordResults.length,
            types_searched: entityTypes,
            search_mode: 'keyword_fallback',
          },
          warning: 'Semantic search unavailable, using keyword search fallback',
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Response-Time': `${Date.now() - startTime}ms`,
          },
        }
      );
    }

    // Execute semantic search for each entity type
    const results: any[] = [];
    const exactMatches: any[] = [];

    for (const entityType of entityTypes) {
      try {
        // Call search_entities_semantic function
        const { data, error } = await supabase.rpc('search_entities_semantic', {
          p_entity_type: entityType,
          p_query_embedding: `[${queryEmbedding.join(',')}]`, // Format as PostgreSQL vector
          p_similarity_threshold: similarityThreshold,
          p_limit: validatedLimit,
        });

        if (error) {
          console.error(`Error in semantic search for ${entityType}:`, error);
          continue;
        }

        if (data && data.length > 0) {
          const typedResults = data.map((item: any) => ({
            id: item.entity_id,
            type: item.entity_type,
            title_en: item.entity_title_en || '',
            title_ar: item.entity_title_ar || '',
            similarity_score: item.similarity_score,
            updated_at: item.updated_at,
            match_type: 'semantic',
          }));

          results.push(...typedResults);
        }
      } catch (err) {
        console.error(`Error in semantic search for ${entityType}:`, err);
      }
    }

    // If include_keyword_results=true, also perform keyword search
    if (includeKeywordResults) {
      const keywordStartTime = Date.now();

      for (const entityType of entityTypes) {
        try {
          const { data, error } = await supabase.rpc('search_entities_fulltext', {
            p_entity_type: entityType,
            p_query: query,
            p_language: 'english', // Auto-detect in production
            p_limit: 10, // Limit exact matches to 10
            p_offset: 0,
          });

          if (!error && data && data.length > 0) {
            const keywordResults = data.map((item: any) => ({
              id: item.entity_id,
              type: item.entity_type,
              title_en: item.entity_title_en || '',
              title_ar: item.entity_title_ar || '',
              snippet_en: item.entity_snippet_en || '',
              snippet_ar: item.entity_snippet_ar || '',
              rank_score: Math.min(1.0, item.rank_score * 10),
              updated_at: item.updated_at,
              match_type: 'exact',
            }));

            exactMatches.push(...keywordResults);
          }
        } catch (err) {
          console.error(`Error in keyword search for ${entityType}:`, err);
        }
      }

      const keywordTime = Date.now() - keywordStartTime;
    }

    // Sort results by similarity score DESC
    results.sort((a, b) => b.similarity_score - a.similarity_score);
    exactMatches.sort((a, b) => b.rank_score - a.rank_score);

    // Calculate performance metrics
    const tookMs = Date.now() - startTime;

    // Build response
    const response = {
      results: results.slice(0, validatedLimit),
      exact_matches: includeKeywordResults ? exactMatches : undefined,
      query: {
        original: query,
        entity_types: entityTypes,
        similarity_threshold: similarityThreshold,
      },
      took_ms: tookMs,
      performance: {
        embedding_generation_ms: embeddingGenTime,
        semantic_search_ms: tookMs - embeddingGenTime,
        total_ms: tookMs,
      },
      metadata: {
        total_results: results.length,
        types_searched: entityTypes,
        hybrid_search: includeKeywordResults,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Response-Time': `${tookMs}ms`,
      },
    });
  } catch (error) {
    console.error('Semantic search error:', error);
    return new Response(
      JSON.stringify({
        error: 'internal_server_error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        message_ar: 'حدث خطأ غير متوقع',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
