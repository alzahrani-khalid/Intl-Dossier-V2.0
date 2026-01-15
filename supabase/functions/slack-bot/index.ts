// Slack Bot Edge Function
// Handles OAuth callbacks, slash commands, and interactive components
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface SlackEvent {
  type: string;
  challenge?: string;
  event?: {
    type: string;
    user?: string;
    channel?: string;
    text?: string;
    ts?: string;
  };
  team_id?: string;
}

interface SlackSlashCommand {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: Array<{
    type: string;
    text?: { type: string; text: string; emoji?: boolean };
    action_id?: string;
    url?: string;
    value?: string;
    style?: string;
  }>;
  accessory?: {
    type: string;
    action_id: string;
    text: { type: string; text: string };
    value?: string;
  };
  fields?: Array<{ type: string; text: string }>;
}

// Translations
const translations = {
  en: {
    help: {
      title: 'Intl-Dossier Bot Commands',
      search: '*/dossier search [query]* - Search for entities',
      briefing: '*/dossier briefing* - Get your daily briefing',
      status: '*/dossier status* - Check your pending work',
      create: '*/dossier create [type]* - Start entity creation',
      link: '*/dossier link* - Link your account',
      subscribe: '*/dossier subscribe* - Subscribe channel to notifications',
      unsubscribe: '*/dossier unsubscribe* - Unsubscribe from notifications',
    },
    errors: {
      notLinked: 'Your Slack account is not linked. Use `/dossier link` to connect.',
      noResults: 'No results found for your search.',
      unknownCommand: 'Unknown command. Use `/dossier help` for available commands.',
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
      search: '*/dossier search [استعلام]* - البحث عن الكيانات',
      briefing: '*/dossier briefing* - احصل على ملخصك اليومي',
      status: '*/dossier status* - تحقق من أعمالك المعلقة',
      create: '*/dossier create [نوع]* - بدء إنشاء كيان',
      link: '*/dossier link* - ربط حسابك',
      subscribe: '*/dossier subscribe* - اشترك القناة في الإشعارات',
      unsubscribe: '*/dossier unsubscribe* - إلغاء الاشتراك من الإشعارات',
    },
    errors: {
      notLinked: 'حسابك في Slack غير مرتبط. استخدم `/dossier link` للاتصال.',
      noResults: 'لم يتم العثور على نتائج لبحثك.',
      unknownCommand: 'أمر غير معروف. استخدم `/dossier help` للأوامر المتاحة.',
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

// Find user by Slack ID
async function findUserBySlackId(
  supabase: ReturnType<typeof createClient>,
  teamId: string,
  userId: string
) {
  const { data, error } = await supabase.rpc('find_user_by_slack_id', {
    p_slack_team_id: teamId,
    p_slack_user_id: userId,
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0];
}

// Log bot command
async function logCommand(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string | null,
  userLinkId: string | null,
  commandType: string,
  commandText: string,
  commandArgs: Record<string, unknown>,
  channelId: string,
  channelName: string,
  slackUserId: string
) {
  try {
    const { data } = await supabase.rpc('log_bot_command', {
      p_workspace_id: workspaceId,
      p_user_link_id: userLinkId,
      p_platform: 'slack',
      p_command_type: commandType,
      p_command_text: commandText,
      p_command_args: commandArgs,
      p_channel_id: channelId,
      p_channel_name: channelName,
      p_slack_user_id: slackUserId,
    });
    return data;
  } catch (e) {
    console.error('Failed to log command:', e);
    return null;
  }
}

// Update command response
async function updateCommandResponse(
  supabase: ReturnType<typeof createClient>,
  logId: string,
  responseType: string,
  responseMessage: string,
  responseData: Record<string, unknown>,
  responseTimeMs: number,
  errorCode?: string,
  errorDetails?: string
) {
  try {
    await supabase.rpc('update_bot_command_response', {
      p_log_id: logId,
      p_response_type: responseType,
      p_response_message: responseMessage,
      p_response_data: responseData,
      p_response_time_ms: responseTimeMs,
      p_error_code: errorCode || null,
      p_error_details: errorDetails || null,
    });
  } catch (e) {
    console.error('Failed to update command response:', e);
  }
}

// Build Slack blocks for help command
function buildHelpBlocks(lang: string): SlackBlock[] {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: t(lang, 'help.title'), emoji: true },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: t(lang, 'help.search') },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: t(lang, 'help.briefing') },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: t(lang, 'help.status') },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: t(lang, 'help.create') },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: t(lang, 'help.link') },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: t(lang, 'help.subscribe') },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: t(lang, 'help.unsubscribe') },
    },
  ];
}

