/**
 * Calendar Sync Edge Function
 * Two-way sync with external calendar systems (Google Calendar, Outlook, Exchange)
 *
 * Endpoints:
 * - GET /connections - List user's calendar connections
 * - POST /connections - Create new connection (initiate OAuth)
 * - PUT /connections/:id - Update connection settings
 * - DELETE /connections/:id - Disconnect calendar
 * - POST /oauth/callback - Handle OAuth callback
 * - GET /calendars/:connectionId - List available calendars
 * - PUT /calendars/:id - Update calendar sync settings
 * - POST /sync - Trigger manual sync
 * - GET /conflicts - List pending conflicts
 * - POST /conflicts/:id/resolve - Resolve a conflict
 * - GET /ical - List iCal subscriptions
 * - POST /ical - Add iCal subscription
 * - PUT /ical/:id - Update iCal subscription
 * - DELETE /ical/:id - Remove iCal subscription
 * - POST /ical/:id/refresh - Refresh iCal feed
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Provider OAuth configuration
const OAUTH_CONFIG = {
  google_calendar: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  outlook: {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['Calendars.ReadWrite', 'User.Read', 'offline_access'],
    clientIdEnv: 'MICROSOFT_CLIENT_ID',
    clientSecretEnv: 'MICROSOFT_CLIENT_SECRET',
  },
  exchange: {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['Calendars.ReadWrite', 'User.Read', 'offline_access'],
    clientIdEnv: 'MICROSOFT_CLIENT_ID',
    clientSecretEnv: 'MICROSOFT_CLIENT_SECRET',
  },
};

interface RouteParams {
  action: string;
  id?: string;
  subAction?: string;
}

function parseRoute(pathname: string): RouteParams {
  const parts = pathname.replace('/calendar-sync', '').split('/').filter(Boolean);
  return {
    action: parts[0] || 'connections',
    id: parts[1],
    subAction: parts[2],
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

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
    const route = parseRoute(url.pathname);

    // Route handlers
    switch (route.action) {
      case 'connections':
        return handleConnections(req, supabaseClient, user.id, route);

      case 'oauth':
        return handleOAuth(req, supabaseClient, user.id, route);

      case 'calendars':
        return handleCalendars(req, supabaseClient, user.id, route);

      case 'sync':
        return handleSync(req, supabaseClient, user.id);

      case 'conflicts':
        return handleConflicts(req, supabaseClient, user.id, route);

      case 'ical':
        return handleIcal(req, supabaseClient, user.id, route);

      case 'unified':
        return handleUnifiedEvents(req, supabaseClient, user.id, url);

      default:
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in calendar-sync:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// Connection Handlers
// ============================================================================

async function handleConnections(req: Request, supabase: any, userId: string, route: RouteParams) {
  const { method } = req;

  // GET /connections - List all connections
  if (method === 'GET' && !route.id) {
    const { data, error } = await supabase
      .from('external_calendar_connections')
      .select(
        `
        *,
        calendars:external_calendars(*)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // POST /connections - Create new connection (initiate OAuth)
  if (method === 'POST' && !route.id) {
    const body = await req.json();
    const { provider, redirect_uri, ...settings } = body;

    if (!provider || !redirect_uri) {
      return new Response(JSON.stringify({ error: 'provider and redirect_uri required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const config = OAUTH_CONFIG[provider as keyof typeof OAUTH_CONFIG];
    if (!config) {
      return new Response(JSON.stringify({ error: 'Unsupported provider' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate state token for CSRF protection
    const state = crypto.randomUUID();

    // Store pending connection with state
    const { error: insertError } = await supabase.from('external_calendar_connections').insert({
      user_id: userId,
      provider,
      sync_status: 'pending',
      sync_direction: settings.sync_direction || 'two_way',
      conflict_strategy: settings.conflict_strategy || 'newest_wins',
      auto_sync_interval_minutes: settings.auto_sync_interval_minutes || 15,
      sync_past_days: settings.sync_past_days || 30,
      sync_future_days: settings.sync_future_days || 90,
      sync_cursor: state, // Temporarily store state here
    });

    if (insertError) throw insertError;

    // Build OAuth URL
    const clientId = Deno.env.get(config.clientIdEnv);
    const authParams = new URLSearchParams({
      client_id: clientId || '',
      redirect_uri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    const authorizationUrl = `${config.authUrl}?${authParams.toString()}`;

    return new Response(JSON.stringify({ authorization_url: authorizationUrl, state }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // GET /connections/:id - Get single connection
  if (method === 'GET' && route.id) {
    const { data, error } = await supabase
      .from('external_calendar_connections')
      .select(
        `
        *,
        calendars:external_calendars(*)
      `
      )
      .eq('id', route.id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new Response(JSON.stringify({ error: 'Connection not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw error;
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // PUT /connections/:id - Update connection
  if (method === 'PUT' && route.id) {
    const body = await req.json();
    const allowedFields = [
      'sync_direction',
      'conflict_strategy',
      'sync_enabled',
      'auto_sync_interval_minutes',
      'sync_past_days',
      'sync_future_days',
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from('external_calendar_connections')
      .update(updates)
      .eq('id', route.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // DELETE /connections/:id - Disconnect
  if (method === 'DELETE' && route.id) {
    const { error } = await supabase
      .from('external_calendar_connections')
      .delete()
      .eq('id', route.id)
      .eq('user_id', userId);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// OAuth Handlers
// ============================================================================

async function handleOAuth(req: Request, supabase: any, userId: string, route: RouteParams) {
  if (req.method !== 'POST' || route.id !== 'callback') {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json();
  const { provider, code, state, redirect_uri } = body;

  if (!provider || !code || !state) {
    return new Response(JSON.stringify({ error: 'provider, code, and state required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Find pending connection with matching state
  const { data: connection, error: findError } = await supabase
    .from('external_calendar_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('sync_status', 'pending')
    .eq('sync_cursor', state)
    .single();

  if (findError || !connection) {
    return new Response(JSON.stringify({ error: 'Invalid or expired state token' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const config = OAUTH_CONFIG[provider as keyof typeof OAUTH_CONFIG];
  if (!config) {
    return new Response(JSON.stringify({ error: 'Unsupported provider' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Exchange code for tokens
  const clientId = Deno.env.get(config.clientIdEnv);
  const clientSecret = Deno.env.get(config.clientSecretEnv);

  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId || '',
      client_secret: clientSecret || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirect_uri || '',
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    console.error('Token exchange failed:', errorData);
    return new Response(JSON.stringify({ error: 'Failed to exchange authorization code' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const tokens = await tokenResponse.json();

  // Get user info from provider
  let providerEmail = '';
  let providerName = '';
  let providerAccountId = '';

  if (provider === 'google_calendar') {
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoResponse.json();
    providerEmail = userInfo.email;
    providerName = userInfo.name;
    providerAccountId = userInfo.id;
  } else if (provider === 'outlook' || provider === 'exchange') {
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoResponse.json();
    providerEmail = userInfo.mail || userInfo.userPrincipalName;
    providerName = userInfo.displayName;
    providerAccountId = userInfo.id;
  }

  // Update connection with tokens
  const tokenExpiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  const { data: updatedConnection, error: updateError } = await supabase
    .from('external_calendar_connections')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: tokenExpiresAt,
      provider_email: providerEmail,
      provider_name: providerName,
      provider_account_id: providerAccountId,
      sync_status: 'active',
      sync_cursor: null, // Clear state token
    })
    .eq('id', connection.id)
    .select()
    .single();

  if (updateError) throw updateError;

  // Fetch available calendars from provider
  await fetchAndSaveCalendars(supabase, updatedConnection, tokens.access_token);

  return new Response(JSON.stringify(updatedConnection), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function fetchAndSaveCalendars(supabase: any, connection: any, accessToken: string) {
  let calendars: any[] = [];

  if (connection.provider === 'google_calendar') {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();
    calendars =
      data.items?.map((cal: any) => ({
        connection_id: connection.id,
        external_calendar_id: cal.id,
        name: cal.summary,
        description: cal.description,
        color: cal.backgroundColor,
        timezone: cal.timeZone,
        is_primary: cal.primary || false,
        is_owner: cal.accessRole === 'owner',
        access_role: cal.accessRole,
        sync_enabled: cal.primary || false, // Auto-enable primary calendar
        import_events: true,
        export_events: cal.accessRole === 'owner' || cal.accessRole === 'writer',
      })) || [];
  } else if (connection.provider === 'outlook' || connection.provider === 'exchange') {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/calendars', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();
    calendars =
      data.value?.map((cal: any) => ({
        connection_id: connection.id,
        external_calendar_id: cal.id,
        name: cal.name,
        color: cal.hexColor,
        is_primary: cal.isDefaultCalendar || false,
        is_owner: cal.canEdit,
        access_role: cal.canEdit ? 'writer' : 'reader',
        sync_enabled: cal.isDefaultCalendar || false,
        import_events: true,
        export_events: cal.canEdit,
      })) || [];
  }

  if (calendars.length > 0) {
    const { error } = await supabase.from('external_calendars').upsert(calendars, {
      onConflict: 'connection_id,external_calendar_id',
    });

    if (error) {
      console.error('Error saving calendars:', error);
    }
  }
}

// ============================================================================
// Calendar Handlers
// ============================================================================

async function handleCalendars(req: Request, supabase: any, userId: string, route: RouteParams) {
  const { method } = req;

  // GET /calendars/:connectionId - List calendars for connection
  if (method === 'GET' && route.id) {
    const { data, error } = await supabase
      .from('external_calendars')
      .select('*')
      .eq('connection_id', route.id)
      .order('is_primary', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // PUT /calendars/:id - Update calendar settings
  if (method === 'PUT' && route.id) {
    const body = await req.json();
    const allowedFields = ['sync_enabled', 'import_events', 'export_events'];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from('external_calendars')
      .update(updates)
      .eq('id', route.id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// Sync Handlers
// ============================================================================

async function handleSync(req: Request, supabase: any, userId: string) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json();
  const { connection_id, sync_type = 'incremental', calendar_ids } = body;

  if (!connection_id) {
    return new Response(JSON.stringify({ error: 'connection_id required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get connection
  const { data: connection, error: connError } = await supabase
    .from('external_calendar_connections')
    .select('*')
    .eq('id', connection_id)
    .eq('user_id', userId)
    .single();

  if (connError || !connection) {
    return new Response(JSON.stringify({ error: 'Connection not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Create sync log
  const { data: syncLog, error: logError } = await supabase
    .from('calendar_sync_logs')
    .insert({
      connection_id,
      sync_type,
      direction: connection.sync_direction,
      status: 'in_progress',
    })
    .select()
    .single();

  if (logError) throw logError;

  // Ensure valid access token
  const accessToken = await ensureValidToken(supabase, connection);
  if (!accessToken) {
    await supabase
      .from('calendar_sync_logs')
      .update({
        status: 'failed',
        sync_completed_at: new Date().toISOString(),
        error_message: 'Failed to refresh access token',
      })
      .eq('id', syncLog.id);

    return new Response(JSON.stringify({ error: 'Failed to refresh access token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get calendars to sync
  let calendarsQuery = supabase
    .from('external_calendars')
    .select('*')
    .eq('connection_id', connection_id)
    .eq('sync_enabled', true);

  if (calendar_ids?.length) {
    calendarsQuery = calendarsQuery.in('id', calendar_ids);
  }

  const { data: calendars, error: calError } = await calendarsQuery;
  if (calError) throw calError;

  // Perform sync for each calendar
  let totalImported = 0;
  let totalExported = 0;
  let totalUpdated = 0;
  let totalDeleted = 0;
  let totalConflicts = 0;
  let totalErrors = 0;

  for (const calendar of calendars || []) {
    try {
      const result = await syncCalendar(supabase, connection, calendar, accessToken, sync_type);
      totalImported += result.imported;
      totalExported += result.exported;
      totalUpdated += result.updated;
      totalDeleted += result.deleted;
      totalConflicts += result.conflicts;
    } catch (error) {
      console.error(`Error syncing calendar ${calendar.id}:`, error);
      totalErrors++;
    }
  }

  // Update sync log
  const { data: updatedLog, error: updateError } = await supabase
    .from('calendar_sync_logs')
    .update({
      status: totalErrors > 0 ? 'failed' : 'completed',
      sync_completed_at: new Date().toISOString(),
      events_imported: totalImported,
      events_exported: totalExported,
      events_updated: totalUpdated,
      events_deleted: totalDeleted,
      conflicts_detected: totalConflicts,
      errors: totalErrors,
    })
    .eq('id', syncLog.id)
    .select()
    .single();

  if (updateError) throw updateError;

  // Update connection sync status
  await supabase
    .from('external_calendar_connections')
    .update({
      last_sync_at: new Date().toISOString(),
      sync_status: totalErrors > 0 ? 'error' : 'active',
    })
    .eq('id', connection_id);

  return new Response(JSON.stringify(updatedLog), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function ensureValidToken(supabase: any, connection: any) {
  // Check if token is expired or about to expire (within 5 minutes)
  if (
    connection.token_expires_at &&
    new Date(connection.token_expires_at) > new Date(Date.now() + 5 * 60 * 1000)
  ) {
    return connection.access_token;
  }

  // Refresh token
  if (!connection.refresh_token) {
    return null;
  }

  const config = OAUTH_CONFIG[connection.provider as keyof typeof OAUTH_CONFIG];
  if (!config) return null;

  const clientId = Deno.env.get(config.clientIdEnv);
  const clientSecret = Deno.env.get(config.clientSecretEnv);

  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId || '',
      client_secret: clientSecret || '',
      refresh_token: connection.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    console.error('Token refresh failed:', await tokenResponse.text());
    return null;
  }

  const tokens = await tokenResponse.json();
  const tokenExpiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  await supabase
    .from('external_calendar_connections')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || connection.refresh_token,
      token_expires_at: tokenExpiresAt,
    })
    .eq('id', connection.id);

  return tokens.access_token;
}

async function syncCalendar(
  supabase: any,
  connection: any,
  calendar: any,
  accessToken: string,
  syncType: string
) {
  const result = {
    imported: 0,
    exported: 0,
    updated: 0,
    deleted: 0,
    conflicts: 0,
  };

  // Calculate sync time range
  const now = new Date();
  const startDate = new Date(now.getTime() - connection.sync_past_days * 24 * 60 * 60 * 1000);
  const endDate = new Date(now.getTime() + connection.sync_future_days * 24 * 60 * 60 * 1000);

  // Import events from external calendar
  if (
    calendar.import_events &&
    (connection.sync_direction === 'import_only' || connection.sync_direction === 'two_way')
  ) {
    const importResult = await importExternalEvents(
      supabase,
      connection,
      calendar,
      accessToken,
      startDate,
      endDate
    );
    result.imported = importResult.imported;
    result.updated += importResult.updated;
    result.conflicts = importResult.conflicts;
  }

  // Export events to external calendar
  if (
    calendar.export_events &&
    (connection.sync_direction === 'export_only' || connection.sync_direction === 'two_way')
  ) {
    const exportResult = await exportInternalEvents(
      supabase,
      connection,
      calendar,
      accessToken,
      startDate,
      endDate
    );
    result.exported = exportResult.exported;
    result.updated += exportResult.updated;
  }

  return result;
}

async function importExternalEvents(
  supabase: any,
  connection: any,
  calendar: any,
  accessToken: string,
  startDate: Date,
  endDate: Date
) {
  const result = { imported: 0, updated: 0, conflicts: 0 };

  let events: any[] = [];

  if (connection.provider === 'google_calendar') {
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendar.external_calendar_id
      )}/events`
    );
    url.searchParams.set('timeMin', startDate.toISOString());
    url.searchParams.set('timeMax', endDate.toISOString());
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('maxResults', '250');

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();
    events = data.items || [];
  } else if (connection.provider === 'outlook' || connection.provider === 'exchange') {
    const url = new URL(
      `https://graph.microsoft.com/v1.0/me/calendars/${calendar.external_calendar_id}/events`
    );
    url.searchParams.set(
      '$filter',
      `start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`
    );
    url.searchParams.set('$top', '250');

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();
    events = data.value || [];
  }

  // Process each event
  for (const externalEvent of events) {
    try {
      // Check if mapping exists
      const { data: existingMapping } = await supabase
        .from('calendar_event_sync_mapping')
        .select('*, internal_event:calendar_events(*)')
        .eq('external_calendar_id', calendar.id)
        .eq(
          'external_event_id',
          connection.provider === 'google_calendar' ? externalEvent.id : externalEvent.id
        )
        .single();

      const normalizedEvent = normalizeExternalEvent(externalEvent, connection.provider);

      if (existingMapping) {
        // Update existing event if external is newer
        const shouldUpdate =
          !existingMapping.last_external_update ||
          new Date(normalizedEvent.updated_at) > new Date(existingMapping.last_external_update);

        if (shouldUpdate) {
          // Check for conflicts
          if (
            existingMapping.internal_event &&
            existingMapping.last_synced_at &&
            existingMapping.internal_event.updated_at > existingMapping.last_synced_at
          ) {
            // Conflict detected
            await supabase.from('calendar_sync_conflicts').insert({
              mapping_id: existingMapping.id,
              conflict_type: 'update_conflict',
              internal_snapshot: existingMapping.internal_event,
              external_snapshot: normalizedEvent,
              conflicting_fields: findConflictingFields(
                existingMapping.internal_event,
                normalizedEvent
              ),
            });
            result.conflicts++;
          } else {
            // Update internal event
            await supabase
              .from('calendar_events')
              .update({
                title_en: normalizedEvent.title,
                description_en: normalizedEvent.description,
                start_datetime: normalizedEvent.start_datetime,
                end_datetime: normalizedEvent.end_datetime,
                location_en: normalizedEvent.location,
              })
              .eq('id', existingMapping.internal_event_id);

            await supabase
              .from('calendar_event_sync_mapping')
              .update({
                last_synced_at: new Date().toISOString(),
                last_external_update: normalizedEvent.updated_at,
                external_etag: normalizedEvent.etag,
                sync_state: 'synced',
              })
              .eq('id', existingMapping.id);

            result.updated++;
          }
        }
      } else {
        // Create new internal event
        // First, create a dossier for the event
        const { data: newDossier } = await supabase
          .from('dossiers')
          .insert({
            type: 'other',
            name_en: normalizedEvent.title || 'External Calendar Event',
            name_ar: normalizedEvent.title || 'External Calendar Event',
            status: 'active',
          })
          .select('id')
          .single();

        if (newDossier) {
          const { data: newEvent } = await supabase
            .from('calendar_events')
            .insert({
              dossier_id: newDossier.id,
              event_type: 'main_event',
              title_en: normalizedEvent.title,
              description_en: normalizedEvent.description,
              start_datetime: normalizedEvent.start_datetime,
              end_datetime: normalizedEvent.end_datetime,
              location_en: normalizedEvent.location,
              status: 'planned',
            })
            .select()
            .single();

          if (newEvent) {
            await supabase.from('calendar_event_sync_mapping').insert({
              internal_event_id: newEvent.id,
              external_calendar_id: calendar.id,
              external_event_id:
                connection.provider === 'google_calendar' ? externalEvent.id : externalEvent.id,
              sync_state: 'synced',
              last_synced_at: new Date().toISOString(),
              last_external_update: normalizedEvent.updated_at,
              external_etag: normalizedEvent.etag,
            });

            result.imported++;
          }
        }
      }
    } catch (error) {
      console.error('Error processing external event:', error);
    }
  }

  return result;
}

async function exportInternalEvents(
  supabase: any,
  connection: any,
  calendar: any,
  accessToken: string,
  startDate: Date,
  endDate: Date
) {
  const result = { exported: 0, updated: 0 };

  // Get internal events that need to be exported
  const { data: mappings } = await supabase
    .from('calendar_event_sync_mapping')
    .select('*, internal_event:calendar_events(*)')
    .eq('external_calendar_id', calendar.id)
    .eq('sync_state', 'pending_push');

  for (const mapping of mappings || []) {
    if (!mapping.internal_event) continue;

    try {
      if (connection.provider === 'google_calendar') {
        const eventData = {
          summary: mapping.internal_event.title_en,
          description: mapping.internal_event.description_en,
          start: {
            dateTime: mapping.internal_event.start_datetime,
            timeZone: 'Asia/Riyadh',
          },
          end: {
            dateTime: mapping.internal_event.end_datetime,
            timeZone: 'Asia/Riyadh',
          },
          location: mapping.internal_event.location_en,
        };

        if (mapping.external_event_id) {
          // Update existing
          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
              calendar.external_calendar_id
            )}/events/${mapping.external_event_id}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(eventData),
            }
          );
          result.updated++;
        } else {
          // Create new
          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
              calendar.external_calendar_id
            )}/events`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(eventData),
            }
          );
          const newEvent = await response.json();

          await supabase
            .from('calendar_event_sync_mapping')
            .update({
              external_event_id: newEvent.id,
              external_etag: newEvent.etag,
            })
            .eq('id', mapping.id);

          result.exported++;
        }
      } else if (connection.provider === 'outlook' || connection.provider === 'exchange') {
        const eventData = {
          subject: mapping.internal_event.title_en,
          body: {
            contentType: 'text',
            content: mapping.internal_event.description_en || '',
          },
          start: {
            dateTime: mapping.internal_event.start_datetime,
            timeZone: 'Arabian Standard Time',
          },
          end: {
            dateTime: mapping.internal_event.end_datetime,
            timeZone: 'Arabian Standard Time',
          },
          location: {
            displayName: mapping.internal_event.location_en || '',
          },
        };

        if (mapping.external_event_id) {
          await fetch(
            `https://graph.microsoft.com/v1.0/me/calendars/${calendar.external_calendar_id}/events/${mapping.external_event_id}`,
            {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(eventData),
            }
          );
          result.updated++;
        } else {
          const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/calendars/${calendar.external_calendar_id}/events`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(eventData),
            }
          );
          const newEvent = await response.json();

          await supabase
            .from('calendar_event_sync_mapping')
            .update({
              external_event_id: newEvent.id,
              external_etag: newEvent.changeKey,
            })
            .eq('id', mapping.id);

          result.exported++;
        }
      }

      // Update mapping status
      await supabase
        .from('calendar_event_sync_mapping')
        .update({
          sync_state: 'synced',
          last_synced_at: new Date().toISOString(),
          last_internal_update: mapping.internal_event.updated_at,
        })
        .eq('id', mapping.id);
    } catch (error) {
      console.error('Error exporting event:', error);
    }
  }

  return result;
}

function normalizeExternalEvent(event: any, provider: string) {
  if (provider === 'google_calendar') {
    return {
      title: event.summary,
      description: event.description,
      start_datetime: event.start?.dateTime || event.start?.date,
      end_datetime: event.end?.dateTime || event.end?.date,
      location: event.location,
      status: event.status,
      updated_at: event.updated,
      etag: event.etag,
    };
  } else {
    return {
      title: event.subject,
      description: event.bodyPreview,
      start_datetime: event.start?.dateTime,
      end_datetime: event.end?.dateTime,
      location: event.location?.displayName,
      status: event.showAs,
      updated_at: event.lastModifiedDateTime,
      etag: event.changeKey,
    };
  }
}

function findConflictingFields(internal: any, external: any): string[] {
  const fields = ['title', 'description', 'start_datetime', 'end_datetime', 'location'];
  const conflicts: string[] = [];

  for (const field of fields) {
    const internalValue =
      field === 'title'
        ? internal.title_en
        : field === 'description'
          ? internal.description_en
          : field === 'location'
            ? internal.location_en
            : internal[field];

    if (internalValue !== external[field]) {
      conflicts.push(field);
    }
  }

  return conflicts;
}

// ============================================================================
// Conflict Handlers
// ============================================================================

async function handleConflicts(req: Request, supabase: any, userId: string, route: RouteParams) {
  const { method } = req;

  // GET /conflicts - List pending conflicts
  if (method === 'GET' && !route.id) {
    const { data, error } = await supabase
      .from('calendar_sync_conflicts')
      .select(
        `
        *,
        mapping:calendar_event_sync_mapping(
          *,
          external_calendar:external_calendars(
            *,
            connection:external_calendar_connections(*)
          )
        )
      `
      )
      .eq('status', 'pending')
      .order('detected_at', { ascending: false });

    if (error) throw error;

    // Filter to only user's conflicts
    const userConflicts = data.filter(
      (c: any) => c.mapping?.external_calendar?.connection?.user_id === userId
    );

    return new Response(JSON.stringify(userConflicts), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // POST /conflicts/:id/resolve - Resolve a conflict
  if (method === 'POST' && route.id && route.subAction === 'resolve') {
    const body = await req.json();
    const { resolution, merged_data } = body;

    if (!['keep_internal', 'keep_external', 'merge', 'ignore'].includes(resolution)) {
      return new Response(JSON.stringify({ error: 'Invalid resolution' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get conflict
    const { data: conflict, error: conflictError } = await supabase
      .from('calendar_sync_conflicts')
      .select(
        `
        *,
        mapping:calendar_event_sync_mapping(*)
      `
      )
      .eq('id', route.id)
      .single();

    if (conflictError || !conflict) {
      return new Response(JSON.stringify({ error: 'Conflict not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply resolution
    if (resolution === 'keep_external') {
      await supabase
        .from('calendar_events')
        .update({
          title_en: conflict.external_snapshot.title,
          description_en: conflict.external_snapshot.description,
          start_datetime: conflict.external_snapshot.start_datetime,
          end_datetime: conflict.external_snapshot.end_datetime,
          location_en: conflict.external_snapshot.location,
        })
        .eq('id', conflict.mapping.internal_event_id);
    } else if (resolution === 'merge' && merged_data) {
      await supabase
        .from('calendar_events')
        .update({
          title_en: merged_data.title,
          description_en: merged_data.description,
          start_datetime: merged_data.start_datetime,
          end_datetime: merged_data.end_datetime,
          location_en: merged_data.location,
        })
        .eq('id', conflict.mapping.internal_event_id);
    }
    // For 'keep_internal' and 'ignore', no update needed

    // Update conflict status
    const { data: updatedConflict, error: updateError } = await supabase
      .from('calendar_sync_conflicts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
        resolution:
          resolution === 'keep_internal'
            ? 'internal_kept'
            : resolution === 'keep_external'
              ? 'external_kept'
              : resolution === 'merge'
                ? 'merged'
                : 'ignored',
      })
      .eq('id', route.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update mapping state
    await supabase
      .from('calendar_event_sync_mapping')
      .update({
        sync_state: 'synced',
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', conflict.mapping.id);

    return new Response(JSON.stringify(updatedConflict), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// iCal Feed Handlers
// ============================================================================

async function handleIcal(req: Request, supabase: any, userId: string, route: RouteParams) {
  const { method } = req;

  // GET /ical - List subscriptions
  if (method === 'GET' && !route.id) {
    const { data, error } = await supabase
      .from('ical_feed_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // POST /ical - Add subscription
  if (method === 'POST' && !route.id) {
    const body = await req.json();
    const { feed_url, feed_name, description, color, refresh_interval_minutes } = body;

    if (!feed_url || !feed_name) {
      return new Response(JSON.stringify({ error: 'feed_url and feed_name required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
      .from('ical_feed_subscriptions')
      .insert({
        user_id: userId,
        feed_url,
        feed_name,
        description,
        color: color || '#3B82F6',
        refresh_interval_minutes: refresh_interval_minutes || 60,
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger initial refresh
    await refreshIcalFeed(supabase, data.id, feed_url);

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // PUT /ical/:id - Update subscription
  if (method === 'PUT' && route.id && !route.subAction) {
    const body = await req.json();
    const allowedFields = [
      'feed_name',
      'description',
      'color',
      'sync_enabled',
      'refresh_interval_minutes',
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from('ical_feed_subscriptions')
      .update(updates)
      .eq('id', route.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // DELETE /ical/:id - Remove subscription
  if (method === 'DELETE' && route.id) {
    const { error } = await supabase
      .from('ical_feed_subscriptions')
      .delete()
      .eq('id', route.id)
      .eq('user_id', userId);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // POST /ical/:id/refresh - Refresh feed
  if (method === 'POST' && route.id && route.subAction === 'refresh') {
    const { data: subscription, error: subError } = await supabase
      .from('ical_feed_subscriptions')
      .select('*')
      .eq('id', route.id)
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      return new Response(JSON.stringify({ error: 'Subscription not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await refreshIcalFeed(supabase, subscription.id, subscription.feed_url);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function refreshIcalFeed(supabase: any, subscriptionId: string, feedUrl: string) {
  try {
    // Fetch iCal feed
    const response = await fetch(feedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status}`);
    }

    const icalData = await response.text();
    const contentHash = await hashString(icalData);

    // Parse iCal data (simplified parser)
    const events = parseIcalEvents(icalData);

    // Delete existing events
    await supabase.from('ical_feed_events').delete().eq('subscription_id', subscriptionId);

    // Insert new events
    if (events.length > 0) {
      const eventInserts = events.map((e) => ({
        subscription_id: subscriptionId,
        ...e,
      }));

      await supabase.from('ical_feed_events').insert(eventInserts);
    }

    // Update subscription
    await supabase
      .from('ical_feed_subscriptions')
      .update({
        last_refresh_at: new Date().toISOString(),
        last_refresh_error: null,
        content_hash: contentHash,
        event_count: events.length,
      })
      .eq('id', subscriptionId);

    return { success: true, event_count: events.length };
  } catch (error) {
    await supabase
      .from('ical_feed_subscriptions')
      .update({
        last_refresh_at: new Date().toISOString(),
        last_refresh_error: error.message,
      })
      .eq('id', subscriptionId);

    return { success: false, error: error.message };
  }
}

function parseIcalEvents(icalData: string): any[] {
  const events: any[] = [];
  const lines = icalData.split(/\r?\n/);

  let currentEvent: any = null;
  let currentProperty = '';
  let currentValue = '';

  for (const line of lines) {
    // Handle line folding (lines starting with space/tab)
    if (line.startsWith(' ') || line.startsWith('\t')) {
      currentValue += line.substring(1);
      continue;
    }

    // Process previous property
    if (currentProperty && currentEvent) {
      processProperty(currentEvent, currentProperty, currentValue);
    }

    // Parse new line
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const propertyPart = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1);

    // Extract property name (before any parameters)
    const semicolonIndex = propertyPart.indexOf(';');
    const propertyName =
      semicolonIndex === -1 ? propertyPart : propertyPart.substring(0, semicolonIndex);

    currentProperty = propertyName;
    currentValue = value;

    if (propertyName === 'BEGIN' && value === 'VEVENT') {
      currentEvent = {};
    } else if (propertyName === 'END' && value === 'VEVENT') {
      if (currentEvent && currentEvent.ical_uid && currentEvent.start_datetime) {
        events.push(currentEvent);
      }
      currentEvent = null;
    }
  }

  return events;
}

function processProperty(event: any, property: string, value: string) {
  switch (property) {
    case 'UID':
      event.ical_uid = value;
      break;
    case 'SUMMARY':
      event.title = value;
      break;
    case 'DESCRIPTION':
      event.description = value;
      break;
    case 'LOCATION':
      event.location = value;
      break;
    case 'DTSTART':
      event.start_datetime = parseIcalDate(value);
      event.is_all_day = value.length === 8;
      break;
    case 'DTEND':
      event.end_datetime = parseIcalDate(value);
      break;
    case 'SEQUENCE':
      event.sequence = parseInt(value, 10) || 0;
      break;
    case 'STATUS':
      event.status = value.toLowerCase();
      break;
    case 'RRULE':
      event.rrule = value;
      break;
    case 'RECURRENCE-ID':
      event.recurrence_id = value;
      break;
    case 'ORGANIZER':
      const emailMatch = value.match(/mailto:(.+)/i);
      if (emailMatch) {
        event.organizer_email = emailMatch[1];
      }
      break;
  }
}

function parseIcalDate(value: string): string {
  // Handle all-day dates (YYYYMMDD)
  if (value.length === 8) {
    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);
    return `${year}-${month}-${day}T00:00:00Z`;
  }

  // Handle datetime (YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS)
  const match = value.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/);
  if (match) {
    const [_, year, month, day, hour, minute, second] = match;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  }

  return value;
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// Unified Events Handler
// ============================================================================

async function handleUnifiedEvents(req: Request, supabase: any, userId: string, url: URL) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');

  if (!startDate || !endDate) {
    return new Response(JSON.stringify({ error: 'start_date and end_date required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Call the database function
  const { data, error } = await supabase.rpc('get_unified_calendar_events', {
    p_user_id: userId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
