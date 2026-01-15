// Bot Notification Dispatcher Edge Function
// Processes pending notification deliveries for Slack and Teams
// Can be triggered by cron job or webhook
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface PendingDelivery {
  delivery_id: string;
  notification_id: string;
  workspace_id: string;
  platform: 'slack' | 'teams';
  target_type: string;
  target_id: string;
  message_text: string;
  message_blocks: unknown;
  retry_count: number;
  slack_access_token: string | null;
  teams_service_url: string | null;
}

interface BriefingSchedule {
  schedule_id: string;
  workspace_id: string;
  user_link_id: string | null;
  user_id: string | null;
  platform: 'slack' | 'teams';
  target_type: string;
  target_id: string;
  include_assignments: boolean;
  include_deadlines: boolean;
  include_calendar: boolean;
  include_watchlist: boolean;
  include_commitments: boolean;
  max_items: number;
  deadline_days: number;
  language_preference: string;
  slack_access_token: string | null;
  teams_service_url: string | null;
}

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = [60000, 300000, 900000]; // 1min, 5min, 15min

// Translations for notifications
const translations = {
  en: {
    notification: {
      title: 'Notification',
      assignment: 'New Assignment',
      deadline: 'Deadline Reminder',
      calendar: 'Calendar Event',
      signal: 'Intelligence Signal',
      intake: 'New Intake Ticket',
      workflow: 'Workflow Update',
      mention: 'You were mentioned',
      system: 'System Notification',
    },
    briefing: {
      title: 'Daily Briefing',
      assignments: 'Pending Assignments',
      deadlines: 'Upcoming Deadlines',
      calendar: "Today's Events",
      watchlist: 'Watchlist Updates',
      commitments: 'Active Commitments',
      noItems: 'No items',
    },
    labels: {
      priority: 'Priority',
      status: 'Status',
      dueDate: 'Due Date',
      viewMore: 'View More',
    },
  },
  ar: {
    notification: {
      title: 'إشعار',
      assignment: 'مهمة جديدة',
      deadline: 'تذكير بالموعد النهائي',
      calendar: 'حدث في التقويم',
      signal: 'إشارة استخباراتية',
      intake: 'تذكرة استقبال جديدة',
      workflow: 'تحديث سير العمل',
      mention: 'تم ذكرك',
      system: 'إشعار النظام',
    },
    briefing: {
      title: 'الملخص اليومي',
      assignments: 'المهام المعلقة',
      deadlines: 'المواعيد النهائية القادمة',
      calendar: 'أحداث اليوم',
      watchlist: 'تحديثات قائمة المتابعة',
      commitments: 'الالتزامات النشطة',
      noItems: 'لا توجد عناصر',
    },
    labels: {
      priority: 'الأولوية',
      status: 'الحالة',
      dueDate: 'تاريخ الاستحقاق',
      viewMore: 'عرض المزيد',
    },
  },
};

// Helper to get translation
function t(lang: string, path: string): string {
  const keys = path.split('.');
  let value: unknown = translations[lang as keyof typeof translations] || translations.en;
  for (const key of keys) {
    value = (value as Record<string, unknown>)?.[key];
    if (!value) {
      value = translations.en;
      for (const k of keys) {
        value = (value as Record<string, unknown>)?.[k];
      }
      break;
    }
  }
  return (value as string) || path;
}

// Create Supabase client
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Send message to Slack
async function sendSlackMessage(
  accessToken: string,
  channel: string,
  text: string,
  blocks?: unknown
): Promise<{ ok: boolean; error?: string; ts?: string }> {
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      channel,
      text,
      blocks,
    }),
  });

  return response.json();
}

// Get Teams bot token
async function getTeamsBotToken(): Promise<string> {
  const clientId = Deno.env.get('TEAMS_APP_ID');
  const clientSecret = Deno.env.get('TEAMS_APP_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Missing Teams app credentials');
  }

  const response = await fetch(
    'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://api.botframework.com/.default',
      }),
    }
  );

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('Failed to get Teams bot token');
  }

  return data.access_token;
}

