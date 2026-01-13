-- Migration: MoU Renewal Workflow with Expiration Alerts
-- Purpose: Automated MoU renewal process with 90/60/30 day expiration alerts,
--          renewal initiation workflow, and historical version linking
-- Feature: commitment-renewal-workflow
-- Date: 2026-01-10

-- Create ENUM types for renewal workflow
DO $$ BEGIN
    CREATE TYPE public.renewal_status AS ENUM (
        'pending',           -- Awaiting renewal initiation
        'initiated',         -- Renewal process started
        'negotiation',       -- In renewal negotiations
        'approved',          -- Renewal approved
        'signed',            -- New MoU signed
        'completed',         -- Renewal completed
        'declined',          -- Renewal declined
        'expired'            -- Expired without renewal
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.alert_type AS ENUM (
        'expiration_90_days',
        'expiration_60_days',
        'expiration_30_days',
        'expiration_7_days',
        'expired',
        'renewal_initiated',
        'renewal_approved',
        'renewal_completed'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.alert_status AS ENUM (
        'pending',
        'sent',
        'acknowledged',
        'dismissed'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create MoU Renewal table for tracking renewal processes
CREATE TABLE IF NOT EXISTS public.mou_renewals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to original and renewed MoU
    original_mou_id UUID NOT NULL REFERENCES public.mous(id) ON DELETE CASCADE,
    renewed_mou_id UUID REFERENCES public.mous(id) ON DELETE SET NULL,

    -- Renewal tracking
    renewal_status public.renewal_status NOT NULL DEFAULT 'pending',
    renewal_reference_number TEXT UNIQUE,

    -- Dates
    initiated_at TIMESTAMPTZ,
    negotiation_started_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Original expiry tracking
    original_expiry_date DATE NOT NULL,
    proposed_new_expiry_date DATE,
    final_new_expiry_date DATE,

    -- Renewal terms
    renewal_period_months INTEGER CHECK (renewal_period_months > 0),
    terms_changed BOOLEAN DEFAULT false,
    terms_change_summary_en TEXT,
    terms_change_summary_ar TEXT,

    -- Notes and reasoning
    notes_en TEXT,
    notes_ar TEXT,
    decline_reason_en TEXT,
    decline_reason_ar TEXT,

    -- Responsible parties
    initiated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,

    -- Ensure we have either a renewed MoU ID or the renewal is not completed
    CONSTRAINT check_renewed_mou_on_completion CHECK (
        (renewal_status IN ('completed', 'signed') AND renewed_mou_id IS NOT NULL) OR
        (renewal_status NOT IN ('completed', 'signed'))
    )
);

-- Create MoU Expiration Alerts table
CREATE TABLE IF NOT EXISTS public.mou_expiration_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mou_id UUID NOT NULL REFERENCES public.mous(id) ON DELETE CASCADE,

    -- Alert details
    alert_type public.alert_type NOT NULL,
    alert_status public.alert_status NOT NULL DEFAULT 'pending',

    -- Dates
    scheduled_for DATE NOT NULL,
    sent_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Notification tracking
    email_sent BOOLEAN DEFAULT false,
    in_app_sent BOOLEAN DEFAULT false,

    -- Message content (bilingual)
    message_en TEXT,
    message_ar TEXT,

    -- Recipients
    recipient_ids UUID[] NOT NULL DEFAULT '{}',

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,

    -- Unique constraint: one alert per type per MoU
    UNIQUE(mou_id, alert_type)
);

-- Create MoU Version History table for linking renewed MoUs
CREATE TABLE IF NOT EXISTS public.mou_version_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Version chain
    mou_id UUID NOT NULL REFERENCES public.mous(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL CHECK (version_number > 0),

    -- Previous version link
    previous_version_id UUID REFERENCES public.mous(id) ON DELETE SET NULL,
    renewal_id UUID REFERENCES public.mou_renewals(id) ON DELETE SET NULL,

    -- Version metadata
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_current BOOLEAN NOT NULL DEFAULT true,

    -- Key changes from previous version
    changes_summary_en TEXT,
    changes_summary_ar TEXT,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Unique constraints
    UNIQUE(mou_id)
);

-- Create Renewal Negotiation History table
CREATE TABLE IF NOT EXISTS public.mou_renewal_negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renewal_id UUID NOT NULL REFERENCES public.mou_renewals(id) ON DELETE CASCADE,

    -- Negotiation details
    negotiation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    negotiated_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,

    -- Content
    summary_en TEXT NOT NULL CHECK (char_length(summary_en) >= 10),
    summary_ar TEXT NOT NULL CHECK (char_length(summary_ar) >= 10),

    -- Proposed changes
    proposed_changes JSONB DEFAULT '{}',

    -- Status
    outcome TEXT CHECK (outcome IN ('positive', 'negative', 'pending', 'follow_up_required')),

    -- Next steps
    next_steps_en TEXT,
    next_steps_ar TEXT,
    next_meeting_date DATE,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mou_renewals_original_mou ON public.mou_renewals(original_mou_id);
CREATE INDEX IF NOT EXISTS idx_mou_renewals_renewed_mou ON public.mou_renewals(renewed_mou_id);
CREATE INDEX IF NOT EXISTS idx_mou_renewals_status ON public.mou_renewals(renewal_status);
CREATE INDEX IF NOT EXISTS idx_mou_renewals_expiry ON public.mou_renewals(original_expiry_date);
CREATE INDEX IF NOT EXISTS idx_mou_renewals_pending ON public.mou_renewals(renewal_status, original_expiry_date)
    WHERE renewal_status IN ('pending', 'initiated', 'negotiation');

CREATE INDEX IF NOT EXISTS idx_mou_alerts_mou ON public.mou_expiration_alerts(mou_id);
CREATE INDEX IF NOT EXISTS idx_mou_alerts_type ON public.mou_expiration_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_mou_alerts_status ON public.mou_expiration_alerts(alert_status);
CREATE INDEX IF NOT EXISTS idx_mou_alerts_scheduled ON public.mou_expiration_alerts(scheduled_for)
    WHERE alert_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_mou_alerts_pending ON public.mou_expiration_alerts(mou_id, alert_status)
    WHERE alert_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_mou_version_history_mou ON public.mou_version_history(mou_id);
CREATE INDEX IF NOT EXISTS idx_mou_version_history_previous ON public.mou_version_history(previous_version_id);
CREATE INDEX IF NOT EXISTS idx_mou_version_history_current ON public.mou_version_history(is_current)
    WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_mou_renewal_negotiations_renewal ON public.mou_renewal_negotiations(renewal_id);
CREATE INDEX IF NOT EXISTS idx_mou_renewal_negotiations_date ON public.mou_renewal_negotiations(negotiation_date);

-- Add updated_at trigger
CREATE TRIGGER trigger_update_mou_renewals_updated_at
    BEFORE UPDATE ON public.mou_renewals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_mou_expiration_alerts_updated_at
    BEFORE UPDATE ON public.mou_expiration_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to generate renewal reference number
CREATE OR REPLACE FUNCTION public.generate_renewal_reference()
RETURNS TRIGGER AS $$
DECLARE
    original_ref TEXT;
    renewal_count INTEGER;
BEGIN
    -- Get original MoU reference
    SELECT reference_number INTO original_ref
    FROM public.mous
    WHERE id = NEW.original_mou_id;

    -- Count existing renewals for this MoU
    SELECT COUNT(*) + 1 INTO renewal_count
    FROM public.mou_renewals
    WHERE original_mou_id = NEW.original_mou_id;

    -- Generate renewal reference: ORIGINAL-R1, ORIGINAL-R2, etc.
    NEW.renewal_reference_number := original_ref || '-R' || renewal_count;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_renewal_reference
    BEFORE INSERT ON public.mou_renewals
    FOR EACH ROW
    WHEN (NEW.renewal_reference_number IS NULL)
    EXECUTE FUNCTION public.generate_renewal_reference();

-- Function to create expiration alerts when MoU becomes active
-- Uses actual mous table columns: lifecycle_state, expiry_date, created_by, title, title_ar
CREATE OR REPLACE FUNCTION public.create_mou_expiration_alerts()
RETURNS TRIGGER AS $$
DECLARE
    v_expiry_date DATE;
    v_created_by UUID;
    v_days_arr INTEGER[] := ARRAY[90, 60, 30, 7];
    v_day INTEGER;
    v_alert_type public.alert_type;
    v_scheduled_date DATE;
    v_message_en TEXT;
    v_message_ar TEXT;
    v_mou_title_en TEXT;
    v_mou_title_ar TEXT;
BEGIN
    -- Only create alerts when MoU becomes active or signed
    IF NEW.lifecycle_state IN ('active', 'signed') AND (OLD.lifecycle_state IS NULL OR OLD.lifecycle_state NOT IN ('active', 'signed')) THEN
        v_expiry_date := NEW.expiry_date;
        v_created_by := NEW.created_by;
        v_mou_title_en := NEW.title;
        v_mou_title_ar := COALESCE(NEW.title_ar, NEW.title);

        -- Skip if no expiry date
        IF v_expiry_date IS NULL THEN
            RETURN NEW;
        END IF;

        -- Create alerts for 90, 60, 30, and 7 days
        FOREACH v_day IN ARRAY v_days_arr
        LOOP
            v_scheduled_date := v_expiry_date - (v_day || ' days')::INTERVAL;

            -- Skip if scheduled date is in the past
            IF v_scheduled_date <= CURRENT_DATE THEN
                CONTINUE;
            END IF;

            -- Determine alert type
            v_alert_type := CASE v_day
                WHEN 90 THEN 'expiration_90_days'::public.alert_type
                WHEN 60 THEN 'expiration_60_days'::public.alert_type
                WHEN 30 THEN 'expiration_30_days'::public.alert_type
                WHEN 7 THEN 'expiration_7_days'::public.alert_type
            END;

            -- Generate messages
            v_message_en := format('MoU "%s" will expire in %s days on %s. Please initiate renewal process if required.',
                v_mou_title_en, v_day, to_char(v_expiry_date, 'YYYY-MM-DD'));
            v_message_ar := format('مذكرة التفاهم "%s" ستنتهي خلال %s يوم في %s. يرجى بدء عملية التجديد إذا لزم الأمر.',
                v_mou_title_ar, v_day, to_char(v_expiry_date, 'YYYY-MM-DD'));

            -- Insert alert (upsert to handle re-activation)
            INSERT INTO public.mou_expiration_alerts (
                mou_id,
                alert_type,
                scheduled_for,
                message_en,
                message_ar,
                recipient_ids
            ) VALUES (
                NEW.id,
                v_alert_type,
                v_scheduled_date,
                v_message_en,
                v_message_ar,
                ARRAY[v_created_by]
            )
            ON CONFLICT (mou_id, alert_type) DO UPDATE SET
                scheduled_for = EXCLUDED.scheduled_for,
                message_en = EXCLUDED.message_en,
                message_ar = EXCLUDED.message_ar,
                alert_status = 'pending',
                sent_at = NULL,
                updated_at = now();
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_mou_expiration_alerts
    AFTER INSERT OR UPDATE OF lifecycle_state ON public.mous
    FOR EACH ROW
    EXECUTE FUNCTION public.create_mou_expiration_alerts();

-- Function to get MoUs expiring soon with alert status
-- Uses actual mous table columns: lifecycle_state, expiry_date, created_by, title, title_ar
-- Joins with signatory dossiers for party names instead of primary_party_id/secondary_party_id
CREATE OR REPLACE FUNCTION public.get_expiring_mous(
    p_days_ahead INTEGER DEFAULT 90,
    p_include_expired BOOLEAN DEFAULT false
)
RETURNS TABLE (
    mou_id UUID,
    reference_number TEXT,
    title_en TEXT,
    title_ar TEXT,
    expiry_date DATE,
    days_until_expiry INTEGER,
    lifecycle_state TEXT,
    renewal_status public.renewal_status,
    renewal_id UUID,
    alert_count INTEGER,
    pending_alert_count INTEGER,
    primary_party_name TEXT,
    secondary_party_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id AS mou_id,
        m.reference_number::TEXT,
        m.title::TEXT AS title_en,
        COALESCE(m.title_ar, m.title)::TEXT AS title_ar,
        m.expiry_date,
        (m.expiry_date - CURRENT_DATE)::INTEGER AS days_until_expiry,
        m.lifecycle_state::TEXT,
        r.renewal_status,
        r.id AS renewal_id,
        COALESCE(a.alert_count, 0)::INTEGER,
        COALESCE(a.pending_count, 0)::INTEGER,
        d1.full_name_en::TEXT AS primary_party_name,
        d2.full_name_en::TEXT AS secondary_party_name
    FROM public.mous m
    LEFT JOIN public.dossiers d1 ON m.signatory_1_dossier_id = d1.id
    LEFT JOIN public.dossiers d2 ON m.signatory_2_dossier_id = d2.id
    LEFT JOIN LATERAL (
        SELECT
            mr.renewal_status,
            mr.id
        FROM public.mou_renewals mr
        WHERE mr.original_mou_id = m.id
        ORDER BY mr.created_at DESC
        LIMIT 1
    ) r ON true
    LEFT JOIN LATERAL (
        SELECT
            COUNT(*)::INTEGER AS alert_count,
            COUNT(*) FILTER (WHERE ea.alert_status = 'pending')::INTEGER AS pending_count
        FROM public.mou_expiration_alerts ea
        WHERE ea.mou_id = m.id
    ) a ON true
    WHERE m.lifecycle_state IN ('active', 'signed')
    AND m.expiry_date IS NOT NULL
    AND (
        (p_include_expired AND m.expiry_date <= CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL)
        OR
        (NOT p_include_expired AND m.expiry_date > CURRENT_DATE AND m.expiry_date <= CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL)
    )
    ORDER BY m.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to initiate MoU renewal
CREATE OR REPLACE FUNCTION public.initiate_mou_renewal(
    p_mou_id UUID,
    p_proposed_expiry_date DATE DEFAULT NULL,
    p_renewal_period_months INTEGER DEFAULT NULL,
    p_notes_en TEXT DEFAULT NULL,
    p_notes_ar TEXT DEFAULT NULL,
    p_initiated_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_mou RECORD;
    v_renewal_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := COALESCE(p_initiated_by, auth.uid());

    -- Get MoU details
    SELECT * INTO v_mou
    FROM public.mous
    WHERE id = p_mou_id;

    IF v_mou IS NULL THEN
        RAISE EXCEPTION 'MoU not found: %', p_mou_id;
    END IF;

    -- Check if MoU is in a renewable state
    IF v_mou.lifecycle_state NOT IN ('active', 'signed', 'expired') THEN
        RAISE EXCEPTION 'MoU must be active, signed, or expired to initiate renewal. Current state: %', v_mou.lifecycle_state;
    END IF;

    -- Check if there's already an active renewal
    IF EXISTS (
        SELECT 1 FROM public.mou_renewals
        WHERE original_mou_id = p_mou_id
        AND renewal_status NOT IN ('completed', 'declined', 'expired')
    ) THEN
        RAISE EXCEPTION 'An active renewal process already exists for this MoU';
    END IF;

    -- Create renewal record
    INSERT INTO public.mou_renewals (
        original_mou_id,
        renewal_status,
        original_expiry_date,
        proposed_new_expiry_date,
        renewal_period_months,
        notes_en,
        notes_ar,
        initiated_by,
        initiated_at
    ) VALUES (
        p_mou_id,
        'initiated',
        v_mou.expiry_date,
        COALESCE(p_proposed_expiry_date, v_mou.expiry_date + COALESCE(p_renewal_period_months, 12) * INTERVAL '1 month'),
        COALESCE(p_renewal_period_months, 12),
        p_notes_en,
        p_notes_ar,
        v_user_id,
        now()
    )
    RETURNING id INTO v_renewal_id;

    -- Create renewal initiated alert
    INSERT INTO public.mou_expiration_alerts (
        mou_id,
        alert_type,
        alert_status,
        scheduled_for,
        sent_at,
        message_en,
        message_ar,
        recipient_ids
    ) VALUES (
        p_mou_id,
        'renewal_initiated',
        'sent',
        CURRENT_DATE,
        now(),
        format('Renewal process initiated for MoU "%s"', v_mou.title),
        format('تم بدء عملية التجديد لمذكرة التفاهم "%s"', COALESCE(v_mou.title_ar, v_mou.title)),
        ARRAY[v_mou.created_by]
    )
    ON CONFLICT (mou_id, alert_type) DO UPDATE SET
        alert_status = 'sent',
        sent_at = now(),
        updated_at = now();

    RETURN v_renewal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update renewal status
CREATE OR REPLACE FUNCTION public.update_renewal_status(
    p_renewal_id UUID,
    p_new_status public.renewal_status,
    p_notes_en TEXT DEFAULT NULL,
    p_notes_ar TEXT DEFAULT NULL,
    p_decline_reason_en TEXT DEFAULT NULL,
    p_decline_reason_ar TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_renewal RECORD;
    v_valid_transitions JSONB;
BEGIN
    -- Get current renewal
    SELECT * INTO v_renewal
    FROM public.mou_renewals
    WHERE id = p_renewal_id;

    IF v_renewal IS NULL THEN
        RAISE EXCEPTION 'Renewal not found: %', p_renewal_id;
    END IF;

    -- Define valid transitions
    v_valid_transitions := '{
        "pending": ["initiated"],
        "initiated": ["negotiation", "declined"],
        "negotiation": ["approved", "declined"],
        "approved": ["signed", "declined"],
        "signed": ["completed"],
        "declined": [],
        "expired": [],
        "completed": []
    }'::JSONB;

    -- Check if transition is valid
    IF NOT (v_valid_transitions->v_renewal.renewal_status::TEXT) ? p_new_status::TEXT THEN
        RAISE EXCEPTION 'Invalid status transition from % to %', v_renewal.renewal_status, p_new_status;
    END IF;

    -- Update renewal
    UPDATE public.mou_renewals
    SET
        renewal_status = p_new_status,
        notes_en = COALESCE(p_notes_en, notes_en),
        notes_ar = COALESCE(p_notes_ar, notes_ar),
        decline_reason_en = COALESCE(p_decline_reason_en, decline_reason_en),
        decline_reason_ar = COALESCE(p_decline_reason_ar, decline_reason_ar),
        negotiation_started_at = CASE WHEN p_new_status = 'negotiation' THEN now() ELSE negotiation_started_at END,
        approved_at = CASE WHEN p_new_status = 'approved' THEN now() ELSE approved_at END,
        approved_by = CASE WHEN p_new_status = 'approved' THEN auth.uid() ELSE approved_by END,
        completed_at = CASE WHEN p_new_status = 'completed' THEN now() ELSE completed_at END,
        updated_at = now()
    WHERE id = p_renewal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete renewal and create new MoU version
CREATE OR REPLACE FUNCTION public.complete_mou_renewal(
    p_renewal_id UUID,
    p_new_mou_id UUID,
    p_terms_changed BOOLEAN DEFAULT false,
    p_terms_change_summary_en TEXT DEFAULT NULL,
    p_terms_change_summary_ar TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_renewal RECORD;
    v_original_mou RECORD;
    v_new_mou RECORD;
    v_version_number INTEGER;
BEGIN
    -- Get renewal
    SELECT * INTO v_renewal
    FROM public.mou_renewals
    WHERE id = p_renewal_id;

    IF v_renewal IS NULL THEN
        RAISE EXCEPTION 'Renewal not found: %', p_renewal_id;
    END IF;

    IF v_renewal.renewal_status NOT IN ('signed', 'approved') THEN
        RAISE EXCEPTION 'Renewal must be signed or approved to complete. Current status: %', v_renewal.renewal_status;
    END IF;

    -- Get original MoU
    SELECT * INTO v_original_mou
    FROM public.mous
    WHERE id = v_renewal.original_mou_id;

    -- Get new MoU
    SELECT * INTO v_new_mou
    FROM public.mous
    WHERE id = p_new_mou_id;

    IF v_new_mou IS NULL THEN
        RAISE EXCEPTION 'New MoU not found: %', p_new_mou_id;
    END IF;

    -- Calculate version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
    FROM public.mou_version_history
    WHERE previous_version_id = v_renewal.original_mou_id
       OR mou_id = v_renewal.original_mou_id;

    -- Mark previous version as not current
    UPDATE public.mou_version_history
    SET is_current = false
    WHERE mou_id = v_renewal.original_mou_id
       OR previous_version_id = v_renewal.original_mou_id;

    -- Create version history entry for new MoU
    INSERT INTO public.mou_version_history (
        mou_id,
        version_number,
        previous_version_id,
        renewal_id,
        effective_from,
        effective_to,
        is_current,
        changes_summary_en,
        changes_summary_ar,
        created_by
    ) VALUES (
        p_new_mou_id,
        v_version_number,
        v_renewal.original_mou_id,
        p_renewal_id,
        v_new_mou.effective_date,
        NULL,
        true,
        p_terms_change_summary_en,
        p_terms_change_summary_ar,
        auth.uid()
    );

    -- Update original MoU version history to set effective_to
    UPDATE public.mou_version_history
    SET effective_to = v_original_mou.expiry_date,
        is_current = false
    WHERE mou_id = v_renewal.original_mou_id;

    -- If no version history exists for original, create it
    IF NOT FOUND THEN
        INSERT INTO public.mou_version_history (
            mou_id,
            version_number,
            previous_version_id,
            effective_from,
            effective_to,
            is_current,
            created_by
        ) VALUES (
            v_renewal.original_mou_id,
            v_version_number - 1,
            NULL,
            v_original_mou.effective_date,
            v_original_mou.expiry_date,
            false,
            auth.uid()
        );
    END IF;

    -- Update renewal record
    UPDATE public.mou_renewals
    SET
        renewed_mou_id = p_new_mou_id,
        renewal_status = 'completed',
        final_new_expiry_date = v_new_mou.expiry_date,
        terms_changed = p_terms_changed,
        terms_change_summary_en = p_terms_change_summary_en,
        terms_change_summary_ar = p_terms_change_summary_ar,
        completed_at = now(),
        updated_at = now()
    WHERE id = p_renewal_id;

    -- Update original MoU status to expired (since it's been renewed)
    UPDATE public.mous
    SET lifecycle_state = 'expired',
        updated_at = now()
    WHERE id = v_renewal.original_mou_id;

    -- Create renewal completed alert
    INSERT INTO public.mou_expiration_alerts (
        mou_id,
        alert_type,
        alert_status,
        scheduled_for,
        sent_at,
        message_en,
        message_ar,
        recipient_ids
    ) VALUES (
        v_renewal.original_mou_id,
        'renewal_completed',
        'sent',
        CURRENT_DATE,
        now(),
        format('MoU "%s" has been successfully renewed. New reference: %s', v_original_mou.title, v_new_mou.reference_number),
        format('تم تجديد مذكرة التفاهم "%s" بنجاح. المرجع الجديد: %s', COALESCE(v_original_mou.title_ar, v_original_mou.title), v_new_mou.reference_number),
        ARRAY[v_original_mou.created_by]
    )
    ON CONFLICT (mou_id, alert_type) DO UPDATE SET
        alert_status = 'sent',
        sent_at = now(),
        message_en = EXCLUDED.message_en,
        message_ar = EXCLUDED.message_ar,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get MoU version chain
CREATE OR REPLACE FUNCTION public.get_mou_version_chain(p_mou_id UUID)
RETURNS TABLE (
    mou_id UUID,
    reference_number TEXT,
    title_en TEXT,
    title_ar TEXT,
    version_number INTEGER,
    effective_from DATE,
    effective_to DATE,
    is_current BOOLEAN,
    renewal_reference TEXT,
    changes_summary_en TEXT,
    changes_summary_ar TEXT
) AS $$
DECLARE
    v_root_mou_id UUID;
BEGIN
    -- Find the root MoU in the chain
    WITH RECURSIVE chain AS (
        -- Start with the given MoU
        SELECT mvh.mou_id, mvh.previous_version_id, 1 as depth
        FROM public.mou_version_history mvh
        WHERE mvh.mou_id = p_mou_id

        UNION ALL

        -- Go back through previous versions
        SELECT mvh.mou_id, mvh.previous_version_id, c.depth + 1
        FROM public.mou_version_history mvh
        INNER JOIN chain c ON mvh.mou_id = c.previous_version_id
        WHERE c.depth < 100 -- Prevent infinite recursion
    )
    SELECT COALESCE(
        (SELECT c.mou_id FROM chain c WHERE c.previous_version_id IS NULL ORDER BY c.depth DESC LIMIT 1),
        p_mou_id
    ) INTO v_root_mou_id;

    -- Return the full chain from root to current
    RETURN QUERY
    WITH RECURSIVE forward_chain AS (
        -- Start with root
        SELECT
            m.id,
            m.reference_number::TEXT,
            m.title::TEXT,
            COALESCE(m.title_ar, m.title)::TEXT AS title_ar_val,
            COALESCE(mvh.version_number, 1) as version_number,
            COALESCE(mvh.effective_from, m.effective_date) as effective_from,
            COALESCE(mvh.effective_to, m.expiry_date) as effective_to,
            COALESCE(mvh.is_current, m.lifecycle_state IN ('active', 'signed')) as is_current,
            mr.renewal_reference_number::TEXT,
            mvh.changes_summary_en,
            mvh.changes_summary_ar,
            1 as depth
        FROM public.mous m
        LEFT JOIN public.mou_version_history mvh ON m.id = mvh.mou_id
        LEFT JOIN public.mou_renewals mr ON mvh.renewal_id = mr.id
        WHERE m.id = v_root_mou_id

        UNION ALL

        -- Go forward through renewed versions
        SELECT
            m.id,
            m.reference_number::TEXT,
            m.title::TEXT,
            COALESCE(m.title_ar, m.title)::TEXT,
            mvh.version_number,
            mvh.effective_from,
            mvh.effective_to,
            mvh.is_current,
            mr.renewal_reference_number::TEXT,
            mvh.changes_summary_en,
            mvh.changes_summary_ar,
            fc.depth + 1
        FROM public.mou_version_history mvh
        INNER JOIN public.mous m ON mvh.mou_id = m.id
        LEFT JOIN public.mou_renewals mr ON mvh.renewal_id = mr.id
        INNER JOIN forward_chain fc ON mvh.previous_version_id = fc.id
        WHERE fc.depth < 100
    )
    SELECT
        fc.id,
        fc.reference_number,
        fc.title,
        fc.title_ar_val,
        fc.version_number,
        fc.effective_from,
        fc.effective_to,
        fc.is_current,
        fc.renewal_reference_number,
        fc.changes_summary_en,
        fc.changes_summary_ar
    FROM forward_chain fc
    ORDER BY fc.version_number ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to process pending expiration alerts (for scheduled job)
CREATE OR REPLACE FUNCTION public.process_pending_expiration_alerts()
RETURNS TABLE (
    processed_count INTEGER,
    alert_ids UUID[]
) AS $$
DECLARE
    v_count INTEGER := 0;
    v_ids UUID[] := ARRAY[]::UUID[];
    v_alert RECORD;
BEGIN
    -- Get and update pending alerts scheduled for today or earlier
    FOR v_alert IN
        SELECT ea.id, ea.mou_id, ea.alert_type, ea.message_en, ea.recipient_ids
        FROM public.mou_expiration_alerts ea
        WHERE ea.alert_status = 'pending'
        AND ea.scheduled_for <= CURRENT_DATE
        FOR UPDATE SKIP LOCKED
    LOOP
        -- Mark as sent
        UPDATE public.mou_expiration_alerts
        SET alert_status = 'sent',
            sent_at = now(),
            in_app_sent = true,
            updated_at = now()
        WHERE id = v_alert.id;

        v_count := v_count + 1;
        v_ids := array_append(v_ids, v_alert.id);
    END LOOP;

    RETURN QUERY SELECT v_count, v_ids;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-expire MoUs and create expired alerts
CREATE OR REPLACE FUNCTION public.auto_expire_mous()
RETURNS TABLE (
    expired_count INTEGER,
    expired_mou_ids UUID[]
) AS $$
DECLARE
    v_count INTEGER := 0;
    v_ids UUID[] := ARRAY[]::UUID[];
    v_mou RECORD;
BEGIN
    -- Get active/signed MoUs past expiry date
    FOR v_mou IN
        SELECT m.id, m.title, m.title_ar, m.created_by, m.expiry_date
        FROM public.mous m
        WHERE m.lifecycle_state IN ('active', 'signed')
        AND m.expiry_date < CURRENT_DATE
        FOR UPDATE SKIP LOCKED
    LOOP
        -- Update MoU status
        UPDATE public.mous
        SET lifecycle_state = 'expired',
            updated_at = now()
        WHERE id = v_mou.id;

        -- Create expired alert
        INSERT INTO public.mou_expiration_alerts (
            mou_id,
            alert_type,
            alert_status,
            scheduled_for,
            sent_at,
            message_en,
            message_ar,
            recipient_ids
        ) VALUES (
            v_mou.id,
            'expired',
            'sent',
            CURRENT_DATE,
            now(),
            format('MoU "%s" has expired on %s', v_mou.title, to_char(v_mou.expiry_date, 'YYYY-MM-DD')),
            format('انتهت صلاحية مذكرة التفاهم "%s" في %s', COALESCE(v_mou.title_ar, v_mou.title), to_char(v_mou.expiry_date, 'YYYY-MM-DD')),
            ARRAY[v_mou.created_by]
        )
        ON CONFLICT (mou_id, alert_type) DO UPDATE SET
            alert_status = 'sent',
            sent_at = now(),
            updated_at = now();

        -- Create pending renewal record
        INSERT INTO public.mou_renewals (
            original_mou_id,
            renewal_status,
            original_expiry_date
        ) VALUES (
            v_mou.id,
            'expired',
            v_mou.expiry_date
        );

        v_count := v_count + 1;
        v_ids := array_append(v_ids, v_mou.id);
    END LOOP;

    RETURN QUERY SELECT v_count, v_ids;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON public.mou_renewals TO authenticated;
GRANT ALL ON public.mou_expiration_alerts TO authenticated;
GRANT ALL ON public.mou_version_history TO authenticated;
GRANT ALL ON public.mou_renewal_negotiations TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_expiring_mous TO authenticated;
GRANT EXECUTE ON FUNCTION public.initiate_mou_renewal TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_renewal_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_mou_renewal TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mou_version_chain TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_pending_expiration_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_expire_mous TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.mou_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mou_expiration_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mou_version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mou_renewal_negotiations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mou_renewals
CREATE POLICY "Users can view renewals for MoUs they created or are admin/editor"
    ON public.mou_renewals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.mous m
            WHERE m.id = mou_renewals.original_mou_id
            AND (m.created_by = auth.uid() OR EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = auth.uid()
                AND u.role IN ('admin', 'editor')
            ))
        )
    );

CREATE POLICY "Users can create renewals for MoUs they created or are admin/editor"
    ON public.mou_renewals FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.mous m
            WHERE m.id = original_mou_id
            AND (m.created_by = auth.uid() OR EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = auth.uid()
                AND u.role IN ('admin', 'editor')
            ))
        )
    );

