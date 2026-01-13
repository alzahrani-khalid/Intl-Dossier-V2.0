/**
 * Intake Classification Edge Function
 *
 * ML-based classification for intake tickets.
 * Uses ensemble approach: keyword patterns + embeddings + historical data
 *
 * Endpoints:
 * - GET /intake-classification/:ticketId - Get ML classification predictions
 * - POST /intake-classification/:ticketId/feedback - Record feedback on predictions
 * - GET /intake-classification/model/metrics - Get model performance metrics
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface KeywordPattern {
  id: string;
  pattern: string;
  pattern_ar: string | null;
  pattern_type: string;
  indicates_type: string | null;
  indicates_sensitivity: string | null;
  indicates_urgency: string | null;
  indicates_unit: string | null;
  weight: number;
}

interface AssignmentRule {
  rule_id: string;
  rule_name: string;
  assign_to_unit: string | null;
  assign_to_user: string | null;
  match_score: number;
}

interface ClassificationPrediction {
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
}

interface ClassificationExplanation {
  type: {
    keywords_matched: string[];
    similar_tickets: { id: string; title: string; similarity: number }[];
    historical_pattern: string | null;
  };
  sensitivity: {
    keywords_matched: string[];
    content_analysis: string;
  };
  urgency: {
    keywords_matched: string[];
    deadline_detected: boolean;
    similar_ticket_urgencies: string[];
  };
  assignment: {
    matching_rules: AssignmentRule[];
    similar_ticket_assignments: { unit: string; count: number }[];
  };
}

// Request type probabilities based on keywords and context
const REQUEST_TYPES = ['engagement', 'position', 'mou_action', 'foresight'];
const SENSITIVITY_LEVELS = ['public', 'internal', 'confidential', 'secret'];
const URGENCY_LEVELS = ['low', 'medium', 'high', 'critical'];
const PRIORITY_LEVELS = ['low', 'medium', 'high', 'urgent'];

/**
 * Analyze text content using keyword patterns
 */
function analyzeWithKeywords(
  text: string,
  textAr: string | null,
  patterns: KeywordPattern[]
): {
  typeScores: Record<string, number>;
  sensitivityScores: Record<string, number>;
  urgencyScores: Record<string, number>;
  matchedKeywords: {
    type: string[];
    sensitivity: string[];
    urgency: string[];
  };
} {
  const combinedText = (text + ' ' + (textAr || '')).toLowerCase();

  const typeScores: Record<string, number> = {};
  const sensitivityScores: Record<string, number> = {};
  const urgencyScores: Record<string, number> = {};
  const matchedKeywords = {
    type: [] as string[],
    sensitivity: [] as string[],
    urgency: [] as string[],
  };

  // Initialize scores
  REQUEST_TYPES.forEach((t) => (typeScores[t] = 0));
  SENSITIVITY_LEVELS.forEach((s) => (sensitivityScores[s] = 0));
  URGENCY_LEVELS.forEach((u) => (urgencyScores[u] = 0));

  for (const pattern of patterns) {
    const patternLower = pattern.pattern.toLowerCase();
    const patternArLower = pattern.pattern_ar?.toLowerCase() || '';

    // Check if pattern matches (support both English and Arabic)
    const matches =
      combinedText.includes(patternLower) ||
      (patternArLower && combinedText.includes(patternArLower));

    if (matches) {
      if (pattern.indicates_type) {
        typeScores[pattern.indicates_type] =
          (typeScores[pattern.indicates_type] || 0) + pattern.weight;
        matchedKeywords.type.push(pattern.pattern);
      }
      if (pattern.indicates_sensitivity) {
        sensitivityScores[pattern.indicates_sensitivity] =
          (sensitivityScores[pattern.indicates_sensitivity] || 0) + pattern.weight;
        matchedKeywords.sensitivity.push(pattern.pattern);
      }
      if (pattern.indicates_urgency) {
        urgencyScores[pattern.indicates_urgency] =
          (urgencyScores[pattern.indicates_urgency] || 0) + pattern.weight;
        matchedKeywords.urgency.push(pattern.pattern);
      }
    }
  }

  return { typeScores, sensitivityScores, urgencyScores, matchedKeywords };
}

/**
 * Normalize scores to probabilities (0-1)
 */
