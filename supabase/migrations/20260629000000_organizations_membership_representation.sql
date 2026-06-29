-- Organization membership & representation profile
--
-- Additive, nullable columns on the `organizations` dossier-extension table so the
-- legacy GASTAT organizations directory imports with full fidelity and the org
-- overview cards (membership structure + GASTAT focal points) render real data.
-- Idempotent: ADD COLUMN IF NOT EXISTS + name-guarded CHECK constraints.

alter table public.organizations
  add column if not exists membership_type text,
  add column if not exists importance text,
  add column if not exists representation_level text,
  add column if not exists gastat_focal_points jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organizations'::regclass
      and conname = 'organizations_membership_type_check'
  ) then
    alter table public.organizations
      add constraint organizations_membership_type_check
      check (
        membership_type is null
        or membership_type in ('board_of_directors', 'member', 'participant', 'counterpart_agency')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organizations'::regclass
      and conname = 'organizations_importance_check'
  ) then
    alter table public.organizations
      add constraint organizations_importance_check
      check (importance is null or importance in ('high', 'medium', 'low'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organizations'::regclass
      and conname = 'organizations_representation_level_check'
  ) then
    alter table public.organizations
      add constraint organizations_representation_level_check
      check (representation_level is null or representation_level in ('president', 'specialist'));
  end if;
end $$;

comment on column public.organizations.membership_type is
  'GASTAT membership type in this organization: board_of_directors | member | participant | counterpart_agency';
comment on column public.organizations.importance is
  'Relationship importance rating: high | medium | low';
comment on column public.organizations.representation_level is
  'Level at which GASTAT is represented: president | specialist';
comment on column public.organizations.gastat_focal_points is
  'GASTAT internal officers for this organization. Shape: {responsible?, alternate?, support?} where each = {name_en?, name_ar?, user_id?}';
