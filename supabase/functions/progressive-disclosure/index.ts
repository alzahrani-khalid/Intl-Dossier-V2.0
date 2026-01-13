import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

interface HintInteraction {
  hint_id: string;
  hint_context: string;
  page_context: string | null;
  status: string;
  shown_count: number;
  expanded_count: number;
  first_shown_at: string;
  last_shown_at: string;
  dismissed_at: string | null;
  expanded_at: string | null;
  action_taken_at: string | null;
  should_reshow_after: string | null;
  reshow_interval_days: number;
}

interface DisclosurePreferences {
  experience_level: string;
  experience_level_auto_calculated: boolean;
  hints_enabled: boolean;
  show_keyboard_shortcuts: boolean;
  show_advanced_features: boolean;
  hint_delay_ms: number;
  auto_dismiss_seconds: number | null;
  max_hints_per_session: number;
  hint_cooldown_minutes: number;
  total_visits: number;
  total_interactions: number;
  first_visit_at: string;
  last_visit_at: string;
  intermediate_unlock_interactions: number;
  advanced_unlock_interactions: number;
  expert_unlock_interactions: number;
}

interface SessionTracking {
  session_id: string;
  hints_shown: number;
  hints_dismissed: number;
  hints_expanded: number;
  session_started_at: string;
  last_hint_at: string | null;
}

// Transform DB row to camelCase
function transformPreferences(row: any): DisclosurePreferences {
  return {
    experience_level: row.experience_level,
    experience_level_auto_calculated: row.experience_level_auto_calculated,
    hints_enabled: row.hints_enabled,
    show_keyboard_shortcuts: row.show_keyboard_shortcuts,
    show_advanced_features: row.show_advanced_features,
    hint_delay_ms: row.hint_delay_ms,
    auto_dismiss_seconds: row.auto_dismiss_seconds,
    max_hints_per_session: row.max_hints_per_session,
    hint_cooldown_minutes: row.hint_cooldown_minutes,
    total_visits: row.total_visits,
    total_interactions: row.total_interactions,
    first_visit_at: row.first_visit_at,
    last_visit_at: row.last_visit_at,
    intermediate_unlock_interactions: row.intermediate_unlock_interactions,
    advanced_unlock_interactions: row.advanced_unlock_interactions,
    expert_unlock_interactions: row.expert_unlock_interactions,
  };
}