function normalizeScores(scores: Record<string, number>): Record<string, number> {
  const total = Object.values(scores).reduce((sum, v) => sum + v, 0);
  if (total === 0) {
    // Equal distribution if no scores
    const keys = Object.keys(scores);
    const equalProb = 1 / keys.length;
    return keys.reduce((acc, k) => ({ ...acc, [k]: equalProb }), {});
  }
  return Object.entries(scores).reduce((acc, [k, v]) => ({ ...acc, [k]: v / total }), {});
}

/**
 * Get the highest scoring item and its confidence
 */
function getTopPrediction(
  probabilities: Record<string, number>,
  defaultValue: string
): { value: string; confidence: number } {
  const entries = Object.entries(probabilities);
  if (entries.length === 0) {
    return { value: defaultValue, confidence: 0.25 };
  }

  const sorted = entries.sort(([, a], [, b]) => b - a);
  const [value, confidence] = sorted[0];

  // Boost confidence if there's a clear winner
  const secondBest = sorted[1]?.[1] || 0;
  const margin = confidence - secondBest;
  const adjustedConfidence = Math.min(0.99, confidence + margin * 0.5);

  return { value, confidence: adjustedConfidence };
}

/**
 * Calculate priority from urgency and sensitivity
 */
function calculatePriority(
  urgency: string,
  sensitivity: string
): { priority: string; confidence: number } {
  // Priority matrix
  if (urgency === 'critical' || sensitivity === 'secret') {
    return { priority: 'urgent', confidence: 0.95 };
  }
  if (urgency === 'high' || sensitivity === 'confidential') {
    return { priority: 'high', confidence: 0.9 };
  }
  if (urgency === 'medium' || sensitivity === 'internal') {
    return { priority: 'medium', confidence: 0.85 };
  }
  return { priority: 'low', confidence: 0.8 };
}

/**
 * Analyze similar tickets for historical patterns
 */
async function analyzeSimilarTickets(
  supabase: any,
  ticketId: string,
  limit: number = 5
): Promise<{
  similarTickets: { id: string; title: string; similarity: number }[];
  typeDistribution: Record<string, number>;
  unitDistribution: Record<string, number>;
  urgencyDistribution: Record<string, number>;
}> {
  try {
    // Try vector similarity search
    const { data: similarTickets, error } = await supabase.rpc('find_similar_tickets_vector', {
      p_ticket_id: ticketId,
      p_similarity_threshold: 0.5,
      p_limit: limit,
    });

    if (error || !similarTickets?.length) {
      return {
        similarTickets: [],
        typeDistribution: {},
        unitDistribution: {},
        urgencyDistribution: {},
      };
    }

    // Get full ticket details for similar tickets
    const ticketIds = similarTickets.map((t: any) => t.ticket_id);
    const { data: ticketDetails } = await supabase
      .from('intake_tickets')
      .select('id, title, request_type, assigned_unit, urgency')
      .in('id', ticketIds);

    // Calculate distributions
    const typeDistribution: Record<string, number> = {};
    const unitDistribution: Record<string, number> = {};
    const urgencyDistribution: Record<string, number> = {};

    for (const ticket of ticketDetails || []) {
      if (ticket.request_type) {
        typeDistribution[ticket.request_type] = (typeDistribution[ticket.request_type] || 0) + 1;
      }
      if (ticket.assigned_unit) {
        unitDistribution[ticket.assigned_unit] = (unitDistribution[ticket.assigned_unit] || 0) + 1;
      }
      if (ticket.urgency) {
        urgencyDistribution[ticket.urgency] = (urgencyDistribution[ticket.urgency] || 0) + 1;
      }
    }

    return {
      similarTickets: similarTickets.map((t: any) => ({
        id: t.ticket_id,
        title: t.title,
        similarity: t.similarity_score,
      })),
      typeDistribution,
      unitDistribution,
      urgencyDistribution,
    };
  } catch (error) {
    console.error('Error analyzing similar tickets:', error);
    return {
      similarTickets: [],
      typeDistribution: {},
      unitDistribution: {},
      urgencyDistribution: {},
    };
  }
}

/**
 * Main classification function
 */
