"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  TrendingUp,
  DollarSign,
  CheckCircle,
  ShieldCheck,
  Activity,
  FileText,
  Loader2,
  PlusCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAccounting } from "@/context/AccountingContext";

export default function LandingPage() {
  const { loginWithGoogle } = useAccounting();
  const [loading, setLoading] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({ transform: "rotateX(0deg) rotateY(0deg)" });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await loginWithGoogle();
    // Reset state if OAuth window is closed or blocked
    setTimeout(() => setLoading(false), 3000);
  };

  // 3D Tilt Hover effect on dashboard preview card
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const tiltX = (yc - y) / 18;
    const tiltY = (x - xc) / 18;
    setTiltStyle({
      transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)"
    });
  };

  return (
    <>
      {/* Navbar invokes real Google login directly on sign-in clicks */}
      <Navbar onLoginClick={handleGoogleLogin} />

      <main className="relative min-h-screen bg-brand-bg text-text-primary transition-all duration-300 overflow-x-hidden pt-24 md:pt-32">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-0 right-1/4 w-[60vw] h-[60vw] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-[45vw] h-[45vw] bg-secondary/4 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[50vw] h-[50vw] bg-emerald-500/3 rounded-full blur-[120px] -z-10 pointer-events-none" />

        {/* ── HERO SECTION ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Premium Text Elements */}
            <div className="lg:col-span-6 space-y-8 text-left">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-wider font-display animate-float"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Modern Fintech Ledger Engine</span>
              </motion.div>

              {/* Title & Subtitle */}
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-text-primary tracking-tight leading-[1.05]"
                >
                  Simple. Daily. <br />
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Visually Stunning.
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-lg font-semibold"
                >
                  Simplify daily balance sheet entries. My Accounting parses natural language notes instantly, aggregates cash and online accounts dynamically, and compiles print-ready financial reviews.
                </motion.p>
              </div>

              {/* Primary Google Login CTA Button Only */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="pt-2"
              >
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="group relative inline-flex items-center justify-center space-x-3.5 px-8 py-4.5 rounded-2xl bg-white border border-slate-200 hover:border-primary/40 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-primary/5 transition-all hover:scale-[1.02] active:scale-[0.99] disabled:opacity-85 disabled:cursor-not-allowed cursor-pointer text-xs font-bold uppercase tracking-wider text-text-primary w-full sm:w-auto"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.85-6.277-6.36 0-3.51 2.811-6.36 6.277-6.36 1.497 0 2.87.525 3.957 1.4l3.11-3.15C19.123 2.115 15.932 1 12.24 1 6.032 1 1 6.07 1 12.36s5.032 11.36 11.24 11.36c6.438 0 10.748-4.57 10.748-11.08 0-.69-.06-1.36-.178-2.355H12.24z"/>
                    </svg>
                  )}
                  <span>{loading ? "Connecting to Google…" : "Sign in with Google"}</span>
                </button>
              </motion.div>

              {/* Security indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-center space-x-6 pt-4 text-xs font-bold text-text-secondary border-t border-slate-100/80"
              >
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Secure OAuth 2.0 Direct</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Verified Safe</span>
                </div>
              </motion.div>
            </div>

            {/* Right Column: 3D Interactive Floating Preview Dashboard */}
            <div className="lg:col-span-6 relative perspective-container py-10 flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={tiltStyle}
                className="perspective-element w-full max-w-[480px] bg-slate-900/90 border border-white/10 rounded-3xl p-6 shadow-2xl relative select-none glow-ambient-primary"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/15 rounded-3xl pointer-events-none" />

                {/* Mockup bar */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    <span className="text-[10px] text-slate-500 font-mono tracking-wider ml-2">MY.ACCOUNTING.LEDGER</span>
                  </div>
                  <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg uppercase tracking-wide">
                    Live Demo Preview
                  </span>
                </div>

                {/* Dashboard Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-white/5 border border-white/8 rounded-2xl p-4 text-left">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Revenue</span>
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-xl font-black text-white mt-1.5 tracking-tight">₹84,500</p>
                    <span className="text-[9px] font-bold text-emerald-400">🟢 UPI & Cash combined</span>
                  </div>

                  <div className="bg-white/5 border border-white/8 rounded-2xl p-4 text-left">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Net Profit</span>
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-xl font-black text-white mt-1.5 tracking-tight">₹59,100</p>
                    <span className="text-[9px] font-bold text-cyan-400">70% operating margin</span>
                  </div>
                </div>

                {/* Chart Mockup */}
                <div className="bg-white/3 border border-white/5 rounded-2xl p-4 mb-5 text-left">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-3">Daily Sales Aggregator</span>
                  <div className="h-28 flex items-end justify-between space-x-2 pt-2">
                    {[35, 55, 45, 80, 65, 75, 90, 60, 85, 95].map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center space-y-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${val}%` }}
                          transition={{ duration: 1.2, delay: idx * 0.05 }}
                          className={`w-full rounded-t-sm bg-gradient-to-t ${
                            idx === 6 || idx === 9 
                              ? "from-secondary to-primary" 
                              : "from-emerald-500/50 to-emerald-400"
                          }`}
                        />
                        <span className="text-[8px] text-slate-500 scale-95 font-mono">{20 + idx}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated transactions */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/2 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-white">Stripe online sale</span>
                    </div>
                    <span className="font-bold text-emerald-400">+₹15,000</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/2 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="font-semibold text-white">Electricity Bill</span>
                    </div>
                    <span className="font-bold text-red-400">-₹2,400</span>
                  </div>
                </div>
              </motion.div>

              {/* Decorative float tags */}
              <div className="absolute top-4 -left-6 bg-white/80 border border-slate-200/50 backdrop-blur-md rounded-2xl p-3 shadow-lg flex items-center space-x-2.5 animate-float pointer-events-none">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-xs">₹</div>
                <div className="text-left">
                  <p className="text-[9px] uppercase font-bold text-text-secondary tracking-wide">Cash Flow</p>
                  <p className="text-xs font-black text-text-primary tracking-tight">Daily Rollups</p>
                </div>
              </div>

              <div className="absolute bottom-6 -right-6 bg-white/80 border border-slate-200/50 backdrop-blur-md rounded-2xl p-3.5 shadow-lg flex items-center space-x-3 animate-float-delayed pointer-events-none">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] uppercase font-bold text-text-secondary tracking-wide">Smart AI Parser</p>
                  <p className="text-xs font-black text-text-primary tracking-tight">Auto Keying ✓</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── PREMIUM BENTO FEATURES GRID ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="space-y-4 max-w-3xl mx-auto text-center mb-16">
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary font-display block">SaaS Engine Capabilities</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-text-primary tracking-tight">
              Engineered For Modern Business Audits
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xl mx-auto">
              Combine Apple-level aesthetics with industrial bookkeeping power to track cash flows, online balances, and prepare statements seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Bento box 1: NLP keying (8 cols) */}
            <div className="md:col-span-8 glass-card rounded-3xl p-8 bg-white border border-border-color text-left flex flex-col justify-between hover-lift">
              <div className="space-y-4 max-w-lg">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-xl text-text-primary tracking-tight">Smart Natural Language Keying</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  Key in items like *&quot;Supplier stock 15000 online; water utilities 1400&quot;* in seconds. Our parser separates line items, maps standard Indian categories, and tags payment channels instantly. No spreadsheets required.
                </p>
              </div>
              <div className="pt-8 border-t border-slate-100 flex items-center justify-between text-xs text-text-secondary font-semibold mt-8">
                <span>Auto-categorization & tagging</span>
                <span className="text-primary font-bold">Secure NLP Engine</span>
              </div>
            </div>

            {/* Bento box 2: Google Identity (4 cols) */}
            <div className="md:col-span-4 glass-card rounded-3xl p-8 bg-white border border-border-color text-left flex flex-col justify-between hover-lift">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shadow-inner">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-xl text-text-primary tracking-tight">Google Identity Choice</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Sign in instantly with secure Google OAuth 2.0. No custom passwords to leak, no security compromises. Stored safely inside isolated user buckets.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-text-secondary font-semibold mt-4">
                <span>Google OAuth 2.0</span>
                <span className="text-success font-bold">Encrypted Logs</span>
              </div>
            </div>

            {/* Bento box 3: PDF statements (4 cols) */}
            <div className="md:col-span-4 glass-card rounded-3xl p-8 bg-white border border-border-color text-left flex flex-col justify-between hover-lift">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-xl text-text-primary tracking-tight">CSS Print Reports</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Prepare for tax reviews with sleek, print-styled tabular layouts optimized for PDF compilation. Download clean summaries of balances in one tap.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-text-secondary font-semibold mt-4">
                <span>PDF Statement downloads</span>
                <span className="text-primary font-bold">Audit Friendly</span>
              </div>
            </div>

            {/* Bento box 4: Excel integrations (8 cols) */}
            <div className="md:col-span-8 glass-card rounded-3xl p-8 bg-white border border-border-color text-left flex flex-col justify-between hover-lift">
              <div className="space-y-4 max-w-lg">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-primary flex items-center justify-center shadow-inner">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-xl text-text-primary tracking-tight">Excel Spreadsheet Integrator</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  Need raw data inside corporate analytics platforms? Download complete transaction tables as fully compatible CSV sheets with a single click. Ideal for accountants, auditors, and office managers.
                </p>
              </div>
              <div className="pt-8 border-t border-slate-100 flex items-center justify-between text-xs text-text-secondary font-semibold mt-8">
                <span>One-click CSV exports</span>
                <span className="text-secondary font-bold">Excel & Sheets compatible</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── HOW TO USE SECTION ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-slate-100/50">
          <div className="space-y-4 max-w-3xl mx-auto text-center mb-16">
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary font-display block">Quick Setup Guide</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-text-primary tracking-tight">
              Get Started In Five Simple Steps
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xl mx-auto">
              Follow this quick visual flow to register your business and automate daily account tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="glass-card rounded-3xl p-6 bg-white border border-border-color hover-lift flex flex-col justify-between h-full"
            >
              <div>
                <span className="text-xs font-black text-primary/30 uppercase font-mono mb-2 block">Step 01</span>
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-sm text-text-primary mb-1">Sign In Securely</h3>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Authenticate instantly with your Google account. Zero password setup, fully private and encrypted.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="glass-card rounded-3xl p-6 bg-white border border-border-color hover-lift flex flex-col justify-between h-full"
            >
              <div>
                <span className="text-xs font-black text-primary/30 uppercase font-mono mb-2 block">Step 02</span>
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-sm text-text-primary mb-1">Add Daily Entries</h3>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Type sentences naturally (NLP) or log balances manually. Splits cash vs online streams automatically.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="glass-card rounded-3xl p-6 bg-white border border-border-color hover-lift flex flex-col justify-between h-full"
            >
              <div>
                <span className="text-xs font-black text-primary/30 uppercase font-mono mb-2 block">Step 03</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-display font-bold text-sm text-text-primary mb-1">Automate Profit/Loss</h3>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  The engine processes totals, deducts expenses, and lists operating margins instantly without error.
                </p>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="glass-card rounded-3xl p-6 bg-white border border-border-color hover-lift flex flex-col justify-between h-full"
            >
              <div>
                <span className="text-xs font-black text-primary/30 uppercase font-mono mb-2 block">Step 04</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-primary flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-sm text-text-primary mb-1">Generate Statements</h3>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Generate print-styled statements for tax reviews, and export CSV sheets to Excel in one click.
                </p>
              </div>
            </motion.div>

            {/* Step 5 */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="glass-card rounded-3xl p-6 bg-white border border-border-color hover-lift flex flex-col justify-between h-full"
            >
              <div>
                <span className="text-xs font-black text-primary/30 uppercase font-mono mb-2 block">Step 05</span>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5 text-cyan-600" />
                </div>
                <h3 className="font-display font-bold text-sm text-text-primary mb-1">Analyze Growth</h3>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Track dynamic month-on-month charts, monitor operating ratios, and drive strategic business growth.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── CALL TO ACTION SECTION ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <div className="glass-card rounded-3xl p-10 md:p-16 bg-gradient-to-tr from-primary/5 to-secondary/5 border border-border-color relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-1/4 w-[30vw] h-[30vw] bg-primary/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
            
            <h2 className="font-display font-black text-3xl sm:text-4xl text-text-primary tracking-tight">
              Manage your business balances today
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
              Launch your secure corporate space instantly. Sign in with Google to aggregate daily accounts cleanly in under 2 minutes.
            </p>
            
            <div className="pt-4 flex justify-center">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="group relative inline-flex items-center justify-center space-x-3 px-8 py-4.5 rounded-2xl bg-white border border-slate-200 hover:border-primary/40 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-primary/5 transition-all hover-lift disabled:opacity-85 cursor-pointer text-xs font-bold uppercase tracking-wider text-text-primary"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.85-6.277-6.36 0-3.51 2.811-6.36 6.277-6.36 1.497 0 2.87.525 3.957 1.4l3.11-3.15C19.123 2.115 15.932 1 12.24 1 6.032 1 1 6.07 1 12.36s5.032 11.36 11.24 11.36c6.438 0 10.748-4.57 10.748-11.08 0-.69-.06-1.36-.178-2.355H12.24z"/>
                  </svg>
                )}
                <span>{loading ? "Connecting to Google…" : "Sign in with Google"}</span>
              </button>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}