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

  // Deduplicate entries by date to guarantee 100% unique date records
  const dateMap = new Map<string, any>();

  (entries ?? []).forEach((row: any) => {
    const d = row.date;
    if (!dateMap.has(d)) {
      dateMap.set(d, row);
    }
  });

  const uniqueRows = Array.from(dateMap.values());

  // Map and deduplicate expense items per transaction by title
  return uniqueRows.map((row: any) => {
    const rawExpenses = row.expense_items ?? [];
    const seenTitles = new Set<string>();
    const deduplicatedExpenses: ExpenseItem[] = [];

    rawExpenses.forEach((e: any) => {
      const titleClean = (e.title || "").trim();
      const titleKey = titleClean.toLowerCase();
      if (titleClean !== "" && !seenTitles.has(titleKey)) {
        seenTitles.add(titleKey);
        deduplicatedExpenses.push({
          id: e.id,
          title: titleClean,
          amount: Number(e.amount),
        });
      }
    });

    const calculatedExpensesAmount = deduplicatedExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      id: row.id,
      date: row.date,
      title: row.title,
      category: row.category,
      onlineAmount: Number(row.online_amount),
      cashAmount: Number(row.cash_amount),
      expensesAmount: calculatedExpensesAmount > 0 ? calculatedExpensesAmount : Number(row.expenses_amount),
      notes: row.notes ?? "",
      expenses: deduplicatedExpenses,
    };
  });
}

/**
 * Upsert (create or update) a daily entry for a user.
 * Guarantees zero duplicate entries per date and zero duplicate expense items.
 */
export async function upsertDailyEntry(
  userId: string,
  record: Omit<Transaction, "id">
): Promise<Transaction | null> {
  // 1. Deduplicate input expenses by title before saving
  const seenTitles = new Set<string>();
  const deduplicatedExpenses: ExpenseItem[] = [];

  record.expenses.forEach((e) => {
    const titleClean = e.title.trim();
    const titleKey = titleClean.toLowerCase();
    if (titleClean !== "" && e.amount > 0 && !seenTitles.has(titleKey)) {
      seenTitles.add(titleKey);
      deduplicatedExpenses.push({
        id: e.id || "exp-" + Math.random().toString(36).substring(2, 9),
        title: titleClean,
        amount: Number(e.amount),
      });
    }
  });

  const totalExpenses = deduplicatedExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 2. Fetch all existing entries for this date to purge duplicates
  const { data: existingEntries } = await supabase
    .from("daily_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("date", record.date);

  let primaryEntryId: string | null = null;
  if (existingEntries && existingEntries.length > 0) {
    primaryEntryId = existingEntries[0].id;

    // Purge expense items for ALL existing entries for this date
    for (const oldEntry of existingEntries) {
      await supabase
        .from("expense_items")
        .delete()
        .eq("entry_id", oldEntry.id)
        .eq("user_id", userId);
    }

    // Delete redundant duplicate daily_entries rows if more than 1 exists
    if (existingEntries.length > 1) {
      const redundantIds = existingEntries.slice(1).map((e) => e.id);
      await supabase
        .from("daily_entries")
        .delete()
        .in("id", redundantIds)
        .eq("user_id", userId);
    }
  }

  // 3. Upsert main daily entry row
  const { data: entryData, error: entryError } = await supabase
    .from("daily_entries")
    .upsert(
      {
        ...(primaryEntryId ? { id: primaryEntryId } : {}),
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

  // 4. Insert fresh deduplicated expense items
  if (deduplicatedExpenses.length > 0) {
    const expenseRows = deduplicatedExpenses.map((e) => ({
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
    expenses: deduplicatedExpenses,
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
  email?: string;
  onboarded?: boolean;
}

/**
 * Fetch business name and currency settings for a user. Returns defaults if not yet set.
 */
export async function fetchUserSettings(userId: string): Promise<UserSettings> {
  let data: any = null;

  try {
    // 1. Primary fetch from user_settings table
    const { data: queryData, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && queryData) {
      data = queryData;
    }
  } catch (err) {
    console.warn("[fetchUserSettings] user_settings query warning:", err);
  }

  // 2. Secondary fallback from profiles table if user_settings row is missing
  if (!data) {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileData) {
        data = {
          user_id: userId,
          business_name: profileData.business_name || profileData.shop_name,
          owner_name: profileData.name || profileData.owner_name,
          mobile_number: profileData.mobile || profileData.mobile_number,
          country: profileData.country,
          currency_code: profileData.currency_code,
          currency_symbol: profileData.currency_symbol,
          starting_balance: profileData.starting_balance,
          email: profileData.email,
          onboarded: profileData.onboarded,
        };
      }
    } catch (e) {
      // profiles table fallback warning
    }
  }

  // 3. Check localStorage cache for instantaneous persistence fallback
  let cached: Partial<UserSettings> = {};
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(`user_profile_${userId}`);
      if (raw) cached = JSON.parse(raw);
    } catch (e) {}
  }

  const localOnboarded = typeof window !== "undefined"
    ? localStorage.getItem(`onboarded_${userId}`) === "true"
    : false;

  const hasDbRow = Boolean(data && (data.user_id || data.business_name || data.owner_name));
  const isOnboarded = Boolean(data?.onboarded === true || hasDbRow || localOnboarded);

  // Merge database response with cached fallback values so fields NEVER reset or disappear
  const finalSettings: UserSettings = {
    businessName: data?.business_name || cached.businessName || "",
    currencyCode: data?.currency_code || cached.currencyCode || "INR",
    currencySymbol: data?.currency_symbol || cached.currencySymbol || "₹",
    ownerName: data?.owner_name || cached.ownerName || undefined,
    startingBalance: data?.starting_balance != null ? Number(data.starting_balance) : (cached.startingBalance ?? 0),
    mobileNumber: data?.mobile_number || cached.mobileNumber || undefined,
    country: data?.country || cached.country || "India",
    email: data?.email || cached.email || undefined,
    onboarded: isOnboarded,
  };

  // Sync to local storage fallback
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`user_profile_${userId}`, JSON.stringify(finalSettings));
      if (isOnboarded) {
        localStorage.setItem(`onboarded_${userId}`, "true");
      }
    } catch (e) {}
  }

  return finalSettings;
}

