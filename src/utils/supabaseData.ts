/**
 * supabaseData.ts
 *
 * All Supabase database operations for Aura Accounting.
 * Every query is scoped to the authenticated user_id — RLS enforces this
 * at the database level as a second layer of security.
 */

import { supabase } from "./supabaseClient";
import type { Transaction, ExpenseItem } from "@/context/AccountingContext";

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all daily entries + their expense items for the given user.
 * RLS on Supabase guarantees no other user's rows are ever returned.
 */
export async function fetchUserTransactions(userId: string): Promise<Transaction[]> {
  const { data: entries, error } = await supabase
    .from("daily_entries")
    .select(`
      id,
      date,
      title,
      category,
      online_amount,
      cash_amount,
      expenses_amount,
      notes,
      expense_items ( id, title, amount )
    `)
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    console.error("[fetchUserTransactions] error:", error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (entries ?? []).map((row: any) => ({
    id: row.id,
    date: row.date,
    title: row.title,
    category: row.category,
    onlineAmount: Number(row.online_amount),
    cashAmount: Number(row.cash_amount),
    expensesAmount: Number(row.expenses_amount),
    notes: row.notes ?? "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expenses: (row.expense_items ?? []).map((e: any) => ({
      id: e.id,
      title: e.title,
      amount: Number(e.amount),
    })),
  }));
}

/**
 * Upsert (create or update) a daily entry for a user.
 * Uses the UNIQUE(user_id, date) constraint for conflict resolution.
 * Replaces expense_items for that entry on each save.
 */
export async function upsertDailyEntry(
  userId: string,
  record: Omit<Transaction, "id">
): Promise<Transaction | null> {
  const totalExpenses = record.expenses.reduce((sum, e) => sum + e.amount, 0);

  // 1. Upsert the main daily entry row
  const { data: entryData, error: entryError } = await supabase
    .from("daily_entries")
    .upsert(
      {
        user_id: userId,
        date: record.date,
        title: record.title,
        category: record.category,
        online_amount: record.onlineAmount,
        cash_amount: record.cashAmount,
        expenses_amount: totalExpenses,
        notes: record.notes ?? "",
      },
      { onConflict: "user_id,date" }
    )
    .select("id")
    .single();

  if (entryError || !entryData) {
    console.error("[upsertDailyEntry] entry error:", entryError?.message);
    return null;
  }

  const entryId = entryData.id;

  // 2. Delete old expense_items for this entry, then re-insert fresh ones
  await supabase
    .from("expense_items")
    .delete()
    .eq("entry_id", entryId)
    .eq("user_id", userId);

  if (record.expenses.length > 0) {
    const expenseRows = record.expenses.map((e) => ({
      user_id: userId,
      entry_id: entryId,
      title: e.title,
      amount: e.amount,
    }));

    const { error: expError } = await supabase
      .from("expense_items")
      .insert(expenseRows);

    if (expError) {
      console.error("[upsertDailyEntry] expense_items error:", expError.message);
    }
  }

  return {
    id: entryId,
    date: record.date,
    title: record.title,
    category: record.category,
    onlineAmount: record.onlineAmount,
    cashAmount: record.cashAmount,
    expensesAmount: totalExpenses,
    notes: record.notes,
    expenses: record.expenses,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// USER SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

export interface UserSettings {
  businessName: string;
  currencyCode: string;
  currencySymbol: string;
  ownerName?: string;
  startingBalance?: number;
}

/**
 * Fetch business name and currency settings for a user. Returns defaults if not yet set.
 */
export async function fetchUserSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("business_name, currency_code, currency_symbol, owner_name, starting_balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[fetchUserSettings] error:", error.message);
  }

  return {
    businessName: data?.business_name ?? "My Retail Shop",
    currencyCode: data?.currency_code ?? "INR",
    currencySymbol: data?.currency_symbol ?? "₹",
    ownerName: data?.owner_name ?? undefined,
    startingBalance: data?.starting_balance ? Number(data.starting_balance) : 15000,
  };
}

/**
 * Save / update the user's business settings in Supabase.
 */
export async function saveUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  const updateData: {
    user_id: string;
    business_name?: string;
    currency_code?: string;
    currency_symbol?: string;
    owner_name?: string;
    starting_balance?: number;
  } = { user_id: userId };
  if (settings.businessName !== undefined) updateData.business_name = settings.businessName;
  if (settings.currencyCode !== undefined) updateData.currency_code = settings.currencyCode;
  if (settings.currencySymbol !== undefined) updateData.currency_symbol = settings.currencySymbol;
  if (settings.ownerName !== undefined) updateData.owner_name = settings.ownerName;
  if (settings.startingBalance !== undefined) updateData.starting_balance = settings.startingBalance;

  const { error } = await supabase
    .from("user_settings")
    .upsert(updateData, { onConflict: "user_id" });

  if (error) {
    console.error("[saveUserSettings] error:", error.message);
  }
}
