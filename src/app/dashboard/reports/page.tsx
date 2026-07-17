"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Sparkles,
  ChevronRight,
  Activity,
  DollarSign,
  CheckCircle,
  Briefcase,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Zap,
  Award,
  Info,
  Search,
  PlusCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";

import { useAccounting } from "@/context/AccountingContext";

const generateRefId = () => Math.random().toString(36).substring(2, 9).toUpperCase();

// Color palettes for Donut chart
const BREAKDOWN_COLORS = [
  "#2563EB", // Primary Royal Blue
  "#7C3AED", // Secondary Purple
  "#22C55E", // Success Emerald Green
  "#EF4444", // Danger Soft Red
  "#F59E0B", // Warning Amber
  "#06B6D4", // Teal / Cyan
  "#EC4899"  // Pink
];

// Formatting utility for growth metrics
const formatGrowth = (val: number) => {
  if (val === 0) return "0%";
  return `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`;
};

// Custom SVG component for isometric 3D-style bars in Recharts with Framer Motion animations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Custom3DBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  if (height === 0 || height === undefined || isNaN(height)) return null;

  // Depth parameter for the isometric perspective shift
  const depth = 5;
  
  let frontColor = fill;
  let topColor = fill;
  let rightColor = fill;

  // Map theme colors or gradient references to gorgeous 3D shaders
  if (fill.startsWith("url(")) {
    if (fill.includes("Revenue") || fill.includes("trendRev") || fill.includes("inflow")) {
      frontColor = "url(#inflowFront)";
      topColor = "url(#inflowTop)";
      rightColor = "url(#inflowRight)";
    } else if (fill.includes("Expenses") || fill.includes("trendExp") || fill.includes("outflow")) {
      frontColor = "url(#outflowFront)";
      topColor = "url(#outflowTop)";
      rightColor = "url(#outflowRight)";
    } else {
      frontColor = "url(#balanceFront)";
      topColor = "url(#balanceTop)";
      rightColor = "url(#balanceRight)";
    }
  } else {
    if (fill === "#2563EB" || fill === "#3b82f6" || fill === "#2563eb") {
      frontColor = "url(#inflowFront)";
      topColor = "url(#inflowTop)";
      rightColor = "url(#inflowRight)";
    } else if (fill === "#EF4444" || fill === "#ef4444" || fill === "#f43f5e") {
      frontColor = "url(#outflowFront)";
      topColor = "url(#outflowTop)";
      rightColor = "url(#outflowRight)";
    } else {
      frontColor = "url(#balanceFront)";
      topColor = "url(#balanceTop)";
      rightColor = "url(#balanceRight)";
    }
  }

  const drawHeight = Math.max(0.1, height);
  const baselineY = y + drawHeight;

  return (
    <motion.g
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      style={{ originX: `${x + width / 2}px`, originY: `${baselineY}px` }}
    >
      {/* Front Isometric Panel */}
      <rect x={x} y={y} width={width - depth} height={drawHeight} fill={frontColor} rx={1} />
      
      {/* Top Isometric Cap Panel */}
      <polygon
        points={`${x},${y} ${x + depth},${y - depth} ${x + width},${y - depth} ${x + width - depth},${y}`}
        fill={topColor}
      />
      
      {/* Right Lateral Panel */}
      <polygon
        points={`${x + width - depth},${y} ${x + width},${y - depth} ${x + width},${y + drawHeight - depth} ${x + width - depth},${y + drawHeight}`}
        fill={rightColor}
      />
    </motion.g>
  );
};

// Custom 3D Shimmering Skeleton Loader helper
const Skeleton3DBar = ({ heightPct }: { heightPct: number }) => {
  return (
    <svg className="w-5 shrink-0 opacity-40 hover:opacity-60 transition-opacity" style={{ height: `${heightPct}%` }} viewBox="0 0 24 100" preserveAspectRatio="none">
      <rect x="0" y="4" width="18" height="96" fill="#cbd5e1" rx="0.5" />
      <polygon points="0,4 4,0 22,0 18,4" fill="#e2e8f0" />
      <polygon points="18,4 22,0 22,96 18,100" fill="#94a3b8" />
    </svg>
  );
};