async function classifyTicket(
  supabase: any,
  ticket: any,
  modelId: string
): Promise<{
  prediction: ClassificationPrediction;
  explanation: ClassificationExplanation;
  processingTimeMs: number;
}> {
  const startTime = Date.now();

  // 1. Get keyword patterns
  const { data: patterns } = await supabase
    .from('ml_keyword_patterns')
    .select('*')
    .eq('is_active', true);

  // 2. Analyze with keywords
  const keywordAnalysis = analyzeWithKeywords(
    ticket.title + ' ' + ticket.description,
    (ticket.title_ar || '') + ' ' + (ticket.description_ar || ''),
    patterns || []
  );

  // 3. Get similar tickets analysis
  const historicalAnalysis = await analyzeSimilarTickets(supabase, ticket.id, 10);

  // 4. Get assignment rules
  const { data: assignmentRules } = await supabase.rpc('get_matching_assignment_rules', {
    p_request_type: ticket.request_type,
    p_sensitivity: ticket.sensitivity || 'internal',
    p_urgency: ticket.urgency || 'medium',
    p_title: ticket.title,
    p_description: ticket.description,
  });

  // 5. Combine scores from different sources
  // Weight: keywords 40%, historical 40%, request_type hint 20%
  const typeScores = { ...keywordAnalysis.typeScores };

  // Boost from request type (user's initial selection)
  if (ticket.request_type && typeScores[ticket.request_type] !== undefined) {
    typeScores[ticket.request_type] += 2.0;
  }

  // Boost from historical patterns
  for (const [type, count] of Object.entries(historicalAnalysis.typeDistribution)) {
    if (typeScores[type] !== undefined) {
      typeScores[type] += (count as number) * 0.5;
    }
  }

  // Normalize and get predictions
  const typeProbabilities = normalizeScores(typeScores);
  const sensitivityProbabilities = normalizeScores(keywordAnalysis.sensitivityScores);
  const urgencyProbabilities = normalizeScores(keywordAnalysis.urgencyScores);

  // Apply historical urgency patterns
  for (const [urgency, count] of Object.entries(historicalAnalysis.urgencyDistribution)) {
    if (urgencyProbabilities[urgency] !== undefined) {
      urgencyProbabilities[urgency] += (count as number) * 0.1;
    }
  }

  // Re-normalize urgency after historical boost
  const totalUrgency = Object.values(urgencyProbabilities).reduce((s, v) => s + v, 0);
  if (totalUrgency > 0) {
    Object.keys(urgencyProbabilities).forEach((k) => {
      urgencyProbabilities[k] /= totalUrgency;
    });
  }

  // Get top predictions
  const typeResult = getTopPrediction(typeProbabilities, ticket.request_type || 'engagement');
  const sensitivityResult = getTopPrediction(sensitivityProbabilities, 'internal');
  const urgencyResult = getTopPrediction(urgencyProbabilities, 'medium');
  const priorityResult = calculatePriority(urgencyResult.value, sensitivityResult.value);

  // Priority probabilities based on urgency/sensitivity matrix
  const priorityProbabilities: Record<string, number> = {};
  PRIORITY_LEVELS.forEach((p) => {
    priorityProbabilities[p] =
      p === priorityResult.priority
        ? priorityResult.confidence
        : (1 - priorityResult.confidence) / 3;
  });

  // Get unit assignment from rules or historical patterns
  let predictedUnit: string | null = null;
  let unitConfidence = 0;

  if (assignmentRules?.length > 0) {
    predictedUnit = assignmentRules[0].assign_to_unit;
    unitConfidence = Math.min(0.95, 0.5 + assignmentRules[0].match_score * 0.15);
  } else if (Object.keys(historicalAnalysis.unitDistribution).length > 0) {
    const unitEntries = Object.entries(historicalAnalysis.unitDistribution);
    const topUnit = unitEntries.sort(([, a], [, b]) => (b as number) - (a as number))[0];
    predictedUnit = topUnit[0];
    unitConfidence = Math.min(0.8, 0.3 + (topUnit[1] as number) * 0.1);
  }

  const processingTimeMs = Date.now() - startTime;

  const prediction: ClassificationPrediction = {
    type: typeResult.value,
    type_confidence: typeResult.confidence,
    type_probabilities: typeProbabilities,
    sensitivity: sensitivityResult.value,
    sensitivity_confidence: sensitivityResult.confidence,
    sensitivity_probabilities: sensitivityProbabilities,
    urgency: urgencyResult.value,
    urgency_confidence: urgencyResult.confidence,
    urgency_probabilities: urgencyProbabilities,
    priority: priorityResult.priority,
    priority_confidence: priorityResult.confidence,
    priority_probabilities: priorityProbabilities,
    unit: predictedUnit,
    unit_confidence: unitConfidence,
    assignee: assignmentRules?.[0]?.assign_to_user || null,
    assignee_confidence: assignmentRules?.[0]?.assign_to_user ? 0.7 : 0,
  };

  const explanation: ClassificationExplanation = {
    type: {
      keywords_matched: keywordAnalysis.matchedKeywords.type,
      similar_tickets: historicalAnalysis.similarTickets.slice(0, 3),
      historical_pattern:
        Object.keys(historicalAnalysis.typeDistribution).length > 0
          ? `Based on ${historicalAnalysis.similarTickets.length} similar tickets`
          : null,
    },
    sensitivity: {
      keywords_matched: keywordAnalysis.matchedKeywords.sensitivity,
      content_analysis:
        sensitivityResult.confidence > 0.7
          ? 'High confidence based on keyword matches'
          : 'Default classification - no strong indicators',
    },
    urgency: {
      keywords_matched: keywordAnalysis.matchedKeywords.urgency,
      deadline_detected:
        ticket.description?.toLowerCase().includes('deadline') ||
        ticket.title?.toLowerCase().includes('deadline') ||
        false,
      similar_ticket_urgencies: Object.keys(historicalAnalysis.urgencyDistribution),
    },
    assignment: {
      matching_rules: assignmentRules || [],
      similar_ticket_assignments: Object.entries(historicalAnalysis.unitDistribution).map(
        ([unit, count]) => ({ unit, count: count as number })
      ),
    },
  };

  return { prediction, explanation, processingTimeMs };
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
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user
    const jwt = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid user session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Route: GET /intake-classification/model/metrics
    if (req.method === 'GET' && pathParts.includes('model') && pathParts.includes('metrics')) {
      const { data: activeModel } = await supabaseAdmin
        .from('ml_classification_models')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'active')
        .single();

      if (!activeModel) {
        return new Response(
          JSON.stringify({ error: 'Not Found', message: 'No active model found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get performance metrics
      const days = parseInt(url.searchParams.get('days') || '30');
      const { data: metrics } = await supabaseAdmin.rpc('get_model_performance_metrics', {
        p_model_id: activeModel.id,
        p_days: days,
      });

      return new Response(
        JSON.stringify({
          model: {
            id: activeModel.id,
            name: activeModel.model_name,
            version: activeModel.model_version,
            type: activeModel.model_type,
            accuracy_metrics: activeModel.accuracy_metrics,
            training_samples: activeModel.training_samples,
            activated_at: activeModel.activated_at,
          },
          performance: metrics,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract ticket ID from URL
    const ticketIdIndex = pathParts.findIndex((p) => p === 'intake-classification') + 1;
    const ticketId = pathParts[ticketIdIndex];

    if (!ticketId || ticketId === 'model') {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Ticket ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Route: GET /intake-classification/:ticketId - Get predictions
    if (req.method === 'GET') {
      // Check for cached recent prediction
      const { data: recentPrediction } = await supabaseAdmin
        .from('ml_classification_predictions')
        .select('*, ml_classification_models!inner(model_name, model_version)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Use cache if less than 1 hour old
      if (recentPrediction) {
        const predictionAge = Date.now() - new Date(recentPrediction.created_at).getTime();
        if (predictionAge < 60 * 60 * 1000) {
          return new Response(
            JSON.stringify({
              prediction_id: recentPrediction.id,
              predictions: {
                type: recentPrediction.predicted_type,
                type_confidence: recentPrediction.predicted_type_confidence,
                type_probabilities: recentPrediction.type_probabilities,
                sensitivity: recentPrediction.predicted_sensitivity,
                sensitivity_confidence: recentPrediction.predicted_sensitivity_confidence,
                sensitivity_probabilities: recentPrediction.sensitivity_probabilities,
                urgency: recentPrediction.predicted_urgency,
                urgency_confidence: recentPrediction.predicted_urgency_confidence,
                urgency_probabilities: recentPrediction.urgency_probabilities,
                priority: recentPrediction.predicted_priority,
                priority_confidence: recentPrediction.predicted_priority_confidence,
                priority_probabilities: recentPrediction.priority_probabilities,
                unit: recentPrediction.predicted_unit,
                unit_confidence: recentPrediction.predicted_unit_confidence,
                assignee: recentPrediction.predicted_assignee,
                assignee_confidence: recentPrediction.predicted_assignee_confidence,
              },
              overall_confidence: recentPrediction.overall_confidence,
              confidence_level: recentPrediction.confidence_level,
              explanation: recentPrediction.explanation,
              model_info: {
                name: recentPrediction.ml_classification_models.model_name,
                version: recentPrediction.ml_classification_models.model_version,
              },
              cached: true,
              cached_at: recentPrediction.created_at,
              processing_time_ms: recentPrediction.processing_time_ms,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Get active model
      const { data: activeModel } = await supabaseAdmin
        .from('ml_classification_models')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'active')
        .single();

      if (!activeModel) {
        return new Response(
          JSON.stringify({
            error: 'Service Unavailable',
            message: 'No active classification model available',
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Run classification
      const { prediction, explanation, processingTimeMs } = await classifyTicket(
        supabaseAdmin,
        ticket,
        activeModel.id
      );

      // Store prediction
      const { data: storedPrediction, error: storeError } = await supabaseAdmin.rpc(
        'store_classification_prediction',
        {
          p_ticket_id: ticketId,
          p_model_id: activeModel.id,
          p_predictions: prediction,
          p_explanation: explanation,
          p_processing_time_ms: processingTimeMs,
        }
      );

      if (storeError) {
        console.error('Error storing prediction:', storeError);
      }

      // Calculate overall confidence
      const overallConfidence =
        (prediction.type_confidence +
          prediction.sensitivity_confidence +
          prediction.urgency_confidence +
          prediction.priority_confidence) /
        4;

      return new Response(
        JSON.stringify({
          prediction_id: storedPrediction,
          predictions: prediction,
          overall_confidence: overallConfidence,
          confidence_level:
            overallConfidence >= 0.9
              ? 'very_high'
              : overallConfidence >= 0.7
                ? 'high'
                : overallConfidence >= 0.5
                  ? 'medium'
                  : overallConfidence >= 0.3
                    ? 'low'
                    : 'very_low',
          explanation,
          model_info: {
            name: activeModel.model_name,
            version: activeModel.model_version,
          },
          cached: false,
          processing_time_ms: processingTimeMs,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: POST /intake-classification/:ticketId/feedback
    if (req.method === 'POST' && pathParts.includes('feedback')) {
      const body = await req.json();

      if (!body.prediction_id) {
        return new Response(
          JSON.stringify({ error: 'Bad Request', message: 'prediction_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!body.final_values) {
        return new Response(
          JSON.stringify({ error: 'Bad Request', message: 'final_values is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Record feedback
      const { data: feedbackId, error: feedbackError } = await supabaseAdmin.rpc(
        'record_prediction_feedback',
        {
          p_prediction_id: body.prediction_id,
          p_user_id: user.id,
          p_final_values: body.final_values,
          p_feedback_notes: body.feedback_notes || null,
        }
      );

      if (feedbackError) {
        console.error('Error recording feedback:', feedbackError);
        return new Response(
          JSON.stringify({
            error: 'Internal Server Error',
            message: 'Failed to record feedback',
            details: feedbackError.message,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create audit log
      await supabaseAdmin.from('audit_logs').insert({
        entity_type: 'ml_prediction_feedback',
        entity_id: feedbackId,
        action: 'create',
        new_values: { prediction_id: body.prediction_id, final_values: body.final_values },
        user_id: user.id,
        correlation_id: crypto.randomUUID(),
      });

      return new Response(
        JSON.stringify({
          feedback_id: feedbackId,
          message: 'Feedback recorded successfully',
          used_for_training: body.final_values !== null,
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed', message: 'Only GET and POST are supported' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        correlation_id: crypto.randomUUID(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
