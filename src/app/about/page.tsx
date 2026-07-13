"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Heart, 
  Sparkles, 
  TrendingUp, 
  HelpCircle,
  Clock,
  ArrowRight,
  BookOpen
} from "lucide-react";

import { useAccounting } from "@/context/AccountingContext";

export default function AboutPage() {
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

  const values = [
    {
      icon: Heart,
      title: "Designed for People",
      desc: "Accounting doesn't need to be dry or frustrating. We build clean, lightweight interfaces that make daily bookkeeping a delight for store owners and startup founders.",
      accent: "text-primary bg-primary/5"
    },
    {
      icon: ShieldCheck,
      title: "Private Sandboxes",
      desc: "Your records, transactions, and business statistics belong entirely to you. Stored inside secure vaults and completely protected from advertisement scrapers.",
      accent: "text-emerald-500 bg-emerald-500/5"
    },
    {
      icon: Sparkles,
      title: "Stripe-Level Detail",
      desc: "We prioritize typography, HSL-harmonized themes, and spring physics. Every button press, toggle, and ledger transaction feels responsive and modern.",
      accent: "text-secondary bg-secondary/5"
    }
  ];

  const processSteps = [
    {
      phase: "01",
      title: "The Spreadsheet Trap",
      desc: "Legacy systems rely on massive cell grids, manual formatting, and error-prone formulas. Store owners lose hours of productive time mapping cash flow splits.",
      icon: Clock,
      color: "border-rose-200 bg-rose-50/50 text-rose-500"
    },
    {
      phase: "02",
      title: "The Simple Ledger Shift",
      desc: "My Accounting simplifies logging to a single-line flow. Type transactions in natural sentences (NLP) or key them in via optimized numeric fields in seconds.",
      icon: BookOpen,
      color: "border-primary/20 bg-primary/5 text-primary"
    },
    {
      phase: "03",
      title: "Automated Profit Clarity",
      desc: "Instant ledger processing provides dynamic net P/L statements, operating margin charts, and clean PDF compilations ready for audit reviews.",
      icon: TrendingUp,
      color: "border-emerald-200 bg-emerald-50/50 text-emerald-500"
    }
  ];

  return (
    <>
      <Navbar />

      <main className="relative min-h-screen pt-24 pb-16 overflow-hidden bg-brand-bg transition-all duration-300">
        {/* Ambient glows */}
        <div className="absolute top-0 right-1/4 w-[60vw] h-[60vw] bg-primary/4 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-1/4 left-10 w-[50vw] h-[50vw] bg-secondary/3 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          {/* Header */}
          <div className="space-y-4 max-w-3xl mx-auto mb-16">
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary font-display block">
              Corporate Mission
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-text-primary tracking-tight leading-tight">
              Empowering Small Businesses & Founders
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xl mx-auto font-semibold">
              Our purpose is to eliminate spreadsheet complexity. My Accounting provides shop keepers, merchants, and digital founders with elegant, instant accounting rollups.
            </p>
          </div>

          {/* Core narrative card */}
          <div className="glass-card rounded-3xl p-8 md:p-10 border border-border-color text-left bg-white max-w-4xl mx-auto mb-20 space-y-6 hover-lift">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md">
                <HelpCircle className="w-5.5 h-5.5" />
              </div>
              <h2 className="font-display font-black text-xl sm:text-2xl text-text-primary tracking-tight">
                Why We Built My Accounting
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-semibold">
              We noticed store owners and small business managers spend hours navigating complex, dry ERP systems or typing cash entries in messy notebooks. The risk of entry mistakes, miscalculated expenses, and lost statements is high.
            </p>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-semibold">
              My Accounting was engineered to fix this. By blending modern fintech aesthetics, intelligent Natural Language (NLP) text processing, and clean mobile-first sheets, we made daily accounting feel fast, simple, and visually beautiful.
            </p>
          </div>

          {/* Timeline Section */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="space-y-4 text-center mb-12">
              <span className="text-[10px] uppercase font-bold tracking-widest text-secondary font-display block">The Bookkeeping Evolution</span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight">
                Advancing Digital Bookkeeping
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              {processSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="glass-card rounded-3xl p-6 bg-white border border-border-color hover-lift relative"
                  >
                    {/* Header circle indicator */}
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${step.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-slate-300 font-mono">Phase {step.phase}</span>
                    </div>

                    <h3 className="font-display font-extrabold text-base text-text-primary mb-2">
                      {step.title}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                      {step.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Values Grid */}
          <div className="space-y-4 text-center mb-12">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 font-display block">Our Foundations</span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight">
              Values We Live By
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto mb-16">
            {values.map((val, idx) => {
              const Icon = val.icon;
              return (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="glass-card p-6 border border-border-color rounded-3xl bg-white hover-lift flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner mb-4 ${val.accent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-bold text-base text-text-primary mb-2 tracking-tight">
                      {val.title}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                      {val.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA Banner */}
          <div className="mt-16 md:mt-24 text-center">
            <button
              onClick={handleCTA}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider rounded-2xl hover:shadow-lg transition-all hover-lift inline-flex items-center space-x-2.5 mx-auto cursor-pointer"
            >
              <span>{loading ? "Connecting to Google..." : "Launch Your Dashboard"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
