-- RLS smoke test: brand-assets + brand-private storage policies
-- Run via: pnpm test:rls

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'brand-assets') THEN
    RAISE EXCEPTION 'Missing brand-assets storage bucket';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'brand-private' AND public = false) THEN
    RAISE EXCEPTION 'Missing private brand-private storage bucket — apply migration 106';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'brand_assets_public_read'
  ) THEN
    RAISE EXCEPTION 'Missing brand_assets_public_read policy';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'brand_assets_platform_all'
  ) THEN
    RAISE EXCEPTION 'Missing brand_assets_platform_all policy';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'brand_assets_brand_manage'
  ) THEN
    RAISE EXCEPTION 'Missing brand_assets_brand_manage policy';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'brand_assets_student_self'
  ) THEN
    RAISE EXCEPTION 'Missing brand_assets_student_self policy';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'brand_private_student_competition_papers'
  ) THEN
    RAISE EXCEPTION 'Missing brand_private_student_competition_papers policy — apply migration 106';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets b
    WHERE b.id = 'brand-assets'
      AND 'application/pdf' = ANY (b.allowed_mime_types)
      AND 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' = ANY (b.allowed_mime_types)
      AND 'text/html' = ANY (b.allowed_mime_types)
  ) THEN
    RAISE EXCEPTION 'brand-assets bucket missing legal document MIME types — apply migration 063';
  END IF;
  RAISE NOTICE 'RLS brand-assets storage smoke test passed';
END $$;
