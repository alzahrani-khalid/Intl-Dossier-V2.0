// Content Expiration Processor - Scheduled Edge Function
// Feature: content-expiration-dates
// Runs on schedule to update freshness statuses and send notifications
// Schedule: Every hour (configured via cron job or pg_cron)

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ProcessingResult {
  success: boolean;
  updated_count: number;
  warning_sent_count: number;
  critical_sent_count: number;
  expired_count: number;
  notifications_created: number;
  errors: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests (for scheduled invocation)
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST for scheduled invocation.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();
  const result: ProcessingResult = {
    success: false,
    updated_count: 0,
    warning_sent_count: 0,
    critical_sent_count: 0,
    expired_count: 0,
    notifications_created: 0,
    errors: [],
  };

  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting content expiration processing...');

    // Step 1: Update freshness statuses based on expiration dates
    const { data: statusData, error: statusError } = await supabase.rpc(
      'update_content_freshness_statuses'
    );

    if (statusError) {
      result.errors.push(`Status update failed: ${statusError.message}`);
      console.error('Status update error:', statusError);
    } else if (statusData && statusData.length > 0) {
      const stats = statusData[0];
      result.updated_count = stats.updated_count || 0;
      result.warning_sent_count = stats.warning_sent_count || 0;
      result.critical_sent_count = stats.critical_sent_count || 0;
      result.expired_count = stats.expired_count || 0;
      console.log('Status update results:', stats);
    }

    // Step 2: Get content needing notifications
    const { data: expiringContent, error: expiringError } = await supabase.rpc(
      'get_expiring_content',
      {
        p_entity_type: null,
        p_days_ahead: 30,
        p_include_expired: true,
        p_limit: 500,
      }
    );

    if (expiringError) {
      result.errors.push(`Expiring content fetch failed: ${expiringError.message}`);
      console.error('Expiring content error:', expiringError);
    }

    // Step 3: Create notifications for expiring content
    if (expiringContent && expiringContent.length > 0) {
      const notifications: any[] = [];
      const now = new Date();

      for (const content of expiringContent) {
        // Skip if no owner IDs
        if (!content.owner_ids || content.owner_ids.length === 0) {
          continue;
        }

        const expiresAt = new Date(content.expires_at);
        const isExpired = expiresAt <= now;
        const isCritical = content.days_until_expiration <= 7;

        // Check if notification already sent today for this content
        const { data: existingNotifs } = await supabase
          .from('notifications')
          .select('id')
          .eq('source_type', content.entity_type)
          .eq('source_id', content.entity_id)
          .gte('created_at', new Date(now.setHours(0, 0, 0, 0)).toISOString())
          .limit(1);

        if (existingNotifs && existingNotifs.length > 0) {
          continue; // Skip if notification already sent today
        }

        // Determine notification category and priority
        const category = 'deadlines';
        const priority = isExpired ? 'urgent' : isCritical ? 'high' : 'normal';

        // Create notifications for each owner
        for (const ownerId of content.owner_ids) {
          if (isExpired) {
            notifications.push({
              user_id: ownerId,
              title_en: `Content Expired: ${content.entity_name_en}`,
              title_ar: `انتهت صلاحية المحتوى: ${content.entity_name_ar}`,
              message_en: `The ${content.entity_type} "${content.entity_name_en}" has expired and requires immediate review.`,
              message_ar: `${content.entity_type} "${content.entity_name_ar}" انتهت صلاحيته ويتطلب مراجعة فورية.`,
              category,
              priority,
              source_type: content.entity_type,
              source_id: content.entity_id,
              created_at: new Date().toISOString(),
            });
          } else if (isCritical && !content.critical_warning_sent) {
            notifications.push({
              user_id: ownerId,
              title_en: `Critical: ${content.entity_name_en} expires in ${content.days_until_expiration} days`,
              title_ar: `حرج: ${content.entity_name_ar} ينتهي خلال ${content.days_until_expiration} أيام`,
              message_en: `The ${content.entity_type} "${content.entity_name_en}" will expire in ${content.days_until_expiration} days. Immediate action required.`,
              message_ar: `${content.entity_type} "${content.entity_name_ar}" سينتهي خلال ${content.days_until_expiration} أيام. مطلوب إجراء فوري.`,
              category,
              priority,
              source_type: content.entity_type,
              source_id: content.entity_id,
              created_at: new Date().toISOString(),
            });
          } else if (!content.warning_sent && content.days_until_expiration <= 30) {
            notifications.push({
              user_id: ownerId,
              title_en: `Content Expiring Soon: ${content.entity_name_en}`,
              title_ar: `ينتهي المحتوى قريبا: ${content.entity_name_ar}`,
              message_en: `The ${content.entity_type} "${content.entity_name_en}" will expire in ${content.days_until_expiration} days. Please review.`,
              message_ar: `${content.entity_type} "${content.entity_name_ar}" سينتهي خلال ${content.days_until_expiration} أيام. يرجى المراجعة.`,
              category,
              priority: 'normal',
              source_type: content.entity_type,
              source_id: content.entity_id,
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      // Batch insert notifications
      if (notifications.length > 0) {
        const { error: notifError } = await supabase.from('notifications').insert(notifications);

        if (notifError) {
          result.errors.push(`Notification insert failed: ${notifError.message}`);
          console.error('Notification insert error:', notifError);
        } else {
          result.notifications_created = notifications.length;
          console.log(`Created ${notifications.length} notifications`);
        }
      }
    }

    // Step 4: Check for workflow triggers (if workflow automation is enabled)
    // This would trigger any "content_expiring" or "content_expired" workflow rules
    await triggerExpirationWorkflows(supabase, expiringContent || []);

    // Step 5: Auto-refresh AI briefs if configured
    await autoRefreshBriefs(supabase);

    result.success = result.errors.length === 0;

    const duration = Date.now() - startTime;
    console.log(`Content expiration processing completed in ${duration}ms`, result);

    return new Response(
      JSON.stringify({
        ...result,
        duration_ms: duration,
        processed_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Processing error:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');

    return new Response(
      JSON.stringify({
        ...result,
        success: false,
        processed_at: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Trigger workflows for expiring content
async function triggerExpirationWorkflows(supabase: any, expiringContent: any[]) {
  try {
    // Find active workflow rules for content expiration triggers
    const { data: rules } = await supabase
      .from('workflow_rules')
      .select('*')
      .in('trigger_type', ['content_expiring', 'content_expired'])
      .eq('is_active', true)
      .is('deleted_at', null);

    if (!rules || rules.length === 0) {
      return;
    }

    console.log(`Found ${rules.length} content expiration workflow rules`);

    // For each expiring content, check if any workflow rules match
    for (const content of expiringContent) {
      for (const rule of rules) {
        // Check if rule applies to this entity type
        if (rule.entity_type !== content.entity_type) {
          continue;
        }

        // Determine if this is an expiring or expired trigger
        const isExpired = content.days_until_expiration <= 0;
        const matchesTrigger =
          (rule.trigger_type === 'content_expired' && isExpired) ||
          (rule.trigger_type === 'content_expiring' && !isExpired);

        if (!matchesTrigger) {
          continue;
        }

        // Queue the workflow execution
        await supabase.rpc('queue_workflow_execution', {
          p_rule_id: rule.id,
          p_entity_type: content.entity_type,
          p_entity_id: content.entity_id,
          p_trigger_context: {
            trigger_type: rule.trigger_type,
            days_until_expiration: content.days_until_expiration,
            expires_at: content.expires_at,
            freshness_status: content.freshness_status,
          },
        });
      }
    }
  } catch (error) {
    console.error('Workflow trigger error:', error);
  }
}

// Auto-refresh AI briefs for expired content
async function autoRefreshBriefs(supabase: any) {
  try {
    // Find rules that have auto_refresh_briefs enabled
    const { data: rules } = await supabase
      .from('content_expiration_rules')
      .select('*')
      .eq('is_active', true)
      .eq('auto_refresh_briefs', true);

    if (!rules || rules.length === 0) {
      return;
    }

    // Get expired content with auto-refresh enabled
    const { data: expiredContent } = await supabase
      .from('content_expiration_status')
      .select(
        `
        *,
        rule:content_expiration_rules!inner(auto_refresh_briefs)
      `
      )
      .eq('freshness_status', 'outdated')
      .eq('refresh_in_progress', false)
      .is('last_refresh_triggered_at', null)
      .limit(10); // Process in batches

    if (!expiredContent || expiredContent.length === 0) {
      return;
    }

    console.log(`Auto-refreshing ${expiredContent.length} AI briefs`);

    // For each expired brief, trigger regeneration
    for (const content of expiredContent) {
      if (content.entity_type === 'ai_brief') {
        // Mark as refreshing
        await supabase
          .from('content_expiration_status')
          .update({
            refresh_in_progress: true,
            last_refresh_triggered_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', content.id);

        // Get the original brief details
        const { data: brief } = await supabase
          .from('ai_briefs')
          .select('*')
          .eq('id', content.entity_id)
          .single();

        if (brief && brief.dossier_id) {
          // Trigger brief regeneration via the brief generation edge function
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/dossiers-briefs-generate`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                dossier_id: brief.dossier_id,
                refresh_existing_brief_id: content.entity_id,
              }),
            });

            console.log(`Triggered brief refresh for ${content.entity_id}`);
          } catch (error) {
            console.error(`Failed to trigger brief refresh for ${content.entity_id}:`, error);

            // Reset refresh flag on error
            await supabase
              .from('content_expiration_status')
              .update({
                refresh_in_progress: false,
                updated_at: new Date().toISOString(),
              })
              .eq('id', content.id);
          }
        }
      }
    }
  } catch (error) {
    console.error('Auto-refresh error:', error);
  }
}
