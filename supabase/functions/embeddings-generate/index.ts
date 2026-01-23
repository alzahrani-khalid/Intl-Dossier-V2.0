/**
 * Embeddings Generate Edge Function
 * Feature: ai-features-reenablement
 *
 * Dedicated microservice for generating embeddings using external AI providers.
 * Decouples embedding generation from main API to avoid Alpine/ONNX issues.
 *
 * Supported providers:
 * - OpenAI (text-embedding-3-small, text-embedding-ada-002)
 * - AnythingLLM (self-hosted fallback)
 *
 * Endpoints:
 * - POST /embeddings-generate - Generate embeddings for text(s)
 * - POST /embeddings-generate/batch - Process batch from queue
 * - GET /embeddings-generate/health - Health check
 */

import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient, validateJWT } from '../_shared/auth.ts';

// Types
interface EmbeddingRequest {
  text: string | string[];
  model?: 'text-embedding-3-small' | 'text-embedding-ada-002';
  dimensions?: number;
}

interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  dimensions: number;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
  provider: 'openai' | 'anythingllm' | 'fallback';
}

interface BatchProcessRequest {
  limit?: number;
  entity_types?: string[];
}

interface QueueItem {
  id: string;
  entity_type: string;
  entity_id: string;
  priority: number;
  retry_count: number;
  error_message?: string;
}

// OpenAI embedding generation
async function generateOpenAIEmbedding(
  texts: string[],
  model: string = 'text-embedding-3-small',
  dimensions?: number
): Promise<EmbeddingResponse> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const requestBody: Record<string, unknown> = {
    input: texts,
    model: model,
  };

  // Only text-embedding-3-small supports dimensions parameter
  if (dimensions && model === 'text-embedding-3-small') {
    requestBody.dimensions = dimensions;
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    embeddings: data.data.map((item: { embedding: number[] }) => item.embedding),
    model: data.model,
    dimensions: data.data[0]?.embedding?.length || 1536,
    usage: {
      prompt_tokens: data.usage.prompt_tokens,
      total_tokens: data.usage.total_tokens,
    },
    provider: 'openai',
  };
}

// AnythingLLM fallback
async function generateAnythingLLMEmbedding(texts: string[]): Promise<EmbeddingResponse> {
  const apiUrl = Deno.env.get('ANYTHINGLLM_URL');
  const apiKey = Deno.env.get('ANYTHINGLLM_API_KEY');

  if (!apiUrl) {
    throw new Error('AnythingLLM not configured');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${apiUrl}/v1/embeddings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      input: texts,
      model: 'text-embedding-ada-002',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AnythingLLM API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    embeddings: data.data.map((item: { embedding: number[] }) => item.embedding),
    model: data.model || 'anythingllm',
    dimensions: data.data[0]?.embedding?.length || 1536,
    usage: {
      prompt_tokens: data.usage?.prompt_tokens || 0,
      total_tokens: data.usage?.total_tokens || 0,
    },
    provider: 'anythingllm',
  };
}

// Generate embedding with provider fallback
async function generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
  const texts = Array.isArray(request.text) ? request.text : [request.text];
  const model = request.model || 'text-embedding-3-small';
  const dimensions = request.dimensions;

  // Try OpenAI first
  try {
    return await generateOpenAIEmbedding(texts, model, dimensions);
  } catch (openaiError) {
    console.warn('OpenAI embedding failed, trying AnythingLLM:', openaiError);
  }

  // Try AnythingLLM fallback
  try {
    return await generateAnythingLLMEmbedding(texts);
  } catch (anythingllmError) {
    console.error('All embedding providers failed:', anythingllmError);
    throw new Error('All embedding providers unavailable');
  }
}

// Process embedding queue batch
async function processQueueBatch(
  supabase: ReturnType<typeof createServiceClient>,
  limit: number = 50,
  entityTypes?: string[]
): Promise<{ processed: number; failed: number; errors: string[] }> {
  // Fetch items from queue
  let query = supabase
    .from('embedding_update_queue')
    .select('*')
    .is('processed_at', null)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (entityTypes && entityTypes.length > 0) {
    query = query.in('entity_type', entityTypes);
  }

  const { data: queueItems, error: fetchError } = await query;

  if (fetchError) {
    throw new Error(`Failed to fetch queue: ${fetchError.message}`);
  }

  if (!queueItems || queueItems.length === 0) {
    return { processed: 0, failed: 0, errors: [] };
  }

  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const item of queueItems as QueueItem[]) {
    try {
      // Fetch entity data
      const entityData = await fetchEntityData(supabase, item.entity_type, item.entity_id);

      if (!entityData) {
        throw new Error(`Entity not found: ${item.entity_type}/${item.entity_id}`);
      }

      // Generate embedding text
      const embeddingText = generateEmbeddingText(entityData, item.entity_type);

      if (!embeddingText || embeddingText.trim().length === 0) {
        throw new Error('No text available for embedding');
      }

      // Generate embedding
      const result = await generateEmbedding({ text: embeddingText });

      if (!result.embeddings[0]) {
        throw new Error('No embedding generated');
      }

      // Update entity with embedding
      await updateEntityEmbedding(supabase, item.entity_type, item.entity_id, result.embeddings[0]);

      // Remove from queue
      await supabase.from('embedding_update_queue').delete().eq('id', item.id);

      processed++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`${item.entity_type}/${item.entity_id}: ${errorMsg}`);

      // Update retry count
      const retryCount = item.retry_count + 1;
      const MAX_RETRIES = 5;

      if (retryCount >= MAX_RETRIES) {
        // Remove from queue after max retries
        await supabase.from('embedding_update_queue').delete().eq('id', item.id);
      } else {
        // Update with retry info
        await supabase
          .from('embedding_update_queue')
          .update({
            retry_count: retryCount,
            error_message: errorMsg,
          })
          .eq('id', item.id);
      }

      failed++;
    }
  }

  return { processed, failed, errors };
}

