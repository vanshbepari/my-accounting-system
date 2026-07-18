-- ============================================================================
-- SUPABASE DEFINITIVE ACCOUNT DELETION & CASCADING PURGE SCRIPT
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================================================

-- 1. ADD CASCADING FOREIGN KEY CONSTRAINTS TO ALL PUBLIC SCHEMAS
ALTER TABLE IF EXISTS public.user_settings
  DROP CONSTRAINT IF EXISTS fk_user_settings_user,
  ADD CONSTRAINT fk_user_settings_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.daily_entries
  DROP CONSTRAINT IF EXISTS fk_daily_entries_user,
  ADD CONSTRAINT fk_daily_entries_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.expense_items
  DROP CONSTRAINT IF EXISTS fk_expense_items_entry,
  ADD CONSTRAINT fk_expense_items_entry
    FOREIGN KEY (entry_id) REFERENCES public.daily_entries(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS fk_expense_items_user,
  ADD CONSTRAINT fk_expense_items_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.budgets
  DROP CONSTRAINT IF EXISTS fk_budgets_user,
  ADD CONSTRAINT fk_budgets_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.targeting
  DROP CONSTRAINT IF EXISTS fk_targeting_user,
  ADD CONSTRAINT fk_targeting_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.forecasting
  DROP CONSTRAINT IF EXISTS fk_forecasting_user,
  ADD CONSTRAINT fk_forecasting_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.notifications
  DROP CONSTRAINT IF EXISTS fk_notifications_user,
  ADD CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. SECURE CASCADING DELETION RPC FUNCTION (delete_user_account)
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage, auth
AS $$
DECLARE
  target_user_id UUID := auth.uid();
BEGIN
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated. Only an active user can trigger self-account deletion.';
  END IF;

  -- A. Delete all user uploaded files from storage.objects
  DELETE FROM storage.objects 
  WHERE owner = target_user_id 
     OR (path_tokens[1] = target_user_id::text);

  -- B. Delete all records from public schema tables
  DELETE FROM public.expense_items WHERE user_id = target_user_id;
  DELETE FROM public.daily_entries WHERE user_id = target_user_id;
  DELETE FROM public.budgets WHERE user_id = target_user_id;
  DELETE FROM public.targeting WHERE user_id = target_user_id;
  DELETE FROM public.forecasting WHERE user_id = target_user_id;
  DELETE FROM public.notifications WHERE user_id = target_user_id;
  DELETE FROM public.user_settings WHERE user_id = target_user_id;

  -- C. Delete user record from auth.users (triggers cascading FK delete)
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during account deletion: %', SQLERRM;
    RETURN false;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
