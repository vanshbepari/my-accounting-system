-- =============================================================================
-- SUPABASE SECURE ACCOUNT DELETION SQL SCRIPT
-- =============================================================================
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- to enable database-level RPC account purging and ensure strict CASCADE cleanup.

-- 1. Create a secure RPC function to delete a user's entire data footprint across all tables
CREATE OR REPLACE FUNCTION public.delete_user_account_data(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all linked expense items
  DELETE FROM public.expense_items WHERE user_id = target_user_id;
  
  -- Delete all daily entry records
  DELETE FROM public.daily_entries WHERE user_id = target_user_id;
  
  -- Delete all category budget floors
  DELETE FROM public.budgets WHERE user_id = target_user_id;
  
  -- Delete all financial target goals
  DELETE FROM public.targeting WHERE user_id = target_user_id;
  
  -- Delete all forecasting settings
  DELETE FROM public.forecasting WHERE user_id = target_user_id;
  
  -- Delete all user notifications
  DELETE FROM public.notifications WHERE user_id = target_user_id;
  
  -- Delete workspace settings and starting balances
  DELETE FROM public.user_settings WHERE user_id = target_user_id;
  
  -- Delete user record from Supabase Auth system (if running with service role or admin privileges)
  BEGIN
    DELETE FROM auth.users WHERE id = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not delete from auth.users directly via RPC: %', SQLERRM;
  END;
END;
$$;

-- Grant execution privileges to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account_data(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account_data(UUID) TO service_role;
