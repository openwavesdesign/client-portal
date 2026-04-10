-- ============================================================
-- Migration 002: RLS policies, helper functions, auth trigger
-- ============================================================

-- ============================================================
-- Helper functions (SECURITY DEFINER to avoid recursion)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_client_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT client_id FROM public.users WHERE id = auth.uid()
$$;

-- ============================================================
-- Atomic rate update procedure
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_client_rate(
  p_client_id uuid,
  p_new_rate decimal,
  p_effective_from date DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Close previous active rate
  UPDATE public.rate_history
  SET effective_to = p_effective_from - INTERVAL '1 day'
  WHERE client_id = p_client_id AND effective_to IS NULL;

  -- Insert new rate record
  INSERT INTO public.rate_history (client_id, rate, effective_from)
  VALUES (p_client_id, p_new_rate, p_effective_from);

  -- Update current rate on client record
  UPDATE public.clients
  SET hourly_rate = p_new_rate
  WHERE id = p_client_id;
END;
$$;

-- ============================================================
-- Auth trigger: auto-populate public.users on signup/invite
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, client_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'client'),
    (new.raw_user_meta_data->>'client_id')::uuid
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- Enable RLS on all tables
-- ============================================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- clients policies
-- ============================================================

DROP POLICY IF EXISTS "admin_all_clients" ON public.clients;
CREATE POLICY "admin_all_clients" ON public.clients
  FOR ALL USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "client_read_own_client" ON public.clients;
CREATE POLICY "client_read_own_client" ON public.clients
  FOR SELECT USING (id = public.get_my_client_id());

-- ============================================================
-- users policies
-- ============================================================

DROP POLICY IF EXISTS "admin_all_users" ON public.users;
CREATE POLICY "admin_all_users" ON public.users
  FOR ALL USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "client_read_self" ON public.users;
CREATE POLICY "client_read_self" ON public.users
  FOR SELECT USING (id = auth.uid());

-- ============================================================
-- projects policies
-- ============================================================

DROP POLICY IF EXISTS "admin_all_projects" ON public.projects;
CREATE POLICY "admin_all_projects" ON public.projects
  FOR ALL USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "client_read_own_projects" ON public.projects;
CREATE POLICY "client_read_own_projects" ON public.projects
  FOR SELECT USING (client_id = public.get_my_client_id());

-- ============================================================
-- time_entries policies
-- ============================================================

DROP POLICY IF EXISTS "admin_all_time_entries" ON public.time_entries;
CREATE POLICY "admin_all_time_entries" ON public.time_entries
  FOR ALL USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "client_read_own_time_entries" ON public.time_entries;
CREATE POLICY "client_read_own_time_entries" ON public.time_entries
  FOR SELECT USING (client_id = public.get_my_client_id());

-- ============================================================
-- billing_records policies
-- ============================================================

DROP POLICY IF EXISTS "admin_all_billing" ON public.billing_records;
CREATE POLICY "admin_all_billing" ON public.billing_records
  FOR ALL USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "client_read_own_billing" ON public.billing_records;
CREATE POLICY "client_read_own_billing" ON public.billing_records
  FOR SELECT USING (client_id = public.get_my_client_id());

-- ============================================================
-- rate_history policies (admin only)
-- ============================================================

DROP POLICY IF EXISTS "admin_all_rates" ON public.rate_history;
CREATE POLICY "admin_all_rates" ON public.rate_history
  FOR ALL USING (public.get_my_role() = 'admin');
