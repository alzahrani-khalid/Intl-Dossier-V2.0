/**
 * Supabase Edge Function: Unified Semantic Search
 * Feature: semantic-search-expansion
 * Description: Semantic search across all seven dossier types with unified ranking
 *              Supports natural language queries in English and Arabic
 *              Implements cross-entity result blending and hybrid search mode
 *
 * POST /semantic-search-unified - Execute unified semantic search
 *
 * Request Body:
 * {
 *   query: string,                    // Natural language search query (EN/AR)
 *   entity_types?: string[],          // Entity types to search (default: all)
 *   similarity_threshold?: number,    // Min similarity (0.0-1.0, default: 0.6)
 *   limit?: number,                   // Max results (default: 50)
 *   include_fulltext?: boolean,       // Include keyword matches (hybrid mode)
 *   language?: 'en' | 'ar' | 'auto',  // Query language for ranking
 *   dossier_types?: string[],         // Filter dossiers by type
 *   include_metadata?: boolean        // Include detailed metadata
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface SemanticSearchRequest {
  query: string;
  entity_types?: string[];
  similarity_threshold?: number;
  limit?: number;
  include_fulltext?: boolean;
  language?: 'en' | 'ar' | 'auto';
  dossier_types?: string[];
  include_metadata?: boolean;
}

interface SemanticSearchResult {
  entity_id: string;
  entity_title: string;
  entity_title_ar: string;
  description_en: string | null;
  description_ar: string | null;
  similarity_score: number;
  entity_type: string;
  entity_subtype: string | null;
  updated_at: string;
  metadata?: Record<string, unknown>;
  match_type: 'semantic' | 'fulltext' | 'hybrid';
  rank_position: number;
}

interface SearchResponse {
  data: SemanticSearchResult[];
  count: number;
  query: {
    original: string;
    detected_language: string;
    entity_types: string[];
    similarity_threshold: number;
  };
  performance: {
    embedding_ms: number;
    vector_search_ms: number;
    fulltext_search_ms?: number;
    total_ms: number;
  };
  embedding_info: {
    model: string;
    dimensions: number;
    generated: boolean;
  };
  warnings: string[];
}

// Valid entity types for semantic search
const VALID_ENTITY_TYPES = [
  'dossiers', // All dossier types combined
  'country', // Country dossiers only
  'organization', // Organization dossiers only
  'forum', // Forum dossiers only
  'theme', // Theme dossiers only
  'positions', // Position documents
  'documents', // Attachments
  'briefs', // AI-generated briefs
  'engagements', // Engagements
  'persons', // Staff profiles
  'external_contacts', // External contacts
  'working_groups', // Working groups
];

const DOSSIER_SUBTYPES = ['country', 'organization', 'forum', 'theme'];

// Initialize Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const anythingLLMUrl = Deno.env.get('ANYTHINGLLM_URL') ?? '';
const anythingLLMApiKey = Deno.env.get('ANYTHINGLLM_API_KEY') ?? '';

/**
 * Detect language of query text
 * Simple heuristic based on character ranges
 */
function detectLanguage(text: string): 'en' | 'ar' {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  const arabicChars = (text.match(arabicPattern) || []).length;
  const totalChars = text.replace(/\s/g, '').length;

  // If more than 30% Arabic characters, treat as Arabic
  return arabicChars / totalChars > 0.3 ? 'ar' : 'en';
}

/**
 * Generate embedding for query text using BGE-M3 or AnythingLLM fallback
 */
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  // Try AnythingLLM first (text-embedding-ada-002 compatible)
  if (anythingLLMUrl && anythingLLMApiKey) {
    try {
      const response = await fetch(`${anythingLLMUrl}/api/v1/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anythingLLMApiKey}`,
        },
        body: JSON.stringify({ text: query }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.embedding && Array.isArray(data.embedding)) {
          // Normalize embedding to 1536 dimensions if needed
          return normalizeEmbedding(data.embedding, 1536);
        }
      }
    } catch (error) {
      console.warn('AnythingLLM embedding failed:', error);
    }
  }

  // Return null if embedding generation fails
  // The function will fallback to full-text search
  return null;
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

/**
 * Perform semantic search using database function
 */
