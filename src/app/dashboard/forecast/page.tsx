"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart as LucideLineChart,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  DollarSign,
  Sliders,
  ArrowUpRight,
  Sparkles,
  Calculator,
  Percent,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from "recharts";
import { useAccounting } from "@/context/AccountingContext";

export default function ForecastPage() {
  const {
    transactions,
    formatCurrency,
    user,
    growthRate,
    savingsRate,
    horizon,
    saveForecastSettings
  } = useAccounting();
  const [mounted, setMounted] = useState(false);
  
  // Local interaction states for smooth real-time sliding without layout lockups
  const [localGrowthRate, setLocalGrowthRate] = useState(10);
  const [localSavingsRate, setLocalSavingsRate] = useState(15);
  const [localHorizon, setLocalHorizon] = useState(3);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync local sliders when global Supabase settings load
  useEffect(() => {
    if (growthRate !== undefined) setLocalGrowthRate(growthRate);
    if (savingsRate !== undefined) setLocalSavingsRate(savingsRate);
    if (horizon !== undefined) setLocalHorizon(horizon);
  }, [growthRate, savingsRate, horizon]);

  // Debounced auto-save effect to prevent slamming Supabase on slide dragging
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        localGrowthRate !== growthRate ||
        localSavingsRate !== savingsRate ||
        localHorizon !== horizon
      ) {
        saveForecastSettings(localGrowthRate, localSavingsRate, localHorizon);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [localGrowthRate, localSavingsRate, localHorizon, growthRate, savingsRate, horizon, saveForecastSettings]);

  // ── 1. HISTORICAL GROUPING ────────────────────────────────────────────────
  const historicalMonthlyData = useMemo(() => {
    const groups: Record<string, { revenue: number; expenses: number }> = {};
    
    // Group actual transactions
    transactions.forEach(tx => {
      if (!tx.date) return;
      const month = tx.date.substring(0, 7);
      if (!groups[month]) {
        groups[month] = { revenue: 0, expenses: 0 };
      }
      groups[month].revenue += tx.onlineAmount + tx.cashAmount;
      groups[month].expenses += tx.expensesAmount;
    });

    // Only use real transaction data — no mock history is generated.

    return Object.entries(groups)
      .map(([month, val]) => {
        const [year, m] = month.split("-").map(Number);
        const label = new Date(year, m - 1, 1).toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit"
        });
        return {
          month,
          label,
          revenue: val.revenue,
          expenses: val.expenses,
          net: val.revenue - val.expenses,
          isForecast: false
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  // ── 2. AVERAGE CALCULATIONS FOR PROJECTION BASELINE ─────────────────────────
  const averageMonthlyRevenue = useMemo(() => {
    const historical = historicalMonthlyData.filter(d => !d.isForecast);
    const sum = historical.reduce((acc, d) => acc + d.revenue, 0);
    return historical.length ? sum / historical.length : 0;
  }, [historicalMonthlyData]);

  const averageMonthlyExpenses = useMemo(() => {
    const historical = historicalMonthlyData.filter(d => !d.isForecast);
    const sum = historical.reduce((acc, d) => acc + d.expenses, 0);
    return historical.length ? sum / historical.length : 0;
  }, [historicalMonthlyData]);

  // ── 3. FORECAST TIMELINE CALCULATION ───────────────────────────────────────
  const chartData = useMemo(() => {
    const result = [...historicalMonthlyData];
    
    // Determine the starting point for predictions
    const lastHist = historicalMonthlyData[historicalMonthlyData.length - 1];
    let startYear = new Date().getFullYear();
    let startMonth = new Date().getMonth();

    if (lastHist) {
      const [y, m] = lastHist.month.split("-").map(Number);
      startYear = y;
      startMonth = m - 1; // 0-indexed
    }

    // Append future forecast months
    for (let i = 1; i <= localHorizon; i++) {
      const nextDate = new Date(startYear, startMonth + i, 1);
      const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
      
      const projectedRevenue = Math.round(averageMonthlyRevenue * (1 + localGrowthRate / 100));
      const projectedExpenses = Math.round(averageMonthlyExpenses * (1 - localSavingsRate / 100));
      
      result.push({
        month: nextKey,
        label: nextDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        revenue: projectedRevenue,
        expenses: projectedExpenses,
        net: projectedRevenue - projectedExpenses,
        isForecast: true
      });
    }

    return result;
  }, [historicalMonthlyData, averageMonthlyRevenue, averageMonthlyExpenses, localGrowthRate, localSavingsRate, localHorizon]);

  // ── 4. FORECAST SUMMARY KPIS ──────────────────────────────────────────────
  const summaryKPIs = useMemo(() => {
    const forecastMonths = chartData.filter(d => d.isForecast);
    const totalProjRevenue = forecastMonths.reduce((acc, d) => acc + d.revenue, 0);
    const totalProjExpenses = forecastMonths.reduce((acc, d) => acc + d.expenses, 0);
    const totalProjNet = totalProjRevenue - totalProjExpenses;
    
    // Estimate runway / ending cash
    const startingBalance = user?.startingBalance || 0;
    const currentHistNet = historicalMonthlyData.reduce((acc, d) => acc + d.net, 0);
    const estimatedStartingBalance = startingBalance + currentHistNet;
    const projectedEndingBalance = estimatedStartingBalance + totalProjNet;

    return {
      revenue: totalProjRevenue,
      expenses: totalProjExpenses,
      net: totalProjNet,
      endingBalance: projectedEndingBalance,
      avgNet: forecastMonths.length ? totalProjNet / forecastMonths.length : 0
    };
  }, [chartData, historicalMonthlyData, user]);

  // Custom tooltips for Chart
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-border-color shadow-xl text-left">
          <div className="flex items-center space-x-1.5 mb-2">
            <span className={`w-2 h-2 rounded-full ${data.isForecast ? "bg-primary" : "bg-emerald-500"}`} />
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              {data.label} {data.isForecast ? "(Forecast)" : "(Actual)"}
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between space-x-8 font-semibold">
              <span className="text-text-secondary">Revenue:</span>
              <span className="text-indigo-600 font-bold">{formatCurrency(data.revenue)}</span>
            </div>
            <div className="flex justify-between space-x-8 font-semibold">
              <span className="text-text-secondary">Expenses:</span>
              <span className="text-rose-500 font-bold">{formatCurrency(data.expenses)}</span>
            </div>
            <div className="flex justify-between space-x-8 border-t border-slate-100 pt-1 mt-1 font-bold">
              <span className="text-text-primary">Net profit:</span>
              <span className={data.net >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {formatCurrency(data.net)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-12 text-left">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-6">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight flex items-center gap-2">
            <LucideLineChart className="w-7 h-7 text-primary stroke-[2.5]" />
            <span>Cash Flow Forecast</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Analyze historical ledger trends to predict and guide future revenue objectives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-secondary hidden sm:block" />
          <div className="relative flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200/60 shadow-sm">
            {[3, 6, 9].map((val) => (
              <button
                key={val}
                onClick={() => setLocalHorizon(val)}
                className={`relative z-10 px-3.5 py-1.5 text-[11px] font-extrabold rounded-xl cursor-pointer transition-all duration-300 ease-out ${
                  localHorizon === val
                    ? "bg-white text-primary shadow-md ring-1 ring-primary/15 scale-[1.02]"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                }`}
              >
                {val}M
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Projected Income */}
        <div className="glass-card rounded-2xl p-5 border border-border-color bg-white/70 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Projected Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-black text-text-primary">{formatCurrency(summaryKPIs.revenue)}</h3>
            <p className="text-[10px] text-text-secondary font-semibold mt-1">
              Estimated total revenue in {localHorizon}m
            </p>
          </div>
        </div>

        {/* KPI: Projected Outflow */}
        <div className="glass-card rounded-2xl p-5 border border-border-color bg-white/70 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Projected Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-black text-text-primary">{formatCurrency(summaryKPIs.expenses)}</h3>
            <p className="text-[10px] text-text-secondary font-semibold mt-1">
              Reflects savings rate of {localSavingsRate}%
            </p>
          </div>
        </div>

        {/* KPI: Net surplus */}
        <div className="glass-card rounded-2xl p-5 border border-border-color bg-white/70 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Net Profit Projection</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
              summaryKPIs.net >= 0 ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className={`text-lg font-black ${summaryKPIs.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatCurrency(summaryKPIs.net)}
            </h3>
            <p className="text-[10px] text-text-secondary font-semibold mt-1">
              Estimated margin: {summaryKPIs.revenue ? Math.round((summaryKPIs.net / summaryKPIs.revenue) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* KPI: Ending Balance */}
        <div className="glass-card rounded-2xl p-5 border border-border-color bg-white/70 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Ending Cash Balance</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-black text-text-primary">{formatCurrency(summaryKPIs.endingBalance)}</h3>
            <p className="text-[10px] text-text-secondary font-semibold mt-1">
              Runway reserve estimate
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area - Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Real-time Settings Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-3xl p-6 bg-white border border-border-color shadow-md space-y-6">
            <div className="flex items-center space-x-2.5 border-b border-border-color pb-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                <Sliders className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-text-primary">Projection Settings</h3>
                <p className="text-[10px] text-text-secondary font-semibold">Tweak multipliers in real time</p>
              </div>
            </div>

            {/* Slider 1: Revenue Growth */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-text-primary flex items-center gap-1.5">
                  Revenue Growth
                  <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded">{localGrowthRate > 0 ? `+${localGrowthRate}` : localGrowthRate}%</span>
                </label>
                <span className="text-[10px] text-text-secondary font-semibold">Target growth</span>
              </div>
              <input
                type="range"
                min="-20"
                max="50"
                step="1"
                value={localGrowthRate}
                onChange={(e) => setLocalGrowthRate(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] text-text-secondary font-semibold">
                <span>-20% (Decline)</span>
                <span>0% (Stable)</span>
                <span>+50% (High Growth)</span>
              </div>
            </div>

            {/* Slider 2: Expense Savings */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-text-primary flex items-center gap-1.5">
                  Expense Reductions
                  <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.5 rounded">{localSavingsRate > 0 ? `+${localSavingsRate}` : localSavingsRate}%</span>
                </label>
                <span className="text-[10px] text-text-secondary font-semibold">Budget optimization</span>
              </div>
              <input
                type="range"
                min="-15"
                max="50"
                step="1"
                value={localSavingsRate}
                onChange={(e) => setLocalSavingsRate(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div className="flex justify-between text-[9px] text-text-secondary font-semibold">
                <span>-15% (Inflation)</span>
                <span>0% (None)</span>
                <span>+50% (Aggressive Saving)</span>
              </div>
            </div>

            {/* Smart Summary Info block */}
            <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100/30 text-xs text-indigo-950 font-semibold space-y-2">
              <div className="flex items-center space-x-1.5 text-primary mb-1">
                <Calculator className="w-4 h-4 font-bold" />
                <span className="font-bold tracking-tight">Calculation Logic</span>
              </div>
              <p className="leading-relaxed text-text-secondary text-[11px]">
                Base average monthly values are calculated from historical months (Revenue: <strong className="text-text-primary">{formatCurrency(averageMonthlyRevenue)}</strong>, Expenses: <strong className="text-text-primary">{formatCurrency(averageMonthlyExpenses)}</strong>). Projections are compounded monthly.
              </p>
            </div>
          </div>

          {/* Smart Financial Insights Card */}
          <div className="glass-card rounded-3xl p-6 bg-gradient-to-tr from-primary/5 to-cyan-50/5 border border-primary/10 shadow-md text-xs space-y-3.5">
            <div className="flex items-center space-x-1.5">
              <CheckCircle className="w-5 h-5 text-primary" />
              <h4 className="font-display font-black text-sm text-text-primary uppercase tracking-wider">Forecast Insights</h4>
            </div>
            
            <ul className="space-y-2.5 text-text-secondary font-semibold">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <span>
                  By maintaining a <strong className="text-text-primary">{localGrowthRate > 0 ? `+${localGrowthRate}` : localGrowthRate}% growth rate</strong>, monthly revenue is expected to climb to <strong className="text-text-primary">{formatCurrency(averageMonthlyRevenue * (1 + localGrowthRate/100))}</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                <span>
                  Applying a <strong className="text-text-primary">{localSavingsRate}% expense reduction</strong> creates a monthly buffer of <strong className="text-text-primary">{formatCurrency(averageMonthlyExpenses * (localSavingsRate/100))}</strong> in optimization.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <span>
                  Net profit is projected to yield <strong className="text-text-primary">{formatCurrency(summaryKPIs.net)}</strong> over {localHorizon} months, contributing to capital growth.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Charts & Table Panel (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Visual Recharts Forecast */}
          <div className="glass-card rounded-3xl p-6 bg-white border border-border-color shadow-md">
            <div className="flex items-center justify-between border-b border-border-color pb-4 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <LucideLineChart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-text-primary">Historical vs Projected Trend</h4>
                  <p className="text-[10px] text-text-secondary font-semibold">Faded bar indicates projections</p>
                </div>
              </div>
              
              {/* Legend Badges */}
              <div className="flex items-center space-x-3 text-[10px] font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-500/20 border border-indigo-500/40" />
                  <span className="text-text-secondary">Revenue</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="text-text-secondary">Expenses</span>
                </span>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.5)" />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={10}
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99, 102, 241, 0.03)" }} />
                  <Bar
                    dataKey="revenue"
                    radius={[6, 6, 0, 0]}
                  >
                    {chartData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isForecast ? "rgba(99, 102, 241, 0.2)" : "url(#revGradient)"}
                        stroke={entry.isForecast ? "#6366F1" : "transparent"}
                        strokeDasharray={entry.isForecast ? "3 3" : "0"}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#F43F5E"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 1.5, fill: "#fff" }}
                    activeDot={{ r: 5 }}
                  />
                  {/* Divider Reference line between History and Projection */}
                  <ReferenceLine
                    x={historicalMonthlyData[historicalMonthlyData.length - 1]?.label}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: "PROJECTION START",
                      position: "top",
                      fill: "#94a3b8",
                      fontSize: 8,
                      fontWeight: "bold",
                      letterSpacing: 1
                    }}
                  />
                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.85} />
                      <stop offset="95%" stopColor="#818CF8" stopOpacity={0.15} />
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown Monthly Table */}
          <div className="glass-card rounded-3xl p-6 bg-white border border-border-color shadow-md">
            <div className="flex items-center space-x-2 border-b border-border-color pb-4 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-text-primary">Runway Projection Ledger</h4>
                <p className="text-[10px] text-text-secondary font-semibold">Simulated ledger schedule</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-text-secondary font-bold">
                    <th className="py-3 px-1.5">Period</th>
                    <th className="py-3 px-1.5 text-right">Projected Revenue</th>
                    <th className="py-3 px-1.5 text-right">Projected Expenses</th>
                    <th className="py-3 px-1.5 text-right">Estimated Net</th>
                    <th className="py-3 px-1.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold">
                  {chartData.filter(d => d.isForecast).map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-1.5 font-bold text-text-primary">
                        {row.label}
                      </td>
                      <td className="py-3.5 px-1.5 text-right text-indigo-600 font-extrabold">
                        {formatCurrency(row.revenue)}
                      </td>
                      <td className="py-3.5 px-1.5 text-right text-rose-500 font-bold">
                        {formatCurrency(row.expenses)}
                      </td>
                      <td className={`py-3.5 px-1.5 text-right font-extrabold ${row.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {formatCurrency(row.net)}
                      </td>
                      <td className="py-3.5 px-1.5 text-center">
                        <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          row.net >= 0 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                        }`}>
                          {row.net >= 0 ? "Surplus" : "Deficit"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
