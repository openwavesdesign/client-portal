-- ============================================================
-- Migration: Update client_ytd_summary view to derive status
--            dynamically from ended_at vs CURRENT_DATE.
--
-- A client is shown as 'archived' (inactive) if:
--   - their status column is 'archived' (manually set), OR
--   - their ended_at date has passed (even if status = 'active')
--
-- This means the dashboard always reflects the correct status
-- without requiring a manual database update when a date passes.
-- ============================================================

CREATE OR REPLACE VIEW public.client_ytd_summary AS
SELECT
  c.id,
  c.name,
  CASE
    WHEN c.status = 'archived' THEN 'archived'
    WHEN c.ended_at IS NOT NULL AND c.ended_at <= CURRENT_DATE THEN 'archived'
    ELSE 'active'
  END AS status,
  c.started_at,
  c.ended_at,
  c.hourly_rate,
  COUNT(DISTINCT p.id)::int AS project_count,
  COALESCE(
    SUM(te.hours) FILTER (
      WHERE EXTRACT(YEAR FROM te.date) = EXTRACT(YEAR FROM CURRENT_DATE)
    ), 0
  ) AS ytd_hours,
  COALESCE(
    SUM(te.hours * c.hourly_rate) FILTER (
      WHERE EXTRACT(YEAR FROM te.date) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND te.billable = true
    ), 0
  ) AS ytd_revenue
FROM public.clients c
LEFT JOIN public.projects p ON p.client_id = c.id AND p.status = 'active'
LEFT JOIN public.time_entries te ON te.client_id = c.id
GROUP BY c.id;
