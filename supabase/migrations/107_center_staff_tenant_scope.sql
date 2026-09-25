-- Fix: center-scoped memberships must not imply brand-wide access.
-- user_brand_ids() previously returned brand_id for scope_type = 'center', so
-- has_brand_access / has_center_access elevated franchise staff to every center
-- under the brand. Narrow brand helpers to brand/platform scope, and grant
-- explicit center-staff paths for students, curriculum reads, and center photos.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_brand_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT m.brand_id
  FROM public.memberships m
  WHERE m.user_id = auth.uid()
    AND m.status = 'active'
    AND m.brand_id IS NOT NULL
    AND m.scope_type IN ('brand', 'platform')
  UNION
  SELECT b.id FROM public.brands b WHERE public.is_platform_admin();
$$;

COMMENT ON FUNCTION public.user_brand_ids() IS
  'Brand IDs for active brand/platform memberships (not center scope). Platform admins receive all brand IDs.';

CREATE OR REPLACE FUNCTION public.has_center_staff_for_brand(p_brand_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m
    JOIN public.franchise_centers fc ON fc.id = m.center_id
    WHERE m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.scope_type = 'center'
      AND m.brand_id = p_brand_id
      AND fc.status = 'active'
      AND fc.deleted_at IS NULL
  );
$$;

COMMENT ON FUNCTION public.has_center_staff_for_brand(uuid) IS
  'True when the caller has an active center membership under the brand (not brand-wide access).';

CREATE OR REPLACE FUNCTION public.student_enrolled_at_accessible_center(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_enrollments e
    WHERE e.student_id = p_student_id
      AND e.center_id IS NOT NULL
      AND public.has_center_access(e.center_id)
  );
$$;

COMMENT ON FUNCTION public.student_enrolled_at_accessible_center(uuid) IS
  'True when the student has an enrollment at a center the caller can access.';

REVOKE ALL ON FUNCTION public.has_center_staff_for_brand(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.student_enrolled_at_accessible_center(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_brand_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_center_staff_for_brand(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.student_enrolled_at_accessible_center(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Students + profiles + parents (center staff: enrolled at their centers only)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS students_brand ON public.students;
CREATE POLICY students_brand ON public.students FOR ALL TO authenticated
  USING (
    public.has_brand_access(brand_id)
    OR public.is_platform_admin()
    OR public.student_enrolled_at_accessible_center(id)
  )
  WITH CHECK (
    public.has_brand_access(brand_id)
    OR public.is_platform_admin()
    OR public.student_enrolled_at_accessible_center(id)
  );

DROP POLICY IF EXISTS student_profiles_access ON public.student_profiles;
CREATE POLICY student_profiles_access ON public.student_profiles FOR ALL TO authenticated
  USING (
    public.has_brand_access(brand_id)
    OR public.is_platform_admin()
    OR public.student_enrolled_at_accessible_center(student_id)
  )
  WITH CHECK (
    public.has_brand_access(brand_id)
    OR public.is_platform_admin()
    OR public.student_enrolled_at_accessible_center(student_id)
  );

DROP POLICY IF EXISTS parents_brand ON public.parents;
CREATE POLICY parents_brand ON public.parents FOR ALL TO authenticated
  USING (
    public.has_brand_access(brand_id)
    OR public.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.parent_student_links psl
      WHERE psl.parent_id = parents.id
        AND public.student_enrolled_at_accessible_center(psl.student_id)
    )
  )
  WITH CHECK (
    public.has_brand_access(brand_id)
    OR public.is_platform_admin()
  );

DROP POLICY IF EXISTS parent_links_brand ON public.parent_student_links;
CREATE POLICY parent_links_brand ON public.parent_student_links FOR ALL TO authenticated
  USING (
    public.has_brand_access(brand_id)
    OR public.is_platform_admin()
    OR public.student_enrolled_at_accessible_center(student_id)
  )
  WITH CHECK (
    public.has_brand_access(brand_id)
    OR public.is_platform_admin()
    OR public.student_enrolled_at_accessible_center(student_id)
  );

-- ---------------------------------------------------------------------------
-- Brand catalog reads for center staff (SELECT only; mutations stay brand-scoped)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS brands_select ON public.brands;
CREATE POLICY brands_select ON public.brands FOR SELECT TO authenticated
  USING (
    public.has_brand_access(id)
    OR public.has_center_staff_for_brand(id)
  );

DROP POLICY IF EXISTS programs_access ON public.programs;
CREATE POLICY programs_access ON public.programs FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin())
  WITH CHECK (public.has_brand_access(brand_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS programs_center_read ON public.programs;
CREATE POLICY programs_center_read ON public.programs FOR SELECT TO authenticated
  USING (public.has_center_staff_for_brand(brand_id));

DROP POLICY IF EXISTS levels_access ON public.levels;
CREATE POLICY levels_access ON public.levels FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin())
  WITH CHECK (public.has_brand_access(brand_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS levels_center_read ON public.levels;
CREATE POLICY levels_center_read ON public.levels FOR SELECT TO authenticated
  USING (public.has_center_staff_for_brand(brand_id));

DROP POLICY IF EXISTS modules_access ON public.modules;
CREATE POLICY modules_access ON public.modules FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin())
  WITH CHECK (public.has_brand_access(brand_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS modules_center_read ON public.modules;
CREATE POLICY modules_center_read ON public.modules FOR SELECT TO authenticated
  USING (public.has_center_staff_for_brand(brand_id));

DROP POLICY IF EXISTS lessons_access ON public.lessons;
CREATE POLICY lessons_access ON public.lessons FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin())
  WITH CHECK (public.has_brand_access(brand_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS lessons_center_read ON public.lessons;
CREATE POLICY lessons_center_read ON public.lessons FOR SELECT TO authenticated
  USING (public.has_center_staff_for_brand(brand_id));

DROP POLICY IF EXISTS inventory_brand ON public.inventory_items;
CREATE POLICY inventory_brand ON public.inventory_items FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin())
  WITH CHECK (public.has_brand_access(brand_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS inventory_items_center_read ON public.inventory_items;
CREATE POLICY inventory_items_center_read ON public.inventory_items FOR SELECT TO authenticated
  USING (public.has_center_staff_for_brand(brand_id));

-- ---------------------------------------------------------------------------
-- Storage: center staff manage only their center photo folder
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS brand_assets_center_manage ON storage.objects;
CREATE POLICY brand_assets_center_manage ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND coalesce(array_length(storage.foldername(name), 1), 0) >= 3
    AND (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND (storage.foldername(name))[2] = 'centers'
    AND (storage.foldername(name))[3] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.has_center_access((storage.foldername(name))[3]::uuid)
  )
  WITH CHECK (
    bucket_id = 'brand-assets'
    AND coalesce(array_length(storage.foldername(name), 1), 0) >= 3
    AND (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND (storage.foldername(name))[2] = 'centers'
    AND (storage.foldername(name))[3] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.has_center_access((storage.foldername(name))[3]::uuid)
  );
