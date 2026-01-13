import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

interface TriageDecisionRequest {
  action: 'accept' | 'override';
  sensitivity?: 'public' | 'internal' | 'confidential' | 'secret';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  assigned_unit?: string;
  override_reason?: string;
  override_reason_ar?: string;
}

interface TriageSuggestion {
  request_type?: string;
  sensitivity?: string;
  urgency?: string;
  priority?: string;
  suggested_assignee?: string;
  suggested_unit?: string;
  confidence_scores?: {
    type?: number;
    sensitivity?: number;
    urgency?: number;
    priority?: number;
    assignment?: number;
  };
  prediction_id?: string;
  ml_powered?: boolean;
}

interface MLClassificationResult {
  prediction_id: string;
  predictions: {
    type: string;
    type_confidence: number;
    type_probabilities: Record<string, number>;
    sensitivity: string;
    sensitivity_confidence: number;
    sensitivity_probabilities: Record<string, number>;
    urgency: string;
    urgency_confidence: number;
    urgency_probabilities: Record<string, number>;
    priority: string;
    priority_confidence: number;
    priority_probabilities: Record<string, number>;
    unit: string | null;
    unit_confidence: number;
    assignee: string | null;
    assignee_confidence: number;
  };
  overall_confidence: number;
  confidence_level: string;
  explanation: Record<string, any>;
  model_info: {
    name: string;
    version: string;
  };
}

/**
 * Generate ML-powered classification suggestions for a ticket
 * Uses ensemble approach: keyword patterns + embeddings + historical data
 */
