-- Migration: Add Recurring Event Patterns Support
-- Feature: recurring-event-patterns
-- Date: 2026-01-11
-- Description: Support for complex recurring event patterns (daily, weekly, monthly, yearly)
--              with exception handling, series editing, and participant notifications

-- ==============================================================================
-- PART 1: ENUM TYPES
-- ==============================================================================

-- Recurrence frequency enum
CREATE TYPE recurrence_frequency AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'yearly'
);

-- Month week position for monthly recurrence (e.g., "second Tuesday")
CREATE TYPE month_week_position AS ENUM (
  'first',
  'second',
  'third',
  'fourth',
  'last'
);

-- Series edit scope - what to update when editing a recurring event
CREATE TYPE series_edit_scope AS ENUM (
  'single',        -- Edit only this occurrence
  'this_and_future', -- Edit this and all future occurrences
  'all'            -- Edit all occurrences in the series
);

-- Notification type for event changes
CREATE TYPE event_notification_type AS ENUM (
  'created',
  'updated',
  'cancelled',
  'rescheduled',
  'exception_added',
  'series_modified'
);

-- ==============================================================================
-- PART 2: RECURRENCE RULES TABLE
-- ==============================================================================

-- Stores the recurrence rule/pattern for a recurring event series
CREATE TABLE IF NOT EXISTS recurrence_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Frequency and interval
  frequency recurrence_frequency NOT NULL,
  interval_count INTEGER NOT NULL DEFAULT 1 CHECK (interval_count > 0 AND interval_count <= 365),

  -- Weekly recurrence: which days of the week (0=Sunday, 1=Monday, ..., 6=Saturday)
  -- For Saudi Arabia: Weekend is Friday(5) and Saturday(6)
  days_of_week INTEGER[] CHECK (
    days_of_week IS NULL OR
    array_length(days_of_week, 1) <= 7 AND
    days_of_week <@ ARRAY[0,1,2,3,4,5,6]
  ),

  -- Monthly recurrence options
  day_of_month INTEGER CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)),
  week_of_month month_week_position,
  day_of_week_monthly INTEGER CHECK (day_of_week_monthly IS NULL OR (day_of_week_monthly >= 0 AND day_of_week_monthly <= 6)),

  -- Yearly recurrence
  month_of_year INTEGER CHECK (month_of_year IS NULL OR (month_of_year >= 1 AND month_of_year <= 12)),

  -- End conditions (exactly one should be set for finite series)
  end_date DATE,
  occurrence_count INTEGER CHECK (occurrence_count IS NULL OR occurrence_count > 0),
  -- If both end_date and occurrence_count are NULL, series repeats indefinitely (with reasonable limit)

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE recurrence_rules IS 'Stores recurrence patterns for calendar event series';
COMMENT ON COLUMN recurrence_rules.days_of_week IS 'Array of weekday indices (0-6, Sunday=0) for weekly recurrence';
COMMENT ON COLUMN recurrence_rules.week_of_month IS 'For monthly patterns like "second Tuesday of every month"';

-- ==============================================================================
-- PART 3: EVENT SERIES TABLE
-- ==============================================================================

-- Groups recurring events into a series
CREATE TABLE IF NOT EXISTS event_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to recurrence rule
  recurrence_rule_id UUID NOT NULL REFERENCES recurrence_rules(id) ON DELETE CASCADE,

  -- Master event template (original event that defines the pattern)
  master_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,

  -- Series metadata
  series_title_en TEXT,
  series_title_ar TEXT,

  -- Start and end of the series range
  series_start_date DATE NOT NULL,
  series_end_date DATE, -- NULL means ongoing

  -- Track total generated occurrences and version for optimistic locking
  total_occurrences INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,

  -- Audit fields
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE event_series IS 'Groups recurring events into a series with shared recurrence pattern';

-- ==============================================================================
-- PART 4: ADD RECURRENCE COLUMNS TO CALENDAR_EVENTS
-- ==============================================================================

