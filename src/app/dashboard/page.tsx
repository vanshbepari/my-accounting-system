"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Edit2,
  Filter,
  CheckCircle,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { useAccounting } from "@/context/AccountingContext";

// Dynamic Progressive Count-Up component for expensive premium finance feel
interface AnimatedCounterProps {
  value: number;
  formatFn: (val: number) => string;
}

function AnimatedCounter({ value, formatFn }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = value;
    if (start === end) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCount(end);
      return;
    }

    const duration = 600; // ms
    const steps = 30;
    const stepTime = duration / steps;
    const diff = end - start;
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount++;
      const progress = stepCount / steps;
      // Ease out quad formula
      const easeProgress = progress * (2 - progress);
      const current = Math.round(start + diff * easeProgress);

      if (stepCount >= steps) {
        clearInterval(timer);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCount(end);
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCount(current);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <>{formatFn(count)}</>;
}

import CustomMonthDropdown from "@/components/CustomMonthDropdown";
import { generateMonthOptions } from "@/utils/dateDropdownHelpers";

export default function DashboardPage() {
  const { transactions, dailySummaries, selectedMonth, setSelectedMonth, formatCurrency, user } = useAccounting();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDates, setExpandedDates] = useState<{ [date: string]: boolean }>({});
  const [mounted, setMounted] = useState(false);

  const dashboardMonthOptions = useMemo(() => generateMonthOptions(6, 3, true), []);

  // Hydration safety mount check + back button interceptor
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    // Push a dummy state to intercept browser back button (bypasses Google Account Chooser)
    window.history.pushState({ preventBack: true }, "", window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // If the state popped does not have preventBack: true, it means they clicked "Back"
      if (!event.state || !event.state.preventBack) {
        window.location.replace("/");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Fallback to current year-month safely if selectedMonth is blank or "All"
  const activeMonth = selectedMonth && selectedMonth !== "All"
    ? selectedMonth
    : new Date().toISOString().split("T")[0].substring(0, 7);

  const isAllTime = selectedMonth === "All";

  // Dynamic calculations filtered for the active month, or all-time if "All" is selected
  const filteredTxs = isAllTime ? transactions : transactions.filter(t => t.date.startsWith(activeMonth));
  const totalRevenue = filteredTxs.reduce((acc, t) => acc + t.onlineAmount + t.cashAmount, 0);
  const totalExpenses = filteredTxs.reduce((acc, t) => acc + t.expensesAmount, 0);
  const netPL = totalRevenue - totalExpenses;

  // Calculate opening balance: starting balance + accumulated PL of all prior months
  const baseOpeningBalance = user?.startingBalance ?? 0;
  let accumulatedPriorPL = 0;
  if (!isAllTime) {
    transactions.forEach(t => {
      if (t.date && t.date < `${activeMonth}-01`) {
        accumulatedPriorPL += (t.onlineAmount + t.cashAmount - t.expensesAmount);
      }
    });
  }
  const openingBalance = baseOpeningBalance + accumulatedPriorPL;

  // Toggle detail rows
  const toggleExpandDate = (date: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  // Helper to format date into standard Indian/US style e.g., "31 May 2026"
  const formatDateFriendly = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

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

  // Switch month helper (prev / next)
  const adjustMonth = (delta: number) => {
    try {
      const [year, month] = activeMonth.split("-").map(Number);
      const d = new Date(year, month - 1 + delta, 1);
      const nextMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      setSelectedMonth(nextMonthStr);
    } catch (e) {
      console.error("Month switcher error:", e);
    }
  };

  // Filter summaries based on search query in descriptions or dates
  const filteredSummaries = dailySummaries.filter(summary => {
    if (!searchQuery) return true;

    const formattedDate = formatDateFriendly(summary.date).toLowerCase();
    const query = searchQuery.toLowerCase();

    if (formattedDate.includes(query) || summary.date.includes(query)) return true;

    const dayTxs = transactions.filter(t => t.date === summary.date);
    return dayTxs.some(t => t.title.toLowerCase().includes(query) || t.category.toLowerCase().includes(query));
  });

  const statCards = [
    {
      title: "Opening Balance",
      rawVal: openingBalance,
      subtitle: isAllTime ? "Initial Starting Balance" : `Opening Reserves for ${getMonthLabel(activeMonth)}`,
      icon: Wallet,
      color: "from-purple-500/10 to-indigo-500/10 border-purple-100/30 text-purple-600",
      iconBg: "bg-purple-500/10 border-purple-500/20 text-purple-600",
      trendColor: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      trend: "Previous period carry forward"
    },
    {
      title: "Total Revenue",
      rawVal: totalRevenue,
      subtitle: isAllTime ? "Income for All Time" : `Income for ${getMonthLabel(activeMonth)}`,
      icon: DollarSign,
      color: "from-indigo-500/10 to-cyan-500/10 border-indigo-100/30 text-indigo-600",
      iconBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600",
      trendColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      trend: "Cash & online split aggregated"
    },
    {
      title: "Total Expenses",
      rawVal: totalExpenses,
      subtitle: isAllTime ? "Outflows for All Time" : `Outflows for ${getMonthLabel(activeMonth)}`,
      icon: TrendingDown,
      color: "from-rose-500/10 to-orange-500/10 border-rose-100/30 text-rose-600",
      iconBg: "bg-rose-500/10 border-rose-500/20 text-rose-600",
      trendColor: "text-slate-500 bg-slate-500/10 border-slate-500/20",
      trend: "Itemized shop costs aggregated"
    },
    {
      title: "Net Profit / Loss",
      rawVal: netPL,
      subtitle: isAllTime ? "Surplus for All Time" : `Surplus for ${getMonthLabel(activeMonth)}`,
      icon: netPL >= 0 ? TrendingUp : TrendingDown,
      color: netPL >= 0
        ? "from-emerald-500/10 to-teal-500/10 border-emerald-100/30 text-emerald-600"
        : "from-rose-500/10 to-pink-500/10 border-rose-100/30 text-rose-600",
      iconBg: netPL >= 0
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
        : "bg-rose-500/10 border-rose-500/20 text-rose-600",
      trendColor: netPL >= 0
        ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
        : "text-rose-500 bg-rose-500/10 border-rose-500/20",
      trend: netPL >= 0 ? "🟢 Net Margin achieved" : "🔴 Deficit recorded"
    }
  ];

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight">
            Shop Ledger Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            See your total money earned, total money spent, and complete daily records in 5 seconds.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start">
          <Link
            href="/dashboard/expenses"
            className="flex items-center space-x-1.5 px-5 py-3 bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold rounded-2xl hover:shadow-lg transition-all hover-lift border-shine-glow"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Entry</span>
          </Link>
        </div>
      </div>

      {/* Month Navigation System - Premium, Mobile-Friendly, Compact */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-border-color bg-white/50 backdrop-blur-md shadow-sm">
        <div className="flex items-center space-x-2.5 text-left self-start sm:self-center">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider leading-none">Accounting Period</h2>
            <span className="text-[10px] text-text-secondary font-semibold mt-1 block">Monthly ledger control center</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => adjustMonth(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-border-color bg-white text-text-primary hover:bg-slate-50 transition-all hover-lift active:scale-95 shadow-sm font-extrabold text-sm cursor-pointer"
            title="Previous Month"
          >
            ◀
          </button>

          <CustomMonthDropdown
            value={selectedMonth}
            onChange={(newMonth) => setSelectedMonth(newMonth)}
            options={dashboardMonthOptions}
            variant="glass"
            size="sm"
          />

          <button
            onClick={() => adjustMonth(1)}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-border-color bg-white text-text-primary hover:bg-slate-50 transition-all hover-lift active:scale-95 shadow-sm font-extrabold text-sm cursor-pointer"
            title="Next Month"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Grid: Big Four Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`glass-card rounded-3xl p-6 border bg-white relative overflow-hidden flex flex-col justify-between hover-lift shadow-sm`}
            >
              {/* Soft ambient background glow inside metrics */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} rounded-full blur-2xl opacity-40 pointer-events-none -z-10`} />

              <div className="flex justify-between items-start">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                    {card.title}
                  </span>
                  <h3 className="text-3xl font-black text-text-primary tracking-tight leading-none pt-1">
                    <AnimatedCounter value={card.rawVal} formatFn={formatCurrency} />
                  </h3>
                </div>
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-sm ${card.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="flex items-end justify-between mt-8 border-t border-slate-100 pt-4 text-left">
                <div className="space-y-1">
                  <span className="text-xs text-text-secondary block font-medium">
                    {card.subtitle}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block ${card.trendColor}`}>
                    {card.trend}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Daily accounting entries table */}
      <div className="space-y-4 pt-4">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-border-color pb-3">
          <div className="text-left">
            <h2 className="font-display font-bold text-lg text-text-primary">
              Daily Accounting Entries
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Select any date row to see details. To edit or fix data, click the &quot;Edit&quot; link to load it inside the Add Entry panel.
            </p>
          </div>
        </div>

        {/* Control bar: Search Input */}
        <div className="w-full flex">
          <div className="relative flex-grow max-w-md">
            <input
              type="text"
              placeholder="Search descriptions, categories, or dates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-border-color bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary shadow-sm"
            />
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-3.5" />
          </div>
        </div>

        {/* Ledger lists */}
        <div className="space-y-4">
          {filteredSummaries.length === 0 ? (
            <div className="p-16 text-center border-2 border-dashed border-border-color rounded-2xl bg-white/10">
              <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
              <p className="text-sm font-semibold text-text-primary">No entries logged yet</p>
              <p className="text-xs text-text-secondary mt-1">
                Tap &quot;Add New Entry&quot; above to log transactions.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table: Hidden on Mobile */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-border-color shadow-sm bg-white/70">
                <table className="min-w-full divide-y divide-border-color text-left border-collapse">
                  <thead className="bg-slate-50/50 text-[10px] uppercase font-bold tracking-widest text-text-secondary sticky top-0 backdrop-blur-md">
                    <tr>
                      <th scope="col" className="px-6 py-4">Date</th>
                      <th scope="col" className="px-6 py-4">🟢 Online</th>
                      <th scope="col" className="px-6 py-4">🟠 Cash</th>
                      <th scope="col" className="px-6 py-4">🔵 Revenue</th>
                      <th scope="col" className="px-6 py-4">🔴 Expenses</th>
                      <th scope="col" className="px-6 py-4">Profit / Loss</th>
                      <th scope="col" className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color text-xs font-semibold">
                    {filteredSummaries.map((summary) => {
                      const isExpanded = !!expandedDates[summary.date];
                      const dayTxs = transactions.filter(t => t.date === summary.date);

                      return (
                        <React.Fragment key={summary.date}>
                          {/* Summary Row */}
                          <tr
                            onClick={() => toggleExpandDate(summary.date)}
                            className="hover:bg-slate-50/50 transition-all cursor-pointer select-none"
                          >
                            <td className="px-6 py-4 font-bold text-text-primary flex items-center space-x-2">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> : <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />}
                              <span>{formatDateFriendly(summary.date)}</span>
                            </td>
                            <td className="px-6 py-4 text-success">{formatCurrency(summary.online)}</td>
                            <td className="px-6 py-4 text-warning">{formatCurrency(summary.cash)}</td>
                            <td className="px-6 py-4 text-primary">{formatCurrency(summary.revenue)}</td>
                            <td className="px-6 py-4 text-danger">{formatCurrency(summary.expenses)}</td>
                            <td className={`px-6 py-4 font-bold ${summary.netPL >= 0 ? "text-success" : "text-danger"}`}>
                              {summary.netPL >= 0 ? "+" : ""}{formatCurrency(summary.netPL)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link
                                href={`/dashboard/expenses?date=${summary.date}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center space-x-1 px-2.5 py-1.5 border border-border-color rounded-lg bg-white hover:bg-slate-50 text-xs font-bold text-primary shadow-sm transition-all hover:scale-[1.03]"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </Link>
                            </td>
                          </tr>

                          {/* Expanded list drawer - Fix 5: Read-Only list drawer */}
                          <AnimatePresence>
                            {isExpanded && (
                              <tr>
                                <td colSpan={7} className="p-0 bg-slate-50/30">
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-12 py-5 space-y-3 border-t border-b border-border-color/30 text-left">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-text-secondary block">
                                          Detailed Records for {formatDateFriendly(summary.date)}
                                        </span>
                                        <Link
                                          href={`/dashboard/expenses?date=${summary.date}`}
                                          className="text-xs font-bold text-primary hover:underline flex items-center space-x-1"
                                        >
                                          <span>✏️ Edit this day&apos;s inputs</span>
                                        </Link>
                                      </div>

                                      {dayTxs.map((tx) => (
                                        <div key={tx.id} className="space-y-2">
                                          {/* Itemized expenses split */}
                                          {tx.expenses && tx.expenses.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                              {tx.expenses.map((e) => (
                                                <div
                                                  key={e.id}
                                                  className="p-3 border border-border-color/60 rounded-xl bg-white flex items-center justify-between text-xs hover:border-rose-200 transition-colors"
                                                >
                                                  <span className="font-semibold text-text-primary">{e.title}</span>
                                                  <span className="font-bold text-danger">-{formatCurrency(e.amount)}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          {/* Brief remarks memo */}
                                          {tx.notes && (
                                            <div className="p-3 bg-slate-100/50 rounded-xl text-left border border-border-color/40 mt-1">
                                              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Memo Notes</p>
                                              <p className="text-xs text-text-primary mt-0.5">{tx.notes}</p>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View: Auto-converts rows to cards - Fix 5: Safe edit mobile template */}
              <div className="block md:hidden space-y-4 text-left">
                {filteredSummaries.map((summary) => {
                  const isExpanded = !!expandedDates[summary.date];
                  const dayTxs = transactions.filter(t => t.date === summary.date);

                  return (
                    <motion.div
                      key={summary.date}
                      layout
                      className="glass-card rounded-2xl border border-border-color bg-white p-4 space-y-3 relative overflow-hidden"
                    >
                      {/* Date header */}
                      <div
                        onClick={() => toggleExpandDate(summary.date)}
                        className="flex items-center justify-between border-b border-border-color pb-2.5 cursor-pointer"
                      >
                        <div className="flex items-center space-x-2 text-xs font-bold text-text-primary">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>Date: {formatDateFriendly(summary.date)}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/dashboard/expenses?date=${summary.date}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-bold text-primary hover:underline flex items-center space-x-0.5"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </Link>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
                        </div>
                      </div>

                      {/* Cash vs Online Splits */}
                      <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold">
                        <div className="text-left">
                          <p className="text-[10px] text-text-secondary uppercase tracking-wide">🟢 Online</p>
                          <p className="text-sm font-bold text-success mt-0.5">{formatCurrency(summary.online)}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] text-text-secondary uppercase tracking-wide">🟠 Cash</p>
                          <p className="text-sm font-bold text-warning mt-0.5">{formatCurrency(summary.cash)}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] text-text-secondary uppercase tracking-wide">🔵 Revenue</p>
                          <p className="text-sm font-bold text-primary mt-0.5">{formatCurrency(summary.revenue)}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] text-text-secondary uppercase tracking-wide">🔴 Expenses</p>
                          <p className="text-sm font-bold text-danger mt-0.5">{formatCurrency(summary.expenses)}</p>
                        </div>
                      </div>

                      {/* Net daily profits summary */}
                      <div className="pt-2 border-t border-border-color flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[10px] text-text-secondary font-medium">Profit:</span>
                          <p className={`text-base font-extrabold ${summary.netPL >= 0 ? "text-success" : "text-danger"}`}>
                            {summary.netPL >= 0 ? "🟢" : "🔴"} {formatCurrency(summary.netPL)}
                          </p>
                        </div>
                        <span className="text-[9px] bg-slate-100 text-text-secondary font-bold px-2 py-1 rounded-lg">
                          {dayTxs.length} items
                        </span>
                      </div>

                      {/* Expanded mobile list */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden pt-3 space-y-3 border-t border-border-color/30"
                          >
                            <span className="text-[9px] uppercase font-bold tracking-widest text-text-secondary block mb-1">
                              Itemized Outflows
                            </span>
                            {dayTxs.map((tx) => (
                              <div key={tx.id} className="space-y-2">
                                {tx.expenses && tx.expenses.map((e) => (
                                  <div
                                    key={e.id}
                                    className="p-3 border border-border-color/60 rounded-xl bg-slate-50/50 flex items-center justify-between text-xs"
                                  >
                                    <span className="font-semibold text-text-primary">{e.title}</span>
                                    <span className="font-bold text-danger">-{formatCurrency(e.amount)}</span>
                                  </div>
                                ))}
                                {tx.notes && (
                                  <div className="p-3 bg-slate-50/40 border border-border-color/40 rounded-xl text-left text-xs">
                                    <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Memo Notes</p>
                                    <p className="text-text-primary mt-0.5">{tx.notes}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Safety Info panel at the bottom */}
      <div className="glass-card rounded-2xl p-5 border border-border-color bg-white text-left flex items-start space-x-4 max-w-md hover:border-emerald-200 transition-colors">
        <div className="w-9 h-9 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success flex-shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-text-primary">Data Saved Safely</h4>
          <p className="text-[10px] text-text-secondary leading-relaxed">
            Your transactions and records are stored safely in your private cloud database. Enforced by PostgreSQL Row Level Security (RLS), your data remains 100% isolated.
          </p>
        </div>
      </div>
    </div>
  );
}
