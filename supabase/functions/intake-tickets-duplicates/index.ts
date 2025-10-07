import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract ticket ID and threshold from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const ticketId = pathParts[pathParts.length - 2]; // /intake/tickets/{id}/duplicates
    const threshold = parseFloat(url.searchParams.get('threshold') || '0.65');

    if (!ticketId) {
      return new Response(
        JSON.stringify({ error: 'Ticket ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('intake_tickets')
      .select('id, title, title_ar, description, description_ar, request_type')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ error: 'Ticket not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get or generate embedding
    let embedding: number[] | null = null;
    const { data: existingEmbedding } = await supabase
      .from('ai_embeddings')
      .select('embedding')
      .eq('owner_type', 'ticket')
      .eq('owner_id', ticketId)
      .eq('model', Deno.env.get('EMBEDDING_MODEL') || 'bge-m3')
      .single();

    if (existingEmbedding && existingEmbedding.embedding) {
      embedding = existingEmbedding.embedding;
    } else {
      // Generate embedding
      try {
        const textToEmbed = [
          ticket.title,
          ticket.title_ar,
          ticket.description,
          ticket.description_ar,
          ticket.request_type,
        ]
          .filter(Boolean)
          .join(' | ');

        // Call AnythingLLM to generate embedding
        const anythingLLMUrl = Deno.env.get('ANYTHINGLLM_API_URL');
        const anythingLLMKey = Deno.env.get('ANYTHINGLLM_API_KEY');

        if (anythingLLMUrl && anythingLLMKey) {
          const embeddingResponse = await fetch(`${anythingLLMUrl}/api/embed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${anythingLLMKey}`,
            },
            body: JSON.stringify({
              text: textToEmbed,
              model: Deno.env.get('EMBEDDING_MODEL') || 'bge-m3',
            }),
          });

          if (embeddingResponse.ok) {
            const embeddingData = await embeddingResponse.json();
            embedding = embeddingData.embedding || null;

            // Store embedding
            if (embedding) {
              await supabase.from('ai_embeddings').insert({
                owner_type: 'ticket',
                owner_id: ticketId,
                embedding,
                model: Deno.env.get('EMBEDDING_MODEL') || 'bge-m3',
                model_version: '1.0',
                embedding_dim: embedding.length,
                created_at: new Date().toISOString(),
              });
            }
          }
        }
      } catch (error) {
        console.warn('Failed to generate embedding, using fallback', error);
      }
    }

    let candidates = [];
    let detectionMethod = 'vector';

    if (embedding) {
      // Use vector search
      const { data: vectorResults, error: vectorError } = await supabase.rpc(
        'search_duplicate_tickets',
        {
          p_embedding: embedding,
          p_exclude_ticket_id: ticketId,
          p_threshold: threshold,
          p_include_resolved: false,
          p_limit: 10,
        }
      );

      if (!vectorError && vectorResults) {
        candidates = vectorResults.map((row: any) => ({
          ticket_id: row.ticket_id,
          ticket_number: row.ticket_number,
          title: row.title,
          overall_score: row.similarity_score,
          title_similarity: row.title_similarity || row.similarity_score,
          content_similarity: row.similarity_score,
          is_high_confidence:
            row.similarity_score >= parseFloat(Deno.env.get('SIMILARITY_PRIMARY') || '0.82'),
        }));
      }
    }

    // Fallback to keyword search if no vector results
    if (candidates.length === 0) {
      detectionMethod = 'fallback';
      const { data: keywordResults } = await supabase.rpc('search_tickets_by_keywords', {
        p_keywords: ticket.title,
        p_exclude_ticket_id: ticketId,
        p_limit: 10,
      });

      if (keywordResults) {
        candidates = keywordResults.map((row: any) => ({
          ticket_id: row.ticket_id,
          ticket_number: row.ticket_number,
          title: row.title,
          overall_score: 0.5,
          title_similarity: 0.5,
          content_similarity: 0.5,
          is_high_confidence: false,
        }));
      }
    }

    // Return results
    return new Response(
      JSON.stringify({
        candidates,
        model_info: {
          embedding_model: Deno.env.get('EMBEDDING_MODEL') || 'bge-m3',
          threshold_used: threshold,
          detection_method: detectionMethod,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});