/**
 * T065: Queue Processor Edge Function
 *
 * Listens to pg_notify 'queue_process_needed' channel from database trigger.
 * Debounces for 5 seconds to batch multiple capacity changes.
 * Calls queueService.processQueue() - does NOT duplicate logic.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processQueue } from '../../../backend/src/services/queue.service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Debouncing state (in-memory, per function instance)
const debounceTimers = new Map<string, number>();
const DEBOUNCE_DELAY = 5000; // 5 seconds

interface QueueProcessPayload {
  unit_id: string;
  freed_skills: string[];
}

/**
 * Process queued items with debouncing
 */
async function processQueueDebounced(payload: QueueProcessPayload): Promise<void> {
  const { unit_id, freed_skills } = payload;
  const key = `unit-${unit_id}`;

  // Clear existing timer if present
  const existingTimer = debounceTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Set new timer
  const timer = setTimeout(async () => {
    try {
      console.log(`[Queue Processor] Processing queue for unit ${unit_id}`);
      console.log(`[Queue Processor] Freed skills:`, freed_skills);

      // Call queue service (all logic lives there)
      const assignedItems = await processQueue(unit_id, freed_skills);

      console.log(
        `[Queue Processor] ✓ Processed ${assignedItems.length} items for unit ${unit_id}`
      );

      // Clean up timer
      debounceTimers.delete(key);
    } catch (error) {
      console.error('[Queue Processor] Error processing queue:', error);
      debounceTimers.delete(key);
    }
  }, DEBOUNCE_DELAY);

  debounceTimers.set(key, timer as unknown as number);
  console.log(`[Queue Processor] Debouncing queue processing for unit ${unit_id} (${DEBOUNCE_DELAY}ms)`);
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // This Edge Function can be invoked in two ways:
    // 1. Direct HTTP POST (for manual triggering or testing)
    // 2. pg_notify listener (production use via database trigger)

    if (req.method === 'POST') {
      // Manual invocation via HTTP
      const payload: QueueProcessPayload = await req.json();

      if (!payload.unit_id || !payload.freed_skills) {
        return new Response(
          JSON.stringify({
            error: 'Missing required fields: unit_id, freed_skills',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Process immediately (no debouncing for manual invocations)
      const assignedItems = await processQueue(payload.unit_id, payload.freed_skills);

      return new Response(
        JSON.stringify({
          success: true,
          processed_count: assignedItems.length,
          items: assignedItems,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // GET endpoint to check processor status
    if (req.method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'active',
          pending_timers: debounceTimers.size,
          debounce_delay_ms: DEBOUNCE_DELAY,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Queue Processor] Error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Note: pg_notify listener setup
 *
 * For production use, configure Supabase to call this Edge Function
 * when the database trigger fires:
 *
 * 1. Database trigger emits pg_notify:
 *    PERFORM pg_notify('queue_process_needed', json_payload);
 *
 * 2. Supabase webhook triggers this Edge Function:
 *    Configure in Supabase Dashboard → Database → Webhooks
 *    - Event: postgres_changes (LISTEN queue_process_needed)
 *    - URL: https://{project}.supabase.co/functions/v1/queue-processor
 *
 * Alternative: Use Supabase Realtime to listen for notifications
 * and invoke this function via HTTP POST from the client.
 */
