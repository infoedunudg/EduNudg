-- Private bucket for competition papers and student photos (not CDN-public).
-- Marketing logos/legal stay on public brand-assets.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-private',
  'brand-private',
  false,
  10485760,
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Platform admins: full access
DROP POLICY IF EXISTS brand_private_platform_all ON storage.objects;
CREATE POLICY brand_private_platform_all ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'brand-private' AND public.is_platform_admin())
  WITH CHECK (bucket_id = 'brand-private' AND public.is_platform_admin());

-- Brand staff: manage under their brand UUID folder
DROP POLICY IF EXISTS brand_private_brand_manage ON storage.objects;
CREATE POLICY brand_private_brand_manage ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'brand-private'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.has_brand_access((storage.foldername(name))[1]::uuid)
  )
  WITH CHECK (
    bucket_id = 'brand-private'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.has_brand_access((storage.foldername(name))[1]::uuid)
  );

-- Students: own photo folder
DROP POLICY IF EXISTS brand_private_student_self ON storage.objects;
CREATE POLICY brand_private_student_self ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'brand-private'
    AND coalesce(array_length(storage.foldername(name), 1), 0) >= 3
    AND (storage.foldername(name))[2] = 'students'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND (storage.foldername(name))[3] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.is_student_self((storage.foldername(name))[3]::uuid, (storage.foldername(name))[1]::uuid)
  )
  WITH CHECK (
    bucket_id = 'brand-private'
    AND coalesce(array_length(storage.foldername(name), 1), 0) >= 3
    AND (storage.foldername(name))[2] = 'students'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND (storage.foldername(name))[3] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.is_student_self((storage.foldername(name))[3]::uuid, (storage.foldername(name))[1]::uuid)
  );

-- Enrolled students: SELECT competition papers attached to a registration
-- Path: {brandId}/competitions/papers/{paperId}/…
DROP POLICY IF EXISTS brand_private_student_competition_papers ON storage.objects;
CREATE POLICY brand_private_student_competition_papers ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'brand-private'
    AND coalesce(array_length(storage.foldername(name), 1), 0) >= 4
    AND (storage.foldername(name))[2] = 'competitions'
    AND (storage.foldername(name))[3] = 'papers'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND (storage.foldername(name))[4] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.student_competition_registrations r ON r.student_id = s.id
      JOIN public.brand_competition_papers bcp ON bcp.competition_id = r.competition_id
      WHERE s.user_id = auth.uid()
        AND s.brand_id = (storage.foldername(name))[1]::uuid
        AND s.deleted_at IS NULL
        AND bcp.paper_id = (storage.foldername(name))[4]::uuid
        AND r.status IN ('registered', 'confirmed', 'waitlisted')
    )
  );

-- Exclude competitions paths from public brand-assets API listing (CDN still serves
-- legacy public objects until re-uploaded to brand-private).
DROP POLICY IF EXISTS "brand_assets_public_read" ON storage.objects;
CREATE POLICY "brand_assets_public_read" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (
      COALESCE(array_length(storage.foldername(name), 1), 0) < 2
      OR (
        (storage.foldername(name))[2] IS DISTINCT FROM 'students'
        AND (storage.foldername(name))[2] IS DISTINCT FROM 'competitions'
      )
    )
  );

COMMENT ON COLUMN public.student_profiles.photo_url IS
  'Storage ref for student photo. Prefer brand-private:{brand_id}/students/{student_id}/photo.{ext}; legacy public brand-assets URLs may remain until re-upload.';
