/**
 * Supabase Edge Function: Contextual Suggestions
 * Feature: intelligent-empty-states
 *
 * Provides contextually relevant suggestions for empty states based on:
 * - Current date and time
 * - Upcoming events and engagements
 * - Expiring MOUs
 * - Overdue commitments
 * - Seasonal/organizational calendar events (UN General Assembly, etc.)
 * - Anniversary dates (bilateral relations, MOU signings)
 *
 * Endpoints:
 * GET /contextual-suggestions?context=<page_context>&limit=<n>
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Types
type SuggestionCategory =
  | 'upcoming_event'
  | 'expiring_mou'
  | 'overdue_commitment'
  | 'pending_task'
  | 'seasonal'
  | 'anniversary'
  | 'quick_action';

type SuggestionPriority = 'high' | 'medium' | 'low';

type SuggestionContext =
  | 'dashboard'
  | 'calendar'
  | 'dossier'
  | 'engagement'
  | 'commitment'
  | 'task'
  | 'document'
  | 'global';

interface ContextualSuggestion {
  id: string;
  category: SuggestionCategory;
  priority: SuggestionPriority;
  context: SuggestionContext[];
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  action_label_en: string;
  action_label_ar: string;
  action_route?: string;
  action_params?: Record<string, string>;
  relevant_until?: string;
  days_until_event?: number;
  related_entity_type?: string;
  related_entity_id?: string;
  related_entity_name_en?: string;
  related_entity_name_ar?: string;
  icon?: string;
  badge_text_en?: string;
  badge_text_ar?: string;
  badge_variant?: 'default' | 'warning' | 'danger' | 'success';
}

interface ContextualSuggestionsResponse {
  suggestions: ContextualSuggestion[];
  metadata: {
    generated_at: string;
    reference_date: string;
    total_available: number;
    context: SuggestionContext;
    upcoming_events_count: number;
    expiring_mous_count: number;
    overdue_commitments_count: number;
  };
}

// Organizational calendar events
const SEASONAL_EVENTS = [
  {
    id: 'un_general_assembly',
    name_en: 'UN General Assembly',
    name_ar: 'الجمعية العامة للأمم المتحدة',
    month: 9, // September
    day: 15, // Typically starts mid-September
    duration_days: 14,
    preparation_days: 30,
  },
  {
    id: 'g20_summit',
    name_en: 'G20 Summit',
    name_ar: 'قمة مجموعة العشرين',
    month: 11, // November (varies)
    day: 15,
    duration_days: 3,
    preparation_days: 45,
  },
  {
    id: 'annual_bilateral_review',
    name_en: 'Annual Bilateral Review',
    name_ar: 'المراجعة الثنائية السنوية',
    month: 1, // January
    day: 15,
    duration_days: 30,
    preparation_days: 30,
  },
  {
    id: 'q1_review',
    name_en: 'Q1 Commitment Review',
    name_ar: 'مراجعة التزامات الربع الأول',
    month: 3,
    day: 20,
    duration_days: 10,
    preparation_days: 14,
  },
  {
    id: 'q2_review',
    name_en: 'Q2 Commitment Review',
    name_ar: 'مراجعة التزامات الربع الثاني',
    month: 6,
    day: 20,
    duration_days: 10,
    preparation_days: 14,
  },
  {
    id: 'q3_review',
    name_en: 'Q3 Commitment Review',
    name_ar: 'مراجعة التزامات الربع الثالث',
    month: 9,
    day: 20,
    duration_days: 10,
    preparation_days: 14,
  },
  {
    id: 'q4_review',
    name_en: 'Q4 Commitment Review & Annual Planning',
    name_ar: 'مراجعة التزامات الربع الرابع والتخطيط السنوي',
    month: 12,
    day: 1,
    duration_days: 30,
    preparation_days: 30,
  },
  {
    id: 'budget_planning',
    name_en: 'Budget Planning Cycle',
    name_ar: 'دورة تخطيط الميزانية',
    month: 10, // October
    day: 1,
    duration_days: 60,
    preparation_days: 60,
  },
];

// Initialize Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({
        error: 'method_not_allowed',
        message: 'Only GET method allowed',
        message_ar: 'يسمح فقط بطلب GET',
      }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'unauthorized',
          message: 'Authorization header required',
          message_ar: 'مطلوب رأس التفويض',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get user from token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: 'unauthorized',
          message: 'Invalid or expired token',
          message_ar: 'رمز غير صالح أو منتهي الصلاحية',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const context = (url.searchParams.get('context') || 'global') as SuggestionContext;
    const entityType = url.searchParams.get('entity_type') || undefined;
    const entityId = url.searchParams.get('entity_id') || undefined;
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)), 20);
    const includeLowPriority = url.searchParams.get('include_low_priority') === 'true';
    const referenceDateParam = url.searchParams.get('reference_date');
    const referenceDate = referenceDateParam ? new Date(referenceDateParam) : new Date();

    // Generate suggestions
    const response = await generateSuggestions(
      supabase,
      user.id,
      context,
      entityType,
      entityId,
      limit,
      includeLowPriority,
      referenceDate
    );

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Contextual suggestions error:', error);
    return new Response(
      JSON.stringify({
        error: 'internal_server_error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        message_ar: 'حدث خطأ غير متوقع',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Generate contextual suggestions based on various data sources
 */
