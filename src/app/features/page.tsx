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
      title: "Easy Daily Accounting",
      tagline: "Speed",
      desc: "Log daily sales and store expenses in seconds. Designed for shop owners—no accounting degree required.",
      className: "md:col-span-8",
      benefits: ["Instant daily logging", "Simple number inputs", "Fast & responsive ledger"],
      accent: "text-primary bg-primary/5"
    },
    {
      icon: DollarSign,
      title: "Cash & Online Sales Tracker",
      tagline: "Channels",
      desc: "Track online payments (UPI, cards, QR codes) separately from cash register receipts automatically.",
      className: "md:col-span-4",
      benefits: ["Cash drawer matching", "UPI & Card breakdown", "Split-channel summary"],
      accent: "text-emerald-500 bg-emerald-500/5"
    },
    {
      icon: Activity,
      title: "Automatic Profit & Loss",
      tagline: "Formulas",
      desc: "Calculate total revenue, subtract itemized expenses, and view your net profit margin in real time.",
      className: "md:col-span-4",
      benefits: ["Instant profit calculation", "Automatic cost deduction", "Margin health alerts"],
      accent: "text-secondary bg-secondary/5"
    },
    {
      icon: FileText,
      title: "Smart Expense Categorization",
      tagline: "Categories",
      desc: "Automatically organize costs into categories like store rent, inventory stock, gas, utilities, and staff wages.",
      className: "md:col-span-8",
      benefits: ["Smart auto-tagging", "Custom expense groups", "Clear itemized records"],
      accent: "text-indigo-500 bg-indigo-500/5"
    },
    {
      icon: FileBarChart2,
      title: "Printable Monthly PDF Reports",
      tagline: "Tax-Ready",
      desc: "Download clean, professional accounting summaries formatted specifically for printing or sending to your CA.",
      className: "md:col-span-8",
      benefits: ["One-click PDF downloads", "Monthly/Yearly balance summaries", "CA & Tax review friendly"],
      accent: "text-cyan-500 bg-cyan-500/5"
    },
    {
      icon: TrendingUp,
      title: "Excel & Google Sheets Export",
      tagline: "Data Portability",
      desc: "Export your entire ledger history to standard CSV files compatible with Microsoft Excel and Google Sheets.",
      className: "md:col-span-4",
      benefits: ["One-tap spreadsheet export", "Complete transaction history", "Shareable with accountants"],
      accent: "text-purple-500 bg-purple-500/5"
    },
    {
      icon: ShieldCheck,
      title: "Safe Google Login & Encryption",
      tagline: "Security",
      desc: "Sign in securely with your Google account. Your financial data is private, encrypted, and isolated.",
      className: "md:col-span-4",
      benefits: ["No passwords to remember", "Secure Google Authentication", "100% Private Business Records"],
      accent: "text-rose-500 bg-rose-500/5"
    },
    {
      icon: Sparkles,
      title: "Simple Financial Dashboard",
      tagline: "Overview",
      desc: "View monthly revenue trends, operating profit margins, and spending alerts on a single, easy-to-read screen.",
      className: "md:col-span-8",
      benefits: ["Instant financial stats", "Monthly calendar filter", "Budget limit alerts"],
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
              Software Features
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-text-primary tracking-tight leading-tight">
              Designed For Small & Medium Businesses
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xl mx-auto font-semibold">
              Everything you need to track daily sales, record expenses, monitor profit margins, and manage shop accounts effortlessly.
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
