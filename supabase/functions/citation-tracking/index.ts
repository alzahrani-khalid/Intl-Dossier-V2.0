/**
 * Citation Tracking Edge Function
 * Feature: citation-tracking
 *
 * Provides REST API for managing citations between dossiers, briefs,
 * documents, and external sources.
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

// URL patterns for auto-detection
const URL_PATTERN = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
const DOI_PATTERN = /10\.\d{4,}\/[^\s]+/gi;

interface CitationInput {
  citing_entity_type: string;
  citing_entity_id: string;
  cited_entity_type: string;
  cited_entity_id?: string;
  external_url?: string;
  external_title?: string;
  external_author?: string;
  external_publication_date?: string;
  citation_context?: string;
  citation_note?: string;
  relevance_score?: number;
  detection_method?: string;
  organization_id?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const functionName =
      pathParts[pathParts.length - 1] === 'citation-tracking'
        ? null
        : pathParts[pathParts.length - 1];

    // Route handling
    if (req.method === 'GET') {
      // GET /citation-tracking - List all citations
      if (!functionName) {
        const { data, error } = await supabase
          .from('entity_citations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        return new Response(JSON.stringify({ citations: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET /citation-tracking/entity/:type/:id - Get citations for an entity
      if (functionName === 'entity') {
        const entityType = pathParts[pathParts.length - 2];
        const entityId = url.searchParams.get('id') || pathParts[pathParts.length - 1];
        const direction = url.searchParams.get('direction') || 'both';

        const { data, error } = await supabase.rpc('get_entity_citations', {
          p_entity_type: entityType,
          p_entity_id: entityId,
          p_direction: direction,
          p_include_external: true,
          p_limit: 50,
        });

        if (error) throw error;

        return new Response(JSON.stringify({ citations: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET /citation-tracking/network/:type/:id - Get citation network graph
      if (functionName === 'network') {
        const entityType = pathParts[pathParts.length - 2];
        const entityId = url.searchParams.get('id') || pathParts[pathParts.length - 1];
        const depth = parseInt(url.searchParams.get('depth') || '2');

        const { data, error } = await supabase.rpc('get_citation_network_graph', {
          p_start_entity_type: entityType,
          p_start_entity_id: entityId,
          p_depth: depth,
          p_max_nodes: 50,
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET /citation-tracking/alerts - Get unresolved alerts
      if (functionName === 'alerts') {
        const { data, error } = await supabase
          .from('citation_alerts')
          .select('*, entity_citations(*)')
          .eq('is_resolved', false)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ alerts: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET /citation-tracking/:id - Get single citation
      const { data, error } = await supabase
        .from('entity_citations')
        .select('*')
        .eq('id', functionName)
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();

      // POST /citation-tracking/detect - Auto-detect citations in text
      if (functionName === 'detect') {
        const { text, citing_entity_type, citing_entity_id } = body;
        const detectedUrls: string[] = [];

        // Find URLs
        const urlMatches = text.match(URL_PATTERN) || [];
        detectedUrls.push(...urlMatches);

        // Find DOIs
        const doiMatches = text.match(DOI_PATTERN) || [];
        detectedUrls.push(...doiMatches.map((doi: string) => `https://doi.org/${doi}`));

        // Return detected citations (caller can choose to create them)
        return new Response(
          JSON.stringify({
            detected: detectedUrls.map((url: string) => ({
              external_url: url,
              citing_entity_type,
              citing_entity_id,
              cited_entity_type: 'external_url',
              detection_method: 'auto_link',
            })),
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // POST /citation-tracking - Create new citation
      const input: CitationInput = body;

      const { data, error } = await supabase
        .from('entity_citations')
        .insert({
          organization_id: input.organization_id,
          citing_entity_type: input.citing_entity_type,
          citing_entity_id: input.citing_entity_id,
          cited_entity_type: input.cited_entity_type,
          cited_entity_id: input.cited_entity_id,
          external_url: input.external_url,
          external_title: input.external_title,
          external_author: input.external_author,
          external_publication_date: input.external_publication_date,
          citation_context: input.citation_context,
          citation_note: input.citation_note,
          relevance_score: input.relevance_score,
          detection_method: input.detection_method || 'manual',
          created_by: user.id,
          cited_version_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PATCH') {
      const citationId = functionName;
      const body = await req.json();

      // PATCH /citation-tracking/alerts/:id/resolve - Resolve an alert
      if (pathParts.includes('alerts') && body.action === 'resolve') {
        const { data, error } = await supabase
          .from('citation_alerts')
          .update({
            is_resolved: true,
            resolved_by: user.id,
            resolved_at: new Date().toISOString(),
            resolution_note: body.resolution_note,
          })
          .eq('id', citationId)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // PATCH /citation-tracking/:id - Update citation
      const { data, error } = await supabase
        .from('entity_citations')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', citationId)
        .eq('created_by', user.id) // Only allow updating own citations
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'DELETE') {
      const citationId = functionName;

      const { error } = await supabase
        .from('entity_citations')
        .delete()
        .eq('id', citationId)
        .eq('created_by', user.id); // Only allow deleting own citations

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Citation tracking error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
