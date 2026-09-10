-- Record the distinct service-role-only intents for the two RLS-enabled tables
-- that previously had no policies.

begin;

-- The SMTP adapter is the sole application writer and uses supabaseAdmin.
-- Remove client grants so an authenticated request is denied at the table
-- boundary instead of receiving an empty result through RLS.
revoke all on table public.intelligence_email_queue from anon, authenticated;

do $migration$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.intelligence_email_queue'::regclass
      and polname = 'p100_service_role_only'
  ) then
    create policy p100_service_role_only
      on public.intelligence_email_queue
      as permissive
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$migration$;

comment on table public.intelligence_email_queue is
  'Service-role-only queue. Its sole application writer is backend/src/adapters/intelligence/smtp-adapter.ts via supabaseAdmin.';

-- This table already excludes anon and authenticated through its grant set.
-- The policy records that existing intent without implying a client grant
-- needed to be revoked.
do $migration$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'events.idempotency_keys'::regclass
      and polname = 'p100_service_role_only'
  ) then
    create policy p100_service_role_only
      on events.idempotency_keys
      as permissive
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$migration$;

comment on table events.idempotency_keys is
  'Service-role-only event idempotency state. Client roles already have no table grants; this policy records that intent.';

commit;