CREATE POLICY "Users can update renewals for MoUs they created or are admin/editor"
    ON public.mou_renewals FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.mous m
            WHERE m.id = mou_renewals.original_mou_id
            AND (m.created_by = auth.uid() OR EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = auth.uid()
                AND u.role IN ('admin', 'editor')
            ))
        )
    );

-- RLS Policies for mou_expiration_alerts
CREATE POLICY "Users can view alerts for MoUs they created or are recipients"
    ON public.mou_expiration_alerts FOR SELECT
    USING (
        auth.uid() = ANY(recipient_ids)
        OR EXISTS (
            SELECT 1 FROM public.mous m
            WHERE m.id = mou_expiration_alerts.mou_id
            AND m.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Users can update alerts they are recipients of"
    ON public.mou_expiration_alerts FOR UPDATE
    USING (
        auth.uid() = ANY(recipient_ids)
        OR EXISTS (
            SELECT 1 FROM public.mous m
            WHERE m.id = mou_expiration_alerts.mou_id
            AND m.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'editor')
        )
    );

-- RLS Policies for mou_version_history
CREATE POLICY "Users can view version history for accessible MoUs"
    ON public.mou_version_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.mous m
            WHERE m.id = mou_version_history.mou_id
            AND (
                m.lifecycle_state IN ('active', 'signed', 'expired', 'terminated')
                OR m.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.users u
                    WHERE u.id = auth.uid()
                    AND u.role IN ('admin', 'editor')
                )
            )
        )
    );

