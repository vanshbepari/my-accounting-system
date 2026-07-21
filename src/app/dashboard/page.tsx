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
  Wallet,
  Coins,
  Receipt,
  Sparkles,
  ArrowRight,
  Clock,
  Info
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

  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  // Exclusively on Dashboard: display only past months and current month (0 future months)
  const dashboardMonthOptions = useMemo(() => generateMonthOptions(12, 0, true), []);

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

  // Switch month helper (prev / next) restricted to past & current month on Dashboard
  const adjustMonth = (delta: number) => {
    try {
      const activeStr = selectedMonth === "All" || !selectedMonth ? currentMonthStr : selectedMonth;
      const [year, month] = activeStr.split("-").map(Number);
      const d = new Date(year, month - 1 + delta, 1);
      const nextMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      if (nextMonthStr > currentMonthStr) {
        return;
      }
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

  // Big Four Metric Cards configuration
  const statCards = [
    {
      title: "Opening Balance",
      rawVal: openingBalance,
      subtitle: isAllTime ? "Initial Starting Capital" : `Opening Reserves for ${getMonthLabel(activeMonth)}`,
      icon: Wallet,
      cardBorder: "border-purple-200/90",
      cardBg: "from-purple-500/10 via-indigo-500/5 to-white",
      iconGradient: "from-purple-600 to-indigo-600 shadow-purple-500/30 text-white",
      badgeClass: "text-purple-700 bg-purple-100/90 border-purple-200",
      trend: "Previous period carry forward"
    },
    {
      title: "Total Revenue",
      rawVal: totalRevenue,
      subtitle: isAllTime ? "Income for All Time" : `Revenue for ${getMonthLabel(activeMonth)}`,
      icon: TrendingUp,
      cardBorder: "border-emerald-200/90",
      cardBg: "from-emerald-500/10 via-teal-500/5 to-white",
      iconGradient: "from-emerald-500 to-teal-500 shadow-emerald-500/30 text-white",
      badgeClass: "text-emerald-800 bg-emerald-100/90 border-emerald-200",
      trend: "Cash & online split aggregated"
    },
    {
      title: "Total Expenses",
      rawVal: totalExpenses,
      subtitle: isAllTime ? "Outflows for All Time" : `Outflows for ${getMonthLabel(activeMonth)}`,
      icon: TrendingDown,
      cardBorder: "border-rose-200/90",
      cardBg: "from-rose-500/10 via-red-500/5 to-white",
      iconGradient: "from-rose-500 to-red-500 shadow-rose-500/30 text-white",
      badgeClass: "text-rose-800 bg-rose-100/90 border-rose-200",
      trend: "Itemized shop costs aggregated"
    },
    {
      title: "Net Profit / Loss",
      rawVal: netPL,
      subtitle: isAllTime ? "Surplus for All Time" : `Surplus for ${getMonthLabel(activeMonth)}`,
      icon: netPL >= 0 ? ShieldCheck : AlertTriangle,
      cardBorder: netPL >= 0 ? "border-indigo-200/90" : "border-rose-200/90",
      cardBg: netPL >= 0 ? "from-indigo-500/10 via-emerald-500/5 to-white" : "from-rose-500/10 via-pink-500/5 to-white",
      iconGradient: netPL >= 0
        ? "from-primary via-indigo-600 to-emerald-500 shadow-indigo-500/30 text-white"
        : "from-rose-600 to-pink-600 shadow-rose-500/30 text-white",
      badgeClass: netPL >= 0
        ? "text-indigo-800 bg-indigo-100/90 border-indigo-200"
        : "text-rose-800 bg-rose-100/90 border-rose-200",
      trend: netPL >= 0 ? "🟢 Net Margin Achieved" : "🔴 Deficit Recorded"
    }
  ];

  if (!mounted) return null;

  return (
    <div className="space-y-8 text-left pb-12 max-w-7xl mx-auto">
      {/* ── Top Header Panel ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-6">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight flex items-center gap-2.5">
            <span>Shop Ledger Dashboard</span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full">
              Live Ledger Base
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 font-medium">
            Monitor money earned, money spent, and complete daily records in real time.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          <Link
            href="/dashboard/expenses"
            className="flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-primary via-indigo-600 to-secondary text-white text-xs sm:text-sm font-extrabold rounded-2xl hover:shadow-xl hover:shadow-primary/30 transition-all hover-lift active:scale-98 border border-white/20"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>Add New Entry</span>
          </Link>
        </div>
      </div>

      {/* ── REQUIREMENT 1: Polished Accounting Period Container (NO OVERFLOW CLIPPING for Dropdown Popovers) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl border-2 border-indigo-200/80 bg-gradient-to-r from-white via-slate-50/70 to-indigo-50/40 shadow-md relative z-30 hover:shadow-lg transition-all duration-300"
      >
        {/* Subtle Ambient Background Light Orbs - contained inside absolute rounded wrapper */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute -top-12 -left-12 w-28 h-28 bg-primary/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-secondary/10 rounded-full blur-2xl" />
        </div>

        <div className="flex items-center space-x-3.5 text-left self-start sm:self-center relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 border border-primary/20 flex items-center justify-center text-white shadow-lg shadow-primary/25 shrink-0">
            <Calendar className="w-5.5 h-5.5" />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none flex items-center gap-1.5">
              <span>Accounting Period</span>
              <Sparkles className="w-3 h-3 text-primary" />
            </h2>
            <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
              Monthly ledger control center
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end relative z-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => adjustMonth(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 transition-all shadow-sm font-extrabold text-sm cursor-pointer"
            title="Previous Month"
          >
            ◀
          </motion.button>

          <CustomMonthDropdown
            value={selectedMonth}
            onChange={(newMonth) => setSelectedMonth(newMonth)}
            options={dashboardMonthOptions}
            variant="glass"
            size="sm"
            align="right"
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => adjustMonth(1)}
            className="flex items-center justify-center w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 transition-all shadow-sm font-extrabold text-sm cursor-pointer"
            title="Next Month"
          >
            ▶
          </motion.button>
        </div>
      </motion.div>

      {/* ── REQUIREMENT 2: Big Four Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`glass-card rounded-3xl p-6 border-2 ${card.cardBorder} bg-gradient-to-br ${card.cardBg} shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between hover-lift group`}
            >
              {/* Ambient backdrop glow */}
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    {card.title}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none pt-1">
                    <AnimatedCounter value={card.rawVal} formatFn={formatCurrency} />
                  </h3>
                </div>
                <div className={`w-13 h-13 rounded-2xl bg-gradient-to-tr ${card.iconGradient} border flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <div className="flex items-end justify-between mt-6 border-t border-slate-200/60 pt-4 text-left relative z-10">
                <div className="space-y-1.5 w-full">
                  <span className="text-xs text-slate-500 block font-semibold truncate">
                    {card.subtitle}
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border inline-block tracking-tight ${card.badgeClass}`}>
                    {card.trend}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── REQUIREMENT 2 & 3: Daily Accounting Entries Table with Complete Feature Parity & Itemized Expense Breakdown ── */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/90 shadow-md space-y-6 text-left">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="text-left">
            <h2 className="font-display font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              <span>Daily Accounting Entries</span>
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Click the dropdown arrow on any date row to expand itemized expenses or edit daily records.
            </p>
          </div>

          {/* Control bar: Search Input */}
          <div className="relative w-full sm:w-72 shrink-0">
            <input
              type="text"
              placeholder="Search descriptions or dates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs font-bold rounded-2xl border border-slate-200 bg-slate-50/80 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary text-slate-900 shadow-xs transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Ledger list container */}
        <div className="space-y-4">
          {filteredSummaries.length === 0 ? (
            <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/40 space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="text-base font-black text-slate-800">No entries logged yet for this period</p>
              <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto">
                Tap &quot;Add New Entry&quot; above to log daily store sales and operational costs.
              </p>
            </div>
          ) : (
            <>
              {/* ── DESKTOP TABLE VIEW ── */}
              <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm bg-white">
                <table className="min-w-full divide-y divide-slate-100 text-left border-collapse">
                  <thead className="bg-slate-100/70 text-[11px] uppercase font-black tracking-wider text-slate-500 sticky top-0 backdrop-blur-md">
                    <tr>
                      <th scope="col" className="px-6 py-4.5">Ledger Date</th>
                      <th scope="col" className="px-6 py-4.5 text-emerald-700">🟢 Online</th>
                      <th scope="col" className="px-6 py-4.5 text-amber-700">🟠 Cash</th>
                      <th scope="col" className="px-6 py-4.5 text-primary">🔵 Revenue</th>
                      <th scope="col" className="px-6 py-4.5 text-rose-700">🔴 Expenses</th>
                      <th scope="col" className="px-6 py-4.5">Net Profit / Loss</th>
                      <th scope="col" className="px-6 py-4.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold">
                    {filteredSummaries.map((summary) => {
                      const isExpanded = !!expandedDates[summary.date];
                      const dayTxs = transactions.filter(t => t.date === summary.date);
                      const dayExpenses = dayTxs.flatMap(t => t.expenses || []);
                      const hasExpenses = dayExpenses.length > 0;
                      const dayNotes = dayTxs.map(t => t.notes).filter(Boolean).join(" | ");

                      return (
                        <React.Fragment key={summary.date}>
                          {/* Summary Row */}
                          <tr
                            onClick={() => toggleExpandDate(summary.date)}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer select-none"
                          >
                            <td className="px-6 py-4.5 font-black text-slate-900 flex items-center space-x-2.5">
                              <div className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-primary/10 hover:text-primary flex items-center justify-center text-slate-500 shrink-0 transition-colors">
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                              <span>{formatDateFriendly(summary.date)}</span>
                            </td>
                            <td className="px-6 py-4.5 text-emerald-600 font-extrabold">{formatCurrency(summary.online)}</td>
                            <td className="px-6 py-4.5 text-amber-600 font-extrabold">{formatCurrency(summary.cash)}</td>
                            <td className="px-6 py-4.5 text-primary font-black">{formatCurrency(summary.revenue)}</td>
                            <td className="px-6 py-4.5 text-rose-600 font-extrabold">{formatCurrency(summary.expenses)}</td>
                            <td className={`px-6 py-4.5 font-black text-sm ${summary.netPL >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {summary.netPL >= 0 ? "+" : ""}{formatCurrency(summary.netPL)}
                            </td>
                            <td className="px-6 py-4.5 text-right">
                              <Link
                                href={`/dashboard/expenses?date=${summary.date}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white hover:border-primary/40 text-xs font-black text-primary shadow-xs transition-all hover:scale-105"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </Link>
                            </td>
                          </tr>

                          {/* Desktop Expanded Drawer */}
                          <AnimatePresence>
                            {isExpanded && (
                              <tr>
                                <td colSpan={7} className="p-0 bg-slate-50/50">
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-10 py-5 space-y-3.5 border-t border-b border-slate-200/60 text-left">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                          Detailed Itemized Expenditures ({formatDateFriendly(summary.date)})
                                        </span>
                                        <Link
                                          href={`/dashboard/expenses?date=${summary.date}`}
                                          className="text-xs font-black text-primary hover:underline flex items-center space-x-1"
                                        >
                                          <span>✏️ Edit entries</span>
                                        </Link>
                                      </div>

                                      {hasExpenses ? (
                                        <div className="space-y-2">
                                          <span className="text-[10px] uppercase font-black tracking-wider text-rose-700 block">
                                            Itemized Expenses Incurred ({dayExpenses.length}):
                                          </span>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                            {dayExpenses.map((exp, idx) => (
                                              <div
                                                key={exp.id || idx}
                                                className="p-3 border border-rose-100 rounded-xl bg-white flex items-center justify-between text-xs hover:border-rose-300 transition-colors shadow-xs"
                                              >
                                                <span className="font-bold text-slate-800">{exp.title}</span>
                                                <span className="font-black text-rose-600">-{formatCurrency(exp.amount)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="p-3.5 border border-emerald-200/80 rounded-xl bg-emerald-50/70 flex items-center space-x-2 text-xs font-bold text-emerald-800 shadow-xs">
                                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                          <span>No itemized expenses recorded for this date.</span>
                                        </div>
                                      )}

                                      {dayNotes && (
                                        <div className="p-3 bg-white rounded-xl text-left border border-slate-200/80 mt-1 shadow-xs">
                                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Memo Notes</p>
                                          <p className="text-xs text-slate-700 font-semibold mt-0.5">{dayNotes}</p>
                                        </div>
                                      )}
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

              {/* ── MOBILE CARD LIST VIEW WITH COMPLETE FEATURE PARITY & EXPANDABLE DRAWER ── */}
              <div className="block md:hidden space-y-3.5">
                {filteredSummaries.map((summary) => {
                  const isExpanded = !!expandedDates[summary.date];
                  const dayTxs = transactions.filter(t => t.date === summary.date);
                  const dayExpenses = dayTxs.flatMap(t => t.expenses || []);
                  const hasExpenses = dayExpenses.length > 0;
                  const dayNotes = dayTxs.map(t => t.notes).filter(Boolean).join(" | ");

                  return (
                    <div
                      key={summary.date}
                      className="rounded-3xl border border-slate-200 bg-white text-left overflow-hidden shadow-sm hover:shadow-md transition-all"
                    >
                      {/* Mobile Card Header */}
                      <div
                        onClick={() => toggleExpandDate(summary.date)}
                        className="p-4 bg-slate-50/70 flex items-center justify-between cursor-pointer select-none border-b border-slate-100"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary shadow-xs">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 block leading-tight">
                              {formatDateFriendly(summary.date)}
                            </span>
                            <span className={`text-[10px] font-black ${summary.netPL >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {summary.netPL >= 0 ? "Surplus: +" : "Deficit: "}{formatCurrency(summary.netPL)}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/dashboard/expenses?date=${summary.date}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 text-xs font-black text-primary border border-primary/30 rounded-xl bg-white shadow-xs"
                        >
                          Edit
                        </Link>
                      </div>

                      {/* Mobile Summary Grid */}
                      <div className="p-4 grid grid-cols-3 gap-2 text-xs font-bold bg-white">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-black">Revenue</span>
                          <span className="text-primary font-black text-sm">{formatCurrency(summary.revenue)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-black">Expenses</span>
                          <span className="text-rose-600 font-black text-sm">{formatCurrency(summary.expenses)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-black">Net P/L</span>
                          <span className={`font-black text-sm ${summary.netPL >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {summary.netPL >= 0 ? "+" : ""}{formatCurrency(summary.netPL)}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Expanded Itemized Breakdown Drawer */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                          >
                            <div className="p-4 space-y-3">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                Itemized Breakdown
                              </span>

                              {hasExpenses ? (
                                <div className="space-y-2">
                                  {dayExpenses.map((exp, idx) => (
                                    <div
                                      key={exp.id || idx}
                                      className="p-2.5 border border-rose-100 rounded-xl bg-white flex items-center justify-between text-xs shadow-xs"
                                    >
                                      <span className="font-bold text-slate-800">{exp.title}</span>
                                      <span className="font-black text-rose-600">-{formatCurrency(exp.amount)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-3 border border-emerald-200/80 rounded-xl bg-emerald-50/70 flex items-center space-x-2 text-xs font-bold text-emerald-800">
                                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>No itemized expenses recorded for this date.</span>
                                </div>
                              )}

                              {dayNotes && (
                                <div className="p-2.5 bg-white rounded-xl text-left border border-slate-200/80">
                                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Notes</p>
                                  <p className="text-xs text-slate-700 font-semibold mt-0.5">{dayNotes}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
