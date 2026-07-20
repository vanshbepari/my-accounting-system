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
  PlusCircle,
  Star,
  Users,
  Building2,
  Quote
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

  // Customer Reviews / Testimonials Mock Data
  const customerReviews = [
    {
      name: "Ramesh Patel",
      role: "Owner, Patel Provision Store",
      city: "Ahmedabad, Gujarat",
      avatarBg: "bg-emerald-500",
      rating: 5,
      review: "I used to spend 3 hours every Sunday night organizing paper bills and notebooks. Now I log daily sales in 2 minutes, and my net profit is calculated automatically!"
    },
    {
      name: "Ananya Sharma",
      role: "Founder, Ananya Fashion Boutique",
      city: "Bengaluru, Karnataka",
      avatarBg: "bg-indigo-500",
      rating: 5,
      review: "The AI Quick Parser is a lifesaver! I copy-paste my daily WhatsApp sales notes and it automatically categorizes UPI vs cash payments. Saves me 5+ hours every week."
    },
    {
      name: "Vikram Malhotra",
      role: "Manager, Malhotra Electricals",
      city: "New Delhi, NCR",
      avatarBg: "bg-purple-500",
      rating: 5,
      review: "Finally an accounting app designed for shop owners instead of accountants! Setting monthly budget limits helps keep our store expenditures under control."
    },
    {
      name: "Priya Nair",
      role: "Owner, Green Leaf Cafe",
      city: "Kochi, Kerala",
      avatarBg: "bg-cyan-500",
      rating: 5,
      review: "Downloading tax-ready PDF reports for my CA takes just one click. Simple, reliable, and extremely easy to use for small business owners!"
    }
  ];

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
              {/* Badge featuring 5,000+ Happy Users */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-extrabold uppercase tracking-wider font-display"
              >
                <Users className="w-4 h-4 text-primary" />
                <span>Trusted by 5,000+ Happy Business Owners</span>
              </motion.div>

              {/* Title & Subtitle */}
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-text-primary tracking-tight leading-[1.05]"
                >
                  Simple Accounting <br />
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    For All Businesses.
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-lg font-semibold"
                >
                  Effortlessly track daily income, record itemized store expenses, separate cash and online sales, and view exact profit margins—no accounting background required.
                </motion.p>
              </div>

              {/* Primary Google Login CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4"
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
                      <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.85-6.277-6.36 0-3.51 2.811-6.36 6.277-6.36 1.497 0 2.87.525 3.957 1.4l3.11-3.15C19.123 2.115 15.932 1 12.24 1 6.032 1 1 6.07 1 12.36s5.032 11.36 11.24 11.36c6.438 0 10.748-4.57 10.748-11.08 0-.69-.06-1.36-.178-2.355H12.24z" />
                    </svg>
                  )}
                  <span>{loading ? "Connecting to Google…" : "Sign in with Google"}</span>
                </button>

                {/* Micro User Count Callout */}
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 bg-slate-100/80 px-3.5 py-2 rounded-xl border border-slate-200/60">
                  <div className="flex -space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[9px] text-white font-black">RP</span>
                    <span className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-[9px] text-white font-black">AS</span>
                    <span className="w-6 h-6 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-[9px] text-white font-black">VM</span>
                  </div>
                  <span>Join 5,000+ business owners</span>
                </div>
              </motion.div>

              {/* Security indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap items-center gap-6 pt-4 text-xs font-bold text-text-secondary border-t border-slate-100/80"
              >
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>100% Private & Encrypted</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Zero Setup Fees</span>
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
                    <span className="text-[10px] text-slate-500 font-mono tracking-wider ml-2">SHOP.ACCOUNTING.DASHBOARD</span>
                  </div>
                  <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg uppercase tracking-wide">
                    Live Dashboard Preview
                  </span>
                </div>

                {/* Dashboard Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-white/5 border border-white/8 rounded-2xl p-4 text-left">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Today's Revenue</span>
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-xl font-black text-white mt-1.5 tracking-tight">₹84,500</p>
                    <span className="text-[9px] font-bold text-emerald-400">🟢 UPI & Cash Combined</span>
                  </div>

                  <div className="bg-white/5 border border-white/8 rounded-2xl p-4 text-left">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Net Profit</span>
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-xl font-black text-white mt-1.5 tracking-tight">₹59,100</p>
                    <span className="text-[9px] font-bold text-cyan-400">70% Operating Margin</span>
                  </div>
                </div>

                {/* Chart Mockup */}
                <div className="bg-white/3 border border-white/5 rounded-2xl p-4 mb-5 text-left">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-3">Daily Sales Trend</span>
                  <div className="h-28 flex items-end justify-between space-x-2 pt-2">
                    {[35, 55, 45, 80, 65, 75, 90, 60, 85, 95].map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center space-y-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${val}%` }}
                          transition={{ duration: 1.2, delay: idx * 0.05 }}
                          className={`w-full rounded-t-sm bg-gradient-to-t ${idx === 6 || idx === 9
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
                      <span className="font-semibold text-white">UPI / Online Daily Sales</span>
                    </div>
                    <span className="font-bold text-emerald-400">+₹15,000</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/2 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="font-semibold text-white">Store Electricity Bill</span>
                    </div>
                    <span className="font-bold text-red-400">-₹2,400</span>
                  </div>
                </div>
              </motion.div>

              {/* Decorative float tags */}
              <div className="absolute top-4 -left-6 bg-white/80 border border-slate-200/50 backdrop-blur-md rounded-2xl p-3 shadow-lg flex items-center space-x-2.5 animate-float pointer-events-none">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-xs">₹</div>
                <div className="text-left">
                  <p className="text-[9px] uppercase font-bold text-text-secondary tracking-wide">Daily Cash Flow</p>
                  <p className="text-xs font-black text-text-primary tracking-tight">Auto Calculated</p>
                </div>
              </div>

              <div className="absolute bottom-6 -right-6 bg-white/80 border border-slate-200/50 backdrop-blur-md rounded-2xl p-3.5 shadow-lg flex items-center space-x-3 animate-float-delayed pointer-events-none">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] uppercase font-bold text-text-secondary tracking-wide">Quick AI Parser</p>
                  <p className="text-xs font-black text-text-primary tracking-tight">Auto Form Fill ✓</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── BENTO FEATURES GRID (Simplified SMB Language) ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 max-w-3xl mx-auto text-center mb-16"
          >
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary font-display block">Key Software Capabilities</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-text-primary tracking-tight">
              Everything Your Business Needs To Stay Profitable
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xl mx-auto font-semibold">
              No complex accounting jargon. Log daily income, record expenses, track net profits, and print monthly reports effortlessly.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* Bento box 1: Smart Quick Parser (8 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-8 glass-card rounded-3xl p-8 bg-white border border-border-color text-left flex flex-col justify-between shadow-sm hover:shadow-xl transition-shadow duration-300"
            >
              <div className="space-y-4 max-w-lg">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-xl text-text-primary tracking-tight">AI Quick Parser</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-semibold">
                  Type sentences in plain English like <em>&quot;Stock supply 15000 online, Store rent 8000 cash&quot;</em>. Our quick parser automatically splits expenses, categorizes items, and fills out your form instantly.
                </p>
              </div>
              <div className="pt-8 border-t border-slate-100 flex items-center justify-between text-xs text-text-secondary font-semibold mt-8">
                <span>Automatic text parsing & categorization</span>
                <span className="text-primary font-bold">Fast & Simple</span>
              </div>
            </motion.div>

            {/* Bento box 2: Google Sign-in Security (4 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-4 glass-card rounded-3xl p-8 bg-white border border-border-color text-left flex flex-col justify-between shadow-sm hover:shadow-xl transition-shadow duration-300"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shadow-inner">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-xl text-text-primary tracking-tight">100% Private & Secure</h3>
                <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                  Sign in safely with your Google account. Your financial records are encrypted and completely private. Only you can view your shop data.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-text-secondary font-semibold mt-4">
                <span>Google OAuth Sign-In</span>
                <span className="text-success font-bold">Encrypted Vault</span>
              </div>
            </motion.div>

            {/* Bento box 3: PDF Statements (4 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-4 glass-card rounded-3xl p-8 bg-white border border-border-color text-left flex flex-col justify-between shadow-sm hover:shadow-xl transition-shadow duration-300"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-xl text-text-primary tracking-tight">Printable PDF Reports</h3>
                <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                  Generate clean, professional accounting summaries formatted specifically for printing or sending to your CA during tax season.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-text-secondary font-semibold mt-4">
                <span>One-Click PDF Download</span>
                <span className="text-primary font-bold">Tax-Ready</span>
              </div>
            </motion.div>

            {/* Bento box 4: Excel Exporter (8 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.45, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-8 glass-card rounded-3xl p-8 bg-white border border-border-color text-left flex flex-col justify-between shadow-sm hover:shadow-xl transition-shadow duration-300"
            >
              <div className="space-y-4 max-w-lg">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-primary flex items-center justify-center shadow-inner">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-xl text-text-primary tracking-tight">Excel & CSV Exports</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-semibold">
                  Need raw data for spreadsheet analysis? Export your complete transaction history to Excel or Google Sheets with a single click anytime.
                </p>
              </div>
              <div className="pt-8 border-t border-slate-100 flex items-center justify-between text-xs text-text-secondary font-semibold mt-8">
                <span>Instant CSV Downloads</span>
                <span className="text-secondary font-bold">Excel & Sheets Compatible</span>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ── MOCK CUSTOMER REVIEWS / TESTIMONIALS SECTION ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-slate-100/60 bg-gradient-to-b from-transparent via-primary/2 to-transparent">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 max-w-3xl mx-auto text-center mb-16"
          >
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary font-display block">Customer Reviews</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-text-primary tracking-tight">
              Loved By Over 5,000 Small Business Owners
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xl mx-auto font-semibold">
              Here is what store managers, boutique founders, and retail merchants say about simplifying their daily bookkeeping.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {customerReviews.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -6, scale: 1.015 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.45, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card rounded-3xl p-7 bg-white border border-border-color shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between space-y-6 relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 text-slate-200/60 pointer-events-none">
                  <Quote className="w-12 h-12" />
                </div>

                <div className="space-y-3 relative z-10">
                  {/* Star Rating */}
                  <div className="flex items-center space-x-1">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed italic">
                    &quot;{item.review}&quot;
                  </p>
                </div>

                <div className="flex items-center space-x-3.5 pt-4 border-t border-slate-100 relative z-10">
                  <div className={`w-11 h-11 rounded-2xl ${item.avatarBg} text-white flex items-center justify-center font-display font-black text-sm shadow-md shrink-0`}>
                    {item.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-text-primary">{item.name}</h4>
                    <p className="text-[11px] text-text-secondary font-medium">{item.role} • <span className="text-slate-400">{item.city}</span></p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS SECTION (SMB Guided Steps) ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-slate-100/50">
          <div className="space-y-4 max-w-3xl mx-auto text-center mb-16">
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary font-display block">Simple 5-Step Process</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-text-primary tracking-tight">
              Get Started In 2 Minutes
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xl mx-auto font-semibold">
              Follow this quick flow to sign in, record daily entries, and track your business profits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="glass-card rounded-3xl p-6 bg-white border border-border-color hover-lift flex flex-col justify-between h-full text-left"
            >
              <div>
                <span className="text-xs font-black text-primary/30 uppercase font-mono mb-2 block">Step 01</span>
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-sm text-text-primary mb-1">Google Sign-In</h3>
                <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                  Sign in securely with your Google account. No password setup required.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="glass-card rounded-3xl p-6 bg-white border border-border-color hover-lift flex flex-col justify-between h-full text-left"
            >
              <div>
                <span className="text-xs font-black text-primary/30 uppercase font-mono mb-2 block">Step 02</span>
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-sm text-text-primary mb-1">Add Daily Entries</h3>
                <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                  Record daily sales and itemized store costs using simple inputs or AI text parsing.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="glass-card rounded-3xl p-6 bg-white border border-border-color hover-lift flex flex-col justify-between h-full text-left"
            >
              <div>
                <span className="text-xs font-black text-primary/30 uppercase font-mono mb-2 block">Step 03</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-display font-bold text-sm text-text-primary mb-1">View Net Profit</h3>
                <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                  The system calculates total revenue, deducts expenses, and shows your net profit.
                </p>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="glass-card rounded-3xl p-6 bg-white border border-border-color hover-lift flex flex-col justify-between h-full text-left"
            >
              <div>
                <span className="text-xs font-black text-primary/30 uppercase font-mono mb-2 block">Step 04</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-primary flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-sm text-text-primary mb-1">Download Reports</h3>
                <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                  Print clean PDF monthly reports for your accountant or download CSV files.
                </p>
              </div>
            </motion.div>

            {/* Step 5 */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="glass-card rounded-3xl p-6 bg-white border border-border-color hover-lift flex flex-col justify-between h-full text-left"
            >
              <div>
                <span className="text-xs font-black text-primary/30 uppercase font-mono mb-2 block">Step 05</span>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5 text-cyan-600" />
                </div>
                <h3 className="font-display font-bold text-sm text-text-primary mb-1">Grow Your Business</h3>
                <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                  Set target goals, manage budget limits, and watch your business margins improve.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── CALL TO ACTION SECTION ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <div className="glass-card rounded-3xl p-10 md:p-16 bg-gradient-to-tr from-primary/5 to-secondary/5 border border-border-color relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-1/4 w-[30vw] h-[30vw] bg-primary/10 rounded-full blur-[80px] -z-10 pointer-events-none" />

            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-extrabold uppercase tracking-wider font-display">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>5,000+ Active Business Owners</span>
            </div>

            <h2 className="font-display font-black text-3xl sm:text-4xl text-text-primary tracking-tight">
              Start Managing Your Shop Accounting Today
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto leading-relaxed font-semibold">
              Join thousands of small business owners. Sign in with Google to organize your daily accounts cleanly in under 2 minutes.
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
                    <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.85-6.277-6.36 0-3.51 2.811-6.36 6.277-6.36 1.497 0 2.87.525 3.957 1.4l3.11-3.15C19.123 2.115 15.932 1 12.24 1 6.032 1 1 6.07 1 12.36s5.032 11.36 11.24 11.36c6.438 0 10.748-4.57 10.748-11.08 0-.69-.06-1.36-.178-2.355H12.24z" />
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