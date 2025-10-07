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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

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
            message_ar: 'الاستعلام مطلوب ولا يمكن أن يكون فارغًا'
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
          message_ar: `أنواع كيانات غير صالحة: ${invalidTypes.join(', ')}. يجب أن تكون واحدة من: positions, documents, briefs`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate similarity threshold
    if (similarityThreshold < 0 || similarityThreshold > 1) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'Similarity threshold must be between 0.0 and 1.0',
          message_ar: 'يجب أن يكون عتبة التشابه بين 0.0 و 1.0'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
          message_ar: 'مطلوب رأس التفويض'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Note: In production, this would call AnythingLLM to generate the query embedding
    // For now, we'll create a placeholder embedding (all zeros)
    // TODO: Integrate with AnythingLLM or existing vector.service.ts
    const embeddingStartTime = Date.now();
    const queryEmbedding = new Array(1536).fill(0); // Placeholder embedding
    const embeddingGenTime = Date.now() - embeddingStartTime;

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
          p_limit: validatedLimit
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
            match_type: 'semantic'
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
            p_offset: 0
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
              match_type: 'exact'
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
        similarity_threshold: similarityThreshold
      },
      took_ms: tookMs,
      performance: {
        embedding_generation_ms: embeddingGenTime,
        semantic_search_ms: tookMs - embeddingGenTime,
        total_ms: tookMs
      },
      metadata: {
        total_results: results.length,
        types_searched: entityTypes,
        hybrid_search: includeKeywordResults
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Response-Time': `${tookMs}ms`
        }
      }
    );

  } catch (error) {
    console.error('Semantic search error:', error);
    return new Response(
      JSON.stringify({
        error: 'internal_server_error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        message_ar: 'حدث خطأ غير متوقع'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
