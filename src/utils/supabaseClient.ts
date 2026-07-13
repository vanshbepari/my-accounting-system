/**
 * supabaseClient.ts
 *
 * Singleton Supabase browser client.
 * Auth is configured to use localStorage (browser-side only) with automatic
 * token refresh and session URL detection for OAuth redirects.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ayyrrufwcoqcxmhhdpvj.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eXJydWZ3Y29xY3htaGhkcHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMjM0NjQsImV4cCI6MjA5NTc5OTQ2NH0.C_NM3UhCY7x-o6Knl0fK1hA-j33hD2d_bVJiN8Ccqn0";

const customStorage = {
  getItem: (key: string) => {
    if (typeof window !== "undefined") {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn("[customStorage] getItem failed:", e);
      }
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.warn("[customStorage] setItem failed:", e);
      }
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.warn("[customStorage] removeItem failed:", e);
      }
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Store session in localStorage (browser-only SPA pattern)
    storage: customStorage,
    // Auto-refresh JWT before it expires — keeps users logged in during session
    autoRefreshToken: true,
    // Always persist session across page reloads/browser restarts
    persistSession: true,
    // Pick up the access_token / refresh_token from the URL hash after OAuth redirect
    detectSessionInUrl: true,
    // Use PKCE flow for extra OAuth security (prevents auth code injection)
    flowType: "pkce",
  },
});
