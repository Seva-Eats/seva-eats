-- Temporary manual control layer for Seva Eats operations.
-- Applied migration: backend_temp_manual_control_layer

-- Adds:
-- 1) menu scheduling fields (prep/delivery windows, per-user daily limit)
-- 2) ops schema tables for runtime controls and kitchen daily overrides
-- 3) auto-assignment RPC (nearest kitchen with capacity)
-- 4) request capacity + fairness checks using overrides

-- Note:
-- This file documents the SQL already applied via MCP migration.
-- Source of truth in Supabase migration history:
--   backend_temp_manual_control_layer