async function performSemanticSearch(
  supabase: ReturnType<typeof createClient>,
  embedding: number[],
  entityTypes: string[],
  similarityThreshold: number,
  limit: number,
  dossierTypes?: string[]
): Promise<SemanticSearchResult[]> {
  const results: SemanticSearchResult[] = [];

  // Determine which entity types to search
  let typesToSearch = entityTypes;

  // If dossier_types filter is provided, expand 'dossiers' to specific types
  if (dossierTypes && dossierTypes.length > 0) {
    typesToSearch = entityTypes.flatMap((type) => {
      if (type === 'dossiers') {
        return dossierTypes.filter((t) => DOSSIER_SUBTYPES.includes(t));
      }
      return type;
    });
  }

  // Search each entity type
  for (const entityType of typesToSearch) {
    try {
      const { data, error } = await supabase.rpc('search_entities_semantic', {
        p_entity_type: entityType,
        p_query_embedding: embedding,
        p_similarity_threshold: similarityThreshold,
        p_limit: Math.ceil(limit / typesToSearch.length) + 5, // Get extra for better blending
      });

      if (error) {
        console.warn(`Semantic search error for ${entityType}:`, error.message);
        continue;
      }

      if (data && data.length > 0) {
        results.push(
          ...data.map((row: Record<string, unknown>, index: number) => ({
            entity_id: row.entity_id as string,
            entity_title: row.entity_title as string,
            entity_title_ar: row.entity_title_ar as string,
            description_en: row.description_en as string | null,
            description_ar: row.description_ar as string | null,
            similarity_score: row.similarity_score as number,
            entity_type: row.entity_type as string,
            entity_subtype: row.entity_subtype as string | null,
            updated_at: row.updated_at as string,
            metadata: row.metadata as Record<string, unknown>,
            match_type: 'semantic' as const,
            rank_position: index + 1,
          }))
        );
      }
    } catch (error) {
      console.warn(`Error searching ${entityType}:`, error);
    }
  }

  return results;
}

/**
 * Perform full-text search for hybrid mode
 */
async function performFulltextSearch(
  supabase: ReturnType<typeof createClient>,
  query: string,
  entityTypes: string[],
  language: string,
  limit: number
): Promise<SemanticSearchResult[]> {
  const results: SemanticSearchResult[] = [];

  // Map entity types to full-text search types
  const fulltextTypeMap: Record<string, string> = {
    dossiers: 'dossiers',
    country: 'dossiers',
    organization: 'dossiers',
    forum: 'dossiers',
    theme: 'dossiers',
    positions: 'positions',
    documents: 'documents',
    engagements: 'engagements',
    persons: 'people',
    external_contacts: 'external_contacts',
  };

  const searchedTypes = new Set<string>();

  for (const entityType of entityTypes) {
    const fulltextType = fulltextTypeMap[entityType];
    if (!fulltextType || searchedTypes.has(fulltextType)) continue;
    searchedTypes.add(fulltextType);

    try {
      const { data, error } = await supabase.rpc('search_entities_fulltext', {
        p_entity_type: fulltextType,
        p_query: query,
        p_language: language === 'ar' ? 'arabic' : 'english',
        p_limit: Math.ceil(limit / entityTypes.length),
        p_offset: 0,
      });

      if (error) {
        console.warn(`Fulltext search error for ${fulltextType}:`, error.message);
        continue;
      }

      if (data && data.length > 0) {
        results.push(
          ...data.map((row: Record<string, unknown>, index: number) => ({
            entity_id: row.entity_id as string,
            entity_title: row.entity_title_en as string,
            entity_title_ar: row.entity_title_ar as string,
            description_en: row.entity_snippet_en as string | null,
            description_ar: row.entity_snippet_ar as string | null,
            similarity_score: (row.rank_score as number) / 100, // Normalize to 0-1
            entity_type: row.entity_type as string,
            entity_subtype: null,
            updated_at: row.updated_at as string,
            match_type: 'fulltext' as const,
            rank_position: index + 1,
          }))
        );
      }
    } catch (error) {
      console.warn(`Error in fulltext search for ${fulltextType}:`, error);
    }
  }

  return results;
}

/**
 * Blend and rank results from semantic and fulltext searches
 */
