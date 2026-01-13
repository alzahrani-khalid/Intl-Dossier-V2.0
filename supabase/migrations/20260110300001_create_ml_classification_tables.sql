-- Migration: create_ml_classification_tables
-- Description: Create tables for ML-based intake ticket classification
-- Date: 2026-01-10

-- ============================================================================
-- ML Classification Model Tables
-- ============================================================================
-- This schema supports machine learning classification for intake tickets
-- including model versioning, training data, predictions, and feedback loops

-- Create enum for ML model status
CREATE TYPE ml_model_status AS ENUM (
    'training',      -- Model is being trained
    'validating',    -- Model is being validated
    'active',        -- Model is in production
    'deprecated',    -- Model has been replaced
    'failed'         -- Training or validation failed
);

-- Create enum for prediction confidence levels
CREATE TYPE confidence_level AS ENUM (
    'very_low',      -- < 0.3
    'low',           -- 0.3 - 0.5
    'medium',        -- 0.5 - 0.7
    'high',          -- 0.7 - 0.9
    'very_high'      -- > 0.9
);

-- Create enum for feedback types
CREATE TYPE feedback_type AS ENUM (
    'accepted',      -- User accepted the prediction
    'rejected',      -- User rejected the prediction
    'corrected',     -- User corrected the prediction
    'ignored'        -- User ignored (no action)
);

-- ============================================================================
-- Table: ml_classification_models
-- ============================================================================
-- Stores metadata about trained ML models for intake classification
CREATE TABLE IF NOT EXISTS ml_classification_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Model identification
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    model_type TEXT NOT NULL DEFAULT 'ensemble', -- 'keyword', 'embedding', 'ensemble'

    -- Model status
    status ml_model_status NOT NULL DEFAULT 'training',
    is_active BOOLEAN NOT NULL DEFAULT FALSE,

    -- Training metrics
    training_samples INTEGER NOT NULL DEFAULT 0,
    validation_samples INTEGER NOT NULL DEFAULT 0,

    -- Performance metrics (JSON for flexibility)
    accuracy_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Structure: {
    --   "overall": { "accuracy": 0.85, "precision": 0.82, "recall": 0.88, "f1": 0.85 },
    --   "by_type": { "engagement": {...}, "position": {...}, ... },
    --   "by_urgency": { "low": {...}, "medium": {...}, ... },
    --   "by_priority": { "low": {...}, "medium": {...}, ... },
    --   "assignment": { "accuracy": 0.78, ... }
    -- }

    -- Model configuration
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Structure: {
    --   "features": ["title", "description", "type_specific_fields"],
    --   "preprocessing": { "lowercase": true, "remove_stopwords": true },
    --   "embedding_model": "bge-m3",
    --   "keyword_weights": { "urgent": 2.0, "critical": 2.5 }
    -- }

    -- Training parameters
    hyperparameters JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Timestamps
    training_started_at TIMESTAMPTZ,
    training_completed_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    deprecated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,

    -- Constraints
    CONSTRAINT unique_active_model UNIQUE (model_name, is_active)
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT valid_version CHECK (model_version ~ '^v[0-9]+\.[0-9]+\.[0-9]+$')
);

-- ============================================================================
-- Table: ml_training_data
-- ============================================================================
-- Stores labeled training data for ML models
CREATE TABLE IF NOT EXISTS ml_training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source ticket reference
    ticket_id UUID REFERENCES intake_tickets(id) ON DELETE SET NULL,

    -- Input features (denormalized for training)
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT NOT NULL,
    description_ar TEXT,
    request_type request_type NOT NULL,
    type_specific_fields JSONB,

    -- Labels (ground truth)
    label_type request_type NOT NULL,
    label_sensitivity sensitivity_level NOT NULL,
    label_urgency urgency_level NOT NULL,
    label_priority priority_level NOT NULL,
    label_assigned_unit TEXT,
    label_assigned_to UUID,

    -- Label source
    label_source TEXT NOT NULL DEFAULT 'human', -- 'human', 'auto', 'corrected'
    labeled_by UUID,
    labeled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Data quality
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_notes TEXT,

    -- Usage tracking
    used_in_training BOOLEAN NOT NULL DEFAULT FALSE,
    last_used_in_model_id UUID REFERENCES ml_classification_models(id),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Table: ml_classification_predictions
