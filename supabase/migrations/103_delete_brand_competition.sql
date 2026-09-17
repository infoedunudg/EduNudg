-- Delete brand competition (SECURITY DEFINER; brand access or platform admin).

CREATE OR REPLACE FUNCTION public.delete_brand_competition(p_brand_id uuid, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT public.brand_feature_enabled(p_brand_id, 'merchandise') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;

  DELETE FROM public.brand_competitions WHERE id = p_id AND brand_id = p_brand_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Competition not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_brand_competition(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_brand_competition(uuid, uuid) TO authenticated;
