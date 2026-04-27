-- Seva Eats backend modules implementation
-- Applied to Supabase via MCP migration: backend_modules_implementation

BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS requested_servings integer,
  ADD COLUMN IF NOT EXISTS delivery_window_start time,
  ADD COLUMN IF NOT EXISTS delivery_window_end time;

UPDATE public.orders
SET requested_servings = 1
WHERE requested_servings IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN requested_servings SET DEFAULT 1,
  ALTER COLUMN requested_servings SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_requested_servings_range'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_requested_servings_range
      CHECK (requested_servings >= 1 AND requested_servings <= 20);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.order_allocation_events (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_id uuid NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  kitchen_id uuid NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
  total_menu_capacity integer,
  active_orders_before integer NOT NULL,
  active_orders_after integer NOT NULL,
  allocated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_allocation_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'order_allocation_events'
      AND policyname = 'alloc_select_staff'
  ) THEN
    CREATE POLICY alloc_select_staff
      ON public.order_allocation_events
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.staff s
          WHERE s.auth_id = auth.uid()
            AND s.is_active
            AND s.deleted_at IS NULL
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS order_allocation_events_menu_allocated_idx
  ON public.order_allocation_events(menu_id, allocated_at DESC);

CREATE OR REPLACE FUNCTION public.current_user_row_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u.auth_id = auth.uid()
    AND u.deleted_at IS NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_user_row_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_row_id() TO authenticated;