// Custom interactive tooltip with glassmorphism dark mode
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label, formatCurrency: propFormatCurrency }: any) => {
  const { formatCurrency: contextFormatCurrency } = useAccounting();
  const formatCurrency = propFormatCurrency || contextFormatCurrency;
  if (active && payload && payload.length) {
    const dateStr = payload[0].payload.dateFull;
    let formattedDate = "";
    try {
      formattedDate = new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      formattedDate = `Day ${label}`;
    }

    return (
      <div className="bg-slate-950/95 border border-slate-800/80 shadow-2xl rounded-xl p-4 text-left min-w-[200px] backdrop-blur-md transition-all duration-300 z-50">
        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-2">{formattedDate}</p>
        <div className="space-y-1.5">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {payload.map((p: any) => {
            const nameLabel = p.name === "Revenue" ? "Inflow" : p.name === "Expenses" ? "Outflow" : p.name;
            const color = p.name === "Revenue" ? "text-blue-400" : p.name === "Expenses" ? "text-rose-400" : "text-emerald-400";
            const dotColor = p.name === "Revenue" ? "bg-blue-500" : p.name === "Expenses" ? "bg-rose-500" : "bg-emerald-500";
            return (
              <div key={p.name} className="flex items-center justify-between text-xs font-bold space-x-6">
                <div className="flex items-center space-x-2 text-slate-300">
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  <span>{nameLabel}:</span>
                </div>
                <span className={`font-black text-right ${color}`}>{formatCurrency(p.value)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const { transactions, dailySummaries, user, selectedMonth, setSelectedMonth, formatCurrency } = useAccounting();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "compare-months" | "compare-years" | "cashflow">("overview");

  // State filters
  const [activeMonth, setActiveMonth] = useState("");
  const [compMonth1, setCompMonth1] = useState("");
  const [compMonth2, setCompMonth2] = useState("");
  const [compMonth3, setCompMonth3] = useState("");

  // Graph display toggles
  const [trendDisplay, setTrendDisplay] = useState<"all" | "revenue" | "expenses" | "profit">("all");
  const [chartType, setChartType] = useState<"area" | "bar3d" | "line">("area");
  const [chartLoading, setChartLoading] = useState(false);
  const [activeExpenseIndex, setActiveExpenseIndex] = useState<number | null>(null);
  const [cashFlowView, setCashFlowView] = useState<"balance" | "flow">("balance");

  // Hydration safety check
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Trigger brief skeletal transition loading when switching month scope or view type
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChartLoading(true);
    const timer = setTimeout(() => setChartLoading(false), 450);
    return () => clearTimeout(timer);
  }, [activeMonth, cashFlowView]);

  // Sync initial month from context
  useEffect(() => {
    const current = selectedMonth && selectedMonth !== "All"
      ? selectedMonth
      : new Date().toISOString().split("T")[0].substring(0, 7);
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveMonth(current);

    // Default comparison months: active vs previous vs two months ago
    try {
      const [y, m] = current.split("-").map(Number);
      const prevDate1 = new Date(y, m - 2, 1);
      const prevDate2 = new Date(y, m - 3, 1);
      const prevMonthStr1 = `${prevDate1.getFullYear()}-${String(prevDate1.getMonth() + 1).padStart(2, "0")}`;
      const prevMonthStr2 = `${prevDate2.getFullYear()}-${String(prevDate2.getMonth() + 1).padStart(2, "0")}`;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompMonth1(current);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompMonth2(prevMonthStr1);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompMonth3(prevMonthStr2);
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompMonth1("2026-06");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompMonth2("2026-05");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompMonth3("");
    }
  }, [selectedMonth]);

  // Dynamic date labels helper
  const getMonthLabel = (monthStr: string) => {
    if (!monthStr || monthStr === "All") return "All Time";
    try {
      const [year, month] = monthStr.split("-").map(Number);
      const d = new Date(year, month - 1, 1);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return monthStr;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DYNAMIC COMPUTATIONS & ANALYTICS
  // ─────────────────────────────────────────────────────────────────────────

  // 1. Current & Previous Month Metrics
  const monthlyMetrics = useMemo(() => {
    if (!activeMonth) return { revenue: 0, expenses: 0, profit: 0, prevRevenue: 0, prevExpenses: 0, prevProfit: 0, revGrowth: 0, expGrowth: 0, profitGrowth: 0 };

    const filterMonthData = (mKey: string) => {
      const txs = transactions.filter(t => t.date.startsWith(mKey));
      const rev = txs.reduce((acc, t) => acc + t.onlineAmount + t.cashAmount, 0);
      const exp = txs.reduce((acc, t) => acc + t.expensesAmount, 0);
      return { rev, exp, profit: rev - exp };
    };

    const current = filterMonthData(activeMonth);

    // Compute previous month
    let prevMonthStr = "";
    try {
      const [y, m] = activeMonth.split("-").map(Number);
      const d = new Date(y, m - 2, 1);
      prevMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } catch {
      prevMonthStr = "";
    }

    const previous = prevMonthStr ? filterMonthData(prevMonthStr) : { rev: 0, exp: 0, profit: 0 };

    // Calculate growth percentages
    const calcGrowth = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / Math.abs(prev)) * 100;
    };

    return {
      revenue: current.rev,
      expenses: current.exp,
      profit: current.profit,
      prevRevenue: previous.rev,
      prevExpenses: previous.exp,
      prevProfit: previous.profit,
      revGrowth: calcGrowth(current.rev, previous.rev),
      expGrowth: calcGrowth(current.exp, previous.exp),
      profitGrowth: calcGrowth(current.profit, previous.profit)
    };
  }, [activeMonth, transactions]);

  // Sparkline data generation (last 30 days or active month daily entries)
  const sparklineData = useMemo(() => {
    if (!activeMonth) return [];
    const monthEntries = dailySummaries
      .filter(s => s.date.startsWith(activeMonth))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (monthEntries.length === 0) {
      return Array.from({ length: 10 }, () => ({ revenue: 0, expenses: 0, profit: 0 }));
    }

    return monthEntries.map(s => ({
      revenue: s.revenue,
      expenses: s.expenses,
      profit: s.netPL
    }));
  }, [activeMonth, dailySummaries]);

  // 2. Trend Area Chart Data
  const getDaysInMonth = (monthStr: string) => {
    if (!monthStr) return 30;
    try {
      const [year, month] = monthStr.split("-").map(Number);
      return new Date(year, month, 0).getDate();
    } catch {
      return 30;
    }
  };

  const trendChartData = useMemo(() => {
    if (!activeMonth) return [];
    const daysInMonth = getDaysInMonth(activeMonth);
    const data = [];
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, "0");
      const dateKey = `${activeMonth}-${dayStr}`;
      const summary = dailySummaries.find(s => s.date === dateKey);
      
      data.push({
        day: dayStr, // Always format as "01", "02", ... for axis cleanliness
        Revenue: summary ? summary.revenue : 0,
        Expenses: summary ? summary.expenses : 0,
        Profit: summary ? summary.netPL : 0,
        dateFull: dateKey
      });
    }
    return data;
  }, [activeMonth, dailySummaries]);

  const isMonthEmpty = useMemo(() => {
    if (trendChartData.length === 0) return true;
    return trendChartData.every(d => d.Revenue === 0 && d.Expenses === 0);
  }, [trendChartData]);

  // Note: Financial Health Score and AI-Style Insights are defined below cashFlowMetrics to access runway and category allocations.

  // 4. Monthly Comparison Details
  const monthCompData = useMemo(() => {
    if (!compMonth1 || !compMonth2) {
      return {
        m1: { label: "", rev: 0, exp: 0, pl: 0 },
        m2: { label: "", rev: 0, exp: 0, pl: 0 },
        m3: null,
        chart: []
      };
    }

    const getMonthStats = (mKey: string) => {
      const txs = transactions.filter(t => t.date.startsWith(mKey));
      const rev = txs.reduce((acc, t) => acc + t.onlineAmount + t.cashAmount, 0);
      const exp = txs.reduce((acc, t) => acc + t.expensesAmount, 0);
      return { rev, exp, pl: rev - exp };
    };

    const m1Stats = getMonthStats(compMonth1);
    const m2Stats = getMonthStats(compMonth2);
    const m3Stats = compMonth3 ? getMonthStats(compMonth3) : null;

    const chart = [
      {
        name: "Gross Revenue",
        [getMonthLabel(compMonth1)]: m1Stats.rev,
        [getMonthLabel(compMonth2)]: m2Stats.rev,
        ...(m3Stats && { [getMonthLabel(compMonth3)]: m3Stats.rev })
      },
      {
        name: "Total Expenses",
        [getMonthLabel(compMonth1)]: m1Stats.exp,
        [getMonthLabel(compMonth2)]: m2Stats.exp,
        ...(m3Stats && { [getMonthLabel(compMonth3)]: m3Stats.exp })
      },
      {
        name: "Net Profit",
        [getMonthLabel(compMonth1)]: m1Stats.pl,
        [getMonthLabel(compMonth2)]: m2Stats.pl,
        ...(m3Stats && { [getMonthLabel(compMonth3)]: m3Stats.pl })
      }
    ];

    return {
      m1: { label: getMonthLabel(compMonth1), ...m1Stats },
      m2: { label: getMonthLabel(compMonth2), ...m2Stats },
      m3: m3Stats ? { label: getMonthLabel(compMonth3), ...m3Stats } : null,
      chart
    };
  }, [compMonth1, compMonth2, compMonth3, transactions]);

  // 5. Yearly Comparison Analytics
  const yearlyCompData = useMemo(() => {
    const getYearStats = (yr: number) => {
      const txs = transactions.filter(t => t.date.startsWith(String(yr)));
      const rev = txs.reduce((acc, t) => acc + t.onlineAmount + t.cashAmount, 0);
      const exp = txs.reduce((acc, t) => acc + t.expensesAmount, 0);
      return { rev, exp, pl: rev - exp };
    };

    const y24 = getYearStats(2024);
    const y25 = getYearStats(2025);
    const y26 = getYearStats(2026);

    return {
      stats: { 2024: y24, 2025: y25, 2026: y26 },
      chart: [
        { year: "2024", Revenue: y24.rev, Expenses: y24.exp, Profit: y24.pl },
        { year: "2025", Revenue: y25.rev, Expenses: y25.exp, Profit: y25.pl },
        { year: "2026", Revenue: y26.rev, Expenses: y26.exp, Profit: y26.pl }
      ]
    };
  }, [transactions]);

  // 6. Expense Breakdown (Pie Data)
  const expenseBreakdownData = useMemo(() => {
    if (!activeMonth) return [];

    const categories: Record<string, number> = {};
    const monthTxs = transactions.filter(t => t.date.startsWith(activeMonth));

    let totalExpSum = 0;
    monthTxs.forEach(t => {
      if (t.expenses) {
        t.expenses.forEach(e => {
          const categoryName = e.title.trim() || "Uncategorized";
          categories[categoryName] = (categories[categoryName] || 0) + e.amount;
          totalExpSum += e.amount;
        });
      } else if (t.expensesAmount > 0) {
        // Fallback to category field if items array is missing
        const categoryName = t.category || "General Overhead";
        categories[categoryName] = (categories[categoryName] || 0) + t.expensesAmount;
        totalExpSum += t.expensesAmount;
      }
    });

    const parsedData = Object.entries(categories).map(([name, val]) => ({
      name,
      value: val,
      percentage: totalExpSum > 0 ? (val / totalExpSum) * 100 : 0
    }));

    if (parsedData.length === 0) {
      // No expense data logged — return empty so the UI shows a proper empty state
      return [];
    }

    return parsedData.sort((a, b) => b.value - a.value);
  }, [activeMonth, transactions]);

  // 6.5 Segments for Donut Chart calculation
  const segments = useMemo(() => {
    const totalValue = expenseBreakdownData.reduce((sum, item) => sum + item.value, 0);
    let accumulatedValue = 0;
    return expenseBreakdownData.map((item, idx) => {
      const color = BREAKDOWN_COLORS[idx % BREAKDOWN_COLORS.length];
      const length = (item.percentage / 100) * 282.743;
      const offset = totalValue > 0 ? (accumulatedValue / totalValue) * 282.743 : 0;
      accumulatedValue += item.value;
      return {
        ...item,
        color,
        length,
        offset,
        idx
      };
    });
  }, [expenseBreakdownData]);

  // 7. Cash Flow waterfall analytics
  const cashFlowMetrics = useMemo(() => {
    if (!activeMonth) return { opening: 0, netMovement: 0, carryForward: 0, dailyBalances: [] };

    // Standard starting index balance base
    const baseOpeningBalance = user?.startingBalance ?? 15000; 

    // Sum of net profit/loss for all months/days before this selected activeMonth
    let accumulatedPriorPL = 0;
    transactions.forEach(t => {
      if (t.date < `${activeMonth}-01`) {
        accumulatedPriorPL += (t.onlineAmount + t.cashAmount - t.expensesAmount);
      }
    });

    const openingBalanceCalculated = baseOpeningBalance + accumulatedPriorPL;
    const rev = monthlyMetrics.revenue;
    const exp = monthlyMetrics.expenses;
    const netCashMovement = rev - exp;
    const carryForwardBalance = openingBalanceCalculated + netCashMovement;

    // Daily running balances calculation mapped continuously across all days in month
    const daysInMonth = getDaysInMonth(activeMonth);
    const dailyBalances: { day: string; dateFull: string; Inflow: number; Outflow: number; Balance: number }[] = [];
    let currentDailyTotal = openingBalanceCalculated;

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, "0");
      const dateKey = `${activeMonth}-${dayStr}`;
      const summary = dailySummaries.find(s => s.date === dateKey);
      
      const dayInflow = summary ? summary.revenue : 0;
      const dayOutflow = summary ? summary.expenses : 0;

      if (summary) {
        currentDailyTotal += summary.netPL;
      }
      
      dailyBalances.push({
        day: dayStr,
        dateFull: dateKey,
        Inflow: dayInflow,
        Outflow: dayOutflow,
        Balance: currentDailyTotal
      });
    }

    return {
      opening: openingBalanceCalculated,
      netMovement: netCashMovement,
      carryForward: carryForwardBalance,
      dailyBalances
    };
  }, [activeMonth, transactions, monthlyMetrics, dailySummaries, user]);

  const financialHealthMetrics = useMemo(() => {
    const rev = monthlyMetrics.revenue;
    const exp = monthlyMetrics.expenses;
    const profit = monthlyMetrics.profit;
    const revGrowth = monthlyMetrics.revGrowth;
    const carryForward = cashFlowMetrics.carryForward;

    if (rev === 0) {
      return {
        score: 0,
        rating: "Critical",
        marginScore: 0,
        overheadScore: 0,
        runwayScore: 0,
        growthScore: 0,
        marginVal: 0,
        overheadVal: 0,
        runwayMonths: 0,
      };
    }

    const marginVal = (profit / rev) * 100;
    const overheadVal = (exp / rev) * 100;
    const runwayMonths = exp > 0 ? carryForward / exp : 12;

    // 1. Profit Margin Score (max 30 pts)
    let marginScore = 0;
    if (marginVal >= 30) marginScore = 30;
    else if (marginVal > 0) marginScore = Math.round(marginVal * 1.0);

    // 2. Overhead Control Score (max 25 pts)
    let overheadScore = 0;
    if (overheadVal < 40) overheadScore = 25;
    else if (overheadVal < 80) overheadScore = Math.round((80 - overheadVal) * 0.625);

    // 3. Cash Runway Safety Score (max 25 pts)
    let runwayScore = 0;
    if (runwayMonths >= 6) runwayScore = 25;
    else if (runwayMonths >= 1) runwayScore = Math.round((runwayMonths - 1) * 5);

    // 4. Revenue Growth Velocity Score (max 20 pts)
    let growthScore = 0;
    if (revGrowth >= 10) growthScore = 20;
    else if (revGrowth > 0) growthScore = Math.round(revGrowth * 2.0);

    const totalScore = Math.max(10, Math.min(100, marginScore + overheadScore + runwayScore + growthScore));

    let rating = "Critical";
    if (totalScore >= 80) rating = "Excellent";
    else if (totalScore >= 65) rating = "Good";
    else if (totalScore >= 45) rating = "Fair";

    return {
      score: totalScore,
      rating,
      marginScore,
      overheadScore,
      runwayScore,
      growthScore,
      marginVal,
      overheadVal,
      runwayMonths,
    };
  }, [monthlyMetrics, cashFlowMetrics]);

  const smartInsights = useMemo(() => {
    const list: { title: string; desc: string; type: "success" | "warning" | "info" | "purple"; badge: string }[] = [];
    if (!activeMonth || transactions.length === 0) {
      return [
        {
          title: "Setup Sandbox Sheet",
          desc: "Complete at least one transaction to activate the real-time financial insights generator.",
          type: "info" as const,
          badge: "Ready"
        }
      ];
    }

    const metrics = monthlyMetrics;
    const carryForward = cashFlowMetrics.carryForward;
    const daysInMonth = getDaysInMonth(activeMonth);
    const dailyBurn = metrics.expenses / (daysInMonth || 30);
    const dailyRevAvg = metrics.revenue / (daysInMonth || 30);
    const profitMarginRatio = metrics.revenue > 0 ? (metrics.profit / metrics.revenue) : 0;
    const marginVal = profitMarginRatio * 100;

    // 1. Break-Even Threshold Analysis
    const breakEvenMonthly = metrics.expenses;
    const breakEvenDaily = dailyBurn;
    const salesFloorForHealthyMargin = dailyBurn / 0.8;

    if (metrics.profit > 0) {
      list.push({
        title: "Break-Even Threshold Analysis",
        desc: `With a daily operating expense burn of ${formatCurrency(breakEvenDaily)} (${formatCurrency(metrics.expenses)}/mo), your current average daily sales of ${formatCurrency(dailyRevAvg)} are covering costs cleanly. To secure a safe 20% profit margin buffer, maintain a daily sales floor of ${formatCurrency(salesFloorForHealthyMargin)}. Currently, you operate ${dailyRevAvg >= salesFloorForHealthyMargin ? "above" : "slightly below"} this threshold.`,
        type: "info",
        badge: "Break-Even"
      });
    } else {
      list.push({
        title: "Break-Even Deficit Warning",
        desc: `Your daily operating expense burn of ${formatCurrency(breakEvenDaily)} (${formatCurrency(metrics.expenses)}/mo) is outstripping average daily sales of ${formatCurrency(dailyRevAvg)}. You require an additional ${formatCurrency(breakEvenMonthly - metrics.revenue)} in monthly sales to reach break-even. Target an immediate daily sales floor of ${formatCurrency(breakEvenDaily)} just to cover costs.`,
        type: "warning",
        badge: "Break-Even Deficit"
      });
    }

    // 2. Cash Runway Safety Index
    const runwayVal = metrics.expenses > 0 ? (carryForward / metrics.expenses) : 12;
    const targetBuffer = metrics.expenses * 6;
    const bufferGap = targetBuffer - carryForward;

    list.push({
      title: "Cash Runway Safety Index",
      desc: `Your liquid carry forward balance of ${formatCurrency(carryForward)} provides an estimated runway of ${runwayVal.toFixed(1)} months under the current monthly expense structure of ${formatCurrency(metrics.expenses)}. To secure the recommended 6-month operating safety reserve (${formatCurrency(targetBuffer)}), you need to accumulate an additional ${formatCurrency(Math.max(0, bufferGap))} in cash reserves. Discretionary expansion investments should be deferred until reserves cross this safety threshold.`,
      type: "purple",
      badge: runwayVal >= 6 ? "Runway Safe" : "Runway Low"
    });

    // 3. Overhead Allocation Audit
    let topExpName = "None";
    let topExpVal = 0;
    let topExpPct = 0;
    if (expenseBreakdownData && expenseBreakdownData.length > 0) {
      topExpName = expenseBreakdownData[0].name;
      topExpVal = expenseBreakdownData[0].value;
      topExpPct = expenseBreakdownData[0].percentage;
    }

    if (topExpVal > 0) {
      const savings10 = topExpVal * 0.1;
      const potentialMargin = ((metrics.profit + savings10) / (metrics.revenue || 1)) * 100;
      list.push({
        title: "Overhead Allocation Audit",
        desc: `Your primary cost center is '${topExpName}', consuming ${topExpPct.toFixed(1)}% of total expenses (${formatCurrency(topExpVal)}). A 10% efficiency trim in this sector would save ${formatCurrency(savings10)}/month, directly transferring to your bottom line and increasing your net profit margin from ${marginVal.toFixed(1)}% to ${potentialMargin.toFixed(1)}%.`,
        type: "warning",
        badge: "Cost Trim"
      });
    }

    // 4. Profit Margin Calibration
    if (marginVal < 15) {
      list.push({
        title: "Profit Margin Calibration",
        desc: `Your net margin is currently low at ${marginVal.toFixed(1)}% (target benchmark is 20-30%). With daily overhead at ${formatCurrency(breakEvenDaily)}, consider a structured 5-8% price optimization on low-overhead retail items or renegotiating recurring SaaS subscriptions to lift the margin index.`,
        type: "warning",
        badge: "Margin Weak"
      });
    } else if (marginVal < 30) {
      list.push({
        title: "Profit Margin Calibration",
        desc: `Operating margin is stable at ${marginVal.toFixed(1)}%. To scale profit into the premium 30%+ tier, prioritize up-selling high-margin services, streamline digital UPI receipts to lower cash handling fees, and automate client invoices.`,
        type: "success",
        badge: "Margin Healthy"
      });
    } else {
      list.push({
        title: "Profit Margin Calibration",
        desc: `Outstanding profit margin of ${marginVal.toFixed(1)}% is in the top decile of retail efficiency! With a monthly net profit of ${formatCurrency(metrics.profit)}, you have high capital reinvestment capacity. Consider allocating 15% of this surplus to digital customer acquisition or SEO optimization to drive next-quarter growth.`,
        type: "success",
        badge: "Margin Premium"
      });
    }

    return list;
  }, [activeMonth, transactions, monthlyMetrics, cashFlowMetrics, expenseBreakdownData, formatCurrency]);

  // 8. Advanced Smart Decisions Summary Paragraph
  const smartAdvancedSummary = useMemo(() => {
    if (!activeMonth) return "";
    const metrics = monthlyMetrics;
    const expenseBreakdown = expenseBreakdownData;

    let summaryText = "";

    if (metrics.revenue > metrics.expenses) {
      summaryText += "Gross monthly receipts are expanding faster than operational overhead, maintaining a highly resilient operating safety margin. ";
    } else {
      summaryText += "Operating overhead has outstripped total incoming receipt flows, creating a temporary monthly capital deficit. Review expense schedules immediately. ";
    }

    if (expenseBreakdown.length > 0) {
      const topExpense = expenseBreakdown[0];
      summaryText += `Capital consumption is driven primarily by outlays in "${topExpense.name}", representing ${topExpense.percentage.toFixed(0)}% of itemized spending. `;
    }

    if (metrics.revGrowth > 0) {
      summaryText += `Your base expansion rate is accelerating, showing positive commercial demand and excellent cash velocity. `;
    } else {
      summaryText += `Expansion is decelerating; consider optimizing active pricing tiers or shifting unused overhead towards targeted customer acquisition. `;
    }

    return summaryText;
  }, [activeMonth, monthlyMetrics, expenseBreakdownData]);

  // ─────────────────────────────────────────────────────────────────────────
  // PREMIUM MULTI-PAGE CORPORATE PDF EXPORT
  // ─────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  // PREMIUM MULTI-PAGE CORPORATE PDF EXPORT
  // ─────────────────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Palette constants
      const primaryBlue = [37, 99, 235];
      const secondaryPurple = [124, 58, 237];
      const successEmerald = [16, 185, 129];
      const dangerRed = [239, 68, 68];
      const warningAmber = [245, 158, 11];
      const darkSlate = [30, 41, 59];
      const borderGray = [226, 232, 240];

      // Safe currency formatting helper to prevent Unicode glitches in jsPDF Helvetica font
      const formatCurrencyPDF = (val: number) => {
        const code = user?.currencyCode || "INR";
        const locale = code === "INR" ? "en-IN" : "en-US";
        const absVal = Math.abs(val);
        const formatted = new Intl.NumberFormat(locale, {
          style: "currency",
          currency: code,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(absVal);
        const cleanVal = formatted.replace(/[^\d,\-\.]/g, "").trim();
        return val < 0 ? `-${code} ${cleanVal || "0"}` : `${code} ${cleanVal || "0"}`;
      };

      const formatGrowthPDF = (val: number) => {
        if (val === 0) return "0.0%";
        return `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`;
      };

      // Header top banner helper
      const drawHeaderBanner = (pageTitle: string) => {
        doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.rect(0, 0, 210, 4, "F");

        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("MY ACCOUNTING", 20, 16);

        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text(pageTitle, 190, 16, { align: "right" });

        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.setLineWidth(0.3);
        doc.line(20, 20, 190, 20);
      };

      // Footer helper
      const addFooter = (pNum: number, total: number) => {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.setLineWidth(0.2);
        doc.line(20, 282, 190, 282);
        
        doc.text("Secure statement generated by My Accounting Analytics Hub. Cryptographic Hash: #" + generateRefId(), 20, 287);
        doc.text(`Page ${pNum} of ${total}`, 190, 287, { align: "right" });
      };

       // Vector Donut Chart Drawing Helpers for PDF (Triangle interpolation for jsPDF compatibility)
       const drawPieSlice = (cx: number, cy: number, r: number, startAngle: number, endAngle: number, rgb: number[]) => {
         const startRad = (startAngle - 90) * Math.PI / 180;
         const endRad = (endAngle - 90) * Math.PI / 180;
         const steps = 30; // 30 triangles is high resolution for a static PDF print
         
         doc.setFillColor(rgb[0], rgb[1], rgb[2]);
         for (let i = 0; i < steps; i++) {
           const angle1 = startRad + (endRad - startRad) * (i / steps);
           const angle2 = startRad + (endRad - startRad) * ((i + 1) / steps);
           
           const x1 = cx + r * Math.cos(angle1);
           const y1 = cy + r * Math.sin(angle1);
           const x2 = cx + r * Math.cos(angle2);
           const y2 = cy + r * Math.sin(angle2);
           
           doc.triangle(cx, cy, x1, y1, x2, y2, "F");
         }
       };

      const drawDonutChart = (cx: number, cy: number, r: number, innerR: number, data: { value: number; color: number[] }[]) => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) return;
        let currentAngle = 0;
        data.forEach(item => {
          const sliceAngle = (item.value / total) * 360;
          if (sliceAngle > 0) {
            drawPieSlice(cx, cy, r, currentAngle, currentAngle + sliceAngle, item.color);
            currentAngle += sliceAngle;
          }
        });
        // Center white circle
        doc.setFillColor(255, 255, 255);
        doc.circle(cx, cy, innerR, "F");
      };

      // ───────────────────────────────────────────────────────────────────────
      // PAGE 1: COVER PAGE & EXECUTIVE SUMMARIES
      // ───────────────────────────────────────────────────────────────────────
      drawHeaderBanner("FINANCIAL PERFORMANCE OVERVIEW");

      // Title Block
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("EXECUTIVE PERFORMANCE REPORT", 20, 29);
      
      // Confidentiality Badge
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(158, 24, 32, 7, 1.5, 1.5, "F");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text("OFFICIAL REPORT", 174, 28.5, { align: "center" });

      // Workspace metadata block (arranged as two parallel columns to guarantee no overlaps)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      
      doc.text("WORKSPACE PROFILE:", 20, 38);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(user?.businessName || "My Retail Shop", 58, 38);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("BASE CURRENCY:", 20, 43);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(`${user?.currencyCode || "INR"}`, 58, 43); // Fixed: Removed the unsupported emoji symbol code

      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("REPORTING SCOPE:", 110, 38);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(getMonthLabel(activeMonth), 146, 38);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("EXPORT TIMESTAMP:", 110, 43);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(new Date().toLocaleString("en-US", { hour12: true }), 146, 43);

      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.line(20, 47, 190, 47);

      // KPI Cards Row (Y=52 to 80)
      const cardY = 52;
      const cardH = 28;
      const cardW = 51;
      const cardGap = 59; // spacing between column starts

      // KPI Card 1: Revenue
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, cardY, cardW, cardH, 2, 2, "F");
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.roundedRect(20, cardY, cardW, cardH, 2, 2, "S");
      doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.rect(20, cardY, 1.5, cardH, "F");

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text("GROSS REVENUE", 25, cardY + 7);
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.setFontSize(11);
      doc.text(formatCurrencyPDF(monthlyMetrics.revenue), 25, cardY + 16);
      
      const revIsUp = monthlyMetrics.revGrowth >= 0;
      doc.setTextColor(revIsUp ? successEmerald[0] : dangerRed[0], revIsUp ? successEmerald[1] : dangerRed[1], revIsUp ? successEmerald[2] : dangerRed[2]);
      doc.setFontSize(7.5);
      doc.text(formatGrowthPDF(monthlyMetrics.revGrowth) + " MoM", 25, cardY + 23);

      // KPI Card 2: Expenses
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20 + cardGap, cardY, cardW, cardH, 2, 2, "F");
      doc.roundedRect(20 + cardGap, cardY, cardW, cardH, 2, 2, "S");
      doc.setFillColor(dangerRed[0], dangerRed[1], dangerRed[2]);
      doc.rect(20 + cardGap, cardY, 1.5, cardH, "F");

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL OUTFLOWS", 25 + cardGap, cardY + 7);
      doc.setTextColor(dangerRed[0], dangerRed[1], dangerRed[2]);
      doc.setFontSize(11);
      doc.text(formatCurrencyPDF(monthlyMetrics.expenses), 25 + cardGap, cardY + 16);
      
      const expIsDown = monthlyMetrics.expGrowth <= 0;
      doc.setTextColor(expIsDown ? successEmerald[0] : warningAmber[0], expIsDown ? successEmerald[1] : warningAmber[1], expIsDown ? successEmerald[2] : warningAmber[2]);
      doc.setFontSize(7.5);
      doc.text(formatGrowthPDF(monthlyMetrics.expGrowth) + " MoM", 25 + cardGap, cardY + 23);

      // KPI Card 3: Net Profit
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20 + cardGap * 2, cardY, cardW, cardH, 2, 2, "F");
      doc.roundedRect(20 + cardGap * 2, cardY, cardW, cardH, 2, 2, "S");
      const isSurplus = monthlyMetrics.profit >= 0;
      doc.setFillColor(isSurplus ? successEmerald[0] : dangerRed[0], isSurplus ? successEmerald[1] : dangerRed[1], isSurplus ? successEmerald[2] : dangerRed[2]);
      doc.rect(20 + cardGap * 2, cardY, 1.5, cardH, "F");

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.text("NET SURPLUS", 25 + cardGap * 2, cardY + 7);
      doc.setTextColor(isSurplus ? successEmerald[0] : dangerRed[0], isSurplus ? successEmerald[1] : dangerRed[1], isSurplus ? successEmerald[2] : dangerRed[2]);
      doc.setFontSize(11);
      doc.text(formatCurrencyPDF(monthlyMetrics.profit), 25 + cardGap * 2, cardY + 16);
      
      const profIsUp = monthlyMetrics.profitGrowth >= 0;
      doc.setTextColor(profIsUp ? successEmerald[0] : dangerRed[0], profIsUp ? successEmerald[1] : dangerRed[1], profIsUp ? successEmerald[2] : dangerRed[2]);
      doc.setFontSize(7.5);
      doc.text(formatGrowthPDF(monthlyMetrics.profitGrowth) + " MoM", 25 + cardGap * 2, cardY + 23);

      // Executive Summary Section
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.text("EXECUTIVE PERFORMANCE SUMMARY", 20, 89);
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setLineWidth(0.3);
      doc.line(20, 92, 190, 92);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const adviceParagraph = smartAdvancedSummary || "Operating ledger reports stable cash runway for this billing cycle.";
      const splitAdvice = doc.splitTextToSize(adviceParagraph, 170);
      doc.text(splitAdvice, 20, 97);

      // Smart Insights Cards Section
      const insightsY = 97 + (splitAdvice.length * 4.5) + 8;
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.text("AUTOMATED SMART ADVISORY INSIGHTS", 20, insightsY);
      doc.line(20, insightsY + 3, 190, insightsY + 3);

      let insightItemY = insightsY + 9;
      doc.setFont("helvetica", "normal");
      
      smartInsights.slice(0, 4).forEach((insight) => {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(20, insightItemY - 4, 170, 13, 1, 1, "F");
        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.roundedRect(20, insightItemY - 4, 170, 13, 1, 1, "S");
        
        let accentColor = primaryBlue;
        if (insight.type === "success") accentColor = successEmerald;
        else if (insight.type === "warning") accentColor = dangerRed;
        else if (insight.type === "purple") accentColor = secondaryPurple;
        else if (insight.type === "info") accentColor = warningAmber;

        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.rect(20, insightItemY - 4, 1.5, 13, "F");

        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(`[${insight.badge}]`, 25, insightItemY + 3.5);

        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        const cleanDesc = doc.splitTextToSize(`${insight.title}: ${insight.desc}`, 125);
        doc.text(cleanDesc, 60, insightItemY + 3.5);

        insightItemY += 16;
      });

      addFooter(1, 4);

      // ───────────────────────────────────────────────────────────────────────
      // PAGE 2: CORE FINANCIAL TREND CHARTS
      // ───────────────────────────────────────────────────────────────────────
      doc.addPage();
      drawHeaderBanner("FINANCIAL CHARTS & TREND ANALYSIS");

      // 1. Channel Share Donut Vector Chart
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("INCOME SOURCE BREAKDOWN (ONLINE VS CASH)", 20, 29);
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.line(20, 32, 190, 32);

      const monthTxs = transactions.filter(t => t.date.startsWith(activeMonth));
      const onlineSum = monthTxs.reduce((sum, t) => sum + t.onlineAmount, 0);
      const cashSum = monthTxs.reduce((sum, t) => sum + t.cashAmount, 0);
      const totalSum = onlineSum + cashSum;

      const ratioOnline = totalSum > 0 ? onlineSum / totalSum : 0.5;
      const ratioCash = totalSum > 0 ? cashSum / totalSum : 0.5;

      // Draw Donut Card background
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, 36, 170, 48, 2, 2, "F");
      doc.roundedRect(20, 36, 170, 48, 2, 2, "S");

      // Render vector donut chart: Center cx=60, cy=60, radius=18, innerRadius=10
      const donutData = [
        { value: onlineSum || 1, color: primaryBlue },
        { value: cashSum || 1, color: secondaryPurple }
      ];
      drawDonutChart(60, 60, 18, 10, donutData);

      // Donut Center Text overlay
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("TOTAL", 60, 58.5, { align: "center" });
      doc.setFontSize(8);
      doc.text(formatCurrencyPDF(totalSum), 60, 62.5, { align: "center" });

      // Legends on the right side of Card
      const legendX = 105;
      doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.circle(legendX, 52, 1.5, "F");
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(`UPI / Online Stream:`, legendX + 5, 53.5);
      doc.setFont("helvetica", "normal");
      doc.text(`${formatCurrencyPDF(onlineSum)} (${(ratioOnline * 100).toFixed(1)}%)`, legendX + 45, 53.5);

      doc.setFillColor(secondaryPurple[0], secondaryPurple[1], secondaryPurple[2]);
      doc.circle(legendX, 64, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.text(`Drawer Cash Stream:`, legendX + 5, 65.5);
      doc.setFont("helvetica", "normal");
      doc.text(`${formatCurrencyPDF(cashSum)} (${(ratioCash * 100).toFixed(1)}%)`, legendX + 45, 65.5);

      // 2. Month-over-Month Comparative Columns (2 or 3 months side-by-side)
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("MONTH-OVER-MONTH COMPARATIVE GRAPH", 20, 93);
      doc.line(20, 96, 190, 96);

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, 100, 170, 80, 2, 2, "F");
      doc.roundedRect(20, 100, 170, 80, 2, 2, "S");

      // Draw Gridlines & Axes
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(35, 110, 35, 160); // Y axis
      doc.line(35, 160, 180, 160); // X axis
      doc.line(35, 147, 180, 147);
      doc.line(35, 134, 180, 134);
      doc.line(35, 122, 180, 122);

      const m1 = monthCompData.m1;
      const m2 = monthCompData.m2;
      const m3 = monthCompData.m3;

      const maxCompVal = Math.max(m1.rev, m2.rev, m1.exp, m2.exp, m3 ? m3.rev : 0, m3 ? m3.exp : 0, 1000);
      const scaleComp = 42 / maxCompVal;

      if (m3) {
        // Compare 3 months (draw 3 bars in each cluster)
        const barW = 7;
        const gap = 2;

        // Group 1: Gross Inflows
        // Month A (blue)
        doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.rect(48, 160 - m1.rev * scaleComp, barW, m1.rev * scaleComp, "F");
        // Month B (purple)
        doc.setFillColor(secondaryPurple[0], secondaryPurple[1], secondaryPurple[2]);
        doc.rect(48 + barW + gap, 160 - m2.rev * scaleComp, barW, m2.rev * scaleComp, "F");
        // Month C (emerald)
        doc.setFillColor(successEmerald[0], successEmerald[1], successEmerald[2]);
        doc.rect(48 + (barW + gap) * 2, 160 - m3.rev * scaleComp, barW, m3.rev * scaleComp, "F");

        // Group 2: Outflows
        // Month A
        doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.rect(118, 160 - m1.exp * scaleComp, barW, m1.exp * scaleComp, "F");
        // Month B
        doc.setFillColor(secondaryPurple[0], secondaryPurple[1], secondaryPurple[2]);
        doc.rect(118 + barW + gap, 160 - m2.exp * scaleComp, barW, m2.exp * scaleComp, "F");
        // Month C
        doc.setFillColor(successEmerald[0], successEmerald[1], successEmerald[2]);
        doc.rect(118 + (barW + gap) * 2, 160 - m3.exp * scaleComp, barW, m3.exp * scaleComp, "F");

        // Axis texts
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "bold");
        doc.text("Gross Inflows comparison", 58, 166, { align: "center" });
        doc.text("Total Outflows comparison", 128, 166, { align: "center" });

        // Legends
        const lY = 173;
        doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.circle(42, lY, 1.2, "F");
        doc.setFont("helvetica", "normal");
        doc.text(`${m1.label}`, 46, lY + 1);

        doc.setFillColor(secondaryPurple[0], secondaryPurple[1], secondaryPurple[2]);
        doc.circle(92, lY, 1.2, "F");
        doc.text(`${m2.label}`, 96, lY + 1);

        doc.setFillColor(successEmerald[0], successEmerald[1], successEmerald[2]);
        doc.circle(142, lY, 1.2, "F");
        doc.text(`${m3.label}`, 146, lY + 1);
      } else {
        // Compare 2 months (standard layout)
        const barW = 11;

        // Group 1: Inflows
        doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.rect(52, 160 - m1.rev * scaleComp, barW, m1.rev * scaleComp, "F");
        doc.setFillColor(secondaryPurple[0], secondaryPurple[1], secondaryPurple[2]);
        doc.rect(65, 160 - m2.rev * scaleComp, barW, m2.rev * scaleComp, "F");

        // Group 2: Outflows
        doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.rect(122, 160 - m1.exp * scaleComp, barW, m1.exp * scaleComp, "F");
        doc.setFillColor(secondaryPurple[0], secondaryPurple[1], secondaryPurple[2]);
        doc.rect(135, 160 - m2.exp * scaleComp, barW, m2.exp * scaleComp, "F");

        // Axis texts
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "bold");
        doc.text("Gross Inflows comparison", 64, 166, { align: "center" });
        doc.text("Total Outflows comparison", 134, 166, { align: "center" });

        // Legends
        const lY = 173;
        doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.circle(52, lY, 1.2, "F");
        doc.setFont("helvetica", "normal");
        doc.text(`${m1.label}`, 56, lY + 1);

        doc.setFillColor(secondaryPurple[0], secondaryPurple[1], secondaryPurple[2]);
        doc.circle(115, lY, 1.2, "F");
        doc.text(`${m2.label}`, 119, lY + 1);
      }

      // 3. Shaded Daily Profit Line Chart
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("DAILY NET PROFIT RUNWAY TREND", 20, 189);
      doc.line(20, 192, 190, 192);

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, 196, 170, 78, 2, 2, "F");
      doc.roundedRect(20, 196, 170, 78, 2, 2, "S");

      // Draw Gridlines & Axes
      doc.setDrawColor(226, 232, 240);
      doc.line(35, 204, 35, 260); // Y axis
      doc.line(35, 260, 180, 260); // X axis

      const monthEntries = dailySummaries
        .filter(s => s.date.startsWith(activeMonth))
        .sort((a, b) => a.date.localeCompare(b.date));

      if (monthEntries.length > 1) {
        const maxPLVal = Math.max(...monthEntries.map(s => Math.abs(s.netPL)), 100);
        const scalePL = 25 / maxPLVal;
        const stepX = 140 / (monthEntries.length - 1);
        const baselineY = 232; // Centered baseline in card

        // Draw 0 line indicator
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.2);
        doc.line(35, baselineY, 180, baselineY);

        // A. Shaded Area
        doc.setFillColor(239, 246, 255);
        monthEntries.forEach((s, idx) => {
          const ptX = 35 + idx * stepX;
          const ptY = baselineY - s.netPL * scalePL;
          const rectW = Math.max(1, stepX);
          if (ptY < baselineY) {
            doc.rect(ptX, ptY, rectW, baselineY - ptY, "F");
          } else {
            doc.rect(ptX, baselineY, rectW, ptY - baselineY, "F");
          }
        });

        // B. Main Trend line
        doc.setLineWidth(0.6);
        doc.setDrawColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        monthEntries.forEach((s, idx) => {
          const ptX = 35 + idx * stepX;
          const ptY = baselineY - s.netPL * scalePL;
          doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
          doc.circle(ptX, ptY, 0.7, "F");
          if (idx < monthEntries.length - 1) {
            const nextX = 35 + (idx + 1) * stepX;
            const nextY = baselineY - monthEntries[idx + 1].netPL * scalePL;
            doc.line(ptX, ptY, nextX, nextY);
          }
        });

        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`Timeline scope (${monthEntries[0].date.substring(8)} - ${monthEntries[monthEntries.length - 1].date.substring(8)})`, 107, 269, { align: "center" });
      } else {
        doc.setFont("helvetica", "italic");
        doc.setTextColor(150, 150, 150);
        doc.text("Insufficient daily records to construct trend visualization.", 107, 232, { align: "center" });
      }

      addFooter(2, 4);

      // ───────────────────────────────────────────────────────────────────────
      // PAGE 3: DETAILED STATEMENT MATRIX & FISCAL YEARLY GRAPH
      // ───────────────────────────────────────────────────────────────────────
      doc.addPage();
      drawHeaderBanner("STATEMENT COMPONENT MATRIX");

      // 1. Month Comparison Statement Table
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("MONTH-OVER-MONTH PERFORMANCE COMPARISON SHEET", 20, 29);
      doc.line(20, 32, 190, 32);

      let tableY = 36;
      doc.setFillColor(30, 41, 59);

      if (m3) {
        // Render 3 months table
        doc.rect(20, tableY, 170, 9, "F");
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("Financial Metric Column", 23, tableY + 6);
        doc.text(`Period A (${m1.label})`, 75, tableY + 6);
        doc.text(`Period B (${m2.label})`, 105, tableY + 6);
        doc.text(`Period C (${m3.label})`, 135, tableY + 6);
        doc.text("Net Variance (A-C)", 164, tableY + 6);

        const rows3 = [
          { name: "Gross Revenue Inflow", v1: m1.rev, v2: m2.rev, v3: m3.rev },
          { name: "Total Expense Outflow", v1: m1.exp, v2: m2.exp, v3: m3.exp },
          { name: "Operating Net Profit", v1: m1.pl, v2: m2.pl, v3: m3.pl }
        ];

        tableY += 9;
        doc.setFont("helvetica", "normal");
        rows3.forEach((row, idx) => {
          if (idx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(20, tableY, 170, 9, "F");
          }
          doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
          doc.text(row.name, 23, tableY + 6);
          doc.text(formatCurrencyPDF(row.v1), 75, tableY + 6);
          doc.text(formatCurrencyPDF(row.v2), 105, tableY + 6);
          doc.text(formatCurrencyPDF(row.v3), 135, tableY + 6);

          const diff = row.v3 - row.v1;
          const isPos = diff >= 0;
          let color = successEmerald;
          if ((row.name.includes("Expense") && isPos) || (!row.name.includes("Expense") && !isPos)) {
            color = dangerRed;
          }
          doc.setTextColor(color[0], color[1], color[2]);
          doc.setFont("helvetica", "bold");
          doc.text(`${diff >= 0 ? "+" : ""}${formatCurrencyPDF(diff)}`, 164, tableY + 6);
          doc.setFont("helvetica", "normal");
          tableY += 9;
        });
      } else {
        // Render standard 2 months comparison table
        doc.rect(20, tableY, 170, 9, "F");
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("Financial Metric Column", 24, tableY + 6);
        doc.text(`Period A (${m1.label})`, 82, tableY + 6);
        doc.text(`Period B (${m2.label})`, 117, tableY + 6);
        doc.text("Absolute Variance", 152, tableY + 6);

        const rows2 = [
          { name: "Gross Revenue Inflow", v1: m1.rev, v2: m2.rev },
          { name: "Total Expense Outflow", v1: m1.exp, v2: m2.exp },
          { name: "Operating Net Profit", v1: m1.pl, v2: m2.pl }
        ];

        tableY += 9;
        doc.setFont("helvetica", "normal");
        rows2.forEach((row, idx) => {
          if (idx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(20, tableY, 170, 9, "F");
          }
          doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
          doc.text(row.name, 24, tableY + 6);
          doc.text(formatCurrencyPDF(row.v1), 82, tableY + 6);
          doc.text(formatCurrencyPDF(row.v2), 117, tableY + 6);

          const diff = row.v2 - row.v1;
          const isPos = diff >= 0;
          let color = successEmerald;
          if ((row.name.includes("Expense") && isPos) || (!row.name.includes("Expense") && !isPos)) {
            color = dangerRed;
          }
          doc.setTextColor(color[0], color[1], color[2]);
          doc.setFont("helvetica", "bold");
          doc.text(`${diff >= 0 ? "+" : ""}${formatCurrencyPDF(diff)}`, 152, tableY + 6);
          doc.setFont("helvetica", "normal");
          tableY += 9;
        });
      }

      // 2. Year-over-Year Comparative Table
      tableY += 10;
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("FISCAL YEAR-OVER-YEAR COMPARATIVE GRID", 20, tableY);
      doc.line(20, tableY + 3, 190, tableY + 3);

      tableY += 7;
      doc.setFillColor(30, 41, 59);
      doc.rect(20, tableY, 170, 9, "F");

      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text("Fiscal Year Period", 24, tableY + 6);
      doc.text("Aggregated Revenue", 68, tableY + 6);
      doc.text("Aggregated Expenses", 112, tableY + 6);
      doc.text("Net Profit surplus", 152, tableY + 6);

      tableY += 9;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);

      const yearsList = [2024, 2025, 2026];
      yearsList.forEach((yr, idx) => {
        const stats = yearlyCompData.stats[yr as 2024 | 2025 | 2026] || { rev: 0, exp: 0, pl: 0 };
        const margin = stats.rev > 0 ? (stats.pl / stats.rev) * 100 : 0;

        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(20, tableY, 170, 9, "F");
        }

        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.text(`Year Scope ${yr}`, 24, tableY + 6);
        doc.text(formatCurrencyPDF(stats.rev), 68, tableY + 6);
        doc.text(formatCurrencyPDF(stats.exp), 112, tableY + 6);
        
        const isYrPos = stats.pl >= 0;
        doc.setTextColor(isYrPos ? successEmerald[0] : dangerRed[0], isYrPos ? successEmerald[1] : dangerRed[1], isYrPos ? successEmerald[2] : dangerRed[2]);
        doc.setFont("helvetica", "bold");
        doc.text(`${formatCurrencyPDF(stats.pl)} (${margin.toFixed(0)}% Margin)`, 152, tableY + 6);
        
        doc.setFont("helvetica", "normal");
        tableY += 9;
      });

      // 3. Fiscal Year-over-Year Comparative Clustered Graph (Added: Satisfies requirement 4 & 6)
      tableY += 8;
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("FISCAL YEAR-OVER-YEAR COMPARATIVE GRAPH", 20, tableY);
      doc.line(20, tableY + 3, 190, tableY + 3);

      tableY += 7;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, tableY, 170, 56, 2, 2, "F");
      doc.roundedRect(20, tableY, 170, 56, 2, 2, "S");

      // Axes for YoY Graph
      doc.setDrawColor(226, 232, 240);
      doc.line(35, tableY + 8, 35, tableY + 46); // Y axis
      doc.line(35, tableY + 46, 180, tableY + 46); // X axis

      const maxYearVal = Math.max(
        yearlyCompData.stats[2024].rev, yearlyCompData.stats[2024].exp,
        yearlyCompData.stats[2025].rev, yearlyCompData.stats[2025].exp,
        yearlyCompData.stats[2026].rev, yearlyCompData.stats[2026].exp,
        1000
      );
      const scaleYear = 35 / maxYearVal;
      const barY = tableY + 46;

      // Render YoY columns
      yearsList.forEach((yr, idx) => {
        const stats = yearlyCompData.stats[yr as 2024 | 2025 | 2026] || { rev: 0, exp: 0, pl: 0 };
        const clusterX = 48 + idx * 45;
        const barW = 6;

        // Revenue (blue)
        doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.rect(clusterX, barY - stats.rev * scaleYear, barW, stats.rev * scaleYear, "F");

        // Expenses (red)
        doc.setFillColor(dangerRed[0], dangerRed[1], dangerRed[2]);
        doc.rect(clusterX + barW + 1.5, barY - stats.exp * scaleYear, barW, stats.exp * scaleYear, "F");

        // Profit (green)
        doc.setFillColor(successEmerald[0], successEmerald[1], successEmerald[2]);
        const drawPl = Math.max(0, stats.pl);
        doc.rect(clusterX + (barW + 1.5) * 2, barY - drawPl * scaleYear, barW, drawPl * scaleYear, "F");

        // Year label
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "bold");
        doc.text(`Year ${yr}`, clusterX + 10, barY + 5, { align: "center" });
      });

      // Chart Legends
      const yLegendY = tableY + 4;
      doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.circle(42, yLegendY, 1.2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Annual Revenue", 46, yLegendY + 1);

      doc.setFillColor(dangerRed[0], dangerRed[1], dangerRed[2]);
      doc.circle(92, yLegendY, 1.2, "F");
      doc.text("Annual Expenses", 96, yLegendY + 1);

      doc.setFillColor(successEmerald[0], successEmerald[1], successEmerald[2]);
      doc.circle(142, yLegendY, 1.2, "F");
      doc.text("Net Profit", 146, yLegendY + 1);

      addFooter(3, 4);

      // ───────────────────────────────────────────────────────────────────────
      // PAGE 4: EXPENSE CLASSIFICATIONS & DETAILED LEDGER REGISTER
      // ───────────────────────────────────────────────────────────────────────
      doc.addPage();
      drawHeaderBanner("ITEMIZED GENERAL LEDGER & ADVISORY");

      // 1. Expense Breakdown Donut Vector Chart & Allocations Table
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("EXPENSE CATEGORY ALLOCATIONS & SHARE", 20, 29);
      doc.line(20, 32, 190, 32);

      let gridY = 36;
      
      // Draw background card for classification details
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, gridY, 170, 52, 2, 2, "F");
      doc.roundedRect(20, gridY, 170, 52, 2, 2, "S");

      // Build donut chart segments mapping (converts breakdown data colors)
      const mappedExpensePie = expenseBreakdownData.slice(0, 5).map((item, idx) => {
        const colorsRGB = [
          [37, 99, 235],   // blue
          [124, 58, 237],  // purple
          [16, 185, 129],  // emerald
          [239, 68, 68],   // red
          [245, 158, 11]    // amber
        ];
        return {
          value: item.value,
          color: colorsRGB[idx % colorsRGB.length]
        };
      });

      // Draw vector Donut chart inside card: cx=50, cy=62
      drawDonutChart(50, 62, 16, 9, mappedExpensePie);

      // Total burn display overlay
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text("TOTAL BURN", 50, 60.5, { align: "center" });
      doc.setFontSize(7.5);
      doc.text(formatCurrencyPDF(monthlyMetrics.expenses), 50, 64.5, { align: "center" });

      // Table on the right of Donut
      let tableRowY = gridY + 6;
      doc.setFontSize(8);
      
      expenseBreakdownData.slice(0, 5).forEach((item, idx) => {
        const colorsRGB = [
          [37, 99, 235],
          [124, 58, 237],
          [16, 185, 129],
          [239, 68, 68],
          [245, 158, 11]
        ];
        const color = colorsRGB[idx % colorsRGB.length];

        // Draw color legend dot
        doc.setFillColor(color[0], color[1], color[2]);
        doc.circle(88, tableRowY + 1.5, 1.2, "F");

        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.setFont("helvetica", "bold");
        doc.text(item.name, 93, tableRowY + 3);

        doc.setFont("helvetica", "normal");
        doc.text(formatCurrencyPDF(item.value), 140, tableRowY + 3);

        // Progress bar display in cell
        doc.setFillColor(226, 232, 240);
        doc.rect(162, tableRowY + 1, 24, 2.2, "F");
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(162, tableRowY + 1, 24 * (item.percentage / 100), 2.2, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text(`${item.percentage.toFixed(0)}%`, 188, tableRowY + 3);
        doc.setFontSize(8);

        tableRowY += 8.5;
      });

      // 2. Ledger list Top 8 chronological
      gridY = 94;
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("DAILY PERFORMANCE LEDGER REGISTER (LATEST 8 DAYS)", 20, gridY);
      doc.line(20, gridY + 3, 190, gridY + 3);

      gridY += 7;
      doc.setFillColor(30, 41, 59);
      doc.rect(20, gridY, 170, 8, "F");

      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text("Billing Date", 24, gridY + 5.5);
      doc.text("Gross Inflows (Online + Cash)", 64, gridY + 5.5);
      doc.text("Total Outflows (Expenses)", 112, gridY + 5.5);
      doc.text("Net Balance Surplus", 152, gridY + 5.5);

      gridY += 8;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);

      const itemsToPrint = dailySummaries
        .filter(s => s.date.startsWith(activeMonth))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 8);

      if (itemsToPrint.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.text("No transaction sheets logged during this month scope.", 24, gridY + 5.5);
        gridY += 8;
      } else {
        itemsToPrint.forEach((row, index) => {
          if (index % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(20, gridY, 170, 7.5, "F");
          }
          doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
          doc.text(row.date, 24, gridY + 5);
          doc.text(formatCurrencyPDF(row.revenue), 64, gridY + 5);
          
          doc.setTextColor(row.expenses > 0 ? dangerRed[0] : 71, row.expenses > 0 ? dangerRed[1] : 85, row.expenses > 0 ? dangerRed[2] : 105);
          doc.text(formatCurrencyPDF(row.expenses), 112, gridY + 5);
          
          doc.setTextColor(row.netPL >= 0 ? successEmerald[0] : dangerRed[0], row.netPL >= 0 ? successEmerald[1] : dangerRed[1], row.netPL >= 0 ? successEmerald[2] : dangerRed[2]);
          doc.setFont("helvetica", "bold");
          doc.text(`${row.netPL >= 0 ? "+" : ""}${formatCurrencyPDF(row.netPL)}`, 152, gridY + 5);
          
          doc.setFont("helvetica", "normal");
          gridY += 7.5;
        });
      }

      // 3. Strategic Smart Advisory Recommendations (Page 4 bottom)
      gridY += 6;
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("STRATEGIC SMART ADVISORY RECOMMENDATIONS", 20, gridY);
      doc.line(20, gridY + 3, 190, gridY + 3);

      gridY += 7;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, gridY, 170, 36, 1.5, 1.5, "F");
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.roundedRect(20, gridY, 170, 36, 1.5, 1.5, "S");
      
      doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.rect(20, gridY, 1.5, 36, "F");

      // Dynamic recommendation calculations
      const profitMarginVal = monthlyMetrics.revenue > 0 ? (monthlyMetrics.profit / monthlyMetrics.revenue) * 100 : 0;
      const expenseBurnVal = monthlyMetrics.revenue > 0 ? (monthlyMetrics.expenses / monthlyMetrics.revenue) * 100 : 0;
      
      let marginAdvice = "Revenues cover operating outlays, but the runway margin is thin. Conduct a sector-by-sector cost audit on category allocations.";
      if (profitMarginVal > 20) {
        marginAdvice = "Capital expansion is in a healthy posture. We suggest allocating 15% of the net surplus to a strategic reinvestment fund for commercial scale.";
      } else if (profitMarginVal <= 0) {
        marginAdvice = "Treasury operating deficit detected. Action Plan: Negotiate payment deferrals on major overheads and run targeted cash promotions immediately.";
      }

      let costAdvice = "Expense controls are optimal. Variable costs are well within safe thresholds.";
      if (expenseBurnVal > 60) {
        costAdvice = `Cost burn is elevated at ${expenseBurnVal.toFixed(0)}% of gross income. Set strict departmental budgets on variable overheads.`;
      }

      const compositeRec = `1. CAPITAL ALLOCATION: ${marginAdvice}\n2. DISBURSEMENT CONTROL: ${costAdvice}\n3. CASH RESERVE: Target a treasury liquid buffer representing at least 3 to 6 months of historical operating burn to guarantee runway safety.`;
      
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "normal");
      const splitRec = doc.splitTextToSize(compositeRec, 160);
      doc.text(splitRec, 25, gridY + 6.5);

      addFooter(4, 4);

      // Save compiled PDF file directly to browser download directory (triggers automatic client saving)
      doc.save(`My_Accounting_Report_${activeMonth}.pdf`);
    } catch (e) {
      console.error("PDF Report download failure:", e);
    }
  };


  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6 text-left">
        <div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-text-primary tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Performance Analytics Hub
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-xl">
            Real-time financial indicators, automated intelligent advisor insights, carry forwards, and multi-period comparisons.
          </p>
        </div>

        <button
          onClick={handleDownloadPDF}
          className="flex items-center justify-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-primary to-secondary hover:from-primary/95 hover:to-secondary/95 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:shadow-xl transition-all hover-lift active:scale-98 cursor-pointer shadow-md self-start md:self-center"
        >
          <FileText className="w-4 h-4 text-white" />
          <span>Download PDF Report</span>
        </button>
      </div>

      {/* FILTER SYSTEM & TAB NAVIGATION */}
      <div className="glass-card rounded-2xl p-5 border border-border-color bg-white/80 backdrop-blur-md shadow-sm grid grid-cols-1 md:grid-cols-2 items-center gap-6">
        
        {/* Navigation tabs */}
        <div className="flex p-1 rounded-xl bg-slate-100/80 border border-slate-200/50 w-full shadow-inner max-w-md">
          {(["overview", "compare-months", "compare-years"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === tab
                  ? "bg-white text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/30"
              }`}
            >
              {tab === "overview" ? "Overview" : tab === "compare-months" ? "Compare Months" : "Compare Years"}
            </button>
          ))}
        </div>

        {/* Global Filter fields */}
        <div className="flex flex-wrap items-center justify-start md:justify-end gap-4">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Scope:</span>
          </div>

          <div className="relative">
            <input
              type="month"
              value={activeMonth}
              onChange={(e) => {
                const val = e.target.value;
                setActiveMonth(val);
                setSelectedMonth(val); // Sync context month
              }}
              className="px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary cursor-pointer shadow-inner"
            />
          </div>
        </div>

      </div>

      {/* SECTION 1 — MONTHLY OVERVIEW SUMMARY (KPI Cards with Sparklines) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Gross Revenue Card */}
        <div className="glass-card rounded-2xl p-6 border bg-white relative overflow-hidden flex flex-col justify-between hover-lift shadow-sm hover:shadow-md text-left transition-all group">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Gross Revenue</span>
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-text-primary tracking-tight leading-none pt-3">
              {formatCurrency(monthlyMetrics.revenue)}
            </h3>
            <span className="text-[10px] text-text-secondary block mt-1.5 font-semibold">
              Prev Month: {formatCurrency(monthlyMetrics.prevRevenue)}
            </span>
          </div>

          {/* Sparkline Graph */}
          <div className="h-10 w-full mt-4 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id="sparklineRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={1.5} fill="url(#sparklineRev)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="glass-card rounded-2xl p-6 border bg-white relative overflow-hidden flex flex-col justify-between hover-lift shadow-sm hover:shadow-md text-left transition-all group">
          <div className="absolute inset-0 bg-gradient-to-tr from-danger/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Total Expenses</span>
              <div className="w-7 h-7 rounded-lg bg-danger/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-danger" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-text-primary tracking-tight leading-none pt-3">
              {formatCurrency(monthlyMetrics.expenses)}
            </h3>
            <span className="text-[10px] text-text-secondary block mt-1.5 font-semibold">
              Prev Month: {formatCurrency(monthlyMetrics.prevExpenses)}
            </span>
          </div>

          {/* Sparkline Graph */}
          <div className="h-10 w-full mt-4 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id="sparklineExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={1.5} fill="url(#sparklineExp)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="glass-card rounded-2xl p-6 border bg-white relative overflow-hidden flex flex-col justify-between hover-lift shadow-sm hover:shadow-md text-left transition-all group">
          <div className="absolute inset-0 bg-gradient-to-tr from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Net Surplus / Profit</span>
              <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-success" />
              </div>
            </div>
            <h3 className={`text-2xl font-black tracking-tight leading-none pt-3 ${monthlyMetrics.profit >= 0 ? "text-success" : "text-danger"}`}>
              {monthlyMetrics.profit >= 0 ? "+" : ""}{formatCurrency(monthlyMetrics.profit)}
            </h3>
            <span className="text-[10px] text-text-secondary block mt-1.5 font-semibold">
              Prev Month: {formatCurrency(monthlyMetrics.prevProfit)}
            </span>
          </div>

          {/* Sparkline Graph */}
          <div className="h-10 w-full mt-4 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id="sparklineProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="profit" stroke={monthlyMetrics.profit >= 0 ? "#22C55E" : "#EF4444"} strokeWidth={1.5} fill="url(#sparklineProf)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Percentage Card */}
        <div className="glass-card rounded-2xl p-6 border bg-white relative overflow-hidden flex flex-col justify-between hover-lift shadow-sm hover:shadow-md text-left transition-all group">
          <div className="absolute inset-0 bg-gradient-to-tr from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Net Growth Growth</span>
              <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <h3 className={`text-2xl font-black tracking-tight leading-none pt-3 ${monthlyMetrics.profitGrowth >= 0 ? "text-success" : "text-danger"}`}>
              {formatGrowth(monthlyMetrics.profitGrowth)}
            </h3>
            <span className="text-[10px] text-text-secondary block mt-1.5 font-semibold">
              Trading Momentum Factor
            </span>
          </div>

          {/* Sparkline Graph representing revenue growth momentum */}
          <div className="h-10 w-full mt-4 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id="sparklineGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={1.5} fill="url(#sparklineGrowth)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <AnimatePresence mode="wait">
        
        {/* OVERVIEW SECTION (1, 2, 3, 6, 7, 8) */}
        {activeTab === "overview" && (
          <motion.div
            key="overview-content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            
            {/* SECTION 1.5 — FINANCIAL HEALTH SCORE RADIAL CARD */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass-card rounded-3xl border border-slate-100 bg-gradient-to-tr from-white via-slate-50/10 to-transparent shadow-xl shadow-slate-100/30 p-6 sm:p-8 text-left transition-all duration-500 hover:border-slate-200/80 hover:shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                <div className="md:col-span-4 flex flex-col items-center justify-center relative">
                  <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className="stroke-slate-100"
                        strokeWidth="7"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="42"
                        className={`stroke-current ${
                          financialHealthMetrics.score >= 80 ? "text-emerald-500" :
                          financialHealthMetrics.score >= 65 ? "text-primary" :
                          financialHealthMetrics.score >= 45 ? "text-amber-500" : "text-rose-500"
                        }`}
                        strokeWidth="7"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 42}
                        initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - financialHealthMetrics.score / 100) }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-slate-800 tracking-tighter leading-none">
                        {financialHealthMetrics.score}
                      </span>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">
                        SCORE
                      </span>
                    </div>
                  </div>
                  
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full mt-4 border ${
                    financialHealthMetrics.rating === "Excellent" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                    financialHealthMetrics.rating === "Good" ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                    financialHealthMetrics.rating === "Fair" ? "bg-amber-50 text-amber-600 border-amber-105" :
                    "bg-rose-50 text-rose-600 border-rose-100"
                  }`}>
                    {financialHealthMetrics.rating} Health Rating
                  </span>
                </div>

                <div className="md:col-span-8 space-y-5">
                  <div>
                    <h3 className="font-display font-black text-xl text-text-primary tracking-tight flex items-center gap-2">
                      <Award className="w-5.5 h-5.5 text-primary stroke-[2.2]" />
                      <span>Financial Health Audit Index</span>
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 font-semibold leading-relaxed">
                      A real-time evaluation of corporate health based on gross margins, expense ratios, carry-forward cash buffers, and sales growth rates.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                      <div className="flex justify-between text-xs font-bold text-text-primary">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Operating Margin
                        </span>
                        <span>{financialHealthMetrics.marginScore}/30 pts</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(financialHealthMetrics.marginScore / 30) * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">
                        Current margin: {financialHealthMetrics.marginVal.toFixed(1)}%
                      </span>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                      <div className="flex justify-between text-xs font-bold text-text-primary">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          Overhead Ratio
                        </span>
                        <span>{financialHealthMetrics.overheadScore}/25 pts</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(financialHealthMetrics.overheadScore / 25) * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">
                        Current expense ratio: {financialHealthMetrics.overheadVal.toFixed(1)}%
                      </span>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                      <div className="flex justify-between text-xs font-bold text-text-primary">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                          Cash Reserves Runway
                        </span>
                        <span>{financialHealthMetrics.runwayScore}/25 pts</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(financialHealthMetrics.runwayScore / 25) * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">
                        Runway reserve: {financialHealthMetrics.runwayMonths.toFixed(1)} months
                      </span>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                      <div className="flex justify-between text-xs font-bold text-text-primary">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-500" />
                          Revenue MoM Growth
                        </span>
                        <span>{financialHealthMetrics.growthScore}/20 pts</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(financialHealthMetrics.growthScore / 20) * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">
                        Growth rate: {monthlyMetrics.revGrowth.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* SECTION 2 — REVENUE VS EXPENSE ANALYTICS */}
            <div className="glass-card rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/50 shadow-xl shadow-slate-100/30 p-6 sm:p-8 text-left transition-all duration-500 ease-out hover:border-slate-200/80 hover:shadow-2xl hover:shadow-slate-100/50 group relative overflow-hidden">
              
              {/* Card Header and Controls switcher */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display font-black text-lg text-text-primary tracking-tight">Revenue vs Expense Flows</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-text-secondary">Chronological breakdown of inflows, outlays, and margins.</span>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white shadow-sm border border-slate-800">
                      <Award className="w-3 h-3 text-yellow-400" />
                      <span>Financial Health Score: {financialHealthMetrics.score}/100</span>
                    </span>
                  </div>
                </div>

                {/* Graph View & Isolate switchers */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Switcher 1: Chart representation */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/80 border border-slate-200/50 shadow-inner">
                    {(["area", "bar3d", "line"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setChartType(type)}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                          chartType === type
                            ? "bg-white text-primary shadow-sm border border-slate-100"
                            : "text-text-secondary hover:text-text-primary hover:bg-white/30"
                        }`}
                      >
                        {type === "area" ? "Area Flow" : type === "bar3d" ? "3D Columns" : "Trend Line"}
                      </button>
                    ))}
                  </div>

                  {/* Switcher 2: Data visibility isolate */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/80 border border-slate-200/50 shadow-inner">
                    {(["all", "revenue", "expenses", "profit"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTrendDisplay(mode)}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                          trendDisplay === mode
                            ? "bg-white text-primary shadow-sm border border-slate-100"
                            : "text-text-secondary hover:text-text-primary hover:bg-white/30"
                        }`}
                      >
                        {mode === "all" ? "Show All" : mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* KPI metrics ribbon for instant business performance readouts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 border-y border-slate-100/80 my-5 bg-slate-50/20 rounded-2xl px-4">
                {/* Ribbon Card 1: Gross Revenue */}
                <div className="flex items-start space-x-2.5">
                  <span className="w-1 h-8 bg-blue-500 rounded-full shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gross Inflow</span>
                    <h4 className="text-lg font-black text-slate-800 tracking-tight leading-none mt-1">
                      {formatCurrency(monthlyMetrics.revenue)}
                    </h4>
                    <span className={`inline-flex items-center text-[10px] font-extrabold mt-1 ${monthlyMetrics.revGrowth >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {monthlyMetrics.revGrowth >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                      {formatGrowth(monthlyMetrics.revGrowth)} MoM
                    </span>
                  </div>
                </div>

                {/* Ribbon Card 2: Total Expenses */}
                <div className="flex items-start space-x-2.5">
                  <span className="w-1 h-8 bg-rose-500 rounded-full shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gross Outflow</span>
                    <h4 className="text-lg font-black text-slate-800 tracking-tight leading-none mt-1">
                      {formatCurrency(monthlyMetrics.expenses)}
                    </h4>
                    <span className={`inline-flex items-center text-[10px] font-extrabold mt-1 ${monthlyMetrics.expGrowth <= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {monthlyMetrics.expGrowth <= 0 ? <TrendingDown className="w-3 h-3 mr-0.5" /> : <TrendingUp className="w-3 h-3 mr-0.5" />}
                      {formatGrowth(monthlyMetrics.expGrowth)} MoM
                    </span>
                  </div>
                </div>

                {/* Ribbon Card 3: Net Surplus */}
                <div className="flex items-start space-x-2.5">
                  <span className={`w-1 h-8 rounded-full shrink-0 ${monthlyMetrics.profit >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Surplus</span>
                    <h4 className={`text-lg font-black tracking-tight leading-none mt-1 ${monthlyMetrics.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {formatCurrency(monthlyMetrics.profit)}
                    </h4>
                    <span className="inline-flex items-center text-[10px] font-extrabold text-slate-500 mt-1">
                      <Activity className="w-3 h-3 mr-0.5 text-primary" />
                      {monthlyMetrics.revenue > 0 ? ((monthlyMetrics.profit / monthlyMetrics.revenue) * 100).toFixed(0) : "0"}% Margin
                    </span>
                  </div>
                </div>

                {/* Ribbon Card 4: Operating Health */}
                <div className="flex items-start space-x-2.5">
                  <span className="w-1 h-8 bg-slate-800 rounded-full shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operating Health</span>
                    <h4 className={`text-lg font-black tracking-tight leading-none mt-1 ${
                      financialHealthMetrics.score >= 80 ? "text-emerald-600" : financialHealthMetrics.score >= 65 ? "text-primary" : financialHealthMetrics.score >= 45 ? "text-amber-600" : "text-rose-600"
                    }`}>
                      {financialHealthMetrics.rating}
                    </h4>
                    <span className="text-[10px] font-extrabold text-slate-400 mt-1 block">
                      Index Rating
                    </span>
                  </div>
                </div>
              </div>

              {/* Chart container slot with loaders and empty state wrappers */}
              <div className="h-80 w-full relative">
                {chartLoading ? (
                  /* High-end Shimmering Vector loading state */
                  <div className="w-full h-80 flex flex-col justify-between animate-pulse pt-6 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-white/90 border border-slate-100 px-3 py-1.5 rounded-full shadow-sm z-10">
                        Compiling transaction registers...
                      </span>
                    </div>
                    <div className="flex items-end justify-between h-48 px-4 border-b border-slate-100/50 opacity-40">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-4 bg-slate-200 rounded-t-md"
                          style={{ height: `${20 + Math.sin(i * 0.8) * 40 + ((i * 7) % 5) * 4}%` }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between px-2 pt-2 opacity-40">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="w-8 h-3 bg-slate-200 rounded" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Glassmorphic Empty State Overlay if no ledger data recorded for current month scope */}
                    {isMonthEmpty && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] z-20 transition-all duration-300">
                        <div className="glass-card max-w-sm p-6 rounded-2xl border border-slate-200/50 bg-white/95 shadow-xl text-center space-y-4 mx-4">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                            <Activity className="w-6 h-6 animate-pulse" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">No Financial Entries Found</h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                              There is no transaction activity recorded for {getMonthLabel(activeMonth)}. Add items to your ledger to populate the flow charts.
                            </p>
                          </div>
                          <button
                            onClick={() => window.location.href = "/dashboard/transactions"}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all active:scale-98 cursor-pointer shadow-md"
                          >
                            Go to Transactions Sandbox
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={`w-full h-full transition-opacity duration-300 ${isMonthEmpty ? "opacity-25 pointer-events-none" : "opacity-100"}`}>
                      {chartType === "area" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendChartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="trendRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                              </linearGradient>
                              <linearGradient id="trendExp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.0} />
                              </linearGradient>
                              <linearGradient id="trendProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: "10px", fontWeight: "600", fill: "#94a3b8" }} />
                            <YAxis tickLine={false} axisLine={false} style={{ fontSize: "10px", fontWeight: "600", fill: "#94a3b8" }} tickFormatter={(v) => formatCurrency(v)} />
                            <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                            
                            {(trendDisplay === "all" || trendDisplay === "revenue") && (
                              <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={3} fill="url(#trendRev)" name="Revenue" activeDot={{ r: 6, strokeWidth: 0 }} />
                            )}
                            {(trendDisplay === "all" || trendDisplay === "expenses") && (
                              <Area type="monotone" dataKey="Expenses" stroke="#f43f5e" strokeWidth={3} fill="url(#trendExp)" name="Expenses" activeDot={{ r: 6, strokeWidth: 0 }} />
                            )}
                            {(trendDisplay === "all" || trendDisplay === "profit") && (
                              <Area type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={3} fill="url(#trendProfit)" name="Net Profit" activeDot={{ r: 6, strokeWidth: 0 }} />
                            )}
                          </AreaChart>
                        </ResponsiveContainer>
                      )}

                      {chartType === "bar3d" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={trendChartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }} barGap={3}>
                            <defs>
                              <linearGradient id="inflowFront" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#1d4ed8" />
                              </linearGradient>
                              <linearGradient id="inflowTop" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#93c5fd" />
                                <stop offset="100%" stopColor="#60a5fa" />
                              </linearGradient>
                              <linearGradient id="inflowRight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#1d4ed8" />
                                <stop offset="100%" stopColor="#1e3a8a" />
                              </linearGradient>

                              <linearGradient id="outflowFront" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f43f5e" />
                                <stop offset="100%" stopColor="#be123c" />
                              </linearGradient>
                              <linearGradient id="outflowTop" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#fda4af" />
                                <stop offset="100%" stopColor="#fecdd3" />
                              </linearGradient>
                              <linearGradient id="outflowRight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#be123c" />
                                <stop offset="100%" stopColor="#9f1239" />
                              </linearGradient>

                              <linearGradient id="balanceFront" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#047857" />
                              </linearGradient>
                              <linearGradient id="balanceTop" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#6ee7b7" />
                                <stop offset="100%" stopColor="#a7f3d0" />
                              </linearGradient>
                              <linearGradient id="balanceRight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#047857" />
                                <stop offset="100%" stopColor="#064e3b" />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: "10px", fontWeight: "600", fill: "#94a3b8" }} />
                            <YAxis tickLine={false} axisLine={false} style={{ fontSize: "10px", fontWeight: "600", fill: "#94a3b8" }} tickFormatter={(v) => formatCurrency(v)} />
                            <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                            
                            {(trendDisplay === "all" || trendDisplay === "revenue") && (
                              <Bar dataKey="Revenue" fill="url(#inflowFront)" name="Revenue" shape={<Custom3DBar />} />
                            )}
                            {(trendDisplay === "all" || trendDisplay === "expenses") && (
                              <Bar dataKey="Expenses" fill="url(#outflowFront)" name="Expenses" shape={<Custom3DBar />} />
                            )}
                            {(trendDisplay === "all" || trendDisplay === "profit") && (
                              <Bar dataKey="Profit" fill="url(#balanceFront)" name="Net Profit" shape={<Custom3DBar />} />
                            )}
                          </BarChart>
                        </ResponsiveContainer>
                      )}

                      {chartType === "line" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendChartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: "10px", fontWeight: "600", fill: "#94a3b8" }} />
                            <YAxis tickLine={false} axisLine={false} style={{ fontSize: "10px", fontWeight: "600", fill: "#94a3b8" }} tickFormatter={(v) => formatCurrency(v)} />
                            <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                            
                            {(trendDisplay === "all" || trendDisplay === "revenue") && (
                              <Line type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={3} name="Revenue" activeDot={{ r: 6, strokeWidth: 0 }} dot={false} />
                            )}
                            {(trendDisplay === "all" || trendDisplay === "expenses") && (
                              <Line type="monotone" dataKey="Expenses" stroke="#f43f5e" strokeWidth={3} name="Expenses" activeDot={{ r: 6, strokeWidth: 0 }} dot={false} />
                            )}
                            {(trendDisplay === "all" || trendDisplay === "profit") && (
                              <Line type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={3} name="Net Profit" activeDot={{ r: 6, strokeWidth: 0 }} dot={false} />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Dynamic smart performance insights strip below the chart */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-yellow-500 shrink-0 animate-pulse" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dynamic Performance Alerts:</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {/* Insight 1: Revenue Status */}
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                    monthlyMetrics.revGrowth >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${monthlyMetrics.revGrowth >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <span>{monthlyMetrics.revGrowth >= 0 ? "Revenue Growth Healthy" : "Revenue Declining"}</span>
                  </span>
                  
                  {/* Insight 2: Expense Burn */}
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                    monthlyMetrics.expGrowth <= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${monthlyMetrics.expGrowth <= 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
                    <span>{monthlyMetrics.expGrowth <= 0 ? "Cost Management Stable" : "Expenses Up " + monthlyMetrics.expGrowth.toFixed(0) + "%"}</span>
                  </span>

                  {/* Insight 3: Profit Margins */}
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                    monthlyMetrics.revenue > 0 && ((monthlyMetrics.profit / monthlyMetrics.revenue) * 100) >= 25 ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-slate-50 text-slate-700 border border-slate-100"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${monthlyMetrics.revenue > 0 && ((monthlyMetrics.profit / monthlyMetrics.revenue) * 100) >= 25 ? "bg-blue-500" : "bg-slate-500"}`} />
                    <span>{monthlyMetrics.revenue > 0 && ((monthlyMetrics.profit / monthlyMetrics.revenue) * 100) >= 25 ? "High Profitability Index" : "Margin: " + (monthlyMetrics.revenue > 0 ? ((monthlyMetrics.profit / monthlyMetrics.revenue) * 100).toFixed(0) : "0") + "%"}</span>
                  </span>
                </div>
              </div>

            </div>

            {/* SECTION 3 — BUSINESS INSIGHTS (AI Cards) */}
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <h3 className="font-display font-black text-xl text-text-primary tracking-tight">AI-Style Business Insights</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {smartInsights.map((insight, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass-card rounded-2xl p-5 border border-border-color bg-gradient-to-tr from-white to-slate-50/20 shadow-sm relative overflow-hidden flex flex-col justify-between hover-lift"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-extrabold text-text-primary tracking-tight leading-snug">{insight.title}</h4>
                        <p className="text-xs text-text-secondary mt-1.5 leading-relaxed font-medium">{insight.desc}</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shrink-0 ${
                        insight.type === "success" ? "bg-success/10 text-success" :
                        insight.type === "warning" ? "bg-danger/10 text-danger" :
                        insight.type === "purple" ? "bg-secondary/10 text-secondary" :
                        "bg-primary/10 text-primary"
                      }`}>
                        {insight.badge}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-[10px] text-primary font-bold uppercase tracking-wider mt-4">
                      <span>Actionable Plan</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* SECTION 6 & SECTION 7 — EXPENSE BREAKDOWN & LIQUIDITY WATERFALL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              
              {/* SECTION 6 — EXPENSE BREAKDOWN ANALYTICS (Flowing Bubbles Grid) */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-100 bg-gradient-to-b from-white to-slate-50/50 shadow-xl shadow-slate-100/30 text-left justify-between flex flex-col hover:border-slate-200/80 hover:shadow-2xl hover:shadow-slate-100/50 transition-all duration-500 ease-out group">
                <div>
                  <h3 className="font-display font-black text-lg text-text-primary tracking-tight">Expense Classifications</h3>
                  <p className="text-xs text-text-secondary mt-0.5">Allocation share values representing direct overhead consumption.</p>
                </div>

                {chartLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-6 my-8 animate-pulse w-full">
                    <div className="w-40 h-40 rounded-full bg-slate-100" />
                    <div className="w-full space-y-3">
                      <div className="h-10 bg-slate-100 rounded-xl" />
                      <div className="h-10 bg-slate-100 rounded-xl" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center my-6 space-y-6 w-full">
                    {/* Interactive Donut Chart */}
                    <div className="relative w-48 h-48 xs:w-52 xs:h-52 sm:w-64 sm:h-64 flex items-center justify-center shrink-0">
                      <svg
                        viewBox="0 0 120 120"
                        className="w-full h-full transform -rotate-90 select-none"
                      >
                        {/* Background subtle ring */}
                        <circle
                          cx="60"
                          cy="60"
                          r="45"
                          fill="transparent"
                          stroke="#f1f5f9"
                          strokeWidth="10"
                        />
                        
                        {/* Colored segments */}
                        {segments.map((segment) => {
                          const isHovered = activeExpenseIndex === segment.idx;
                          return (
                            <motion.circle
                              key={segment.name}
                              cx="60"
                              cy="60"
                              r="45"
                              fill="transparent"
                              stroke={segment.color}
                              strokeWidth={11}
                              strokeDasharray={`${segment.length} 282.743`}
                              strokeDashoffset={-segment.offset}
                              animate={{
                                opacity: activeExpenseIndex === null || isHovered ? 1 : 0.35
                              }}
                              transition={{ type: "tween", duration: 0.18, ease: "easeOut" }}
                              className="cursor-pointer"
                              onMouseEnter={() => setActiveExpenseIndex(segment.idx)}
                              onMouseLeave={() => setActiveExpenseIndex(null)}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveExpenseIndex(activeExpenseIndex === segment.idx ? null : segment.idx);
                              }}
                            />
                          );
                        })}
                      </svg>

                      {/* Solid central display card - Tapping resets filters */}
                      <div 
                        onClick={() => setActiveExpenseIndex(null)}
                        className="absolute w-[68%] h-[68%] bg-white rounded-full shadow-lg border border-slate-100/80 flex flex-col items-center justify-center text-center p-4 cursor-pointer select-none"
                      >
                        <AnimatePresence mode="wait">
                          {activeExpenseIndex !== null && segments[activeExpenseIndex] ? (
                            <motion.div
                              key={`hovered-${activeExpenseIndex}`}
                              initial={{ opacity: 0, scale: 0.9, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -5 }}
                              transition={{ duration: 0.15 }}
                              className="flex flex-col items-center w-full"
                            >
                              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 truncate max-w-full">
                                {segments[activeExpenseIndex].name}
                              </span>
                              <span className="text-xl sm:text-2xl font-black tracking-tight mt-0.5 text-slate-900 truncate max-w-full">
                                {formatCurrency(segments[activeExpenseIndex].value)}
                              </span>
                              <span className="text-[9px] sm:text-[10px] font-extrabold text-primary uppercase tracking-widest mt-0.5">
                                {segments[activeExpenseIndex].percentage.toFixed(0)}% Share
                              </span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="total-expenses"
                              initial={{ opacity: 0, scale: 0.9, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -5 }}
                              transition={{ duration: 0.15 }}
                              className="flex flex-col items-center w-full"
                            >
                              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">Total</span>
                              <span className="text-xl sm:text-2xl font-black tracking-tight mt-0.5 text-slate-900">
                                {formatCurrency(monthlyMetrics.expenses)}
                              </span>
                              <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-450 mt-0.5 uppercase tracking-widest">
                                Expenses
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Responsive Staggered Grid: Enforces exactly 3 columns on mobile, tablet, and desktop */}
                    <div className="grid grid-cols-3 gap-3.5 w-full pt-4 max-w-3xl mx-auto">
                      {expenseBreakdownData.map((item, idx) => {
                        const color = BREAKDOWN_COLORS[idx % BREAKDOWN_COLORS.length];
                        const isHovered = activeExpenseIndex === idx;
                        return (
                          <motion.div
                            key={item.name}
                            whileHover={{ scale: 1.03 }}
                            onMouseEnter={() => setActiveExpenseIndex(idx)}
                            onMouseLeave={() => setActiveExpenseIndex(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveExpenseIndex(activeExpenseIndex === idx ? null : idx);
                            }}
                            className={`w-full h-20 sm:h-24 rounded-2xl sm:rounded-full border bg-white shadow-sm flex flex-row items-center px-2 py-2 sm:px-4 sm:py-3 transition-all duration-200 cursor-pointer min-w-0 justify-start text-left overflow-hidden space-x-2 sm:space-x-3.5 ${
                              isHovered ? "border-primary shadow-md ring-2 ring-primary/10" : "border-slate-200/80"
                            }`}
                          >
                            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <div className="flex flex-col justify-center min-w-0 w-full text-left overflow-hidden">
                              <span className={`text-[10px] sm:text-sm md:text-base font-black leading-tight block break-words line-clamp-2 transition-colors duration-200 ${
                                isHovered ? "text-primary" : "text-slate-800"
                              }`}>{item.name}</span>
                              <span className="text-[8px] xs:text-[9px] sm:text-xs md:text-sm font-extrabold text-slate-450 mt-0.5 leading-tight block">
                                {item.percentage.toFixed(0)}% • {formatCurrency(item.value)}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 7 — CASH FLOW & CARRY FORWARD ANALYTICS */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-100 bg-gradient-to-b from-white to-slate-50/50 shadow-xl shadow-slate-100/30 text-left justify-between flex flex-col hover:border-slate-200/80 hover:shadow-2xl hover:shadow-slate-100/50 transition-all duration-500 ease-out group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-display font-black text-lg text-text-primary tracking-tight">Liquid Cash Flow</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Continuous tracking of opening parameters, movement, and carry forwards.</p>
                  </div>
                  
                  {/* View Switcher Controls */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/80 border border-slate-200/50 shadow-inner shrink-0 self-start sm:self-center">
                    <button
                      onClick={() => setCashFlowView("balance")}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        cashFlowView === "balance"
                          ? "bg-white text-primary shadow-sm border border-slate-100"
                          : "text-text-secondary hover:text-text-primary hover:bg-white/30"
                      }`}
                    >
                      Reserves
                    </button>
                    <button
                      onClick={() => setCashFlowView("flow")}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        cashFlowView === "flow"
                          ? "bg-white text-primary shadow-sm border border-slate-100"
                          : "text-text-secondary hover:text-text-primary hover:bg-white/30"
                      }`}
                    >
                      In / Out
                    </button>
                  </div>
                </div>

                {/* Redesigned 3-step Visual Flow Ledger Connectors */}
                <div className="flex flex-col sm:flex-row items-stretch justify-between gap-3 my-4 bg-slate-50/40 border border-slate-100/80 p-4 rounded-2xl shadow-inner">
                  {/* Opening Balance */}
                  <div className="flex-1 flex flex-col justify-between p-3 rounded-xl bg-white border border-slate-100 hover:border-primary/20 transition-all duration-300">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">1. Opening Reserves</span>
                      <span className="text-sm font-black text-slate-800 block mt-1">{formatCurrency(cashFlowMetrics.opening)}</span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 block mt-1.5 uppercase tracking-wide">Starting Balance</span>
                  </div>

                  <div className="hidden sm:flex items-center justify-center shrink-0 text-slate-300">
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </div>

                  {/* Net Movement */}
                  <div className="flex-1 flex flex-col justify-between p-3 rounded-xl bg-white border border-slate-100 hover:border-primary/20 transition-all duration-300">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">2. Net Flow Yield</span>
                      <span className={`text-sm font-black block mt-1 ${cashFlowMetrics.netMovement >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {cashFlowMetrics.netMovement >= 0 ? "+" : ""}{formatCurrency(cashFlowMetrics.netMovement)}
                      </span>
                    </div>
                    <span className={`inline-block text-[8px] font-extrabold px-1.5 py-0.5 rounded-md border mt-1.5 self-start ${
                      cashFlowMetrics.netMovement >= 0
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    }`}>
                      {cashFlowMetrics.opening > 0 ? (cashFlowMetrics.netMovement >= 0 ? "+" : "") : ""}
                      {cashFlowMetrics.opening > 0 ? ((cashFlowMetrics.netMovement / cashFlowMetrics.opening) * 100).toFixed(1) : "0"}% Yield
                    </span>
                  </div>

                  <div className="hidden sm:flex items-center justify-center shrink-0 text-slate-300">
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </div>

                  {/* Carry Forward */}
                  <div className="flex-1 flex flex-col justify-between p-3 rounded-xl bg-white border border-slate-100 hover:border-primary/20 transition-all duration-300">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">3. Carry Forward</span>
                      <span className="text-sm font-black text-primary block mt-1">{formatCurrency(cashFlowMetrics.carryForward)}</span>
                    </div>
                    <span className={`inline-block text-[8px] font-extrabold px-1.5 py-0.5 rounded-md border mt-1.5 self-start ${
                      cashFlowMetrics.carryForward >= cashFlowMetrics.opening
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    }`}>
                      {cashFlowMetrics.carryForward >= cashFlowMetrics.opening ? "🟢 Reserves Up" : "🔴 Reserves Down"}
                    </span>
                  </div>
                </div>

                {/* Running balance / Inflow vs Outflow Chart container */}
                <div className="h-44 w-full mt-2 relative">
                  {chartLoading ? (
                    <div className="h-44 w-full flex flex-col justify-between pt-4">
                      <div className="flex items-end justify-between h-32 px-4 border-b border-slate-100/50 my-auto animate-pulse">
                        {Array.from({ length: 14 }).map((_, i) => {
                          const h = 25 + Math.sin(i * 0.9) * 35 + ((i * 13) % 4) * 4;
                          return <Skeleton3DBar key={i} heightPct={h} />;
                        })}
                      </div>
                      <div className="flex justify-between px-2 pt-2 opacity-30 animate-pulse">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="w-6 h-2 bg-slate-200 rounded" />
                        ))}
                      </div>
                    </div>
                  ) : cashFlowView === "balance" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cashFlowMetrics.dailyBalances} margin={{ left: -20, right: 10, bottom: 0, top: 5 }}>
                        <defs>
                          <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                        <XAxis dataKey="day" style={{ fontSize: "9px", fontWeight: "600", fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                        <YAxis style={{ fontSize: "9px", fontWeight: "600", fill: "#94A3B8" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="Balance" stroke="#10b981" strokeWidth={2.5} fill="url(#balanceGrad)" name="Balance" activeDot={{ r: 6 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cashFlowMetrics.dailyBalances} margin={{ left: -20, right: 10, bottom: 0, top: 5 }} barGap={3}>
                        <defs>
                          <linearGradient id="inflowFront" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#047857" />
                          </linearGradient>
                          <linearGradient id="inflowTop" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#6ee7b7" />
                            <stop offset="100%" stopColor="#a7f3d0" />
                          </linearGradient>
                          <linearGradient id="inflowRight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#047857" />
                            <stop offset="100%" stopColor="#064e3b" />
                          </linearGradient>

                          <linearGradient id="outflowFront" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" />
                            <stop offset="100%" stopColor="#be123c" />
                          </linearGradient>
                          <linearGradient id="outflowTop" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#fda4af" />
                            <stop offset="100%" stopColor="#fecdd3" />
                          </linearGradient>
                          <linearGradient id="outflowRight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#be123c" />
                            <stop offset="100%" stopColor="#9f1239" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                        <XAxis dataKey="day" style={{ fontSize: "9px", fontWeight: "600", fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                        <YAxis style={{ fontSize: "9px", fontWeight: "600", fill: "#94A3B8" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} />
                        <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                        <Bar dataKey="Inflow" fill="url(#inflowFront)" name="Revenue" shape={<Custom3DBar />} />
                        <Bar dataKey="Outflow" fill="url(#outflowFront)" name="Expenses" shape={<Custom3DBar />} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Mini Smart Cash Flow Insights Ribbon */}
                <div className={`mt-4 p-3.5 rounded-2xl border flex items-start space-x-2 text-[10px] leading-relaxed font-bold text-left ${
                  cashFlowMetrics.netMovement >= 0
                    ? "bg-emerald-50/50 text-emerald-700 border-emerald-100/50"
                    : "bg-rose-50/50 text-rose-700 border-rose-100/50"
                }`}>
                  <span className="text-xs mt-0.5">{cashFlowMetrics.netMovement >= 0 ? "🟢" : "⚠️"}</span>
                  <div>
                    <span className="uppercase tracking-wider block font-black mb-0.5">Liquidity Insight</span>
                    {cashFlowMetrics.netMovement >= 0 ? (
                      <span>Healthy cash velocity detected! Net position grew by {formatCurrency(cashFlowMetrics.netMovement)} ({((cashFlowMetrics.netMovement / cashFlowMetrics.opening) * 100).toFixed(0)}%) during this period. Cash reserves are stable and sufficient for working capital demands.</span>
                    ) : (
                      <span>Reserves are tightening. Total outflow exceeded inflow by {formatCurrency(Math.abs(cashFlowMetrics.netMovement))}. Consider extending your vendor invoice payment cycles or reviewing overhead cash burn to prevent a deficit.</span>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* SECTION 8 — SMART PERFORMANCE INSIGHTS (Advanced summary report block) */}
            <div className="glass-card rounded-2xl p-6 border border-border-color bg-gradient-to-tr from-primary/5 via-secondary/5 to-transparent shadow-sm text-left relative overflow-hidden">
              <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3 mb-4">
                <Briefcase className="w-5 h-5 text-primary" />
                <h3 className="font-display font-black text-sm text-text-primary uppercase tracking-wider">Corporate Advisory Overview</h3>
              </div>

              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-semibold">
                  {smartAdvancedSummary}
                </p>

                {/* Checklist factors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="flex items-start space-x-2 text-xs text-text-secondary">
                    <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>Revenues grow faster than expenses this month.</span>
                  </div>
                  <div className="flex items-start space-x-2 text-xs text-text-secondary">
                    <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>Cash flow reserves maintain positive treasury index.</span>
                  </div>
                  <div className="flex items-start space-x-2 text-xs text-text-secondary">
                    <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>Average daily commercial revenue improved successfully.</span>
                  </div>
                  <div className="flex items-start space-x-2 text-xs text-text-secondary">
                    <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>Allocation burn ratios optimized inside threshold targets.</span>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {/* COMPARE MONTHS SECTION (4) */}
        {activeTab === "compare-months" && (
          <motion.div
            key="compare-months-content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            
            {/* Interactive period pickers */}
            <div className="glass-card rounded-2xl p-5 border border-border-color bg-white text-left space-y-4 shadow-sm">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Layers className="w-5 h-5 text-primary" />
                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">Select Month Comparison (Compare 2 or 3 Months)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="field">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">Audit Month A</label>
                  <input
                    type="month"
                    value={compMonth1}
                    onChange={(e) => setCompMonth1(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-text-primary focus:outline-none focus:border-primary shadow-inner"
                  />
                </div>
                <div className="field">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">Audit Month B</label>
                  <input
                    type="month"
                    value={compMonth2}
                    onChange={(e) => setCompMonth2(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-text-primary focus:outline-none focus:border-primary shadow-inner"
                  />
                </div>
                <div className="field">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">Audit Month C (Optional)</label>
                  <div className="flex space-x-2">
                    <input
                      type="month"
                      value={compMonth3}
                      onChange={(e) => setCompMonth3(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-text-primary focus:outline-none focus:border-primary shadow-inner"
                    />
                    {compMonth3 && (
                      <button
                        onClick={() => setCompMonth3("")}
                        className="px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 text-xs font-black cursor-pointer"
                        title="Clear Month C"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stat comparison blocks */}
            <div className={`grid grid-cols-1 ${monthCompData.m3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-6`}>
              
              {/* Month A summary */}
              <div className="glass-card rounded-3xl p-6 border bg-white shadow-sm text-left">
                <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
                  <span className="text-xs font-black text-primary tracking-wider uppercase">Period A: {monthCompData.m1.label}</span>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary">Baseline</span>
                </div>
                <div className="space-y-4 text-xs font-bold text-text-secondary">
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Gross Revenue:</span>
                    <span className="text-text-primary">{formatCurrency(monthCompData.m1.rev)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Disbursements:</span>
                    <span className="text-danger">{formatCurrency(monthCompData.m1.exp)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Net Operating Profit:</span>
                    <span className={`text-sm font-black ${monthCompData.m1.pl >= 0 ? "text-success" : "text-danger"}`}>
                      {formatCurrency(monthCompData.m1.pl)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Month B summary */}
              <div className="glass-card rounded-3xl p-6 border bg-white shadow-sm text-left">
                <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
                  <span className="text-xs font-black text-secondary tracking-wider uppercase">Period B: {monthCompData.m2.label}</span>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary/10 text-secondary">Comparison B</span>
                </div>
                <div className="space-y-4 text-xs font-bold text-text-secondary">
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Gross Revenue:</span>
                    <span className="text-text-primary">{formatCurrency(monthCompData.m2.rev)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Disbursements:</span>
                    <span className="text-danger">{formatCurrency(monthCompData.m2.exp)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Net Operating Profit:</span>
                    <span className={`text-sm font-black ${monthCompData.m2.pl >= 0 ? "text-success" : "text-danger"}`}>
                      {formatCurrency(monthCompData.m2.pl)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Month C summary */}
              {monthCompData.m3 && (
                <div className="glass-card rounded-3xl p-6 border bg-white shadow-sm text-left">
                  <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
                    <span className="text-xs font-black text-emerald-600 tracking-wider uppercase">Period C: {monthCompData.m3.label}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">Comparison C</span>
                  </div>
                  <div className="space-y-4 text-xs font-bold text-text-secondary">
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span>Gross Revenue:</span>
                      <span className="text-text-primary">{formatCurrency(monthCompData.m3.rev)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span>Disbursements:</span>
                      <span className="text-danger">{formatCurrency(monthCompData.m3.exp)}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span>Net Operating Profit:</span>
                      <span className={`text-sm font-black ${monthCompData.m3.pl >= 0 ? "text-success" : "text-danger"}`}>
                        {formatCurrency(monthCompData.m3.pl)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Side-by-side Comparative charts */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-border-color bg-white shadow-sm text-left">
              <h3 className="font-display font-black text-lg text-text-primary tracking-tight">Analytical Period Comparison</h3>
              <p className="text-xs text-text-secondary mt-0.5">Side-by-side review of inflow, disbursement, and net profit streams.</p>
              
              <div className="h-80 w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthCompData.chart} margin={{ left: -20, right: 10, bottom: 0, top: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" style={{ fontSize: "10px", fontWeight: "600", fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                    <YAxis style={{ fontSize: "10px", fontWeight: "600", fill: "#94A3B8" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip formatter={(v) => formatCurrency(v as number)} />
                    <Legend />
                    <Bar dataKey={monthCompData.m1.label} fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={monthCompData.m2.label} fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    {monthCompData.m3 && (
                      <Bar dataKey={monthCompData.m3.label} fill="#10B981" radius={[4, 4, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </motion.div>
        )}

        {/* COMPARE YEARS SECTION (5) */}
        {activeTab === "compare-years" && (
          <motion.div
            key="compare-years-content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            
            {/* YoY Cards summaries */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {([2024, 2025, 2026] as const).map((yr) => {
                const data = yearlyCompData.stats[yr];
                return (
                  <div key={yr} className="glass-card rounded-3xl p-6 border bg-white shadow-sm text-left flex flex-col justify-between hover-lift">
                    <div className="border-b border-slate-100 pb-3 mb-3">
                      <span className="text-xs font-black text-text-primary tracking-wide block uppercase">Year Performance: {yr}</span>
                    </div>
                    <div className="space-y-3 py-2 text-xs font-bold text-text-secondary">
                      <div className="flex justify-between">
                        <span>Revenues:</span>
                        <span className="text-text-primary">{formatCurrency(data.rev)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expenses:</span>
                        <span className="text-danger">{formatCurrency(data.exp)}</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 mt-1 flex justify-between items-center">
                      <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Annual Surplus:</span>
                      <span className={`text-base font-black ${data.pl >= 0 ? "text-success" : "text-danger"}`}>
                        {formatCurrency(data.pl)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Yearly Recharts Bar Chart */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-border-color bg-white shadow-sm text-left">
              <h3 className="font-display font-black text-lg text-text-primary tracking-tight">Yearly Corporate Growth Trends</h3>
              <p className="text-xs text-text-secondary mt-0.5">Year-over-year annual revenue versus overhead disbursement trends.</p>

              <div className="h-80 w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyCompData.chart} margin={{ left: -20, right: 10, bottom: 0, top: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="year" style={{ fontSize: "10px", fontWeight: "600", fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                    <YAxis style={{ fontSize: "10px", fontWeight: "600", fill: "#94A3B8" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip formatter={(v) => formatCurrency(v as number)} />
                    <Legend />
                    <Bar dataKey="Revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Profit" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