-- RLS Policies for mou_renewal_negotiations
CREATE POLICY "Users can view negotiations for accessible renewals"
    ON public.mou_renewal_negotiations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.mou_renewals r
            JOIN public.mous m ON m.id = r.original_mou_id
            WHERE r.id = mou_renewal_negotiations.renewal_id
            AND (m.created_by = auth.uid() OR EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = auth.uid()
                AND u.role IN ('admin', 'editor')
            ))
        )
    );

CREATE POLICY "Users can create negotiations for accessible renewals"
    ON public.mou_renewal_negotiations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.mou_renewals r
            JOIN public.mous m ON m.id = r.original_mou_id
            WHERE r.id = renewal_id
            AND (m.created_by = auth.uid() OR EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = auth.uid()
                AND u.role IN ('admin', 'editor')
            ))
        )
    );

-- Add comments for documentation
COMMENT ON TABLE public.mou_renewals IS 'Tracks MoU renewal processes with status workflow';
COMMENT ON TABLE public.mou_expiration_alerts IS 'Expiration alerts for MoUs at 90/60/30/7 day intervals';
COMMENT ON TABLE public.mou_version_history IS 'Links renewed MoUs to their previous versions';
COMMENT ON TABLE public.mou_renewal_negotiations IS 'Audit trail of renewal negotiation meetings';

COMMENT ON FUNCTION public.get_expiring_mous IS 'Returns MoUs expiring within specified days with alert and renewal status';
COMMENT ON FUNCTION public.initiate_mou_renewal IS 'Starts the renewal process for an MoU';
COMMENT ON FUNCTION public.update_renewal_status IS 'Updates renewal status with validation';
COMMENT ON FUNCTION public.complete_mou_renewal IS 'Completes renewal by linking to new MoU and updating version history';
COMMENT ON FUNCTION public.get_mou_version_chain IS 'Returns the full version chain for an MoU';
COMMENT ON FUNCTION public.process_pending_expiration_alerts IS 'Processes pending alerts scheduled for today or earlier';
COMMENT ON FUNCTION public.auto_expire_mous IS 'Auto-expires active MoUs past their expiry date';
