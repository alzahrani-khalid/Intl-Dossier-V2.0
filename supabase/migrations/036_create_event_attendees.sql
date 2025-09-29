-- 036_create_event_attendees.sql
-- Lightweight attendees table for events with RLS

BEGIN;

CREATE TABLE IF NOT EXISTS public.event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('country', 'organization', 'contact')),
  entity_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'participant' CHECK (role IN ('host','participant','observer','speaker')),
  confirmed boolean NOT NULL DEFAULT false,
  added_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON public.event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_entity ON public.event_attendees(entity_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_type_role ON public.event_attendees(type, role);

CREATE TRIGGER update_event_attendees_updated_at
  BEFORE UPDATE ON public.event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_attendees TO authenticated;

ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY event_attendees_select ON public.event_attendees
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY event_attendees_insert_self ON public.event_attendees
  FOR INSERT TO authenticated
  WITH CHECK (added_by = auth.uid());

CREATE POLICY event_attendees_update_self ON public.event_attendees
  FOR UPDATE TO authenticated
  USING (added_by = auth.uid())
  WITH CHECK (added_by = auth.uid());

CREATE POLICY event_attendees_delete_self ON public.event_attendees
  FOR DELETE TO authenticated
  USING (added_by = auth.uid());

COMMIT;

