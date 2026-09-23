ALTER POLICY "own motorcycles" ON public.motorcycles
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

ALTER POLICY "own incomes" ON public.incomes
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

ALTER POLICY "own expenses" ON public.expenses
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

ALTER POLICY "own fuel" ON public.fuel_records
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

ALTER POLICY "own maintenance" ON public.maintenance_records
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

ALTER POLICY "own goals" ON public.goals
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

ALTER POLICY "own documents" ON public.documents
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

ALTER POLICY "own notifications" ON public.notifications
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