async function generateMLClassification(
  supabaseAdmin: any,
  ticket: any
): Promise<TriageSuggestion> {
  try {
    // Get keyword patterns from database
    const { data: patterns } = await supabaseAdmin
      .from('ml_keyword_patterns')
      .select('*')
      .eq('is_active', true);

    // Get active ML model
    const { data: activeModel } = await supabaseAdmin
      .from('ml_classification_models')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'active')
      .single();

    if (!activeModel) {
      console.warn('No active ML model found, using fallback rules');
      return generateFallbackSuggestions(ticket, patterns || []);
    }

    // Analyze ticket content with keyword patterns
    const combinedText = (
      ticket.title +
      ' ' +
      ticket.description +
      ' ' +
      (ticket.title_ar || '') +
      ' ' +
      (ticket.description_ar || '')
    ).toLowerCase();

    // Score calculation
    const typeScores: Record<string, number> = {
      engagement: 0,
      position: 0,
      mou_action: 0,
      foresight: 0,
    };
    const sensitivityScores: Record<string, number> = {
      public: 0,
      internal: 0,
      confidential: 0,
      secret: 0,
    };
    const urgencyScores: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    const matchedKeywords = {
      type: [] as string[],
      sensitivity: [] as string[],
      urgency: [] as string[],
    };

    // Apply keyword patterns
    for (const pattern of patterns || []) {
      const patternLower = pattern.pattern.toLowerCase();
      const patternArLower = pattern.pattern_ar?.toLowerCase() || '';

      if (
        combinedText.includes(patternLower) ||
        (patternArLower && combinedText.includes(patternArLower))
      ) {
        if (pattern.indicates_type && typeScores[pattern.indicates_type] !== undefined) {
          typeScores[pattern.indicates_type] += pattern.weight;
          matchedKeywords.type.push(pattern.pattern);
        }
        if (
          pattern.indicates_sensitivity &&
          sensitivityScores[pattern.indicates_sensitivity] !== undefined
        ) {
          sensitivityScores[pattern.indicates_sensitivity] += pattern.weight;
          matchedKeywords.sensitivity.push(pattern.pattern);
        }
        if (pattern.indicates_urgency && urgencyScores[pattern.indicates_urgency] !== undefined) {
          urgencyScores[pattern.indicates_urgency] += pattern.weight;
          matchedKeywords.urgency.push(pattern.pattern);
        }
      }
    }

    // Boost from ticket's request type (user's initial selection)
    if (ticket.request_type && typeScores[ticket.request_type] !== undefined) {
      typeScores[ticket.request_type] += 2.0;
    }

    // Try to find similar tickets for historical patterns
    let historicalBoost = { type: {}, urgency: {}, unit: null as string | null };
    try {
      const { data: similarTickets } = await supabaseAdmin.rpc('find_similar_tickets_vector', {
        p_ticket_id: ticket.id,
        p_similarity_threshold: 0.5,
        p_limit: 10,
      });

      if (similarTickets?.length > 0) {
        const ticketIds = similarTickets.map((t: any) => t.ticket_id);
        const { data: ticketDetails } = await supabaseAdmin
          .from('intake_tickets')
          .select('request_type, urgency, assigned_unit')
          .in('id', ticketIds);

        for (const t of ticketDetails || []) {
          if (t.request_type && typeScores[t.request_type] !== undefined) {
            typeScores[t.request_type] += 0.5;
          }
          if (t.urgency && urgencyScores[t.urgency] !== undefined) {
            urgencyScores[t.urgency] += 0.3;
          }
        }

        // Most common unit from similar tickets
        const unitCounts: Record<string, number> = {};
        for (const t of ticketDetails || []) {
          if (t.assigned_unit) {
            unitCounts[t.assigned_unit] = (unitCounts[t.assigned_unit] || 0) + 1;
          }
        }
        const topUnit = Object.entries(unitCounts).sort(([, a], [, b]) => b - a)[0];
        if (topUnit) {
          historicalBoost.unit = topUnit[0];
        }
      }
    } catch (e) {
      console.warn('Error fetching similar tickets:', e);
    }

    // Normalize scores to get probabilities
    const normalizeScores = (scores: Record<string, number>): Record<string, number> => {
      const total = Object.values(scores).reduce((sum, v) => sum + v, 0);
      if (total === 0) {
        const keys = Object.keys(scores);
        return keys.reduce((acc, k) => ({ ...acc, [k]: 1 / keys.length }), {});
      }
      return Object.entries(scores).reduce((acc, [k, v]) => ({ ...acc, [k]: v / total }), {});
    };

    const typeProbabilities = normalizeScores(typeScores);
    const sensitivityProbabilities = normalizeScores(sensitivityScores);
    const urgencyProbabilities = normalizeScores(urgencyScores);

    // Get top predictions
    const getTopPrediction = (probs: Record<string, number>, defaultVal: string) => {
      const sorted = Object.entries(probs).sort(([, a], [, b]) => b - a);
      if (sorted.length === 0) return { value: defaultVal, confidence: 0.25 };
      const [value, confidence] = sorted[0];
      const secondBest = sorted[1]?.[1] || 0;
      const adjustedConfidence = Math.min(0.99, confidence + (confidence - secondBest) * 0.5);
      return { value, confidence: adjustedConfidence };
    };

    const typeResult = getTopPrediction(typeProbabilities, ticket.request_type || 'engagement');
    const sensitivityResult = getTopPrediction(sensitivityProbabilities, 'internal');
    const urgencyResult = getTopPrediction(urgencyProbabilities, 'medium');

    // Calculate priority from urgency and sensitivity
    let priority = 'medium';
    let priorityConfidence = 0.85;
    if (urgencyResult.value === 'critical' || sensitivityResult.value === 'secret') {
      priority = 'urgent';
      priorityConfidence = 0.95;
    } else if (urgencyResult.value === 'high' || sensitivityResult.value === 'confidential') {
      priority = 'high';
      priorityConfidence = 0.9;
    } else if (urgencyResult.value === 'low' && sensitivityResult.value === 'public') {
      priority = 'low';
      priorityConfidence = 0.85;
    }

    // Get assignment rules
    let suggestedUnit: string | null = null;
    let suggestedAssignee: string | null = null;
    let assignmentConfidence = 0;

    const { data: assignmentRules } = await supabaseAdmin.rpc('get_matching_assignment_rules', {
      p_request_type: typeResult.value,
      p_sensitivity: sensitivityResult.value,
      p_urgency: urgencyResult.value,
      p_title: ticket.title,
      p_description: ticket.description,
    });

    if (assignmentRules?.length > 0) {
      suggestedUnit = assignmentRules[0].assign_to_unit;
      suggestedAssignee = assignmentRules[0].assign_to_user;
      assignmentConfidence = Math.min(0.95, 0.5 + assignmentRules[0].match_score * 0.15);
    } else if (historicalBoost.unit) {
      suggestedUnit = historicalBoost.unit;
      assignmentConfidence = 0.6;
    }

    // Store the prediction
    const predictions = {
      type: typeResult.value,
      type_confidence: typeResult.confidence,
      type_probabilities: typeProbabilities,
      sensitivity: sensitivityResult.value,
      sensitivity_confidence: sensitivityResult.confidence,
      sensitivity_probabilities: sensitivityProbabilities,
      urgency: urgencyResult.value,
      urgency_confidence: urgencyResult.confidence,
      urgency_probabilities: urgencyProbabilities,
      priority: priority,
      priority_confidence: priorityConfidence,
      unit: suggestedUnit,
      unit_confidence: assignmentConfidence,
      assignee: suggestedAssignee,
      assignee_confidence: suggestedAssignee ? 0.7 : 0,
    };

    const explanation = {
      type: { keywords_matched: matchedKeywords.type },
      sensitivity: { keywords_matched: matchedKeywords.sensitivity },
      urgency: { keywords_matched: matchedKeywords.urgency },
      assignment: { rules_matched: assignmentRules?.length || 0 },
    };

    // Store prediction in database
    let predictionId: string | null = null;
    try {
      const { data: storedPrediction } = await supabaseAdmin.rpc(
        'store_classification_prediction',
        {
          p_ticket_id: ticket.id,
          p_model_id: activeModel.id,
          p_predictions: predictions,
          p_explanation: explanation,
          p_processing_time_ms: 0,
        }
      );
      predictionId = storedPrediction;
    } catch (e) {
      console.warn('Error storing prediction:', e);
    }

    return {
      request_type: typeResult.value,
      sensitivity: sensitivityResult.value,
      urgency: urgencyResult.value,
      priority: priority,
      suggested_assignee: suggestedAssignee || undefined,
      suggested_unit: suggestedUnit || undefined,
      confidence_scores: {
        type: typeResult.confidence,
        sensitivity: sensitivityResult.confidence,
        urgency: urgencyResult.confidence,
        priority: priorityConfidence,
        assignment: assignmentConfidence,
      },
      prediction_id: predictionId || undefined,
      ml_powered: true,
    };
  } catch (error) {
    console.error('ML Classification error:', error);
    return generateFallbackSuggestions(ticket, []);
  }
}

