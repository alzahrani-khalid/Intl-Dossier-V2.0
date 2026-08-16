-- Phase 95 / DEAD-09: the `private` Storage bucket every artifact writer already targets.
--
-- DRIFT CORRECTED HERE. Three deployed edge functions upload to `storage.from('private')` —
-- `pdf-generate/index.ts:383`, `ai-extract/index.ts:201`, and (this phase) `reports/index.ts` —
-- but the bucket has never existed on staging: `storage.buckets` holds only annotations,
-- avatars, briefing-books, commitment-evidence, contact-documents, voice-memos, and
-- `storage.objects` is EMPTY (0 rows, derived 2026-08-16). Every upload through those paths has
-- been failing with "Bucket not found"; the phase research recorded "bucket `private` exists on
-- staging" as VERIFIED from a source read plus a 400 probe, which cannot see a bucket. Creating
-- it repairs the two pre-existing writers as well as the new one.
--
-- PRIVATE bucket: reads are never public. Access is granted per request by a signed URL
-- (`createSignedUrl`, 24h), which the storage API will only mint for a caller who can SELECT
-- the object — hence the owner-scoped SELECT policy below.
--
-- Follows the owner-scoped Storage RLS pattern of `20260628000003_avatars_storage_bucket.sql`,
-- scoped by object OWNER rather than by a `<user_id>/` path convention: the three writers use
-- three different path shapes (`reports/…`, `pdfs/…`, `ai-extraction/…`) and none of them
-- carries the uid in the path.

INSERT INTO storage.buckets (id, name, public)
VALUES ('private', 'private', false)
ON CONFLICT (id) DO NOTHING;

-- Any authenticated caller may write an artifact (the edge functions gate WHAT gets written).
DROP POLICY IF EXISTS private_storage_insert ON storage.objects;
CREATE POLICY private_storage_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'private'
  );

-- Only the creator can read the object back — or have a signed URL minted for it.
-- Both owner columns are checked: `owner` (legacy uuid) and `owner_id` (text) are written by
-- different Storage versions, and a policy that reads only one silently denies on the other.
DROP POLICY IF EXISTS private_storage_select ON storage.objects;
CREATE POLICY private_storage_select ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'private' AND (owner = auth.uid() OR owner_id = auth.uid()::text)
  );

-- Only the creator can remove their own artifact.
DROP POLICY IF EXISTS private_storage_delete ON storage.objects;
CREATE POLICY private_storage_delete ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'private' AND (owner = auth.uid() OR owner_id = auth.uid()::text)
  );
