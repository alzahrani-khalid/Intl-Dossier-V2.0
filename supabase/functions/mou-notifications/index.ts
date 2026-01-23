// MoU Notifications Edge Function
// Handles MoU notification preferences, queue processing, and scheduled checks
// Feature: mou-notification-hooks

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Types
interface MouNotificationPreferences {
  mou_notifications_enabled: boolean;
  deliverable_due_soon_enabled: boolean;
  deliverable_due_soon_days: number[];
  deliverable_overdue_enabled: boolean;
  deliverable_completed_enabled: boolean;
  milestone_completed_enabled: boolean;
  expiration_warning_enabled: boolean;
  expiration_warning_days: number[];
  mou_expired_enabled: boolean;
  renewal_initiated_enabled: boolean;
  renewal_approved_enabled: boolean;
  renewal_completed_enabled: boolean;
  workflow_state_change_enabled: boolean;
  health_score_drop_enabled: boolean;
  health_score_drop_threshold: number;
  assignment_change_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  batch_notifications: boolean;
  batch_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  batch_delivery_time: string;
  batch_delivery_day: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

interface QueuedNotification {
  id: string;
  user_id: string;
  notification_type: string;
  mou_id: string | null;
  deliverable_id: string | null;
  title_en: string;
  title_ar: string;
  message_en: string;
  message_ar: string;
  data: Record<string, unknown>;
  priority: string;
  action_url: string | null;
  status: string;
  scheduled_for: string;
}

interface NotificationSummary {
  pending_notifications: number;
  unread_notifications: number;
  notifications_today: number;
  notifications_this_week: number;
  deliverables_due_soon: number;
  overdue_deliverables: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean).pop() || '';

    // Service-level endpoints (no auth required for scheduled jobs)
    if (path === 'process-queue' && req.method === 'POST') {
      return await processNotificationQueue();
    }

    if (path === 'check-due-dates' && req.method === 'POST') {
      return await checkDeliverableDueDates();
    }

    // User-level endpoints (auth required)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route based on path and method
    switch (path) {
      case 'preferences':
        if (req.method === 'GET') {
          return await getPreferences(supabaseClient, user.id);
        } else if (req.method === 'PATCH' || req.method === 'PUT') {
          const body = await req.json();
          return await updatePreferences(supabaseClient, user.id, body);
        }
        break;

      case 'summary':
        if (req.method === 'GET') {
          return await getNotificationSummary(supabaseClient, user.id);
        }
        break;

      case 'queue':
        if (req.method === 'GET') {
          return await getQueuedNotifications(supabaseClient, user.id, url.searchParams);
        }
        break;

      case 'history':
        if (req.method === 'GET') {
          return await getNotificationHistory(supabaseClient, user.id, url.searchParams);
        }
        break;

      default:
        // Default: Get preferences
        if (req.method === 'GET') {
          return await getPreferences(supabaseClient, user.id);
        }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Get user's MoU notification preferences
 */
async function getPreferences(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from('mou_notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching preferences:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch preferences' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Create default preferences if not exists
  if (!data) {
    const { data: newPrefs, error: insertError } = await supabase
      .from('mou_notification_preferences')
      .insert({ user_id: userId })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating default preferences:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create preferences' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ preferences: newPrefs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ preferences: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Update user's MoU notification preferences
 */
async function updatePreferences(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  preferences: Partial<MouNotificationPreferences>
) {
  // Validate batch_frequency
  if (
    preferences.batch_frequency &&
    !['immediate', 'hourly', 'daily', 'weekly'].includes(preferences.batch_frequency)
  ) {
    return new Response(JSON.stringify({ error: 'Invalid batch_frequency' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate health_score_drop_threshold
  if (preferences.health_score_drop_threshold !== undefined) {
    if (
      preferences.health_score_drop_threshold < 5 ||
      preferences.health_score_drop_threshold > 50
    ) {
      return new Response(
        JSON.stringify({ error: 'health_score_drop_threshold must be between 5 and 50' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Validate batch_delivery_day
  if (preferences.batch_delivery_day !== undefined) {
    if (preferences.batch_delivery_day < 0 || preferences.batch_delivery_day > 6) {
      return new Response(
        JSON.stringify({ error: 'batch_delivery_day must be between 0 (Sunday) and 6 (Saturday)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  const { data, error } = await supabase
    .from('mou_notification_preferences')
    .upsert(
      {
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error updating preferences:', error);
    return new Response(JSON.stringify({ error: 'Failed to update preferences' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ preferences: data, success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Get notification summary for user
 */
async function getNotificationSummary(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase.rpc('get_user_mou_notification_summary', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching summary:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch summary' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const summary = data?.[0] || {
    pending_notifications: 0,
    unread_notifications: 0,
    notifications_today: 0,
    notifications_this_week: 0,
    deliverables_due_soon: 0,
    overdue_deliverables: 0,
  };

  return new Response(JSON.stringify({ summary }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Get queued notifications for user
 */
async function getQueuedNotifications(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  params: URLSearchParams
) {
  const status = params.get('status') || 'pending';
  const limit = Math.min(parseInt(params.get('limit') || '20'), 50);
  const offset = parseInt(params.get('offset') || '0');

  let query = supabase
    .from('mou_notification_queue')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('scheduled_for', { ascending: true })
    .range(offset, offset + limit - 1);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching queue:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch queue' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      notifications: data,
      total: count,
      limit,
      offset,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Get notification history for user
 */
async function getNotificationHistory(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  params: URLSearchParams
) {
  const limit = Math.min(parseInt(params.get('limit') || '20'), 50);
  const offset = parseInt(params.get('offset') || '0');
  const notificationType = params.get('type') || null;
  const startDate = params.get('startDate') || null;
  const endDate = params.get('endDate') || null;

  let query = supabase
    .from('mou_notification_log')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('sent_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (notificationType) {
    query = query.eq('notification_type', notificationType);
  }

  if (startDate) {
    query = query.gte('sent_at', startDate);
  }

  if (endDate) {
    query = query.lte('sent_at', endDate);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching history:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch history' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      notifications: data,
      total: count,
      limit,
      offset,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Process notification queue (scheduled job)
 */
async function processNotificationQueue() {
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await serviceClient.rpc('process_mou_notification_queue', {
    p_batch_size: 100,
  });

  if (error) {
    console.error('Error processing queue:', error);
    return new Response(JSON.stringify({ error: 'Failed to process queue' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const result = data?.[0] || { processed_count: 0, success_count: 0, failure_count: 0 };

  console.log(
    `Processed ${result.processed_count} notifications: ${result.success_count} success, ${result.failure_count} failures`
  );

  return new Response(
    JSON.stringify({
      success: true,
      processed: result.processed_count,
      successful: result.success_count,
      failed: result.failure_count,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Check deliverable due dates and queue notifications (scheduled job)
 */
async function checkDeliverableDueDates() {
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await serviceClient.rpc('check_mou_deliverable_due_dates');

  if (error) {
    console.error('Error checking due dates:', error);
    return new Response(JSON.stringify({ error: 'Failed to check due dates' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const result = data?.[0] || { notifications_queued: 0, deliverables_checked: 0 };

  console.log(
    `Checked ${result.deliverables_checked} deliverables, queued ${result.notifications_queued} notifications`
  );

  return new Response(
    JSON.stringify({
      success: true,
      deliverables_checked: result.deliverables_checked,
      notifications_queued: result.notifications_queued,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
