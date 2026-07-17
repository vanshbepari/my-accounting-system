-- ─────────────────────────────────────────────────────────────────────────────
-- SUPABASE SCHEMA MIGRATION: public.forecasting & public.targeting
-- ─────────────────────────────────────────────────────────────────────────────
--
-- This script creates two separate, independent tables to store user-specific 
-- forecasting options and targeting milestones.
--
-- Instructions:
-- 1. Open your Supabase Dashboard (https://supabase.com).
-- 2. Go to the SQL Editor in the left sidebar.
-- 3. Click "New Query".
-- 4. Paste this entire script into the editor.
-- 5. Click "Run".
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create the forecasting table
CREATE TABLE IF NOT EXISTS public.forecasting (
  user_id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  growth_rate INTEGER NOT NULL DEFAULT 10,
  savings_rate INTEGER NOT NULL DEFAULT 15,
  horizon INTEGER NOT NULL DEFAULT 3,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for forecasting
ALTER TABLE public.forecasting ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for forecasting
CREATE POLICY "Users can view their own forecasting" 
  ON public.forecasting FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own forecasting" 
  ON public.forecasting FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forecasting" 
  ON public.forecasting FOR UPDATE 
  USING (auth.uid() = user_id);

-- 2. Create the targeting table
CREATE TABLE IF NOT EXISTS public.targeting (
  user_id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  revenue_target NUMERIC NOT NULL DEFAULT 50000,
  net_profit_target NUMERIC NOT NULL DEFAULT 20000,
  expense_ceiling NUMERIC NOT NULL DEFAULT 15000,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for targeting
ALTER TABLE public.targeting ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for targeting
CREATE POLICY "Users can view their own targeting" 
  ON public.targeting FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own targeting" 
  ON public.targeting FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own targeting" 
  ON public.targeting FOR UPDATE 
  USING (auth.uid() = user_id);

-- 4. Grant access privileges to Supabase API roles
GRANT ALL ON TABLE public.forecasting TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.targeting TO anon, authenticated, service_role;

-- 5. Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  category VARCHAR NOT NULL,
  limit_amount NUMERIC NOT NULL,
  month VARCHAR NOT NULL, -- YYYY-MM
  is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, category, month)
);

-- Enable RLS for budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for budgets
CREATE POLICY "Users can view their own budgets"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON public.budgets FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title VARCHAR NOT NULL,
  message VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- success, warning, info, danger
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Grant privileges
GRANT ALL ON TABLE public.budgets TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.notifications TO anon, authenticated, service_role;

-- 7. Ensure RLS policies for daily_entries are fully set up
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily_entries"
  ON public.daily_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily_entries"
  ON public.daily_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily_entries"
  ON public.daily_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily_entries"
  ON public.daily_entries FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Ensure RLS policies for expense_items are fully set up (including DELETE!)
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expense_items"
  ON public.expense_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expense_items"
  ON public.expense_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense_items"
  ON public.expense_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense_items"
  ON public.expense_items FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON TABLE public.daily_entries TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.expense_items TO anon, authenticated, service_role;

-- 9. Alter user_settings table to support onboarding process
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS mobile_number VARCHAR;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS country VARCHAR;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT FALSE;



