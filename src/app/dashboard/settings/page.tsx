"use client";

import React, { useState } from "react";

import {
  Settings,
  User,
  Briefcase,
  Globe,
  Save,
  ShieldCheck,
  Phone,
  Wallet
} from "lucide-react";
import { useAccounting, SUPPORTED_COUNTRIES } from "@/context/AccountingContext";

export default function SettingsPage() {
  const { user, updateSettings } = useAccounting();

  // Settings states initialized with user context
  const [shopName, setShopName] = useState(user?.businessName || "My Retail Shop");
  const [userName, setUserName] = useState(user?.name || "Corporate Owner");
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || "");
  const [selectedCountry, setSelectedCountry] = useState(user?.country || "India");
  const [startingBalance, setStartingBalance] = useState(user?.startingBalance || 0);

  const [isSaved, setIsSaved] = useState(false);

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
      startingBalance: Number(startingBalance) || 0,
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };


  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-color pb-6">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight">
            System Preferences
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Manage shop profile credentials, base currency settings, and system values.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Settings Form (8 cols) */}
        <div className="lg:col-span-8">
          <div className="glass-card rounded-3xl p-6 md:p-8 bg-white border border-border-color shadow-md text-left">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-center space-x-3 border-b border-border-color pb-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-text-primary">Business Settings</h3>
                  <p className="text-[10px] text-text-secondary">Configure corporate information and base country values</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* User Name */}
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
                      className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary"
                    />
                    <User className="w-4 h-4 text-text-secondary absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* Shop Name */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">
                    Shop / Corporate Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary"
                    />
                    <Briefcase className="w-4 h-4 text-text-secondary absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary"
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
                      className="appearance-none w-full pl-9 pr-10 py-2.5 text-xs font-semibold rounded-xl border border-border-color bg-slate-50 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
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
                      className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary"
                    />
                    <Wallet className="w-4 h-4 text-text-secondary absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border-color">
                {isSaved ? (
                  <span className="text-xs font-bold text-success animate-pulse">
                    ✓ Configuration saved and locked!
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg transition-all hover-lift active:scale-98 text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Lock Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-border-color bg-white text-left space-y-4">
            <h4 className="text-xs font-bold text-text-primary flex items-center space-x-1.5 border-b border-border-color pb-3">
              <ShieldCheck className="w-4 h-4 text-success" />
              <span>Data Security</span>
            </h4>
            <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
              <p>
                Your data is stored securely in Supabase with Row Level Security enabled.
              </p>
              <p>
                Only your authenticated Google account can access your business records.
                No other user can view your data.
              </p>
              <div className="flex items-center space-x-1.5 mt-2 text-success font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>RLS enforced · Data isolated · Private workspace</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
