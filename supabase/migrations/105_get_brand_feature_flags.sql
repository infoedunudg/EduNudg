-- Learn portal students cannot SELECT brand_settings (RLS: has_brand_access only).
-- Client feature flags must use a SECURITY DEFINER RPC so Events nav appears when
-- competitions is ON (home already returned upcoming_competitions via learn RPCs).

CREATE OR REPLACE FUNCTION public.get_brand_feature_flags(p_brand_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT bs.settings -> 'features' FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
    '{}'::jsonb
  );
$$;

REVOKE ALL ON FUNCTION public.get_brand_feature_flags(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_brand_feature_flags(uuid) TO authenticated;