/**
 * Save / update the user's business settings in Supabase and local cache.
 */
export async function saveUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  // Always update local storage cache immediately
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`onboarded_${userId}`, "true");
      const existingRaw = localStorage.getItem(`user_profile_${userId}`);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      localStorage.setItem(`user_profile_${userId}`, JSON.stringify({ ...existing, ...settings }));
    } catch (e) {}
  }

  const updateData: {
    user_id: string;
    business_name?: string;
    currency_code?: string;
    currency_symbol?: string;
    owner_name?: string;
    starting_balance?: number;
    mobile_number?: string;
    country?: string;
    email?: string;
    onboarded?: boolean;
  } = { user_id: userId, onboarded: true };

  if (settings.businessName !== undefined) updateData.business_name = settings.businessName;
  if (settings.currencyCode !== undefined) updateData.currency_code = settings.currencyCode;
  if (settings.currencySymbol !== undefined) updateData.currency_symbol = settings.currencySymbol;
  if (settings.ownerName !== undefined) updateData.owner_name = settings.ownerName;
  if (settings.startingBalance !== undefined) updateData.starting_balance = settings.startingBalance;
  if (settings.mobileNumber !== undefined) updateData.mobile_number = settings.mobileNumber;
  if (settings.country !== undefined) updateData.country = settings.country;
  if (settings.email !== undefined) updateData.email = settings.email;
  if (settings.onboarded !== undefined) updateData.onboarded = settings.onboarded;

  // Primary upsert to user_settings table
  const { error } = await supabase
    .from("user_settings")
    .upsert(updateData, { onConflict: "user_id" });

  if (error) {
    console.warn("[saveUserSettings] full upsert warning:", error.message);

    // Fallback upsert with all available values
    const fallbackData: any = {
      user_id: userId,
      business_name: settings.businessName || "My Retail Shop",
      currency_code: settings.currencyCode || "INR",
      currency_symbol: settings.currencySymbol || "₹",
      owner_name: settings.ownerName || undefined,
      starting_balance: settings.startingBalance ?? 0,
      mobile_number: settings.mobileNumber || undefined,
      country: settings.country || "India",
      email: settings.email || undefined,
      onboarded: true,
    };

    await supabase.from("user_settings").upsert(fallbackData, { onConflict: "user_id" });
  }

  // Also sync to profiles table if present in Supabase schema
  try {
    await supabase.from("profiles").upsert(
      {
        id: userId,
        name: settings.ownerName,
        business_name: settings.businessName,
        currency_code: settings.currencyCode,
        currency_symbol: settings.currencySymbol,
        mobile: settings.mobileNumber,
        country: settings.country,
        email: settings.email,
        onboarded: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch (e) {
    // profiles table sync warning
  }
}

/**
 * Permanently delete a user account and all associated database records across all tables.
 */
export async function deleteUserAccountAndData(userId: string): Promise<boolean> {
  try {
    // 1. Delete all user rows across all 8 tables in Supabase
    await supabase.from("daily_entries").delete().eq("user_id", userId);
    await supabase.from("expense_items").delete().eq("user_id", userId);
    await supabase.from("budgets").delete().eq("user_id", userId);
    await supabase.from("targeting").delete().eq("user_id", userId);
    await supabase.from("forecasting").delete().eq("user_id", userId);
    await supabase.from("notifications").delete().eq("user_id", userId);
    await supabase.from("user_settings").delete().eq("user_id", userId);

    try {
      await supabase.from("profiles").delete().eq("id", userId);
    } catch (e) {
      // profiles delete optional fallback
    }

    // 2. Clear all local storage caches
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(`onboarded_${userId}`);
        localStorage.removeItem(`user_profile_${userId}`);
        localStorage.removeItem(`budgets_${userId}`);
        localStorage.removeItem(`notifications_${userId}`);
      } catch (e) {}
    }

    // 3. Sign out user session completely
    await supabase.auth.signOut();
    return true;
  } catch (err) {
    console.error("[deleteUserAccountAndData] error:", err);
    return false;
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
      await supabase.from("notifications").delete().eq("user_id", userId).in("id", invalidIds);
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

/**
 * Permanently purge all existing non-whitelisted notifications (Signed in, Welcome, etc.) for a user from Supabase DB.
 */
export async function purgeUnwantedDatabaseNotifications(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId)
      .or("title.ilike.%signed in%,title.ilike.%welcome%,title.ilike.%login%");

    if (error) {
      console.error("[purgeUnwantedDatabaseNotifications] error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[purgeUnwantedDatabaseNotifications] error:", err);
    return false;
  }
}

