-- Competition question papers: PDF/Excel/CSV library tagged by course + level,
-- attach to events; students get URLs only after enrollment.

-- ---------------------------------------------------------------------------
-- Storage: allow spreadsheet MIME types on brand-assets
-- ---------------------------------------------------------------------------

UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
    'image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'text/plain',
    'text/html',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
WHERE id = 'brand-assets';

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.competition_question_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  mime_type text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

DROP TRIGGER IF EXISTS competition_question_papers_audit ON public.competition_question_papers;
CREATE TRIGGER competition_question_papers_audit
  BEFORE INSERT OR UPDATE ON public.competition_question_papers
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE INDEX IF NOT EXISTS competition_question_papers_scope_idx
  ON public.competition_question_papers (brand_id, program_id, level_id);

CREATE TABLE IF NOT EXISTS public.brand_competition_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  competition_id uuid NOT NULL REFERENCES public.brand_competitions(id) ON DELETE CASCADE,
  paper_id uuid NOT NULL REFERENCES public.competition_question_papers(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (competition_id, paper_id)
);

DROP TRIGGER IF EXISTS brand_competition_papers_audit ON public.brand_competition_papers;
CREATE TRIGGER brand_competition_papers_audit
  BEFORE INSERT OR UPDATE ON public.brand_competition_papers
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE INDEX IF NOT EXISTS brand_competition_papers_comp_idx
  ON public.brand_competition_papers (competition_id, sort_order);

ALTER TABLE public.competition_question_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_competition_papers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS competition_question_papers_access ON public.competition_question_papers;
CREATE POLICY competition_question_papers_access ON public.competition_question_papers FOR ALL TO authenticated
  USING (
    (public.has_brand_access(brand_id) OR public.is_platform_admin())
    AND public.brand_feature_enabled(brand_id, 'competitions')
  )
  WITH CHECK (
    (public.has_brand_access(brand_id) OR public.is_platform_admin())
    AND public.brand_feature_enabled(brand_id, 'competitions')
  );

DROP POLICY IF EXISTS brand_competition_papers_access ON public.brand_competition_papers;
CREATE POLICY brand_competition_papers_access ON public.brand_competition_papers FOR ALL TO authenticated
  USING (
    (public.has_brand_access(brand_id) OR public.is_platform_admin())
    AND public.brand_feature_enabled(brand_id, 'competitions')
  )
  WITH CHECK (
    (public.has_brand_access(brand_id) OR public.is_platform_admin())
    AND public.brand_feature_enabled(brand_id, 'competitions')
  );

