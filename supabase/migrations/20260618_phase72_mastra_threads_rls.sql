-- =============================================================================
-- Phase 72 — Memory: owner-only RLS on the @mastra/pg thread/message tables (D-08)
-- =============================================================================
-- D-08: conversations are saved + resumable via @mastra/pg PostgresStore on the same
-- Supabase Postgres, with RLS = a user owns ONLY their own threads. This closes the
-- cross-tenant thread-read threat (T-72-03-05): without RLS, any authenticated caller
-- could read every user's conversation history.
--
-- @mastra/pg PostgresStore AUTO-CREATES mastra_threads + mastra_messages at runtime on
-- first connect — there is NO hand-written CREATE TABLE here. This migration is
-- therefore GUARDED on table existence (DO block) so it is safe to apply BEFORE the
-- runtime has provisioned them (no-ops cleanly) and is RE-APPLIED in 72-04 / after the
-- agent-runtime first boots, when the tables exist.
--
-- AUTHORED-ONLY (this plan, 72-03). APPLIED via Supabase MCP in 72-04 (Wave 3), and
-- re-run after the runtime provisions the tables. The executor lacks the Supabase MCP
-- (P69/P71 precedent) — do NOT apply here.
--
-- Ownership key: the Mastra "resource" is the authenticated user — the agent sets
-- thread.resourceId = the caller's user id (today the spike hardcodes 'copilot';
-- 72-05 wires it to the JWT user). So owner-only = the thread's resource column equals
-- auth.uid()::text. Messages inherit ownership via their parent thread.
--
-- LANDMINE (carried-forward lock): never the broken `profiles.id = auth.uid()` form.
-- Here ownership keys off the Mastra resource column directly = auth.uid(), NOT a
-- profiles lookup at all.
--
-- COLUMN-NAME ROBUSTNESS: @mastra/pg uses camelCase quoted identifiers ("resourceId",
-- "thread_id") whose exact casing is version-dependent (pinned 1.13.2). The DO block
-- below resolves the actual owner column ("resourceId" | resource_id | resourceid) and
-- the message->thread FK ("thread_id" | threadId | thread_id) from the live catalog at
-- apply time, so the policies bind to whatever the library actually created. 72-04
-- MUST confirm the resolved names in the apply log (the tables do not exist on staging
-- today — RESEARCH probe 2026-06-18).
-- =============================================================================

DO $$
DECLARE
  v_thread_owner_col   TEXT;   -- resource column on mastra_threads (= user id)
  v_msg_thread_col     TEXT;   -- thread FK column on mastra_messages
  v_msg_owner_col      TEXT;   -- (optional) resource column on mastra_messages