async function generateSuggestions(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  context: SuggestionContext,
  entityType: string | undefined,
  entityId: string | undefined,
  limit: number,
  includeLowPriority: boolean,
  referenceDate: Date
): Promise<ContextualSuggestionsResponse> {
  const suggestions: ContextualSuggestion[] = [];
  let upcomingEventsCount = 0;
  let expiringMousCount = 0;
  let overdueCommitmentsCount = 0;

  // Run all data fetching in parallel
  const [upcomingEvents, expiringMous, overdueCommitments, pendingTasks] = await Promise.all([
    getUpcomingEvents(supabase, referenceDate, context),
    getExpiringMous(supabase, referenceDate),
    getOverdueCommitments(supabase, userId, referenceDate),
    getPendingTasks(supabase, userId),
  ]);

  upcomingEventsCount = upcomingEvents.length;
  expiringMousCount = expiringMous.length;
  overdueCommitmentsCount = overdueCommitments.length;

  // Add upcoming events suggestions
  for (const event of upcomingEvents.slice(0, 3)) {
    suggestions.push(event);
  }

  // Add expiring MOUs suggestions
  for (const mou of expiringMous.slice(0, 2)) {
    suggestions.push(mou);
  }

  // Add overdue commitments (high priority)
  for (const commitment of overdueCommitments.slice(0, 2)) {
    suggestions.push(commitment);
  }

  // Add seasonal suggestions
  const seasonalSuggestions = getSeasonalSuggestions(referenceDate, context);
  for (const seasonal of seasonalSuggestions.slice(0, 2)) {
    suggestions.push(seasonal);
  }

  // Add quick actions for empty states
  if (context === 'dashboard' || context === 'global') {
    const quickActions = getQuickActionSuggestions(context);
    for (const action of quickActions.slice(0, 2)) {
      suggestions.push(action);
    }
  }

  // Add pending tasks suggestions
  if (pendingTasks.length > 0 && (context === 'dashboard' || context === 'task')) {
    for (const task of pendingTasks.slice(0, 2)) {
      suggestions.push(task);
    }
  }

  // Filter by priority if needed
  let filteredSuggestions = includeLowPriority
    ? suggestions
    : suggestions.filter((s) => s.priority !== 'low');

  // Sort by priority (high > medium > low)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  filteredSuggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Apply limit
  filteredSuggestions = filteredSuggestions.slice(0, limit);

  return {
    suggestions: filteredSuggestions,
    metadata: {
      generated_at: new Date().toISOString(),
      reference_date: referenceDate.toISOString(),
      total_available: suggestions.length,
      context,
      upcoming_events_count: upcomingEventsCount,
      expiring_mous_count: expiringMousCount,
      overdue_commitments_count: overdueCommitmentsCount,
    },
  };
}

