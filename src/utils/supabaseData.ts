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
  const { error: deleteError } = await supabase
    .from("expense_items")
    .delete()
    .eq("entry_id", entryId)
    .eq("user_id", userId);

  if (deleteError) {
    console.error("[upsertDailyEntry] delete expense_items error:", deleteError.message);
  }

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
  mobileNumber?: string;
  country?: string;
  onboarded?: boolean;
}

/**
 * Fetch business name and currency settings for a user. Returns defaults if not yet set.
 */
export async function fetchUserSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("business_name, currency_code, currency_symbol, owner_name, starting_balance, mobile_number, country, onboarded")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[fetchUserSettings] error:", error.message);
  }

  return {
    businessName: data?.business_name ?? "",
    currencyCode: data?.currency_code ?? "INR",
    currencySymbol: data?.currency_symbol ?? "₹",
    ownerName: data?.owner_name ?? undefined,
    startingBalance: data?.starting_balance != null ? Number(data.starting_balance) : 0,
    mobileNumber: data?.mobile_number ?? undefined,
    country: data?.country ?? undefined,
    onboarded: data?.onboarded ?? false,
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
    mobile_number?: string;
    country?: string;
    onboarded?: boolean;
  } = { user_id: userId };
  if (settings.businessName !== undefined) updateData.business_name = settings.businessName;
  if (settings.currencyCode !== undefined) updateData.currency_code = settings.currencyCode;
  if (settings.currencySymbol !== undefined) updateData.currency_symbol = settings.currencySymbol;
  if (settings.ownerName !== undefined) updateData.owner_name = settings.ownerName;
  if (settings.startingBalance !== undefined) updateData.starting_balance = settings.startingBalance;
  if (settings.mobileNumber !== undefined) updateData.mobile_number = settings.mobileNumber;
  if (settings.country !== undefined) updateData.country = settings.country;
  if (settings.onboarded !== undefined) updateData.onboarded = settings.onboarded;

  const { error } = await supabase
    .from("user_settings")
    .upsert(updateData, { onConflict: "user_id" });

  if (error) {
    console.error("[saveUserSettings] error:", error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BUDGETS & NOTIFICATIONS (BACKEND PERSISTENCE)
// ─────────────────────────────────────────────────────────────────────────────

// Helper to identify if a table is not yet migrated to the user's Supabase backend
function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  const code = error.code || "";
  return (
    code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find")
  );
}

export interface Budget {
  id: string;
  category: string;
  limitAmount: number;
  month: string; // YYYY-MM
  isRecurring: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "info" | "danger";
  read: boolean;
  timestamp: string;
}

/**
 * Fetch all budgets for a given user. Returns null if table does not exist.
 */
export async function fetchUserBudgets(userId: string): Promise<Budget[] | null> {
  try {
    const { data, error } = await supabase
      .from("budgets")
      .select("id, category, limit_amount, month, is_recurring")
      .eq("user_id", userId);

    if (error) {
      if (isTableMissingError(error)) {
        return null;
      }
      console.error("[fetchUserBudgets] error:", error.message);
      return [];
    }

    return (data ?? []).map(row => ({
      id: row.id,
      category: row.category,
      limitAmount: Number(row.limit_amount),
      month: row.month,
      isRecurring: row.is_recurring
    }));
  } catch (err) {
    console.warn("[fetchUserBudgets] error (falling back to storage):", err);
    return null;
  }
}

/**
 * Save/Upsert a budget category in Supabase.
 */
export async function upsertUserBudget(
  userId: string,
  budget: Omit<Budget, "id"> & { id?: string }
): Promise<Budget | null> {
  try {
    const dataToSave: any = {
      user_id: userId,
      category: budget.category,
      limit_amount: budget.limitAmount,
      month: budget.month,
      is_recurring: budget.isRecurring
    };

    if (budget.id && budget.id.length === 36) {
      dataToSave.id = budget.id;
    }

    const { data, error } = await supabase
      .from("budgets")
      .upsert(dataToSave, { onConflict: "user_id,category,month" })
      .select("id")
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        return null;
      }
      console.error("[upsertUserBudget] error:", error.message);
      return null;
    }

    return {
      id: data.id,
      category: budget.category,
      limitAmount: budget.limitAmount,
      month: budget.month,
      isRecurring: budget.isRecurring
    };
  } catch (err) {
    console.warn("[upsertUserBudget] error:", err);
    return null;
  }
}

