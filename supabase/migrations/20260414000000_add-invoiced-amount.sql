-- ============================================================
-- Migration: Add invoiced_amount to projects table
--            Update project_actuals and client_ytd_summary views
-- ============================================================

-- Add invoiced_amount column to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS invoiced_amount decimal(10,2) DEFAULT 0;

-- Update project_actuals view to expose invoiced_amount
CREATE OR REPLACE VIEW public.project_actuals AS
SELECT
  p.id,
  p.client_id,
  c.name AS client_name,
  p.name,
  p.quoted_cost,
  p.invoiced_amount,
  p.projected_hours,
  p.projected_rate,
  p.status,
  p.created_at,
  COALESCE(SUM(te.hours), 0) AS actual_hours,
  CASE
    WHEN COALESCE(SUM(te.hours), 0) > 0
    THEN p.quoted_cost / SUM(te.hours)
    ELSE 0
  END AS actual_rate
FROM public.projects p
JOIN public.clients c ON c.id = p.client_id
LEFT JOIN public.time_entries te ON te.project_id = p.id
GROUP BY p.id, c.name;

-- Update client_ytd_summary view:
--   ytd_revenue now includes invoiced project amounts
--   outstanding_balance = open project remainders + unpaid monthly billing
CREATE OR REPLACE VIEW public.client_ytd_summary AS
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
  COALESCE(ps.project_count, 0) AS project_count,
  COALESCE(ts.ytd_hours, 0) AS ytd_hours,
  COALESCE(ts.ytd_billable_hours, 0) * c.hourly_rate
    + COALESCE(ps.total_invoiced, 0) AS ytd_revenue,
  COALESCE(ps.project_remainder, 0)
    + COALESCE(bs.unpaid_billing, 0) AS outstanding_balance
FROM public.clients c
LEFT JOIN project_stats ps ON ps.client_id = c.id
LEFT JOIN billing_stats bs ON bs.client_id = c.id
LEFT JOIN time_stats ts ON ts.client_id = c.id;