/**
 * Fallback rule-based suggestions when ML is unavailable
 */
function generateFallbackSuggestions(ticket: any, patterns: any[]): TriageSuggestion {
  const suggestion: TriageSuggestion = {
    request_type: ticket.request_type,
    sensitivity: 'internal',
    urgency: 'medium',
    suggested_unit: 'general-support',
    confidence_scores: {
      type: 0.95,
      sensitivity: 0.85,
      urgency: 0.8,
      assignment: 0.75,
    },
    ml_powered: false,
  };

  // Basic rules
  const combinedText = (ticket.title + ' ' + ticket.description).toLowerCase();

  if (
    combinedText.includes('urgent') ||
    combinedText.includes('asap') ||
    combinedText.includes('عاجل')
  ) {
    suggestion.urgency = 'high';
    suggestion.confidence_scores!.urgency = 0.9;
  }

  if (
    combinedText.includes('critical') ||
    combinedText.includes('emergency') ||
    combinedText.includes('حرج') ||
    combinedText.includes('طوارئ')
  ) {
    suggestion.urgency = 'critical';
    suggestion.confidence_scores!.urgency = 0.95;
  }

  if (combinedText.includes('confidential') || combinedText.includes('سري')) {
    suggestion.sensitivity = 'confidential';
    suggestion.confidence_scores!.sensitivity = 0.88;
  }

  if (
    combinedText.includes('secret') ||
    combinedText.includes('classified') ||
    combinedText.includes('سري للغاية')
  ) {
    suggestion.sensitivity = 'secret';
    suggestion.confidence_scores!.sensitivity = 0.92;
  }

  // Route based on request type
  switch (ticket.request_type) {
    case 'engagement':
      suggestion.suggested_unit = 'engagement-team';
      break;
    case 'position':
      suggestion.suggested_unit = 'position-dev-team';
      break;
    case 'mou_action':
      suggestion.suggested_unit = 'mou-team';
      break;
    case 'foresight':
      suggestion.suggested_unit = 'foresight-team';
      break;
  }

  return suggestion;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract ticket ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const ticketId = pathParts[pathParts.length - 2]; // -2 because last part is "triage"

    if (!ticketId) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Ticket ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase admin client to verify the JWT
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify and get user from JWT
    const jwt = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid user session' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch user role from users table
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      console.error('Error fetching user data:', userDataError);
      return new Response(JSON.stringify({ error: 'Unauthorized', message: 'User not found' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check user role - only editors and admins can triage
    if (userData.role !== 'editor' && userData.role !== 'admin') {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Only editors and admins can perform triage',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('intake_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return new Response(JSON.stringify({ error: 'Not Found', message: 'Ticket not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle GET request - return AI suggestions
    if (req.method === 'GET') {
      // Check if we have recent cached suggestions
      const { data: recentSuggestion } = await supabaseAdmin
        .from('triage_decisions')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('decision_type', 'ai_suggestion')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let suggestion: TriageSuggestion;
      let cached = false;
      let cachedAt: string | undefined;

      // Use cached suggestion if less than 24 hours old
      if (recentSuggestion) {
        const suggestionAge = Date.now() - new Date(recentSuggestion.created_at).getTime();
        if (suggestionAge < 24 * 60 * 60 * 1000) {
          suggestion = {
            request_type: recentSuggestion.suggested_type,
            sensitivity: recentSuggestion.suggested_sensitivity,
            urgency: recentSuggestion.suggested_urgency,
            suggested_assignee: recentSuggestion.suggested_assignee,
            suggested_unit: recentSuggestion.suggested_unit,
            confidence_scores: {
              type: recentSuggestion.confidence_score,
              sensitivity: recentSuggestion.confidence_score,
              urgency: recentSuggestion.confidence_score,
              assignment: recentSuggestion.confidence_score,
            },
            ml_powered: true,
          };
          cached = true;
          cachedAt = recentSuggestion.created_at;
        } else {
          // Generate new ML-powered suggestions
          suggestion = await generateMLClassification(supabaseAdmin, ticket);
        }
      } else {
        // Generate new ML-powered suggestions
        suggestion = await generateMLClassification(supabaseAdmin, ticket);
      }

      // If not cached, save the new suggestion
      if (!cached) {
        await supabaseAdmin.from('triage_decisions').insert({
          ticket_id: ticketId,
          decision_type: 'ai_suggestion',
          suggested_type: suggestion.request_type,
          suggested_sensitivity: suggestion.sensitivity,
          suggested_urgency: suggestion.urgency,
          suggested_assignee: suggestion.suggested_assignee,
          suggested_unit: suggestion.suggested_unit,
          model_name: 'demo-model',
          model_version: '1.0',
          confidence_score: 0.85,
          created_by: 'system',
        });
      }

      const response = {
        ...suggestion,
        model_info: {
          name: suggestion.ml_powered ? 'intake-classifier' : 'fallback-rules',
          version: suggestion.ml_powered ? 'v1.0.0' : '1.0',
        },
        cached,
        cached_at: cachedAt,
        ml_powered: suggestion.ml_powered || false,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle POST request - apply triage decision
    if (req.method === 'POST') {
      const body: TriageDecisionRequest = await req.json();

      if (!body.action) {
        return new Response(
          JSON.stringify({
            error: 'Bad Request',
            message: 'Action is required (accept or override)',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get the latest AI suggestion
      const { data: latestSuggestion } = await supabaseAdmin
        .from('triage_decisions')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('decision_type', 'ai_suggestion')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Prepare final values
      let finalValues: any = {};

      if (body.action === 'accept' && latestSuggestion) {
        finalValues = {
          sensitivity: latestSuggestion.suggested_sensitivity,
          urgency: latestSuggestion.suggested_urgency,
          assigned_to: latestSuggestion.suggested_assignee,
          assigned_unit: latestSuggestion.suggested_unit,
        };
      } else if (body.action === 'override') {
        if (!body.override_reason) {
          return new Response(
            JSON.stringify({
              error: 'Bad Request',
              message: 'Override reason is required when overriding suggestions',
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        finalValues = {
          sensitivity: body.sensitivity || ticket.sensitivity,
          urgency: body.urgency || ticket.urgency,
          assigned_to: body.assigned_to || null,
          assigned_unit: body.assigned_unit || null,
        };
      }

      // Create triage decision record
      const triageDecision = {
        ticket_id: ticketId,
        decision_type: body.action === 'accept' ? 'auto_assignment' : 'manual_override',
        suggested_type: latestSuggestion?.suggested_type,
        suggested_sensitivity: latestSuggestion?.suggested_sensitivity,
        suggested_urgency: latestSuggestion?.suggested_urgency,
        suggested_assignee: latestSuggestion?.suggested_assignee,
        suggested_unit: latestSuggestion?.suggested_unit,
        final_type: ticket.request_type,
        final_sensitivity: finalValues.sensitivity,
        final_urgency: finalValues.urgency,
        final_assignee: finalValues.assigned_to,
        final_unit: finalValues.assigned_unit,
        model_name: latestSuggestion?.model_name || 'demo-model',
        model_version: latestSuggestion?.model_version || '1.0',
        confidence_score: latestSuggestion?.confidence_score || 0.85,
        override_reason: body.override_reason,
        override_reason_ar: body.override_reason_ar,
        created_by: user.id,
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      };

      const { data: decision, error: decisionError } = await supabaseAdmin
        .from('triage_decisions')
        .insert(triageDecision)
        .select()
        .single();

      if (decisionError) {
        console.error('Error creating triage decision:', decisionError);
        return new Response(
          JSON.stringify({
            error: 'Internal Server Error',
            message: 'Failed to save triage decision',
            details: decisionError,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Update ticket with triage values
      const updateData: any = {
        sensitivity: finalValues.sensitivity,
        urgency: finalValues.urgency,
        status: 'triaged',
        triaged_at: new Date().toISOString(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (finalValues.assigned_to) {
        updateData.assigned_to = finalValues.assigned_to;
        updateData.assigned_at = new Date().toISOString();
        updateData.status = 'assigned';
      }

      if (finalValues.assigned_unit) {
        updateData.assigned_unit = finalValues.assigned_unit;
      }

      // Recalculate priority based on urgency
      let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
      if (finalValues.urgency === 'critical') {
        priority = 'urgent';
      } else if (finalValues.urgency === 'high') {
        priority = 'high';
      } else if (finalValues.urgency === 'low') {
        priority = 'low';
      }
      updateData.priority = priority;

      const { error: updateError } = await supabaseAdmin
        .from('intake_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (updateError) {
        console.error('Error updating ticket:', updateError);
      }

      // Create audit log
      await supabaseAdmin.from('audit_logs').insert({
        entity_type: 'intake_ticket',
        entity_id: ticketId,
        action: 'triage',
        new_values: updateData,
        user_id: user.id,
        user_role: userData.role || 'editor',
        ip_address: req.headers.get('X-Forwarded-For') || req.headers.get('CF-Connecting-IP'),
        user_agent: req.headers.get('User-Agent'),
        required_mfa: false,
        mfa_verified: false,
        correlation_id: crypto.randomUUID(),
        session_id: user.id,
      });

      // Build response
      const response = {
        id: decision.id,
        decision_type: decision.decision_type,
        suggested_sensitivity: decision.suggested_sensitivity,
        suggested_urgency: decision.suggested_urgency,
        suggested_assignee: decision.suggested_assignee,
        suggested_unit: decision.suggested_unit,
        final_sensitivity: decision.final_sensitivity,
        final_urgency: decision.final_urgency,
        final_assignee: decision.final_assignee,
        final_unit: decision.final_unit,
        confidence_score: decision.confidence_score,
        override_reason: decision.override_reason,
        created_at: decision.created_at,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Invalid method
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed', message: 'Only GET and POST are supported' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        correlation_id: crypto.randomUUID(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
