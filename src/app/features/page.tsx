"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  Zap, 
  TrendingUp, 
  FileBarChart2, 
  ShieldCheck, 
  ArrowRight,
  DollarSign,
  Activity,
  FileText,
  Sparkles
} from "lucide-react";

import { useAccounting } from "@/context/AccountingContext";

export default function FeaturesPage() {
  const { user, loginWithGoogle } = useAccounting();
  const [loading, setLoading] = useState(false);

  const handleCTA = async () => {
    if (user?.isLoggedIn) {
      window.location.replace("/dashboard");
    } else {
      setLoading(true);
      await loginWithGoogle();
      setTimeout(() => setLoading(false), 3000);
    }
  };

  const bentoFeatures = [
    {
      icon: Zap,
      title: "Daily Ledger System",
      tagline: "Speed",
      desc: "Log daily sales and store expenses in seconds. No complex double-entry accounting training required.",
      className: "md:col-span-8",
      benefits: ["Double-entry auto mapping", "Keyboard-optimized inputs", "Zero lag ledger saves"],
      accent: "text-primary bg-primary/5"
    },
    {
      icon: DollarSign,
      title: "UPI & Cash Splits",
      tagline: "Channels",
      desc: "Track online payments (Stripe, UPI, cards) separately from cash desk receipts dynamically.",
      className: "md:col-span-4",
      benefits: ["Cash desk balance match", "UPI/Card reconciliation", "Split-channel charts"],
      accent: "text-emerald-500 bg-emerald-500/5"
    },
    {
      icon: Activity,
      title: "Automated P/L Engine",
      tagline: "Formulas",
      desc: "Calculate revenues, calculate operating margins, and compile net profits instantly on save.",
      className: "md:col-span-4",
      benefits: ["Real-time formula audits", "Automatic cost deductions", "Margin health alerts"],
      accent: "text-secondary bg-secondary/5"
    },
    {
      icon: FileText,
      title: "Smart Expense Categories",
      tagline: "Tax Mapping",
      desc: "Automatically map expenses like store rent, inventory supplies, and utilities with keyword detection.",
      className: "md:col-span-8",
      benefits: ["Keyword auto categorization", "GST tax group mapping", "Custom ledger tags"],
      accent: "text-indigo-500 bg-indigo-500/5"
    },
    {
      icon: FileBarChart2,
      title: "Tax-Ready PDF Reports",
      tagline: "Compliance",
      desc: "Compile clean, professional accounting summaries formatted specifically for browser print-to-PDF styles.",
      className: "md:col-span-8",
      benefits: ["CSS print layout optimization", "Monthly/Yearly balance summaries", "Shareable audit PDFs"],
      accent: "text-cyan-500 bg-cyan-500/5"
    },
    {
      icon: TrendingUp,
      title: "Excel CSV Exporter",
      tagline: "Data Portability",
      desc: "Download complete history as standard spreadsheets compatible with Microsoft Excel and Google Sheets.",
      className: "md:col-span-4",
      benefits: ["One-tap ledger download", "Fully normalized data rows", "Accountant friendly schema"],
      accent: "text-purple-500 bg-purple-500/5"
    },
    {
      icon: ShieldCheck,
      title: "Secure Google OAuth",
      tagline: "Identity",
      desc: "Verify identity and secure bookkeeping vaults using standard Google corporate handshake protocols.",
      className: "md:col-span-4",
      benefits: ["No password storage leaks", "Google OAuth 2.0 direct", "Session cookie boundaries"],
      accent: "text-rose-500 bg-rose-500/5"
    },
    {
      icon: Sparkles,
      title: "Real-time Metrics Dashboard",
      tagline: "Audits",
      desc: "Monitor month-on-month revenues, dynamic sales trends, and cash flow alerts in one location.",
      className: "md:col-span-8",
      benefits: ["Instant metric counters", "Comparative calendar tabs", "Ambient neon warning indicators"],
      accent: "text-amber-500 bg-amber-500/5"
    }
  ];

  return (
    <>
      <Navbar />

      <main className="relative min-h-screen pt-24 pb-16 overflow-hidden bg-brand-bg transition-all duration-300">
        {/* Decorative glows */}
        <div className="absolute top-0 right-1/4 w-[60vw] h-[60vw] bg-primary/4 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-1/4 left-10 w-[50vw] h-[50vw] bg-secondary/3 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          {/* Header */}
          <div className="space-y-4 max-w-3xl mx-auto mb-16">
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary font-display block">
              Engine Capabilities
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-text-primary tracking-tight leading-tight">
              Designed For High-Growth Businesses
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xl mx-auto font-semibold">
              Everything you need to audit, log, and inspect daily accounting balances without spreadsheets or cluttered ERP software.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
            {bentoFeatures.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: (idx % 3) * 0.08 }}
                  className={`glass-card rounded-3xl p-6 md:p-8 bg-white border border-border-color hover-lift flex flex-col justify-between ${item.className}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-inner ${item.accent}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] bg-slate-100/80 border border-slate-200/40 text-text-secondary font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        {item.tagline}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h2 className="font-display font-bold text-lg text-text-primary tracking-tight">
                        {item.title}
                      </h2>
                      <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-6 mt-6 border-t border-slate-100/80">
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {item.benefits.map((b, i) => (
                        <li key={i} className="flex items-center space-x-2 text-[10px] text-text-secondary font-bold">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="truncate">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom callout */}
          <div className="mt-20 glass-card rounded-3xl p-8 md:p-12 bg-gradient-to-tr from-primary/5 to-secondary/5 border border-border-color/60 max-w-4xl mx-auto text-center space-y-6">
            <h2 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight">
              Ready to automate your daily balances?
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto leading-relaxed font-semibold">
              Launch your corporate trial instantly. Secure Google login aggregates transactions cleanly in under 2 minutes.
            </p>
            <button
              onClick={handleCTA}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider rounded-2xl hover:shadow-lg transition-all hover-lift inline-flex items-center space-x-2.5 mx-auto cursor-pointer disabled:opacity-80"
            >
              <span>{loading ? "Connecting to Google..." : "Get Started Now"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