/**
 * Delete a budget limit in Supabase.
 */
export async function deleteUserBudget(userId: string, budgetId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("id", budgetId)
      .eq("user_id", userId);

    if (error) {
      console.error("[deleteUserBudget] error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[deleteUserBudget] error:", err);
    return false;
  }
}

/**
 * Fetch all backend notifications for a user. Returns null if table does not exist.
 */
export async function fetchUserNotifications(userId: string): Promise<NotificationItem[] | null> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, message, type, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      if (isTableMissingError(error)) {
        return null;
      }
      console.error("[fetchUserNotifications] error:", error.message);
      return [];
    }

    // Filter out non-whitelisted rows & purge them from DB in background to free storage
    const validRows = (data ?? []).filter(row => {
      const t = (row.title || "").toLowerCase();
      return t.includes("target") || t.includes("budget") || t.includes("pdf") || t.includes("report");
    });

    const invalidIds = (data ?? []).filter(row => {
      const t = (row.title || "").toLowerCase();
      return !t.includes("target") && !t.includes("budget") && !t.includes("pdf") && !t.includes("report");
    }).map(r => r.id);

    if (invalidIds.length > 0) {
      await supabase.from("notifications").delete().in("id", invalidIds);
    }

    return validRows.map(row => {
      const createdDate = new Date(row.created_at);
      const timeDiff = Date.now() - createdDate.getTime();
      let timestamp = "Just now";
      if (timeDiff > 86400000 * 2) {
        timestamp = createdDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else if (timeDiff > 86400000) {
        timestamp = "Yesterday";
      } else if (timeDiff > 3600000) {
        timestamp = `${Math.floor(timeDiff / 3600000)}h ago`;
      } else if (timeDiff > 60000) {
        timestamp = `${Math.floor(timeDiff / 60000)}m ago`;
      }

      return {
        id: row.id,
        title: row.title,
        message: row.message,
        type: row.type as any,
        read: row.read,
        timestamp
      };
    });
  } catch (err) {
    console.warn("[fetchUserNotifications] error (falling back to state):", err);
    return null;
  }
}

/**
 * Save a notification in Supabase.
 */
export async function insertUserNotification(
  userId: string,
  title: string,
  message: string,
  type: "success" | "warning" | "info" | "danger"
): Promise<NotificationItem | null> {
  // STRICT DB GUARD: Completely block sign-in, welcome, and generic alerts from being inserted into Supabase
  const titleLower = (title || "").toLowerCase();
  const isTargetNotification = titleLower.includes("target");
  const isBudgetNotification = titleLower.includes("budget");
  const isPdfNotification = titleLower.includes("pdf") || titleLower.includes("report");

  if (!isTargetNotification && !isBudgetNotification && !isPdfNotification) {
    // Suppress insertion into database completely
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        type,
        read: false
      })
      .select("id, created_at")
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        return null;
      }
      console.error("[insertUserNotification] error:", error.message);
      return null;
    }

    return {
      id: data.id,
      title,
      message,
      type,
      read: false,
      timestamp: "Just now"
    };
  } catch (err) {
    console.warn("[insertUserNotification] error:", err);
    return null;
  }
}

/**
 * Update read status in Supabase.
 */
export async function markUserNotificationRead(userId: string, notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      console.error("[markUserNotificationRead] error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[markUserNotificationRead] error:", err);
    return false;
  }
}

/**
 * Clear user notifications in Supabase.
 */
export async function clearUserNotifications(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("[clearUserNotifications] error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[clearUserNotifications] error:", err);
    return false;
  }
}

