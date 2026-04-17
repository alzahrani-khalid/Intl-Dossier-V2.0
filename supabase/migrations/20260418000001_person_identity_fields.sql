-- Phase 32: Person-Native Basic Info
-- Adds 10 typed identity columns to persons (all nullable per D-10).
-- Backfills first_name_en/ar + last_name_en/ar from dossiers.name_en/ar
-- using the LAST-space split rule (D-06); single-word names → last_name only (D-07).
-- Idempotent: ADD COLUMN IF NOT EXISTS + UPDATE guarded by NULL targets (D-29).

BEGIN;

-- DDL: 10 nullable identity columns (nationality_country_id already exists from a prior phase).
ALTER TABLE public.persons
  ADD COLUMN IF NOT EXISTS honorific_en   text,
  ADD COLUMN IF NOT EXISTS honorific_ar   text,
  ADD COLUMN IF NOT EXISTS first_name_en  text,
  ADD COLUMN IF NOT EXISTS last_name_en   text,
  ADD COLUMN IF NOT EXISTS first_name_ar  text,
  ADD COLUMN IF NOT EXISTS last_name_ar   text,
  ADD COLUMN IF NOT EXISTS known_as_en    text,
  ADD COLUMN IF NOT EXISTS known_as_ar    text,
  ADD COLUMN IF NOT EXISTS date_of_birth  date,
  ADD COLUMN IF NOT EXISTS gender         text;

-- Gender CHECK constraint added separately so re-runs don't fail with "constraint exists".
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'persons_gender_check'
       AND conrelid = 'public.persons'::regclass
  ) THEN
    ALTER TABLE public.persons
      ADD CONSTRAINT persons_gender_check
      CHECK (gender IS NULL OR gender IN ('female', 'male'));
  END IF;
END $$;

COMMENT ON COLUMN public.persons.honorific_en   IS 'Phase 32: curated honorific (English), e.g. ''H.E.'', ''Dr.''';
COMMENT ON COLUMN public.persons.honorific_ar   IS 'Phase 32: curated honorific (Arabic), e.g. ''سعادة''';
COMMENT ON COLUMN public.persons.first_name_en  IS 'Phase 32: given name English (NULL for single-word names per D-07)';
COMMENT ON COLUMN public.persons.last_name_en   IS 'Phase 32: family/surname English';
COMMENT ON COLUMN public.persons.first_name_ar  IS 'Phase 32: given name Arabic';
COMMENT ON COLUMN public.persons.last_name_ar   IS 'Phase 32: family/surname Arabic';
COMMENT ON COLUMN public.persons.known_as_en    IS 'Phase 32: optional nickname English';
COMMENT ON COLUMN public.persons.known_as_ar    IS 'Phase 32: optional nickname Arabic';
COMMENT ON COLUMN public.persons.date_of_birth  IS 'Phase 32: optional DOB';
COMMENT ON COLUMN public.persons.gender         IS 'Phase 32: two-value enum {female, male}, nullable';

-- Backfill EN: split on LAST space. Idempotent guard on NULL targets.
-- D-06: first = everything before last space; last = everything after last space.
-- D-07: single-word name → first=NULL, last=full_string.
UPDATE public.persons p
   SET first_name_en = CASE
         WHEN position(' ' IN d.name_en) = 0 THEN NULL
         ELSE regexp_replace(d.name_en, '\s+\S+$', '')
       END,
       last_name_en = CASE
         WHEN position(' ' IN d.name_en) = 0 THEN d.name_en
         ELSE regexp_replace(d.name_en, '^.*\s+', '')
       END
  FROM public.dossiers d
 WHERE d.id = p.id
   AND d.name_en IS NOT NULL
   AND btrim(d.name_en) <> ''
   AND p.first_name_en IS NULL
   AND p.last_name_en  IS NULL;

-- Backfill AR: same rule, Arabic source column.
UPDATE public.persons p
   SET first_name_ar = CASE
         WHEN position(' ' IN d.name_ar) = 0 THEN NULL
         ELSE regexp_replace(d.name_ar, '\s+\S+$', '')
       END,
       last_name_ar = CASE
         WHEN position(' ' IN d.name_ar) = 0 THEN d.name_ar
         ELSE regexp_replace(d.name_ar, '^.*\s+', '')
       END
  FROM public.dossiers d
 WHERE d.id = p.id
   AND d.name_ar IS NOT NULL
   AND btrim(d.name_ar) <> ''
   AND p.first_name_ar IS NULL
   AND p.last_name_ar  IS NULL;

COMMIT;
