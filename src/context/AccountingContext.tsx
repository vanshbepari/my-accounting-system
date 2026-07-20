"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/utils/supabaseClient";
import {
  fetchUserTransactions,
  upsertDailyEntry,
  fetchUserSettings,
  saveUserSettings,
  UserSettings,
  fetchUserBudgets,
  upsertUserBudget,
  deleteUserBudget,
  fetchUserNotifications,
  insertUserNotification,
  markUserNotificationRead,
  clearUserNotifications,
  purgeUnwantedDatabaseNotifications,
  deleteAllUserDataFromDatabase,
  Budget
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
  mobileNumber?: string;
  country?: string;
  onboarded?: boolean;
}

export const SUPPORTED_COUNTRIES = [
  { country: "India", currencyCode: "INR", currencySymbol: "₹" },
  { country: "Nepal", currencyCode: "NPR", currencySymbol: "₨" },
  { country: "Sri Lanka", currencyCode: "LKR", currencySymbol: "₨" },
  { country: "Singapore", currencyCode: "SGD", currencySymbol: "$" },
  { country: "Saudi Arabia", currencyCode: "SAR", currencySymbol: "ر.س" },
  { country: "Dubai", currencyCode: "AED", currencySymbol: "د.إ" },
  { country: "Oman", currencyCode: "OMR", currencySymbol: "ر.ع." },
  { country: "Iran", currencyCode: "IRR", currencySymbol: "﷼" },
  { country: "USA", currencyCode: "USD", currencySymbol: "$" },
  { country: "France", currencyCode: "EUR", currencySymbol: "€" },
  { country: "Italy", currencyCode: "EUR", currencySymbol: "€" },
  { country: "Germany", currencyCode: "EUR", currencySymbol: "€" },
  { country: "Indonesia", currencyCode: "IDR", currencySymbol: "Rp" },
  { country: "Philippines", currencyCode: "PHP", currencySymbol: "₱" },
  { country: "Japan", currencyCode: "JPY", currencySymbol: "¥" },
  { country: "Australia", currencyCode: "AUD", currencySymbol: "$" },
  { country: "New Zealand", currencyCode: "NZD", currencySymbol: "$" },
  { country: "Netherlands", currencyCode: "EUR", currencySymbol: "€" },
  { country: "Switzerland", currencyCode: "CHF", currencySymbol: "CHF" },
  { country: "UAE", currencyCode: "AED", currencySymbol: "د.إ" },
  { country: "South Africa", currencyCode: "ZAR", currencySymbol: "R" },
  { country: "Zimbabwe", currencyCode: "ZWG", currencySymbol: "ZWG" },
  { country: "Turkey", currencyCode: "TRY", currencySymbol: "₺" },
  { country: "Israel", currencyCode: "ILS", currencySymbol: "₪" },
  { country: "Jordan", currencyCode: "JOD", currencySymbol: "د.ا" },
  { country: "Canada", currencyCode: "CAD", currencySymbol: "$" },
  { country: "Thailand", currencyCode: "THB", currencySymbol: "฿" },
  { country: "Bhutan", currencyCode: "BTN", currencySymbol: "Nu." },
  { country: "Russia", currencyCode: "RUB", currencySymbol: "₽" },
  { country: "Malaysia", currencyCode: "MYR", currencySymbol: "RM" },
  { country: "Vietnam", currencyCode: "VND", currencySymbol: "₫" },
  { country: "Egypt", currencyCode: "EGP", currencySymbol: "EGP" },
];

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
  deleteAccount: () => Promise<boolean>;

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
    mobileNumber?: string;
    country?: string;
    onboarded?: boolean;
    email?: string;
  }) => Promise<void>;
  formatCurrency: (amount: number) => string;

  // Forecast & Target state properties
  revenueTarget: number;
  netProfitTarget: number;
  expenseCeiling: number;
  growthRate: number;
  savingsRate: number;
  horizon: number;
  saveTargets: (rev: number, net: number, exp: number) => Promise<void>;
  saveForecastSettings: (growth: number, savings: number, hor: number) => Promise<void>;
  
  // Budgeting feature state
  budgets: Budget[];
  saveBudget: (budget: Omit<Budget, "id"> & { id?: string }) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_NOTIFICATIONS: Notification[] = [];

