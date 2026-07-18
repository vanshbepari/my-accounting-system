"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  User,
  Briefcase,
  Globe,
  Save,
  ShieldCheck,
  Phone,
  Wallet,
  Mail,
  Trash2,
  AlertTriangle,
  Sparkles,
  Lock,
  Loader2,
  Check
} from "lucide-react";
import { useAccounting, SUPPORTED_COUNTRIES } from "@/context/AccountingContext";
import { deleteUserAccountAndData, fetchUserSettings } from "@/utils/supabaseData";
import { supabase } from "@/utils/supabaseClient";

export default function SettingsPage() {
  const { user, updateSettings, logout } = useAccounting();

  // Settings states initialized with user context
  const [shopName, setShopName] = useState(user?.businessName || "My Retail Shop");
  const [userName, setUserName] = useState(user?.name || "Corporate Owner");
  const [userEmail, setUserEmail] = useState(user?.email || "");
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || "");
  const [selectedCountry, setSelectedCountry] = useState(user?.country || "India");
  const [startingBalance, setStartingBalance] = useState(user?.startingBalance || 0);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Account Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Direct fetch from Supabase on component mount using confirmed auth session
  useEffect(() => {
    let isMounted = true;

    const loadFreshUserSettings = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const activeUserId = sessionData?.session?.user?.id || user?.id;
        const sessionEmail = sessionData?.session?.user?.email || user?.email || "";

        if (!activeUserId) return;

        const dbSettings = await fetchUserSettings(activeUserId);

        if (isMounted) {
          if (dbSettings.businessName) setShopName(dbSettings.businessName);
          if (dbSettings.ownerName) setUserName(dbSettings.ownerName);
          if (dbSettings.email || sessionEmail) setUserEmail(dbSettings.email || sessionEmail);
          if (dbSettings.mobileNumber) setMobileNumber(dbSettings.mobileNumber);
          if (dbSettings.country) setSelectedCountry(dbSettings.country);
          if (dbSettings.startingBalance != null) setStartingBalance(dbSettings.startingBalance);
        }
      } catch (err) {
        console.error("[SettingsPage] Load fresh settings error:", err);
      }
    };

    loadFreshUserSettings();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !userName || !userEmail || !mobileNumber || !selectedCountry) return;

    setIsSaving(true);
    const matchedCountry = SUPPORTED_COUNTRIES.find(c => c.country === selectedCountry);
    const currencyCode = matchedCountry?.currencyCode || "INR";
    const currencySymbol = matchedCountry?.currencySymbol || "₹";

    await updateSettings({
      businessName: shopName.trim(),
      ownerName: userName.trim(),
      email: userEmail.trim(),
      mobileNumber: mobileNumber.trim(),
      country: selectedCountry,
      currencyCode,
      currencySymbol,
      startingBalance: Number(startingBalance) || 0,
    });

    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  const handleConfirmDeleteAccount = async () => {
    if (!user?.id) return;
    setIsDeleting(true);

    try {
      // Execute total database purge & sign out
      await deleteUserAccountAndData(user.id);

      // Clear local storage
      if (typeof window !== "undefined") {
        window.localStorage.clear();
      }

      // Logout session and redirect to landing page
      await logout();
      window.location.replace("/");
    } catch (err) {
      console.error("Account deletion error:", err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 text-left">
      {/* Animated Ambient Glows */}
      <div className="relative">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6"
        >
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center shadow-md">
                <Settings className="w-5 h-5" />
              </div>
              <span>System Preferences</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
              Manage corporate credentials, email address, base currency, and database security.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200/60 px-3.5 py-1.5 rounded-xl self-start sm:self-center shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black text-emerald-700 uppercase tracking-wide">
              RLS Database Encrypted
            </span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Preferences Form (8 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-8 space-y-6"
        >
          <div className="glass-card rounded-3xl p-6 md:p-8 bg-white/95 border border-slate-200/90 shadow-xl text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            <form onSubmit={handleSave} className="space-y-6 relative z-10">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base text-slate-800">
                      Business & Owner Profile
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      Update your owner credentials, contact email, and workspace settings
                    </p>
                  </div>
                </div>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Owner Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                    Owner Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 transition-all"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* Shop / Corporate Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                    Shop / Corporate Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 transition-all"
                    />
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="e.g. owner@example.com"
                      className="w-full pl-9 pr-4 py-3 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 transition-all"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 transition-all"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* Base Country & Currency */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                    Base Country & Currency
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="appearance-none w-full pl-9 pr-10 py-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-slate-800 transition-all"
                    >
                      {SUPPORTED_COUNTRIES.map((c) => (
                        <option key={c.country} value={c.country}>
                          {c.country} ({c.currencyCode} - {c.currencySymbol})
                        </option>
                      ))}
                    </select>
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* Starting Ledger Balance */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                    Starting Ledger Balance ({user?.currencySymbol || "₹"})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={startingBalance}
                      onChange={(e) => setStartingBalance(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-3 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 transition-all"
                    />
                    <Wallet className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>

              {/* Save Controls Footer */}
              <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                <div>
                  {isSaved && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs font-black text-emerald-600 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Configuration saved & locked!</span>
                    </motion.span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-lg shadow-md transition-all hover-lift active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lock Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* DANGER ZONE: Permanent Account Deletion */}
          <div className="glass-card rounded-3xl p-6 md:p-8 bg-rose-50/40 border border-rose-200/80 shadow-md text-left space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base text-rose-950">
                    Danger Zone: Delete Account
                  </h3>
                  <p className="text-[11px] text-rose-700 font-semibold">
                    Permanently wipe your workspace profile and erase all accounting database records.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Security & System Info Side Card (4 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-4 space-y-6"
        >
          <div className="glass-card rounded-3xl p-6 border border-slate-200/90 bg-white/95 text-left space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Database Architecture & Privacy
              </h4>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 font-semibold leading-relaxed">
              <p>
                Your business data is protected by Supabase **Row Level Security (RLS)** policy constraints.
              </p>
              <p>
                All daily entries, expenses, monthly budgets, and targets are isolated strictly to your unique account ID.
              </p>

              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 space-y-1 text-emerald-800 text-[11px] font-bold">
                <div className="flex items-center space-x-1.5 text-emerald-700 font-black">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Verified Isolated Vault</span>
                </div>
                <p className="font-normal text-emerald-700/90">
                  Google OAuth 2.0 PKCE authentication with automatic token refreshing.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CONFIRMATION ALERT POPUP MODAL FOR ACCOUNT DELETION */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-rose-200 shadow-2xl space-y-6 text-left relative overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shadow-md mx-auto sm:mx-0">
                <AlertTriangle className="w-7 h-7 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-black text-xl text-slate-900 tracking-tight">
                  Permanently Delete Account?
                </h3>
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold leading-relaxed space-y-2">
                  <p className="text-rose-900 font-black uppercase tracking-wider text-[11px]">
                    🚨 WARNING: THIS ACTION CANNOT BE UNDONE!
                  </p>
                  <p>
                    Deleting your account will immediately and permanently erase all history and database records across all tables in Supabase:
                  </p>
                  <ul className="list-disc list-inside space-y-1 font-semibold text-[11px] text-rose-700">
                    <li>All daily income & money spent transactions</li>
                    <li>All itemized expense breakdown records</li>
                    <li>All monthly category budget floors</li>
                    <li>All revenue & profit milestone targets</li>
                    <li>All settings, profile credentials, and history logs</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDeleteAccount}
                  className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-rose-500/25 cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
