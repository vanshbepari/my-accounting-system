"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, User, Store, Phone, Globe, ChevronRight, Loader2, Mail, Sparkles } from "lucide-react";
import { useAccounting, SUPPORTED_COUNTRIES } from "@/context/AccountingContext";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { user, isAuthReady, updateSettings, saveTargets, saveForecastSettings } = useAccounting();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Form states
  const [ownerName, setOwnerName] = useState("");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [country, setCountry] = useState("India");

  useEffect(() => {
    if (isAuthReady) {
      // Check both context state and localStorage cache for permanent bypass
      const localOnboarded = user?.id ? localStorage.getItem(`onboarded_${user.id}`) === "true" : false;

      if (!user?.isLoggedIn) {
        router.replace("/login");
      } else if (user?.onboarded || localOnboarded) {
        router.replace("/dashboard");
      } else {
        // Pre-populate owner name and email from OAuth metadata if available
        setOwnerName(user.name || "");
        setEmail(user.email || "");
      }
    }
  }, [isAuthReady, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !shopName.trim() || !email.trim() || !mobileNumber.trim() || !country) return;

    setLoading(true);

    const matchedCountry = SUPPORTED_COUNTRIES.find(c => c.country === country);
    const currencyCode = matchedCountry?.currencyCode || "INR";
    const currencySymbol = matchedCountry?.currencySymbol || "₹";

    try {
      // Set local storage cache immediately for instant permanent bypass
      if (user?.id && typeof window !== "undefined") {
        localStorage.setItem(`onboarded_${user.id}`, "true");
      }

      await updateSettings({
        ownerName: ownerName.trim(),
        businessName: shopName.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        country,
        currencyCode,
        currencySymbol,
        startingBalance: 0,
        onboarded: true
      });

      // Initialize default targeting & forecasting records for new workspace
      try {
        await saveTargets(0, 0, 0);
        await saveForecastSettings(0, 0, 3);
      } catch (err) {
        console.error("[Onboarding] Failed to save target/forecast defaults:", err);
      }

      // Hard navigation to dashboard
      window.location.replace("/dashboard");
    } catch (err) {
      console.error("[Onboarding] Submission failed:", err);
      setLoading(false);
    }
  };

  const isAlreadyOnboarded = Boolean(
    user?.onboarded || (user?.id && typeof window !== "undefined" && localStorage.getItem(`onboarded_${user.id}`) === "true")
  );

  if (!isAuthReady || !user || isAlreadyOnboarded) {
    return null;
  }

  return (
    <main className="relative min-h-screen flex flex-col justify-center items-center bg-slate-950 overflow-hidden py-12 px-4 sm:px-6 lg:px-8 text-left">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[55vw] h-[55vw] bg-primary/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[55vw] h-[55vw] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-lg w-full z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header Badge & Title */}
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold mb-4 shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Workspace Setup</span>
              <Sparkles className="w-3 h-3 text-primary shrink-0" />
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
              Create Your Profile
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed font-semibold">
              Complete these workspace fields once to initialize your localized accounting ledger.
            </p>
          </div>

          {/* Setup Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {/* Input: Owner's Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Owner's Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-3 text-xs font-bold rounded-xl border border-slate-800 bg-slate-950/60 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-slate-600"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Input: Shop Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Shop / Business Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Aura Retail Store"
                  className="w-full pl-10 pr-4 py-3 text-xs font-bold rounded-xl border border-slate-800 bg-slate-950/60 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-slate-600"
                />
                <Store className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Input: Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. owner@example.com"
                  className="w-full pl-10 pr-4 py-3 text-xs font-bold rounded-xl border border-slate-800 bg-slate-950/60 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-slate-600"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Input: Mobile Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full pl-10 pr-4 py-3 text-xs font-bold rounded-xl border border-slate-800 bg-slate-950/60 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-slate-600"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Input: Country Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Base Country & Currency
              </label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="appearance-none w-full pl-10 pr-10 py-3 text-xs font-bold rounded-xl border border-slate-800 bg-slate-950/60 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer transition-all"
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
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-xl hover:shadow-primary/25 hover:opacity-95 focus:outline-none active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Go to Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