-- Add recurrence-related columns to calendar_events
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES event_series(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS occurrence_date DATE,
  ADD COLUMN IF NOT EXISTS is_exception BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS exception_type TEXT CHECK (exception_type IS NULL OR exception_type IN ('cancelled', 'rescheduled', 'modified')),
  ADD COLUMN IF NOT EXISTS original_start_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_master BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN calendar_events.series_id IS 'Links event to its recurring series';
COMMENT ON COLUMN calendar_events.occurrence_date IS 'The specific date this occurrence represents in the series';
COMMENT ON COLUMN calendar_events.is_exception IS 'True if this occurrence differs from the series pattern';
COMMENT ON COLUMN calendar_events.exception_type IS 'Type of exception: cancelled, rescheduled, or modified';
COMMENT ON COLUMN calendar_events.original_start_datetime IS 'Original datetime before rescheduling';
COMMENT ON COLUMN calendar_events.is_master IS 'True if this is the master event that defines the series template';

-- ==============================================================================
-- PART 5: SERIES EXCEPTIONS TABLE
-- ==============================================================================

-- Track exceptions to recurring series (cancellations, modifications)
CREATE TABLE IF NOT EXISTS series_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES event_series(id) ON DELETE CASCADE,

  -- The original occurrence date that was modified/cancelled
  exception_date DATE NOT NULL,

  -- If cancelled, the event_id is NULL; if modified, points to the modified event
  replacement_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,

  -- Exception details
  exception_type TEXT NOT NULL CHECK (exception_type IN ('cancelled', 'rescheduled', 'modified')),
  reason_en TEXT,
  reason_ar TEXT,

  -- Audit fields
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint: one exception per date per series
  UNIQUE(series_id, exception_date)
);

COMMENT ON TABLE series_exceptions IS 'Tracks exceptions to recurring event series (cancellations, modifications)';

-- ==============================================================================
-- PART 6: EVENT NOTIFICATIONS TABLE
-- ==============================================================================

-- Track notifications sent to participants about event changes
CREATE TABLE IF NOT EXISTS event_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event reference
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  series_id UUID REFERENCES event_series(id) ON DELETE CASCADE,

  -- Recipient
  participant_id UUID NOT NULL,
  participant_type TEXT NOT NULL CHECK (participant_type IN ('user', 'external_contact', 'person_dossier')),

  -- Notification details
  notification_type event_notification_type NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  message_en TEXT NOT NULL,
  message_ar TEXT,

  -- Change details (JSON for flexibility)
  change_summary JSONB,

  -- Delivery tracking
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Email delivery (optional)
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE event_notifications IS 'Tracks notifications sent to participants about event changes';

-- Index for quick lookup of unread notifications
CREATE INDEX idx_event_notifications_unread ON event_notifications(participant_id, is_read) WHERE NOT is_read;
CREATE INDEX idx_event_notifications_unsent ON event_notifications(is_sent) WHERE NOT is_sent;

-- ==============================================================================
-- PART 7: INDEXES FOR PERFORMANCE
-- ==============================================================================

-- Index for finding events in a series
CREATE INDEX idx_calendar_events_series_id ON calendar_events(series_id) WHERE series_id IS NOT NULL;

-- Index for finding exceptions by date
CREATE INDEX idx_calendar_events_occurrence_date ON calendar_events(occurrence_date) WHERE occurrence_date IS NOT NULL;

-- Index for finding master events
CREATE INDEX idx_calendar_events_is_master ON calendar_events(is_master) WHERE is_master = true;

-- Index for series lookup
CREATE INDEX idx_event_series_recurrence_rule ON event_series(recurrence_rule_id);
CREATE INDEX idx_event_series_master_event ON event_series(master_event_id);

-- Index for exceptions by series and date
CREATE INDEX idx_series_exceptions_series_date ON series_exceptions(series_id, exception_date);

-- ==============================================================================
-- PART 8: FUNCTIONS FOR RECURRING EVENTS
-- ==============================================================================

-- Function to calculate the next N occurrences of a recurrence rule
CREATE OR REPLACE FUNCTION calculate_next_occurrences(
  p_rule_id UUID,
  p_start_date DATE,
  p_count INTEGER DEFAULT 10,
  p_max_date DATE DEFAULT NULL
)
RETURNS TABLE (occurrence_date DATE, occurrence_number INTEGER) AS $$
DECLARE
  v_rule recurrence_rules%ROWTYPE;
  v_current_date DATE;
  v_occurrence_count INTEGER := 0;
  v_max_date DATE;
  v_weekday INTEGER;
  v_month_day INTEGER;
  v_target_day INTEGER;
  v_target_week INTEGER;