-- ============================================================================
-- Stores all predictions made by ML models for auditing and retraining
CREATE TABLE IF NOT EXISTS ml_classification_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    ticket_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES ml_classification_models(id) ON DELETE CASCADE,
    triage_decision_id UUID REFERENCES triage_decisions(id) ON DELETE SET NULL,

    -- Predictions with confidence scores
    predicted_type request_type,
    predicted_type_confidence NUMERIC(5,4) CHECK (predicted_type_confidence >= 0 AND predicted_type_confidence <= 1),
    type_probabilities JSONB, -- { "engagement": 0.75, "position": 0.15, ... }

    predicted_sensitivity sensitivity_level,
    predicted_sensitivity_confidence NUMERIC(5,4) CHECK (predicted_sensitivity_confidence >= 0 AND predicted_sensitivity_confidence <= 1),
    sensitivity_probabilities JSONB,

    predicted_urgency urgency_level,
    predicted_urgency_confidence NUMERIC(5,4) CHECK (predicted_urgency_confidence >= 0 AND predicted_urgency_confidence <= 1),
    urgency_probabilities JSONB,

    predicted_priority priority_level,
    predicted_priority_confidence NUMERIC(5,4) CHECK (predicted_priority_confidence >= 0 AND predicted_priority_confidence <= 1),
    priority_probabilities JSONB,

    predicted_unit TEXT,
    predicted_unit_confidence NUMERIC(5,4) CHECK (predicted_unit_confidence >= 0 AND predicted_unit_confidence <= 1),
    unit_probabilities JSONB,

    predicted_assignee UUID,
    predicted_assignee_confidence NUMERIC(5,4) CHECK (predicted_assignee_confidence >= 0 AND predicted_assignee_confidence <= 1),
    assignee_probabilities JSONB,

    -- Overall confidence
    overall_confidence NUMERIC(5,4) CHECK (overall_confidence >= 0 AND overall_confidence <= 1),
    confidence_level confidence_level,

    -- Explanation for predictions (for transparency)
    explanation JSONB,
    -- Structure: {
    --   "type": { "keywords_matched": ["partnership", "collaboration"], "similar_tickets": [...] },
    --   "urgency": { "keywords_matched": ["urgent", "immediate"], "deadline_detected": true },
    --   "assignment": { "similar_ticket_assignments": [...], "unit_workload": {...} }
    -- }

    -- Feature importance (for model interpretability)
    feature_importance JSONB,

    -- Processing metadata
    processing_time_ms INTEGER,
    embedding_id UUID REFERENCES ai_embeddings(id),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Table: ml_prediction_feedback
-- ============================================================================
-- Stores user feedback on predictions for continuous learning
CREATE TABLE IF NOT EXISTS ml_prediction_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Reference to prediction
    prediction_id UUID NOT NULL REFERENCES ml_classification_predictions(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,

    -- Feedback details
    feedback_type feedback_type NOT NULL,

    -- What was predicted vs what was accepted/corrected
    predicted_type request_type,
    final_type request_type,
    type_feedback feedback_type,

    predicted_sensitivity sensitivity_level,
    final_sensitivity sensitivity_level,
    sensitivity_feedback feedback_type,

    predicted_urgency urgency_level,
    final_urgency urgency_level,
    urgency_feedback feedback_type,

    predicted_priority priority_level,
    final_priority priority_level,
    priority_feedback feedback_type,

    predicted_unit TEXT,
    final_unit TEXT,
    unit_feedback feedback_type,

    predicted_assignee UUID,
    final_assignee UUID,
    assignee_feedback feedback_type,

    -- User feedback notes
    feedback_notes TEXT,
    feedback_notes_ar TEXT,

    -- Metadata
    feedback_by UUID NOT NULL,
    feedback_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Flag for retraining
    used_for_retraining BOOLEAN NOT NULL DEFAULT FALSE,
    retrained_model_id UUID REFERENCES ml_classification_models(id)
);

