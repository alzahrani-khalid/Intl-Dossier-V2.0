# Impl brief — L0-db (DB migrations only) · priority 1 (security)

**Worker order. Self-contained. Make atomic commits where code is involved (none here) — this lane
applies migrations via the Supabase MCP, not files. Do NOT push, do NOT open PRs.**

**Target DB:** staging `zkrcjzdemdmwhearhfgg` (the project's deployment config). Apply via
`mcp__supabase__apply_migration` (NOT raw `execute_sql` for DDL). Verify via read-only
`mcp__supabase__execute_sql`.

**⚠ Ordering dependency:** these triggers reject any non-`service_role` change to `users.role` /
`profiles.clearance_level`. **Confirm L1 has shipped first** (the admin edge fns `assign-role`,
`create-user`, `deactivate-user`, `reactivate-user` must do their privileged role/clearance writes
with the service-role client). If L1 is not yet merged, apply L0 in the same integration step as L1
so admin role/clearance assignment never breaks.

---

## D-1 (CRITICAL) — block self-elevation of `public.users.role`

**Problem (live-verified by slice D):** RLS `users_update_self` = `auth.uid()=id` with no column
condition, `authenticated` holds table-level UPDATE on `public.users`, and the only trigger is
`updated_at`. Any logged-in user can run
`supabase.from('users').update({role:'admin'}).eq('id', auth.uid())` and become admin — defeating
every `requireAdmin`/edge-fn guard (authz now reads `public.users.role`).

**Migration (name `20260627120000_guard_users_role_change`):**

```sql
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
```

(`auth.role()` returns the JWT role claim — `'service_role'` for the service client, `'authenticated'`
for normal users. Alternative if preferred: `revoke update on public.users from authenticated;` then
`grant update (full_name, job_title_en, job_title_ar, department, phone, avatar_url,
language_preference, timezone, mfa_enabled) on public.users to authenticated;` — but the trigger is
the lower-risk, self-contained choice. Do **one**, not both.)

## D-2 (CRITICAL) — block self-elevation of `profiles.clearance_level`

**Problem:** `profiles` UPDATE policy = `auth.uid()=user_id`, `authenticated` holds table UPDATE, no
guard. Any user runs `supabase.from('profiles').update({clearance_level:4}).eq('user_id',auth.uid())`
→ max clearance (gates sensitive intelligence reads). NB: `profiles` has **no `id`** column — key on
`user_id` (per source-of-truth facts).

**Migration (name `20260627120001_guard_profiles_clearance_change`):**

```sql
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
```

---

## Verify (read-only, after apply)

```sql
-- triggers exist
select tgname, tgrelid::regclass from pg_trigger
where tgname in ('trg_guard_users_role_change','trg_guard_profiles_clearance_change');
-- function bodies present
select proname from pg_proc
where proname in ('guard_users_role_change','guard_profiles_clearance_change');
```

Functional proof needs an **authenticated impersonation** (service-role MCP bypasses RLS/triggers,
so a direct MCP update will NOT be blocked — that is expected and is not a failure). If you have an
impersonation harness: as a normal user, `update users set role='admin' where id=auth.uid()` must
raise `42501`; `update profiles set clearance_level=4 where user_id=auth.uid()` must raise `42501`;
and a `service_role` update of the same columns must still succeed.

## Done-when

Both triggers applied to staging; read-only checks above return both rows; L1's admin fns confirmed
to use the service-role client for role/clearance writes (coordinate with the L1 worker). Record the
two migration names in the orchestration log. No git push, no PR.
