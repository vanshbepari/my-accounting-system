"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Target as LucideTarget,
  Trophy,
  Flame,
  Save,
  CheckCircle,
  TrendingUp,
  Coins,
  ShieldAlert,
  TrendingDown
} from "lucide-react";
import { motion } from "framer-motion";
import { useAccounting } from "@/context/AccountingContext";

import CustomMonthDropdown from "@/components/CustomMonthDropdown";
import { generateMonthOptions } from "@/utils/dateDropdownHelpers";

/* --- Count-Up Number Ticker Helper --- */
function AnimatedNumber({ value, formatFn }: { value: number; formatFn?: (val: number) => string }) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 900; // ms
    const startValue = 0;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out-expo timing: 1 - Math.pow(2, -10 * progress)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(startValue + (endValue - startValue) * easeProgress);
      setDisplayVal(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  return <>{formatFn ? formatFn(displayVal) : displayVal}</>;
}

export default function TargetPage() {
  const {
    transactions,
    formatCurrency,
    selectedMonth,
    setSelectedMonth,
    revenueTarget,
    netProfitTarget,
    expenseCeiling,
    saveTargets,
    user
  } = useAccounting();
  
  const [mounted, setMounted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Local state for the configuration inputs
  const [localRev, setLocalRev] = useState(50000);
  const [localNet, setLocalNet] = useState(20000);
  const [localExp, setLocalExp] = useState(15000);

  // Generate target month options (3 months past, 2 months future, plus All Time)
  const targetMonthOptions = useMemo(() => generateMonthOptions(3, 2, true), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const isFutureMonth = selectedMonth && selectedMonth !== "All" && selectedMonth > currentMonthStr;

  // Sync inputs when context data is parsed from Supabase OR reset to 0 for future months
  useEffect(() => {
    if (isFutureMonth) {
      setLocalRev(0);
      setLocalNet(0);
      setLocalExp(0);
    } else {
      if (revenueTarget !== undefined) setLocalRev(revenueTarget);
      if (netProfitTarget !== undefined) setLocalNet(netProfitTarget);
      if (expenseCeiling !== undefined) setLocalExp(expenseCeiling);
    }
  }, [isFutureMonth, revenueTarget, netProfitTarget, expenseCeiling, selectedMonth]);

  // Save targets directly to Supabase via React Context
  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveTargets(localRev, localNet, localExp);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Quick Preset Helper
  const applyPreset = (multiplier: number) => {
    setLocalRev(prev => Math.round(prev * multiplier));
    setLocalNet(prev => Math.round(prev * multiplier));
    setLocalExp(prev => Math.round(prev * multiplier));
  };

  // Determine active month scope
  const activeMonth = selectedMonth && selectedMonth !== "All"
    ? selectedMonth
    : new Date().toISOString().split("T")[0].substring(0, 7);

  const isAllTime = selectedMonth === "All";

  // Calculate actual ledger numbers based on current filter context
  const filteredTxs = isAllTime
    ? transactions
    : transactions.filter(t => t.date.startsWith(activeMonth));

  const actualRevenue = useMemo(() => {
    return filteredTxs.reduce((acc, t) => acc + t.onlineAmount + t.cashAmount, 0);
  }, [filteredTxs]);

  const actualExpenses = useMemo(() => {
    return filteredTxs.reduce((acc, t) => acc + t.expensesAmount, 0);
  }, [filteredTxs]);

  const actualNetProfit = actualRevenue - actualExpenses;

  // Compute stats dynamically from current local target states
  const stats = useMemo(() => {
    const revProgress = localRev > 0 ? (actualRevenue / localRev) * 100 : 0;
    const netProgress = localNet > 0 ? (actualNetProfit / localNet) * 100 : 0;
    const expProgress = localExp > 0 ? (actualExpenses / localExp) * 100 : 0;

    return {
      revenue: {
        progress: Math.min(Math.max(revProgress, 0), 100),
        rawProgress: revProgress,
        achieved: actualRevenue >= localRev,
        difference: localRev - actualRevenue
      },
      netProfit: {
        progress: Math.min(Math.max(netProgress, 0), 100),
        rawProgress: netProgress,
        achieved: actualNetProfit >= localNet,
        difference: localNet - actualNetProfit
      },
      expenses: {
        progress: Math.min(Math.max(expProgress, 0), 100),
        rawProgress: expProgress,
        exceeded: actualExpenses > localExp,
        difference: localExp - actualExpenses // Positive means remaining budget
      }
    };
  }, [actualRevenue, actualExpenses, actualNetProfit, localRev, localNet, localExp]);

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-12 text-left">
      
      {/* Header Section with Motion Icon & Dropdown */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-color pb-6 relative z-30"
      >
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <LucideTarget className="w-7 h-7 text-secondary stroke-[2.5]" />
            </motion.div>
            <span>Target Control Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 font-semibold">
            Set monthly revenue goals, net profit milestones, and expense spending limits to keep your shop on track.
          </p>
        </div>
        
        {/* Animated Custom Month Dropdown Selector */}
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <CustomMonthDropdown
            value={selectedMonth}
            onChange={(newMonth) => setSelectedMonth(newMonth)}
            options={targetMonthOptions}
            variant="glass"
            size="md"
          />
        </div>
      </motion.div>

      {/* Main Double Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Configure Goals Form (5 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 space-y-6"
        >
          <div className="glass-card rounded-3xl p-6 bg-white border border-border-color shadow-md space-y-6">
            <div className="flex items-center space-x-2.5 border-b border-border-color pb-4">
              <motion.div
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="w-9 h-9 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shadow-sm"
              >
                <Coins className="w-4.5 h-4.5" />
              </motion.div>
              <div>
                <h3 className="font-display font-bold text-sm text-text-primary">Set Milestone Targets</h3>
                <p className="text-[10px] text-text-secondary font-semibold">Targets are stored in Supabase database</p>
              </div>
            </div>

            <form onSubmit={handleSaveTargets} className="space-y-5">
              
              {/* Input: Revenue */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Target Monthly Revenue
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-text-secondary">
                    {user?.currencySymbol || "$"}
                  </span>
                  <input
                    type="number"
                    value={localRev}
                    onChange={(e) => setLocalRev(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-8 pr-4 py-2.5 text-xs font-bold rounded-xl border border-border-color bg-slate-50/50 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/25 focus:border-secondary focus:shadow-md focus:shadow-secondary/10 transition-all duration-200"
                    placeholder="e.g. 50000"
                    required
                  />
                </div>
              </div>

              {/* Input: Net Profit */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Target Monthly Net Profit
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-text-secondary">
                    {user?.currencySymbol || "$"}
                  </span>
                  <input
                    type="number"
                    value={localNet}
                    onChange={(e) => setLocalNet(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-8 pr-4 py-2.5 text-xs font-bold rounded-xl border border-border-color bg-slate-50/50 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/25 focus:border-secondary focus:shadow-md focus:shadow-secondary/10 transition-all duration-200"
                    placeholder="e.g. 20000"
                    required
                  />
                </div>
              </div>

              {/* Input: Expense Ceiling */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Monthly Expense Ceiling (Cap)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-text-secondary">
                    {user?.currencySymbol || "$"}
                  </span>
                  <input
                    type="number"
                    value={localExp}
                    onChange={(e) => setLocalExp(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-8 pr-4 py-2.5 text-xs font-bold rounded-xl border border-border-color bg-slate-50/50 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/25 focus:border-secondary focus:shadow-md focus:shadow-secondary/10 transition-all duration-200"
                    placeholder="e.g. 15000"
                    required
                  />
                </div>
              </div>

              {/* Quick Presets Adjusters */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Adjust Target Scale:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => applyPreset(0.9)}
                    className="py-2 text-[10px] font-extrabold rounded-xl border border-border-color bg-white hover:bg-slate-50 text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer shadow-xs"
                  >
                    -10% Scale
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => applyPreset(1.1)}
                    className="py-2 text-[10px] font-extrabold rounded-xl border border-border-color bg-white hover:bg-slate-50 text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer shadow-xs"
                  >
                    +10% Scale
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => applyPreset(1.25)}
                    className="py-2 text-[10px] font-extrabold rounded-xl border border-border-color bg-white hover:bg-slate-50 text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer shadow-xs"
                  >
                    +25% Scale
                  </motion.button>
                </div>
              </div>

              {/* Submit Save Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-secondary to-primary hover:shadow-lg hover:shadow-secondary/20 text-white text-xs font-bold rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none"
              >
                <Save className="w-4 h-4" />
                <span>Save Targets</span>
              </motion.button>
            </form>

            {/* Save Status Alert */}
            {isSaved && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-2 bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl text-emerald-700 text-xs font-semibold"
              >
                <CheckCircle className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                <span>Milestones saved securely to Supabase database.</span>
              </motion.div>
            )}

          </div>

          {/* Quick Informational Tip Card */}
          <div className="glass-card rounded-3xl p-5 bg-gradient-to-tr from-secondary/5 to-primary/5 border border-secondary/15 text-xs text-text-secondary font-semibold leading-relaxed space-y-2 shadow-sm">
            <div className="flex items-center space-x-1.5 text-secondary">
              <Trophy className="w-4.5 h-4.5" />
              <span className="font-display font-bold uppercase tracking-wider text-[11px]">Milestone Advice</span>
            </div>
            <p className="text-[11px]">
              Set targets based on your Forecast predictions! Keeping an expense cap helps safeguard your cash runway and boosts net margins. Celebrate targets once they are fully achieved!
            </p>
          </div>
        </motion.div>

        {/* Right Side: Performance Meters (7 cols with Staggered Motion Entry) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Revenue Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -3, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card rounded-3xl p-6 bg-white border border-border-color shadow-md space-y-4 text-left transition-shadow duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.4, delay: 0.12 }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                    stats.revenue.achieved ? "bg-emerald-50 border-emerald-100 text-emerald-600 animate-pulse" : "bg-indigo-50 border-indigo-100 text-indigo-600"
                  }`}
                >
                  <Coins className="w-5 h-5 stroke-[2.2]" />
                </motion.div>
                <div>
                  <h3 className="font-display font-bold text-sm text-text-primary">Monthly Revenue Target</h3>
                  <span className="text-[10px] text-text-secondary font-semibold">Target: {formatCurrency(localRev)}</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-base font-black ${
                  stats.revenue.achieved ? "text-emerald-600" : "text-indigo-600"
                }`}>
                  <AnimatedNumber value={actualRevenue} formatFn={formatCurrency} />
                </span>
                <span className="block text-[9px] text-text-secondary font-extrabold uppercase">
                  <AnimatedNumber value={Math.round(stats.revenue.rawProgress)} />% Complete
                </span>
              </div>
            </div>

            {/* Progress Meter Bar with GPU scaleX Liquid Animation */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/20">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: stats.revenue.progress / 100 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-full origin-left ${
                    stats.revenue.achieved ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-gradient-to-r from-primary to-indigo-500"
                  }`}
                />
              </div>
              
              {/* Dynamic status helper */}
              <div className="flex justify-between text-[10px] font-bold">
                {stats.revenue.achieved ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-emerald-500" /> Exceeded by {formatCurrency(-stats.revenue.difference)}!
                  </span>
                ) : (
                  <span className="text-text-secondary">
                    Requires {formatCurrency(stats.revenue.difference)} more to reach target
                  </span>
                )}
                <span className="text-text-secondary">{Math.round(stats.revenue.rawProgress)}% achieved</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Net Profit Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -3, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
            transition={{ duration: 0.45, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card rounded-3xl p-6 bg-white border border-border-color shadow-md space-y-4 text-left transition-shadow duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.4, delay: 0.22 }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                    stats.netProfit.achieved ? "bg-emerald-50 border-emerald-100 text-emerald-600 animate-pulse" : "bg-indigo-50 border-indigo-100 text-indigo-600"
                  }`}
                >
                  <TrendingUp className="w-5 h-5 stroke-[2.2]" />
                </motion.div>
                <div>
                  <h3 className="font-display font-bold text-sm text-text-primary">Net Profit Milestone</h3>
                  <span className="text-[10px] text-text-secondary font-semibold">Target: {formatCurrency(localNet)}</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-base font-black ${
                  actualNetProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}>
                  <AnimatedNumber value={actualNetProfit} formatFn={formatCurrency} />
                </span>
                <span className="block text-[9px] text-text-secondary font-extrabold uppercase">
                  <AnimatedNumber value={Math.round(stats.netProfit.rawProgress)} />% Complete
                </span>
              </div>
            </div>

            {/* Progress Meter Bar with GPU scaleX Liquid Animation */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/20">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: stats.netProfit.progress / 100 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-full origin-left ${
                    stats.netProfit.achieved ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-gradient-to-r from-primary to-secondary"
                  }`}
                />
              </div>
              
              {/* Dynamic status helper */}
              <div className="flex justify-between text-[10px] font-bold">
                {stats.netProfit.achieved ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500 animate-bounce" /> Exceeded by {formatCurrency(-stats.netProfit.difference)}!
                  </span>
                ) : (
                  <span className="text-text-secondary">
                    Requires {formatCurrency(stats.netProfit.difference)} more to reach target
                  </span>
                )}
                <span className="text-text-secondary">{Math.round(stats.netProfit.rawProgress)}% achieved</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Expense Ceiling Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -3, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
            transition={{ duration: 0.45, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card rounded-3xl p-6 bg-white border border-border-color shadow-md space-y-4 text-left transition-shadow duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.4, delay: 0.32 }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                    stats.expenses.exceeded ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-teal-50 border-teal-100 text-teal-600"
                  }`}
                >
                  <TrendingDown className="w-5 h-5 stroke-[2.2]" />
                </motion.div>
                <div>
                  <h3 className="font-display font-bold text-sm text-text-primary">Monthly Expense Ceiling</h3>
                  <span className="text-[10px] text-text-secondary font-semibold">Budget Limit: {formatCurrency(localExp)}</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-base font-black ${
                  stats.expenses.exceeded ? "text-rose-600" : "text-text-primary"
                }`}>
                  <AnimatedNumber value={actualExpenses} formatFn={formatCurrency} />
                </span>
                <span className="block text-[9px] text-text-secondary font-extrabold uppercase">
                  <AnimatedNumber value={Math.round(stats.expenses.rawProgress)} />% Spent
                </span>
              </div>
            </div>

            {/* Progress Meter Bar with GPU scaleX Liquid Animation & Overflow Pulse */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/20">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: stats.expenses.progress / 100 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-full origin-left ${
                    stats.expenses.exceeded ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse" : "bg-emerald-500"
                  }`}
                />
              </div>
              
              {/* Dynamic status helper */}
              <div className="flex justify-between text-[10px] font-bold">
                {stats.expenses.exceeded ? (
                  <span className="text-rose-600 flex items-center gap-1 font-extrabold">
                    <ShieldAlert className="w-4 h-4 text-rose-500 animate-bounce" /> Exceeded limit by {formatCurrency(-stats.expenses.difference)}!
                  </span>
                ) : (
                  <span className="text-emerald-600 font-extrabold">
                    ✓ Remaining Budget: {formatCurrency(stats.expenses.difference)}
                  </span>
                )}
                <span className="text-text-secondary">{Math.round(stats.expenses.rawProgress)}% spent</span>
              </div>
            </div>
          </motion.div>

          {/* Combined Achievement Banner */}
          {(stats.revenue.achieved && stats.netProfit.achieved && !stats.expenses.exceeded) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-100 flex items-start space-x-4 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 animate-bounce">
                <Trophy className="w-5.5 h-5.5 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black text-sm text-emerald-800">Perfect Month Achievement! 🎉</h4>
                <p className="text-xs text-emerald-700 font-semibold leading-relaxed">
                  Excellent work! All targets have been reached and expenses are well optimized within the ceiling limit. Your cash runway is in premium condition!
                </p>
              </div>
            </motion.div>
          )}

        </div>

      </div>
    </div>
  );
}

