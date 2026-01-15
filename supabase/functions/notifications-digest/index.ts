// Notification Digest Edge Function
// Sends scheduled daily/weekly digest emails with personalized content
// Feature: email-digest-configuration
// Triggered by: Supabase cron job

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const appUrl = Deno.env.get('APP_URL') || 'https://intl-dossier.gastat.gov.sa';

interface DigestUser {
  user_id: string;
  email: string;
  full_name: string | null;
  preferred_language: 'en' | 'ar';
  daily_digest_enabled: boolean;
  daily_digest_time: string;
  weekly_digest_enabled: boolean;
  weekly_digest_day: number;
  weekly_digest_time: string;
  quiet_hours_timezone: string;
  // Content preferences
  digest_include_watchlist: boolean;
  digest_include_deadlines: boolean;
  digest_include_unresolved_tickets: boolean;
  digest_include_assignments: boolean;
  digest_include_commitments: boolean;
  digest_include_mentions: boolean;
  digest_include_calendar: boolean;
  digest_deadline_lookahead_days: number;
  digest_max_items_per_section: number;
}

interface DigestContent {
  notifications: any[];
  watchedEntities: any[];
  upcomingDeadlines: any[];
  unresolvedTickets: any[];
  pendingAssignments: any[];
  activeCommitments: any[];
  recentMentions: any[];
  upcomingCalendar: any[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create admin Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { digestType } = await req.json().catch(() => ({ digestType: 'daily' }));

    console.log(`Processing ${digestType} digest`);

    // Get users who are due for a digest
    const usersToProcess = await getUsersForDigest(supabase, digestType);
    console.log(`Found ${usersToProcess.length} users for ${digestType} digest`);

    const results = {
      processed: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const user of usersToProcess) {
      try {
        // Get personalized digest content based on user preferences
        const digestContent = await getPersonalizedDigestContent(supabase, user, digestType);

        // Check if there's any content to send
        const hasContent =
          digestContent.notifications.length > 0 ||
          digestContent.watchedEntities.length > 0 ||
          digestContent.upcomingDeadlines.length > 0 ||
          digestContent.unresolvedTickets.length > 0 ||
          digestContent.pendingAssignments.length > 0 ||
          digestContent.activeCommitments.length > 0 ||
          digestContent.recentMentions.length > 0 ||
          digestContent.upcomingCalendar.length > 0;

        if (!hasContent) {
          results.skipped++;
          continue;
        }

        // Generate digest HTML content
        const emailContent = generateEnhancedDigestContent(digestContent, user);

        // Queue email
        const emailQueued = await queueDigestEmail(supabase, user, emailContent, digestType);

        if (emailQueued) {
          // Mark notifications as included in digest
          if (digestContent.notifications.length > 0) {
            await markNotificationsAsDigested(
              supabase,
              user.user_id,
              digestContent.notifications.map((n) => n.id)
            );
          }

          // Create digest record
          await createDigestRecord(
            supabase,
            user.user_id,
            digestType,
            digestContent.notifications.map((n) => n.id),
            digestContent
          );

          results.processed++;
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error(`Error processing digest for user ${user.user_id}:`, error);
        results.failed++;
        results.errors.push(`User ${user.user_id}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        digestType,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing digests:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getUsersForDigest(
  supabase: ReturnType<typeof createClient>,
  digestType: 'daily' | 'weekly'
): Promise<DigestUser[]> {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentDay = now.getUTCDay(); // 0 = Sunday

  let query = supabase
    .from('email_notification_preferences')
    .select(
      `
      user_id,
      preferred_language,
      daily_digest_enabled,
      daily_digest_time,
      weekly_digest_enabled,
      weekly_digest_day,
      weekly_digest_time,
      quiet_hours_timezone,
      digest_include_watchlist,
      digest_include_deadlines,
      digest_include_unresolved_tickets,
      digest_include_assignments,
      digest_include_commitments,
      digest_include_mentions,
      digest_include_calendar,
      digest_deadline_lookahead_days,
      digest_max_items_per_section
    `
    )
    .eq('email_notifications_enabled', true);

  if (digestType === 'daily') {
    query = query.eq('daily_digest_enabled', true);
  } else {
    query = query.eq('weekly_digest_enabled', true);
  }

  const { data: preferences, error: prefsError } = await query;

  if (prefsError) {
    console.error('Error fetching preferences:', prefsError);
    return [];
  }

  // Get user details for those preferences
  const userIds = preferences?.map((p) => p.user_id) || [];
  if (userIds.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name')
    .in('id', userIds);

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return [];
  }

  // Combine preferences with user data and filter by time
  const result: DigestUser[] = [];

  for (const pref of preferences || []) {
    const user = users?.find((u) => u.id === pref.user_id);
    if (!user) continue;

    // Check if it's the right time for this user
    const timezone = pref.quiet_hours_timezone || 'UTC';
    const digestTime =
      digestType === 'daily'
        ? pref.daily_digest_time || '08:00'
        : pref.weekly_digest_time || '08:00';
    const digestHour = parseInt(digestTime.split(':')[0]);

    const shouldSend =
      digestType === 'daily'
        ? isWithinHour(currentHour, digestHour, timezone)
        : currentDay === pref.weekly_digest_day && isWithinHour(currentHour, digestHour, timezone);

    if (shouldSend) {
      result.push({
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
        preferred_language: pref.preferred_language || 'en',
        daily_digest_enabled: pref.daily_digest_enabled,
        daily_digest_time: pref.daily_digest_time || '08:00',
        weekly_digest_enabled: pref.weekly_digest_enabled,
        weekly_digest_day: pref.weekly_digest_day,
        weekly_digest_time: pref.weekly_digest_time || '08:00',
        quiet_hours_timezone: timezone,
        digest_include_watchlist: pref.digest_include_watchlist ?? true,
        digest_include_deadlines: pref.digest_include_deadlines ?? true,
        digest_include_unresolved_tickets: pref.digest_include_unresolved_tickets ?? true,
        digest_include_assignments: pref.digest_include_assignments ?? true,
        digest_include_commitments: pref.digest_include_commitments ?? true,
        digest_include_mentions: pref.digest_include_mentions ?? true,
        digest_include_calendar: pref.digest_include_calendar ?? true,
        digest_deadline_lookahead_days: pref.digest_deadline_lookahead_days ?? 7,
        digest_max_items_per_section: pref.digest_max_items_per_section ?? 10,
      });
    }
  }

  return result;
}

function isWithinHour(currentHour: number, targetHour: number, timezone: string): boolean {
  // Simplified timezone handling
  const timezoneOffsets: Record<string, number> = {
    UTC: 0,
    'Asia/Riyadh': 3,
    'Asia/Dubai': 4,
    'Europe/London': 0,
    'Europe/Paris': 1,
    'America/New_York': -5,
    'America/Los_Angeles': -8,
    'Africa/Cairo': 2,
  };

  const offset = timezoneOffsets[timezone] || 0;
  const localHour = (currentHour + offset + 24) % 24;
  return localHour === targetHour;
}

async function getPersonalizedDigestContent(
  supabase: ReturnType<typeof createClient>,
  user: DigestUser,
  digestType: 'daily' | 'weekly'
): Promise<DigestContent> {
  const cutoffDate = new Date();
  if (digestType === 'daily') {
    cutoffDate.setDate(cutoffDate.getDate() - 1);
  } else {
    cutoffDate.setDate(cutoffDate.getDate() - 7);
  }

  const deadlineCutoff = new Date();
  deadlineCutoff.setDate(deadlineCutoff.getDate() + user.digest_deadline_lookahead_days);

  const maxItems = user.digest_max_items_per_section;

  const content: DigestContent = {
    notifications: [],
    watchedEntities: [],
    upcomingDeadlines: [],
    unresolvedTickets: [],
    pendingAssignments: [],
    activeCommitments: [],
    recentMentions: [],
    upcomingCalendar: [],
  };

  // Get unread notifications (always included)
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.user_id)
    .eq('read', false)
    .eq('digest_included', false)
    .gte('created_at', cutoffDate.toISOString())
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(maxItems);

  content.notifications = notifications || [];

  // Get watched entities activity
  if (user.digest_include_watchlist) {
    const { data: watchlist } = await supabase
      .from('user_watchlist')
      .select(
        `
        id,
        entity_type,
        entity_id,
        custom_label,
        priority,
        created_at
      `
      )
      .eq('user_id', user.user_id)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(maxItems);

    // Get recent events for watched entities
    if (watchlist && watchlist.length > 0) {
      const watchIds = watchlist.map((w) => w.id);
      const { data: events } = await supabase
        .from('watchlist_events')
        .select('*')
        .in('watch_id', watchIds)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(maxItems);

      content.watchedEntities = (watchlist || []).map((w) => ({
        ...w,
        recent_events: (events || []).filter((e) => e.watch_id === w.id).length,
      }));
    }
  }

  // Get upcoming deadlines
  if (user.digest_include_deadlines) {
    // From assignments/tasks
    const { data: taskDeadlines } = await supabase
      .from('assignments')
      .select('id, title, deadline, priority, status')
      .eq('assignee_id', user.user_id)
      .in('status', ['pending', 'in_progress'])
      .lte('deadline', deadlineCutoff.toISOString())
      .gte('deadline', new Date().toISOString())
      .order('deadline', { ascending: true })
      .limit(maxItems);

    // From commitments
    const { data: commitmentDeadlines } = await supabase
      .from('commitments')
      .select('id, title, deadline, priority, status')
      .eq('assignee_id', user.user_id)
      .in('status', ['pending', 'in_progress'])
      .lte('deadline', deadlineCutoff.toISOString())
      .gte('deadline', new Date().toISOString())
      .order('deadline', { ascending: true })
      .limit(maxItems);

    content.upcomingDeadlines = [
      ...(taskDeadlines || []).map((t) => ({ ...t, type: 'task' })),
      ...(commitmentDeadlines || []).map((c) => ({ ...c, type: 'commitment' })),
    ]
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, maxItems);
  }

  // Get unresolved tickets
  if (user.digest_include_unresolved_tickets) {
    const { data: tickets } = await supabase
      .from('intake_tickets')
      .select('id, subject, status, priority, created_at, updated_at')
      .eq('assigned_to', user.user_id)
      .in('status', ['open', 'in_progress', 'pending'])
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(maxItems);

    content.unresolvedTickets = tickets || [];
  }

  // Get pending assignments
  if (user.digest_include_assignments) {
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, title, status, priority, deadline, created_at')
      .eq('assignee_id', user.user_id)
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: false })
      .order('deadline', { ascending: true })
      .limit(maxItems);

    content.pendingAssignments = assignments || [];
  }

  // Get active commitments
  if (user.digest_include_commitments) {
    const { data: commitments } = await supabase
      .from('commitments')
      .select('id, title, status, priority, deadline, engagement_id')
      .eq('assignee_id', user.user_id)
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: false })
      .order('deadline', { ascending: true })
      .limit(maxItems);

    content.activeCommitments = commitments || [];
  }

  // Get recent mentions
  if (user.digest_include_mentions) {
    const { data: mentions } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.user_id)
      .eq('category', 'mentions')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(maxItems);

    content.recentMentions = mentions || [];
  }

  // Get upcoming calendar events
  if (user.digest_include_calendar) {
    const { data: events } = await supabase
      .from('calendar_entries')
      .select('id, title, start_date, end_date, event_type, description')
      .gte('start_date', new Date().toISOString())
      .lte('start_date', deadlineCutoff.toISOString())
      .order('start_date', { ascending: true })
      .limit(maxItems);

    content.upcomingCalendar = events || [];
  }

  return content;
}

function generateEnhancedDigestContent(
  content: DigestContent,
  user: DigestUser
): { subject: string; html: string; text: string } {
  const isArabic = user.preferred_language === 'ar';
  const direction = isArabic ? 'rtl' : 'ltr';

  const labels = {
    title: isArabic ? 'ملخص النشاط الخاص بك' : 'Your Activity Digest',
    notifications: isArabic ? 'الإشعارات' : 'Notifications',
    watchedEntities: isArabic ? 'الكيانات المراقبة' : 'Watched Entities',
    upcomingDeadlines: isArabic ? 'المواعيد النهائية القادمة' : 'Upcoming Deadlines',
    unresolvedTickets: isArabic ? 'التذاكر غير المحلولة' : 'Unresolved Tickets',
    assignments: isArabic ? 'المهام المعلقة' : 'Pending Assignments',
    commitments: isArabic ? 'الالتزامات النشطة' : 'Active Commitments',
    mentions: isArabic ? 'الإشارات الأخيرة' : 'Recent Mentions',
    calendar: isArabic ? 'أحداث التقويم القادمة' : 'Upcoming Calendar Events',
    viewAll: isArabic ? 'عرض الكل' : 'View All',
    viewDetails: isArabic ? 'عرض التفاصيل' : 'View Details',
    dueIn: isArabic ? 'مستحق في' : 'Due in',
    days: isArabic ? 'أيام' : 'days',
    activity: isArabic ? 'نشاط' : 'activity',
  };

  const priorityColors: Record<string, string> = {
    urgent: '#dc2626',
    high: '#ea580c',
    normal: '#3b82f6',
    medium: '#3b82f6',
    low: '#6b7280',
  };

  let totalItems = 0;
  let html = `
    <!DOCTYPE html>
    <html dir="${direction}" lang="${user.preferred_language}">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${labels.title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${labels.title}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
              ${isArabic ? `مرحباً ${user.full_name || ''}` : `Hello ${user.full_name || ''}`}
            </p>
          </div>

          <div style="padding: 20px;">
  `;

  let text = `${labels.title}\n`;
  text += `${isArabic ? `مرحباً ${user.full_name || ''}` : `Hello ${user.full_name || ''}`}\n\n`;

  // Notifications Section
  if (content.notifications.length > 0) {
    totalItems += content.notifications.length;
    html += generateSection(
      labels.notifications,
      content.notifications,
      isArabic,
      priorityColors,
      (item) => `
      <div style="background: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 10px; border-${isArabic ? 'right' : 'left'}: 4px solid ${priorityColors[item.priority] || priorityColors.normal};">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #1f2937; font-size: 14px;">${item.title}</p>
        <p style="margin: 0; color: #6b7280; font-size: 13px;">${item.message || ''}</p>
      </div>
    `
    );
    text += `--- ${labels.notifications} (${content.notifications.length}) ---\n`;
    content.notifications.forEach((n) => {
      text += `- ${n.title}: ${n.message || ''}\n`;
    });
    text += '\n';
  }

  // Upcoming Deadlines Section
  if (content.upcomingDeadlines.length > 0) {
    totalItems += content.upcomingDeadlines.length;
    html += generateSection(
      labels.upcomingDeadlines,
      content.upcomingDeadlines,
      isArabic,
      priorityColors,
      (item) => {
        const daysUntil = Math.ceil(
          (new Date(item.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return `
        <div style="background: #fef3c7; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <p style="margin: 0; font-weight: 600; color: #92400e; font-size: 14px;">${item.title}</p>
            <span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
              ${labels.dueIn} ${daysUntil} ${labels.days}
            </span>
          </div>
        </div>
      `;
      }
    );
    text += `--- ${labels.upcomingDeadlines} (${content.upcomingDeadlines.length}) ---\n`;
    content.upcomingDeadlines.forEach((d) => {
      const daysUntil = Math.ceil(
        (new Date(d.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      text += `- ${d.title} (${labels.dueIn} ${daysUntil} ${labels.days})\n`;
    });
    text += '\n';
  }

  // Watched Entities Section
  if (content.watchedEntities.length > 0) {
    totalItems += content.watchedEntities.length;
    html += generateSection(
      labels.watchedEntities,
      content.watchedEntities,
      isArabic,
      priorityColors,
      (item) => `
      <div style="background: #f0fdf4; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <p style="margin: 0; font-weight: 600; color: #166534; font-size: 14px;">${item.custom_label || item.entity_type}</p>
          ${item.recent_events > 0 ? `<span style="background: #22c55e; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${item.recent_events} ${labels.activity}</span>` : ''}
        </div>
      </div>
    `
    );
    text += `--- ${labels.watchedEntities} (${content.watchedEntities.length}) ---\n`;
    content.watchedEntities.forEach((w) => {
      text += `- ${w.custom_label || w.entity_type} (${w.recent_events || 0} ${labels.activity})\n`;
    });
    text += '\n';
  }

  // Unresolved Tickets Section
  if (content.unresolvedTickets.length > 0) {
    totalItems += content.unresolvedTickets.length;
    html += generateSection(
      labels.unresolvedTickets,
      content.unresolvedTickets,
      isArabic,
      priorityColors,
      (item) => `
      <div style="background: #fef2f2; border-radius: 8px; padding: 12px; margin-bottom: 10px; border-${isArabic ? 'right' : 'left'}: 4px solid ${priorityColors[item.priority] || priorityColors.normal};">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #991b1b; font-size: 14px;">${item.subject}</p>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">Status: ${item.status}</p>
      </div>
    `
    );
    text += `--- ${labels.unresolvedTickets} (${content.unresolvedTickets.length}) ---\n`;
    content.unresolvedTickets.forEach((t) => {
      text += `- ${t.subject} (${t.status})\n`;
    });
    text += '\n';
  }

  // Pending Assignments Section
  if (content.pendingAssignments.length > 0) {
    totalItems += content.pendingAssignments.length;
    html += generateSection(
      labels.assignments,
      content.pendingAssignments,
      isArabic,
      priorityColors,
      (item) => `
      <div style="background: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 10px; border-${isArabic ? 'right' : 'left'}: 4px solid ${priorityColors[item.priority] || priorityColors.normal};">
        <p style="margin: 0; font-weight: 600; color: #1f2937; font-size: 14px;">${item.title}</p>
      </div>
    `
    );
    text += `--- ${labels.assignments} (${content.pendingAssignments.length}) ---\n`;
    content.pendingAssignments.forEach((a) => {
      text += `- ${a.title}\n`;
    });
    text += '\n';
  }

  // Active Commitments Section
  if (content.activeCommitments.length > 0) {
    totalItems += content.activeCommitments.length;
    html += generateSection(
      labels.commitments,
      content.activeCommitments,
      isArabic,
      priorityColors,
      (item) => `
      <div style="background: #eff6ff; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
        <p style="margin: 0; font-weight: 600; color: #1e40af; font-size: 14px;">${item.title}</p>
      </div>
    `
    );
    text += `--- ${labels.commitments} (${content.activeCommitments.length}) ---\n`;
    content.activeCommitments.forEach((c) => {
      text += `- ${c.title}\n`;
    });
    text += '\n';
  }

  // Upcoming Calendar Section
  if (content.upcomingCalendar.length > 0) {
    totalItems += content.upcomingCalendar.length;
    html += generateSection(
      labels.calendar,
      content.upcomingCalendar,
      isArabic,
      priorityColors,
      (item) => {
        const eventDate = new Date(item.start_date).toLocaleDateString(
          user.preferred_language === 'ar' ? 'ar-SA' : 'en-US',
          {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }
        );
        return `
        <div style="background: #faf5ff; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <p style="margin: 0; font-weight: 600; color: #7c3aed; font-size: 14px;">${item.title}</p>
            <span style="color: #6b7280; font-size: 12px;">${eventDate}</span>
          </div>
        </div>
      `;
      }
    );
    text += `--- ${labels.calendar} (${content.upcomingCalendar.length}) ---\n`;
    content.upcomingCalendar.forEach((e) => {
      const eventDate = new Date(e.start_date).toLocaleDateString();
      text += `- ${e.title} (${eventDate})\n`;
    });
    text += '\n';
  }

  // Footer
  html += `
          </div>

          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <a href="${appUrl}/my-work" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
              ${isArabic ? 'عرض لوحة العمل' : 'View Dashboard'}
            </a>
            <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
              ${isArabic ? 'الهيئة العامة للإحصاء - نظام الملف الدولي' : 'General Authority for Statistics - International Dossier System'}
            </p>
            <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 11px;">
              <a href="${appUrl}/settings/email-digest" style="color: #6b7280; text-decoration: underline;">
                ${isArabic ? 'إدارة تفضيلات الملخص' : 'Manage digest preferences'}
              </a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = isArabic
    ? `ملخص النشاط: ${totalItems} عنصر`
    : `Activity Digest: ${totalItems} item${totalItems !== 1 ? 's' : ''}`;

  return { subject, html, text };
}

function generateSection(
  title: string,
  items: any[],
  isArabic: boolean,
  priorityColors: Record<string, string>,
  renderItem: (item: any) => string
): string {
  if (items.length === 0) return '';

  return `
    <div style="margin-bottom: 24px;">
      <h2 style="color: #374151; font-size: 16px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">
        ${title} <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h2>
      ${items.slice(0, 5).map(renderItem).join('')}
      ${items.length > 5 ? `<p style="color: #6b7280; font-size: 13px; margin: 8px 0 0 0;">+${items.length - 5} ${isArabic ? 'المزيد' : 'more'}</p>` : ''}
    </div>
  `;
}

async function queueDigestEmail(
  supabase: ReturnType<typeof createClient>,
  user: DigestUser,
  content: { subject: string; html: string; text: string },
  digestType: string
): Promise<boolean> {
  const { error } = await supabase.from('email_queue').insert({
    to_email: user.email,
    to_name: user.full_name,
    subject: content.subject,
    body_html: content.html,
    body_text: content.text,
    template_type: digestType === 'daily' ? 'digest_daily' : 'digest_weekly',
    language: user.preferred_language,
    user_id: user.user_id,
    priority: 3, // Lower priority than transactional emails
  });

  if (error) {
    console.error('Error queueing digest email:', error);
    return false;
  }

  return true;
}

async function markNotificationsAsDigested(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  notificationIds: string[]
): Promise<void> {
  if (notificationIds.length === 0) return;

  const { error } = await supabase
    .from('notifications')
    .update({ digest_included: true })
    .eq('user_id', userId)
    .in('id', notificationIds);

  if (error) {
    console.error('Error marking notifications as digested:', error);
  }
}

async function createDigestRecord(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  digestType: string,
  notificationIds: string[],
  content: DigestContent
): Promise<void> {
  const totalItems =
    notificationIds.length +
    content.watchedEntities.length +
    content.upcomingDeadlines.length +
    content.unresolvedTickets.length +
    content.pendingAssignments.length +
    content.activeCommitments.length +
    content.recentMentions.length +
    content.upcomingCalendar.length;

  const { error } = await supabase.from('notification_digests').insert({
    user_id: userId,
    digest_type: digestType,
    scheduled_for: new Date().toISOString(),
    status: 'sent',
    notification_count: totalItems,
    notification_ids: notificationIds,
    sent_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Error creating digest record:', error);
  }
}
