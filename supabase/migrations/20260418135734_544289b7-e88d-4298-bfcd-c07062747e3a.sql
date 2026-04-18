
-- Enums
CREATE TYPE public.expense_type AS ENUM ('subscription', 'one_time', 'scenario');
CREATE TYPE public.expense_currency AS ENUM ('OMR', 'USD');
CREATE TYPE public.expense_status AS ENUM ('active', 'paused', 'cancelled');
CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'quarterly', 'annual', 'one_time');

-- Updated-at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Expenses (shared workspace)
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  vendor TEXT,
  category TEXT NOT NULL,
  type public.expense_type NOT NULL DEFAULT 'subscription',
  currency public.expense_currency NOT NULL DEFAULT 'OMR',
  base_rate NUMERIC(14,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  includes_vat BOOLEAN NOT NULL DEFAULT false,
  billing_cycle public.billing_cycle NOT NULL DEFAULT 'monthly',
  status public.expense_status NOT NULL DEFAULT 'active',
  next_renewal TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_status ON public.expenses(status);
CREATE INDEX idx_expenses_next_renewal ON public.expenses(next_renewal);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view expenses"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert expenses"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update expenses"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete expenses"
  ON public.expenses FOR DELETE
  TO authenticated
  USING (true);

CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-user notification state
CREATE TABLE public.notification_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

CREATE INDEX idx_notif_state_user ON public.notification_state(user_id);

ALTER TABLE public.notification_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification state"
  ON public.notification_state FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification state"
  ON public.notification_state FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification state"
  ON public.notification_state FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification state"
  ON public.notification_state FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_notif_state_updated_at
  BEFORE UPDATE ON public.notification_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
