-- Seva Eats baseline schema (PostgreSQL 14+)
-- Provider-agnostic foundation for recipient + separate driver apps.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('recipient', 'driver', 'admin');
CREATE TYPE auth_provider AS ENUM ('google', 'apple', 'email');
CREATE TYPE request_status AS ENUM (
  'pending',
  'matched',
  'picked_up',
  'on_the_way',
  'delivered',
  'cancelled'
);
CREATE TYPE location_type AS ENUM ('hub', 'dropoff');
CREATE TYPE platform_type AS ENUM ('ios', 'android', 'web');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL DEFAULT 'recipient',
  display_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_unique_idx ON users (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX users_phone_unique_idx ON users (phone) WHERE phone IS NOT NULL;

CREATE TABLE identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider auth_provider NOT NULL,
  provider_subject TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subject)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  device_label TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type location_type NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX locations_type_idx ON locations (type);

CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  pickup_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  delivery_address TEXT NOT NULL,
  delivery_latitude DOUBLE PRECISION NOT NULL,
  delivery_longitude DOUBLE PRECISION NOT NULL,
  serving_size INTEGER NOT NULL CHECK (serving_size >= 1 AND serving_size <= 10),
  dietary_restrictions TEXT[] NOT NULL DEFAULT '{}',
  driver_note TEXT NOT NULL DEFAULT '',
  status request_status NOT NULL DEFAULT 'pending',
  estimated_delivery_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX requests_recipient_idx ON requests (recipient_user_id, created_at DESC);
CREATE INDEX requests_status_idx ON requests (status, created_at DESC);

CREATE TABLE driver_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  driver_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  unassigned_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX driver_assignments_active_unique_idx
  ON driver_assignments (request_id)
  WHERE active = true;

CREATE INDEX driver_assignments_driver_idx ON driver_assignments (driver_user_id, assigned_at DESC);

CREATE TABLE request_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  status request_status NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX request_status_history_request_idx
  ON request_status_history (request_id, created_at DESC);

CREATE TABLE driver_location_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy_meters DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed_mps DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX driver_location_pings_driver_recorded_idx
  ON driver_location_pings (driver_user_id, recorded_at DESC);
CREATE INDEX driver_location_pings_request_recorded_idx
  ON driver_location_pings (request_id, recorded_at DESC);

CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  UNIQUE (token)
);

CREATE INDEX push_tokens_user_idx ON push_tokens (user_id);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ
);

CREATE INDEX notifications_user_sent_idx ON notifications (user_id, sent_at DESC);

-- Server-side transition guard for request lifecycle.
CREATE OR REPLACE FUNCTION enforce_request_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status IN ('matched', 'cancelled') THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'matched' AND NEW.status IN ('picked_up', 'cancelled') THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'picked_up' AND NEW.status = 'on_the_way' THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'on_the_way' AND NEW.status = 'delivered' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Invalid request status transition: % -> %', OLD.status, NEW.status;
END;
$$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER requests_set_updated_at
BEFORE UPDATE ON requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER requests_transition_guard
BEFORE UPDATE OF status ON requests
FOR EACH ROW
EXECUTE FUNCTION enforce_request_transition();

COMMIT;
