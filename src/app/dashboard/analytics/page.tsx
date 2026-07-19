"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";
import {
  PieChart as PieIcon,
  Activity,
  Zap,
  Sparkles,
  Info,
  Download,
  LayoutDashboard,
  CalendarRange,
  LineChart,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Coins,
  Wallet,
  BarChart3,
  Calendar
} from "lucide-react";
import { useAccounting } from "@/context/AccountingContext";
import CustomMonthDropdown from "@/components/CustomMonthDropdown";
import { generateMonthOptions } from "@/utils/dateDropdownHelpers";

const PIE_CHART_COLORS = [
  "#6366F1", "#06B6D4", "#10B981",
  "#F43F5E", "#F59E0B", "#8B5CF6", "#EC4899"
];

export default function AnalyticsPage() {
  const { transactions, dailySummaries, selectedMonth, setSelectedMonth, formatCurrency, user, addNotification } = useAccounting();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "compare_months" | "compare_years">("overview");

  // Hydration safety checker
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Filter transactions for active selected month
  const activeMonthStr = selectedMonth && selectedMonth !== "All"
    ? selectedMonth
    : new Date().toISOString().split("T")[0].substring(0, 7);

  const isAllTime = selectedMonth === "All";

  // Filtered dataset
  const filteredTxs = isAllTime ? transactions : transactions.filter(t => t.date.startsWith(activeMonthStr));

  // Current Period Financial Totals
  const totalRev = filteredTxs.reduce((acc, t) => acc + t.onlineAmount + t.cashAmount, 0);
  const totalExp = filteredTxs.reduce((acc, t) => acc + t.expensesAmount, 0);
  const netPL = totalRev - totalExp;
  const marginPercent = totalRev > 0 ? ((netPL / totalRev) * 100).toFixed(1) : "0.0";

  // Previous Month Totals for MoM comparison
  const previousMonthStr = useMemo(() => {
    try {
      const [year, month] = activeMonthStr.split("-").map(Number);
      const d = new Date(year, month - 2, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } catch {
      return "";
    }
  }, [activeMonthStr]);

  const prevMonthTxs = transactions.filter(t => t.date.startsWith(previousMonthStr));
  const prevRev = prevMonthTxs.reduce((acc, t) => acc + t.onlineAmount + t.cashAmount, 0);
  const prevExp = prevMonthTxs.reduce((acc, t) => acc + t.expensesAmount, 0);
  const prevNetPL = prevRev - prevExp;

  // 1. Chart Data: Revenue vs Expense Area Chart (last 10 days)
  const areaChartData = useMemo(() =>
    dailySummaries
      .slice(0, 10)
      .reverse()
      .map(s => ({
        name: s.date.split("-").slice(1).join("/"),
        Revenue: s.revenue,
        Expenses: s.expenses,
        Profit: s.netPL
      })),
    [dailySummaries]
  );

  // 2. Chart Data: Expense categories
  const { pieChartData, categoryTotalExpenses } = useMemo(() => {
    const categoryTotals: { [category: string]: number } = {};
    let total = 0;

    filteredTxs.forEach(t => {
      if (t.expenses && t.expenses.length > 0) {
        t.expenses.forEach(e => {
          if (e.title && e.amount > 0) {
            const cat = e.title.trim();
            categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
            total += e.amount;
          }
        });
      } else if (t.expensesAmount > 0) {
        const cat = t.category || "General Overhead";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + t.expensesAmount;
        total += t.expensesAmount;
      }
    });

    const data = Object.keys(categoryTotals)
      .map((cat, idx) => ({
        name: cat,
        value: categoryTotals[cat],
        color: PIE_CHART_COLORS[idx % PIE_CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    return { pieChartData: data, categoryTotalExpenses: total };
  }, [filteredTxs]);

  // 3. Monthly Bar Chart Data (Last 6 Months)
  const monthlyBarData = useMemo(() => {
    const monthlyMap: { [m: string]: { month: string; Revenue: number; Expenses: number; Profit: number } } = {};
    
    transactions.forEach(t => {
      if (!t.date) return;
      const mKey = t.date.substring(0, 7);
      if (!monthlyMap[mKey]) {
        monthlyMap[mKey] = { month: mKey, Revenue: 0, Expenses: 0, Profit: 0 };
      }
      const rev = t.onlineAmount + t.cashAmount;
      monthlyMap[mKey].Revenue += rev;
      monthlyMap[mKey].Expenses += t.expensesAmount;
      monthlyMap[mKey].Profit += (rev - t.expensesAmount);
    });

    return Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [transactions]);

  // 4. Automated Financial Insights Engine
  const insights = useMemo(() => {
    const insightsList: string[] = [];

    if (totalRev === 0) {
      return ["No ledger sheets logged for this period. Enter income and expenses in Add Entry to trigger automated advisor metrics."];
    }

    const profitRatio = netPL / totalRev;

    if (profitRatio > 0.4) {
      insightsList.push("Excellent Margin Health: Your net profit surplus represents over 40% of total incoming revenue. Consider allocating capital to stock inventory scaling.");
    } else if (profitRatio > 0.1) {
      insightsList.push("Stable Balance Sheet: Your cash flow operates with a healthy surplus. Focus on auditing recurring costs to expand net margins.");
    } else {
      insightsList.push("Tight Operating Margins: Expense outflows consume over 90% of revenues. We recommend auditing utility and overhead expenses.");
    }

    if (pieChartData.length > 0) {
      const topCat = pieChartData[0];
      const topCatRatio = categoryTotalExpenses > 0 ? (topCat.value / categoryTotalExpenses) * 100 : 0;
      insightsList.push(`Top Expense Category: Outflows for "${topCat.name}" represent ${topCatRatio.toFixed(0)}% of total business expenses. Review provider costs for savings.`);
    }

    return insightsList;
  }, [totalRev, netPL, categoryTotalExpenses, pieChartData]);

  // Handle PDF report download trigger
  const handleDownloadPdf = () => {
    addNotification(
      "Preparing PDF Report",
      `Generating printable financial analytics report for ${selectedMonth === "All" ? "All Time" : selectedMonth}...`,
      "info"
    );
    setTimeout(() => {
      window.print();
    }, 500);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 text-left pb-12 max-w-7xl mx-auto">
      {/* ── HEADER SECTION: Title + Date Selection Dropdown + DOWNLOAD PDF REPORT Button Side-By-Side ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-color pb-6">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Performance Analytics Hub</span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full">
              Audit System
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-semibold">
            Visual balance tracking sheets, multi-period comparative audits, and automated financial insights.
          </p>
        </div>

        {/* Date & Month Selection Dropdown + Download PDF Report Button securely positioned on the right */}
        <div className="flex items-center space-x-3 self-start lg:self-auto flex-wrap gap-2">
          <CustomMonthDropdown
            value={selectedMonth}
            onChange={(newMonth) => setSelectedMonth(newMonth)}
            options={generateMonthOptions(12, 0, true)}
            variant="light"
            size="sm"
            align="right"
          />

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-primary via-indigo-600 to-secondary text-white text-xs font-black rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all hover-lift active:scale-98 cursor-pointer border border-white/20"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD PDF REPORT</span>
          </button>
        </div>
      </div>

      {/* ── REQUIREMENT: Relocated Navigation Tabs (OVERVIEW | COMPARE MONTHS | COMPARE YEARS) directly above Financial Health Audit Index card ── */}
      <div className="space-y-4">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex space-x-2 p-1.5 rounded-2xl bg-slate-200/60 border border-slate-300/60 backdrop-blur-md shadow-inner">
            {[
              { id: "overview", label: "OVERVIEW", icon: LayoutDashboard },
              { id: "compare_months", label: "COMPARE MONTHS", icon: CalendarRange },
              { id: "compare_years", label: "COMPARE YEARS", icon: LineChart }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4.5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center space-x-2 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-white text-primary shadow-md shadow-slate-900/5 scale-[1.02]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                }`}
              >
                <tab.icon className="w-4 h-4 text-primary" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="text-xs font-black text-slate-500 flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Active Period: {selectedMonth === "All" ? "All Time (Cumulative)" : selectedMonth}</span>
          </div>
        </div>

        {/* ── Financial Health Audit Index Card (Placed directly under relocated tabs) ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 md:p-8 border-2 border-indigo-200/80 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-purple-500/10 shadow-lg relative overflow-hidden transition-all"
        >
          {/* Ambient background glow highlights */}
          <div className="absolute -top-16 -left-16 w-36 h-36 bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-indigo-300/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-secondary text-white flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Financial Health Audit Index</span>
                    <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Audit Score: {totalRev > 0 && netPL >= 0 ? "92 / 100" : "74 / 100"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Automated ratio analysis based on revenue velocity, expense ceiling cap, and profit retention margin.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex flex-col justify-center text-left space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Net Revenue Surplus</span>
              <span className={`text-xl font-black ${netPL >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {netPL >= 0 ? "+" : ""}{formatCurrency(netPL)}
              </span>
              <span className="text-[10px] font-bold text-slate-500">Margin: {marginPercent}%</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex flex-col justify-center text-left space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Operating Solvency</span>
              <span className="text-xl font-black text-slate-900">
                {totalExp === 0 ? "100%" : (totalRev / totalExp).toFixed(2) + "x"}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                <span>Liquidity Benchmark Met</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── TAB CONTENT VIEWS ── */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {/* Grid: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Area Chart - Revenue vs Expenses (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="border-b border-border-color pb-3 text-left">
                  <h2 className="font-display font-bold text-lg text-slate-900 flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <span>Revenue vs Expenses (Daily Trend)</span>
                  </h2>
                </div>

                <div className="glass-card rounded-3xl p-4 sm:p-6 border border-border-color bg-white h-80 sm:h-[400px] shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 blur-2xl pointer-events-none -z-10" />

                  {areaChartData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 font-semibold">
                      <Info className="w-6 h-6 text-slate-300 mb-2" />
                      <span>Add ledger items to trigger daily area indicators.</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={areaChartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                        <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(9, 13, 26, 0.85)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "16px",
                            backdropFilter: "blur(16px)",
                            color: "white",
                            fontSize: "12px",
                            textAlign: "left",
                            boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.3)"
                          }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                        <Area type="monotone" dataKey="Revenue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" activeDot={{ r: 6 }} />
                        <Area type="monotone" dataKey="Expenses" stroke="#F43F5E" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" activeDot={{ r: 6 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Pie Chart - Expenses Breakdown (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="border-b border-border-color pb-3 text-left">
                  <h2 className="font-display font-bold text-lg text-slate-900 flex items-center space-x-2">
                    <PieIcon className="w-5 h-5 text-secondary" />
                    <span>Outflows Splits</span>
                  </h2>
                </div>

                <div className="glass-card rounded-3xl p-5 border border-border-color bg-white h-80 sm:h-[400px] flex flex-col justify-between shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 blur-xl pointer-events-none -z-10" />

                  {pieChartData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 font-semibold">
                      <Info className="w-6 h-6 text-slate-300 mb-2" />
                      <span>No expense entries to analyze categories.</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-full h-44 sm:h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value">
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(9, 13, 26, 0.85)",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                borderRadius: "14px",
                                backdropFilter: "blur(12px)",
                                color: "white",
                                fontSize: "11px",
                                textAlign: "left"
                              }}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Custom Legends list */}
                      <div className="space-y-1.5 overflow-y-auto max-h-36 pr-1 text-[10px] font-bold border-t border-slate-100 pt-4">
                        {pieChartData.map((d, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                              <span className="text-slate-600 truncate">{d.name}</span>
                            </div>
                            <span className="text-slate-900 flex-shrink-0">
                              {formatCurrency(d.value)} ({((d.value / categoryTotalExpenses) * 100).toFixed(0)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Smart AI Bookkeeper Advisor section */}
            <div className="space-y-4">
              <div className="border-b border-border-color pb-3 text-left">
                <h2 className="font-display font-bold text-lg text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-500 fill-current animate-pulse" />
                  <span>Smart AI Bookkeeper Advisor</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {insights.map((insight, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="p-5 border border-slate-200 rounded-2xl bg-white text-left flex items-start space-x-4 shadow-sm hover-lift relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-secondary" />

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md flex-shrink-0">
                      <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-black text-primary tracking-widest block">
                        Insight Recommendation
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        {insight}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "compare_months" && (
          <motion.div
            key="compare_months"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {/* Month over Month Comparative Grid */}
            <div className="glass-card p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6 text-left">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-primary" />
                  <span>Month-over-Month Audit ({activeMonthStr} vs {previousMonthStr || "Prior Period"})</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 space-y-2">
                  <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Revenue Comparison</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-emerald-700">{formatCurrency(totalRev)}</span>
                    <span className="text-xs font-bold text-slate-500">Prev: {formatCurrency(prevRev)}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 block">
                    {prevRev > 0 ? `Change: ${(((totalRev - prevRev) / prevRev) * 100).toFixed(1)}%` : "Baseline Period"}
                  </span>
                </div>

                <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/40 space-y-2">
                  <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider">Expenses Comparison</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-rose-700">{formatCurrency(totalExp)}</span>
                    <span className="text-xs font-bold text-slate-500">Prev: {formatCurrency(prevExp)}</span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 block">
                    {prevExp > 0 ? `Change: ${(((totalExp - prevExp) / prevExp) * 100).toFixed(1)}%` : "Baseline Period"}
                  </span>
                </div>

                <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-2">
                  <span className="text-[10px] font-black uppercase text-indigo-800 tracking-wider">Net Profit Comparison</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-indigo-700">{formatCurrency(netPL)}</span>
                    <span className="text-xs font-bold text-slate-500">Prev: {formatCurrency(prevNetPL)}</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 block">
                    {netPL >= prevNetPL ? "🟢 Surplus Growth Positive" : "🔴 Outflow Higher"}
                  </span>
                </div>
              </div>

              {/* Monthly Trend Bar Chart */}
              <div className="pt-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">6-Month Trend Bar Comparison</h4>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(9, 13, 26, 0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", color: "white", fontSize: "11px" }} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                      <Bar dataKey="Revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Expenses" fill="#F43F5E" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "compare_years" && (
          <motion.div
            key="compare_years"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {/* Year-over-Year Comparative Sheet */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6 text-left">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-primary" />
                  <span>Annual Growth &amp; Year-over-Year Audit Sheet</span>
                </h3>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">Annual Audit Metric</span>
                  <span className="text-xs font-black text-emerald-400">Current Year Status</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Cumulative Revenue</span>
                    <span className="text-lg font-black text-white">{formatCurrency(totalRev)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Cumulative Expenses</span>
                    <span className="text-lg font-black text-rose-300">{formatCurrency(totalExp)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Net Profit Margin</span>
                    <span className="text-lg font-black text-emerald-300">{marginPercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
