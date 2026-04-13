-- ============================================================
-- Migration: Fix clients whose ended_at is in the past but
--            status is still 'active'. Those clients should
--            be 'archived' (displayed as "inactive" in the UI).
-- ============================================================

UPDATE public.clients
SET status = 'archived'
WHERE ended_at IS NOT NULL
  AND ended_at <= CURRENT_DATE
  AND status = 'active';
