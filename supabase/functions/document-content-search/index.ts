/**
 * Document Content Search Edge Function
 * Feature: document-ocr-indexing
 *
 * Performs full-text search across OCR-extracted document content
 * Supports bilingual search (Arabic and English)
 * Returns documents with ranked results and highlighted snippets
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Inline CORS headers to avoid import issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Interfaces
interface SearchRequest {
  query: string;
  language?: 'en' | 'ar' | 'all';
  limit?: number;
  offset?: number;
  min_confidence?: number;
  owner_type?: string;
  owner_id?: string;
}

interface SearchResult {
  document_id: string;
  document_table: string;
  title: string;
  title_ar?: string;
  snippet: string;
  rank_score: number;
  ocr_confidence: number;
  language_detected: string[];
  mime_type?: string;
  file_size?: number;
  storage_path?: string;
  created_at: string;
  owner_type?: string;
  owner_id?: string;
}

interface SearchResponse {
  results: SearchResult[];
  total_count: number;
  query: string;
  language: string;
  processing_time_ms: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request based on method
    let searchParams: SearchRequest;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      searchParams = {
        query: url.searchParams.get('query') || '',
        language: (url.searchParams.get('language') as 'en' | 'ar' | 'all') || 'all',
        limit: parseInt(url.searchParams.get('limit') || '20', 10),
        offset: parseInt(url.searchParams.get('offset') || '0', 10),
        min_confidence: parseFloat(url.searchParams.get('min_confidence') || '0'),
        owner_type: url.searchParams.get('owner_type') || undefined,
        owner_id: url.searchParams.get('owner_id') || undefined,
      };
    } else if (req.method === 'POST') {
      searchParams = await req.json();
    } else {
      return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate query
    if (!searchParams.query || searchParams.query.trim().length < 2) {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          message: 'Search query must be at least 2 characters',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Set defaults
    const query = searchParams.query.trim();
    const language = searchParams.language || 'all';
    const limit = Math.min(searchParams.limit || 20, 100);
    const offset = searchParams.offset || 0;
    const minConfidence = searchParams.min_confidence || 0;

    // Call the search function
    const { data: searchResults, error: searchError } = await supabase.rpc(
      'search_documents_content',
      {
        p_query: query,
        p_language: language,
        p_limit: limit,
        p_offset: offset,
        p_min_confidence: minConfidence,
      }
    );

    if (searchError) {
      console.error('Search error:', searchError);
      throw new Error(`Search failed: ${searchError.message}`);
    }

    // Enrich results with document metadata
    const enrichedResults: SearchResult[] = [];

    for (const result of searchResults || []) {
      let metadata: Record<string, any> = {};

      // Get document metadata based on table
      if (result.document_table === 'documents') {
        const { data: docData } = await supabase
          .from('documents')
          .select('title, file_info, owner_type, owner_id')
          .eq('id', result.document_id)
          .single();

        if (docData) {
          const fileInfo = docData.file_info || {};
          metadata = {
            title_en: docData.title,
            mime_type: fileInfo.mime_type,
            file_size: fileInfo.size,
            storage_path: fileInfo.storage_path,
            owner_type: docData.owner_type,
            owner_id: docData.owner_id,
          };
        }
      } else if (result.document_table === 'attachments') {
        const { data: attData } = await supabase
          .from('attachments')
          .select('file_name, mime_type, file_size, file_key')
          .eq('id', result.document_id)
          .single();

        if (attData) {
          metadata = {
            title_en: attData.file_name,
            mime_type: attData.mime_type,
            file_size: attData.file_size,
            storage_path: attData.file_key,
          };
        }
      }

      // Apply owner filters if specified
      if (searchParams.owner_type && metadata.owner_type !== searchParams.owner_type) {
        continue;
      }
      if (searchParams.owner_id && metadata.owner_id !== searchParams.owner_id) {
        continue;
      }

      enrichedResults.push({
        document_id: result.document_id,
        document_table: result.document_table,
        title: result.title || metadata.title_en || 'Untitled',
        title_ar: metadata.title_ar,
        snippet: result.snippet || '',
        rank_score: result.rank_score,
        ocr_confidence: result.ocr_confidence,
        language_detected: result.language_detected || [],
        mime_type: metadata.mime_type,
        file_size: metadata.file_size,
        storage_path: metadata.storage_path,
        created_at: result.created_at,
        owner_type: metadata.owner_type,
        owner_id: metadata.owner_id,
      });
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('document_text_content')
      .select('*', { count: 'exact', head: true })
      .eq('ocr_status', 'completed')
      .gte('ocr_confidence', minConfidence);

    const processingTime = Date.now() - startTime;

    const response: SearchResponse = {
      results: enrichedResults,
      total_count: totalCount || enrichedResults.length,
      query,
      language,
      processing_time_ms: processingTime,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Document search error:', error);

    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
