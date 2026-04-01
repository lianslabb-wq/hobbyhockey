-- Migration 007: Security Advisor fixes
-- Fixes: is_admin() search_path, overly broad "for all" policies,
-- support_clicks RLS, and goalie_directory view

-- ============================================================
-- 1. Fix is_admin() — set search_path to prevent schema hijacking
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'lianslabb@gmail.com'
  );
$$ LANGUAGE sql SECURITY DEFINER
SET search_path = '';

-- ============================================================
-- 2. Fix support_clicks — ensure RLS is enabled
-- ============================================================
ALTER TABLE public.support_clicks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Replace "for all" policies with specific per-operation policies
--    Fixes "RLS Policy Always True" warnings on favorites,
--    requests, responses, and sessions
-- ============================================================

-- --- sessions ---
DROP POLICY IF EXISTS "Team owners manage sessions" ON public.sessions;

CREATE POLICY "Team owners insert sessions" ON public.sessions
  FOR INSERT WITH CHECK (
    team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Team owners update sessions" ON public.sessions
  FOR UPDATE USING (
    team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  ) WITH CHECK (
    team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Team owners delete sessions" ON public.sessions
  FOR DELETE USING (
    team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

-- --- favorites ---
DROP POLICY IF EXISTS "Team owners manage favorites" ON public.favorites;

CREATE POLICY "Team owners insert favorites" ON public.favorites
  FOR INSERT WITH CHECK (
    team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Team owners select favorites" ON public.favorites
  FOR SELECT USING (
    team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Team owners delete favorites" ON public.favorites
  FOR DELETE USING (
    team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

-- --- requests ---
DROP POLICY IF EXISTS "Team owners manage requests" ON public.requests;

CREATE POLICY "Team owners insert requests" ON public.requests
  FOR INSERT WITH CHECK (
    team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Team owners update requests" ON public.requests
  FOR UPDATE USING (
    team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  ) WITH CHECK (
    team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Team owners delete requests" ON public.requests
  FOR DELETE USING (
    team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

-- --- responses ---
DROP POLICY IF EXISTS "Goalies manage own responses" ON public.responses;

CREATE POLICY "Goalies insert own responses" ON public.responses
  FOR INSERT WITH CHECK (
    goalie_id IN (SELECT id FROM public.goalies WHERE user_id = auth.uid())
  );

CREATE POLICY "Goalies update own responses" ON public.responses
  FOR UPDATE USING (
    goalie_id IN (SELECT id FROM public.goalies WHERE user_id = auth.uid())
  ) WITH CHECK (
    goalie_id IN (SELECT id FROM public.goalies WHERE user_id = auth.uid())
  );

CREATE POLICY "Goalies delete own responses" ON public.responses
  FOR DELETE USING (
    goalie_id IN (SELECT id FROM public.goalies WHERE user_id = auth.uid())
  );

-- ============================================================
-- 4. NOTE: "Leaked Password Protection Disabled" warning
--    Fix manually in Supabase Dashboard:
--    Authentication → Settings → Enable Leaked Password Protection
-- ============================================================

-- ============================================================
-- 5. NOTE: goalie_directory uses security_invoker = false by design.
--    This is intentional — the view restricts columns (name, location,
--    available) while preventing access to sensitive fields (email, phone).
--    Switching to security_invoker = true would require opening the
--    entire goalies table to authenticated users, which is LESS secure.
--    Accept this warning consciously.
-- ============================================================