// Helper to filter notifications so only target milestones, budget limits, and PDF report downloads are stored/displayed
const filterImportantNotifications = (list: Notification[]): Notification[] => {
  return list.filter(n => {
    const titleLower = (n.title || "").toLowerCase();
    const isTargetNotification = titleLower.includes("target");
    const isBudgetNotification = titleLower.includes("budget");
    const isPdfNotification = titleLower.includes("pdf") || titleLower.includes("report");
    return isTargetNotification || isBudgetNotification || isPdfNotification;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(DEFAULT_NOTIFICATIONS);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [useSupabaseForBudgets, setUseSupabaseForBudgets] = useState(true);
  const [useSupabaseForNotifications, setUseSupabaseForNotifications] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const lastLoadedUserIdRef = useRef<string | null>(null);
  const clearedNotificationTitlesRef = useRef<Set<string>>(new Set());

  // Targets and Forecast state properties
  const [revenueTarget, setRevenueTarget] = useState(0);
  const [netProfitTarget, setNetProfitTarget] = useState(0);
  const [expenseCeiling, setExpenseCeiling] = useState(0);
  const [growthRate, setGrowthRate] = useState(10);
  const [savingsRate, setSavingsRate] = useState(15);
  const [horizon, setHorizon] = useState(3);

  // ── addNotification (defined early so it can be used in loadUserData) ──────
  const addNotification = useCallback(
    async (title: string, message: string, type: "success" | "warning" | "info" | "danger") => {
      // Check if user has explicitly cleared this notification title
      if (clearedNotificationTitlesRef.current.has(title)) {
        return;
      }

      // STRICT FILTER: Only allow target milestones, budget alerts, and PDF report downloads
      const titleLower = title.toLowerCase();
      const isTargetNotification = titleLower.includes("target");
      const isBudgetNotification = titleLower.includes("budget");
      const isPdfNotification = titleLower.includes("pdf") || titleLower.includes("report");

      if (!isTargetNotification && !isBudgetNotification && !isPdfNotification) {
        // Suppress and do not generate or store generic or unrelated notifications
        return;
      }

      const newNotifLocal: Notification = {
        id: "notif-" + Math.random().toString(36).substring(2, 9),
        title,
        message,
        timestamp: "Just now",
        read: false,
        type,
      };

      if (user?.id && useSupabaseForNotifications) {
        const inserted = await insertUserNotification(user.id, title, message, type);
        if (inserted) {
          setNotifications((prev) => filterImportantNotifications([inserted, ...prev]));
          return;
        }
      }

      // Fallback
      setNotifications((prev) => {
        const updated = filterImportantNotifications([newNotifLocal, ...prev]);
        if (user?.id) {
          localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
        }
        return updated;
      });
    },
    [user?.id, useSupabaseForNotifications]
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
        startingBalance: 0,
        onboarded: true, // Default to true during the brief load phase to avoid flash redirections
      };
      setUser(initialProfile);

      try {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        // Load each dataset with local catch scopes to prevent single query failures from aborting the entire bootstrap
        const loadTransactions = async () => {
          try {
            return await fetchUserTransactions(userId);
          } catch (e) {
            console.error("[loadUserData] fetchUserTransactions failed:", e);
            return [];
          }
        };

        const loadSettings = async () => {
          try {
            return await fetchUserSettings(userId);
          } catch (e) {
            console.error("[loadUserData] fetchUserSettings failed:", e);
            return {
              businessName: "",
              currencyCode: "INR",
              currencySymbol: "₹",
              ownerName: undefined,
              startingBalance: 0,
              mobileNumber: undefined,
              country: undefined,
              onboarded: false
            };
          }
        };

        const loadForecast = async () => {
          try {
            const { data } = await supabase.from("forecasting").select("*").eq("user_id", userId).maybeSingle();
            return data;
          } catch (e) {
            console.error("[loadUserData] fetch forecasting failed:", e);
            return null;
          }
        };

        const loadTarget = async () => {
          try {
            const { data } = await supabase.from("targeting").select("*").eq("user_id", userId).maybeSingle();
            return data;
          } catch (e) {
            console.error("[loadUserData] fetch targeting failed:", e);
            return null;
          }
        };

        const loadBudgets = async () => {
          try {
            return await fetchUserBudgets(userId);
          } catch (e) {
            console.error("[loadUserData] fetchUserBudgets failed:", e);
            return [];
          }
        };

        const loadNotifications = async () => {
          try {
            return await fetchUserNotifications(userId);
          } catch (e) {
            console.error("[loadUserData] fetchUserNotifications failed:", e);
            return [];
          }
        };

        // Fetch all datasets in parallel resiliently
        const [txs, settings, forecastData, targetData, loadedBudgets, loadedNotifications] = await Promise.all([
          loadTransactions(),
          loadSettings(),
          loadForecast(),
          loadTarget(),
          loadBudgets(),
          loadNotifications()
        ]);

        if (forecastData) {
          setGrowthRate(Number(forecastData.growth_rate));
          setSavingsRate(Number(forecastData.savings_rate));
          setHorizon(Number(forecastData.horizon));
        } else {
          setGrowthRate(10);
          setSavingsRate(15);
          setHorizon(3);
        }

        if (targetData) {
          setRevenueTarget(Number(targetData.revenue_target));
          setNetProfitTarget(Number(targetData.net_profit_target));
          setExpenseCeiling(Number(targetData.expense_ceiling));
        } else {
          setRevenueTarget(0);
          setNetProfitTarget(0);
          setExpenseCeiling(0);
        }

        const activeEmail = settings.email || profile.email;

        // Auto-sync & backfill: If email is missing or NULL in user_settings table in Supabase, write it now!
        if (!settings.email && activeEmail && userId) {
          saveUserSettings(userId, { email: activeEmail }).catch(err =>
            console.warn("[loadUserData] Auto-backfilling user_settings email failed:", err)
          );
        }

        const fullProfile: UserProfile = { 
          ...profile, 
          name: settings.ownerName || profile.name,
          email: activeEmail,
          businessName: settings.businessName || "My Retail Shop",
          currencyCode: settings.currencyCode,
          currencySymbol: settings.currencySymbol,
          startingBalance: settings.startingBalance ?? 0,
          mobileNumber: settings.mobileNumber !== undefined ? settings.mobileNumber : profile.mobileNumber,
          country: settings.country,
          onboarded: settings.onboarded,
        };
        setUser(fullProfile);
        setTransactions(txs);

        if (loadedBudgets !== null) {
          setBudgets(loadedBudgets);
          setUseSupabaseForBudgets(true);
        } else {
          setUseSupabaseForBudgets(false);
          const savedLocal = localStorage.getItem(`budgets_${userId}`);
          if (savedLocal) {
            setBudgets(JSON.parse(savedLocal));
          } else {
            setBudgets([]);
          }
        }

        // Load cleared notification memory from localStorage
        try {
          const savedCleared = localStorage.getItem(`cleared_notifications_${userId}`);
          if (savedCleared) {
            clearedNotificationTitlesRef.current = new Set(JSON.parse(savedCleared));
          } else {
            clearedNotificationTitlesRef.current = new Set();
          }
        } catch {
          clearedNotificationTitlesRef.current = new Set();
        }

        if (loadedNotifications !== null) {
          const filtered = filterImportantNotifications(loadedNotifications).filter(
            n => !clearedNotificationTitlesRef.current.has(n.title)
          );
          setNotifications(filtered);
          setUseSupabaseForNotifications(true);
          purgeUnwantedDatabaseNotifications(userId).catch(err => console.warn("[purgeUnwantedDatabaseNotifications] error:", err));
        } else {
          setUseSupabaseForNotifications(false);
          const savedLocalNotifs = localStorage.getItem(`notifications_${userId}`);
          if (savedLocalNotifs) {
            const filteredLocal = filterImportantNotifications(JSON.parse(savedLocalNotifs)).filter(
              n => !clearedNotificationTitlesRef.current.has(n.title)
            );
            setNotifications(filteredLocal);
          } else {
            setNotifications([]);
          }
        }

        setSelectedMonth(currentMonth);
      } catch (err: unknown) {
        lastLoadedUserIdRef.current = null; // Clear so subsequent tries can re-attempt loading
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

          // Trigger background asynchronous load of user settings
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

        // Trigger background asynchronous load of user settings
        loadUserData(session.user.id, {
          id: session.user.id,
          name,
          email,
          avatar,
          isLoggedIn: true,
        }).catch((err) => console.error("[onAuthStateChange] loadUserData error:", err));

        setIsAuthReady(true);
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

  // ── Supabase Realtime Subscription ─────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    // Listen to changes on daily_entries
    const dailyEntriesChannel = supabase
      .channel("daily_entries_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_entries",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          console.log("[Realtime] daily_entries updated, reloading...");
          const txs = await fetchUserTransactions(user.id);
          setTransactions(txs);
        }
      )
      .subscribe();

    // Listen to changes on budgets
    const budgetsChannel = supabase
      .channel("budgets_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budgets",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          console.log("[Realtime] budgets updated, reloading...");
          const loadedBudgets = await fetchUserBudgets(user.id);
          setBudgets(loadedBudgets || []);
        }
      )
      .subscribe();

    // Listen to changes on targeting
    const targetingChannel = supabase
      .channel("targeting_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "targeting",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("[Realtime] targeting updated, reloading...");
          if (payload.new) {
            const data = payload.new as any;
            setRevenueTarget(Number(data.revenue_target));
            setNetProfitTarget(Number(data.net_profit_target));
            setExpenseCeiling(Number(data.expense_ceiling));
          }
        }
      )
      .subscribe();

    // Listen to changes on forecasting
    const forecastingChannel = supabase
      .channel("forecasting_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "forecasting",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("[Realtime] forecasting updated, reloading...");
          if (payload.new) {
            const data = payload.new as any;
            setGrowthRate(Number(data.growth_rate));
            setSavingsRate(Number(data.savings_rate));
            setHorizon(Number(data.horizon));
          }
        }
      )
      .subscribe();

    // Listen to changes on user_settings
    const userSettingsChannel = supabase
      .channel("user_settings_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_settings",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          console.log("[Realtime] user_settings updated, reloading...");
          const settings = await fetchUserSettings(user.id);
          setUser((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              name: settings.ownerName || prev.name,
              email: settings.email || prev.email,
              businessName: settings.businessName || "My Retail Shop",
              currencyCode: settings.currencyCode,
              currencySymbol: settings.currencySymbol,
              startingBalance: settings.startingBalance ?? 0,
              mobileNumber: settings.mobileNumber ?? prev.mobileNumber,
              country: settings.country ?? prev.country,
              onboarded: settings.onboarded ?? prev.onboarded,
            };
          });
        }
      )
      .subscribe();

    // Listen to changes on notifications
    const notificationsChannel = supabase
      .channel("notifications_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          console.log("[Realtime] notifications updated, reloading...");
          const loadedNotifications = await fetchUserNotifications(user.id);
          setNotifications(loadedNotifications ? filterImportantNotifications(loadedNotifications) : []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dailyEntriesChannel);
      supabase.removeChannel(budgetsChannel);
      supabase.removeChannel(targetingChannel);
      supabase.removeChannel(forecastingChannel);
      supabase.removeChannel(userSettingsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [user?.id]);

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

  const saveTargets = async (rev: number, net: number, exp: number) => {
    if (!user) return;
    setRevenueTarget(rev);
    setNetProfitTarget(net);
    setExpenseCeiling(exp);

    const { error } = await supabase
      .from("targeting")
      .upsert({
        user_id: user.id,
        revenue_target: rev,
        net_profit_target: net,
        expense_ceiling: exp,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (error) {
      console.error("[saveTargets] DB error:", error.message);
    }
  };

  const saveForecastSettings = async (growth: number, savings: number, hor: number) => {
    if (!user) return;
    setGrowthRate(growth);
    setSavingsRate(savings);
    setHorizon(hor);

    const { error } = await supabase
      .from("forecasting")
      .upsert({
        user_id: user.id,
        growth_rate: growth,
        savings_rate: savings,
        horizon: hor,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (error) {
      console.error("[saveForecastSettings] DB error:", error.message);
    }
  };

  const updateSettings = async (updates: {
    businessName?: string;
    currencyCode?: string;
    currencySymbol?: string;
    ownerName?: string;
    startingBalance?: number;
    mobileNumber?: string;
    country?: string;
    onboarded?: boolean;
    email?: string;
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
      if (updates.mobileNumber !== undefined) updated.mobileNumber = updates.mobileNumber;
      if (updates.country !== undefined) updated.country = updates.country;
      if (updates.onboarded !== undefined) updated.onboarded = updates.onboarded;
      if (updates.email !== undefined) updated.email = updates.email;
      return updated;
    });

    const dbUpdates: Partial<UserSettings> = {};
    if (updates.businessName !== undefined) dbUpdates.businessName = updates.businessName;
    if (updates.currencyCode !== undefined) dbUpdates.currencyCode = updates.currencyCode;
    if (updates.currencySymbol !== undefined) dbUpdates.currencySymbol = updates.currencySymbol;
    if (updates.ownerName !== undefined) dbUpdates.ownerName = updates.ownerName;
    if (updates.startingBalance !== undefined) dbUpdates.startingBalance = updates.startingBalance;
    if (updates.mobileNumber !== undefined) dbUpdates.mobileNumber = updates.mobileNumber;
    if (updates.country !== undefined) dbUpdates.country = updates.country;
    if (updates.onboarded !== undefined) dbUpdates.onboarded = updates.onboarded;
    if (updates.email !== undefined) dbUpdates.email = updates.email;

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

  /** Delete Account — Permanently deletes user records across all database tables, wipes storage, and signs out. */
  const deleteAccount = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    const targetUserId = user.id;

    // 1. Wipe database tables for this user
    await deleteAllUserDataFromDatabase(targetUserId);

    // 2. Clear deduplication ref
    lastLoadedUserIdRef.current = null;

    // 3. Clear local storage & session storage
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(`transactions_${targetUserId}`);
        localStorage.removeItem(`dailySummaries_${targetUserId}`);
        localStorage.removeItem(`user_settings_${targetUserId}`);
        localStorage.removeItem(`budgets_${targetUserId}`);
        localStorage.removeItem(`targeting_${targetUserId}`);
        localStorage.removeItem(`forecasting_${targetUserId}`);
        localStorage.removeItem(`notifications_${targetUserId}`);
        localStorage.removeItem("swag_user_onboarded");

        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("sb-") || key.includes("supabase")) {
            localStorage.removeItem(key);
          }
        });
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("sb-") || key.includes("supabase")) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn("[deleteAccount] storage cleanup error:", e);
      }
    }

    // 4. Reset in-memory React state
    setUser(null);
    setTransactions([]);
    setDailySummaries([]);
    setNotifications([]);
    setBudgets([]);

    // 5. Sign out of auth session
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (e) {
      console.warn("[deleteAccount] auth signOut error:", e);
    }

    // 6. Hard redirect to login page with deletion status
    if (typeof window !== "undefined") {
      window.location.replace("/login?deleted=true");
    }

    return true;
  }, [user?.id]);



  const markNotificationAsRead = useCallback(
    async (id: string) => {
      if (user?.id && useSupabaseForNotifications && id.length === 36) {
        await markUserNotificationRead(user.id, id);
      }
      setNotifications(prev => {
        const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
        if (user?.id) {
          localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
        }
        return updated;
      });
    },
    [user?.id, useSupabaseForNotifications]
  );

  const clearNotifications = useCallback(
    async () => {
      if (!user?.id) {
        setNotifications([]);
        return;
      }

      // Record all current notification titles as cleared by the user
      setNotifications(prev => {
        prev.forEach(n => {
          clearedNotificationTitlesRef.current.add(n.title);
        });
        if (user?.id) {
          try {
            localStorage.setItem(
              `cleared_notifications_${user.id}`,
              JSON.stringify(Array.from(clearedNotificationTitlesRef.current))
            );
          } catch (e) {
            console.warn("[clearNotifications] error saving cleared titles:", e);
          }
        }
        return [];
      });

      // Clear from Supabase backend database
      if (useSupabaseForNotifications) {
        await clearUserNotifications(user.id);
      }

      // Wipe local storage notification cache
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify([]));
    },
    [user?.id, useSupabaseForNotifications]
  );

  const saveBudget = useCallback(
    async (budget: Omit<Budget, "id"> & { id?: string }) => {
      if (!user?.id) return;

      let saved: Budget | null = null;
      if (useSupabaseForBudgets) {
        saved = await upsertUserBudget(user.id, budget);
      }

      if (!saved) {
        saved = {
          id: budget.id || `b-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          category: budget.category,
          limitAmount: budget.limitAmount,
          month: budget.month,
          isRecurring: budget.isRecurring
        };
      }

      setBudgets(prev => {
        const idx = prev.findIndex(b => b.category === budget.category && b.month === budget.month);
        let updated: Budget[];
        if (idx !== -1) {
          updated = [...prev];
          updated[idx] = saved!;
        } else {
          updated = [saved!, ...prev];
        }
        localStorage.setItem(`budgets_${user.id}`, JSON.stringify(updated));
        return updated;
      });
    },
    [user?.id, useSupabaseForBudgets]
  );

  const deleteBudget = useCallback(
    async (budgetId: string) => {
      if (!user?.id) return;

      if (useSupabaseForBudgets && budgetId.length === 36) {
        await deleteUserBudget(user.id, budgetId);
      }

      setBudgets(prev => {
        const updated = prev.filter(b => b.id !== budgetId);
        localStorage.setItem(`budgets_${user.id}`, JSON.stringify(updated));
        return updated;
      });
    },
    [user?.id, useSupabaseForBudgets]
  );

  const checkBudgetAlerts = useCallback(() => {
    if (!user?.id || budgets.length === 0 || transactions.length === 0) return;

    budgets.forEach(budget => {
      const categoryTxs = transactions.filter(t => t.date.startsWith(budget.month));
      let categorySpending = 0;
      categoryTxs.forEach(t => {
        if (t.expenses) {
          t.expenses.forEach(e => {
            if (e.title.trim().toLowerCase() === budget.category.trim().toLowerCase()) {
              categorySpending += e.amount;
            }
          });
        }
      });

      if (budget.limitAmount <= 0) return;
      const pct = (categorySpending / budget.limitAmount) * 100;

      const alertKey = `[${budget.month}] ${budget.category}`;
      
      if (pct >= 100) {
        const title = `🚨 Budget Breached: ${alertKey}`;
        if (clearedNotificationTitlesRef.current.has(title)) return;
        const message = `Category "${budget.category}" spending of ${formatCurrency(categorySpending)} has breached the budget limit of ${formatCurrency(budget.limitAmount)} (${pct.toFixed(0)}% reached).`;
        const exists = notifications.some(n => n.title === title);
        if (!exists) {
          addNotification(title, message, "danger");
        }
      } else if (pct >= 80) {
        const title = `⚠️ Budget Alert: ${alertKey}`;
        if (clearedNotificationTitlesRef.current.has(title)) return;
        const message = `Category "${budget.category}" spending of ${formatCurrency(categorySpending)} has reached 80%+ of the budget limit of ${formatCurrency(budget.limitAmount)} (${pct.toFixed(0)}% reached).`;
        const exists = notifications.some(n => n.title === title);
        if (!exists) {
          addNotification(title, message, "warning");
        }
      }
    });
  }, [user?.id, budgets, transactions, notifications, addNotification, formatCurrency]);

  const checkTargetMilestoneAlerts = useCallback(() => {
    if (!user?.id || (revenueTarget === 0 && netProfitTarget === 0 && expenseCeiling === 0) || transactions.length === 0) return;

    const currentMonth = selectedMonth && selectedMonth !== "All"
      ? selectedMonth
      : new Date().toISOString().split("T")[0].substring(0, 7);

    const monthTxs = transactions.filter(t => t.date.startsWith(currentMonth));
    const rev = monthTxs.reduce((acc, t) => acc + t.onlineAmount + t.cashAmount, 0);
    const exp = monthTxs.reduce((acc, t) => acc + t.expensesAmount, 0);
    const net = rev - exp;

    // 1. Revenue Target Milestone Achievement
    if (revenueTarget > 0 && rev >= revenueTarget) {
      const title = `🏆 Target Milestone Reached: Revenue Goal (${currentMonth})`;
      if (!clearedNotificationTitlesRef.current.has(title)) {
        const message = `Congratulations! Monthly revenue of ${formatCurrency(rev)} has achieved your revenue target of ${formatCurrency(revenueTarget)}.`;
        const exists = notifications.some(n => n.title === title);
        if (!exists) {
          addNotification(title, message, "success");
        }
      }
    } else if (revenueTarget > 0 && rev < revenueTarget * 0.5) {
      const title = `📉 Target Alert: Revenue Milestone Below Target (${currentMonth})`;
      if (!clearedNotificationTitlesRef.current.has(title)) {
        const message = `Monthly revenue of ${formatCurrency(rev)} is currently below 50% of your revenue target (${formatCurrency(revenueTarget)}).`;
        const exists = notifications.some(n => n.title === title);
        if (!exists) {
          addNotification(title, message, "warning");
        }
      }
    }

    // 2. Net Profit Target Milestone Achievement / Deficit
    if (netProfitTarget > 0 && net >= netProfitTarget) {
      const title = `🎯 Target Milestone Reached: Net Profit Goal (${currentMonth})`;
      if (!clearedNotificationTitlesRef.current.has(title)) {
        const message = `Net profit of ${formatCurrency(net)} has met or exceeded your profit milestone of ${formatCurrency(netProfitTarget)}.`;
        const exists = notifications.some(n => n.title === title);
        if (!exists) {
          addNotification(title, message, "success");
        }
      }
    } else if (netProfitTarget > 0 && net < 0) {
      const title = `⚠️ Target Alert: Net Profit Deficit (${currentMonth})`;
      if (!clearedNotificationTitlesRef.current.has(title)) {
        const message = `Current net position is in deficit (${formatCurrency(net)}), falling short of your profit target of ${formatCurrency(netProfitTarget)}.`;
        const exists = notifications.some(n => n.title === title);
        if (!exists) {
          addNotification(title, message, "danger");
        }
      }
    }

    // 3. Expense Ceiling Breached Target Alert
    if (expenseCeiling > 0 && exp > expenseCeiling) {
      const title = `🚨 Target Alert: Expense Ceiling Exceeded (${currentMonth})`;
      if (!clearedNotificationTitlesRef.current.has(title)) {
        const message = `Total expenses of ${formatCurrency(exp)} have breached your monthly expense ceiling limit of ${formatCurrency(expenseCeiling)}.`;
        const exists = notifications.some(n => n.title === title);
        if (!exists) {
          addNotification(title, message, "danger");
        }
      }
    }
  }, [user?.id, revenueTarget, netProfitTarget, expenseCeiling, transactions, selectedMonth, notifications, addNotification, formatCurrency]);

  const rolloverRecurringBudgets = useCallback((activeMonthStr: string) => {
    if (!user?.id || budgets.length === 0 || activeMonthStr === "All") return;

    const recurringBudgets = budgets.filter(b => b.isRecurring);
    const activeMonthCategories = new Set(
      budgets.filter(b => b.month === activeMonthStr).map(b => b.category.toLowerCase())
    );

    const toAdd: Omit<Budget, "id">[] = [];
    recurringBudgets.forEach(b => {
      if (!activeMonthCategories.has(b.category.toLowerCase())) {
        const alreadyPlanned = toAdd.some(x => x.category.toLowerCase() === b.category.toLowerCase());
        if (!alreadyPlanned) {
          toAdd.push({
            category: b.category,
            limitAmount: b.limitAmount,
            month: activeMonthStr,
            isRecurring: true
          });
          activeMonthCategories.add(b.category.toLowerCase());
        }
      }
    });

    if (toAdd.length > 0) {
      toAdd.forEach(newB => {
        saveBudget(newB);
      });
    }
  }, [user?.id, budgets, saveBudget]);

  // Run alerts scanner whenever budgets, targets, or transactions change
  useEffect(() => {
    if (user?.id && transactions.length > 0) {
      if (budgets.length > 0) {
        checkBudgetAlerts();
      }
      checkTargetMilestoneAlerts();
    }
  }, [budgets, transactions, user?.id, checkBudgetAlerts, checkTargetMilestoneAlerts]);

  // Run rollover when month changes
  useEffect(() => {
    if (selectedMonth && selectedMonth !== "All" && budgets.length > 0) {
      rolloverRecurringBudgets(selectedMonth);
    }
  }, [selectedMonth, budgets.length, rolloverRecurringBudgets]);


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
        deleteAccount,

        setSelectedMonth,
        markNotificationAsRead,
        clearNotifications,
        addNotification,
        updateBusinessName,
        updateCurrency,
        updateSettings,
        formatCurrency,

        revenueTarget,
        netProfitTarget,
        expenseCeiling,
        growthRate,
        savingsRate,
        horizon,
        saveTargets,
        saveForecastSettings,
        
        budgets,
        saveBudget,
        deleteBudget
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