-- ============================================================================
-- Table: ml_assignment_rules
-- ============================================================================
-- Stores rules for unit/person assignment based on patterns
CREATE TABLE IF NOT EXISTS ml_assignment_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Rule identification
    rule_name TEXT NOT NULL,
    rule_name_ar TEXT,
    description TEXT,
    description_ar TEXT,

    -- Matching criteria (all must match)
    match_request_type request_type[],
    match_sensitivity sensitivity_level[],
    match_urgency urgency_level[],
    match_keywords TEXT[], -- Keywords in title/description
    match_keywords_ar TEXT[],

    -- Assignment target
    assign_to_unit TEXT,
    assign_to_user UUID,

    -- Rule properties
    priority INTEGER NOT NULL DEFAULT 100, -- Lower = higher priority
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Performance tracking
    times_applied INTEGER NOT NULL DEFAULT 0,
    success_rate NUMERIC(5,4),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID
);

-- ============================================================================
-- Table: ml_keyword_patterns
-- ============================================================================
-- Stores keyword patterns for rule-based classification fallback
CREATE TABLE IF NOT EXISTS ml_keyword_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Pattern details
    pattern TEXT NOT NULL,
    pattern_ar TEXT,
    pattern_type TEXT NOT NULL DEFAULT 'keyword', -- 'keyword', 'regex', 'phrase'

    -- What this pattern indicates
    indicates_type request_type,
    indicates_sensitivity sensitivity_level,
    indicates_urgency urgency_level,
    indicates_unit TEXT,

    -- Pattern weight (higher = stronger signal)
    weight NUMERIC(3,2) NOT NULL DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 5),

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Performance
    match_count INTEGER NOT NULL DEFAULT 0,
    accuracy_when_matched NUMERIC(5,4),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Functions for ML Classification
-- ============================================================================

-- Function to get confidence level from numeric score
CREATE OR REPLACE FUNCTION get_confidence_level(score NUMERIC)
RETURNS confidence_level AS $$
BEGIN
    IF score < 0.3 THEN
        RETURN 'very_low'::confidence_level;
    ELSIF score < 0.5 THEN
        RETURN 'low'::confidence_level;
    ELSIF score < 0.7 THEN
        RETURN 'medium'::confidence_level;
    ELSIF score < 0.9 THEN
        RETURN 'high'::confidence_level;
    ELSE
        RETURN 'very_high'::confidence_level;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get active ML model
CREATE OR REPLACE FUNCTION get_active_classification_model(p_model_name TEXT DEFAULT 'intake-classifier')
RETURNS ml_classification_models AS $$
DECLARE
    v_model ml_classification_models;
BEGIN
    SELECT * INTO v_model
    FROM ml_classification_models
    WHERE model_name = p_model_name
    AND is_active = TRUE
    AND status = 'active'
    LIMIT 1;

    RETURN v_model;
END;
$$ LANGUAGE plpgsql;

