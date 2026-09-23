ALTER POLICY "own sessions" ON public.work_sessions
USING (
  auth.uid() = user_id
  AND (
    public.has_active_subscription(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND (
    public.has_active_subscription(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);