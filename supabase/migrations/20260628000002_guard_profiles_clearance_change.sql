-- D-2 (CRITICAL) — block self-elevation of profiles.clearance_level.
--
-- Before this guard, the `profiles` UPDATE policy (auth.uid()=user_id) + a table-level UPDATE grant
-- to `authenticated` let any user run
--   supabase.from('profiles').update({ clearance_level: 4 }).eq('user_id', auth.uid())
-- and self-elevate to max clearance, which gates sensitive intelligence reads.
-- NB: `profiles` has no `id` column — the policy/guard key on `user_id`.
--
-- Already applied to staging (zkrcjzdemdmwhearhfgg) via Supabase MCP on 2026-06-27; this file
-- version-controls it. Idempotent. Clearance may only be set by an admin path using the
-- service-role client (exempt via auth.role() = 'service_role').

create or replace function public.guard_profiles_clearance_change()
returns trigger
language plpgsql
as $$
begin
  if new.clearance_level is distinct from old.clearance_level
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'clearance_level can only be changed by an administrator'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profiles_clearance_change on public.profiles;
create trigger trg_guard_profiles_clearance_change
  before update on public.profiles
  for each row
  when (old.clearance_level is distinct from new.clearance_level)
  execute function public.guard_profiles_clearance_change();
