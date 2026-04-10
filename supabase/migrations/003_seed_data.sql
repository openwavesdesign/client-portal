-- ============================================================
-- Migration 003: Seed initial client data
-- ============================================================
-- Run AFTER tables and RLS are in place.
-- Uses INSERT ... ON CONFLICT DO NOTHING so it's safe to re-run.

-- Insert seed clients
INSERT INTO public.clients (name, hourly_rate, status, started_at)
VALUES
  ('After the Stork',                  100.00, 'active', '2024-01-01'),
  ('Business Development University',  100.00, 'active', '2024-01-01'),
  ('Dan Tremblay Music',                25.00, 'active', '2024-01-01'),
  ('Jo''s Desserts',                    25.00, 'active', '2024-01-01'),
  ('Simplify Your Space',              150.00, 'active', '2024-01-01'),
  ('Open Waves Design',                  0.00, 'active', '2024-01-01')
ON CONFLICT DO NOTHING;

-- Insert initial rate_history records for each client
-- (effective_to = NULL means currently active)
INSERT INTO public.rate_history (client_id, rate, effective_from)
SELECT id, hourly_rate, '2024-01-01'::date
FROM public.clients
WHERE name IN (
  'After the Stork',
  'Business Development University',
  'Dan Tremblay Music',
  'Jo''s Desserts',
  'Simplify Your Space',
  'Open Waves Design'
)
AND NOT EXISTS (
  SELECT 1 FROM public.rate_history rh WHERE rh.client_id = clients.id
);
