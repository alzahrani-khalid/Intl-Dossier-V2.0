// Content Expiration Management Edge Function
// Feature: content-expiration-dates
// Handles expiration date management for dossiers, briefs, and positions

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface SetExpirationRequest {
  entity_type: 'dossier' | 'brief' | 'ai_brief' | 'position';
  entity_id: string;
  expires_at?: string; // ISO date string
  rule_id?: string;
}

interface ExtendExpirationRequest {
  entity_type: 'dossier' | 'brief' | 'ai_brief' | 'position';
  entity_id: string;
  extension_days: number;
  reason?: string;
}

interface MarkReviewedRequest {
  entity_type: 'dossier' | 'brief' | 'ai_brief' | 'position';
  entity_id: string;
  notes?: string;
}

interface GetExpiringRequest {
  entity_type?: 'dossier' | 'brief' | 'ai_brief' | 'position';
  days_ahead?: number;
  include_expired?: boolean;
  limit?: number;
}

interface RequestReviewRequest {
  entity_type: 'dossier' | 'brief' | 'ai_brief' | 'position';
  entity_id: string;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user from token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Route handling
    switch (req.method) {
      case 'GET':
        return handleGet(supabase, url, user.id);
      case 'POST':
        return handlePost(supabase, path, await req.json(), user.id);
      case 'PUT':
        return handlePut(supabase, path, await req.json(), user.id);
      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleGet(supabase: any, url: URL, userId: string) {
  const action = url.searchParams.get('action') || 'list';

  switch (action) {
    case 'list': {
      // Get expiring content
      const entityType = url.searchParams.get('entity_type') || null;
      const daysAhead = parseInt(url.searchParams.get('days_ahead') || '30', 10);
      const includeExpired = url.searchParams.get('include_expired') === 'true';
      const limit = parseInt(url.searchParams.get('limit') || '100', 10);

      const { data, error } = await supabase.rpc('get_expiring_content', {
        p_entity_type: entityType,
        p_days_ahead: daysAhead,
        p_include_expired: includeExpired,
        p_limit: limit,
      });

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    case 'stats': {
      // Get expiration statistics
      const forUser = url.searchParams.get('for_user') === 'true' ? userId : null;

      const { data, error } = await supabase.rpc('get_content_expiration_stats', {
        p_user_id: forUser,
      });

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    case 'status': {
      // Get expiration status for a specific entity
      const entityType = url.searchParams.get('entity_type');
      const entityId = url.searchParams.get('entity_id');

      if (!entityType || !entityId) {
        return new Response(JSON.stringify({ error: 'entity_type and entity_id are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('content_expiration_status')
        .select(
          `
          *,
          rule:content_expiration_rules(*)
        `
        )
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    case 'rules': {
      // Get all active expiration rules
      const entityType = url.searchParams.get('entity_type');

      let query = supabase
        .from('content_expiration_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    case 'history': {
      // Get expiration history for an entity
      const entityType = url.searchParams.get('entity_type');
      const entityId = url.searchParams.get('entity_id');
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);

      if (!entityType || !entityId) {
        return new Response(JSON.stringify({ error: 'entity_type and entity_id are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('content_expiration_history')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    default:
      return new Response(JSON.stringify({ error: 'Unknown action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
  }
}

async function handlePost(supabase: any, path: string | undefined, body: any, userId: string) {
  switch (path) {
    case 'set': {
      // Set expiration for content
      const { entity_type, entity_id, expires_at, rule_id } = body as SetExpirationRequest;

      if (!entity_type || !entity_id) {
        return new Response(JSON.stringify({ error: 'entity_type and entity_id are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase.rpc('set_content_expiration', {
        p_entity_type: entity_type,
        p_entity_id: entity_id,
        p_expires_at: expires_at || null,
        p_rule_id: rule_id || null,
        p_user_id: userId,
      });

      if (error) throw error;

      return new Response(JSON.stringify({ data: { status_id: data }, success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    case 'extend': {
      // Extend expiration
      const { entity_type, entity_id, extension_days, reason } = body as ExtendExpirationRequest;

      if (!entity_type || !entity_id || !extension_days) {
        return new Response(
          JSON.stringify({ error: 'entity_type, entity_id, and extension_days are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase.rpc('extend_content_expiration', {
        p_entity_type: entity_type,
        p_entity_id: entity_id,
        p_extension_days: extension_days,
        p_reason: reason || null,
        p_user_id: userId,
      });

      if (error) throw error;

      return new Response(JSON.stringify({ data: { success: data }, success: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    case 'review': {
      // Mark as reviewed
      const { entity_type, entity_id, notes } = body as MarkReviewedRequest;

      if (!entity_type || !entity_id) {
        return new Response(JSON.stringify({ error: 'entity_type and entity_id are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase.rpc('mark_content_reviewed', {
        p_entity_type: entity_type,
        p_entity_id: entity_id,
        p_notes: notes || null,
        p_user_id: userId,
      });

      if (error) throw error;

      return new Response(JSON.stringify({ data: { success: data }, success: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    case 'request-review': {
      // Request a review from content owners
      const { entity_type, entity_id, message } = body as RequestReviewRequest;

      if (!entity_type || !entity_id) {
        return new Response(JSON.stringify({ error: 'entity_type and entity_id are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update the expiration status with review request info
      const { error: updateError } = await supabase
        .from('content_expiration_status')
        .update({
          review_requested_by: userId,
          review_requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('entity_type', entity_type)
        .eq('entity_id', entity_id);

      if (updateError) throw updateError;

      // Log the review request
      const { error: historyError } = await supabase.from('content_expiration_history').insert({
        entity_type,
        entity_id,
        event_type: 'reviewed',
        performed_by: userId,
        notes: message || 'Review requested',
        metadata: { request_type: 'review_request' },
      });

      if (historyError) throw historyError;

      // Get dossier owners to notify
      let ownerIds: string[] = [];
      if (entity_type === 'dossier') {
        const { data: owners } = await supabase
          .from('dossier_owners')
          .select('user_id')
          .eq('dossier_id', entity_id);

        ownerIds = owners?.map((o: any) => o.user_id) || [];
      } else if (entity_type === 'brief') {
        const { data: brief } = await supabase
          .from('briefs')
          .select('dossier_id')
          .eq('id', entity_id)
          .single();

        if (brief) {
          const { data: owners } = await supabase
            .from('dossier_owners')
            .select('user_id')
            .eq('dossier_id', brief.dossier_id);

          ownerIds = owners?.map((o: any) => o.user_id) || [];
        }
      }

      // Create notifications for owners
      if (ownerIds.length > 0) {
        const notifications = ownerIds.map((ownerId) => ({
          user_id: ownerId,
          title_en: 'Content Review Requested',
          title_ar: 'طلب مراجعة المحتوى',
          message_en: message || 'A review has been requested for content you own.',
          message_ar: message || 'تم طلب مراجعة للمحتوى الذي تملكه.',
          category: 'workflow',
          source_type: entity_type,
          source_id: entity_id,
          created_at: new Date().toISOString(),
        }));

        await supabase.from('notifications').insert(notifications);
      }

      return new Response(JSON.stringify({ success: true, notified_owners: ownerIds.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    case 'process': {
      // Process expiration updates (admin/scheduled job)
      const { data, error } = await supabase.rpc('update_content_freshness_statuses');

      if (error) throw error;

      // Send notifications for newly expired content
      if (data && data.length > 0) {
        const result = data[0];

        // Get content that just expired to send notifications
        if (
          result.expired_count > 0 ||
          result.critical_sent_count > 0 ||
          result.warning_sent_count > 0
        ) {
          // Get expiring content and send notifications
          const { data: expiringContent } = await supabase.rpc('get_expiring_content', {
            p_entity_type: null,
            p_days_ahead: 30,
            p_include_expired: true,
            p_limit: 100,
          });

          // Create notifications for content owners
          if (expiringContent) {
            const notifications: any[] = [];

            for (const content of expiringContent) {
              if (content.owner_ids && content.owner_ids.length > 0) {
                const isExpired = content.days_until_expiration <= 0;
                const isCritical = content.days_until_expiration <= 7;

                for (const ownerId of content.owner_ids) {
                  notifications.push({
                    user_id: ownerId,
                    title_en: isExpired
                      ? `Content Expired: ${content.entity_name_en}`
                      : `Content Expiring Soon: ${content.entity_name_en}`,
                    title_ar: isExpired
                      ? `انتهت صلاحية المحتوى: ${content.entity_name_ar}`
                      : `ينتهي المحتوى قريبا: ${content.entity_name_ar}`,
                    message_en: isExpired
                      ? `The ${content.entity_type} "${content.entity_name_en}" has expired and requires review.`
                      : `The ${content.entity_type} "${content.entity_name_en}" expires in ${content.days_until_expiration} days.`,
                    message_ar: isExpired
                      ? `${content.entity_type} "${content.entity_name_ar}" انتهت صلاحيته ويحتاج مراجعة.`
                      : `${content.entity_type} "${content.entity_name_ar}" ينتهي خلال ${content.days_until_expiration} أيام.`,
                    category: 'deadlines',
                    priority: isExpired ? 'urgent' : isCritical ? 'high' : 'normal',
                    source_type: content.entity_type,
                    source_id: content.entity_id,
                    created_at: new Date().toISOString(),
                  });
                }
              }
            }

            if (notifications.length > 0) {
              await supabase.from('notifications').insert(notifications);
            }
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            updated_count: result.updated_count,
            warning_sent_count: result.warning_sent_count,
            critical_sent_count: result.critical_sent_count,
            expired_count: result.expired_count,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ success: true, updated_count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    default:
      return new Response(JSON.stringify({ error: 'Unknown endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
  }
}

async function handlePut(supabase: any, path: string | undefined, body: any, userId: string) {
  switch (path) {
    case 'rule': {
      // Update an expiration rule (admin only)
      const { id, ...updates } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: 'Rule id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('content_expiration_rules')
        .update({
          ...updates,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ data, success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    default:
      return new Response(JSON.stringify({ error: 'Unknown endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
  }
}