// Send message to Teams
async function sendTeamsMessage(
  serviceUrl: string,
  conversationId: string,
  text: string,
  card?: unknown,
  botToken?: string
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const token = botToken || (await getTeamsBotToken());

  const body: Record<string, unknown> = {
    type: 'message',
    from: { id: Deno.env.get('TEAMS_BOT_ID') || '' },
    conversation: { id: conversationId },
  };

  if (card) {
    body.attachments = [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: card,
      },
    ];
  } else {
    body.text = text;
  }

  const response = await fetch(`${serviceUrl}v3/conversations/${conversationId}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { ok: false, error: errorText };
  }

  const data = await response.json();
  return { ok: true, id: data.id };
}

// Process a single notification delivery
async function processDelivery(
  supabase: ReturnType<typeof createClient>,
  delivery: PendingDelivery
): Promise<{ success: boolean; error?: string }> {
  try {
    let result: { ok: boolean; error?: string; ts?: string; id?: string };

    if (delivery.platform === 'slack') {
      if (!delivery.slack_access_token) {
        return { success: false, error: 'Missing Slack access token' };
      }

      result = await sendSlackMessage(
        delivery.slack_access_token,
        delivery.target_id,
        delivery.message_text,
        delivery.message_blocks
      );
    } else if (delivery.platform === 'teams') {
      if (!delivery.teams_service_url) {
        return { success: false, error: 'Missing Teams service URL' };
      }

      result = await sendTeamsMessage(
        delivery.teams_service_url,
        delivery.target_id,
        delivery.message_text,
        delivery.message_blocks
      );
    } else {
      return { success: false, error: `Unknown platform: ${delivery.platform}` };
    }

    if (result.ok) {
      // Mark as sent
      await supabase
        .from('bot_notification_deliveries')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          platform_message_id: result.ts || result.id,
          platform_response: result,
        })
        .eq('id', delivery.delivery_id);

      return { success: true };
    } else {
      // Check if rate limited
      const isRateLimited = result.error?.includes('rate_limit') || result.error?.includes('429');

      // Update with error
      const nextRetry =
        delivery.retry_count < MAX_RETRIES
          ? new Date(Date.now() + RETRY_DELAY_MS[delivery.retry_count]).toISOString()
          : null;

      await supabase
        .from('bot_notification_deliveries')
        .update({
          status: isRateLimited
            ? 'rate_limited'
            : delivery.retry_count >= MAX_RETRIES
              ? 'failed'
              : 'pending',
          retry_count: delivery.retry_count + 1,
          next_retry_at: nextRetry,
          error_code: isRateLimited ? 'RATE_LIMITED' : 'SEND_FAILED',
          error_message: result.error,
          platform_response: result,
        })
        .eq('id', delivery.delivery_id);

      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Delivery error:', error);

    // Update with error
    const nextRetry =
      delivery.retry_count < MAX_RETRIES
        ? new Date(Date.now() + RETRY_DELAY_MS[delivery.retry_count]).toISOString()
        : null;

    await supabase
      .from('bot_notification_deliveries')
      .update({
        status: delivery.retry_count >= MAX_RETRIES ? 'failed' : 'pending',
        retry_count: delivery.retry_count + 1,
        next_retry_at: nextRetry,
        error_code: 'EXCEPTION',
        error_message: error instanceof Error ? error.message : String(error),
      })
      .eq('id', delivery.delivery_id);

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Build briefing content for a user
async function buildBriefingContent(
  supabase: ReturnType<typeof createClient>,
  schedule: BriefingSchedule
): Promise<{
  text: string;
  slackBlocks?: unknown;
  teamsCard?: unknown;
}> {
  const lang = schedule.language_preference || 'en';
  const appUrl = Deno.env.get('APP_URL') || 'https://intl-dossier.app';

  const sections: Array<{ title: string; items: Array<{ text: string; priority?: string }> }> = [];

  // Get assignments
  if (schedule.include_assignments && schedule.user_id) {
    const { data: assignments } = await supabase
      .from('assignments')
      .select('title, deadline, priority')
      .eq('assignee_id', schedule.user_id)
      .in('status', ['pending', 'in_progress'])
      .order('deadline', { ascending: true })
      .limit(schedule.max_items);

    sections.push({
      title: t(lang, 'briefing.assignments'),
      items: (assignments || []).map((a) => ({
        text: `${a.title}${
          a.deadline
            ? ` - ${new Date(a.deadline).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}`
            : ''
        }`,
        priority: a.priority,
      })),
    });
  }

  // Get deadlines
  if (schedule.include_deadlines && schedule.user_id) {
    const deadlineDate = new Date(
      Date.now() + schedule.deadline_days * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: deadlines } = await supabase
      .from('assignments')
      .select('title, deadline')
      .eq('assignee_id', schedule.user_id)
      .neq('status', 'completed')
      .lte('deadline', deadlineDate)
      .order('deadline', { ascending: true })
      .limit(schedule.max_items);

    sections.push({
      title: t(lang, 'briefing.deadlines'),
      items: (deadlines || []).map((d) => ({
        text: `${d.title} - ${new Date(d.deadline).toLocaleDateString(
          lang === 'ar' ? 'ar-SA' : 'en-US'
        )}`,
      })),
    });
  }

  // Get calendar events
  if (schedule.include_calendar && schedule.user_id) {
    const today = new Date().toISOString().split('T')[0];

    const { data: calendar } = await supabase
      .from('calendar_entries')
      .select('title, start_time')
      .gte('start_time', `${today}T00:00:00`)
      .lte('start_time', `${today}T23:59:59`)
      .order('start_time', { ascending: true })
      .limit(schedule.max_items);

    sections.push({
      title: t(lang, 'briefing.calendar'),
      items: (calendar || []).map((e) => ({
        text: `${new Date(e.start_time).toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })} - ${e.title}`,
      })),
    });
  }

  // Get commitments
  if (schedule.include_commitments && schedule.user_id) {
    const { data: commitments } = await supabase
      .from('commitments')
      .select('description, due_date')
      .eq('owner_id', schedule.user_id)
      .neq('status', 'completed')
      .order('due_date', { ascending: true })
      .limit(schedule.max_items);

    sections.push({
      title: t(lang, 'briefing.commitments'),
      items: (commitments || []).map((c) => ({
        text: c.description?.slice(0, 50) || 'Commitment',
      })),
    });
  }

  // Build plain text version
  let text = `📋 ${t(lang, 'briefing.title')}\n\n`;
  for (const section of sections) {
    text += `*${section.title}*\n`;
    if (section.items.length === 0) {
      text += `_${t(lang, 'briefing.noItems')}_\n`;
    } else {
      for (const item of section.items) {
        const priorityIcon =
          item.priority === 'urgent'
            ? '🔴'
            : item.priority === 'high'
              ? '🟠'
              : item.priority
                ? '⚪'
                : '';
        text += `${priorityIcon} ${item.text}\n`;
      }
    }
    text += '\n';
  }

  // Build Slack blocks
  const slackBlocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: t(lang, 'briefing.title'), emoji: true },
    },
  ];

  for (const section of sections) {
    slackBlocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*${section.title}*` },
    } as never);

    if (section.items.length === 0) {
      slackBlocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `_${t(lang, 'briefing.noItems')}_` },
      } as never);
    } else {
      for (const item of section.items) {
        const priorityIcon =
          item.priority === 'urgent'
            ? ':red_circle:'
            : item.priority === 'high'
              ? ':orange_circle:'
              : item.priority
                ? ':white_circle:'
                : '';
        slackBlocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `${priorityIcon} ${item.text}` },
        } as never);
      }
    }

    slackBlocks.push({ type: 'divider' } as never);
  }

  slackBlocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: t(lang, 'labels.viewMore'), emoji: true },
        url: `${appUrl}/my-work`,
        action_id: 'view_dashboard',
      },
    ],
  } as never);

  // Build Teams adaptive card
  const teamsCardBody = [
    {
      type: 'TextBlock',
      text: t(lang, 'briefing.title'),
      size: 'Large',
      weight: 'Bolder',
    },
  ];

  for (const section of sections) {
    teamsCardBody.push({
      type: 'TextBlock',
      text: section.title,
      weight: 'Bolder',
    } as never);

    if (section.items.length === 0) {
      teamsCardBody.push({
        type: 'TextBlock',
        text: t(lang, 'briefing.noItems'),
      } as never);
    } else {
      for (const item of section.items) {
        const priorityIcon =
          item.priority === 'urgent'
            ? '🔴'
            : item.priority === 'high'
              ? '🟠'
              : item.priority
                ? '⚪'
                : '';
        teamsCardBody.push({
          type: 'TextBlock',
          text: `${priorityIcon} ${item.text}`,
          wrap: true,
        } as never);
      }
    }
  }

  const teamsCard = {
    type: 'AdaptiveCard',
    version: '1.4',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    body: teamsCardBody,
    actions: [
      {
        type: 'Action.OpenUrl',
        title: t(lang, 'labels.viewMore'),
        url: `${appUrl}/my-work`,
      },
    ],
  };

  return { text, slackBlocks, teamsCard };
}