function transformInteraction(row: any): HintInteraction {
  return {
    hint_id: row.hint_id,
    hint_context: row.hint_context,
    page_context: row.page_context,
    status: row.status,
    shown_count: row.shown_count,
    expanded_count: row.expanded_count,
    first_shown_at: row.first_shown_at,
    last_shown_at: row.last_shown_at,
    dismissed_at: row.dismissed_at,
    expanded_at: row.expanded_at,
    action_taken_at: row.action_taken_at,
    should_reshow_after: row.should_reshow_after,
    reshow_interval_days: row.reshow_interval_days,
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace('/progressive-disclosure', '');

    // GET /progressive-disclosure - Get user's disclosure data
    if (req.method === 'GET' && (path === '' || path === '/')) {
      const sessionId = url.searchParams.get('sessionId');

      // Get or create preferences
      const { data: prefs, error: prefsError } = await supabase.rpc(
        'get_or_create_disclosure_preferences',
        { p_user_id: user.id }
      );

      if (prefsError) {
        console.error('Error getting preferences:', prefsError);
        return new Response(JSON.stringify({ success: false, error: prefsError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get all interactions
      const { data: interactions, error: interactionsError } = await supabase
        .from('user_hint_interactions')
        .select('*')
        .eq('user_id', user.id);

      if (interactionsError) {
        console.error('Error getting interactions:', interactionsError);
        return new Response(JSON.stringify({ success: false, error: interactionsError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get or create session tracking
      let session: SessionTracking;
      if (sessionId) {
        const { data: existingSession, error: sessionError } = await supabase
          .from('session_hint_tracking')
          .select('*')
          .eq('user_id', user.id)
          .eq('session_id', sessionId)
          .single();

        if (sessionError || !existingSession) {
          // Create new session
          const { data: newSession, error: createError } = await supabase
            .from('session_hint_tracking')
            .insert({
              user_id: user.id,
              session_id: sessionId,
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating session:', createError);
            session = {
              session_id: sessionId,
              hints_shown: 0,
              hints_dismissed: 0,
              hints_expanded: 0,
              session_started_at: new Date().toISOString(),
              last_hint_at: null,
            };
          } else {
            session = {
              session_id: newSession.session_id,
              hints_shown: newSession.hints_shown,
              hints_dismissed: newSession.hints_dismissed,
              hints_expanded: newSession.hints_expanded,
              session_started_at: newSession.session_started_at,
              last_hint_at: newSession.last_hint_at,
            };
          }
        } else {
          session = {
            session_id: existingSession.session_id,
            hints_shown: existingSession.hints_shown,
            hints_dismissed: existingSession.hints_dismissed,
            hints_expanded: existingSession.hints_expanded,
            session_started_at: existingSession.session_started_at,
            last_hint_at: existingSession.last_hint_at,
          };
        }
      } else {
        session = {
          session_id: '',
          hints_shown: 0,
          hints_dismissed: 0,
          hints_expanded: 0,
          session_started_at: new Date().toISOString(),
          last_hint_at: null,
        };
      }

      // Transform to camelCase for frontend
      const responseData = {
        preferences: {
          userId: user.id,
          experienceLevel: prefs.experience_level,
          experienceLevelAutoCalculated: prefs.experience_level_auto_calculated,
          hintsEnabled: prefs.hints_enabled,
          showKeyboardShortcuts: prefs.show_keyboard_shortcuts,
          showAdvancedFeatures: prefs.show_advanced_features,
          hintDelayMs: prefs.hint_delay_ms,
          autoDismissSeconds: prefs.auto_dismiss_seconds,
          maxHintsPerSession: prefs.max_hints_per_session,
          hintCooldownMinutes: prefs.hint_cooldown_minutes,
          totalVisits: prefs.total_visits,
          totalInteractions: prefs.total_interactions,
          firstVisitAt: prefs.first_visit_at,
          lastVisitAt: prefs.last_visit_at,
          intermediateUnlockInteractions: prefs.intermediate_unlock_interactions,
          advancedUnlockInteractions: prefs.advanced_unlock_interactions,
          expertUnlockInteractions: prefs.expert_unlock_interactions,
        },
        interactions: (interactions || []).map((i: any) => ({
          hintId: i.hint_id,
          hintContext: i.hint_context,
          pageContext: i.page_context,
          status: i.status,
          shownCount: i.shown_count,
          expandedCount: i.expanded_count,
          firstShownAt: i.first_shown_at,
          lastShownAt: i.last_shown_at,
          dismissedAt: i.dismissed_at,
          expandedAt: i.expanded_at,
          actionTakenAt: i.action_taken_at,
          shouldReshowAfter: i.should_reshow_after,
          reshowIntervalDays: i.reshow_interval_days,
        })),
        session: {
          sessionId: session.session_id,
          hintsShown: session.hints_shown,
          hintsDismissed: session.hints_dismissed,
          hintsExpanded: session.hints_expanded,
          sessionStartedAt: session.session_started_at,
          lastHintAt: session.last_hint_at,
        },
      };

      return new Response(JSON.stringify({ success: true, data: responseData }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /progressive-disclosure/interaction - Record a hint interaction
    if (req.method === 'POST' && path === '/interaction') {
      const body = await req.json();
      const { hintId, hintContext, pageContext, status, sessionId } = body;

      if (!hintId || !hintContext || !status) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'hintId, hintContext, and status are required',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Record the interaction using the DB function
      const { data: interaction, error: interactionError } = await supabase.rpc(
        'record_hint_interaction',
        {
          p_user_id: user.id,
          p_hint_id: hintId,
          p_hint_context: hintContext,
          p_page_context: pageContext || null,
          p_status: status,
        }
      );

      if (interactionError) {
        console.error('Error recording interaction:', interactionError);
        return new Response(JSON.stringify({ success: false, error: interactionError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update session tracking
      if (sessionId) {
        const updateField =
          status === 'shown'
            ? 'hints_shown'
            : status === 'dismissed'
              ? 'hints_dismissed'
              : status === 'expanded'
                ? 'hints_expanded'
                : null;

        if (updateField) {
          const { error: sessionError } = await supabase
            .from('session_hint_tracking')
            .update({
              [updateField]: supabase.rpc('increment', { x: 1 }),
              last_hint_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .eq('session_id', sessionId);

          if (sessionError) {
            console.error('Error updating session:', sessionError);
          }
        }
      }

      // Transform to camelCase
      const responseData = {
        hintId: interaction.hint_id,
        hintContext: interaction.hint_context,
        pageContext: interaction.page_context,
        status: interaction.status,
        shownCount: interaction.shown_count,
        expandedCount: interaction.expanded_count,
        firstShownAt: interaction.first_shown_at,
        lastShownAt: interaction.last_shown_at,
        dismissedAt: interaction.dismissed_at,
        expandedAt: interaction.expanded_at,
        actionTakenAt: interaction.action_taken_at,
        shouldReshowAfter: interaction.should_reshow_after,
        reshowIntervalDays: interaction.reshow_interval_days,
      };

      return new Response(JSON.stringify({ success: true, data: responseData }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PATCH /progressive-disclosure/preferences - Update preferences
    if (req.method === 'PATCH' && path === '/preferences') {
      const body = await req.json();

      // Build update object with snake_case keys
      const updates: Record<string, any> = {};
      if (body.hintsEnabled !== undefined) updates.hints_enabled = body.hintsEnabled;
      if (body.showKeyboardShortcuts !== undefined)
        updates.show_keyboard_shortcuts = body.showKeyboardShortcuts;
      if (body.showAdvancedFeatures !== undefined)
        updates.show_advanced_features = body.showAdvancedFeatures;
      if (body.hintDelayMs !== undefined) updates.hint_delay_ms = body.hintDelayMs;
      if (body.autoDismissSeconds !== undefined)
        updates.auto_dismiss_seconds = body.autoDismissSeconds;
      if (body.maxHintsPerSession !== undefined)
        updates.max_hints_per_session = body.maxHintsPerSession;
      if (body.hintCooldownMinutes !== undefined)
        updates.hint_cooldown_minutes = body.hintCooldownMinutes;
      if (body.experienceLevel !== undefined) {
        updates.experience_level = body.experienceLevel;
        updates.experience_level_auto_calculated = false;
      }

      const { data: prefs, error: updateError } = await supabase
        .from('user_disclosure_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating preferences:', updateError);
        return new Response(JSON.stringify({ success: false, error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Transform to camelCase
      const responseData = {
        userId: user.id,
        experienceLevel: prefs.experience_level,
        experienceLevelAutoCalculated: prefs.experience_level_auto_calculated,
        hintsEnabled: prefs.hints_enabled,
        showKeyboardShortcuts: prefs.show_keyboard_shortcuts,
        showAdvancedFeatures: prefs.show_advanced_features,
        hintDelayMs: prefs.hint_delay_ms,
        autoDismissSeconds: prefs.auto_dismiss_seconds,
        maxHintsPerSession: prefs.max_hints_per_session,
        hintCooldownMinutes: prefs.hint_cooldown_minutes,
        totalVisits: prefs.total_visits,
        totalInteractions: prefs.total_interactions,
        firstVisitAt: prefs.first_visit_at,
        lastVisitAt: prefs.last_visit_at,
        intermediateUnlockInteractions: prefs.intermediate_unlock_interactions,
        advancedUnlockInteractions: prefs.advanced_unlock_interactions,
        expertUnlockInteractions: prefs.expert_unlock_interactions,
      };

      return new Response(JSON.stringify({ success: true, data: responseData }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /progressive-disclosure/visit - Record a visit
    if (req.method === 'POST' && path === '/visit') {
      const { data: prefs, error: visitError } = await supabase.rpc('record_user_visit', {
        p_user_id: user.id,
      });

      if (visitError) {
        console.error('Error recording visit:', visitError);
        return new Response(JSON.stringify({ success: false, error: visitError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Transform to camelCase
      const responseData = {
        userId: user.id,
        experienceLevel: prefs.experience_level,
        experienceLevelAutoCalculated: prefs.experience_level_auto_calculated,
        hintsEnabled: prefs.hints_enabled,
        showKeyboardShortcuts: prefs.show_keyboard_shortcuts,
        showAdvancedFeatures: prefs.show_advanced_features,
        hintDelayMs: prefs.hint_delay_ms,
        autoDismissSeconds: prefs.auto_dismiss_seconds,
        maxHintsPerSession: prefs.max_hints_per_session,
        hintCooldownMinutes: prefs.hint_cooldown_minutes,
        totalVisits: prefs.total_visits,
        totalInteractions: prefs.total_interactions,
        firstVisitAt: prefs.first_visit_at,
        lastVisitAt: prefs.last_visit_at,
        intermediateUnlockInteractions: prefs.intermediate_unlock_interactions,
        advancedUnlockInteractions: prefs.advanced_unlock_interactions,
        expertUnlockInteractions: prefs.expert_unlock_interactions,
      };

      return new Response(JSON.stringify({ success: true, data: responseData }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /progressive-disclosure/reset - Reset all interactions
    if (req.method === 'POST' && path === '/reset') {
      // Delete all interactions for the user
      const { error: deleteError } = await supabase
        .from('user_hint_interactions')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error resetting interactions:', deleteError);
        return new Response(JSON.stringify({ success: false, error: deleteError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Reset preferences counters
      const { error: resetError } = await supabase
        .from('user_disclosure_preferences')
        .update({
          total_interactions: 0,
          experience_level: 'beginner',
          experience_level_auto_calculated: true,
          show_advanced_features: false,
        })
        .eq('user_id', user.id);

      if (resetError) {
        console.error('Error resetting preferences:', resetError);
        return new Response(JSON.stringify({ success: false, error: resetError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: 'All hint interactions reset' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
