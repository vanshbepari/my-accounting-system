-- =============================================================================
-- SUPABASE SECURE ACCOUNT & AUTH DELETION SQL SCRIPT
-- =============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
--
-- This script creates a SECURITY DEFINER RPC function that allows an authenticated
-- user to delete their own account from auth.users AND wipe all historical records
-- across all database tables synchronously.

-- 1. Main RPC function invoked by the client app
CREATE OR REPLACE FUNCTION public.delete_own_user_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Extract authenticated user's UUID from JWT token
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated. Cannot perform account deletion.';
  END IF;

  -- Step A: Delete all user records from application tables
  DELETE FROM public.expense_items WHERE user_id = current_user_id;
  DELETE FROM public.daily_entries WHERE user_id = current_user_id;
  DELETE FROM public.budgets WHERE user_id = current_user_id;
  DELETE FROM public.targeting WHERE user_id = current_user_id;
  DELETE FROM public.forecasting WHERE user_id = current_user_id;
  DELETE FROM public.notifications WHERE user_id = current_user_id;
  DELETE FROM public.user_settings WHERE user_id = current_user_id;

  -- Step B: Delete user record from auth.users
  -- This completely decouples the email address from Supabase Auth so the user
  -- can register again as a completely new client in the future.
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- 2. Admin/Helper RPC function accepting a target user UUID
CREATE OR REPLACE FUNCTION public.delete_user_account_data(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM public.expense_items WHERE user_id = target_user_id;
  DELETE FROM public.daily_entries WHERE user_id = target_user_id;
  DELETE FROM public.budgets WHERE user_id = target_user_id;
  DELETE FROM public.targeting WHERE user_id = target_user_id;
  DELETE FROM public.forecasting WHERE user_id = target_user_id;
  DELETE FROM public.notifications WHERE user_id = target_user_id;
  DELETE FROM public.user_settings WHERE user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- 3. Grant execution permissions
GRANT EXECUTE ON FUNCTION public.delete_own_user_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account_data(UUID) TO service_role;
