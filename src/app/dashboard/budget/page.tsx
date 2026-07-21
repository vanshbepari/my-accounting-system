"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  PlusCircle,
  Trash2,
  Save,
  CheckCircle,
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { useAccounting } from "@/context/AccountingContext";
import CustomMonthDropdown from "@/components/CustomMonthDropdown";
import { generateMonthOptions } from "@/utils/dateDropdownHelpers";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

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

// Custom Tooltip displaying comparative variance between current and compared month
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  const { formatCurrency } = useAccounting();
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const cat = data.category;
    const activeVal = data.activeVal;
    const compareVal = data.compareVal;
    const diff = activeVal - compareVal;
    
    const activeMonthLabel = new Date(data.activeMonthName + "-15").toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const compareMonthLabel = new Date(data.compareMonthName + "-15").toLocaleDateString("en-US", { month: "short", year: "numeric" });

    return (
      <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xl text-left select-none text-[10px] font-bold text-slate-600 space-y-1.5 max-w-xs">
        <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">{cat}</p>
        <div className="flex justify-between space-x-6">
          <span>{activeMonthLabel}:</span>
          <span className="text-slate-900 font-black">{formatCurrency(activeVal)}</span>
        </div>
        <div className="flex justify-between space-x-6">
          <span>{compareMonthLabel}:</span>
          <span className="text-slate-900 font-black">{formatCurrency(compareVal)}</span>
        </div>
        <div className="border-t border-slate-100 my-1.5 pt-1.5 flex justify-between space-x-6">
          <span>Variance:</span>
          <span className={`font-black ${diff > 0 ? "text-rose-600" : diff < 0 ? "text-emerald-600" : "text-slate-500"}`}>
            {diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

interface BudgetFormRow {
  id: string;
  category: string;
  limitAmount: string;
  isRecurring: boolean;
}

export default function BudgetPage() {
  const {
    transactions,
    budgets,
    saveBudget,
    deleteBudget,
    selectedMonth,
    setSelectedMonth,
    formatCurrency,
    addNotification,
    user
  } = useAccounting();

  // Selected Month filter for active budgets
  const activeMonth = selectedMonth === "All" 
    ? new Date().toISOString().split("T")[0].substring(0, 7) 
    : selectedMonth;

  // Helper to calculate the previous month relative to a target month (YYYY-MM)
  const getPreviousMonth = (monthStr: string) => {
    const [yr, mo] = monthStr.split("-").map(Number);
    const d = new Date(yr, mo - 2, 15);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  // Sync compareMonth automatically to the previous month of activeMonth
  useEffect(() => {
    setCompareMonth(getPreviousMonth(activeMonth));
  }, [activeMonth]);

  // Force initial layout measurement for Recharts on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Month selector for historical budget-to-budget/actual analysis
  const [compareMonth, setCompareMonth] = useState("");

  // Local Form state (Notebook-style entry rows)
  const [formRows, setFormRows] = useState<BudgetFormRow[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [, setSaveSuccess] = useState(false);

  // Local session cache for custom future budgets saved manually in Notebook Entry modal
  const [sessionSavedFutureMonths, setSessionSavedFutureMonths] = useState<Record<string, BudgetFormRow[]>>({});

  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  // Helper to generate fresh empty rows for future month budget planning
  const createFreshRows = () => {
    const timestamp = Date.now();
    return [
      { id: `fresh-1-${timestamp}`, category: "", limitAmount: "0", isRecurring: true },
      { id: `fresh-2-${timestamp}`, category: "", limitAmount: "0", isRecurring: true },
      { id: `fresh-3-${timestamp}`, category: "", limitAmount: "0", isRecurring: true }
    ];
  };

  // Helper to load budget rows for any target month (past, active, or future) from database/context
  const loadBudgetRowsForMonth = (targetMonth: string) => {
    const monthBudgets = budgets.filter(b => b.month === targetMonth);
    if (monthBudgets.length > 0) {
      setFormRows(monthBudgets.map(b => ({
        id: b.id,
        category: b.category,
        limitAmount: b.limitAmount.toString(),
        isRecurring: b.isRecurring
      })));
    } else if (sessionSavedFutureMonths[targetMonth] && sessionSavedFutureMonths[targetMonth].length > 0) {
      setFormRows(sessionSavedFutureMonths[targetMonth]);
    } else {
      setFormRows([{ id: `init-${Date.now()}`, category: "", limitAmount: "", isRecurring: true }]);
    }
  };

  // Populate form rows when clicking "Edit Budgets"
  const startEditing = () => {
    loadBudgetRowsForMonth(activeMonth);
    setIsEditing(true);
  };

  // Change month inside the Modify Budgets entry panel and load its limits
  const handleEditMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    loadBudgetRowsForMonth(newMonth);
  };

  const handleAddRow = () => {
    setFormRows(prev => [
      ...prev,
      { id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, category: "", limitAmount: "", isRecurring: true }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (formRows.length === 1) {
      setFormRows([{ id: "init-1", category: "", limitAmount: "", isRecurring: true }]);
    } else {
      setFormRows(prev => prev.filter(r => r.id !== id));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRowChange = (id: string, field: keyof BudgetFormRow, value: any) => {
    setFormRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Submit budget form to database
  const handleSaveForm = async () => {
    // Validate rows
    const validRows = formRows.filter(r => r.category.trim() !== "" && parseFloat(r.limitAmount) > 0);
    if (validRows.length === 0) {
      addNotification("Validation Failed", "Please enter at least one category name and positive limit.", "warning");
      return;
    }

    try {
      const isFuture = activeMonth > currentMonthStr;
      if (isFuture) {
        setSessionSavedFutureMonths(prev => ({
          ...prev,
          [activeMonth]: validRows
        }));
      }

      // Find deleted rows
      const activeBudgets = budgets.filter(b => b.month === activeMonth);
      const rowIds = new Set(validRows.map(r => r.id));
      const toDelete = activeBudgets.filter(b => !rowIds.has(b.id));

      // Execute deletions
      for (const b of toDelete) {
        await deleteBudget(b.id);
      }

      // Execute upserts
      for (const row of validRows) {
        await saveBudget({
          id: row.id.startsWith("row-") || row.id.startsWith("init-") || row.id.startsWith("fresh-") ? undefined : row.id,
          category: row.category.trim(),
          limitAmount: parseFloat(row.limitAmount),
          month: activeMonth,
          isRecurring: row.isRecurring
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setIsEditing(false);
      addNotification("Budgets Updated", `Category budget limits for ${activeMonth} have been saved successfully to the backend database.`, "success");
    } catch {
      addNotification("Save Error", "Failed to update category budget limits.", "danger");
    }
  };

  // Extract all unique category names currently tracked across transactions or budgets
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => {
      if (t.expenses) {
        t.expenses.forEach(e => cats.add(e.title.trim()));
      }
    });
    budgets.forEach(b => cats.add(b.category.trim()));
    return Array.from(cats).sort();
  }, [transactions, budgets]);

  // Aggregate current month category expenses
  const activeMonthSpending = useMemo(() => {
    const spending: Record<string, number> = {};
    // Seed all categories with 0
    allCategories.forEach(c => { spending[c.toLowerCase()] = 0; });

    transactions
      .filter(t => t.date.startsWith(activeMonth))
      .forEach(t => {
        if (t.expenses) {
          t.expenses.forEach(e => {
            const key = e.title.trim().toLowerCase();
            spending[key] = (spending[key] || 0) + e.amount;
          });
        }
      });
    return spending;
  }, [transactions, activeMonth, allCategories]);

  // Compute active budget summaries. Only display categories for which a budget has been explicitly set.
  const budgetSummaries = useMemo(() => {
    const monthBudgets = budgets.filter(b => b.month === activeMonth);
    
    return monthBudgets.map(b => {
      const spending = activeMonthSpending[b.category.toLowerCase().trim()] || 0;
      const percentage = b.limitAmount > 0 ? (spending / b.limitAmount) * 100 : 0;

      return {
        id: b.id,
        category: b.category,
        limitAmount: b.limitAmount,
        spending,
        percentage,
        isRecurring: b.isRecurring,
        hasBudget: true
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [budgets, activeMonth, activeMonthSpending]);

  // Graph Data: comparing active month budgets with actual expenses, plus comparisons with comparative month
  const chartData = useMemo(() => {
    const targetCompareMonth = compareMonth || getPreviousMonth(activeMonth);

    // Aggregate active month spending
    const activeSpending: Record<string, number> = {};
    allCategories.forEach(cat => { activeSpending[cat.toLowerCase()] = 0; });
    transactions
      .filter(t => t.date.startsWith(activeMonth))
      .forEach(t => {
        if (t.expenses) {
          t.expenses.forEach(e => {
            const key = e.title.trim().toLowerCase();
            activeSpending[key] = (activeSpending[key] || 0) + e.amount;
          });
        }
      });

    // Aggregate compare month spending
    const compareSpending: Record<string, number> = {};
    allCategories.forEach(cat => { compareSpending[cat.toLowerCase()] = 0; });
    transactions
      .filter(t => t.date.startsWith(targetCompareMonth))
      .forEach(t => {
        if (t.expenses) {
          t.expenses.forEach(e => {
            const key = e.title.trim().toLowerCase();
            compareSpending[key] = (compareSpending[key] || 0) + e.amount;
          });
        }
      });

    // Display categories with spending OR configured budget limits in either active or compare month
    const activeBudgetsMap: Record<string, number> = {};
    budgets.filter(b => b.month === activeMonth).forEach(b => {
      activeBudgetsMap[b.category.toLowerCase().trim()] = b.limitAmount;
    });

    const compareBudgetsMap: Record<string, number> = {};
    budgets.filter(b => b.month === targetCompareMonth).forEach(b => {
      compareBudgetsMap[b.category.toLowerCase().trim()] = b.limitAmount;
    });

    const categoriesWithData = allCategories.filter(cat => {
      const key = cat.toLowerCase();
      return (
        (activeSpending[key] || 0) > 0 ||
        (compareSpending[key] || 0) > 0 ||
        (activeBudgetsMap[key] || 0) > 0 ||
        (compareBudgetsMap[key] || 0) > 0
      );
    });

    return categoriesWithData.map(cat => {
      const key = cat.toLowerCase();
      const valActive = activeSpending[key] || 0;
      const valCompare = compareSpending[key] || 0;

      return {
        category: cat,
        [`Current Month (${activeMonth})`]: valActive,
        [`Compared Month (${targetCompareMonth})`]: valCompare,
        activeVal: valActive,
        compareVal: valCompare,
        activeMonthName: activeMonth,
        compareMonthName: targetCompareMonth
      };
    });
  }, [transactions, activeMonth, compareMonth, allCategories]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-6 px-4 sm:px-6 lg:px-8 text-left">
      {/* Upper Title Hero Panel with Entrance Motion */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 border-b border-slate-200 pb-5 relative z-30"
      >
        <div>
          <div className="flex items-center space-x-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center shadow-md"
            >
              <Wallet className="w-5 h-5" />
            </motion.div>
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Budgeting & Alerts
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
                Set category spending limits for recurring expenses like rent, gas, or vendor bills, and get warning alerts before you overspend.
              </p>
            </div>
          </div>
        </div>

        {/* Global Month Selection Dropdown & Modify Button */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
          {!isEditing && (
            <CustomMonthDropdown
              value={activeMonth}
              onChange={(newMonth) => setSelectedMonth(newMonth)}
              options={generateMonthOptions(12, 0, false)}
              variant="light"
              size="sm"
              align="right"
            />
          )}

          {!isEditing && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={startEditing}
              className="flex items-center space-x-2 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Modify Budgets</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Notebook style budget setup OR active budget status progress */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="notebook-editing"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-xl relative z-20 overflow-visible"
              >
                {/* Notebook spine details */}
                <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 border-b border-slate-200" />
                <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/20">
                  <div>
                    <h3 className="font-display font-black text-slate-800 text-base">
                      Notebook Entry: Budget Limits
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
                      Configure Category Limit Floors
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3.5">
                    {/* Custom Month selector for setting future budgets (current + 3 future months, 0 past months) */}
                    <CustomMonthDropdown
                      value={activeMonth}
                      onChange={(newMonth) => handleEditMonthChange(newMonth)}
                      options={generateMonthOptions(0, 3, false)}
                      variant="glass"
                      size="sm"
                      align="right"
                    />

                    <button
                      onClick={handleAddRow}
                      className="flex items-center space-x-1 text-primary hover:text-primary-dark font-bold text-xs cursor-pointer focus:outline-none border border-primary/20 bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded-lg"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Row</span>
                    </button>
                  </div>
                </div>

                {/* Notebook rows entry */}
                <div className="p-3.5 sm:p-6 space-y-3.5 max-h-[50vh] overflow-y-auto">
                  {formRows.map((row, idx) => (
                    <motion.div
                      key={row.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 sm:p-0 bg-slate-50/70 sm:bg-transparent border border-slate-200/60 sm:border-0 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-2.5"
                    >
                      <div className="flex items-center space-x-2.5 w-full sm:flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-400 w-5 text-right shrink-0">{idx + 1}</span>
                        
                        {/* Category select/input */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={row.category}
                            onChange={(e) => handleRowChange(row.id, "category", e.target.value)}
                            placeholder="e.g. Gas, Salary, Rent"
                            list="category-suggestions"
                            className="w-full min-w-0 bg-white sm:bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-2.5 w-full sm:w-auto pl-7 sm:pl-0">
                        {/* Limit amount */}
                        <div className="flex-1 sm:w-28 sm:flex-initial relative min-w-0">
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">{user?.currencySymbol || "₹"}</span>
                          <input
                            type="number"
                            value={row.limitAmount}
                            onChange={(e) => handleRowChange(row.id, "limitAmount", e.target.value)}
                            placeholder="0"
                            className="w-full bg-white sm:bg-slate-50 border border-slate-200/80 rounded-xl pl-6 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 text-right"
                          />
                        </div>

                        {/* Recurring selector */}
                        <label className="flex items-center space-x-1.5 px-2.5 py-2 bg-white sm:bg-transparent border border-slate-200 sm:border-slate-200/60 rounded-xl hover:bg-slate-50 cursor-pointer text-slate-600 shrink-0 select-none">
                          <input
                            type="checkbox"
                            checked={row.isRecurring}
                            onChange={(e) => handleRowChange(row.id, "isRecurring", e.target.checked)}
                            className="rounded text-primary focus:ring-primary/20 cursor-pointer h-3.5 w-3.5"
                          />
                          <span className="text-[10px] font-bold">Recurring</span>
                        </label>

                        {/* Remove row */}
                        <button
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50/50 transition-colors cursor-pointer shrink-0"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  
                  <datalist id="category-suggestions">
                    {allCategories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                {/* Notebook entry foot Actions */}
                <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer px-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveForm}
                    className="flex items-center space-x-2 bg-gradient-to-tr from-primary to-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Budgets</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="notebook-viewing"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-4"
              >
                {/* Active category budget statuses list with Staggered Cascading Entrance */}
                {budgetSummaries.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center flex flex-col items-center justify-center shadow-sm">
                    <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <h3 className="font-display font-black text-slate-800 text-base">No Budgets Defined</h3>
                    <p className="text-xs text-slate-400 max-w-sm font-semibold mt-1.5 leading-relaxed">
                      You haven't established category spending limits for the month of {activeMonth} yet. Add limits to monitor category overflows!
                    </p>
                    <button
                      onClick={startEditing}
                      className="mt-4 flex items-center space-x-2 bg-slate-900 text-white px-4.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Establish Limits</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {budgetSummaries.map((summary, idx) => {
                      const isBreached = summary.percentage >= 100;
                      const isWarning = summary.percentage >= 80 && summary.percentage < 100;
                      
                      let progressColor = "bg-emerald-500";
                      let textColor = "text-emerald-600";
                      let cardBorder = "border-slate-200/80";
                      
                      if (isBreached) {
                        progressColor = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse";
                        textColor = "text-rose-600";
                        cardBorder = "border-rose-200/80 bg-rose-50/10";
                      } else if (isWarning) {
                        progressColor = "bg-amber-500";
                        textColor = "text-amber-600";
                        cardBorder = "border-amber-200/80 bg-amber-50/10";
                      }

                      return (
                        <motion.div
                          key={summary.id}
                          initial={{ opacity: 0, y: 20, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          whileHover={{ y: -3, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
                          transition={{ duration: 0.45, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                          className={`bg-white rounded-2xl border ${cardBorder} p-4.5 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2.5">
                              <span className="text-xs font-black text-slate-800 truncate max-w-[120px] xs:max-w-none">
                                {summary.category}
                              </span>
                              {summary.isRecurring && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.1 + 0.1 }}
                                  className="text-[8px] bg-slate-100 border border-slate-200/80 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase tracking-wider"
                                >
                                  Recurring
                                </motion.span>
                              )}
                            </div>
                            <span className="text-[11px] font-black text-slate-700">
                              <AnimatedNumber value={summary.spending} formatFn={formatCurrency} />{" "}
                              <span className="text-slate-400 font-semibold">of {formatCurrency(summary.limitAmount)}</span>
                            </span>
                          </div>

                          {/* Progress Line with GPU ScaleX Liquid Fill Animation */}
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                            <motion.div
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: Math.min(summary.percentage, 100) / 100 }}
                              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                              className={`h-full origin-left ${progressColor}`}
                            />
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-[10px] font-bold ${textColor} flex items-center space-x-1`}>
                              {isBreached ? (
                                <>
                                  <motion.div
                                    initial={{ scale: 1 }}
                                    animate={{ scale: [1, 1.15, 1] }}
                                    transition={{ duration: 0.5, delay: 0.8 }}
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  </motion.div>
                                  <span>Over budget by {(summary.percentage - 100).toFixed(0)}%</span>
                                </>
                              ) : isWarning ? (
                                <>
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  </motion.div>
                                  <span>Approaching limit ({summary.percentage.toFixed(0)}% used)</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span>On track ({summary.percentage.toFixed(0)}% used)</span>
                                </>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400 font-black">
                              {formatCurrency(Math.max(0, summary.limitAmount - summary.spending))} remaining
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Graph Comparison Charts Panel with Delayed Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 space-y-6"
        >
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm relative z-20 overflow-visible">
            <div className="flex flex-col space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-display font-black text-slate-800 text-sm">
                    Comparative Graph Analysis
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase mt-0.5">
                    Monthly Performance Comparison
                  </p>
                </div>

                {/* Comparison Month Dropdown */}
                <CustomMonthDropdown
                  value={compareMonth}
                  onChange={(val) => setCompareMonth(val)}
                  options={[
                    { value: "", label: "No Month Selected" },
                    ...generateMonthOptions(6, 0, false).filter(opt => opt.value !== activeMonth)
                  ]}
                  variant="glass"
                  size="sm"
                  align="right"
                />
              </div>

              {chartData.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs font-semibold">
                  Record expenses in this month to review comparative analytics.
                </div>
              ) : (
                <div className="w-full h-64 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="category"
                        tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: "10px", fontWeight: 700, paddingBottom: "10px" }}
                      />
                      <Bar dataKey={`Current Month (${activeMonth})`} fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
                      <Bar dataKey={`Compared Month (${compareMonth || getPreviousMonth(activeMonth)})`} fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Educational Quick Stats Alert Banner Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="bg-gradient-to-tr from-primary to-indigo-600 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden"
          >
            {/* Sparkles background effect */}
            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-white/15 to-transparent rounded-full flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white/20" />
            </div>
            
            <h3 className="font-display font-black text-sm tracking-tight mb-1">
              Active Alerts System
            </h3>
            <p className="text-[11px] text-white/95 leading-relaxed font-semibold">
              The alerting scanner continuously reviews transactions and triggers backend-saved in-app alerts at 80% (Warning) and 100% (Breached) category budget allocations. Check your top nav notification bell icon to review status logs.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
