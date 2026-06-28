-- D-1 (CRITICAL) — block self-elevation of public.users.role.
--
-- Before this guard, RLS `users_update_self` (auth.uid()=id, no column condition) + a table-level
-- UPDATE grant to `authenticated` let any logged-in user run
--   supabase.from('users').update({ role: 'admin' }).eq('id', auth.uid())
-- and become admin, defeating every requireAdmin / edge-fn guard (authz reads public.users.role).
--
-- Already applied to staging (zkrcjzdemdmwhearhfgg) via Supabase MCP on 2026-06-27; this file
-- version-controls it for other environments. Idempotent (create or replace / drop if exists),
-- so re-application is a safe no-op. Legit admin writes go through the service-role client
-- (assign-role / create-user edge fns), which is exempt via auth.role() = 'service_role'.

create or replace function public.guard_users_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'role can only be changed by an administrator'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_users_role_change on public.users;
create trigger trg_guard_users_role_change
  before update on public.users
  for each row
  when (old.role is distinct from new.role)
  execute function public.guard_users_role_change();