// Build link account blocks
function buildLinkBlocks(lang: string, verificationUrl: string): SlackBlock[] {
  return [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: t(lang, 'messages.linkInstructions') },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: t(lang, 'messages.linkButton'), emoji: true },
          url: verificationUrl,
          action_id: 'link_account',
          style: 'primary',
        },
      ],
    },
  ];
}

// Build search results blocks
function buildSearchResultsBlocks(
  lang: string,
  results: Array<{ id: string; title: string; type: string; description?: string }>,
  appUrl: string
): SlackBlock[] {
  if (results.length === 0) {
    return [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: t(lang, 'errors.noResults') },
      },
    ];
  }

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: t(lang, 'messages.searchResults'), emoji: true },
    },
  ];

  for (const result of results.slice(0, 10)) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${appUrl}/dossier/${result.id}|${result.title}>*\n${result.type}${
          result.description ? ` - ${result.description.slice(0, 100)}...` : ''
        }`,
      },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', text: t(lang, 'labels.viewMore') },
        action_id: `view_entity_${result.id}`,
        url: `${appUrl}/dossier/${result.id}`,
      },
    });
  }

  return blocks;
}

// Build briefing blocks
function buildBriefingBlocks(
  lang: string,
  briefingData: {
    assignments: Array<{ title: string; deadline?: string; priority?: string }>;
    deadlines: Array<{ title: string; deadline: string }>;
    commitments: Array<{ title: string; status?: string }>;
    calendar: Array<{ title: string; time: string }>;
  },
  appUrl: string
): SlackBlock[] {
  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: t(lang, 'messages.briefingTitle'), emoji: true },
    },
  ];

  // Assignments section
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${t(lang, 'labels.assignments')}*`,
    },
  });

  if (briefingData.assignments.length === 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `_${t(lang, 'messages.noAssignments')}_` },
    });
  } else {
    for (const assignment of briefingData.assignments.slice(0, 5)) {
      const priorityEmoji =
        assignment.priority === 'urgent'
          ? ':red_circle:'
          : assignment.priority === 'high'
            ? ':orange_circle:'
            : ':white_circle:';
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${priorityEmoji} ${assignment.title}${
            assignment.deadline ? ` - _${assignment.deadline}_` : ''
          }`,
        },
      });
    }
  }

  blocks.push({ type: 'divider' } as SlackBlock);

  // Deadlines section
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${t(lang, 'labels.deadlines')}*`,
    },
  });

  if (briefingData.deadlines.length === 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `_${t(lang, 'messages.noDeadlines')}_` },
    });
  } else {
    for (const deadline of briefingData.deadlines.slice(0, 5)) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:calendar: ${deadline.title} - *${deadline.deadline}*`,
        },
      });
    }
  }

  blocks.push({ type: 'divider' } as SlackBlock);

  // Calendar section
  if (briefingData.calendar.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${t(lang, 'labels.calendar')}*`,
      },
    });

    for (const event of briefingData.calendar.slice(0, 5)) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:clock3: ${event.time} - ${event.title}`,
        },
      });
    }

    blocks.push({ type: 'divider' } as SlackBlock);
  }

  // View more button
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: t(lang, 'labels.viewMore'), emoji: true },
        url: `${appUrl}/my-work`,
        action_id: 'view_dashboard',
      },
    ],
  });

  return blocks;
}

// Handle slash commands
async function handleSlashCommand(command: SlackSlashCommand): Promise<Response> {
  const supabase = getSupabaseClient();
  const startTime = Date.now();
  const appUrl = Deno.env.get('APP_URL') || 'https://intl-dossier.app';

  // Parse command
  const parts = command.text.trim().split(/\s+/);
  const subCommand = parts[0]?.toLowerCase() || 'help';
  const args = parts.slice(1).join(' ');

  // Find user link
  const userLink = await findUserBySlackId(supabase, command.team_id, command.user_id);
  const lang = userLink?.language_preference || 'en';

  // Get workspace
  const { data: workspace } = await supabase
    .from('bot_workspace_connections')
    .select('id')
    .eq('slack_team_id', command.team_id)
    .eq('status', 'active')
    .single();

  // Log command
  const logId = await logCommand(
    supabase,
    workspace?.id || null,
    userLink?.link_id || null,
    subCommand === 'search'
      ? 'search'
      : subCommand === 'briefing'
        ? 'briefing'
        : subCommand === 'status'
          ? 'status'
          : subCommand === 'create'
            ? 'create'
            : subCommand === 'link'
              ? 'help'
              : subCommand === 'subscribe'
                ? 'subscribe'
                : subCommand === 'unsubscribe'
                  ? 'unsubscribe'
                  : 'help',
    command.text,
    { subCommand, args },
    command.channel_id,
    command.channel_name,
    command.user_id
  );

  let blocks: SlackBlock[] = [];
  let responseType = 'success';
  let errorCode: string | undefined;
  let errorDetails: string | undefined;

  try {
    switch (subCommand) {
      case 'help':
        blocks = buildHelpBlocks(lang);
        break;

      case 'link': {
        // Generate verification code
        const verificationCode = crypto.randomUUID().slice(0, 8).toUpperCase();
        const verificationUrl = `${appUrl}/settings/integrations?verify=slack&code=${verificationCode}&slack_user=${command.user_id}&team_id=${command.team_id}`;

        // Store verification code if workspace exists
        if (workspace && !userLink) {
          await supabase.from('bot_user_links').upsert(
            {
              workspace_id: workspace.id,
              platform: 'slack',
              slack_user_id: command.user_id,
              slack_user_name: command.user_name,
              verification_code: verificationCode,
              verification_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            },
            { onConflict: 'workspace_id,slack_user_id' }
          );
        }

        blocks = buildLinkBlocks(lang, verificationUrl);
        break;
      }

      case 'search': {
        if (!userLink || !userLink.is_verified) {
          blocks = [
            { type: 'section', text: { type: 'mrkdwn', text: t(lang, 'errors.notLinked') } },
          ];
          responseType = 'error';
          errorCode = 'NOT_LINKED';
          break;
        }

        if (!args) {
          blocks = [
            { type: 'section', text: { type: 'mrkdwn', text: t(lang, 'errors.noResults') } },
          ];
          break;
        }

        // Search entities
        const { data: searchResults } = await supabase
          .from('dossiers')
          .select('id, title, type, overview')
          .or(`title.ilike.%${args}%,overview.ilike.%${args}%`)
          .limit(10);

        blocks = buildSearchResultsBlocks(
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
          blocks = [
            { type: 'section', text: { type: 'mrkdwn', text: t(lang, 'errors.notLinked') } },
          ];
          responseType = 'error';
          errorCode = 'NOT_LINKED';
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

        // Get user's commitments
        const { data: commitments } = await supabase
          .from('commitments')
          .select('id, description, status, due_date')
          .eq('owner_id', userLink.user_id)
          .neq('status', 'completed')
          .order('due_date', { ascending: true })
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

        blocks = buildBriefingBlocks(
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
            commitments: (commitments || []).map((c) => ({
              title: c.description?.slice(0, 50) || 'Commitment',
              status: c.status,
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
          blocks = [
            { type: 'section', text: { type: 'mrkdwn', text: t(lang, 'errors.serverError') } },
          ];
          responseType = 'error';
          errorCode = 'NO_WORKSPACE';
          break;
        }

        // Create or update channel subscription
        await supabase.from('bot_channel_subscriptions').upsert(
          {
            workspace_id: workspace.id,
            platform: 'slack',
            channel_id: command.channel_id,
            channel_name: command.channel_name,
            is_active: true,
            created_by: userLink?.user_id || null,
          },
          { onConflict: 'workspace_id,channel_id' }
        );

        blocks = [
          { type: 'section', text: { type: 'mrkdwn', text: t(lang, 'messages.subscribed') } },
        ];
        break;
      }

      case 'unsubscribe': {
        if (!workspace) {
          blocks = [
            { type: 'section', text: { type: 'mrkdwn', text: t(lang, 'errors.serverError') } },
          ];
          responseType = 'error';
          errorCode = 'NO_WORKSPACE';
          break;
        }

        // Deactivate channel subscription
        await supabase
          .from('bot_channel_subscriptions')
          .update({ is_active: false })
          .eq('workspace_id', workspace.id)
          .eq('channel_id', command.channel_id);

        blocks = [
          { type: 'section', text: { type: 'mrkdwn', text: t(lang, 'messages.unsubscribed') } },
        ];
        break;
      }

      default:
        blocks = [
          { type: 'section', text: { type: 'mrkdwn', text: t(lang, 'errors.unknownCommand') } },
        ];
        responseType = 'error';
        errorCode = 'UNKNOWN_COMMAND';
    }
  } catch (error) {
    console.error('Command error:', error);
    blocks = [{ type: 'section', text: { type: 'mrkdwn', text: t(lang, 'errors.serverError') } }];
    responseType = 'error';
    errorCode = 'SERVER_ERROR';
    errorDetails = error instanceof Error ? error.message : String(error);
  }

  // Update command log
  if (logId) {
    await updateCommandResponse(
      supabase,
      logId,
      responseType,
      blocks[0]?.text?.text || '',
      { blocks },
      Date.now() - startTime,
      errorCode,
      errorDetails
    );
  }

  return new Response(
    JSON.stringify({
      response_type: 'ephemeral',
      blocks,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Handle OAuth callback
async function handleOAuthCallback(code: string, state: string): Promise<Response> {
  const supabase = getSupabaseClient();
  const clientId = Deno.env.get('SLACK_CLIENT_ID');
  const clientSecret = Deno.env.get('SLACK_CLIENT_SECRET');
  const redirectUri = Deno.env.get('SLACK_REDIRECT_URI');
  const appUrl = Deno.env.get('APP_URL') || 'https://intl-dossier.app';

  if (!clientId || !clientSecret) {
    return Response.redirect(`${appUrl}/settings/integrations?error=missing_config`);
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri || '',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error('OAuth error:', tokenData.error);
      return Response.redirect(`${appUrl}/settings/integrations?error=oauth_failed`);
    }

    // Store workspace connection
    const { data: existingWorkspace } = await supabase
      .from('bot_workspace_connections')
      .select('id')
      .eq('slack_team_id', tokenData.team.id)
      .single();

    if (existingWorkspace) {
      // Update existing workspace
      await supabase
        .from('bot_workspace_connections')
        .update({
          slack_access_token: tokenData.access_token,
          slack_bot_user_id: tokenData.bot_user_id,
          slack_team_name: tokenData.team.name,
          slack_app_id: tokenData.app_id,
          status: 'active',
          scopes: tokenData.scope?.split(',') || [],
          connected_at: new Date().toISOString(),
        })
        .eq('id', existingWorkspace.id);
    } else {
      // Create new workspace
      await supabase.from('bot_workspace_connections').insert({
        platform: 'slack',
        slack_team_id: tokenData.team.id,
        slack_team_name: tokenData.team.name,
        slack_access_token: tokenData.access_token,
        slack_bot_user_id: tokenData.bot_user_id,
        slack_app_id: tokenData.app_id,
        status: 'active',
        scopes: tokenData.scope?.split(',') || [],
        connected_by: state || null, // state contains the user_id who initiated OAuth
      });
    }

    return Response.redirect(`${appUrl}/settings/integrations?success=slack`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.redirect(`${appUrl}/settings/integrations?error=server_error`);
  }
}

// Handle events from Slack
async function handleEvent(event: SlackEvent): Promise<Response> {
  // URL verification challenge
  if (event.type === 'url_verification' && event.challenge) {
    return new Response(event.challenge, {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }

  // Handle other events (app_mention, message, etc.)
  if (event.event) {
    const supabase = getSupabaseClient();

    switch (event.event.type) {
      case 'app_mention':
        // Bot was mentioned - could trigger help or search
        console.log('Bot mentioned:', event.event.text);
        break;

      case 'member_joined_channel':
        // Bot was added to a channel
        console.log('Bot joined channel:', event.event.channel);
        break;

      default:
        console.log('Unhandled event type:', event.event.type);
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    // OAuth callback
    if (url.pathname.endsWith('/oauth') || url.searchParams.has('code')) {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      if (code) {
        return handleOAuthCallback(code, state || '');
      }
    }

    // Check content type
    const contentType = req.headers.get('content-type') || '';

    // Slash command (form-urlencoded)
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      const command: SlackSlashCommand = {
        token: formData.get('token') as string,
        team_id: formData.get('team_id') as string,
        team_domain: formData.get('team_domain') as string,
        channel_id: formData.get('channel_id') as string,
        channel_name: formData.get('channel_name') as string,
        user_id: formData.get('user_id') as string,
        user_name: formData.get('user_name') as string,
        command: formData.get('command') as string,
        text: formData.get('text') as string,
        response_url: formData.get('response_url') as string,
        trigger_id: formData.get('trigger_id') as string,
      };

      return handleSlashCommand(command);
    }

    // Event API (JSON)
    if (contentType.includes('application/json')) {
      const event: SlackEvent = await req.json();
      return handleEvent(event);
    }

    return new Response(JSON.stringify({ error: 'Unsupported request type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error handling request:', error);
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
