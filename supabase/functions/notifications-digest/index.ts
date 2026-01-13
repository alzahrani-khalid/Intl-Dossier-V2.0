// Notification Digest Edge Function
// Sends scheduled daily/weekly digest emails
// Feature: notification-center
// Triggered by: Supabase cron job

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface DigestUser {
  user_id: string;
  email: string;
  full_name: string | null;
  preferred_language: 'en' | 'ar';
  daily_digest_enabled: boolean;
  daily_digest_time: string;
  weekly_digest_enabled: boolean;
  weekly_digest_day: number;
  quiet_hours_timezone: string;
}

interface NotificationSummary {
  category: string;
  count: number;
  priority_high: number;
  latest_title: string;
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
        // Get unread notifications for this user
        const notifications = await getUnreadNotifications(supabase, user.user_id, digestType);

        if (notifications.length === 0) {
          results.skipped++;
          continue;
        }

        // Generate digest content
        const digestContent = generateDigestContent(notifications, user.preferred_language);

        // Queue email
        const emailQueued = await queueDigestEmail(supabase, user, digestContent, digestType);

        if (emailQueued) {
          // Mark notifications as included in digest
          await markNotificationsAsDigested(
            supabase,
            user.user_id,
            notifications.map((n) => n.id)
          );

          // Create digest record
          await createDigestRecord(
            supabase,
            user.user_id,
            digestType,
            notifications.map((n) => n.id)
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
      quiet_hours_timezone
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
    const digestTime = pref.daily_digest_time || '08:00:00';
    const digestHour = parseInt(digestTime.split(':')[0]);

    // Simple timezone offset check (for production, use proper timezone library)
    // This is a simplified version - in production use date-fns-tz or similar
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
        daily_digest_time: pref.daily_digest_time,
        weekly_digest_enabled: pref.weekly_digest_enabled,
        weekly_digest_day: pref.weekly_digest_day,
        quiet_hours_timezone: timezone,
      });
    }
  }

  return result;
}

function isWithinHour(currentHour: number, targetHour: number, timezone: string): boolean {
  // Simplified timezone handling - check if within the target hour
  // For Asia/Riyadh (UTC+3), subtract 3 from UTC hour
  let offset = 0;
  if (timezone === 'Asia/Riyadh') offset = 3;
  else if (timezone === 'Europe/London') offset = 0;
  else if (timezone === 'America/New_York') offset = -5;

  const localHour = (currentHour + offset + 24) % 24;
  return localHour === targetHour;
}

async function getUnreadNotifications(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  digestType: 'daily' | 'weekly'
) {
  // Get notifications from the appropriate time window
  const cutoffDate = new Date();
  if (digestType === 'daily') {
    cutoffDate.setDate(cutoffDate.getDate() - 1);
  } else {
    cutoffDate.setDate(cutoffDate.getDate() - 7);
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .eq('digest_included', false)
    .gte('created_at', cutoffDate.toISOString())
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
}

function generateDigestContent(
  notifications: any[],
  language: 'en' | 'ar'
): { subject: string; html: string; text: string } {
  // Group by category
  const byCategory: Record<string, any[]> = {};
  for (const notification of notifications) {
    const category = notification.category || 'system';
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push(notification);
  }

  const isArabic = language === 'ar';
  const direction = isArabic ? 'rtl' : 'ltr';

  // Category labels
  const categoryLabels: Record<string, { en: string; ar: string }> = {
    assignments: { en: 'Assignments', ar: 'المهام' },
    intake: { en: 'Service Requests', ar: 'طلبات الخدمة' },
    calendar: { en: 'Calendar', ar: 'التقويم' },
    signals: { en: 'Intelligence Signals', ar: 'إشارات الاستخبارات' },
    mentions: { en: 'Mentions', ar: 'الإشارات' },
    deadlines: { en: 'Deadlines', ar: 'المواعيد النهائية' },
    system: { en: 'System', ar: 'النظام' },
    workflow: { en: 'Workflow', ar: 'سير العمل' },
  };

  // Priority colors
  const priorityColors: Record<string, string> = {
    urgent: '#dc2626',
    high: '#ea580c',
    normal: '#3b82f6',
    low: '#6b7280',
  };

  // Build HTML content
  let html = `
    <div dir="${direction}" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">
        ${isArabic ? 'ملخص الإشعارات' : 'Notification Digest'}
      </h1>
      <p style="color: #6b7280; margin-bottom: 30px;">
        ${
          isArabic
            ? `لديك ${notifications.length} إشعار جديد`
            : `You have ${notifications.length} new notification${notifications.length !== 1 ? 's' : ''}`
        }
      </p>
  `;

  let text = `${isArabic ? 'ملخص الإشعارات' : 'Notification Digest'}\n\n`;
  text += `${isArabic ? `لديك ${notifications.length} إشعار جديد` : `You have ${notifications.length} new notification(s)`}\n\n`;

  for (const [category, items] of Object.entries(byCategory)) {
    const label = categoryLabels[category] || { en: category, ar: category };
    const categoryName = isArabic ? label.ar : label.en;

    html += `
      <div style="margin-bottom: 25px;">
        <h2 style="color: #374151; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px;">
          ${categoryName} (${items.length})
        </h2>
    `;
    text += `--- ${categoryName} (${items.length}) ---\n`;

    for (const item of items.slice(0, 5)) {
      const priorityColor = priorityColors[item.priority] || priorityColors.normal;

      html += `
        <div style="background: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 10px; border-left: 4px solid ${priorityColor};">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #1f2937;">${item.title}</p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">${item.message}</p>
          ${
            item.action_url
              ? `
            <a href="${item.action_url}" style="display: inline-block; margin-top: 8px; color: #2563eb; text-decoration: none; font-size: 14px;">
              ${isArabic ? 'عرض التفاصيل' : 'View Details'} →
            </a>
          `
              : ''
          }
        </div>
      `;

      text += `- ${item.title}: ${item.message}\n`;
      if (item.action_url) {
        text += `  ${item.action_url}\n`;
      }
    }

    if (items.length > 5) {
      html += `
        <p style="color: #6b7280; font-size: 14px;">
          ${
            isArabic
              ? `+${items.length - 5} إشعارات أخرى`
              : `+${items.length - 5} more notification(s)`
          }
        </p>
      `;
      text += `  +${items.length - 5} more\n`;
    }

    html += '</div>';
    text += '\n';
  }

  html += `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
        <a href="\${APP_URL}/notifications" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          ${isArabic ? 'عرض جميع الإشعارات' : 'View All Notifications'}
        </a>
        <p style="margin-top: 20px; color: #9ca3af; font-size: 12px;">
          ${
            isArabic
              ? 'الهيئة العامة للإحصاء - نظام الملف الدولي'
              : 'General Authority for Statistics - International Dossier System'
          }
        </p>
      </div>
    </div>
  `;

  const subject = isArabic
    ? `ملخص الإشعارات: ${notifications.length} إشعار جديد`
    : `Notification Digest: ${notifications.length} new notification${notifications.length !== 1 ? 's' : ''}`;

  return { subject, html, text };
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
  notificationIds: string[]
): Promise<void> {
  const { error } = await supabase.from('notification_digests').insert({
    user_id: userId,
    digest_type: digestType,
    scheduled_for: new Date().toISOString(),
    status: 'sent',
    notification_count: notificationIds.length,
    notification_ids: notificationIds,
    sent_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Error creating digest record:', error);
  }
}
