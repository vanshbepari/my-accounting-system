"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/utils/supabaseClient";
import {
  fetchUserTransactions,
  upsertDailyEntry,
  fetchUserSettings,
  saveUserSettings,
  UserSettings,
} from "@/utils/supabaseData";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: string;
  onlineAmount: number;
  cashAmount: number;
  expensesAmount: number;
  expenses: ExpenseItem[];
  notes?: string;
}

export interface UserProfile {
  id: string; // Supabase auth user id
  name: string;
  email: string;
  avatar: string;
  businessName: string;
  currencyCode: string;
  currencySymbol: string;
  startingBalance: number;
  isLoggedIn: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "success" | "warning" | "info" | "danger";
}

export interface DailySummary {
  date: string;
  online: number;
  cash: number;
  revenue: number;
  expenses: number;
  netPL: number;
}

interface AccountingContextType {
  user: UserProfile | null;
  transactions: Transaction[];
  notifications: Notification[];

  selectedMonth: string;
  dailySummaries: DailySummary[];
  dataLoading: boolean;
  isAuthReady: boolean;
  saveDailyRecord: (record: Omit<Transaction, "id">) => Promise<void>;

  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;

  setSelectedMonth: (month: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  addNotification: (title: string, message: string, type: "success" | "warning" | "info" | "danger") => void;
  updateBusinessName: (name: string) => Promise<void>;
  updateCurrency: (code: string, symbol: string) => Promise<void>;
  updateSettings: (updates: {
    businessName?: string;
    currencyCode?: string;
    currencySymbol?: string;
    ownerName?: string;
    startingBalance?: number;
  }) => Promise<void>;
  formatCurrency: (amount: number) => string;
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-welcome",
    title: "Welcome to My Accounting!",
    message: "Your private accounting dashboard is ready. Start adding your daily entries.",
    timestamp: "Just now",
    read: false,
    type: "info",
  },
];



// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(DEFAULT_NOTIFICATIONS);

  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const lastLoadedUserIdRef = useRef<string | null>(null);

  // ── addNotification (defined early so it can be used in loadUserData) ──────
  const addNotification = useCallback(
    (title: string, message: string, type: "success" | "warning" | "info" | "danger") => {
      const newNotif: Notification = {
        id: "notif-" + Math.random().toString(36).substring(2, 9),
        title,
        message,
        timestamp: "Just now",
        read: false,
        type,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    []
  );

  // ── Load all data for an authenticated user from Supabase ─────────────────
  const loadUserData = useCallback(
    async (userId: string, profile: Omit<UserProfile, "businessName" | "currencyCode" | "currencySymbol" | "startingBalance">) => {
      if (lastLoadedUserIdRef.current === userId) {
        return;
      }
      lastLoadedUserIdRef.current = userId;
      setDataLoading(true);

      // Set basic user state immediately so the app/layout knows the user is logged in
      const initialProfile: UserProfile = {
        ...profile,
        businessName: "My Business",
        currencyCode: "INR",
        currencySymbol: "₹",
        startingBalance: 15000,
      };
      setUser(initialProfile);

      try {
        const fetchPromise = Promise.all([
          fetchUserTransactions(userId),
          fetchUserSettings(userId),
        ]);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database fetch timed out")), 5000)
        );

        const [txs, settings] = await Promise.race([fetchPromise, timeoutPromise]);

        const fullProfile: UserProfile = { 
          ...profile, 
          name: settings.ownerName || profile.name,
          businessName: settings.businessName,
          currencyCode: settings.currencyCode,
          currencySymbol: settings.currencySymbol,
          startingBalance: settings.startingBalance ?? 15000,
        };
        setUser(fullProfile);
        setTransactions(txs);

        // Set current month filter on first load
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        setSelectedMonth(currentMonth);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("[loadUserData] error:", errorMsg);
        addNotification("Data Load Error", "Could not load your data. Please refresh.", "danger");
      } finally {
        setDataLoading(false);
      }
    },
    [addNotification]
  );

  // ── Bootstrap: theme + Supabase auth listener ────────────────────────────
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);

    let isSubscribed = true;

    // Check for an existing Supabase session or perform PKCE code exchange on mount
    const initAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        let currentSession = null;

        // First, check for an existing active session.
        // This is important because the Supabase client may have already automatically
        // exchanged the code for a session on initialization (via detectSessionInUrl: true).
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.error("[initAuth] getSession error:", error.message);
          } else {
            currentSession = data.session;
          }
        } catch (sessionErr) {
          console.error("[initAuth] getSession failed:", sessionErr);
        }

        // If we found a code in the URL, but do NOT have an active session yet,
        // we manually trigger the PKCE code exchange.
        if (code && !currentSession) {
          console.log("[initAuth] Found auth code in URL and no active session, exchanging for session...");
          const exchangePromise = supabase.auth.exchangeCodeForSession(code);
          const timeoutPromise = new Promise<{ data: { session: null }; error: Error }>((_, reject) =>
            setTimeout(() => reject(new Error("Code exchange timed out")), 6000)
          );

          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = (await Promise.race([exchangePromise, timeoutPromise])) as any;
            if (error) {
              console.error("[initAuth] Code exchange error:", error.message);
            } else {
              currentSession = data.session;
              console.log("[initAuth] Code exchanged successfully!");
            }
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error("[initAuth] Code exchange failed or timed out:", errorMsg);
          }
        }

        // Clean up URL query parameters (code and state) if present
        if (code) {
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("code");
            url.searchParams.delete("state");
            window.history.replaceState({}, document.title, url.pathname + url.search);
          }
        }

        if (currentSession?.user && isSubscribed) {
          const sessionUser = currentSession.user;
          const meta = sessionUser.user_metadata;
          const email = sessionUser.email ?? "";
          const name = meta?.full_name || email.split("@")[0] || "User";
          const avatar =
            meta?.avatar_url ||
            meta?.picture ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=2563eb`;

          // Trigger background-only non-blocking load of user data
          loadUserData(sessionUser.id, {
            id: sessionUser.id,
            name,
            email,
            avatar,
            isLoggedIn: true,
          }).catch((err) => console.error("[initAuth] loadUserData error:", err));
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (isSubscribed) {
          setIsAuthReady(true);
        }
      }
    };

    initAuth();

    // Listen for real-time auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[onAuthStateChange] Event:", event);
      if (!isSubscribed) return;

      if (session?.user) {
        // Skip reloading data on USER_UPDATED to prevent infinite loops / race conditions
        if (event === "USER_UPDATED") return;

        const meta = session.user.user_metadata;
        const email = session.user.email ?? "";
        const name = meta?.full_name || email.split("@")[0] || "User";
        const avatar =
          meta?.avatar_url ||
          meta?.picture ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=2563eb`;

        // Background non-blocking load of user data
        loadUserData(session.user.id, {
          id: session.user.id,
          name,
          email,
          avatar,
          isLoggedIn: true,
        }).catch((err) => console.error("[onAuthStateChange] loadUserData error:", err));

        setIsAuthReady(true);

        if (event === "SIGNED_IN") {
          addNotification(
            "Signed in successfully",
            `Welcome back, ${name}! Your private dashboard is ready.`,
            "success"
          );
        }
      } else if (event === "SIGNED_OUT") {
        // Wipe all in-memory data so no trace of previous user remains
        setUser(null);
        setTransactions([]);
        setDailySummaries([]);
        setNotifications(DEFAULT_NOTIFICATIONS);
        setIsAuthReady(true);
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [loadUserData, addNotification]);



  // ── Recalculate daily summaries whenever transactions / month changes ─────
  useEffect(() => {
    const grouped: Record<string, DailySummary> = {};

    transactions.forEach((tx) => {
      const revenue = tx.onlineAmount + tx.cashAmount;
      if (grouped[tx.date]) {
        grouped[tx.date].online += tx.onlineAmount;
        grouped[tx.date].cash += tx.cashAmount;
        grouped[tx.date].revenue += revenue;
        grouped[tx.date].expenses += tx.expensesAmount;
        grouped[tx.date].netPL += revenue - tx.expensesAmount;
      } else {
        grouped[tx.date] = {
          date: tx.date,
          online: tx.onlineAmount,
          cash: tx.cashAmount,
          revenue,
          expenses: tx.expensesAmount,
          netPL: revenue - tx.expensesAmount,
        };
      }
    });

    let summaries = Object.values(grouped).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (selectedMonth !== "All") {
      summaries = summaries.filter((s) => s.date.startsWith(selectedMonth));
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDailySummaries(summaries);
  }, [transactions, selectedMonth]);

  const updateSettings = async (updates: {
    businessName?: string;
    currencyCode?: string;
    currencySymbol?: string;
    ownerName?: string;
    startingBalance?: number;
  }) => {
    if (!user) return;

    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev };
      if (updates.businessName !== undefined) updated.businessName = updates.businessName;
      if (updates.currencyCode !== undefined) updated.currencyCode = updates.currencyCode;
      if (updates.currencySymbol !== undefined) updated.currencySymbol = updates.currencySymbol;
      if (updates.ownerName !== undefined) updated.name = updates.ownerName;
      if (updates.startingBalance !== undefined) updated.startingBalance = updates.startingBalance;
      return updated;
    });

    const dbUpdates: Partial<UserSettings> = {};
    if (updates.businessName !== undefined) dbUpdates.businessName = updates.businessName;
    if (updates.currencyCode !== undefined) dbUpdates.currencyCode = updates.currencyCode;
    if (updates.currencySymbol !== undefined) dbUpdates.currencySymbol = updates.currencySymbol;
    if (updates.ownerName !== undefined) dbUpdates.ownerName = updates.ownerName;
    if (updates.startingBalance !== undefined) dbUpdates.startingBalance = updates.startingBalance;

    await saveUserSettings(user.id, dbUpdates);

    if (updates.ownerName !== undefined) {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: updates.ownerName }
      });
      if (error) {
        console.error("[updateSettings] auth updateUser error:", error.message);
      }
    }

    addNotification("Configuration saved", "Your business settings have been successfully updated.", "success");
  };

  const updateBusinessName = async (name: string) => {
    await updateSettings({ businessName: name });
  };

  const updateCurrency = async (code: string, symbol: string) => {
    await updateSettings({ currencyCode: code, currencySymbol: symbol });
  };

  const formatCurrency = useCallback((amount: number) => {
    const code = user?.currencyCode || "INR";
    const locale = code === "INR" ? "en-IN" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, [user?.currencyCode]);

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  /** Save or update a daily record. Writes to Supabase then updates local state. */
  const saveDailyRecord = async (record: Omit<Transaction, "id">) => {
    if (!user?.id) {
      addNotification("Not signed in", "Please sign in to save records.", "warning");
      return;
    }

    const saved = await upsertDailyEntry(user.id, record);

    if (!saved) {
      addNotification("Save Failed", "Could not save the record. Please try again.", "danger");
      return;
    }

    // Update local state so the UI reflects the change instantly
    setTransactions((prev) => {
      const idx = prev.findIndex((t) => t.date === record.date);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });

    const totalExpenses = record.expenses.reduce((sum, e) => sum + e.amount, 0);
    addNotification(
      "Record Saved ✓",
      `${record.date} — Revenue: ${formatCurrency(record.onlineAmount + record.cashAmount)}, Expenses: ${formatCurrency(totalExpenses)}`,
      "success"
    );
  };



  /** Real Google OAuth — triggers full-page redirect to accounts.google.com. */
  const loginWithGoogle = async () => {
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/dashboard`
          : "/dashboard";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) {
        console.error("Google OAuth error:", error.message);
        addNotification("Login Failed", "Could not connect to Google. Please try again.", "danger");
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
      addNotification("Login Error", "Something went wrong. Please try again.", "danger");
    }
  };

  /** Sign out — destroys session completely then hard-redirects to login. */
  const logout = async () => {
    // ── Step 0: Clear deduplication ref ─────────────────────────────────────
    lastLoadedUserIdRef.current = null;

    // ── Step 1: Wipe React state FIRST so UI updates instantly ──────────────
    setUser(null);
    setTransactions([]);
    setDailySummaries([]);
    setNotifications(DEFAULT_NOTIFICATIONS);

    // ── Step 2: Forcefully clear ALL Supabase storage (localStorage + cookies) ─
    // Do this BEFORE calling signOut so there is zero chance of token reuse.
    if (typeof window !== "undefined") {
      try {
        // Clear localStorage keys
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("sb-") || key.includes("supabase")) {
            localStorage.removeItem(key);
          }
        });

        // Clear sessionStorage keys
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("sb-") || key.includes("supabase")) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn("[logout] clearing storage failed:", e);
      }

      try {
        // Clear Supabase-related cookies for all path scopes
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
          if (name.startsWith("sb-") || name.includes("supabase") || name === "access_token") {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
          }
        });
      } catch (e) {
        console.warn("[logout] clearing cookies failed:", e);
      }
    }

    // ── Step 3: Tell Supabase server to invalidate the refresh token ─────────
    let logoutSuccess = true;
    try {
      // "global" scope revokes all sessions for this user on the server.
      // "local" scope just clears the current device — use local as fallback.
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        // Non-fatal — local storage already cleared so user IS effectively logged out
        console.warn("[logout] Supabase signOut warning:", error.message);
      }
    } catch (err) {
      console.error("[logout] signOut exception:", err);
      logoutSuccess = false;
    }

    // ── Step 4: Hard redirect — completely wipes JS memory/module cache ───────
    // Using window.location.replace (vs .href) so the login page cannot be
    // navigated back to via the browser's Back button after logout.
    window.location.replace(`/login?logout=${logoutSuccess ? "success" : "error"}`);
  };



  const markNotificationAsRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const clearNotifications = () => setNotifications([]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AccountingContext.Provider
      value={{
        user,
        transactions,
        notifications,

        selectedMonth,
        dailySummaries,
        dataLoading,
        isAuthReady,
        saveDailyRecord,

        loginWithGoogle,
        logout,

        setSelectedMonth,
        markNotificationAsRead,
        clearNotifications,
        addNotification,
        updateBusinessName,
        updateCurrency,
        updateSettings,
        formatCurrency,
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error("useAccounting must be used within an AccountingProvider");
  }
  return context;
};