-- Function to store prediction and return ID
CREATE OR REPLACE FUNCTION store_classification_prediction(
    p_ticket_id UUID,
    p_model_id UUID,
    p_predictions JSONB,
    p_explanation JSONB DEFAULT NULL,
    p_processing_time_ms INTEGER DEFAULT NULL,
    p_embedding_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_prediction_id UUID;
    v_overall_confidence NUMERIC;
BEGIN
    -- Calculate overall confidence as average of individual confidences
    v_overall_confidence := (
        COALESCE((p_predictions->>'type_confidence')::NUMERIC, 0) +
        COALESCE((p_predictions->>'sensitivity_confidence')::NUMERIC, 0) +
        COALESCE((p_predictions->>'urgency_confidence')::NUMERIC, 0) +
        COALESCE((p_predictions->>'priority_confidence')::NUMERIC, 0)
    ) / 4;

    INSERT INTO ml_classification_predictions (
        ticket_id,
        model_id,
        predicted_type,
        predicted_type_confidence,
        type_probabilities,
        predicted_sensitivity,
        predicted_sensitivity_confidence,
        sensitivity_probabilities,
        predicted_urgency,
        predicted_urgency_confidence,
        urgency_probabilities,
        predicted_priority,
        predicted_priority_confidence,
        priority_probabilities,
        predicted_unit,
        predicted_unit_confidence,
        unit_probabilities,
        predicted_assignee,
        predicted_assignee_confidence,
        assignee_probabilities,
        overall_confidence,
        confidence_level,
        explanation,
        processing_time_ms,
        embedding_id
    ) VALUES (
        p_ticket_id,
        p_model_id,
        (p_predictions->>'type')::request_type,
        (p_predictions->>'type_confidence')::NUMERIC,
        p_predictions->'type_probabilities',
        (p_predictions->>'sensitivity')::sensitivity_level,
        (p_predictions->>'sensitivity_confidence')::NUMERIC,
        p_predictions->'sensitivity_probabilities',
        (p_predictions->>'urgency')::urgency_level,
        (p_predictions->>'urgency_confidence')::NUMERIC,
        p_predictions->'urgency_probabilities',
        (p_predictions->>'priority')::priority_level,
        (p_predictions->>'priority_confidence')::NUMERIC,
        p_predictions->'priority_probabilities',
        p_predictions->>'unit',
        (p_predictions->>'unit_confidence')::NUMERIC,
        p_predictions->'unit_probabilities',
        (p_predictions->>'assignee')::UUID,
        (p_predictions->>'assignee_confidence')::NUMERIC,
        p_predictions->'assignee_probabilities',
        v_overall_confidence,
        get_confidence_level(v_overall_confidence),
        p_explanation,
        p_processing_time_ms,
        p_embedding_id
    )
    RETURNING id INTO v_prediction_id;

    RETURN v_prediction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record prediction feedback
CREATE OR REPLACE FUNCTION record_prediction_feedback(
    p_prediction_id UUID,
    p_user_id UUID,
    p_final_values JSONB,
    p_feedback_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_prediction ml_classification_predictions;
    v_feedback_id UUID;
    v_type_feedback feedback_type;
    v_sensitivity_feedback feedback_type;
    v_urgency_feedback feedback_type;
    v_priority_feedback feedback_type;
    v_unit_feedback feedback_type;
    v_overall_feedback feedback_type;
BEGIN
    -- Get the prediction
    SELECT * INTO v_prediction
    FROM ml_classification_predictions
    WHERE id = p_prediction_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prediction not found: %', p_prediction_id;
    END IF;

    -- Determine feedback for each field
    v_type_feedback := CASE
        WHEN (p_final_values->>'type')::request_type = v_prediction.predicted_type THEN 'accepted'
        WHEN p_final_values->>'type' IS NOT NULL THEN 'corrected'
        ELSE 'ignored'
    END;

    v_sensitivity_feedback := CASE
        WHEN (p_final_values->>'sensitivity')::sensitivity_level = v_prediction.predicted_sensitivity THEN 'accepted'
        WHEN p_final_values->>'sensitivity' IS NOT NULL THEN 'corrected'
        ELSE 'ignored'
    END;

    v_urgency_feedback := CASE
        WHEN (p_final_values->>'urgency')::urgency_level = v_prediction.predicted_urgency THEN 'accepted'
        WHEN p_final_values->>'urgency' IS NOT NULL THEN 'corrected'
        ELSE 'ignored'
    END;

    v_priority_feedback := CASE
        WHEN (p_final_values->>'priority')::priority_level = v_prediction.predicted_priority THEN 'accepted'
        WHEN p_final_values->>'priority' IS NOT NULL THEN 'corrected'
        ELSE 'ignored'
    END;

    v_unit_feedback := CASE
        WHEN p_final_values->>'unit' = v_prediction.predicted_unit THEN 'accepted'
        WHEN p_final_values->>'unit' IS NOT NULL THEN 'corrected'
        ELSE 'ignored'
    END;

    -- Determine overall feedback
    IF v_type_feedback = 'accepted' AND v_sensitivity_feedback = 'accepted'
       AND v_urgency_feedback = 'accepted' AND v_priority_feedback = 'accepted' THEN
        v_overall_feedback := 'accepted';
    ELSIF v_type_feedback = 'corrected' OR v_sensitivity_feedback = 'corrected'
       OR v_urgency_feedback = 'corrected' OR v_priority_feedback = 'corrected' THEN
        v_overall_feedback := 'corrected';
    ELSE
        v_overall_feedback := 'ignored';
    END IF;

    INSERT INTO ml_prediction_feedback (
        prediction_id,
        ticket_id,
        feedback_type,
        predicted_type,
        final_type,
        type_feedback,
        predicted_sensitivity,
        final_sensitivity,
        sensitivity_feedback,
        predicted_urgency,
        final_urgency,
        urgency_feedback,
        predicted_priority,
        final_priority,
        priority_feedback,
        predicted_unit,
        final_unit,
        unit_feedback,
        predicted_assignee,
        final_assignee,
        assignee_feedback,
        feedback_notes,
        feedback_by
    ) VALUES (
        p_prediction_id,
        v_prediction.ticket_id,
        v_overall_feedback,
        v_prediction.predicted_type,
        (p_final_values->>'type')::request_type,
        v_type_feedback,
        v_prediction.predicted_sensitivity,
        (p_final_values->>'sensitivity')::sensitivity_level,
        v_sensitivity_feedback,
        v_prediction.predicted_urgency,
        (p_final_values->>'urgency')::urgency_level,
        v_urgency_feedback,
        v_prediction.predicted_priority,
        (p_final_values->>'priority')::priority_level,
        v_priority_feedback,
        v_prediction.predicted_unit,
        p_final_values->>'unit',
        v_unit_feedback,
        v_prediction.predicted_assignee,
        (p_final_values->>'assignee')::UUID,
        CASE
            WHEN (p_final_values->>'assignee')::UUID = v_prediction.predicted_assignee THEN 'accepted'
            WHEN p_final_values->>'assignee' IS NOT NULL THEN 'corrected'
            ELSE 'ignored'
        END,
        p_feedback_notes,
        p_user_id
    )
    RETURNING id INTO v_feedback_id;

    -- Add to training data if corrected (for continuous learning)
    IF v_overall_feedback = 'corrected' THEN
        INSERT INTO ml_training_data (
            ticket_id,
            title,
            description,
            request_type,
            label_type,
            label_sensitivity,
            label_urgency,
            label_priority,
            label_assigned_unit,
            label_source,
            labeled_by
        )
        SELECT
            t.id,
            t.title,
            t.description,
            t.request_type,
            COALESCE((p_final_values->>'type')::request_type, t.request_type),
            COALESCE((p_final_values->>'sensitivity')::sensitivity_level, t.sensitivity),
            COALESCE((p_final_values->>'urgency')::urgency_level, t.urgency),
            COALESCE((p_final_values->>'priority')::priority_level, t.priority),
            COALESCE(p_final_values->>'unit', t.assigned_unit),
            'corrected',
            p_user_id
        FROM intake_tickets t
        WHERE t.id = v_prediction.ticket_id
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN v_feedback_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get matching assignment rules
CREATE OR REPLACE FUNCTION get_matching_assignment_rules(
    p_request_type request_type,
    p_sensitivity sensitivity_level,
    p_urgency urgency_level,
    p_title TEXT,
    p_description TEXT
) RETURNS TABLE (
    rule_id UUID,
    rule_name TEXT,
    assign_to_unit TEXT,
    assign_to_user UUID,
    match_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id as rule_id,
        r.rule_name,
        r.assign_to_unit,
        r.assign_to_user,
        -- Calculate match score based on how many criteria matched
        (CASE WHEN p_request_type = ANY(r.match_request_type) THEN 1 ELSE 0 END +
         CASE WHEN p_sensitivity = ANY(r.match_sensitivity) THEN 1 ELSE 0 END +
         CASE WHEN p_urgency = ANY(r.match_urgency) THEN 1 ELSE 0 END +
         CASE WHEN EXISTS (
             SELECT 1 FROM unnest(r.match_keywords) k
             WHERE lower(p_title || ' ' || p_description) LIKE '%' || lower(k) || '%'
         ) THEN 1 ELSE 0 END
        )::INTEGER as match_score
    FROM ml_assignment_rules r
    WHERE r.is_active = TRUE
    AND (
        r.match_request_type IS NULL OR p_request_type = ANY(r.match_request_type)
    )
    AND (
        r.match_sensitivity IS NULL OR p_sensitivity = ANY(r.match_sensitivity)
    )
    AND (
        r.match_urgency IS NULL OR p_urgency = ANY(r.match_urgency)
    )
    ORDER BY r.priority ASC, match_score DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Function to get model performance metrics
CREATE OR REPLACE FUNCTION get_model_performance_metrics(
    p_model_id UUID,
    p_days INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
    v_metrics JSONB;
BEGIN
    WITH feedback_stats AS (
        SELECT
            COUNT(*) as total_predictions,
            COUNT(*) FILTER (WHERE feedback_type = 'accepted') as accepted,
            COUNT(*) FILTER (WHERE feedback_type = 'corrected') as corrected,
            COUNT(*) FILTER (WHERE feedback_type = 'rejected') as rejected,
            COUNT(*) FILTER (WHERE type_feedback = 'accepted') as type_correct,
            COUNT(*) FILTER (WHERE sensitivity_feedback = 'accepted') as sensitivity_correct,
            COUNT(*) FILTER (WHERE urgency_feedback = 'accepted') as urgency_correct,
            COUNT(*) FILTER (WHERE priority_feedback = 'accepted') as priority_correct,
            COUNT(*) FILTER (WHERE unit_feedback = 'accepted') as unit_correct
        FROM ml_prediction_feedback f
        JOIN ml_classification_predictions p ON f.prediction_id = p.id
        WHERE p.model_id = p_model_id
        AND f.feedback_at >= NOW() - (p_days || ' days')::INTERVAL
    )
    SELECT jsonb_build_object(
        'total_predictions', total_predictions,
        'acceptance_rate', CASE WHEN total_predictions > 0
            THEN ROUND(accepted::NUMERIC / total_predictions, 4) ELSE 0 END,
        'correction_rate', CASE WHEN total_predictions > 0
            THEN ROUND(corrected::NUMERIC / total_predictions, 4) ELSE 0 END,
        'accuracy_by_field', jsonb_build_object(
            'type', CASE WHEN total_predictions > 0
                THEN ROUND(type_correct::NUMERIC / total_predictions, 4) ELSE 0 END,
            'sensitivity', CASE WHEN total_predictions > 0
                THEN ROUND(sensitivity_correct::NUMERIC / total_predictions, 4) ELSE 0 END,
            'urgency', CASE WHEN total_predictions > 0
                THEN ROUND(urgency_correct::NUMERIC / total_predictions, 4) ELSE 0 END,
            'priority', CASE WHEN total_predictions > 0
                THEN ROUND(priority_correct::NUMERIC / total_predictions, 4) ELSE 0 END,
            'unit', CASE WHEN total_predictions > 0
                THEN ROUND(unit_correct::NUMERIC / total_predictions, 4) ELSE 0 END
        ),
        'period_days', p_days
    ) INTO v_metrics
    FROM feedback_stats;

    RETURN v_metrics;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Indexes
-- ============================================================================

-- ML Models indexes
CREATE INDEX idx_ml_models_active ON ml_classification_models(model_name, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ml_models_status ON ml_classification_models(status);

-- Training data indexes
CREATE INDEX idx_ml_training_ticket ON ml_training_data(ticket_id);
CREATE INDEX idx_ml_training_type ON ml_training_data(label_type);
CREATE INDEX idx_ml_training_not_used ON ml_training_data(used_in_training) WHERE used_in_training = FALSE;

-- Predictions indexes
CREATE INDEX idx_ml_predictions_ticket ON ml_classification_predictions(ticket_id);
CREATE INDEX idx_ml_predictions_model ON ml_classification_predictions(model_id);
CREATE INDEX idx_ml_predictions_created ON ml_classification_predictions(created_at DESC);
CREATE INDEX idx_ml_predictions_confidence ON ml_classification_predictions(overall_confidence DESC);

-- Feedback indexes
CREATE INDEX idx_ml_feedback_prediction ON ml_prediction_feedback(prediction_id);
CREATE INDEX idx_ml_feedback_ticket ON ml_prediction_feedback(ticket_id);
CREATE INDEX idx_ml_feedback_type ON ml_prediction_feedback(feedback_type);
CREATE INDEX idx_ml_feedback_not_used ON ml_prediction_feedback(used_for_retraining) WHERE used_for_retraining = FALSE;

-- Assignment rules indexes
CREATE INDEX idx_ml_rules_active ON ml_assignment_rules(is_active, priority) WHERE is_active = TRUE;

-- Keyword patterns indexes
CREATE INDEX idx_ml_patterns_active ON ml_keyword_patterns(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ml_patterns_type ON ml_keyword_patterns(indicates_type);
CREATE INDEX idx_ml_patterns_urgency ON ml_keyword_patterns(indicates_urgency);

-- ============================================================================
-- Seed default keyword patterns
-- ============================================================================

INSERT INTO ml_keyword_patterns (pattern, pattern_ar, pattern_type, indicates_urgency, weight, created_by) VALUES
    ('urgent', 'عاجل', 'keyword', 'high', 2.0, '00000000-0000-0000-0000-000000000000'),
    ('asap', 'في أسرع وقت', 'keyword', 'high', 1.8, '00000000-0000-0000-0000-000000000000'),
    ('immediately', 'فوراً', 'keyword', 'critical', 2.5, '00000000-0000-0000-0000-000000000000'),
    ('critical', 'حرج', 'keyword', 'critical', 2.5, '00000000-0000-0000-0000-000000000000'),
    ('emergency', 'طوارئ', 'keyword', 'critical', 3.0, '00000000-0000-0000-0000-000000000000'),
    ('deadline', 'موعد نهائي', 'keyword', 'high', 1.5, '00000000-0000-0000-0000-000000000000'),
    ('time-sensitive', 'حساس للوقت', 'keyword', 'high', 1.8, '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

INSERT INTO ml_keyword_patterns (pattern, pattern_ar, pattern_type, indicates_sensitivity, weight, created_by) VALUES
    ('confidential', 'سري', 'keyword', 'confidential', 2.0, '00000000-0000-0000-0000-000000000000'),
    ('secret', 'سري للغاية', 'keyword', 'secret', 2.5, '00000000-0000-0000-0000-000000000000'),
    ('classified', 'مصنف', 'keyword', 'secret', 2.5, '00000000-0000-0000-0000-000000000000'),
    ('internal only', 'داخلي فقط', 'phrase', 'internal', 1.5, '00000000-0000-0000-0000-000000000000'),
    ('restricted', 'مقيد', 'keyword', 'confidential', 1.8, '00000000-0000-0000-0000-000000000000'),
    ('sensitive', 'حساس', 'keyword', 'confidential', 1.5, '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

INSERT INTO ml_keyword_patterns (pattern, pattern_ar, pattern_type, indicates_type, weight, created_by) VALUES
    ('partnership', 'شراكة', 'keyword', 'engagement', 1.5, '00000000-0000-0000-0000-000000000000'),
    ('collaboration', 'تعاون', 'keyword', 'engagement', 1.5, '00000000-0000-0000-0000-000000000000'),
    ('mou', 'مذكرة تفاهم', 'keyword', 'mou_action', 2.0, '00000000-0000-0000-0000-000000000000'),
    ('memorandum', 'مذكرة', 'keyword', 'mou_action', 1.8, '00000000-0000-0000-0000-000000000000'),
    ('agreement', 'اتفاقية', 'keyword', 'mou_action', 1.5, '00000000-0000-0000-0000-000000000000'),
    ('position', 'موقف', 'keyword', 'position', 1.5, '00000000-0000-0000-0000-000000000000'),
    ('stance', 'موقف', 'keyword', 'position', 1.5, '00000000-0000-0000-0000-000000000000'),
    ('policy', 'سياسة', 'keyword', 'position', 1.3, '00000000-0000-0000-0000-000000000000'),
    ('forecast', 'توقعات', 'keyword', 'foresight', 1.5, '00000000-0000-0000-0000-000000000000'),
    ('trend', 'اتجاه', 'keyword', 'foresight', 1.3, '00000000-0000-0000-0000-000000000000'),
    ('future', 'مستقبل', 'keyword', 'foresight', 1.3, '00000000-0000-0000-0000-000000000000'),
    ('analysis', 'تحليل', 'keyword', 'foresight', 1.2, '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Seed default assignment rules
-- ============================================================================

INSERT INTO ml_assignment_rules (rule_name, rule_name_ar, description, match_request_type, assign_to_unit, priority, created_by) VALUES
    ('Engagement Team Routing', 'توجيه فريق التعاون', 'Route engagement requests to engagement team', ARRAY['engagement']::request_type[], 'engagement-team', 100, '00000000-0000-0000-0000-000000000000'),
    ('MOU Team Routing', 'توجيه فريق مذكرات التفاهم', 'Route MOU actions to MOU team', ARRAY['mou_action']::request_type[], 'mou-team', 100, '00000000-0000-0000-0000-000000000000'),
    ('Position Team Routing', 'توجيه فريق المواقف', 'Route position requests to position development team', ARRAY['position']::request_type[], 'position-dev-team', 100, '00000000-0000-0000-0000-000000000000'),
    ('Foresight Team Routing', 'توجيه فريق الاستشراف', 'Route foresight requests to foresight team', ARRAY['foresight']::request_type[], 'foresight-team', 100, '00000000-0000-0000-0000-000000000000'),
    ('Critical Escalation', 'تصعيد الحالات الحرجة', 'Escalate critical urgency items to senior team', NULL, 'senior-review-team', 50, '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Update the critical escalation rule with urgency filter
UPDATE ml_assignment_rules
SET match_urgency = ARRAY['critical']::urgency_level[]
WHERE rule_name = 'Critical Escalation';

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE ml_classification_models IS 'ML model registry for intake ticket classification';
COMMENT ON TABLE ml_training_data IS 'Labeled training data for ML model training and validation';
COMMENT ON TABLE ml_classification_predictions IS 'All predictions made by ML models for audit and retraining';
COMMENT ON TABLE ml_prediction_feedback IS 'User feedback on predictions for continuous learning';
COMMENT ON TABLE ml_assignment_rules IS 'Rule-based assignment routing configuration';
COMMENT ON TABLE ml_keyword_patterns IS 'Keyword patterns for rule-based classification fallback';

COMMENT ON FUNCTION get_confidence_level IS 'Convert numeric confidence score to categorical level';
COMMENT ON FUNCTION get_active_classification_model IS 'Get the currently active ML model for classification';
COMMENT ON FUNCTION store_classification_prediction IS 'Store a prediction with all probability distributions';
COMMENT ON FUNCTION record_prediction_feedback IS 'Record user feedback and create training data from corrections';
COMMENT ON FUNCTION get_matching_assignment_rules IS 'Get assignment rules matching given criteria';
COMMENT ON FUNCTION get_model_performance_metrics IS 'Get performance metrics for a model over time period';