-- ---------------------------------------------------------------------------
-- Staff RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.list_competition_question_papers(
  p_brand_id uuid,
  p_program_id uuid DEFAULT NULL,
  p_level_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_brand_access(p_brand_id) OR public.is_platform_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  PERFORM public.assert_competitions_enabled(p_brand_id);

  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(q)::jsonb ORDER BY q.created_at DESC)
    FROM (
      SELECT
        p.id,
        p.program_id,
        p.level_id,
        p.title,
        p.file_name,
        p.file_url,
        p.mime_type,
        p.is_active,
        p.created_at
      FROM public.competition_question_papers p
      WHERE p.brand_id = p_brand_id
        AND (p_program_id IS NULL OR p.program_id = p_program_id)
        AND (p_level_id IS NULL OR p.level_id = p_level_id)
    ) q
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_competition_question_paper(
  p_brand_id uuid,
  p_program_id uuid,
  p_level_id uuid,
  p_title text,
  p_file_name text,
  p_file_url text,
  p_mime_type text,
  p_id uuid DEFAULT NULL,
  p_is_active boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_level public.levels%ROWTYPE;
BEGIN
  IF NOT (public.has_brand_access(p_brand_id) OR public.is_platform_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  PERFORM public.assert_competitions_enabled(p_brand_id);

  IF nullif(trim(p_title), '') IS NULL THEN
    RAISE EXCEPTION 'title required';
  END IF;
  IF nullif(trim(p_file_url), '') IS NULL OR nullif(trim(p_file_name), '') IS NULL THEN
    RAISE EXCEPTION 'file required';
  END IF;
  IF nullif(trim(p_mime_type), '') IS NULL THEN
    RAISE EXCEPTION 'mime_type required';
  END IF;

  SELECT * INTO v_level FROM public.levels WHERE id = p_level_id AND program_id = p_program_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'level does not belong to program';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.competition_question_papers (
      brand_id, program_id, level_id, title, file_name, file_url, mime_type, is_active
    ) VALUES (
      p_brand_id, p_program_id, p_level_id, trim(p_title), trim(p_file_name),
      trim(p_file_url), trim(p_mime_type), COALESCE(p_is_active, true)
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.competition_question_papers
    SET
      program_id = p_program_id,
      level_id = p_level_id,
      title = trim(p_title),
      file_name = trim(p_file_name),
      file_url = trim(p_file_url),
      mime_type = trim(p_mime_type),
      is_active = COALESCE(p_is_active, true)
    WHERE id = p_id AND brand_id = p_brand_id
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      INSERT INTO public.competition_question_papers (
        id, brand_id, program_id, level_id, title, file_name, file_url, mime_type, is_active
      ) VALUES (
        p_id, p_brand_id, p_program_id, p_level_id, trim(p_title), trim(p_file_name),
        trim(p_file_url), trim(p_mime_type), COALESCE(p_is_active, true)
      )
      RETURNING id INTO v_id;
    END IF;
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_competition_question_paper(
  p_brand_id uuid,
  p_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_brand_access(p_brand_id) OR public.is_platform_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  PERFORM public.assert_competitions_enabled(p_brand_id);

  DELETE FROM public.competition_question_papers
  WHERE id = p_id AND brand_id = p_brand_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_brand_competition_papers(
  p_brand_id uuid,
  p_competition_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_brand_access(p_brand_id) OR public.is_platform_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  PERFORM public.assert_competitions_enabled(p_brand_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.brand_competitions c
    WHERE c.id = p_competition_id AND c.brand_id = p_brand_id
  ) THEN
    RAISE EXCEPTION 'competition not found';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(q)::jsonb ORDER BY q.sort_order, q.title)
    FROM (
      SELECT
        bcp.id,
        bcp.paper_id,
        bcp.sort_order,
        p.title,
        p.file_name,
        p.file_url,
        p.mime_type,
        p.program_id,
        p.level_id,
        p.is_active
      FROM public.brand_competition_papers bcp
      JOIN public.competition_question_papers p ON p.id = bcp.paper_id
      WHERE bcp.competition_id = p_competition_id AND bcp.brand_id = p_brand_id
    ) q
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_brand_competition_papers(
  p_brand_id uuid,
  p_competition_id uuid,
  p_paper_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ids uuid[] := COALESCE(p_paper_ids, '{}'::uuid[]);
  v_id uuid;
  v_ord int := 0;
BEGIN
  IF NOT (public.has_brand_access(p_brand_id) OR public.is_platform_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  PERFORM public.assert_competitions_enabled(p_brand_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.brand_competitions c
    WHERE c.id = p_competition_id AND c.brand_id = p_brand_id
  ) THEN
    RAISE EXCEPTION 'competition not found';
  END IF;

  DELETE FROM public.brand_competition_papers
  WHERE competition_id = p_competition_id AND brand_id = p_brand_id;

  FOREACH v_id IN ARRAY v_ids LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.competition_question_papers p
      WHERE p.id = v_id AND p.brand_id = p_brand_id AND p.is_active
    ) THEN
      RAISE EXCEPTION 'invalid paper %', v_id;
    END IF;
    INSERT INTO public.brand_competition_papers (brand_id, competition_id, paper_id, sort_order)
    VALUES (p_brand_id, p_competition_id, v_id, v_ord);
    v_ord := v_ord + 1;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Student: papers only after active registration
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_student_competition_papers(p_competition_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comp public.brand_competitions%ROWTYPE;
  v_student_id uuid;
BEGIN
  SELECT * INTO v_comp FROM public.brand_competitions WHERE id = p_competition_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'competition not found';
  END IF;

  PERFORM public.assert_competitions_enabled(v_comp.brand_id);
  v_student_id := public.resolve_student_for_learn(v_comp.brand_id);
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'NO_STUDENT_LINK';
  END IF;
  PERFORM public.get_student_active_enrollment(v_student_id, v_comp.brand_id);

  IF NOT EXISTS (
    SELECT 1
    FROM public.student_competition_registrations r
    WHERE r.competition_id = p_competition_id
      AND r.student_id = v_student_id
      AND r.status IN ('registered', 'confirmed', 'waitlisted')
  ) THEN
    RAISE EXCEPTION 'NOT_REGISTERED';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(q)::jsonb ORDER BY q.sort_order, q.title)
    FROM (
      SELECT
        bcp.paper_id AS id,
        bcp.sort_order,
        p.title,
        p.file_name,
        p.file_url,
        p.mime_type
      FROM public.brand_competition_papers bcp
      JOIN public.competition_question_papers p ON p.id = bcp.paper_id
      WHERE bcp.competition_id = p_competition_id
        AND p.is_active
    ) q
  ), '[]'::jsonb);
END;
$$;

-- Enrich registered list with paper_count (non-breaking additive fields)
CREATE OR REPLACE FUNCTION public.competition_paper_meta_for_student(
  p_competition_id uuid,
  p_student_id uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'paper_count', (
      SELECT count(*)::int
      FROM public.brand_competition_papers bcp
      JOIN public.competition_question_papers p ON p.id = bcp.paper_id
      WHERE bcp.competition_id = p_competition_id AND p.is_active
    ),
    'has_papers', EXISTS (
      SELECT 1
      FROM public.brand_competition_papers bcp
      JOIN public.competition_question_papers p ON p.id = bcp.paper_id
      WHERE bcp.competition_id = p_competition_id AND p.is_active
    ),
    'can_view_papers', EXISTS (
      SELECT 1
      FROM public.student_competition_registrations r
      WHERE r.competition_id = p_competition_id
        AND r.student_id = p_student_id
        AND r.status IN ('registered', 'confirmed', 'waitlisted')
    ) AND EXISTS (
      SELECT 1
      FROM public.brand_competition_papers bcp
      JOIN public.competition_question_papers p ON p.id = bcp.paper_id
      WHERE bcp.competition_id = p_competition_id AND p.is_active
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_student_competitions(p_brand_id uuid, p_filter text DEFAULT 'upcoming')
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_home jsonb;
BEGIN
  IF NOT public.brand_feature_enabled(p_brand_id, 'competitions') THEN
    RETURN '[]'::jsonb;
  END IF;

  v_student_id := public.resolve_student_for_learn(p_brand_id);
  IF v_student_id IS NULL THEN RAISE EXCEPTION 'NO_STUDENT_LINK'; END IF;
  PERFORM public.get_student_active_enrollment(v_student_id, p_brand_id);

  IF p_filter = 'registered' THEN
    RETURN COALESCE((
      SELECT jsonb_agg(row.item ORDER BY (row.item->>'event_date') ASC NULLS LAST)
      FROM (
        SELECT
          jsonb_build_object(
            'registration_id', r.id,
            'competition_id', bc.id,
            'name', bc.name,
            'event_date', bc.event_date,
            'location', bc.location,
            'status', r.status,
            'fee_type', bc.fee_type,
            'fee_amount', bc.fee_amount
          )
          || public.competition_quiz_meta_for_student(bc.id, v_student_id)
          || public.competition_paper_meta_for_student(bc.id, v_student_id) AS item
        FROM public.student_competition_registrations r
        JOIN public.brand_competitions bc ON bc.id = r.competition_id
        WHERE r.student_id = v_student_id AND r.status IN ('registered', 'confirmed', 'waitlisted')
      ) row
    ), '[]'::jsonb);
  ELSIF p_filter = 'past' THEN
    RETURN COALESCE((
      SELECT jsonb_agg(row.item ORDER BY (row.item->>'event_date') DESC NULLS LAST)
      FROM (
        SELECT
          jsonb_build_object(
            'competition_id', bc.id,
            'name', bc.name,
            'event_date', bc.event_date,
            'result_rank', sce.result_rank,
            'rank_position', sce.rank_position,
            'score', sce.score
          )
          || public.competition_quiz_meta_for_student(bc.id, v_student_id)
          || public.competition_paper_meta_for_student(bc.id, v_student_id) AS item
        FROM public.student_competition_entries sce
        JOIN public.brand_competitions bc ON bc.id = sce.competition_id
        WHERE sce.student_id = v_student_id
      ) row
    ), '[]'::jsonb);
  ELSE
    v_home := public.get_student_learn_home(p_brand_id);
    RETURN COALESCE((
      SELECT jsonb_agg(
        elem
        || public.competition_quiz_meta_for_student((elem->>'id')::uuid, v_student_id)
        || public.competition_paper_meta_for_student((elem->>'id')::uuid, v_student_id)
      )
      FROM jsonb_array_elements(COALESCE(v_home->'upcoming_competitions', '[]'::jsonb)) elem
    ), '[]'::jsonb);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.list_competition_question_papers(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_competition_question_papers(uuid, uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.upsert_competition_question_paper(uuid, uuid, uuid, text, text, text, text, uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_competition_question_paper(uuid, uuid, uuid, text, text, text, text, uuid, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.delete_competition_question_paper(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_competition_question_paper(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.list_brand_competition_papers(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_brand_competition_papers(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.set_brand_competition_papers(uuid, uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_brand_competition_papers(uuid, uuid, uuid[]) TO authenticated;

REVOKE ALL ON FUNCTION public.get_student_competition_papers(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_competition_papers(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.competition_paper_meta_for_student(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.competition_paper_meta_for_student(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_student_competitions(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_competitions(uuid, text) TO authenticated;
