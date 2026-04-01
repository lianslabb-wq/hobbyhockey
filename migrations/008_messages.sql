-- Migration 008: Messages between teams and goalies on confirmed matches

CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Only participants in the match can read messages
CREATE POLICY "Match participants read messages" ON public.messages
  FOR SELECT USING (
    request_id IN (
      -- Team owner's requests
      SELECT r.id FROM public.requests r
      JOIN public.teams t ON t.id = r.team_id
      WHERE t.user_id = auth.uid()
    )
    OR
    request_id IN (
      -- Goalie who responded yes
      SELECT resp.request_id FROM public.responses resp
      JOIN public.goalies g ON g.id = resp.goalie_id
      WHERE g.user_id = auth.uid() AND resp.answer = 'yes'
    )
  );

-- Only participants can send messages
CREATE POLICY "Match participants send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND (
      request_id IN (
        SELECT r.id FROM public.requests r
        JOIN public.teams t ON t.id = r.team_id
        WHERE t.user_id = auth.uid()
      )
      OR
      request_id IN (
        SELECT resp.request_id FROM public.responses resp
        JOIN public.goalies g ON g.id = resp.goalie_id
        WHERE g.user_id = auth.uid() AND resp.answer = 'yes'
      )
    )
  );

-- Admin can read all
CREATE POLICY "Admin read messages" ON public.messages
  FOR SELECT USING (public.is_admin());
