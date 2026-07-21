"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  FileText,
  Download
} from "lucide-react";
import { useAccounting } from "@/context/AccountingContext";
import { triggerBlobDownload } from "@/utils/downloadHelper";
import CustomMonthDropdown from "@/components/CustomMonthDropdown";
import { generateMonthOptions } from "@/utils/dateDropdownHelpers";

const PIE_CHART_COLORS = [
  "#6366F1", "#06B6D4", "#10B981",
  "#F43F5E", "#F59E0B", "#8B5CF6", "#EC4899"
];

export default function AnalyticsPage() {
  const {
    transactions,
    dailySummaries,
    formatCurrency,
    addNotification,
    user,
    selectedMonth,
    setSelectedMonth,
    revenueTarget,
    netProfitTarget,
    expenseCeiling,
    growthRate,
    savingsRate,
    budgets
  } = useAccounting();
  const [mounted, setMounted] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Hydration safety checker
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // PDF Report Downloader handler using Blob & invisible <a> click trigger
  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const activeMonth = selectedMonth && selectedMonth !== "All"
        ? selectedMonth
        : new Date().toISOString().split("T")[0].substring(0, 7);

      const primaryNavy = [15, 23, 42];
      const brandBlue = [37, 99, 235];
      const darkSlate = [30, 41, 59];
      const slateText = [100, 116, 139];
      const lightBg = [248, 250, 252];
      const borderGray = [226, 232, 240];
      const successEmerald = [16, 185, 129];
      const dangerRed = [244, 63, 94];

      const pdfRefHash = Math.random().toString(36).substring(2, 8).toUpperCase();

      const formatCurrencyPDF = (amt: number) => {
        const symbol = user?.currencySymbol || "₹";
        return `${symbol} ${Math.round(amt).toLocaleString("en-IN")}`;
      };

      const drawHeaderBanner = (pageTitle: string) => {
        doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
        doc.rect(0, 0, 210, 18, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(user?.businessName || "MY ACCOUNTING", 15, 11);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text("EXECUTIVE FINANCIAL REPORTING ENGINE", 15, 15);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(pageTitle.toUpperCase(), 195, 11, { align: "right" });
        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.setLineWidth(0.4);
        doc.line(15, 18, 195, 18);
      };

      const addFooter = (pageNum: number, totalPages: number) => {
        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.setLineWidth(0.3);
        doc.line(15, 282, 195, 282);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(slateText[0], slateText[1], slateText[2]);
        doc.text("CONFIDENTIAL - FOR INTERNAL EXECUTIVE & BOARD USE ONLY", 15, 287);
        doc.text(`REF: #${pdfRefHash}`, 105, 287, { align: "center" });
        doc.text(`PAGE ${pageNum} OF ${totalPages}`, 195, 287, { align: "right" });
      };

      // Page 1: Overview
      drawHeaderBanner("EXECUTIVE FINANCIAL PERFORMANCE OVERVIEW");
      
      const monthTxs = transactions.filter(t => t.date.startsWith(activeMonth));
      const rev = monthTxs.reduce((acc, t) => acc + t.onlineAmount + t.cashAmount, 0);
      const exp = monthTxs.reduce((acc, t) => acc + t.expensesAmount, 0);
      const profit = rev - exp;

      doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("EXECUTIVE FINANCIAL PERFORMANCE OVERVIEW", 20, 28);
      
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.roundedRect(20, 34, 170, 32, 2, 2, "F");
      doc.setFontSize(9);
      doc.text(`WORKSPACE: ${user?.businessName || "Aura Accounting"}`, 25, 42);
      doc.text(`STATEMENT PERIOD: ${activeMonth}`, 25, 49);
      doc.text(`GENERATED ON: ${new Date().toLocaleDateString()}`, 25, 56);

      // KPI Boxes
      doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.roundedRect(20, 72, 52, 24, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.text("GROSS REVENUE", 24, 79);
      doc.setFontSize(11);
      doc.text(formatCurrencyPDF(rev), 24, 88);

      doc.setFillColor(dangerRed[0], dangerRed[1], dangerRed[2]);
      doc.roundedRect(79, 72, 52, 24, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.text("TOTAL OUTFLOWS", 83, 79);
      doc.setFontSize(11);
      doc.text(formatCurrencyPDF(exp), 83, 88);

      doc.setFillColor(successEmerald[0], successEmerald[1], successEmerald[2]);
      doc.roundedRect(138, 72, 52, 24, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.text("NET SURPLUS", 142, 79);
      doc.setFontSize(11);
      doc.text(formatCurrencyPDF(profit), 142, 88);

      addFooter(1, 1);

      // Instantiate Blob object & trigger direct download
      const pdfBlob = doc.output("blob");
      triggerBlobDownload(pdfBlob, "Executive_Performance_Report.pdf");

      addNotification(
        "PDF Report Downloaded",
        "Your Executive Performance Report has been downloaded directly.",
        "success"
      );
    } catch (err) {
      console.error("Analytics PDF Generation failure:", err);
      addNotification("Download Error", "Failed to generate Executive PDF report.", "danger");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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

  // 2. Chart Data: Expense categories — use itemized expense titles, not t.category
  const { pieChartData, totalExpenses } = useMemo(() => {
    const categoryTotals: { [category: string]: number } = {};
    let total = 0;

    transactions.forEach(t => {
      // Prefer itemized expense breakdown from t.expenses[]
      if (t.expenses && t.expenses.length > 0) {
        t.expenses.forEach(e => {
          if (e.title && e.amount > 0) {
            const cat = e.title.trim();
            categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
            total += e.amount;
          }
        });
      } else if (t.expensesAmount > 0) {
        // Fallback: use category field if no itemized expenses recorded
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

    return { pieChartData: data, totalExpenses: total };
  }, [transactions]);

  // 3. Automated Financial Insights Engine
  const insights = useMemo(() => {
    const insightsList: string[] = [];
    const totalRev = transactions.reduce((acc, t) => acc + t.onlineAmount + t.cashAmount, 0);

    if (totalRev === 0) {
      return ["No ledger sheets found. Enter income and expenses to trigger automated financial advisor metrics."];
    }

    const profitRatio = (totalRev - totalExpenses) / totalRev;

    if (profitRatio > 0.4) {
      insightsList.push("Excellent Margin Health: Your net profit surplus represents over 40% of total incoming revenue. Consider allocating capital to stock inventory scaling.");
    } else if (profitRatio > 0.1) {
      insightsList.push("Stable Balance sheet: Your cash flow operates with a moderate surplus. Focus on auditing repeating subscription costs to expand margins.");
    } else {
      insightsList.push("Tight Operating Margins: Expense outflows are consuming over 90% of revenues. We recommend checking your utilities and office lease balances.");
    }

    // Category insights based on actual item data
    if (pieChartData.length > 0) {
      const topCat = pieChartData[0];
      const topCatRatio = totalExpenses > 0 ? (topCat.value / totalExpenses) * 100 : 0;
      insightsList.push(`Top Expense Drain: Outflows for "${topCat.name}" represent ${topCatRatio.toFixed(0)}% of total business expenses. Consider renegotiating provider contracts.`);
    }

    return insightsList;
  }, [transactions, totalExpenses, pieChartData]);

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-color pb-6">
        <div className="text-left">
          <h1 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight">
            Performance Analytics Hub
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Visual balance tracking sheets, category splits, and natural language analytical insights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <CustomMonthDropdown
            value={selectedMonth}
            onChange={(newMonth) => setSelectedMonth(newMonth)}
            options={generateMonthOptions(12, 0, true)}
            variant="glass"
            size="sm"
            align="right"
          />
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white rounded-xl font-extrabold text-xs shadow-lg hover:shadow-xl transition-all duration-200 shrink-0 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{isGeneratingPdf ? "GENERATING REPORT..." : "DOWNLOAD PDF REPORT"}</span>
          </button>
        </div>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Area Chart - Revenue vs Expenses (8 cols) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-8 space-y-4"
        >
          <div className="border-b border-border-color pb-3 text-left">
            <h2 className="font-display font-bold text-lg text-text-primary flex items-center space-x-2">
              <Activity className="w-5 h-5 text-primary" />
              <span>Revenue vs Expenses (Daily Trend)</span>
            </h2>
          </div>

          <div className="glass-card rounded-3xl p-4 sm:p-6 border border-border-color bg-white h-80 sm:h-[400px] shadow-sm relative overflow-hidden">
            {/* Ambient indicator lights */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 blur-2xl pointer-events-none -z-10" />

            {areaChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-text-secondary">
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

                  <XAxis
                    dataKey="name"
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
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
                  <Area
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                    activeDot={{ r: 6 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Expenses"
                    stroke="#F43F5E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorExp)"
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Pie Chart - Expenses Breakdown (4 cols) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-4 space-y-4"
        >
          <div className="border-b border-border-color pb-3 text-left">
            <h2 className="font-display font-bold text-lg text-text-primary flex items-center space-x-2">
              <PieIcon className="w-5 h-5 text-secondary" />
              <span>Outflows Splits</span>
            </h2>
          </div>

          <div className="glass-card rounded-3xl p-5 border border-border-color bg-white h-80 sm:h-[400px] flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 blur-xl pointer-events-none -z-10" />

            {pieChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-text-secondary">
                <Info className="w-6 h-6 text-slate-300 mb-2" />
                <span>No expense entries to analyze categories.</span>
              </div>
            ) : (
              <>
                <div className="w-full h-44 sm:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
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
                        <span className="text-text-secondary truncate">{d.name}</span>
                      </div>
                      <span className="text-text-primary flex-shrink-0">
                        {formatCurrency(d.value)} ({((d.value / totalExpenses) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Corporate AI insights section */}
      <div className="space-y-4">
        <div className="border-b border-border-color pb-3 text-left">
          <h2 className="font-display font-bold text-lg text-text-primary flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-warning fill-current animate-pulse" />
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
              className="p-5 border border-border-color rounded-2xl bg-white text-left flex items-start space-x-4 shadow-sm hover-lift relative overflow-hidden"
            >
              {/* Soft glow edge line */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary" />

              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md flex-shrink-0">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-primary tracking-widest block font-display">
                  Insight Recommendation
                </span>
                <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                  {insight}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
