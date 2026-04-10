-- ============================================================
-- Migration 004: Backfill public.users for any auth.users rows
--                that were created before the handle_new_user
--                trigger existed.
--
-- Safe to re-run (ON CONFLICT DO NOTHING).
--
-- After running this, manually set the role for your admin:
--
--   UPDATE public.users SET role = 'admin'
--   WHERE email = 'your-admin@example.com';
-- ============================================================

INSERT INTO public.users (id, email, role)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'client') AS role
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;