BEGIN
  -- Get the recurrence rule
  SELECT * INTO v_rule FROM recurrence_rules WHERE id = p_rule_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Set max date (use rule's end_date or 2 years from now as default)
  v_max_date := COALESCE(
    p_max_date,
    v_rule.end_date,
    p_start_date + INTERVAL '2 years'
  );

  -- Start from the given date
  v_current_date := p_start_date;

  -- Generate occurrences based on frequency
  WHILE v_occurrence_count < p_count AND v_current_date <= v_max_date LOOP
    CASE v_rule.frequency
      WHEN 'daily' THEN
        occurrence_date := v_current_date;
        occurrence_number := v_occurrence_count + 1;
        RETURN NEXT;
        v_occurrence_count := v_occurrence_count + 1;
        v_current_date := v_current_date + (v_rule.interval_count || ' days')::INTERVAL;

      WHEN 'weekly' THEN
        -- Check if current day is in the days_of_week array
        v_weekday := EXTRACT(DOW FROM v_current_date)::INTEGER;
        IF v_rule.days_of_week IS NULL OR v_weekday = ANY(v_rule.days_of_week) THEN
          occurrence_date := v_current_date;
          occurrence_number := v_occurrence_count + 1;
          RETURN NEXT;
          v_occurrence_count := v_occurrence_count + 1;
        END IF;
        -- Move to next day, handling week intervals
        v_current_date := v_current_date + INTERVAL '1 day';
        IF v_rule.interval_count > 1 AND EXTRACT(DOW FROM v_current_date) = 0 THEN
          -- If we completed a week and interval > 1, skip weeks
          v_current_date := v_current_date + ((v_rule.interval_count - 1) || ' weeks')::INTERVAL;
        END IF;

      WHEN 'monthly' THEN
        IF v_rule.day_of_month IS NOT NULL THEN
          -- Fixed day of month (e.g., 15th of every month)
          v_month_day := LEAST(v_rule.day_of_month,
            EXTRACT(DAY FROM (date_trunc('month', v_current_date) + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER);
          v_current_date := date_trunc('month', v_current_date)::DATE + (v_month_day - 1);

          IF v_current_date >= p_start_date THEN
            occurrence_date := v_current_date;
            occurrence_number := v_occurrence_count + 1;
            RETURN NEXT;
            v_occurrence_count := v_occurrence_count + 1;
          END IF;
          v_current_date := (date_trunc('month', v_current_date) + (v_rule.interval_count || ' months')::INTERVAL)::DATE;
        ELSIF v_rule.week_of_month IS NOT NULL AND v_rule.day_of_week_monthly IS NOT NULL THEN
          -- Relative day (e.g., "second Tuesday")
          v_current_date := get_nth_weekday_of_month(
            EXTRACT(YEAR FROM v_current_date)::INTEGER,
            EXTRACT(MONTH FROM v_current_date)::INTEGER,
            v_rule.day_of_week_monthly,
            v_rule.week_of_month::TEXT
          );

          IF v_current_date IS NOT NULL AND v_current_date >= p_start_date THEN
            occurrence_date := v_current_date;
            occurrence_number := v_occurrence_count + 1;
            RETURN NEXT;
            v_occurrence_count := v_occurrence_count + 1;
          END IF;
          v_current_date := (date_trunc('month', v_current_date) + (v_rule.interval_count || ' months')::INTERVAL)::DATE;
        ELSE
          -- Fallback: same day each month
          v_current_date := (date_trunc('month', v_current_date) + (v_rule.interval_count || ' months')::INTERVAL)::DATE;
        END IF;

      WHEN 'yearly' THEN
        IF v_rule.month_of_year IS NOT NULL THEN
          v_current_date := make_date(
            EXTRACT(YEAR FROM v_current_date)::INTEGER,
            v_rule.month_of_year,
            COALESCE(v_rule.day_of_month, EXTRACT(DAY FROM p_start_date)::INTEGER)
          );
        END IF;

        IF v_current_date >= p_start_date THEN
          occurrence_date := v_current_date;
          occurrence_number := v_occurrence_count + 1;
          RETURN NEXT;
          v_occurrence_count := v_occurrence_count + 1;
        END IF;
        v_current_date := v_current_date + (v_rule.interval_count || ' years')::INTERVAL;
    END CASE;

    -- Safety check: respect occurrence_count limit if set
    IF v_rule.occurrence_count IS NOT NULL AND v_occurrence_count >= v_rule.occurrence_count THEN
      EXIT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_next_occurrences IS 'Calculates the next N occurrences for a recurrence rule';

-- Helper function to get nth weekday of a month
CREATE OR REPLACE FUNCTION get_nth_weekday_of_month(
  p_year INTEGER,
  p_month INTEGER,
  p_weekday INTEGER, -- 0=Sunday, 6=Saturday
  p_position TEXT    -- 'first', 'second', 'third', 'fourth', 'last'
)
RETURNS DATE AS $$
DECLARE
  v_first_of_month DATE;
  v_last_of_month DATE;
  v_first_weekday INTEGER;
  v_offset INTEGER;
  v_result DATE;
BEGIN
  v_first_of_month := make_date(p_year, p_month, 1);
  v_last_of_month := (v_first_of_month + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  v_first_weekday := EXTRACT(DOW FROM v_first_of_month)::INTEGER;

  IF p_position = 'last' THEN
    -- Start from last day and go back to find the weekday
    v_offset := EXTRACT(DOW FROM v_last_of_month)::INTEGER - p_weekday;
    IF v_offset < 0 THEN v_offset := v_offset + 7; END IF;
    v_result := v_last_of_month - v_offset;
  ELSE
    -- Calculate offset to first occurrence of weekday
    v_offset := p_weekday - v_first_weekday;
    IF v_offset < 0 THEN v_offset := v_offset + 7; END IF;

    v_result := v_first_of_month + v_offset;

    -- Add weeks based on position
    CASE p_position
      WHEN 'first' THEN NULL;
      WHEN 'second' THEN v_result := v_result + INTERVAL '7 days';
      WHEN 'third' THEN v_result := v_result + INTERVAL '14 days';
      WHEN 'fourth' THEN v_result := v_result + INTERVAL '21 days';
    END CASE;

    -- Check if still in month
    IF v_result > v_last_of_month THEN
      v_result := NULL;
    END IF;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_nth_weekday_of_month IS 'Gets the nth weekday of a specific month (e.g., second Tuesday)';

-- Function to create a notification for event changes
CREATE OR REPLACE FUNCTION create_event_notification(
  p_event_id UUID,
  p_series_id UUID,
  p_notification_type event_notification_type,
  p_title_en TEXT,
  p_title_ar TEXT,
  p_message_en TEXT,
  p_message_ar TEXT,
  p_change_summary JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_participant RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Get all participants for the event
  FOR v_participant IN
    SELECT participant_id, participant_type
    FROM event_participants
    WHERE event_id = p_event_id
  LOOP
    INSERT INTO event_notifications (
      event_id,
      series_id,
      participant_id,
      participant_type,
      notification_type,
      title_en,
      title_ar,
      message_en,
      message_ar,
      change_summary
    ) VALUES (
      p_event_id,
      p_series_id,
      v_participant.participant_id,
      v_participant.participant_type,
      p_notification_type,
      p_title_en,
      p_title_ar,
      p_message_en,
      p_message_ar,
      p_change_summary
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_event_notification IS 'Creates notifications for all participants of an event';

-- ==============================================================================
-- PART 9: TRIGGERS
-- ==============================================================================

-- Update updated_at trigger for new tables
CREATE TRIGGER update_recurrence_rules_updated_at
  BEFORE UPDATE ON recurrence_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_series_updated_at
  BEFORE UPDATE ON event_series
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to notify participants when event is updated
CREATE OR REPLACE FUNCTION notify_participants_on_event_change()
RETURNS TRIGGER AS $$
DECLARE
  v_title_en TEXT;
  v_title_ar TEXT;
  v_change_summary JSONB;
BEGIN
  -- Only trigger on significant changes
  IF TG_OP = 'UPDATE' AND (
    OLD.start_datetime != NEW.start_datetime OR
    OLD.end_datetime != NEW.end_datetime OR
    OLD.location_en != NEW.location_en OR
    OLD.status != NEW.status
  ) THEN
    -- Build change summary
    v_change_summary := jsonb_build_object(
      'changes', jsonb_build_array()
    );

    IF OLD.start_datetime != NEW.start_datetime THEN
      v_change_summary := jsonb_set(v_change_summary, '{changes}',
        v_change_summary->'changes' || jsonb_build_object(
          'field', 'start_datetime',
          'old', OLD.start_datetime,
          'new', NEW.start_datetime
        ));
    END IF;

    IF OLD.end_datetime != NEW.end_datetime THEN
      v_change_summary := jsonb_set(v_change_summary, '{changes}',
        v_change_summary->'changes' || jsonb_build_object(
          'field', 'end_datetime',
          'old', OLD.end_datetime,
          'new', NEW.end_datetime
        ));
    END IF;

    IF OLD.status != NEW.status THEN
      v_change_summary := jsonb_set(v_change_summary, '{changes}',
        v_change_summary->'changes' || jsonb_build_object(
          'field', 'status',
          'old', OLD.status,
          'new', NEW.status
        ));
    END IF;

    -- Determine notification type
    IF NEW.status = 'cancelled' THEN
      v_title_en := 'Event Cancelled: ' || COALESCE(NEW.title_en, 'Untitled Event');
      v_title_ar := 'تم إلغاء الفعالية: ' || COALESCE(NEW.title_ar, NEW.title_en, 'فعالية بدون عنوان');

      PERFORM create_event_notification(
        NEW.id,
        NEW.series_id,
        'cancelled',
        v_title_en,
        v_title_ar,
        'The event has been cancelled.',
        'تم إلغاء الفعالية.',
        v_change_summary
      );
    ELSIF OLD.start_datetime != NEW.start_datetime THEN
      v_title_en := 'Event Rescheduled: ' || COALESCE(NEW.title_en, 'Untitled Event');
      v_title_ar := 'تم إعادة جدولة الفعالية: ' || COALESCE(NEW.title_ar, NEW.title_en, 'فعالية بدون عنوان');

      PERFORM create_event_notification(
        NEW.id,
        NEW.series_id,
        'rescheduled',
        v_title_en,
        v_title_ar,
        'The event has been rescheduled to a new time.',
        'تم إعادة جدولة الفعالية إلى وقت جديد.',
        v_change_summary
      );
    ELSE
      v_title_en := 'Event Updated: ' || COALESCE(NEW.title_en, 'Untitled Event');
      v_title_ar := 'تم تحديث الفعالية: ' || COALESCE(NEW.title_ar, NEW.title_en, 'فعالية بدون عنوان');

      PERFORM create_event_notification(
        NEW.id,
        NEW.series_id,
        'updated',
        v_title_en,
        v_title_ar,
        'The event details have been updated.',
        'تم تحديث تفاصيل الفعالية.',
        v_change_summary
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_participants_on_event_change
  AFTER UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_participants_on_event_change();

-- ==============================================================================
-- PART 10: ROW LEVEL SECURITY
-- ==============================================================================

-- Enable RLS on new tables
ALTER TABLE recurrence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;

-- Recurrence rules: accessible to authenticated users
CREATE POLICY "recurrence_rules_select_authenticated" ON recurrence_rules
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "recurrence_rules_insert_authenticated" ON recurrence_rules
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "recurrence_rules_update_authenticated" ON recurrence_rules
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "recurrence_rules_delete_authenticated" ON recurrence_rules
  FOR DELETE TO authenticated
  USING (true);

-- Event series: accessible to authenticated users
CREATE POLICY "event_series_select_authenticated" ON event_series
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "event_series_insert_authenticated" ON event_series
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "event_series_update_authenticated" ON event_series
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "event_series_delete_authenticated" ON event_series
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- Series exceptions: accessible to authenticated users
CREATE POLICY "series_exceptions_select_authenticated" ON series_exceptions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "series_exceptions_insert_authenticated" ON series_exceptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "series_exceptions_update_authenticated" ON series_exceptions
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "series_exceptions_delete_authenticated" ON series_exceptions
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- Event notifications: users can only see their own notifications
CREATE POLICY "event_notifications_select_own" ON event_notifications
  FOR SELECT TO authenticated
  USING (
    participant_type = 'user' AND participant_id = auth.uid()
  );

CREATE POLICY "event_notifications_update_own" ON event_notifications
  FOR UPDATE TO authenticated
  USING (
    participant_type = 'user' AND participant_id = auth.uid()
  );

-- Allow system to insert notifications (via functions)
CREATE POLICY "event_notifications_insert_system" ON event_notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ==============================================================================
-- PART 11: COMMENTS
-- ==============================================================================

COMMENT ON TYPE recurrence_frequency IS 'Frequency options for recurring events';
COMMENT ON TYPE month_week_position IS 'Position within month for monthly recurrence (first, second, third, fourth, last)';
COMMENT ON TYPE series_edit_scope IS 'Scope of changes when editing a recurring event series';
COMMENT ON TYPE event_notification_type IS 'Types of notifications sent for event changes';
