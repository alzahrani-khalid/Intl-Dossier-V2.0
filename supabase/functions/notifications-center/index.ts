// Notification Center Edge Function
// Handles fetching, managing, and updating notifications
// Feature: notification-center

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface NotificationFilters {
  category?: string;
  unreadOnly?: boolean;
  cursor?: string;
  limit?: number;
}

interface MarkReadRequest {
  notificationIds?: string[];
  category?: string;
  markAll?: boolean;
}

interface CategoryPreference {
  category: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  sms_enabled: boolean;
  sound_enabled: boolean;
}

interface DeviceTokenRequest {
  deviceToken: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
  provider?: 'expo' | 'fcm' | 'apns' | 'web_push';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user's JWT
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user from JWT
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

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Route based on path and method
    switch (req.method) {
      case 'GET':
        if (path === 'notifications' || path === 'notifications-center') {
          return await getNotifications(supabaseClient, user.id, url.searchParams);
        } else if (path === 'counts') {
          return await getNotificationCounts(supabaseClient, user.id);
        } else if (path === 'preferences') {
          return await getPreferences(supabaseClient, user.id);
        } else if (path === 'devices') {
          return await getDevices(supabaseClient, user.id);
        }
        break;

      case 'POST':
        const body = await req.json();
        if (path === 'mark-read') {
          return await markAsRead(supabaseClient, user.id, body as MarkReadRequest);
        } else if (path === 'devices') {
          return await registerDevice(supabaseClient, user.id, body as DeviceTokenRequest);
        }
        break;

      case 'PATCH':
        const patchBody = await req.json();
        if (path === 'preferences') {
          return await updatePreferences(
            supabaseClient,
            user.id,
            patchBody as CategoryPreference[]
          );
        }
        break;

      case 'DELETE':
        if (path === 'devices') {
          const deleteBody = await req.json();
          return await removeDevice(supabaseClient, user.id, deleteBody.deviceToken);
        } else if (path?.startsWith('notification-')) {
          const notificationId = path.replace('notification-', '');
          return await deleteNotification(supabaseClient, user.id, notificationId);
        }
        break;
    }

    // Default: Get notifications list
    if (req.method === 'GET') {
      return await getNotifications(supabaseClient, user.id, url.searchParams);
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

async function getNotifications(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  params: URLSearchParams
) {
  const category = params.get('category') || null;
  const unreadOnly = params.get('unreadOnly') === 'true';
  const cursor = params.get('cursor') || null;
  const limit = Math.min(parseInt(params.get('limit') || '20'), 50);

  // Build query
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (category) {
    query = query.eq('category', category);
  }

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: notifications, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch notifications' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get next cursor
  const nextCursor =
    notifications && notifications.length === limit
      ? notifications[notifications.length - 1].created_at
      : null;

  return new Response(
    JSON.stringify({
      notifications,
      nextCursor,
      hasMore: notifications?.length === limit,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getNotificationCounts(supabase: ReturnType<typeof createClient>, userId: string) {
  // Get counts by category
  const { data, error } = await supabase.rpc('get_notification_counts', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching counts:', error);
    // Fallback to simple count
    const { count: totalUnread } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
      .or('expires_at.is.null,expires_at.gt.now()');

    return new Response(
      JSON.stringify({
        total: totalUnread || 0,
        byCategory: {},
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Transform to object format
  const byCategory: Record<string, { total: number; unread: number }> = {};
  let totalUnread = 0;

  for (const row of data || []) {
    byCategory[row.category] = {
      total: row.total_count,
      unread: row.unread_count,
    };
    totalUnread += row.unread_count;
  }

  return new Response(
    JSON.stringify({
      total: totalUnread,
      byCategory,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function markAsRead(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  request: MarkReadRequest
) {
  if (request.markAll) {
    // Mark all notifications as read
    const { data, error } = await supabase.rpc('mark_category_as_read', {
      p_user_id: userId,
      p_category: request.category || null,
    });

    if (error) {
      return new Response(JSON.stringify({ error: 'Failed to mark as read' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ marked: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (request.notificationIds && request.notificationIds.length > 0) {
    // Mark specific notifications as read
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in('id', request.notificationIds);

    if (error) {
      return new Response(JSON.stringify({ error: 'Failed to mark as read' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ marked: request.notificationIds.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'No notifications specified' }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getPreferences(supabase: ReturnType<typeof createClient>, userId: string) {
  // Get category preferences
  const { data: categoryPrefs, error: catError } = await supabase
    .from('notification_category_preferences')
    .select('*')
    .eq('user_id', userId);

  // Get email preferences
  const { data: emailPrefs, error: emailError } = await supabase
    .from('email_notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (catError && catError.code !== 'PGRST116') {
    console.error('Error fetching category preferences:', catError);
  }

  return new Response(
    JSON.stringify({
      categories: categoryPrefs || [],
      email: emailPrefs || null,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updatePreferences(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  preferences: CategoryPreference[]
) {
  // Upsert each preference
  for (const pref of preferences) {
    const { error } = await supabase.from('notification_category_preferences').upsert(
      {
        user_id: userId,
        category: pref.category,
        email_enabled: pref.email_enabled,
        push_enabled: pref.push_enabled,
        in_app_enabled: pref.in_app_enabled,
        sms_enabled: pref.sms_enabled,
        sound_enabled: pref.sound_enabled,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,category',
      }
    );

    if (error) {
      console.error('Error updating preference:', error);
      return new Response(JSON.stringify({ error: 'Failed to update preferences' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getDevices(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from('push_device_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('last_used_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching devices:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch devices' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ devices: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function registerDevice(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  request: DeviceTokenRequest
) {
  const { error } = await supabase.from('push_device_tokens').upsert(
    {
      user_id: userId,
      device_token: request.deviceToken,
      platform: request.platform,
      device_name: request.deviceName,
      provider: request.provider || 'expo',
      is_active: true,
      last_used_at: new Date().toISOString(),
      failed_attempts: 0,
      last_error: null,
    },
    {
      onConflict: 'user_id,device_token',
    }
  );

  if (error) {
    console.error('Error registering device:', error);
    return new Response(JSON.stringify({ error: 'Failed to register device' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function removeDevice(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  deviceToken: string
) {
  const { error } = await supabase
    .from('push_device_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('device_token', deviceToken);

  if (error) {
    console.error('Error removing device:', error);
    return new Response(JSON.stringify({ error: 'Failed to remove device' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  notificationId: string
) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete notification' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
