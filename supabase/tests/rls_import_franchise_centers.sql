-- RLS smoke test: franchise center CSV import RPC

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'import_franchise_centers') THEN
    RAISE EXCEPTION 'Missing import_franchise_centers';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'import_franchise_center_text') THEN
    RAISE EXCEPTION 'Missing import_franchise_center_text';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_import_email') THEN
    RAISE EXCEPTION 'Missing is_import_email';
  END IF;

  IF (
    SELECT pg_get_functiondef(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'import_franchise_centers'
    ORDER BY p.oid DESC
    LIMIT 1
  ) NOT ILIKE '%deleted_at = NULL%' THEN
    RAISE EXCEPTION 'import_franchise_centers must restore matching soft-deleted franchises';
  END IF;

  RAISE NOTICE 'RLS franchise center import smoke test passed';
END $$;
