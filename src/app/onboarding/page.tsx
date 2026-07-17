"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, User, Store, Phone, Globe, ChevronRight, Loader2 } from "lucide-react";
import { useAccounting, SUPPORTED_COUNTRIES } from "@/context/AccountingContext";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { user, isAuthReady, updateSettings, saveTargets, saveForecastSettings } = useAccounting();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Form states
  const [ownerName, setOwnerName] = useState("");
  const [shopName, setShopName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [country, setCountry] = useState("India");

  useEffect(() => {
    if (isAuthReady) {
      if (!user?.isLoggedIn) {
        router.replace("/login");
      } else if (user?.onboarded) {
        router.replace("/dashboard");
      } else {
        // Pre-populate owner name from OAuth metadata if available
        setOwnerName(user.name || "");
      }
    }
  }, [isAuthReady, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !shopName.trim() || !mobileNumber.trim() || !country) return;

    setLoading(true);

    const matchedCountry = SUPPORTED_COUNTRIES.find(c => c.country === country);
    const currencyCode = matchedCountry?.currencyCode || "INR";
    const currencySymbol = matchedCountry?.currencySymbol || "₹";

    try {
      await updateSettings({
        ownerName: ownerName.trim(),
        businessName: shopName.trim(),
        mobileNumber: mobileNumber.trim(),
        country,
        currencyCode,
        currencySymbol,
        startingBalance: 0,
        onboarded: true
      });
      
      // Initialize targeting and forecasting rows to zero/default to override DB schema default mock metrics
      try {
        await saveTargets(0, 0, 0);
        await saveForecastSettings(0, 0, 3);
      } catch (err) {
        console.error("[Onboarding] Failed to save target/forecast defaults:", err);
      }
      
      // Redirect to main dashboard client-side
      router.replace("/dashboard");
    } catch (err) {
      console.error("[Onboarding] Submission failed:", err);
      setLoading(false);
    }
  };

  if (!isAuthReady || !user || user.onboarded) {
    return null;
  }

  return (
    <main className="relative min-h-screen flex flex-col justify-center items-center bg-brand-dark overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Ambient glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border border-primary/25 bg-primary/10 text-primary text-xs font-semibold mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Let's get started</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Create Your Profile
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
              Quickly complete these onboarding fields to establish your localized ledger workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input: Owner's Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Owner's Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-bold rounded-xl border border-white/10 bg-slate-800/40 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Input: Shop Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Shop / Business Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Aura Retail Store"
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-bold rounded-xl border border-white/10 bg-slate-800/40 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <Store className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Input: Mobile Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-bold rounded-xl border border-white/10 bg-slate-800/40 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Input: Country Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Base Country & Currency
              </label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="appearance-none w-full pl-10 pr-10 py-2.5 text-xs font-bold rounded-xl border border-white/10 bg-slate-800/40 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.country} value={c.country} className="bg-slate-900 text-white font-semibold">
                      {c.country} ({c.currencyCode} - {c.currencySymbol})
                    </option>
                  ))}
                </select>
                <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-primary/25 hover:opacity-95 focus:outline-none active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Go to Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
