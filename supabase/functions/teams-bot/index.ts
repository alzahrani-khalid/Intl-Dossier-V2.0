// Microsoft Teams Bot Edge Function
// Handles Teams bot messages, commands, and adaptive cards
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface TeamsActivity {
  type: string;
  id?: string;
  timestamp?: string;
  serviceUrl: string;
  channelId: string;
  from: {
    id: string;
    name?: string;
    aadObjectId?: string;
  };
  conversation: {
    id: string;
    conversationType?: string;
    tenantId?: string;
    isGroup?: boolean;
    name?: string;
  };
  recipient: {
    id: string;
    name?: string;
  };
  text?: string;
  textFormat?: string;
  locale?: string;
  channelData?: {
    tenant?: { id: string };
    team?: { id: string; name?: string };
    channel?: { id: string; name?: string };
  };
  value?: Record<string, unknown>;
}

interface AdaptiveCard {
  type: string;
  version: string;
  body: Array<{
    type: string;
    text?: string;
    size?: string;
    weight?: string;
    wrap?: boolean;
    style?: string;
    color?: string;
    items?: Array<{
      type: string;
      text?: string;
      columns?: Array<{
        type: string;
        width?: string;
        items?: Array<{ type: string; text?: string }>;
      }>;
    }>;
    columns?: Array<{
      type: string;
      width?: string;
      items?: Array<{ type: string; text?: string; size?: string; weight?: string }>;
    }>;
    facts?: Array<{ title: string; value: string }>;
  }>;
  actions?: Array<{
    type: string;
    title: string;
    url?: string;
    data?: Record<string, unknown>;
    style?: string;
  }>;
  $schema?: string;
}