function blendResults(
  semanticResults: SemanticSearchResult[],
  fulltextResults: SemanticSearchResult[],
  limit: number
): SemanticSearchResult[] {
  // Create a map to deduplicate by entity_id
  const resultMap = new Map<string, SemanticSearchResult>();

  // Add semantic results first (higher priority)
  for (const result of semanticResults) {
    resultMap.set(result.entity_id, result);
  }

  // Add fulltext results, marking as hybrid if already exists
  for (const result of fulltextResults) {
    if (resultMap.has(result.entity_id)) {
      // Mark as hybrid match
      const existing = resultMap.get(result.entity_id)!;
      existing.match_type = 'hybrid';
      // Boost score for hybrid matches (found in both)
      existing.similarity_score = Math.min(1.0, existing.similarity_score * 1.1);
    } else {
      resultMap.set(result.entity_id, result);
    }
  }

  // Sort by similarity score and return limited results
  const blended = Array.from(resultMap.values())
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, limit);

  // Update rank positions
  blended.forEach((result, index) => {
    result.rank_position = index + 1;
  });

  return blended;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'method_not_allowed',
        message: 'Only POST method is allowed',
        message_ar: 'يُسمح فقط بأسلوب POST',
      }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const startTime = Date.now();
  const warnings: string[] = [];
  const performance = {
    embedding_ms: 0,
    vector_search_ms: 0,
    fulltext_search_ms: undefined as number | undefined,
    total_ms: 0,
  };

  try {
    // Get auth token
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

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Parse request
    const body: SemanticSearchRequest = await req.json();

    // Validate query
    if (!body.query || body.query.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'Query is required and cannot be empty',
          message_ar: 'الاستعلام مطلوب ولا يمكن أن يكون فارغاً',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const query = body.query.trim();
    const entityTypes = body.entity_types?.filter((t) => VALID_ENTITY_TYPES.includes(t)) || [
      'dossiers',
      'positions',
      'documents',
      'briefs',
      'engagements',
      'persons',
    ];
    const similarityThreshold = Math.min(1.0, Math.max(0.0, body.similarity_threshold ?? 0.6));
    const limit = Math.min(100, Math.max(1, body.limit ?? 50));
    const includeFulltext = body.include_fulltext ?? false;
    const detectedLanguage =
      body.language === 'auto' || !body.language ? detectLanguage(query) : body.language;

    // Validate entity types
    if (entityTypes.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: `Invalid entity_types. Valid types: ${VALID_ENTITY_TYPES.join(', ')}`,
          message_ar: 'أنواع كيانات غير صالحة',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 1: Generate query embedding
    const embeddingStartTime = Date.now();
    const queryEmbedding = await generateQueryEmbedding(query);
    performance.embedding_ms = Date.now() - embeddingStartTime;

    let semanticResults: SemanticSearchResult[] = [];
    let embeddingGenerated = false;

    // Step 2: Perform semantic search if embedding was generated
    if (queryEmbedding) {
      embeddingGenerated = true;
      const vectorStartTime = Date.now();
      semanticResults = await performSemanticSearch(
        supabase,
        queryEmbedding,
        entityTypes,
        similarityThreshold,
        limit,
        body.dossier_types
      );
      performance.vector_search_ms = Date.now() - vectorStartTime;
    } else {
      warnings.push('Embedding generation failed. Falling back to full-text search only.');
    }

    // Step 3: Perform full-text search if hybrid mode or embedding failed
    let fulltextResults: SemanticSearchResult[] = [];
    if (includeFulltext || !embeddingGenerated) {
      const fulltextStartTime = Date.now();
      fulltextResults = await performFulltextSearch(
        supabase,
        query,
        entityTypes,
        detectedLanguage,
        limit
      );
      performance.fulltext_search_ms = Date.now() - fulltextStartTime;
    }

    // Step 4: Blend results
    const finalResults =
      includeFulltext || !embeddingGenerated
        ? blendResults(semanticResults, fulltextResults, limit)
        : semanticResults.slice(0, limit).map((r, i) => ({ ...r, rank_position: i + 1 }));

    // Remove metadata if not requested
    if (!body.include_metadata) {
      finalResults.forEach((r) => delete r.metadata);
    }

    performance.total_ms = Date.now() - startTime;

    // Build response
    const response: SearchResponse = {
      data: finalResults,
      count: finalResults.length,
      query: {
        original: query,
        detected_language: detectedLanguage,
        entity_types: entityTypes,
        similarity_threshold: similarityThreshold,
      },
      performance,
      embedding_info: {
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        generated: embeddingGenerated,
      },
      warnings,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
