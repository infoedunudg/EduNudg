-- Reimport overwrites a matching franchise (including soft-deleted) and marks it active.

CREATE OR REPLACE FUNCTION public.import_franchise_centers(
  p_brand_id uuid,
  p_rows jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand public.brands%ROWTYPE;
  v_settings jsonb;
  v_max_centers int;
  v_current_count int;
  v_row jsonb;
  v_row_num int := 0;
  v_slug text;
  v_base text;
  v_suffix text;
  v_n int;
  v_name text;
  v_city text;
  v_display_name text;
  v_region text;
  v_country text;
  v_address text;
  v_pincode text;
  v_phone text;
  v_description text;
  v_owner_email text;
  v_center_id uuid;
  v_existing_id uuid;
  v_existing_deleted timestamptz;
  v_existing_status public.center_status;
  v_created jsonb := '[]'::jsonb;
  v_errors jsonb := '[]'::jsonb;
  v_batch_slugs text[] := '{}'::text[];
  v_created_count int := 0;
  v_new_insert_count int := 0;
  v_row_count int;
  v_taken boolean;
  v_hostname text;
BEGIN
  IF p_brand_id IS NULL THEN
    RAISE EXCEPTION 'brand_id required';
  END IF;

  IF NOT (public.is_platform_admin() OR public.has_brand_access(p_brand_id)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_rows IS NULL OR jsonb_typeof(p_rows) != 'array' THEN
    RAISE EXCEPTION 'p_rows must be a JSON array';
  END IF;

  v_row_count := jsonb_array_length(p_rows);
  IF v_row_count < 1 THEN
    RAISE EXCEPTION 'At least one row is required';
  END IF;

  IF v_row_count > 500 THEN
    RAISE EXCEPTION 'Too many rows (max 500)';
  END IF;

  SELECT * INTO v_brand FROM public.brands WHERE id = p_brand_id AND deleted_at IS NULL;
  IF v_brand.id IS NULL THEN
    RAISE EXCEPTION 'Brand not found';
  END IF;

  SELECT coalesce(bs.settings, '{}'::jsonb)
  INTO v_settings
  FROM public.brand_settings bs
  WHERE bs.brand_id = p_brand_id;

  v_max_centers := nullif(trim(coalesce(v_settings->'features'->>'max_franchise_centers', '')), '')::int;

  SELECT count(*)::int
  INTO v_current_count
  FROM public.franchise_centers fc
  WHERE fc.brand_id = p_brand_id AND fc.deleted_at IS NULL;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
    v_row_num := v_row_num + 1;
    v_center_id := NULL;
    v_existing_id := NULL;
    v_existing_deleted := NULL;
    v_existing_status := NULL;

    v_name := public.import_franchise_center_text(v_row->>'name', 200);
    v_city := public.import_franchise_center_text(v_row->>'city', 100);
    v_display_name := public.import_franchise_center_text(v_row->>'display_name', 200);
    v_region := public.import_franchise_center_text(v_row->>'region', 100);
    v_country := coalesce(public.import_franchise_center_text(v_row->>'country', 2), 'IN');
    v_address := public.import_franchise_center_text(v_row->>'address', 500);
    v_pincode := public.import_franchise_center_text(v_row->>'pincode', 12);
    v_phone := public.import_franchise_center_text(v_row->>'contact_phone', 32);
    v_description := public.import_franchise_center_text(v_row->>'short_description', 500);
    v_owner_email := lower(trim(coalesce(v_row->>'owner_email', '')));

    IF v_name IS NULL OR v_name = '' THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'Name is required')
      );
      CONTINUE;
    END IF;

    IF v_city IS NULL OR v_city = '' THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'City is required')
      );
      CONTINUE;
    END IF;

    v_base := trim(both '-' from left(public.slugify_text(v_name), 48));
    IF v_base IS NULL OR v_base = '' THEN
      v_base := trim(both '-' from left(public.slugify_text(v_city), 48));
    END IF;

    IF v_base IS NULL OR v_base = '' OR v_base !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'Could not create a URL from the franchise name')
      );
      CONTINUE;
    END IF;

    IF v_owner_email <> '' AND NOT public.is_import_email(v_owner_email) THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'Invalid owner_email')
      );
      CONTINUE;
    END IF;

    IF v_pincode IS NOT NULL AND v_pincode !~ '^\d{4,12}$' THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'Invalid pincode')
      );
      CONTINUE;
    END IF;

    SELECT fc.id, fc.deleted_at, fc.status
    INTO v_existing_id, v_existing_deleted, v_existing_status
    FROM public.franchise_centers fc
    WHERE fc.brand_id = p_brand_id AND fc.slug = v_base
    LIMIT 1;

    -- Same name later in this file must not overwrite the first row; allocate a unique slug instead.
    IF v_base = ANY (v_batch_slugs) THEN
      v_existing_id := NULL;
      v_existing_deleted := NULL;
      v_existing_status := NULL;
    END IF;

    IF v_existing_id IS NULL THEN
      IF v_max_centers IS NOT NULL AND (v_current_count + v_new_insert_count) >= v_max_centers THEN
        v_errors := v_errors || jsonb_build_array(
          jsonb_build_object('row', v_row_num, 'message', 'Brand franchise center limit reached')
        );
        CONTINUE;
      END IF;

      v_slug := NULL;
      FOR v_n IN 1..999 LOOP
        IF v_n = 1 THEN
          v_slug := v_base;
        ELSE
          v_suffix := '-' || v_n::text;
          v_slug := trim(both '-' from left(v_base, 48 - char_length(v_suffix))) || v_suffix;
        END IF;

        IF v_slug IS NULL OR v_slug = '' OR v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' OR char_length(v_slug) > 48 THEN
          CONTINUE;
        END IF;

        IF v_slug = ANY (v_batch_slugs) THEN
          CONTINUE;
        END IF;

        SELECT EXISTS (
          SELECT 1 FROM public.franchise_centers fc
          WHERE fc.brand_id = p_brand_id AND fc.slug = v_slug
        ) INTO v_taken;

        IF NOT v_taken THEN
          EXIT;
        END IF;

        v_slug := NULL;
      END LOOP;

      IF v_slug IS NULL THEN
        v_errors := v_errors || jsonb_build_array(
          jsonb_build_object('row', v_row_num, 'message', 'Could not create a unique URL from the franchise name')
        );
        CONTINUE;
      END IF;
    ELSE
      v_slug := v_base;
    END IF;

    BEGIN
      IF v_existing_id IS NOT NULL THEN
        UPDATE public.franchise_centers
        SET
          name = v_name,
          city = v_city,
          address_line1 = v_address,
          region = v_region,
          country = v_country,
          pincode = v_pincode,
          display_name = coalesce(v_display_name, v_name),
          contact_phone = v_phone,
          short_description = coalesce(v_description, short_description),
          owner_email = coalesce(nullif(v_owner_email, ''), owner_email),
          status = 'active',
          deleted_at = NULL,
          updated_at = now()
        WHERE id = v_existing_id;

        v_center_id := v_existing_id;

        IF v_existing_deleted IS NOT NULL OR v_existing_status IS DISTINCT FROM 'active' THEN
          INSERT INTO public.center_status_events (brand_id, center_id, from_status, to_status, reason, created_by)
          VALUES (
            p_brand_id,
            v_center_id,
            coalesce(v_existing_status, 'closed'),
            'active',
            'CSV reimport',
            auth.uid()
          );
        END IF;
      ELSE
        INSERT INTO public.franchise_centers (
          brand_id,
          slug,
          name,
          status,
          city,
          address_line1,
          region,
          country,
          pincode,
          display_name,
          contact_phone,
          short_description,
          owner_email
        )
        VALUES (
          p_brand_id,
          v_slug,
          v_name,
          'active',
          v_city,
          v_address,
          v_region,
          v_country,
          v_pincode,
          coalesce(v_display_name, v_name),
          v_phone,
          v_description,
          nullif(v_owner_email, '')
        )
        RETURNING id INTO v_center_id;

        v_new_insert_count := v_new_insert_count + 1;
      END IF;

      v_hostname := v_slug || '.' || v_brand.slug || '.localhost';
      INSERT INTO public.domain_mappings (hostname, brand_id, center_id, portal_type, is_primary)
      VALUES (v_hostname, p_brand_id, v_center_id, 'center', true)
      ON CONFLICT (hostname) DO UPDATE
        SET
          brand_id = EXCLUDED.brand_id,
          center_id = EXCLUDED.center_id,
          portal_type = 'center',
          is_primary = true,
          updated_at = now();

      IF v_owner_email <> '' THEN
        INSERT INTO public.memberships (user_id, scope_type, brand_id, center_id, role_key, status, accepted_at)
        SELECT u.id, 'center', p_brand_id, v_center_id, 'center_owner', 'invited', NULL
        FROM auth.users u
        WHERE lower(u.email) = v_owner_email
        ON CONFLICT DO NOTHING;
      END IF;

      v_batch_slugs := array_append(v_batch_slugs, v_slug);
      v_created_count := v_created_count + 1;
      v_created := v_created || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'center_id', v_center_id, 'slug', v_slug)
      );
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors || jsonb_build_array(
          jsonb_build_object('row', v_row_num, 'message', SQLERRM)
        );
    END;
  END LOOP;

  IF v_created_count > 0 THEN
    PERFORM public.log_platform_audit(
      'import_franchise_centers',
      'brand',
      p_brand_id,
      p_brand_id,
      NULL,
      jsonb_build_object(
        'created_count', v_created_count,
        'error_count', jsonb_array_length(v_errors),
        'row_count', v_row_count
      )
    );
  END IF;

  RETURN jsonb_build_object('created', v_created, 'errors', v_errors);
END;
$$;

REVOKE ALL ON FUNCTION public.import_franchise_centers(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_franchise_centers(uuid, jsonb) TO authenticated;
