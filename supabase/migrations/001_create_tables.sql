-- ============================================================
-- Migration 001: Create all tables
-- ============================================================

-- clients
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  started_at date,
  ended_at date,
  status text CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  hourly_rate decimal(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- projects
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  quoted_cost decimal(10,2),
  projected_hours decimal(6,2),
  projected_rate decimal(10,2),
  status text CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- time_entries
CREATE TABLE IF NOT EXISTS public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  date date NOT NULL,
  description text NOT NULL,
  hours decimal(5,2) NOT NULL,
  billable boolean DEFAULT false,
  category text CHECK (category IN ('Project Work', 'Hourly Work', 'Admin', 'Account Management', 'Prospecting')),
  created_at timestamptz DEFAULT now()
);

-- billing_records
CREATE TABLE IF NOT EXISTS public.billing_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  month date NOT NULL,  -- always first day of month: e.g. 2026-01-01
  invoice_number text,
  so_number text,
  invoiced boolean DEFAULT false,
  paid boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, month)
);

-- rate_history
CREATE TABLE IF NOT EXISTS public.rate_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  rate decimal(10,2) NOT NULL,
  effective_from date NOT NULL,
  effective_to date  -- NULL means currently active
);

-- ============================================================
-- Views
-- ============================================================

-- Dashboard: YTD summary per client
CREATE OR REPLACE VIEW public.client_ytd_summary AS
SELECT
  c.id,
  c.name,
  c.status,
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

-- Projects: actuals computed from time_entries
CREATE OR REPLACE VIEW public.project_actuals AS
SELECT
  p.id,
  p.client_id,
  c.name AS client_name,
  p.name,
  p.quoted_cost,
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
