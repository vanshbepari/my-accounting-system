"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

import { useAccounting } from "@/context/AccountingContext";

// ── Inner component uses useSearchParams (must be inside <Suspense>) ──
function LoginContent() {
  const { user, loginWithGoogle } = useAccounting();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const authError = searchParams.get("error");
  const logoutStatus = searchParams.get("logout");
  const isDeleted = searchParams.get("deleted") === "true";

  // Already logged in → go to dashboard
  useEffect(() => {
    if (user?.isLoggedIn) {
      window.location.replace("/dashboard");
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await loginWithGoogle();
    setLoading(false);
  };

  return (
    <main className="relative min-h-screen flex flex-col justify-between bg-brand-dark overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Ambient glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Header bar */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-start z-10">
        <Link
          href="/"
          className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all duration-200 group backdrop-blur-md shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4.5 text-slate-400 group-hover:text-white group-hover:-translate-x-0.5 transition-all duration-200" />
          <span className="text-xs sm:text-sm font-bold tracking-wide">Back to Home</span>
        </Link>
      </div>

      {/* Main login card */}
      <div className="max-w-sm w-full mx-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-slate-900/60 border border-white/8 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl"
        >
          {/* Badge */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border border-primary/25 bg-primary/10 text-primary text-xs font-semibold mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Sign In</span>
          </div>

          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight mb-2">
            Welcome to My Accounting
          </h1>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
            Your personal business accounting dashboard. Sign in with Google to continue.
          </p>

          {/* Auth error notice */}
          {authError && (
            <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-5 text-left">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300 font-medium">
                {authError === "oauth_cancelled"
                  ? "Sign-in was cancelled. Please try again."
                  : "Authentication failed. Please try again."}
              </p>
            </div>
          )}

          {/* Logout status notice */}
          {logoutStatus && (
            <div className={`flex items-center space-x-2 border rounded-xl px-4 py-2.5 mb-5 text-left ${logoutStatus === "success"
                ? "bg-green-500/10 border-green-500/20"
                : "bg-red-500/10 border-red-500/20"
              }`}>
              {logoutStatus === "success" ? (
                <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <p className={`text-xs font-medium ${logoutStatus === "success" ? "text-green-300" : "text-red-300"}`}>
                {logoutStatus === "success"
                  ? "✅ Successfully signed out."
                  : "Sign out encountered an error, but your session was cleared."}
              </p>
            </div>
          )}

          {/* Account Deletion Notice */}
          {isDeleted && (
            <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 mb-5 text-left">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <p className="text-xs text-rose-200 font-medium leading-relaxed">
                Your account and all historical database records were permanently deleted. Logging in again will register a fresh new account.
              </p>
            </div>
          )}

          {/* Single Google login button */}
          <button
            id="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group flex items-center justify-center space-x-3 w-full py-4 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-semibold shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all hover:scale-[1.02] active:scale-[0.99] disabled:opacity-80 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.85-6.277-6.36 0-3.51 2.811-6.36 6.277-6.36 1.497 0 2.87.525 3.957 1.4l3.11-3.15C19.123 2.115 15.932 1 12.24 1 6.032 1 1 6.07 1 12.36s5.032 11.36 11.24 11.36c6.438 0 10.748-4.57 10.748-11.08 0-.69-.06-1.36-.178-2.355H12.24z" />
              </svg>
            )}
            <span>{loading ? "Connecting to Google…" : "Continue with Google"}</span>
          </button>

          <p className="text-[11px] text-slate-500 mt-4">
            No password needed · Free to use · Your data stays private
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto w-full text-center text-xs text-slate-600 z-10">
        <p>© {new Date().getFullYear()} My Accounting · Secured by Google OAuth 2.0</p>
      </div>


    </main>
  );
}

// ── Outer page wraps LoginContent in Suspense (required by Next.js for useSearchParams) ──
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