// Translations (same as Slack bot)
const translations = {
  en: {
    help: {
      title: 'Intl-Dossier Bot Commands',
      description: 'Here are the available commands:',
      search: 'search [query] - Search for entities',
      briefing: 'briefing - Get your daily briefing',
      status: 'status - Check your pending work',
      link: 'link - Link your account',
      subscribe: 'subscribe - Subscribe channel to notifications',
      unsubscribe: 'unsubscribe - Unsubscribe from notifications',
    },
    errors: {
      notLinked: "Your Teams account is not linked. Type 'link' to connect your account.",
      noResults: 'No results found for your search.',
      unknownCommand: "Unknown command. Type 'help' for available commands.",
      serverError: 'An error occurred. Please try again later.',
    },
    messages: {
      linkInstructions: 'Click the button below to link your Intl-Dossier account:',
      linkButton: 'Link Account',
      searchResults: 'Search Results',
      briefingTitle: 'Your Daily Briefing',
      statusTitle: 'Your Work Status',
      subscribed: 'This channel is now subscribed to notifications.',
      unsubscribed: 'This channel has been unsubscribed from notifications.',
      noAssignments: 'No pending assignments.',
      noDeadlines: 'No upcoming deadlines.',
      noCommitments: 'No active commitments.',
      welcome: "Hello! I'm the Intl-Dossier bot. Type 'help' to see available commands.",
    },
    labels: {
      assignments: 'Pending Assignments',
      deadlines: 'Upcoming Deadlines',
      commitments: 'Active Commitments',
      calendar: "Today's Events",
      viewMore: 'View More',
      type: 'Type',
      status: 'Status',
      priority: 'Priority',
      deadline: 'Deadline',
    },
  },
  ar: {
    help: {
      title: 'أوامر بوت الملف الدولي',
      description: 'هذه هي الأوامر المتاحة:',
      search: 'search [استعلام] - البحث عن الكيانات',
      briefing: 'briefing - احصل على ملخصك اليومي',
      status: 'status - تحقق من أعمالك المعلقة',
      link: 'link - ربط حسابك',
      subscribe: 'subscribe - اشترك القناة في الإشعارات',
      unsubscribe: 'unsubscribe - إلغاء الاشتراك من الإشعارات',
    },
    errors: {
      notLinked: "حسابك في Teams غير مرتبط. اكتب 'link' لربط حسابك.",
      noResults: 'لم يتم العثور على نتائج لبحثك.',
      unknownCommand: "أمر غير معروف. اكتب 'help' للأوامر المتاحة.",
      serverError: 'حدث خطأ. يرجى المحاولة مرة أخرى لاحقاً.',
    },
    messages: {
      linkInstructions: 'انقر على الزر أدناه لربط حسابك في Intl-Dossier:',
      linkButton: 'ربط الحساب',
      searchResults: 'نتائج البحث',
      briefingTitle: 'ملخصك اليومي',
      statusTitle: 'حالة عملك',
      subscribed: 'هذه القناة الآن مشتركة في الإشعارات.',
      unsubscribed: 'تم إلغاء اشتراك هذه القناة من الإشعارات.',
      noAssignments: 'لا توجد مهام معلقة.',
      noDeadlines: 'لا توجد مواعيد نهائية قادمة.',
      noCommitments: 'لا توجد التزامات نشطة.',
      welcome: "مرحباً! أنا بوت Intl-Dossier. اكتب 'help' لرؤية الأوامر المتاحة.",
    },
    labels: {
      assignments: 'المهام المعلقة',
      deadlines: 'المواعيد النهائية القادمة',
      commitments: 'الالتزامات النشطة',
      calendar: 'أحداث اليوم',
      viewMore: 'عرض المزيد',
      type: 'النوع',
      status: 'الحالة',
      priority: 'الأولوية',
      deadline: 'الموعد النهائي',
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

// Find user by Teams ID
async function findUserByTeamsId(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  userId: string
) {
  const { data, error } = await supabase.rpc('find_user_by_teams_id', {
    p_teams_tenant_id: tenantId,
    p_teams_user_id: userId,
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0];
}

// Send message back to Teams
async function sendTeamsMessage(
  serviceUrl: string,
  conversationId: string,
  message: string | AdaptiveCard,
  botToken: string
): Promise<void> {
  const isCard = typeof message !== 'string';

  const body = {
    type: 'message',
    from: { id: Deno.env.get('TEAMS_BOT_ID') || '' },
    conversation: { id: conversationId },
    ...(isCard
      ? {
          attachments: [
            {
              contentType: 'application/vnd.microsoft.card.adaptive',
              content: message,
            },
          ],
        }
      : { text: message }),
  };

  const response = await fetch(`${serviceUrl}v3/conversations/${conversationId}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${botToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to send Teams message:', errorText);
    throw new Error(`Failed to send Teams message: ${response.status}`);
  }
}

// Get Bot Framework token
async function getBotToken(): Promise<string> {
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
    throw new Error('Failed to get bot token');
  }

  return data.access_token;
}

// Build help adaptive card
function buildHelpCard(lang: string): AdaptiveCard {
  return {
    type: 'AdaptiveCard',
    version: '1.4',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    body: [
      {
        type: 'TextBlock',
        text: t(lang, 'help.title'),
        size: 'Large',
        weight: 'Bolder',
      },
      {
        type: 'TextBlock',
        text: t(lang, 'help.description'),
        wrap: true,
      },
      {
        type: 'FactSet',
        facts: [
          { title: 'search', value: t(lang, 'help.search') },
          { title: 'briefing', value: t(lang, 'help.briefing') },
          { title: 'status', value: t(lang, 'help.status') },
          { title: 'link', value: t(lang, 'help.link') },
          { title: 'subscribe', value: t(lang, 'help.subscribe') },
          { title: 'unsubscribe', value: t(lang, 'help.unsubscribe') },
        ],
      },
    ],
  };
}

// Build link account card
function buildLinkCard(lang: string, verificationUrl: string): AdaptiveCard {
  return {
    type: 'AdaptiveCard',
    version: '1.4',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    body: [
      {
        type: 'TextBlock',
        text: t(lang, 'messages.linkInstructions'),
        wrap: true,
      },
    ],
    actions: [
      {
        type: 'Action.OpenUrl',
        title: t(lang, 'messages.linkButton'),
        url: verificationUrl,
        style: 'positive',
      },
    ],
  };
}

// Build search results card
function buildSearchResultsCard(
  lang: string,
  results: Array<{ id: string; title: string; type: string; description?: string }>,
  appUrl: string
): AdaptiveCard {
  if (results.length === 0) {
    return {
      type: 'AdaptiveCard',
      version: '1.4',
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      body: [
        {
          type: 'TextBlock',
          text: t(lang, 'errors.noResults'),
          wrap: true,
        },
      ],
    };
  }

  return {
    type: 'AdaptiveCard',
    version: '1.4',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    body: [
      {
        type: 'TextBlock',
        text: t(lang, 'messages.searchResults'),
        size: 'Large',
        weight: 'Bolder',
      },
      {
        type: 'Container',
        items: results.slice(0, 5).map((result) => ({
          type: 'ColumnSet',
          columns: [
            {
              type: 'Column',
              width: 'stretch',
              items: [
                {
                  type: 'TextBlock',
                  text: `**${result.title}**`,
                  wrap: true,
                },
                {
                  type: 'TextBlock',
                  text: `${result.type}${
                    result.description ? ` - ${result.description.slice(0, 80)}...` : ''
                  }`,
                  wrap: true,
                  size: 'Small',
                },
              ],
            },
          ],
        })),
      },
    ],
    actions: [
      {
        type: 'Action.OpenUrl',
        title: t(lang, 'labels.viewMore'),
        url: `${appUrl}/search`,
      },
    ],
  };
}

// Build briefing card
function buildBriefingCard(
  lang: string,
  briefingData: {
    assignments: Array<{ title: string; deadline?: string; priority?: string }>;
    deadlines: Array<{ title: string; deadline: string }>;
    calendar: Array<{ title: string; time: string }>;
  },
  appUrl: string
): AdaptiveCard {
  const body: AdaptiveCard['body'] = [
    {
      type: 'TextBlock',
      text: t(lang, 'messages.briefingTitle'),
      size: 'Large',
      weight: 'Bolder',
    },
  ];

  // Assignments section
  body.push({
    type: 'TextBlock',
    text: t(lang, 'labels.assignments'),
    weight: 'Bolder',
    style: 'heading',
  });

  if (briefingData.assignments.length === 0) {
    body.push({
      type: 'TextBlock',
      text: t(lang, 'messages.noAssignments'),
      style: 'default',
    });
  } else {
    for (const assignment of briefingData.assignments.slice(0, 5)) {
      const priorityIcon =
        assignment.priority === 'urgent' ? '🔴' : assignment.priority === 'high' ? '🟠' : '⚪';
      body.push({
        type: 'TextBlock',
        text: `${priorityIcon} ${assignment.title}${
          assignment.deadline ? ` - ${assignment.deadline}` : ''
        }`,
        wrap: true,
      });
    }
  }

  // Deadlines section
  body.push({
    type: 'TextBlock',
    text: t(lang, 'labels.deadlines'),
    weight: 'Bolder',
    style: 'heading',
  });

  if (briefingData.deadlines.length === 0) {
    body.push({
      type: 'TextBlock',
      text: t(lang, 'messages.noDeadlines'),
      style: 'default',
    });
  } else {
    for (const deadline of briefingData.deadlines.slice(0, 5)) {
      body.push({
        type: 'TextBlock',
        text: `📅 ${deadline.title} - **${deadline.deadline}**`,
        wrap: true,
      });
    }
  }

  // Calendar section
  if (briefingData.calendar.length > 0) {
    body.push({
      type: 'TextBlock',
      text: t(lang, 'labels.calendar'),
      weight: 'Bolder',
      style: 'heading',
    });

    for (const event of briefingData.calendar.slice(0, 5)) {
      body.push({
        type: 'TextBlock',
        text: `🕒 ${event.time} - ${event.title}`,
        wrap: true,
      });
    }
  }

  return {
    type: 'AdaptiveCard',
    version: '1.4',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    body,
    actions: [
      {
        type: 'Action.OpenUrl',
        title: t(lang, 'labels.viewMore'),
        url: `${appUrl}/my-work`,
      },
    ],
  };
}

// Parse command from message text
function parseCommand(text: string): { command: string; args: string } {
  const trimmed = text.trim().toLowerCase();
  const parts = trimmed.split(/\s+/);
  const command = parts[0] || 'help';
  const args = parts.slice(1).join(' ');
  return { command, args };
}

// Handle incoming message
async function handleMessage(activity: TeamsActivity): Promise<void> {
  const supabase = getSupabaseClient();
  const appUrl = Deno.env.get('APP_URL') || 'https://intl-dossier.app';
  const tenantId = activity.channelData?.tenant?.id || activity.conversation.tenantId || '';
  const teamId = activity.channelData?.team?.id || '';

  // Get bot token
  const botToken = await getBotToken();

  // Find user link
  const userLink = await findUserByTeamsId(supabase, tenantId, activity.from.id);
  const lang = userLink?.language_preference || 'en';

  // Get or create workspace
  let workspace = null;
  const { data: existingWorkspace } = await supabase
    .from('bot_workspace_connections')
    .select('id')
    .eq('teams_tenant_id', tenantId)
    .eq('status', 'active')
    .single();

  workspace = existingWorkspace;

  // Parse command from message
  const { command, args } = parseCommand(activity.text || '');

  // Log command
  try {
    await supabase.rpc('log_bot_command', {
      p_workspace_id: workspace?.id || null,
      p_user_link_id: userLink?.link_id || null,
      p_platform: 'teams',
      p_command_type:
        command === 'search'
          ? 'search'
          : command === 'briefing'
            ? 'briefing'
            : command === 'status'
              ? 'status'
              : command === 'link'
                ? 'help'
                : command === 'subscribe'
                  ? 'subscribe'
                  : command === 'unsubscribe'
                    ? 'unsubscribe'
                    : 'help',
      p_command_text: activity.text || '',
      p_command_args: { command, args },
      p_channel_id: activity.conversation.id,
      p_channel_name: activity.channelData?.channel?.name || '',
      p_teams_user_id: activity.from.id,
    });
  } catch (e) {
    console.error('Failed to log command:', e);
  }

  let response: string | AdaptiveCard;

  try {
    switch (command) {
      case 'help':
        response = buildHelpCard(lang);
        break;

      case 'link': {
        const verificationCode = crypto.randomUUID().slice(0, 8).toUpperCase();
        const verificationUrl = `${appUrl}/settings/integrations?verify=teams&code=${verificationCode}&teams_user=${activity.from.id}&tenant_id=${tenantId}`;

        // Store verification code if workspace exists
        if (workspace && !userLink) {
          await supabase.from('bot_user_links').upsert(
            {
              workspace_id: workspace.id,
              platform: 'teams',
              teams_user_id: activity.from.id,
              teams_display_name: activity.from.name,
              teams_aad_object_id: activity.from.aadObjectId,
              verification_code: verificationCode,
              verification_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            },
            { onConflict: 'workspace_id,teams_user_id' }
          );
        }

        response = buildLinkCard(lang, verificationUrl);
        break;
      }

      case 'search': {
        if (!userLink || !userLink.is_verified) {
          response = t(lang, 'errors.notLinked');
          break;
        }

        if (!args) {
          response = t(lang, 'errors.noResults');
          break;
        }

        // Search entities
        const { data: searchResults } = await supabase
          .from('dossiers')
          .select('id, title, type, overview')
          .or(`title.ilike.%${args}%,overview.ilike.%${args}%`)
          .limit(10);

        response = buildSearchResultsCard(
          lang,
          (searchResults || []).map((r) => ({
            id: r.id,
            title: r.title,
            type: r.type,
            description: r.overview,
          })),
          appUrl
        );
        break;
      }

      case 'briefing':
      case 'status': {
        if (!userLink || !userLink.is_verified) {
          response = t(lang, 'errors.notLinked');
          break;
        }

        // Get user's assignments
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id, title, deadline, priority, status')
          .eq('assignee_id', userLink.user_id)
          .in('status', ['pending', 'in_progress'])
          .order('deadline', { ascending: true })
          .limit(5);

        // Get today's calendar events
        const today = new Date().toISOString().split('T')[0];
        const { data: calendar } = await supabase
          .from('calendar_entries')
          .select('id, title, start_time')
          .gte('start_time', `${today}T00:00:00`)
          .lte('start_time', `${today}T23:59:59`)
          .order('start_time', { ascending: true })
          .limit(5);

        // Get upcoming deadlines
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: deadlines } = await supabase
          .from('assignments')
          .select('id, title, deadline')
          .eq('assignee_id', userLink.user_id)
          .neq('status', 'completed')
          .lte('deadline', nextWeek)
          .order('deadline', { ascending: true })
          .limit(5);

        response = buildBriefingCard(
          lang,
          {
            assignments: (assignments || []).map((a) => ({
              title: a.title,
              deadline: a.deadline
                ? new Date(a.deadline).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')
                : undefined,
              priority: a.priority,
            })),
            deadlines: (deadlines || []).map((d) => ({
              title: d.title,
              deadline: new Date(d.deadline).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US'),
            })),
            calendar: (calendar || []).map((e) => ({
              title: e.title,
              time: new Date(e.start_time).toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            })),
          },
          appUrl
        );
        break;
      }

      case 'subscribe': {
        if (!workspace) {
          response = t(lang, 'errors.serverError');
          break;
        }

        await supabase.from('bot_channel_subscriptions').upsert(
          {
            workspace_id: workspace.id,
            platform: 'teams',
            channel_id: activity.conversation.id,
            channel_name: activity.channelData?.channel?.name || '',
            is_active: true,
            created_by: userLink?.user_id || null,
          },
          { onConflict: 'workspace_id,channel_id' }
        );

        response = t(lang, 'messages.subscribed');
        break;
      }

      case 'unsubscribe': {
        if (!workspace) {
          response = t(lang, 'errors.serverError');
          break;
        }

        await supabase
          .from('bot_channel_subscriptions')
          .update({ is_active: false })
          .eq('workspace_id', workspace.id)
          .eq('channel_id', activity.conversation.id);

        response = t(lang, 'messages.unsubscribed');
        break;
      }

      default:
        response = t(lang, 'errors.unknownCommand');
    }
  } catch (error) {
    console.error('Command error:', error);
    response = t(lang, 'errors.serverError');
  }

  // Send response
  await sendTeamsMessage(activity.serviceUrl, activity.conversation.id, response, botToken);
}

// Handle conversation update (bot added/removed)
async function handleConversationUpdate(activity: TeamsActivity): Promise<void> {
  const botToken = await getBotToken();
  const lang = 'en'; // Default language for welcome message

  // Check if bot was added
  if (activity.type === 'conversationUpdate') {
    // Send welcome message
    await sendTeamsMessage(
      activity.serviceUrl,
      activity.conversation.id,
      t(lang, 'messages.welcome'),
      botToken
    );
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const activity: TeamsActivity = await req.json();

    console.log('Received Teams activity:', activity.type);

    switch (activity.type) {
      case 'message':
        await handleMessage(activity);
        break;

      case 'conversationUpdate':
        await handleConversationUpdate(activity);
        break;

      case 'invoke':
        // Handle card action invokes
        console.log('Invoke activity:', activity.value);
        break;

      default:
        console.log('Unhandled activity type:', activity.type);
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error handling Teams activity:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
