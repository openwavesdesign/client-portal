-- ============================================================
-- Migration: Include maintenance plan yearly amounts in
--            client_ytd_summary ytd_revenue + expose as
--            maintenance_ytd column for per-client display.
-- ============================================================

DROP VIEW IF EXISTS public.client_ytd_summary;
CREATE VIEW public.client_ytd_summary AS
WITH project_stats AS (
  SELECT
    client_id,
    COUNT(*) FILTER (WHERE status = 'active')::int AS project_count,
    COALESCE(SUM(invoiced_amount), 0) AS total_invoiced,
    COALESCE(
      SUM(GREATEST(COALESCE(quoted_cost, 0) - COALESCE(invoiced_amount, 0), 0))
      FILTER (WHERE status = 'active'),
    0) AS project_remainder
  FROM public.projects
  GROUP BY client_id
),
billing_stats AS (
  SELECT
    br.client_id,
    COALESCE(SUM(COALESCE(mh.billable_hours, 0) * c.hourly_rate), 0) AS unpaid_billing
  FROM public.billing_records br
  JOIN public.clients c ON c.id = br.client_id
  LEFT JOIN (
    SELECT
      client_id,
      date_trunc('month', date)::date AS month,
      SUM(hours) FILTER (WHERE billable = true) AS billable_hours
    FROM public.time_entries
    GROUP BY client_id, date_trunc('month', date)::date
  ) mh ON mh.client_id = br.client_id AND mh.month = br.month
  WHERE br.invoiced = true AND br.paid = false
  GROUP BY br.client_id
),
time_stats AS (
  SELECT
    client_id,
    COALESCE(SUM(hours) FILTER (
      WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
    ), 0) AS ytd_hours,
    COALESCE(SUM(hours) FILTER (
      WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND billable = true
    ), 0) AS ytd_billable_hours
  FROM public.time_entries
  GROUP BY client_id
)
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
  c.on_maintenance_plan,
  c.maintenance_rate,
  COALESCE(ps.project_count, 0) AS project_count,
  COALESCE(ts.ytd_hours, 0) AS ytd_hours,
  -- Maintenance plan annual amount (0 for clients not on a plan)
  CASE WHEN c.on_maintenance_plan THEN c.maintenance_rate ELSE 0 END AS maintenance_ytd,
  -- YTD revenue includes hourly billing + project invoiced amounts + maintenance plan amount
  COALESCE(ts.ytd_billable_hours, 0) * c.hourly_rate
    + COALESCE(ps.total_invoiced, 0)
    + CASE WHEN c.on_maintenance_plan THEN c.maintenance_rate ELSE 0 END AS ytd_revenue,
  COALESCE(ps.project_remainder, 0)
    + COALESCE(bs.unpaid_billing, 0) AS outstanding_balance
FROM public.clients c
LEFT JOIN project_stats ps ON ps.client_id = c.id
LEFT JOIN billing_stats bs ON bs.client_id = c.id
LEFT JOIN time_stats ts ON ts.client_id = c.id;