// Fetch entity data from appropriate table
async function fetchEntityData(
  supabase: ReturnType<typeof createServiceClient>,
  entityType: string,
  entityId: string
): Promise<Record<string, unknown> | null> {
  const tableMapping: Record<string, string> = {
    positions: 'positions',
    attachments: 'attachments',
    briefs: 'briefs',
    dossiers: 'dossiers',
    staff_profiles: 'staff_profiles',
    engagements: 'engagements',
    external_contacts: 'external_contacts',
  };

  const tableName = tableMapping[entityType];
  if (!tableName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  const { data, error } = await supabase.from(tableName).select('*').eq('id', entityId).single();

  if (error) {
    console.error(`Failed to fetch entity ${entityType}/${entityId}:`, error);
    return null;
  }

  return data;
}

// Generate text for embedding from entity data
function generateEmbeddingText(entityData: Record<string, unknown>, entityType: string): string {
  const parts: string[] = [];

  switch (entityType) {
    case 'positions':
      if (entityData.topic_en) parts.push(String(entityData.topic_en));
      if (entityData.topic_ar) parts.push(String(entityData.topic_ar));
      if (entityData.rationale_en) parts.push(String(entityData.rationale_en));
      if (entityData.rationale_ar) parts.push(String(entityData.rationale_ar));
      if (entityData.key_messages_en) parts.push(String(entityData.key_messages_en));
      if (entityData.key_messages_ar) parts.push(String(entityData.key_messages_ar));
      break;

    case 'attachments':
      if (entityData.file_name) parts.push(String(entityData.file_name));
      if (entityData.description_en) parts.push(String(entityData.description_en));
      if (entityData.description_ar) parts.push(String(entityData.description_ar));
      if (entityData.extracted_text_en) parts.push(String(entityData.extracted_text_en));
      if (entityData.extracted_text_ar) parts.push(String(entityData.extracted_text_ar));
      break;

    case 'briefs':
      if (entityData.title_en) parts.push(String(entityData.title_en));
      if (entityData.title_ar) parts.push(String(entityData.title_ar));
      if (entityData.summary_en) parts.push(String(entityData.summary_en));
      if (entityData.summary_ar) parts.push(String(entityData.summary_ar));
      if (entityData.content_en) parts.push(String(entityData.content_en));
      if (entityData.content_ar) parts.push(String(entityData.content_ar));
      break;

    case 'dossiers':
      if (entityData.name_en) parts.push(String(entityData.name_en));
      if (entityData.name_ar) parts.push(String(entityData.name_ar));
      if (entityData.description_en) parts.push(String(entityData.description_en));
      if (entityData.description_ar) parts.push(String(entityData.description_ar));
      break;

    case 'staff_profiles':
      if (entityData.full_name_en) parts.push(String(entityData.full_name_en));
      if (entityData.full_name_ar) parts.push(String(entityData.full_name_ar));
      if (entityData.bio_en) parts.push(String(entityData.bio_en));
      if (entityData.bio_ar) parts.push(String(entityData.bio_ar));
      if (entityData.expertise) parts.push(String(entityData.expertise));
      break;

    case 'engagements':
      if (entityData.title_en) parts.push(String(entityData.title_en));
      if (entityData.title_ar) parts.push(String(entityData.title_ar));
      if (entityData.description_en) parts.push(String(entityData.description_en));
      if (entityData.description_ar) parts.push(String(entityData.description_ar));
      if (entityData.objectives_en) parts.push(String(entityData.objectives_en));
      if (entityData.objectives_ar) parts.push(String(entityData.objectives_ar));
      break;

    case 'external_contacts':
      if (entityData.name_en) parts.push(String(entityData.name_en));
      if (entityData.name_ar) parts.push(String(entityData.name_ar));
      if (entityData.organization) parts.push(String(entityData.organization));
      if (entityData.position) parts.push(String(entityData.position));
      if (entityData.notes) parts.push(String(entityData.notes));
      break;

    default:
      // Generic extraction for any entity with common fields
      const textFields = ['title', 'name', 'description', 'content', 'summary', 'notes'];
      const suffixes = ['', '_en', '_ar'];

      for (const field of textFields) {
        for (const suffix of suffixes) {
          const key = field + suffix;
          if (entityData[key]) {
            parts.push(String(entityData[key]));
          }
        }
      }
  }

  // Limit to 8000 characters (API limit)
  return parts.join(' ').substring(0, 8000);
}

// Update entity table with embedding
async function updateEntityEmbedding(
  supabase: ReturnType<typeof createServiceClient>,
  entityType: string,
  entityId: string,
  embedding: number[]
): Promise<void> {
  const tableMapping: Record<string, string> = {
    positions: 'positions',
    attachments: 'attachments',
    briefs: 'briefs',
    dossiers: 'dossiers',
    staff_profiles: 'staff_profiles',
    engagements: 'engagements',
    external_contacts: 'external_contacts',
  };

  const tableName = tableMapping[entityType];
  if (!tableName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  const { error } = await supabase
    .from(tableName)
    .update({
      embedding: embedding,
      embedding_updated_at: new Date().toISOString(),
    })
    .eq('id', entityId);

  if (error) {
    throw new Error(`Failed to update embedding: ${error.message}`);
  }
}

// Check health of AI providers
async function checkProviderHealth(): Promise<{
  openai: { available: boolean; latency?: number; error?: string };
  anythingllm: { available: boolean; latency?: number; error?: string };
}> {
  const health = {
    openai: {
      available: false,
      latency: undefined as number | undefined,
      error: undefined as string | undefined,
    },
    anythingllm: {
      available: false,
      latency: undefined as number | undefined,
      error: undefined as string | undefined,
    },
  };

  // Check OpenAI
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (openaiKey) {
    const start = Date.now();
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${openaiKey}` },
      });
      health.openai.available = response.ok;
      health.openai.latency = Date.now() - start;
    } catch (error) {
      health.openai.error = error instanceof Error ? error.message : 'Unknown error';
    }
  } else {
    health.openai.error = 'API key not configured';
  }

  // Check AnythingLLM
  const anythingllmUrl = Deno.env.get('ANYTHINGLLM_URL');
  if (anythingllmUrl) {
    const start = Date.now();
    try {
      const response = await fetch(`${anythingllmUrl}/health`);
      health.anythingllm.available = response.ok;
      health.anythingllm.latency = Date.now() - start;
    } catch (error) {
      health.anythingllm.error = error instanceof Error ? error.message : 'Unknown error';
    }
  } else {
    health.anythingllm.error = 'URL not configured';
  }

  return health;
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/embeddings-generate', '');

  try {
    // Health check endpoint (no auth required)
    if (req.method === 'GET' && (path === '/health' || path === '')) {
      const health = await checkProviderHealth();
      const anyAvailable = health.openai.available || health.anythingllm.available;

      return new Response(
        JSON.stringify({
          status: anyAvailable ? 'healthy' : 'degraded',
          providers: health,
          timestamp: new Date().toISOString(),
        }),
        {
          status: anyAvailable ? 200 : 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // All other endpoints require authentication
    const authHeader = req.headers.get('Authorization');
    await validateJWT(authHeader);

    // Generate embeddings
    if (req.method === 'POST' && path === '') {
      const body: EmbeddingRequest = await req.json();

      if (!body.text || (Array.isArray(body.text) && body.text.length === 0)) {
        return new Response(JSON.stringify({ error: 'Text is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = await generateEmbedding(body);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process batch from queue
    if (req.method === 'POST' && path === '/batch') {
      const body: BatchProcessRequest = await req.json();
      const supabase = createServiceClient();

      const result = await processQueueBatch(supabase, body.limit || 50, body.entity_types);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Queue statistics
    if (req.method === 'GET' && path === '/queue/stats') {
      const supabase = createServiceClient();

      const { data: pending, error: pendingError } = await supabase
        .from('embedding_update_queue')
        .select('entity_type, retry_count')
        .is('processed_at', null);

      if (pendingError) {
        throw pendingError;
      }

      const stats = {
        total_pending: pending?.length || 0,
        by_entity_type: {} as Record<string, number>,
        failed: pending?.filter((item) => item.retry_count >= 3).length || 0,
        avg_retry_count:
          pending && pending.length > 0
            ? pending.reduce((sum, item) => sum + item.retry_count, 0) / pending.length
            : 0,
      };

      // Group by entity type
      for (const item of pending || []) {
        stats.by_entity_type[item.entity_type] = (stats.by_entity_type[item.entity_type] || 0) + 1;
      }

      return new Response(JSON.stringify(stats), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Embeddings generate error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('authorization') ? 401 : 500;

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