// Process daily briefings
async function processBriefings(
  supabase: ReturnType<typeof createClient>
): Promise<{ processed: number; errors: number }> {
  // Get due briefings
  const { data: briefings, error } = await supabase.rpc('get_due_bot_briefings');

  if (error) {
    console.error('Failed to get due briefings:', error);
    return { processed: 0, errors: 1 };
  }

  let processed = 0;
  let errors = 0;

  // Get Teams bot token once for all Teams deliveries
  let teamsBotToken: string | null = null;

  for (const briefing of briefings || []) {
    try {
      // Build briefing content
      const content = await buildBriefingContent(supabase, briefing);

      // Send based on platform
      let result: { ok: boolean; error?: string };

      if (briefing.platform === 'slack') {
        if (!briefing.slack_access_token) {
          console.error('Missing Slack access token for briefing:', briefing.schedule_id);
          errors++;
          continue;
        }

        result = await sendSlackMessage(
          briefing.slack_access_token,
          briefing.target_id,
          content.text,
          content.slackBlocks
        );
      } else if (briefing.platform === 'teams') {
        if (!briefing.teams_service_url) {
          console.error('Missing Teams service URL for briefing:', briefing.schedule_id);
          errors++;
          continue;
        }

        if (!teamsBotToken) {
          teamsBotToken = await getTeamsBotToken();
        }

        result = await sendTeamsMessage(
          briefing.teams_service_url,
          briefing.target_id,
          content.text,
          content.teamsCard,
          teamsBotToken
        );
      } else {
        console.error('Unknown platform for briefing:', briefing.platform);
        errors++;
        continue;
      }

      // Update schedule
      await supabase
        .from('bot_briefing_schedules')
        .update({
          last_sent_at: new Date().toISOString(),
          last_status: result.ok ? 'success' : 'failed',
        })
        .eq('id', briefing.schedule_id);

      if (result.ok) {
        processed++;
      } else {
        console.error('Failed to send briefing:', result.error);
        errors++;
      }
    } catch (error) {
      console.error('Error processing briefing:', error);
      errors++;

      // Update schedule with error
      await supabase
        .from('bot_briefing_schedules')
        .update({
          last_sent_at: new Date().toISOString(),
          last_status: 'error',
        })
        .eq('id', briefing.schedule_id);
    }
  }

  return { processed, errors };
}

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient();
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'all';

  const results: {
    notifications?: { sent: number; failed: number };
    briefings?: { processed: number; errors: number };
  } = {};

  try {
    // Process notifications
    if (action === 'all' || action === 'notifications') {
      const { data: pendingDeliveries, error } = await supabase.rpc('get_pending_bot_deliveries', {
        p_platform: null,
        p_limit: 100,
      });

      if (error) {
        console.error('Failed to get pending deliveries:', error);
      } else {
        let sent = 0;
        let failed = 0;

        for (const delivery of pendingDeliveries || []) {
          const result = await processDelivery(supabase, delivery);
          if (result.success) {
            sent++;
          } else {
            failed++;
          }
        }

        results.notifications = { sent, failed };
      }
    }

    // Process briefings
    if (action === 'all' || action === 'briefings') {
      results.briefings = await processBriefings(supabase);
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Dispatcher error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