CREATE OR REPLACE FUNCTION public.upsert_recipient_profile(
  p_full_name text,
  p_phone text DEFAULT NULL,
  p_address_line1 text DEFAULT NULL,
  p_address_line2 text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_province text DEFAULT NULL,
  p_postal_code text DEFAULT NULL,
  p_latitude numeric DEFAULT NULL,
  p_longitude numeric DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth_id uuid;
  v_email text;
  v_user public.users;
BEGIN
  v_auth_id := auth.uid();

  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_auth_id;

  INSERT INTO public.users (
    auth_id,
    full_name,
    phone,
    email,
    address_line1,
    address_line2,
    city,
    province,
    postal_code,
    latitude,
    longitude
  )
  VALUES (
    v_auth_id,
    COALESCE(NULLIF(trim(p_full_name), ''), 'Community Member'),
    NULLIF(trim(p_phone), ''),
    COALESCE(v_email, NULLIF(trim(v_email), '')),
    NULLIF(trim(p_address_line1), ''),
    NULLIF(trim(p_address_line2), ''),
    NULLIF(trim(p_city), ''),
    NULLIF(trim(p_province), ''),
    NULLIF(trim(p_postal_code), ''),
    p_latitude,
    p_longitude
  )
  ON CONFLICT (auth_id)
  DO UPDATE SET
    full_name = COALESCE(NULLIF(trim(EXCLUDED.full_name), ''), public.users.full_name),
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    email = COALESCE(EXCLUDED.email, public.users.email),
    address_line1 = COALESCE(EXCLUDED.address_line1, public.users.address_line1),
    address_line2 = COALESCE(EXCLUDED.address_line2, public.users.address_line2),
    city = COALESCE(EXCLUDED.city, public.users.city),
    province = COALESCE(EXCLUDED.province, public.users.province),
    postal_code = COALESCE(EXCLUDED.postal_code, public.users.postal_code),
    latitude = COALESCE(EXCLUDED.latitude, public.users.latitude),
    longitude = COALESCE(EXCLUDED.longitude, public.users.longitude),
    updated_at = now()
  RETURNING * INTO v_user;

  RETURN v_user;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_recipient_profile(text, text, text, text, text, text, text, numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_recipient_profile(text, text, text, text, text, text, text, numeric, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.upsert_user_preferences(
  p_dietary_restrictions text[] DEFAULT ARRAY[]::text[],
  p_notification_sms boolean DEFAULT true,
  p_notification_email boolean DEFAULT false,
  p_language text DEFAULT 'en',
  p_notes text DEFAULT NULL
)
RETURNS public.user_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_prefs public.user_preferences;
BEGIN
  v_user_id := public.current_user_row_id();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user profile found for authenticated account';
  END IF;

  INSERT INTO public.user_preferences (
    user_id,
    dietary_restrictions,
    notification_sms,
    notification_email,
    language,
    notes
  )
  VALUES (
    v_user_id,
    COALESCE(p_dietary_restrictions, ARRAY[]::text[]),
    p_notification_sms,
    p_notification_email,
    COALESCE(NULLIF(trim(p_language), ''), 'en'),
    CASE
      WHEN p_notes IS NULL THEN NULL
      ELSE left(trim(p_notes), 1000)
    END
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    dietary_restrictions = EXCLUDED.dietary_restrictions,
    notification_sms = EXCLUDED.notification_sms,
    notification_email = EXCLUDED.notification_email,
    language = EXCLUDED.language,
    notes = EXCLUDED.notes,
    updated_at = now()
  RETURNING * INTO v_prefs;

  RETURN v_prefs;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_user_preferences(text[], boolean, boolean, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_user_preferences(text[], boolean, boolean, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.request_meal_order(
  p_menu_id uuid,
  p_kitchen_id uuid,
  p_items jsonb,
  p_delivery_address_line1 text,
  p_delivery_city text,
  p_delivery_province text,
  p_delivery_postal_code text,
  p_delivery_latitude numeric,
  p_delivery_longitude numeric,
  p_serving_size integer DEFAULT 2,
  p_special_instructions text DEFAULT NULL,
  p_delivery_window_start time DEFAULT NULL,
  p_delivery_window_end time DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_order_id uuid;
  v_effective_max integer;
  v_active_orders integer;
  v_cutoff timestamptz;
  v_reserved boolean;
BEGIN
  v_user_id := public.current_user_row_id();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No recipient profile found';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one menu item is required';
  END IF;

  SELECT COALESCE(m.max_orders, k.max_daily_orders), m.order_cutoff_at
  INTO v_effective_max, v_cutoff
  FROM public.menus m
  JOIN public.kitchens k ON k.id = m.kitchen_id
  WHERE m.id = p_menu_id
    AND m.kitchen_id = p_kitchen_id
    AND m.is_published = true
    AND m.menu_date = CURRENT_DATE
    AND k.status = 'active'
    AND k.deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Menu unavailable for this kitchen';
  END IF;

  IF v_cutoff IS NOT NULL AND now() > v_cutoff THEN
    RAISE EXCEPTION 'Order window has closed for this menu';
  END IF;

  SELECT count(*)
  INTO v_active_orders
  FROM public.orders o
  WHERE o.menu_id = p_menu_id
    AND o.status IN ('pending', 'confirmed', 'preparing', 'ready', 'picked_up');

  IF v_active_orders >= v_effective_max THEN
    RAISE EXCEPTION 'No remaining meal capacity for this menu';
  END IF;

  INSERT INTO public.orders (
    user_id,
    kitchen_id,
    menu_id,
    delivery_address_line1,
    delivery_city,
    delivery_province,
    delivery_postal_code,
    delivery_latitude,
    delivery_longitude,
    requested_servings,
    special_instructions,
    delivery_window_start,
    delivery_window_end,
    status
  )
  VALUES (
    v_user_id,
    p_kitchen_id,
    p_menu_id,
    trim(p_delivery_address_line1),
    trim(p_delivery_city),
    trim(p_delivery_province),
    trim(p_delivery_postal_code),
    p_delivery_latitude,
    p_delivery_longitude,
    GREATEST(1, LEAST(20, COALESCE(p_serving_size, 2))),
    CASE
      WHEN p_special_instructions IS NULL THEN NULL
      ELSE left(trim(p_special_instructions), 500)
    END,
    p_delivery_window_start,
    p_delivery_window_end,
    'pending'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, menu_item_id, food_item_id, quantity, item_name_snapshot)
  SELECT
    v_order_id,
    mi.id,
    mi.food_item_id,
    GREATEST(1, LEAST(20, (item->>'quantity')::integer)),
    COALESCE(mi.display_name, fi.name)
  FROM jsonb_array_elements(p_items) AS item
  JOIN public.menu_items mi
    ON mi.id = (item->>'menu_item_id')::uuid
   AND mi.menu_id = p_menu_id
   AND mi.is_available = true
  JOIN public.food_items fi
    ON fi.id = mi.food_item_id
   AND fi.deleted_at IS NULL
  WHERE item ? 'menu_item_id'
    AND item ? 'quantity';

  IF NOT EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = v_order_id) THEN
    RAISE EXCEPTION 'No valid menu items submitted';
  END IF;

  SELECT public.reserve_menu_items(v_order_id) INTO v_reserved;

  IF COALESCE(v_reserved, false) = false THEN
    DELETE FROM public.orders WHERE id = v_order_id;
    RAISE EXCEPTION 'Requested quantities are no longer available';
  END IF;

  INSERT INTO public.order_allocation_events (
    order_id,
    menu_id,
    kitchen_id,
    total_menu_capacity,
    active_orders_before,
    active_orders_after
  )
  VALUES (
    v_order_id,
    p_menu_id,
    p_kitchen_id,
    v_effective_max,
    v_active_orders,
    v_active_orders + 1
  );

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_meal_order(uuid, uuid, jsonb, text, text, text, text, numeric, numeric, integer, text, time, time) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_meal_order(uuid, uuid, jsonb, text, text, text, text, numeric, numeric, integer, text, time, time) TO authenticated;

CREATE OR REPLACE FUNCTION public.publish_daily_menu(
  p_kitchen_id uuid,
  p_menu_date date,
  p_label text,
  p_order_cutoff_at timestamptz,
  p_max_orders integer,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_menu_id uuid;
  v_staff_allowed boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.staff s
    WHERE s.auth_id = auth.uid()
      AND s.is_active
      AND s.deleted_at IS NULL
      AND (
        s.role IN ('admin', 'dispatcher')
        OR (s.role = 'kitchen_manager' AND s.kitchen_id = p_kitchen_id)
      )
  )
  INTO v_staff_allowed;

  IF NOT v_staff_allowed THEN
    RAISE EXCEPTION 'Only staff can publish menu availability';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one menu item is required';
  END IF;

  INSERT INTO public.menus (
    kitchen_id,
    menu_date,
    label,
    order_cutoff_at,
    max_orders,
    is_published
  )
  VALUES (
    p_kitchen_id,
    p_menu_date,
    NULLIF(trim(p_label), ''),
    p_order_cutoff_at,
    GREATEST(1, p_max_orders),
    true
  )
  ON CONFLICT (kitchen_id, menu_date)
  DO UPDATE SET
    label = EXCLUDED.label,
    order_cutoff_at = EXCLUDED.order_cutoff_at,
    max_orders = EXCLUDED.max_orders,
    is_published = true,
    updated_at = now()
  RETURNING id INTO v_menu_id;

  INSERT INTO public.menu_items (
    menu_id,
    food_item_id,
    display_name,
    display_notes,
    quantity_available,
    quantity_reserved,
    is_available
  )
  SELECT
    v_menu_id,
    (item->>'food_item_id')::uuid,
    NULLIF(trim(item->>'display_name'), ''),
    NULLIF(trim(item->>'display_notes'), ''),
    GREATEST(0, COALESCE((item->>'quantity_available')::integer, 0)),
    0,
    true
  FROM jsonb_array_elements(p_items) AS item
  WHERE item ? 'food_item_id'
  ON CONFLICT (menu_id, food_item_id)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    display_notes = EXCLUDED.display_notes,
    quantity_available = EXCLUDED.quantity_available,
    quantity_reserved = 0,
    is_available = true,
    updated_at = now();

  RETURN v_menu_id;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_daily_menu(uuid, date, text, timestamptz, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_daily_menu(uuid, date, text, timestamptz, integer, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_delivery_batch(
  p_driver_id uuid,
  p_kitchen_id uuid,
  p_menu_id uuid,
  p_max_orders integer DEFAULT 10,
  p_route_label text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_route_id uuid;
  v_created_count integer := 0;
  v_delivery_id uuid;
  v_kitchen_lat numeric;
  v_kitchen_lng numeric;
  v_driver_allowed boolean;
  v_order record;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.staff s
    WHERE s.auth_id = auth.uid()
      AND s.is_active
      AND s.deleted_at IS NULL
      AND s.role IN ('admin', 'dispatcher')
  )
  INTO v_driver_allowed;

  IF NOT v_driver_allowed THEN
    RAISE EXCEPTION 'Only dispatcher/admin can create delivery batches';
  END IF;

  SELECT k.latitude, k.longitude
  INTO v_kitchen_lat, v_kitchen_lng
  FROM public.kitchens k
  WHERE k.id = p_kitchen_id
    AND k.deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kitchen not found';
  END IF;

  INSERT INTO public.driver_routes (
    driver_id,
    kitchen_id,
    route_date,
    label,
    status,
    estimated_start_at,
    total_stops
  )
  VALUES (
    p_driver_id,
    p_kitchen_id,
    CURRENT_DATE,
    COALESCE(NULLIF(trim(p_route_label), ''), 'Community Route'),
    'assigned',
    now(),
    0
  )
  RETURNING id INTO v_route_id;

  FOR v_order IN
    SELECT
      o.id,
      o.delivery_address_line1,
      o.delivery_address_line2,
      o.delivery_city,
      o.delivery_postal_code,
      o.delivery_latitude,
      o.delivery_longitude,
      u.full_name,
      u.phone,
      ROW_NUMBER() OVER (
        ORDER BY
          COALESCE((o.delivery_latitude - v_kitchen_lat) * (o.delivery_latitude - v_kitchen_lat), 0)
          + COALESCE((o.delivery_longitude - v_kitchen_lng) * (o.delivery_longitude - v_kitchen_lng), 0),
          o.created_at
      ) AS stop_sequence
    FROM public.orders o
    JOIN public.users u ON u.id = o.user_id
    LEFT JOIN public.deliveries d ON d.order_id = o.id
    WHERE o.kitchen_id = p_kitchen_id
      AND o.menu_id = p_menu_id
      AND o.status IN ('confirmed', 'preparing', 'ready')
      AND d.id IS NULL
    ORDER BY o.created_at
    LIMIT GREATEST(1, LEAST(50, COALESCE(p_max_orders, 10)))
  LOOP
    INSERT INTO public.deliveries (
      order_id,
      driver_id,
      route_id,
      delivery_address_line1,
      delivery_address_line2,
      delivery_city,
      delivery_postal_code,
      delivery_latitude,
      delivery_longitude,
      recipient_name,
      recipient_phone,
      status
    )
    VALUES (
      v_order.id,
      p_driver_id,
      v_route_id,
      v_order.delivery_address_line1,
      v_order.delivery_address_line2,
      v_order.delivery_city,
      v_order.delivery_postal_code,
      v_order.delivery_latitude,
      v_order.delivery_longitude,
      v_order.full_name,
      v_order.phone,
      'assigned'
    )
    RETURNING id INTO v_delivery_id;

    INSERT INTO public.route_stops (
      route_id,
      delivery_id,
      stop_sequence,
      address_line1,
      address_line2,
      city,
      postal_code,
      latitude,
      longitude,
      recipient_name,
      recipient_phone,
      status
    )
    VALUES (
      v_route_id,
      v_delivery_id,
      v_order.stop_sequence,
      v_order.delivery_address_line1,
      v_order.delivery_address_line2,
      v_order.delivery_city,
      v_order.delivery_postal_code,
      COALESCE(v_order.delivery_latitude, 0),
      COALESCE(v_order.delivery_longitude, 0),
      v_order.full_name,
      v_order.phone,
      'pending'
    );

    UPDATE public.deliveries
    SET route_stop_id = (
      SELECT rs.id
      FROM public.route_stops rs
      WHERE rs.route_id = v_route_id
        AND rs.delivery_id = v_delivery_id
      LIMIT 1
    )
    WHERE id = v_delivery_id;

    UPDATE public.orders
    SET status = 'ready'
    WHERE id = v_order.id
      AND status IN ('confirmed', 'preparing');

    v_created_count := v_created_count + 1;
  END LOOP;

  IF v_created_count = 0 THEN
    DELETE FROM public.driver_routes WHERE id = v_route_id;
    RAISE EXCEPTION 'No eligible approved orders to batch';
  END IF;

  UPDATE public.driver_routes
  SET total_stops = v_created_count,
      updated_at = now()
  WHERE id = v_route_id;

  UPDATE public.drivers
  SET status = 'on_delivery',
      updated_at = now()
  WHERE id = p_driver_id;

  RETURN v_route_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_delivery_batch(uuid, uuid, uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_delivery_batch(uuid, uuid, uuid, integer, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.driver_update_delivery_status(
  p_delivery_id uuid,
  p_status public.delivery_status,
  p_note text DEFAULT NULL
)
RETURNS public.deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_driver_id uuid;
  v_order_id uuid;
  v_route_id uuid;
  v_result public.deliveries;
BEGIN
  SELECT d.id
  INTO v_driver_id
  FROM public.drivers d
  WHERE d.auth_id = auth.uid()
    AND d.deleted_at IS NULL
    AND d.status IN ('active', 'on_delivery');

  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'Authenticated account is not an active driver';
  END IF;

  SELECT d.order_id, d.route_id
  INTO v_order_id, v_route_id
  FROM public.deliveries d
  WHERE d.id = p_delivery_id
    AND d.driver_id = v_driver_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery not found for this driver';
  END IF;

  UPDATE public.deliveries
  SET status = p_status,
      picked_up_at = CASE WHEN p_status = 'en_route' THEN COALESCE(picked_up_at, now()) ELSE picked_up_at END,
      delivered_at = CASE WHEN p_status = 'delivered' THEN COALESCE(delivered_at, now()) ELSE delivered_at END,
      failed_at = CASE WHEN p_status = 'failed' THEN COALESCE(failed_at, now()) ELSE failed_at END,
      failure_reason = CASE WHEN p_status = 'failed' THEN NULLIF(trim(p_note), '') ELSE failure_reason END,
      delivery_notes = CASE WHEN p_note IS NULL THEN delivery_notes ELSE left(trim(p_note), 500) END,
      updated_at = now()
  WHERE id = p_delivery_id
  RETURNING * INTO v_result;

  UPDATE public.route_stops
  SET status = CASE
      WHEN p_status = 'delivered' THEN 'completed'::public.stop_status
      WHEN p_status = 'en_route' THEN 'arrived'::public.stop_status
      ELSE status
    END,
    actual_arrival_at = CASE WHEN p_status = 'en_route' THEN COALESCE(actual_arrival_at, now()) ELSE actual_arrival_at END,
    actual_departure_at = CASE WHEN p_status = 'delivered' THEN COALESCE(actual_departure_at, now()) ELSE actual_departure_at END,
    notes = CASE WHEN p_note IS NULL THEN notes ELSE left(trim(p_note), 500) END,
    updated_at = now()
  WHERE id = v_result.route_stop_id;

  IF p_status = 'en_route' THEN
    UPDATE public.orders
    SET status = 'picked_up',
        picked_up_at = COALESCE(picked_up_at, now()),
        updated_at = now()
    WHERE id = v_order_id
      AND status IN ('ready', 'confirmed', 'preparing');
  ELSIF p_status = 'delivered' THEN
    UPDATE public.orders
    SET status = 'delivered',
        delivered_at = COALESCE(delivered_at, now()),
        updated_at = now()
    WHERE id = v_order_id
      AND status <> 'cancelled';

    IF NOT EXISTS (
      SELECT 1
      FROM public.deliveries d
      WHERE d.driver_id = v_driver_id
        AND d.status IN ('assigned', 'en_route')
    ) THEN
      UPDATE public.drivers
      SET status = 'active',
          updated_at = now()
      WHERE id = v_driver_id;

      UPDATE public.driver_routes
      SET status = 'completed',
          actual_complete_at = COALESCE(actual_complete_at, now()),
          updated_at = now()
      WHERE id = v_route_id
        AND NOT EXISTS (
          SELECT 1
          FROM public.deliveries d
          WHERE d.route_id = v_route_id
            AND d.status IN ('assigned', 'en_route')
        );
    END IF;
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.driver_update_delivery_status(uuid, public.delivery_status, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.driver_update_delivery_status(uuid, public.delivery_status, text) TO authenticated;

CREATE OR REPLACE VIEW public.order_lifecycle_overview
WITH (security_invoker = true)
AS
SELECT
  o.id AS order_id,
  o.user_id,
  o.kitchen_id,
  o.menu_id,
  o.status AS internal_status,
  CASE
    WHEN o.status = 'pending' THEN 'requested'
    WHEN o.status = 'confirmed' THEN 'approved'
    WHEN o.status = 'preparing' THEN 'preparing'
    WHEN o.status IN ('ready', 'picked_up') THEN 'out_for_delivery'
    WHEN o.status = 'delivered' THEN 'delivered'
    WHEN o.status = 'cancelled' THEN 'cancelled'
    ELSE 'requested'
  END AS lifecycle_status,
  o.requested_servings,
  o.delivery_window_start,
  o.delivery_window_end,
  o.created_at,
  o.confirmed_at,
  o.picked_up_at,
  o.delivered_at,
  d.id AS delivery_id,
  d.driver_id,
  d.status AS delivery_status
FROM public.orders o
LEFT JOIN public.deliveries d ON d.order_id = o.id;

CREATE OR REPLACE VIEW public.system_load_dashboard
WITH (security_invoker = true)
AS
SELECT
  k.id AS kitchen_id,
  k.name AS kitchen_name,
  m.id AS menu_id,
  m.menu_date,
  COALESCE(m.max_orders, k.max_daily_orders) AS max_orders,
  COUNT(o.id) FILTER (WHERE o.status IN ('pending', 'confirmed', 'preparing', 'ready', 'picked_up')) AS active_orders,
  COUNT(o.id) FILTER (WHERE o.status = 'delivered') AS delivered_orders,
  (COALESCE(m.max_orders, k.max_daily_orders)
    - COUNT(o.id) FILTER (WHERE o.status IN ('pending', 'confirmed', 'preparing', 'ready', 'picked_up'))
  ) AS remaining_capacity,
  COUNT(d.id) FILTER (WHERE d.status IN ('assigned', 'en_route')) AS active_deliveries
FROM public.kitchens k
JOIN public.menus m
  ON m.kitchen_id = k.id
LEFT JOIN public.orders o
  ON o.kitchen_id = k.id
 AND o.menu_id = m.id
LEFT JOIN public.deliveries d
  ON d.order_id = o.id
WHERE m.menu_date = CURRENT_DATE
GROUP BY k.id, m.id;

ALTER VIEW public.todays_menus SET (security_invoker = true);
ALTER VIEW public.kitchen_order_summary SET (security_invoker = true);
ALTER VIEW public.driver_active_route SET (security_invoker = true);

ALTER FUNCTION public.handle_new_auth_user() SET search_path = public, auth;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public._attach_updated_at(text) SET search_path = public;
ALTER FUNCTION public.check_order_kitchen_matches_menu() SET search_path = public;
ALTER FUNCTION public.log_order_status_change() SET search_path = public, auth;
ALTER FUNCTION public.log_delivery_status_change() SET search_path = public, auth;
ALTER FUNCTION public.reserve_menu_items(uuid) SET search_path = public;
ALTER FUNCTION public.release_menu_items(uuid) SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role text;
  v_staff_role public.staff_role;
BEGIN
  v_role := COALESCE(NEW.raw_app_meta_data->>'role', 'user');

  IF v_role = 'driver' THEN
    INSERT INTO public.drivers (auth_id, full_name, email, phone)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), 'New Driver'),
      NEW.email,
      NULLIF(trim(NEW.raw_user_meta_data->>'phone'), '')
    )
    ON CONFLICT (auth_id)
    DO UPDATE SET
      full_name = COALESCE(NULLIF(trim(EXCLUDED.full_name), ''), public.drivers.full_name),
      email = COALESCE(EXCLUDED.email, public.drivers.email),
      phone = COALESCE(EXCLUDED.phone, public.drivers.phone),
      updated_at = now();

  ELSIF v_role = 'staff' THEN
    v_staff_role := CASE
      WHEN NEW.raw_app_meta_data->>'staff_role' = 'admin' THEN 'admin'::public.staff_role
      WHEN NEW.raw_app_meta_data->>'staff_role' = 'kitchen_manager' THEN 'kitchen_manager'::public.staff_role
      ELSE 'dispatcher'::public.staff_role
    END;

    INSERT INTO public.staff (auth_id, full_name, email, role)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), 'New Staff'),
      NEW.email,
      v_staff_role
    )
    ON CONFLICT (auth_id)
    DO UPDATE SET
      full_name = COALESCE(NULLIF(trim(EXCLUDED.full_name), ''), public.staff.full_name),
      email = COALESCE(EXCLUDED.email, public.staff.email),
      role = EXCLUDED.role,
      updated_at = now();

  ELSE
    INSERT INTO public.users (auth_id, full_name, email)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), 'Community Member'),
      NEW.email
    )
    ON CONFLICT (auth_id)
    DO UPDATE SET
      full_name = COALESCE(NULLIF(trim(EXCLUDED.full_name), ''), public.users.full_name),
      email = COALESCE(EXCLUDED.email, public.users.email),
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_order_status_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_delivery_status_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_user_row_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.upsert_recipient_profile(text, text, text, text, text, text, text, numeric, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.upsert_user_preferences(text[], boolean, boolean, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.request_meal_order(uuid, uuid, jsonb, text, text, text, text, numeric, numeric, integer, text, time, time) FROM anon;
REVOKE EXECUTE ON FUNCTION public.publish_daily_menu(uuid, date, text, timestamptz, integer, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_delivery_batch(uuid, uuid, uuid, integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.driver_update_delivery_status(uuid, public.delivery_status, text) FROM anon;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'rls_auto_enable'
      AND p.pronargs = 0
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated';
  END IF;
END $$;

COMMIT;
