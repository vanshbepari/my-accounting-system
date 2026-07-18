"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Target as LucideTarget,
  Trophy,
  Flame,
  AlertTriangle,
  Save,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Coins,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Calendar
} from "lucide-react";
import { useAccounting } from "@/context/AccountingContext";

import CustomMonthDropdown from "@/components/CustomMonthDropdown";
import { generateMonthOptions } from "@/utils/dateDropdownHelpers";

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

  // Generate target month options (6 months past, 4 months future, plus All Time)
  const targetMonthOptions = useMemo(() => generateMonthOptions(6, 4, true), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync inputs when context data is parsed from Supabase
  useEffect(() => {
    if (revenueTarget !== undefined) setLocalRev(revenueTarget);
    if (netProfitTarget !== undefined) setLocalNet(netProfitTarget);
    if (expenseCeiling !== undefined) setLocalExp(expenseCeiling);
  }, [revenueTarget, netProfitTarget, expenseCeiling]);

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

  // Helper to format year-month e.g., "2026-05" -> "May 2026"
  const getMonthLabel = (monthStr: string) => {
    if (!monthStr || monthStr === "All") return "All Time";
    try {
      const [year, month] = monthStr.split("-").map(Number);
      const d = new Date(year, month - 1, 1);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch (e) {
      return monthStr;
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-12 text-left">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-color pb-6">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight flex items-center gap-2">
            <LucideTarget className="w-7 h-7 text-secondary stroke-[2.5]" />
            <span>Target Control Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Establish monthly corporate budgets, milestones, and net profit expectations.
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
      </div>

      {/* Main Double Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Configure Goals Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-3xl p-6 bg-white border border-border-color shadow-md space-y-6">
            <div className="flex items-center space-x-2.5 border-b border-border-color pb-4">
              <div className="w-9 h-9 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shadow-sm">
                <Coins className="w-4.5 h-4.5" />
              </div>
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
                    className="w-full pl-8 pr-4 py-2.5 text-xs font-bold rounded-xl border border-border-color bg-slate-50/50 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
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
                    className="w-full pl-8 pr-4 py-2.5 text-xs font-bold rounded-xl border border-border-color bg-slate-50/50 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
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
                    className="w-full pl-8 pr-4 py-2.5 text-xs font-bold rounded-xl border border-border-color bg-slate-50/50 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
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
                  <button
                    type="button"
                    onClick={() => applyPreset(0.9)}
                    className="py-2 text-[10px] font-extrabold rounded-xl border border-border-color bg-white hover:bg-slate-50 text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                  >
                    -10% Scale
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(1.1)}
                    className="py-2 text-[10px] font-extrabold rounded-xl border border-border-color bg-white hover:bg-slate-50 text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                  >
                    +10% Scale
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(1.25)}
                    className="py-2 text-[10px] font-extrabold rounded-xl border border-border-color bg-white hover:bg-slate-50 text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                  >
                    +25% Scale
                  </button>
                </div>
              </div>

              {/* Submit Save Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-secondary to-primary hover:shadow-lg hover:shadow-secondary/20 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer focus:outline-none"
              >
                <Save className="w-4 h-4" />
                <span>Save Targets</span>
              </button>
            </form>

            {/* Save Status Alert */}
            {isSaved && (
              <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl text-emerald-700 text-xs font-semibold">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                <span>Milestones saved securely to Supabase database.</span>
              </div>
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
        </div>

        {/* Right Side: Performance Meters (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Revenue Progress */}
          <div className="glass-card rounded-3xl p-6 bg-white border border-border-color shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                  stats.revenue.achieved ? "bg-emerald-50 border-emerald-100 text-emerald-600 animate-pulse" : "bg-indigo-50 border-indigo-100 text-indigo-600"
                }`}>
                  <Coins className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-text-primary">Monthly Revenue Target</h3>
                  <span className="text-[10px] text-text-secondary font-semibold">Target: {formatCurrency(localRev)}</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-base font-black ${
                  stats.revenue.achieved ? "text-emerald-600" : "text-indigo-600"
                }`}>
                  {formatCurrency(actualRevenue)}
                </span>
                <span className="block text-[9px] text-text-secondary font-extrabold uppercase">
                  {Math.round(stats.revenue.rawProgress)}% Complete
                </span>
              </div>
            </div>

            {/* Progress Meter Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/20">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    stats.revenue.achieved ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-gradient-to-r from-primary to-indigo-500"
                  }`}
                  style={{ width: `${stats.revenue.progress}%` }}
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
          </div>

          {/* Card 2: Net Profit Progress */}
          <div className="glass-card rounded-3xl p-6 bg-white border border-border-color shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                  stats.netProfit.achieved ? "bg-emerald-50 border-emerald-100 text-emerald-600 animate-pulse" : "bg-indigo-50 border-indigo-100 text-indigo-600"
                }`}>
                  <TrendingUp className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-text-primary">Net Profit Milestone</h3>
                  <span className="text-[10px] text-text-secondary font-semibold">Target: {formatCurrency(localNet)}</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-base font-black ${
                  actualNetProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}>
                  {formatCurrency(actualNetProfit)}
                </span>
                <span className="block text-[9px] text-text-secondary font-extrabold uppercase">
                  {Math.round(stats.netProfit.rawProgress)}% Complete
                </span>
              </div>
            </div>

            {/* Progress Meter Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/20">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    stats.netProfit.achieved ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-gradient-to-r from-primary to-secondary"
                  }`}
                  style={{ width: `${stats.netProfit.progress}%` }}
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
          </div>

          {/* Card 3: Expense Ceiling Progress */}
          <div className="glass-card rounded-3xl p-6 bg-white border border-border-color shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                  stats.expenses.exceeded ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-teal-50 border-teal-100 text-teal-600"
                }`}>
                  <TrendingDown className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-text-primary">Monthly Expense Ceiling</h3>
                  <span className="text-[10px] text-text-secondary font-semibold">Budget Limit: {formatCurrency(localExp)}</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-base font-black ${
                  stats.expenses.exceeded ? "text-rose-600" : "text-text-primary"
                }`}>
                  {formatCurrency(actualExpenses)}
                </span>
                <span className="block text-[9px] text-text-secondary font-extrabold uppercase">
                  {Math.round(stats.expenses.rawProgress)}% Spent
                </span>
              </div>
            </div>

            {/* Progress Meter Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/20">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    stats.expenses.exceeded ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]" : "bg-emerald-500"
                  }`}
                  style={{ width: `${stats.expenses.progress}%` }}
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
          </div>

          {/* Combined Achievement Banner */}
          {(stats.revenue.achieved && stats.netProfit.achieved && !stats.expenses.exceeded) && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-100 flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 animate-bounce">
                <Trophy className="w-5.5 h-5.5 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black text-sm text-emerald-800">Perfect Month Achievement! 🎉</h4>
                <p className="text-xs text-emerald-700 font-semibold leading-relaxed">
                  Excellent work! All targets have been reached and expenses are well optimized within the ceiling limit. Your cash runway is in premium condition!
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