/**
 * Get upcoming events/engagements
 */
async function getUpcomingEvents(
  supabase: ReturnType<typeof createClient>,
  referenceDate: Date,
  context: SuggestionContext
): Promise<ContextualSuggestion[]> {
  const suggestions: ContextualSuggestion[] = [];
  const futureDate = new Date(referenceDate);
  futureDate.setDate(futureDate.getDate() + 30); // Look 30 days ahead

  try {
    // Get upcoming engagements from engagement_dossiers table
    const { data: engagements, error } = await supabase
      .from('engagement_dossiers')
      .select(
        `
        id,
        dossier_id,
        start_date,
        end_date,
        engagement_type,
        location_en,
        location_ar,
        engagement_status,
        dossiers:dossier_id (
          name_en,
          name_ar
        )
      `
      )
      .gte('start_date', referenceDate.toISOString().split('T')[0])
      .lte('start_date', futureDate.toISOString().split('T')[0])
      .in('engagement_status', ['planned', 'confirmed'])
      .order('start_date', { ascending: true })
      .limit(5);

    if (!error && engagements) {
      for (const eng of engagements) {
        const startDate = new Date(eng.start_date);
        const daysUntil = Math.ceil(
          (startDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const dossier = eng.dossiers as { name_en: string; name_ar: string } | null;

        const isUrgent = daysUntil <= 7;

        suggestions.push({
          id: `event-${eng.id}`,
          category: 'upcoming_event',
          priority: isUrgent ? 'high' : 'medium',
          context: ['dashboard', 'calendar', 'engagement'],
          title_en: `Prepare for ${dossier?.name_en || 'Upcoming Engagement'}`,
          title_ar: `التحضير لـ ${dossier?.name_ar || 'الارتباط القادم'}`,
          description_en: `${dossier?.name_en || 'Engagement'} is scheduled for ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${eng.location_en ? ` in ${eng.location_en}` : ''}. Review briefings and prepare materials.`,
          description_ar: `${dossier?.name_ar || 'الارتباط'} مجدول في ${startDate.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}${eng.location_ar ? ` في ${eng.location_ar}` : ''}. راجع الإحاطات وحضر المواد.`,
          action_label_en: 'View Engagement',
          action_label_ar: 'عرض الارتباط',
          action_route: `/engagements/${eng.dossier_id}`,
          relevant_until: eng.start_date,
          days_until_event: daysUntil,
          related_entity_type: 'engagement',
          related_entity_id: eng.dossier_id,
          related_entity_name_en: dossier?.name_en,
          related_entity_name_ar: dossier?.name_ar,
          icon: 'calendar',
          badge_text_en: daysUntil <= 7 ? `${daysUntil} days` : undefined,
          badge_text_ar: daysUntil <= 7 ? `${daysUntil} أيام` : undefined,
          badge_variant: isUrgent ? 'danger' : 'warning',
        });
      }
    }

    // Also check calendar_entries
    const { data: calendarEntries } = await supabase
      .from('calendar_entries')
      .select('id, title_en, title_ar, start_datetime, end_datetime, entry_type, location')
      .gte('start_datetime', referenceDate.toISOString())
      .lte('start_datetime', futureDate.toISOString())
      .order('start_datetime', { ascending: true })
      .limit(5);

    if (calendarEntries) {
      for (const entry of calendarEntries) {
        const startDate = new Date(entry.start_datetime);
        const daysUntil = Math.ceil(
          (startDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const isUrgent = daysUntil <= 3;

        suggestions.push({
          id: `calendar-${entry.id}`,
          category: 'upcoming_event',
          priority: isUrgent ? 'high' : 'medium',
          context: ['dashboard', 'calendar'],
          title_en: entry.title_en || 'Upcoming Event',
          title_ar: entry.title_ar || 'فعالية قادمة',
          description_en: `Scheduled for ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}${entry.location ? ` at ${entry.location}` : ''}.`,
          description_ar: `مجدول في ${startDate.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}${entry.location ? ` في ${entry.location}` : ''}.`,
          action_label_en: 'View Event',
          action_label_ar: 'عرض الفعالية',
          action_route: '/calendar',
          action_params: { date: entry.start_datetime.split('T')[0] },
          relevant_until: entry.start_datetime,
          days_until_event: daysUntil,
          related_entity_type: 'calendar_entry',
          related_entity_id: entry.id,
          icon: 'calendar-days',
          badge_text_en: daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : undefined,
          badge_text_ar: daysUntil === 0 ? 'اليوم' : daysUntil === 1 ? 'غداً' : undefined,
          badge_variant: isUrgent ? 'danger' : 'default',
        });
      }
    }
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
  }

  return suggestions;
}

/**
 * Get expiring MOUs
 */
async function getExpiringMous(
  supabase: ReturnType<typeof createClient>,
  referenceDate: Date
): Promise<ContextualSuggestion[]> {
  const suggestions: ContextualSuggestion[] = [];
  const futureDate = new Date(referenceDate);
  futureDate.setDate(futureDate.getDate() + 90); // Look 90 days ahead

  try {
    const { data: mous, error } = await supabase
      .from('mous')
      .select(
        `
        id,
        title_en,
        title_ar,
        expiry_date,
        status,
        counterparty_dossier_id,
        dossiers:counterparty_dossier_id (
          name_en,
          name_ar
        )
      `
      )
      .gte('expiry_date', referenceDate.toISOString().split('T')[0])
      .lte('expiry_date', futureDate.toISOString().split('T')[0])
      .in('status', ['active', 'pending_renewal'])
      .order('expiry_date', { ascending: true })
      .limit(5);

    if (!error && mous) {
      for (const mou of mous) {
        const expiryDate = new Date(mou.expiry_date);
        const daysUntil = Math.ceil(
          (expiryDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const counterparty = mou.dossiers as { name_en: string; name_ar: string } | null;

        const isUrgent = daysUntil <= 30;

        suggestions.push({
          id: `mou-${mou.id}`,
          category: 'expiring_mou',
          priority: isUrgent ? 'high' : 'medium',
          context: ['dashboard', 'dossier'],
          title_en: `MOU Expiring: ${mou.title_en || 'Agreement'}`,
          title_ar: `مذكرة تفاهم تنتهي: ${mou.title_ar || 'اتفاقية'}`,
          description_en: `MOU with ${counterparty?.name_en || 'partner'} expires on ${expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. ${daysUntil <= 30 ? 'Initiate renewal process.' : 'Review and plan renewal.'}`,
          description_ar: `مذكرة التفاهم مع ${counterparty?.name_ar || 'الشريك'} تنتهي في ${expiryDate.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' })}. ${daysUntil <= 30 ? 'ابدأ عملية التجديد.' : 'راجع وخطط للتجديد.'}`,
          action_label_en: 'Review MOU',
          action_label_ar: 'مراجعة المذكرة',
          action_route: `/mous/${mou.id}`,
          relevant_until: mou.expiry_date,
          days_until_event: daysUntil,
          related_entity_type: 'mou',
          related_entity_id: mou.id,
          related_entity_name_en: mou.title_en,
          related_entity_name_ar: mou.title_ar,
          icon: 'file-warning',
          badge_text_en: `${daysUntil} days`,
          badge_text_ar: `${daysUntil} يوم`,
          badge_variant: isUrgent ? 'danger' : 'warning',
        });
      }
    }
  } catch (error) {
    console.error('Error fetching expiring MOUs:', error);
  }

  return suggestions;
}

/**
 * Get overdue commitments
 */
async function getOverdueCommitments(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  referenceDate: Date
): Promise<ContextualSuggestion[]> {
  const suggestions: ContextualSuggestion[] = [];

  try {
    const { data: commitments, error } = await supabase
      .from('commitments')
      .select(
        `
        id,
        title_en,
        title_ar,
        deadline,
        status,
        priority,
        assignee_id
      `
      )
      .lt('deadline', referenceDate.toISOString())
      .in('status', ['pending', 'in_progress'])
      .order('deadline', { ascending: true })
      .limit(5);

    if (!error && commitments) {
      for (const commitment of commitments) {
        const deadlineDate = new Date(commitment.deadline);
        const daysOverdue = Math.ceil(
          (referenceDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        suggestions.push({
          id: `commitment-${commitment.id}`,
          category: 'overdue_commitment',
          priority: 'high',
          context: ['dashboard', 'commitment', 'task'],
          title_en: `Overdue: ${commitment.title_en || 'Commitment'}`,
          title_ar: `متأخر: ${commitment.title_ar || 'التزام'}`,
          description_en: `This commitment was due ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago. Take immediate action to address this.`,
          description_ar: `هذا الالتزام متأخر منذ ${daysOverdue} يوم${daysOverdue !== 1 ? '' : ''}. اتخذ إجراء فوري لمعالجة هذا.`,
          action_label_en: 'Update Status',
          action_label_ar: 'تحديث الحالة',
          action_route: `/my-work`,
          action_params: { commitment_id: commitment.id },
          days_until_event: -daysOverdue,
          related_entity_type: 'commitment',
          related_entity_id: commitment.id,
          related_entity_name_en: commitment.title_en,
          related_entity_name_ar: commitment.title_ar,
          icon: 'alert-circle',
          badge_text_en: `${daysOverdue}d overdue`,
          badge_text_ar: `متأخر ${daysOverdue} يوم`,
          badge_variant: 'danger',
        });
      }
    }
  } catch (error) {
    console.error('Error fetching overdue commitments:', error);
  }

  return suggestions;
}

/**
 * Get pending tasks
 */
async function getPendingTasks(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<ContextualSuggestion[]> {
  const suggestions: ContextualSuggestion[] = [];

  try {
    // Try to get from unified work items or tasks table
    const { data: tasks, error } = await supabase
      .from('assignments')
      .select('id, subject_en, subject_ar, due_date, priority, workflow_stage')
      .eq('assignee_id', userId)
      .in('workflow_stage', ['todo', 'in_progress'])
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(3);

    if (!error && tasks) {
      for (const task of tasks) {
        const isHighPriority = task.priority === 'urgent' || task.priority === 'high';

        suggestions.push({
          id: `task-${task.id}`,
          category: 'pending_task',
          priority: isHighPriority ? 'high' : 'medium',
          context: ['dashboard', 'task'],
          title_en: task.subject_en || 'Pending Task',
          title_ar: task.subject_ar || 'مهمة معلقة',
          description_en: task.due_date
            ? `Due ${new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : 'Review and complete this task.',
          description_ar: task.due_date
            ? `تاريخ الاستحقاق ${new Date(task.due_date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}`
            : 'راجع وأكمل هذه المهمة.',
          action_label_en: 'View Task',
          action_label_ar: 'عرض المهمة',
          action_route: '/my-work',
          action_params: { task_id: task.id },
          related_entity_type: 'task',
          related_entity_id: task.id,
          icon: 'timer',
          badge_text_en: isHighPriority ? 'High Priority' : undefined,
          badge_text_ar: isHighPriority ? 'أولوية عالية' : undefined,
          badge_variant: isHighPriority ? 'danger' : 'default',
        });
      }
    }
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
  }

  return suggestions;
}

/**
 * Get seasonal/organizational calendar suggestions
 */
function getSeasonalSuggestions(
  referenceDate: Date,
  context: SuggestionContext
): ContextualSuggestion[] {
  const suggestions: ContextualSuggestion[] = [];
  const year = referenceDate.getFullYear();

  for (const event of SEASONAL_EVENTS) {
    // Check for this year and next year
    for (const checkYear of [year, year + 1]) {
      const eventDate = new Date(checkYear, event.month - 1, event.day);
      const prepStartDate = new Date(eventDate);
      prepStartDate.setDate(prepStartDate.getDate() - event.preparation_days);

      // Only show if we're in the preparation window
      if (referenceDate >= prepStartDate && referenceDate <= eventDate) {
        const daysUntil = Math.ceil(
          (eventDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        suggestions.push({
          id: `seasonal-${event.id}-${checkYear}`,
          category: 'seasonal',
          priority: daysUntil <= 14 ? 'high' : 'medium',
          context: ['dashboard', 'global'],
          title_en: `Prepare for ${event.name_en}`,
          title_ar: `التحضير لـ ${event.name_ar}`,
          description_en: `${event.name_en} ${daysUntil <= 14 ? 'is in' : 'begins in'} ${daysUntil} days. Review briefs, update positions, and prepare materials.`,
          description_ar: `${event.name_ar} ${daysUntil <= 14 ? 'خلال' : 'يبدأ خلال'} ${daysUntil} يوماً. راجع الإحاطات وحدّث المواقف وحضّر المواد.`,
          action_label_en: 'View Calendar',
          action_label_ar: 'عرض التقويم',
          action_route: '/calendar',
          action_params: { date: eventDate.toISOString().split('T')[0] },
          relevant_until: eventDate.toISOString(),
          days_until_event: daysUntil,
          icon: 'calendar',
          badge_text_en: daysUntil <= 7 ? `${daysUntil} days` : undefined,
          badge_text_ar: daysUntil <= 7 ? `${daysUntil} أيام` : undefined,
          badge_variant: daysUntil <= 14 ? 'warning' : 'default',
        });
      }
    }
  }

  return suggestions;
}

/**
 * Get quick action suggestions for empty states
 */
function getQuickActionSuggestions(context: SuggestionContext): ContextualSuggestion[] {
  const suggestions: ContextualSuggestion[] = [];

  // Create dossier suggestion
  suggestions.push({
    id: 'quick-create-dossier',
    category: 'quick_action',
    priority: 'low',
    context: ['dashboard', 'global', 'dossier'],
    title_en: 'Create a Country Dossier',
    title_ar: 'إنشاء ملف دولة',
    description_en: 'Start tracking a bilateral relationship by creating a country dossier.',
    description_ar: 'ابدأ بتتبع علاقة ثنائية من خلال إنشاء ملف دولة.',
    action_label_en: 'Create Dossier',
    action_label_ar: 'إنشاء ملف',
    action_route: '/dossiers/new',
    action_params: { type: 'country' },
    icon: 'rocket',
  });

  // Add engagement suggestion
  suggestions.push({
    id: 'quick-add-engagement',
    category: 'quick_action',
    priority: 'low',
    context: ['dashboard', 'global', 'engagement'],
    title_en: 'Log an Engagement',
    title_ar: 'تسجيل ارتباط',
    description_en: 'Record a meeting, delegation, or official visit.',
    description_ar: 'سجّل اجتماعاً أو وفداً أو زيارة رسمية.',
    action_label_en: 'Add Engagement',
    action_label_ar: 'إضافة ارتباط',
    action_route: '/engagements/new',
    icon: 'rocket',
  });

  // Review commitments suggestion
  suggestions.push({
    id: 'quick-review-commitments',
    category: 'quick_action',
    priority: 'low',
    context: ['dashboard', 'global', 'commitment'],
    title_en: 'Review Your Commitments',
    title_ar: 'مراجعة التزاماتك',
    description_en: 'Check the status of pending commitments and update progress.',
    description_ar: 'تحقق من حالة الالتزامات المعلقة وحدّث التقدم.',
    action_label_en: 'My Work',
    action_label_ar: 'عملي',
    action_route: '/my-work',
    icon: 'target',
  });

  return suggestions;
}
