"use client";

import React, { useState } from "react";
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
  AlertTriangle,
  Trash2,
  Loader2,
  X
} from "lucide-react";
import { useAccounting, SUPPORTED_COUNTRIES } from "@/context/AccountingContext";

export default function SettingsPage() {
  const { user, updateSettings, deleteAccount } = useAccounting();

  // Settings states initialized with user context
  const [shopName, setShopName] = useState(user?.businessName || "My Retail Shop");
  const [userName, setUserName] = useState(user?.name || "Corporate Owner");
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || "");
  const [selectedCountry, setSelectedCountry] = useState(user?.country || "India");
  const [startingBalance, setStartingBalance] = useState(user?.startingBalance || 0);

  const [isSaved, setIsSaved] = useState(false);

  // Delete Account Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state when user context is fully loaded from Supabase
  React.useEffect(() => {
    if (user) {
      setShopName(user.businessName || "My Retail Shop");
      setUserName(user.name || "Corporate Owner");
      setMobileNumber(user.mobileNumber || "");
      setSelectedCountry(user.country || "India");
      setStartingBalance(user.startingBalance || 0);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !userName || !mobileNumber || !selectedCountry) return;

    const matchedCountry = SUPPORTED_COUNTRIES.find(c => c.country === selectedCountry);
    const currencyCode = matchedCountry?.currencyCode || "INR";
    const currencySymbol = matchedCountry?.currencySymbol || "₹";

    await updateSettings({
      businessName: shopName.trim(),
      ownerName: userName.trim(),
      mobileNumber: mobileNumber.trim(),
      country: selectedCountry,
      currencyCode,
      currencySymbol,
      startingBalance: Number(startingBalance),
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleConfirmDeleteAccount = async () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") return;
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      console.error("[SettingsPage] deleteAccount error:", err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10 text-left">
      
      {/* Page Header with Entrance Motion */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-color pb-6 text-left"
      >
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight flex items-center gap-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Settings className="w-7 h-7 text-primary" />
            </motion.div>
            <span>Workspace Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Manage your shop identity, primary currency, starting capital, and security options.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: General Profile Settings Form (8 cols with Floating Entry) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-8 space-y-6"
        >
          <div className="glass-card rounded-2xl p-6 border border-border-color bg-white text-left space-y-6 shadow-sm">
            <div className="flex items-center space-x-3 border-b border-border-color pb-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm"
              >
                <Briefcase className="w-5 h-5" />
              </motion.div>
              <div>
                <h3 className="font-display font-bold text-base text-text-primary">Shop & Personal Profile</h3>
                <p className="text-[10px] text-text-secondary font-semibold">Updates persist to Supabase backend database</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Shop Name */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">
                    Shop / Workspace Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary focus:shadow-md focus:shadow-primary/10 text-text-primary transition-all duration-200"
                    />
                    <Briefcase className="w-4 h-4 text-text-secondary absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* Owner Name */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">
                    Owner Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary focus:shadow-md focus:shadow-primary/10 text-text-primary transition-all duration-200"
                    />
                    <User className="w-4 h-4 text-text-secondary absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">
                    Mobile Phone
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary focus:shadow-md focus:shadow-primary/10 text-text-primary transition-all duration-200"
                    />
                    <Phone className="w-4 h-4 text-text-secondary absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* Base Country */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">
                    Base Country & Currency
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="appearance-none w-full pl-9 pr-10 py-2.5 text-xs font-semibold rounded-xl border border-border-color bg-slate-50 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary cursor-pointer transition-all duration-200"
                    >
                      {SUPPORTED_COUNTRIES.map((c) => (
                        <option key={c.country} value={c.country}>
                          {c.country} ({c.currencyCode} - {c.currencySymbol})
                        </option>
                      ))}
                    </select>
                    <Globe className="w-4 h-4 text-text-secondary absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* Starting Balance */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">
                    Starting Ledger Balance ({user?.currencySymbol || "₹"})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={startingBalance}
                      onChange={(e) => setStartingBalance(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary focus:shadow-md focus:shadow-primary/10 text-text-primary transition-all duration-200"
                    />
                    <Wallet className="w-4 h-4 text-text-secondary absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border-color">
                {isSaved ? (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs font-bold text-success"
                  >
                    ✓ Configuration saved and locked!
                  </motion.span>
                ) : (
                  <span />
                )}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all text-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lock Settings</span>
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Right Side: Security Card + Danger Zone Delete Account Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Security Card with Safety Settle Bounce Icon */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card rounded-2xl p-5 border border-border-color bg-white text-left space-y-4 shadow-sm"
          >
            <h4 className="text-xs font-bold text-text-primary flex items-center space-x-1.5 border-b border-border-color pb-3">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: [0.9, 1.05, 1], opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <ShieldCheck className="w-4 h-4 text-success" />
              </motion.div>
              <span>Data Security</span>
            </h4>
            <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
              <p>
                Your data is stored securely in Supabase with Row Level Security enabled.
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100 text-emerald-900 font-medium"
              >
                Only your authenticated Google account can access your business records.
                No other user can view your data.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="flex items-center space-x-1.5 mt-2 text-success font-semibold"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>RLS enforced · Data isolated · Private workspace</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Danger Zone: Delete Account Card with Restrained Serious Motion */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card rounded-2xl p-5 border border-rose-200 bg-rose-50/40 text-left space-y-4 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center space-x-2.5 border-b border-rose-200/80 pb-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20"
              >
                <AlertTriangle className="w-4 h-4" />
              </motion.div>
              <div>
                <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider">
                  Danger Zone
                </h4>
                <p className="text-[10px] text-rose-700 font-semibold">
                  Irreversible Account Deletion
                </p>
              </div>
            </div>

            <p className="text-xs text-rose-900/80 leading-relaxed">
              Permanently purge your business account, transaction ledgers, target goals, category budgets, and cloud database records.
            </p>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setConfirmText("");
                setIsDeleteModalOpen(true);
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account & Data</span>
            </motion.button>
          </motion.div>
        </div>

      </div>

      {/* CONFIRMATION MODAL FOR ACCOUNT DELETION */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative w-full max-w-lg bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-left overflow-hidden space-y-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shadow-md">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-xl text-slate-900 tracking-tight">
                      Delete Account Permanently?
                    </h3>
                    <p className="text-xs text-rose-600 font-bold uppercase tracking-wider mt-0.5">
                      Warning: Action cannot be undone
                    </p>
                  </div>
                </div>

                <button
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Warning Content Checklist */}
              <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-100 space-y-2.5 text-xs text-rose-950 font-medium">
                <p className="font-extrabold text-rose-900">
                  The following data for <span className="underline">{user?.email || user?.businessName}</span> will be permanently erased:
                </p>
                <ul className="space-y-1.5 list-disc pl-4 text-rose-800">
                  <li>All daily transaction logs, income entries, and cash/online payments.</li>
                  <li>Itemized expense records and category budget limit floors.</li>
                  <li>Corporate revenue targets, net profit goals, and forecasting rules.</li>
                  <li>Workspace profile, custom currency settings, and starting balances.</li>
                  <li>Supabase cloud database user records and isolated storage cache.</li>
                </ul>
              </div>

              {/* Confirmation Input Guard */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Type <span className="font-black text-rose-600 font-mono">DELETE</span> below to confirm permanent removal:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  disabled={isDeleting}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-4 py-3 text-sm font-mono font-bold border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-900 tracking-widest"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={confirmText.trim().toUpperCase() !== "DELETE" || isDeleting}
                  onClick={handleConfirmDeleteAccount}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/25 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting Account & Data...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Permanently Delete My Account</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
