import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

// Simple circuit breaker implementation
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly threshold = 3;
  private readonly timeout = 30000; // 30 seconds

  async execute<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<{ result: T; usedFallback: boolean }> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        console.log('Circuit breaker OPEN, using fallback');
        return { result: await fallback(), usedFallback: true };
      }
    }

    try {
      const result = await fn();
      if (this.state === 'half-open') {
        this.reset();
      }
      return { result, usedFallback: false };
    } catch (error) {
      this.recordFailure();
      console.warn('AI service failed, using fallback:', error);
      return { result: await fallback(), usedFallback: true };
    }
  }

  private recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      console.warn(`Circuit breaker opened after ${this.failureCount} failures`);
    }
  }

  private reset() {
    this.failureCount = 0;
    this.state = 'closed';
    console.log('Circuit breaker reset to closed state');
  }
}

const circuitBreaker = new CircuitBreaker();

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get engagement ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const engagementId = pathParts[pathParts.indexOf('engagements') + 1];

    if (!engagementId) {
      return new Response(
        JSON.stringify({ error: 'Engagement ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get query parameters
    const minRelevance = parseFloat(url.searchParams.get('min_relevance') || '0.7');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Create Supabase client with user's auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify engagement exists and user has access
    const { data: engagement, error: engagementError } = await supabaseClient
      .from('engagements')
      .select('id, title, description, stakeholders, dossier_id')
      .eq('id', engagementId)
      .single();

    if (engagementError || !engagement) {
      return new Response(
        JSON.stringify({ error: 'Engagement not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // AI-powered suggestion function
    const aiSuggestions = async () => {
      // Generate engagement embedding from context
      const embeddingText = [
        engagement.title,
        engagement.description,
        ...(engagement.stakeholders || [])
      ].filter(Boolean).join(' ');

      // Call AnythingLLM for embedding
      const anythingLLMUrl = Deno.env.get('ANYTHINGLLM_URL');
      const anythingLLMKey = Deno.env.get('ANYTHINGLLM_API_KEY');

      if (!anythingLLMUrl || !anythingLLMKey) {
        throw new Error('AnythingLLM not configured');
      }

      const embeddingResponse = await fetch(`${anythingLLMUrl}/api/v1/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anythingLLMKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: embeddingText }),
      });

      if (!embeddingResponse.ok) {
        throw new Error('Failed to generate embedding');
      }

      const { embedding } = await embeddingResponse.json();

      // Call pgvector similarity search
      const { data: matches, error: matchError } = await supabaseClient
        .rpc('match_positions', {
          query_embedding: embedding,
          match_threshold: minRelevance,
          match_count: limit,
        });

      if (matchError) {
        throw new Error(`Similarity search failed: ${matchError.message}`);
      }

      return matches || [];
    };

    // Keyword fallback function
    const keywordFallback = async () => {
      console.log('Using keyword fallback for suggestions');

      // Extract keywords from engagement
      const keywords = [
        engagement.title,
        engagement.description
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3); // Filter short words

      // Simple keyword search across positions
      const { data: positions, error: searchError } = await supabaseClient
        .from('positions')
        .select('id, title, type, relevance_score:id')
        .eq('dossier_id', engagement.dossier_id)
        .or(keywords.map(k => `title.ilike.%${k}%,content.ilike.%${k}%`).join(','))
        .limit(limit);

      if (searchError) {
        console.error('Keyword search error:', searchError);
        return [];
      }

      // Calculate simple relevance score based on keyword matches
      return (positions || []).map((pos: any) => ({
        position_id: pos.id,
        relevance_score: 0.5, // Fixed score for keyword matches
        position_title: pos.title,
        position_type: pos.type,
      }));
    };

    // Execute with circuit breaker
    const { result: suggestions, usedFallback } = await circuitBreaker.execute(
      aiSuggestions,
      keywordFallback
    );

    // Save suggestions to database
    if (suggestions.length > 0) {
      const suggestionRecords = suggestions.map((s: any) => ({
        engagement_id: engagementId,
        position_id: s.position_id,
        relevance_score: s.relevance_score,
        suggestion_reasoning: {
          method: usedFallback ? 'keyword' : 'ai_vector',
          keywords: usedFallback ? [engagement.title] : undefined,
        },
      }));

      await supabaseClient.from('position_suggestions').insert(suggestionRecords);
    }

    return new Response(
      JSON.stringify({
        suggestions,
        fallback_mode: usedFallback,
        total: suggestions.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