BEGIN
  -- ---------------------------------------------------------------------------
  -- mastra_threads — owner-only RLS
  -- ---------------------------------------------------------------------------
  IF to_regclass('public.mastra_threads') IS NOT NULL THEN
    -- Resolve the owner/resource column name as the library created it.
    SELECT column_name INTO v_thread_owner_col
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mastra_threads'
      AND lower(column_name) IN ('resourceid', 'resource_id')
    ORDER BY column_name
    LIMIT 1;

    EXECUTE 'ALTER TABLE public.mastra_threads ENABLE ROW LEVEL SECURITY';

    IF v_thread_owner_col IS NOT NULL THEN
      -- Drop-and-recreate so the migration is idempotent / re-appliable.
      EXECUTE 'DROP POLICY IF EXISTS mastra_threads_owner_select ON public.mastra_threads';
      EXECUTE 'DROP POLICY IF EXISTS mastra_threads_owner_insert ON public.mastra_threads';
      EXECUTE 'DROP POLICY IF EXISTS mastra_threads_owner_update ON public.mastra_threads';
      EXECUTE 'DROP POLICY IF EXISTS mastra_threads_owner_delete ON public.mastra_threads';

      -- Owner-only across all verbs. resource column = auth.uid() (cast to text since
      -- the Mastra resource id is stored as text).
      EXECUTE format(
        'CREATE POLICY mastra_threads_owner_select ON public.mastra_threads
           FOR SELECT TO authenticated USING (%I = auth.uid()::text)', v_thread_owner_col);
      EXECUTE format(
        'CREATE POLICY mastra_threads_owner_insert ON public.mastra_threads
           FOR INSERT TO authenticated WITH CHECK (%I = auth.uid()::text)', v_thread_owner_col);
      EXECUTE format(
        'CREATE POLICY mastra_threads_owner_update ON public.mastra_threads
           FOR UPDATE TO authenticated
           USING (%I = auth.uid()::text) WITH CHECK (%I = auth.uid()::text)',
        v_thread_owner_col, v_thread_owner_col);
      EXECUTE format(
        'CREATE POLICY mastra_threads_owner_delete ON public.mastra_threads
           FOR DELETE TO authenticated USING (%I = auth.uid()::text)', v_thread_owner_col);

      RAISE NOTICE 'rag/mastra: mastra_threads RLS enabled, owner column = %', v_thread_owner_col;
    ELSE
      RAISE NOTICE 'rag/mastra: mastra_threads exists but no resourceId/resource_id column found — RLS enabled with NO policy (deny-all). 72-04 must re-resolve.';
    END IF;
  ELSE
    RAISE NOTICE 'rag/mastra: mastra_threads does not exist yet (runtime not booted) — skipping; re-apply after first connect.';
  END IF;

  -- ---------------------------------------------------------------------------
  -- mastra_messages — owner-only via parent thread
  -- ---------------------------------------------------------------------------
  IF to_regclass('public.mastra_messages') IS NOT NULL THEN
    -- Resolve the thread FK column.
    SELECT column_name INTO v_msg_thread_col
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mastra_messages'
      AND lower(column_name) IN ('thread_id', 'threadid')
    ORDER BY column_name
    LIMIT 1;

    -- Resolve an optional own resource column (some versions denormalize it).
    SELECT column_name INTO v_msg_owner_col
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mastra_messages'
      AND lower(column_name) IN ('resourceid', 'resource_id')
    ORDER BY column_name
    LIMIT 1;

    EXECUTE 'ALTER TABLE public.mastra_messages ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS mastra_messages_owner_select ON public.mastra_messages';
    EXECUTE 'DROP POLICY IF EXISTS mastra_messages_owner_insert ON public.mastra_messages';
    EXECUTE 'DROP POLICY IF EXISTS mastra_messages_owner_update ON public.mastra_messages';
    EXECUTE 'DROP POLICY IF EXISTS mastra_messages_owner_delete ON public.mastra_messages';

    IF v_msg_thread_col IS NOT NULL AND v_thread_owner_col IS NOT NULL THEN
      -- A message is owned iff its parent thread is owned by the caller (EXISTS-on-parent,
      -- the P69 intelligence_event_dossiers pattern). This holds even if messages carry
      -- no own resource column.
      EXECUTE format(
        'CREATE POLICY mastra_messages_owner_select ON public.mastra_messages
           FOR SELECT TO authenticated USING (EXISTS (
             SELECT 1 FROM public.mastra_threads t
             WHERE t.id = public.mastra_messages.%I AND t.%I = auth.uid()::text))',
        v_msg_thread_col, v_thread_owner_col);
      EXECUTE format(
        'CREATE POLICY mastra_messages_owner_insert ON public.mastra_messages
           FOR INSERT TO authenticated WITH CHECK (EXISTS (
             SELECT 1 FROM public.mastra_threads t
             WHERE t.id = public.mastra_messages.%I AND t.%I = auth.uid()::text))',
        v_msg_thread_col, v_thread_owner_col);
      EXECUTE format(
        'CREATE POLICY mastra_messages_owner_update ON public.mastra_messages
           FOR UPDATE TO authenticated
           USING (EXISTS (SELECT 1 FROM public.mastra_threads t
                          WHERE t.id = public.mastra_messages.%I AND t.%I = auth.uid()::text))
           WITH CHECK (EXISTS (SELECT 1 FROM public.mastra_threads t
                          WHERE t.id = public.mastra_messages.%I AND t.%I = auth.uid()::text))',
        v_msg_thread_col, v_thread_owner_col, v_msg_thread_col, v_thread_owner_col);
      EXECUTE format(
        'CREATE POLICY mastra_messages_owner_delete ON public.mastra_messages
           FOR DELETE TO authenticated USING (EXISTS (
             SELECT 1 FROM public.mastra_threads t
             WHERE t.id = public.mastra_messages.%I AND t.%I = auth.uid()::text))',
        v_msg_thread_col, v_thread_owner_col);

      RAISE NOTICE 'rag/mastra: mastra_messages RLS enabled via parent thread (msg.% -> thread.%)', v_msg_thread_col, v_thread_owner_col;
    ELSIF v_msg_owner_col IS NOT NULL THEN
      -- Fallback: gate directly on the message's own resource column.
      EXECUTE format(
        'CREATE POLICY mastra_messages_owner_select ON public.mastra_messages
           FOR SELECT TO authenticated USING (%I = auth.uid()::text)', v_msg_owner_col);
      EXECUTE format(
        'CREATE POLICY mastra_messages_owner_insert ON public.mastra_messages
           FOR INSERT TO authenticated WITH CHECK (%I = auth.uid()::text)', v_msg_owner_col);
      EXECUTE format(
        'CREATE POLICY mastra_messages_owner_update ON public.mastra_messages
           FOR UPDATE TO authenticated USING (%I = auth.uid()::text) WITH CHECK (%I = auth.uid()::text)',
        v_msg_owner_col, v_msg_owner_col);
      EXECUTE format(
        'CREATE POLICY mastra_messages_owner_delete ON public.mastra_messages
           FOR DELETE TO authenticated USING (%I = auth.uid()::text)', v_msg_owner_col);

      RAISE NOTICE 'rag/mastra: mastra_messages RLS enabled via own resource column = %', v_msg_owner_col;
    ELSE
      -- RLS is enabled with no policy → deny-all (fail closed, never leak). 72-04 re-resolves.
      RAISE NOTICE 'rag/mastra: mastra_messages exists but neither a resolvable thread FK + thread owner nor an own resource column found — RLS enabled with NO policy (deny-all). 72-04 must re-resolve.';
    END IF;
  ELSE
    RAISE NOTICE 'rag/mastra: mastra_messages does not exist yet (runtime not booted) — skipping; re-apply after first connect.';
  END IF;
END;
$$;
