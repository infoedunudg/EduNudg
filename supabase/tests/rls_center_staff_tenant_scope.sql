-- regression_center_staff_membership_does_not_grant_brand_access
-- Ensures user_brand_ids excludes center scope and companion helpers exist.

DO $$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'user_brand_ids'
    AND pg_get_function_identity_arguments(p.oid) = '';

  IF v_def IS NULL THEN
    RAISE EXCEPTION 'Missing user_brand_ids()';
  END IF;

  IF v_def !~* 'scope_type[[:space:]]+IN[[:space:]]*\([[:space:]]*''brand''' THEN
    RAISE EXCEPTION 'regression_center_staff_membership_does_not_grant_brand_access: user_brand_ids must filter scope_type IN (brand, platform)';
  END IF;

  IF v_def ~* 'scope_type[[:space:]]*=[[:space:]]*''center''' THEN
    RAISE EXCEPTION 'regression_center_staff_membership_does_not_grant_brand_access: user_brand_ids must not include center scope';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_center_staff_for_brand'
  ) THEN
    RAISE EXCEPTION 'Missing has_center_staff_for_brand';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'student_enrolled_at_accessible_center'
  ) THEN
    RAISE EXCEPTION 'Missing student_enrolled_at_accessible_center';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'programs'
      AND policyname = 'programs_center_read'
  ) THEN
    RAISE EXCEPTION 'Missing programs_center_read policy';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'students'
      AND policyname = 'students_brand'
      AND qual ILIKE '%student_enrolled_at_accessible_center%'
  ) THEN
    RAISE EXCEPTION 'students_brand must allow enrolled-at-accessible-center path';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'brand_assets_center_manage'
  ) THEN
    RAISE EXCEPTION 'Missing brand_assets_center_manage storage policy';
  END IF;

  RAISE NOTICE 'regression_center_staff_membership_does_not_grant_brand_access passed';
END $$;
