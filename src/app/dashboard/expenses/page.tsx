"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  Save,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle,
  Plus,
  Coins,
  CreditCard,
  Notebook,
  Sparkles,
  Wallet,
  Trash2,
  Receipt,
  Wand2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Tag
} from "lucide-react";
import { useAccounting } from "@/context/AccountingContext";
import { parseNaturalLanguageTransactions } from "@/utils/nlpParser";
import CustomDatePicker from "@/components/CustomDatePicker";

interface ExpenseRow {
  id: string;
  title: string;
  amount: string;
}

// ── Inner component uses useSearchParams (must be inside <Suspense>) ──
function AddEntryContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const { transactions, saveDailyRecord, user, formatCurrency, addNotification, updateSettings } = useAccounting();

  // Tab State: manual form vs AI natural language parser
  const [activeFormTab, setActiveFormTab] = useState<"manual" | "ai">("manual");
  const [nlpText, setNlpText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  // Date State - pre-fill from search params or default to today
  const [date, setDate] = useState(dateParam || new Date().toISOString().split("T")[0]);

  // Income / Earned States
  const [onlineAmount, setOnlineAmount] = useState("");
  const [cashAmount, setCashAmount] = useState("");

  // Multiple Expenses States (Dynamic array)
  const [expensesList, setExpensesList] = useState<ExpenseRow[]>([
    { id: "init-1", title: "", amount: "" }
  ]);

  // Notes & Visual alerts
  const [notes, setNotes] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Opening Balance input state
  const [openingBalanceInput, setOpeningBalanceInput] = useState("");

  // Date-Based State Loader: scans transactions when selected date changes
  useEffect(() => {
    const record = transactions.find(t => t.date === date);
    if (record) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOnlineAmount(record.onlineAmount > 0 ? record.onlineAmount.toString() : "");
      setCashAmount(record.cashAmount > 0 ? record.cashAmount.toString() : "");
      setExpensesList(
        record.expenses && record.expenses.length > 0
          ? record.expenses.map(e => ({ id: e.id, title: e.title, amount: e.amount.toString() }))
          : [{ id: "init-1", title: "", amount: "" }]
      );
      setNotes(record.notes || "");
    } else {
      // Initialize fresh fields if no entry exists for this date
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOnlineAmount("");
      setCashAmount("");
      setExpensesList([{ id: "init-1", title: "", amount: "" }]);
      setNotes("");
    }
  }, [date, transactions]);

  // Sync opening balance whenever date, user start balance, or transactions update
  useEffect(() => {
    const activeFormMonth = date.substring(0, 7);
    const baseOpeningBalance = user?.startingBalance ?? 0;
    let priorPL = 0;
    transactions.forEach(t => {
      if (t.date && t.date < `${activeFormMonth}-01`) {
        priorPL += (t.onlineAmount + t.cashAmount - t.expensesAmount);
      }
    });
    setOpeningBalanceInput((baseOpeningBalance + priorPL).toString());
  }, [date, transactions, user?.startingBalance]);

  // Dynamic calculations
  const parsedOnline = parseFloat(onlineAmount) || 0;
  const parsedCash = parseFloat(cashAmount) || 0;
  const totalRevenue = parsedOnline + parsedCash;

  const totalExpenses = expensesList.reduce((acc, exp) => {
    const amt = parseFloat(exp.amount) || 0;
    return acc + amt;
  }, 0);

  const netPL = totalRevenue - totalExpenses;

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

  // Accumulated prior PL & current calculated opening balance
  const activeFormMonth = date.substring(0, 7);
  let accumulatedPriorPL = 0;
  transactions.forEach(t => {
    if (t.date && t.date < `${activeFormMonth}-01`) {
      accumulatedPriorPL += (t.onlineAmount + t.cashAmount - t.expensesAmount);
    }
  });
  const currentCalculatedOpening = (user?.startingBalance ?? 0) + accumulatedPriorPL;

  const handleAddExpenseRow = () => {
    setExpensesList(prev => [
      ...prev,
      { id: "exp-" + Math.random().toString(36).substring(2, 9), title: "", amount: "" }
    ]);
  };

  const handleRemoveExpenseRow = (id: string) => {
    if (expensesList.length === 1) {
      setExpensesList([{ id: "init-1", title: "", amount: "" }]);
    } else {
      setExpensesList(prev => prev.filter(row => row.id !== id));
    }
  };

  const handleExpenseChange = (id: string, field: "title" | "amount", value: string) => {
    setExpensesList(prev =>
      prev.map(row => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleNlpParse = () => {
    if (!nlpText.trim()) {
      addNotification("No Text Entered", "Please write a sentence for the AI to parse.", "warning");
      return;
    }
    setIsParsing(true);

    setTimeout(() => {
      const parsed = parseNaturalLanguageTransactions(nlpText);
      if (parsed.length === 0) {
        addNotification("Parsing Failed", "Could not detect any valid transaction amounts in the text.", "warning");
        setIsParsing(false);
        return;
      }

      let newOnline = 0;
      let newCash = 0;
      const newExpenses: ExpenseRow[] = [];
      const notesSummary: string[] = [];

      parsed.forEach(item => {
        if (item.type === "income_online") {
          newOnline += item.amount;
          notesSummary.push(`Online Income (${item.title}): +${item.amount}`);
        } else if (item.type === "income_cash") {
          newCash += item.amount;
          notesSummary.push(`Cash Income (${item.title}): +${item.amount}`);
        } else if (item.type === "expense") {
          newExpenses.push({
            id: item.id,
            title: item.title,
            amount: item.amount.toString()
          });
          notesSummary.push(`Expense (${item.title}): -${item.amount}`);
        }
      });

      if (newOnline > 0) setOnlineAmount(newOnline.toString());
      if (newCash > 0) setCashAmount(newCash.toString());
      if (newExpenses.length > 0) {
        setExpensesList(newExpenses);
      }
      if (notesSummary.length > 0) {
        setNotes(prev => {
          const existing = prev ? prev.trim() : "";
          const parsedNotes = `Parsed: ${notesSummary.join(" | ")}`;
          return existing ? `${existing}\n${parsedNotes}` : parsedNotes;
        });
      }

      setIsParsing(false);
      addNotification(
        "AI Parse Complete ✓",
        `Detected ${parsed.length} transaction elements from your sentence.`,
        "success"
      );
      setActiveFormTab("manual");
      setNlpText("");
    }, 400);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    const structuredExpenses = expensesList
      .map(exp => ({
        id: exp.id,
        title: exp.title.trim(),
        amount: parseFloat(exp.amount) || 0
      }))
      .filter(exp => exp.title !== "" && exp.amount > 0);

    await saveDailyRecord({
      date,
      title: "Daily Store Operations",
      category: "Shop Ledger",
      onlineAmount: parsedOnline,
      cashAmount: parsedCash,
      expensesAmount: totalExpenses,
      expenses: structuredExpenses,
      notes: notes.trim()
    });

    // Check if the user entered a custom opening balance that does not match current calculated
    const inputVal = parseFloat(openingBalanceInput) || 0;
    if (inputVal !== currentCalculatedOpening) {
      const newStarting = inputVal - accumulatedPriorPL;
      await updateSettings({ startingBalance: newStarting });
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  const handleSamplePromptClick = (sample: string) => {
    setNlpText(sample);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-6 text-left">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight flex items-center gap-2.5">
            <span>Add &amp; Edit Entry</span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full">
              Ledger Control
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 font-medium">
            Select a ledger date to load existing records, edit values, or key in new transactions.
          </p>
        </div>
      </div>

      {/* Tab Switcher - Premium Glass Pills */}
      <div className="flex space-x-2 p-1.5 rounded-2xl bg-slate-200/60 border border-slate-300/60 backdrop-blur-md max-w-md shadow-inner">
        <button
          type="button"
          onClick={() => setActiveFormTab("manual")}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer ${
            activeFormTab === "manual"
              ? "bg-white text-primary shadow-md shadow-slate-900/5 scale-[1.02]"
              : "text-text-secondary hover:text-text-primary hover:bg-white/40"
          }`}
        >
          <Receipt className="w-4 h-4 text-primary" />
          <span>Manual Input Form</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFormTab("ai")}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer ${
            activeFormTab === "ai"
              ? "bg-white text-primary shadow-md shadow-slate-900/5 scale-[1.02]"
              : "text-text-secondary hover:text-text-primary hover:bg-white/40"
          }`}
        >
          <Sparkles className="w-4 h-4 text-primary fill-primary/20" />
          <span>AI Quick Parser</span>
        </button>
      </div>

      {/* ── AI QUICK PARSER TAB (Enlarged Footprint & Premium Dynamic Animations) ── */}
      {activeFormTab === "ai" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-3xl p-7 md:p-10 bg-white border-2 border-indigo-200/80 shadow-xl relative overflow-hidden text-left space-y-8"
        >
          {/* Glowing Ambient Backdrop Orbs */}
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

          {/* AI Parser Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-secondary text-white flex items-center justify-center shadow-lg shadow-primary/25 border border-white/20 shrink-0">
                <Wand2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Natural Language AI Keying</span>
                  <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
                    Smart Engine
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Write or paste your daily business notes in free-form English. The AI engine will parse amounts, categories, and payment types automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Input Textarea */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Notebook className="w-4 h-4 text-primary" />
                <span>Paste Business Notes or Transaction Sentences</span>
              </label>
              <textarea
                rows={5}
                placeholder="e.g. Stripe online sale 15000; Office rent 5000; Water utilities 800; Cash sale 3200"
                value={nlpText}
                onChange={(e) => setNlpText(e.target.value)}
                className="w-full px-5 py-4 text-sm font-semibold border-2 border-slate-200/90 rounded-2xl bg-slate-50/70 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary text-slate-900 resize-none shadow-inner transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Quick Sample Preset Pills */}
            <div>
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Click a sample prompt to try:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  "Stripe online sale 15000; Office rent 5000; Water bill 800",
                  "UPI payment received 12500; Cash sale 4200; Store supplies 1500",
                  "Bank transfer 25000; Electric bill 2200; Staff salary 8000"
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSamplePromptClick(sample)}
                    className="px-3.5 py-2 bg-slate-100/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all text-left cursor-pointer"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>

            {/* Helper Guide Card */}
            <div className="p-5 border border-indigo-100 rounded-2xl bg-indigo-50/40 text-xs text-slate-600 leading-relaxed space-y-2.5">
              <p className="font-bold text-primary flex items-center space-x-2 text-xs">
                <Info className="w-4 h-4" />
                <span>AI Syntax Recognition Guide:</span>
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-semibold">
                <li className="flex items-center space-x-1.5 bg-white/80 p-2 rounded-xl border border-indigo-100">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span>Use <code>;</code> or newlines to separate multiple items.</span>
                </li>
                <li className="flex items-center space-x-1.5 bg-white/80 p-2 rounded-xl border border-indigo-100">
                  <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                  <span>Keywords <strong>online, UPI, stripe, bank</strong> map to Online Revenue.</span>
                </li>
                <li className="flex items-center space-x-1.5 bg-white/80 p-2 rounded-xl border border-indigo-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Keywords <strong>sale, sold, received, cash</strong> map to Cash Revenue.</span>
                </li>
                <li className="flex items-center space-x-1.5 bg-white/80 p-2 rounded-xl border border-indigo-100">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>Items like <code>rent 5000</code> or <code>utilities 800</code> map as expenses.</span>
                </li>
              </ul>
            </div>

            {/* Action Trigger Button */}
            <button
              type="button"
              onClick={handleNlpParse}
              disabled={isParsing}
              className="w-full flex items-center justify-center space-x-2 py-4 rounded-2xl bg-gradient-to-r from-primary via-indigo-600 to-secondary text-white font-extrabold shadow-lg shadow-primary/30 hover:brightness-105 transition-all hover-lift active:scale-98 text-sm cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 fill-white/20 animate-pulse" />
              <span>{isParsing ? "Analyzing Text & Populating Form..." : "Parse & Auto-Populate Form"}</span>
            </button>
          </div>
        </motion.div>
      ) : (
        /* ── MANUAL INPUT FORM TAB (Expanded Vertically & High Information Density) ── */
        <form onSubmit={handleSaveEntry} className="space-y-8 text-left">
          {/* Custom Animated Date Selector Card */}
          <div className="glass-card p-4 sm:p-5 rounded-3xl bg-white border border-border-color shadow-sm w-full max-w-md">
            <CustomDatePicker
              value={date}
              onChange={(newDate) => setDate(newDate)}
              label="Select Ledger Date"
            />
          </div>

          {/* REQUIREMENT 1: Redesigned 'Opening Period Balance' Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-7 md:p-8 border-2 border-purple-200/80 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-purple-500/10 shadow-lg relative overflow-hidden transition-all hover:shadow-xl"
          >
            {/* Ambient background blur highlights */}
            <div className="absolute -top-16 -left-16 w-36 h-36 bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-indigo-300/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400/30 flex items-center justify-center text-white shadow-xl shadow-purple-500/30 shrink-0">
                  <Wallet className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <h3 className="font-display font-black text-xl text-purple-950 tracking-tight flex items-center gap-2">
                    <span>Opening Period Balance</span>
                    <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-300/60 shadow-xs">
                      Ledger Base
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 font-semibold mt-1 max-w-xl leading-relaxed">
                    Initial capital active for <strong className="text-purple-900">{getMonthLabel(activeFormMonth)}</strong>. Prior month carry-forward flow is calculated automatically.
                  </p>
                </div>
              </div>

              {/* Prominent Easy-To-Use Input Field */}
              <div className="w-full md:w-56 flex-shrink-0 relative">
                <label className="block text-[10px] font-black text-purple-900 uppercase tracking-widest mb-1.5 text-left md:text-right">
                  Enter / Edit Capital
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={openingBalanceInput}
                    onChange={(e) => setOpeningBalanceInput(e.target.value)}
                    className="w-full pl-9 pr-4 py-3.5 text-lg font-black border-2 border-purple-300/90 rounded-2xl bg-white focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-600 text-purple-950 shadow-md text-left transition-all"
                  />
                  <span className="text-base font-black text-purple-700 absolute left-4 top-3.5">
                    {user?.currencySymbol || "₹"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* REQUIREMENT 2 & 3: Enhanced 'Money Earned' and 'Money Spent' Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* ── MONEY EARNED (INCOME) SECTION ── */}
            <div className="glass-card rounded-3xl p-4.5 sm:p-7 bg-white border border-emerald-100 shadow-md hover:shadow-xl transition-all space-y-6 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />

              <div className="flex items-center space-x-3 border-b border-slate-100 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 border border-emerald-400/20 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
                    <span>Money Earned</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Inflows
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Record all business revenue and daily sales</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Online Received Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <span>Online Amount Received ({user?.currencySymbol || "₹"})</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 15000"
                      value={onlineAmount}
                      onChange={(e) => setOnlineAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-3.5 text-sm font-black border border-slate-200 rounded-2xl bg-slate-50/70 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary text-slate-900 shadow-sm transition-all"
                    />
                    <span className="text-sm font-black text-slate-400 absolute left-3.5 top-3.5">
                      {user?.currencySymbol || "₹"}
                    </span>
                  </div>
                </div>

                {/* Cash Received Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
                      <Coins className="w-3.5 h-3.5" />
                    </div>
                    <span>Cash Amount Received ({user?.currencySymbol || "₹"})</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 5000"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-3.5 text-sm font-black border border-slate-200 rounded-2xl bg-slate-50/70 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary text-slate-900 shadow-sm transition-all"
                    />
                    <span className="text-sm font-black text-slate-400 absolute left-3.5 top-3.5">
                      {user?.currencySymbol || "₹"}
                    </span>
                  </div>
                </div>

                {/* Total Revenue Aggregator Banner */}
                <div className="p-4 border border-emerald-200/80 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/60 flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Total Revenue:</span>
                  </div>
                  <span className="font-display font-black text-lg text-emerald-700">{formatCurrency(totalRevenue)}</span>
                </div>
              </div>
            </div>

            {/* ── MONEY SPENT (EXPENSES) SECTION ── */}
            <div className="glass-card rounded-3xl p-4.5 sm:p-7 bg-white border border-rose-100 shadow-md hover:shadow-xl transition-all space-y-6 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full pointer-events-none" />

              <div className="flex items-center space-x-3 border-b border-slate-100 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-500 border border-rose-400/20 flex items-center justify-center text-white shadow-lg shadow-rose-500/25 shrink-0">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
                    <span>Money Spent</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                      Outflows
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Itemize all shop expenditures and costs</p>
                </div>
              </div>

              {/* Itemized Expenses Dynamic List - Expanded Height & High-Density Rows */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {expensesList.map((row, idx) => (
                    <motion.div
                      key={row.id}
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border border-slate-200/90 rounded-2xl bg-slate-50/60 p-3 sm:p-2.5 hover:bg-slate-100/50 transition-all shadow-xs"
                    >
                      <div className="flex items-center space-x-2 flex-grow min-w-0">
                        <span className="w-5 text-center text-[10px] font-black text-slate-400 shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          placeholder="e.g. Electricity, Stock, Rent"
                          value={row.title}
                          onChange={(e) => handleExpenseChange(row.id, "title", e.target.value)}
                          className="w-full px-3.5 py-3 sm:py-2.5 text-sm sm:text-xs font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 min-w-0"
                        />
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 justify-between sm:justify-end pl-7 sm:pl-0">
                        <div className="relative flex-1 sm:w-32">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={row.amount}
                            onChange={(e) => handleExpenseChange(row.id, "amount", e.target.value)}
                            className="w-full pl-7 pr-3 py-2.5 text-xs font-black border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
                          />
                          <span className="text-xs font-black text-slate-400 absolute left-2.5 top-2.5">
                            {user?.currencySymbol || "₹"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExpenseRow(row.id)}
                          className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex-shrink-0 cursor-pointer"
                          title="Remove item row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="space-y-4 pt-2">
                <button
                  type="button"
                  onClick={handleAddExpenseRow}
                  className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-slate-200 hover:border-primary/40 rounded-2xl text-slate-600 hover:text-primary hover:bg-primary/5 text-xs font-black transition-all hover-lift cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Itemized Expense</span>
                </button>

                {/* Total Expenses Summary Banner */}
                <div className="p-4 border border-rose-200/80 rounded-2xl bg-gradient-to-r from-rose-50/90 to-pink-50/60 flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-rose-800">Total Expenses:</span>
                  </div>
                  <span className="font-display font-black text-lg text-rose-700">{formatCurrency(totalExpenses)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* REQUIREMENT 3: Net Profit Summary & Memo notes (Expanded Vertically) */}
          <div className="glass-card rounded-3xl p-7 border border-border-color bg-white grid grid-cols-1 md:grid-cols-2 gap-6 items-center shadow-md">
            <div className="space-y-2 text-left">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                <Notebook className="w-4 h-4 text-primary" />
                <span>Remarks / Operational Memo Notes</span>
              </label>
              <textarea
                rows={2}
                placeholder="Add brief details about today's trade, supplier invoices, or operational notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 text-xs font-semibold border border-slate-200 rounded-2xl bg-slate-50/70 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary text-slate-900 resize-none transition-all shadow-xs"
              />
            </div>

            <div className="p-6 border border-slate-200/80 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col justify-center space-y-2.5 text-xs shadow-inner">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-500 uppercase tracking-wider text-[11px]">Calculated Net Surplus:</span>
                <span className={`font-display font-black text-xl sm:text-2xl ${netPL >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {netPL >= 0 ? "+" : ""}{formatCurrency(netPL)}
                </span>
              </div>
              <div className="text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 pt-1 border-t border-slate-200/60">
                <CheckCircle className={`w-4 h-4 ${netPL >= 0 ? "text-emerald-500" : "text-rose-500"}`} />
                <span className={netPL >= 0 ? "text-emerald-700" : "text-rose-700"}>
                  {netPL >= 0 ? "Daily Ledger in Green (Surplus Position)" : "Daily Ledger in Red (Deficit Position)"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Commit Bar */}
          <div className="flex items-center justify-end space-x-4 pt-2">
            {isSaved && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 animate-pulse"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Ledger Entry Saved Safely!</span>
              </motion.span>
            )}
            <button
              type="submit"
              className="flex items-center space-x-2.5 px-9 py-4 bg-gradient-to-r from-primary via-indigo-600 to-secondary text-white font-extrabold rounded-2xl hover:shadow-xl hover:shadow-primary/30 transition-all hover-lift active:scale-98 text-sm cursor-pointer border border-white/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Ledger Entry</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Outer page wraps AddEntryContent in Suspense (required by Next.js for useSearchParams) ──
export default function AddEntryPage() {
  return (
    <Suspense fallback={null}>
      <AddEntryContent />
    </Suspense>
  );
}
