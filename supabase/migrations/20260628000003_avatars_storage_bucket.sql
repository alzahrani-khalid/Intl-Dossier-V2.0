-- D-9: avatars Storage bucket + owner-scoped RLS.
--
-- The profile avatar-upload control was hidden because this bucket did not
-- exist. Create a PUBLIC bucket (avatars are rendered across the app, so reads
-- are unauthenticated) and restrict writes to the owner whose id is the first
-- path segment of the object name: `<user_id>/<file>`. Follows the Supabase
-- Storage owner-scoped-folder RLS pattern already used by `briefing-books`.

-- Bucket (public read).
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read avatar objects (the bucket is public).
DROP POLICY IF EXISTS avatars_storage_select ON storage.objects;
CREATE POLICY avatars_storage_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars'
  );

-- Authenticated users can upload only into their own `<user_id>/` folder.
DROP POLICY IF EXISTS avatars_storage_insert ON storage.objects;
CREATE POLICY avatars_storage_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update only their own avatar objects.
DROP POLICY IF EXISTS avatars_storage_update ON storage.objects;
CREATE POLICY avatars_storage_update ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  ) WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete only their own avatar objects.
DROP POLICY IF EXISTS avatars_storage_delete ON storage.objects;
CREATE POLICY avatars_storage_delete ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
