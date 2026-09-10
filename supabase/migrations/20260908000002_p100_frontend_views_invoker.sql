-- P100-02: frontend-direct views must enforce the querying caller's privileges
-- and row-level security policies. ALTER VIEW ... SET is idempotent, and the
-- deliberately unguarded names make a missing view fail the apply.

ALTER VIEW public.mous_frontend
  SET (security_invoker = true);

ALTER VIEW public.event_details
  SET (security_invoker = true);

ALTER VIEW public.working_group_stats
  SET (security_invoker = true);
