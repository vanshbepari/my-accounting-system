"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  DollarSign,
  PlusCircle,
  Trash2,
  Save,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle,
  Plus,
  Coins,
  CreditCard,
  Notebook,
  Loader2,
  Sparkles
} from "lucide-react";
import { useAccounting } from "@/context/AccountingContext";
import { parseNaturalLanguageTransactions } from "@/utils/nlpParser";

interface ExpenseRow {
  id: string;
  title: string;
  amount: string;
}

// ── Inner component uses useSearchParams (must be inside <Suspense>) ──
function AddEntryContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const { transactions, saveDailyRecord, user, formatCurrency, addNotification } = useAccounting();

  // Tab State: manual form vs AI natural language parser
  const [activeFormTab, setActiveFormTab] = useState<"manual" | "ai">("manual");
  const [nlpText, setNlpText] = useState("");

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

  // Dynamic calculations
  const parsedOnline = parseFloat(onlineAmount) || 0;
  const parsedCash = parseFloat(cashAmount) || 0;
  const totalRevenue = parsedOnline + parsedCash;

  const totalExpenses = expensesList.reduce((acc, exp) => {
    const amt = parseFloat(exp.amount) || 0;
    return acc + amt;
  }, 0);

  const netPL = totalRevenue - totalExpenses;

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
    const parsed = parseNaturalLanguageTransactions(nlpText);
    if (parsed.length === 0) {
      addNotification("Parsing Failed", "Could not detect any valid transaction amounts in the text.", "warning");
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

    addNotification(
      "AI Parse Complete ✓",
      `Detected ${parsed.length} transaction elements from your sentence.`,
      "success"
    );
    setActiveFormTab("manual");
    setNlpText("");
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();

    const structuredExpenses = expensesList
      .map(exp => ({
        id: exp.id,
        title: exp.title.trim(),
        amount: parseFloat(exp.amount) || 0
      }))
      .filter(exp => exp.title !== "" && exp.amount > 0);

    saveDailyRecord({
      date,
      title: "Daily Store Operations",
      category: "Shop Ledger",
      onlineAmount: parsedOnline,
      cashAmount: parsedCash,
      expensesAmount: totalExpenses,
      expenses: structuredExpenses,
      notes: notes.trim()
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-color pb-6 text-left">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight">
            Add &amp; Edit Entry
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Choose a date to load saved records, edit values, and save updates.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex space-x-1.5 p-1 rounded-2xl bg-slate-100 border border-border-color max-w-sm">
        <button
          type="button"
          onClick={() => setActiveFormTab("manual")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeFormTab === "manual"
              ? "bg-white text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <span>Manual Input Form</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFormTab("ai")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeFormTab === "ai"
              ? "bg-white text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-primary fill-primary/10" />
          <span>AI Quick Parser</span>
        </button>
      </div>

      {activeFormTab === "ai" ? (
        <div className="glass-card rounded-3xl p-6 md:p-8 bg-white border border-border-color shadow-sm space-y-6 text-left">
          <div className="flex items-center space-x-3 border-b border-border-color pb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-text-primary">Natural Language Keying</h3>
              <p className="text-[10px] text-text-secondary">Type sentences naturally to auto-fill the ledger fields</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                Paste Business Notes or Sentences
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Stripe online sale 15000; Office rent 5000; Water utilities 800"
                value={nlpText}
                onChange={(e) => setNlpText(e.target.value)}
                className="w-full px-4 py-3 text-xs font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary resize-none"
              />
            </div>

            <div className="p-4 border border-blue-100 rounded-xl bg-blue-50/40 text-xs text-text-secondary leading-relaxed space-y-2">
              <p className="font-bold text-primary flex items-center space-x-1">
                <Info className="w-3.5 h-3.5" />
                <span>How to write for the AI Parser:</span>
              </p>
              <ul className="list-disc pl-4 space-y-1.5 font-semibold text-[11px]">
                <li>Use semicolons (<code>;</code>) or newlines to split different items.</li>
                <li>Mention <strong>online</strong>, <strong>UPI</strong>, <strong>stripe</strong>, or <strong>bank</strong> to tag income as Online Asset.</li>
                <li>Mention <strong>sale</strong>, <strong>sold</strong>, <strong>received</strong>, or <strong>revenue</strong> to tag as Income.</li>
                <li>Any other items (e.g. <code>rent 5000</code>, <code>electricity bill 1500</code>) are mapped as itemized expenses.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleNlpParse}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold shadow-md shadow-primary/25 hover:brightness-105 transition-all hover-lift active:scale-98 text-xs sm:text-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-white/10" />
              <span>Parse &amp; Populate Form</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveEntry} className="space-y-8 text-left">
          {/* Date Selector Card */}
          <div className="glass-card rounded-2xl p-5 border border-border-color bg-white">
            <div className="max-w-xs space-y-1">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                Select Ledger Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary cursor-pointer"
                />
                <Calendar className="w-4 h-4 text-primary absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          {/* Grid: Money Earned and Money Spent */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* MONEY EARNED (INCOME) SECTION */}
            <div className="glass-card rounded-3xl p-6 border border-border-color bg-white space-y-6 shadow-sm">
              <div className="flex items-center space-x-3 border-b border-border-color pb-4">
                <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success shadow-sm">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-text-primary">Money Earned</h3>
                  <p className="text-[10px] text-text-secondary">Record all business income for today</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Online Received Amount */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider flex items-center space-x-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                    <span>Online Amount Received ({user?.currencySymbol || "₹"})</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 5000"
                      value={onlineAmount}
                      onChange={(e) => setOnlineAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 text-sm font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary"
                    />
                    <span className="text-xs font-bold text-text-secondary absolute left-3 top-4">{user?.currencySymbol || "₹"}</span>
                  </div>
                </div>

                {/* Cash Received Amount */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider flex items-center space-x-1.5">
                    <Coins className="w-3.5 h-3.5 text-warning" />
                    <span>Cash Amount Received ({user?.currencySymbol || "₹"})</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 2000"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 text-sm font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary"
                    />
                    <span className="text-xs font-bold text-text-secondary absolute left-3 top-4">{user?.currencySymbol || "₹"}</span>
                  </div>
                </div>

                {/* Total Revenue Aggregator */}
                <div className="p-4 border border-emerald-100 rounded-xl bg-emerald-50/50 flex items-center justify-between text-xs font-semibold">
                  <span className="text-emerald-700">Total Revenue:</span>
                  <span className="font-extrabold text-success text-base">{formatCurrency(totalRevenue)}</span>
                </div>
              </div>
            </div>

            {/* MONEY SPENT (EXPENSES) SECTION */}
            <div className="glass-card rounded-3xl p-6 border border-border-color bg-white space-y-6 shadow-sm">
              <div className="flex items-center space-x-3 border-b border-border-color pb-4">
                <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger shadow-sm">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-text-primary">Money Spent</h3>
                  <p className="text-[10px] text-text-secondary">Record all business outflows for today</p>
                </div>
              </div>

              {/* Itemized Expenses Dynamic List */}
              <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {expensesList.map((row) => (
                    <motion.div
                      key={row.id}
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="flex items-center space-x-2 border border-border-color/60 rounded-xl bg-slate-50/40 p-2.5"
                    >
                      <input
                        type="text"
                        placeholder="e.g. Electricity, Stock, Water"
                        value={row.title}
                        onChange={(e) => handleExpenseChange(row.id, "title", e.target.value)}
                        className="flex-grow px-3 py-2 text-xs font-semibold border border-border-color rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary text-text-primary min-w-0"
                      />
                      <div className="relative w-28 flex-shrink-0">
                        <input
                          type="number"
                          min="0"
                          placeholder={user?.currencySymbol || "₹"}
                          value={row.amount}
                          onChange={(e) => handleExpenseChange(row.id, "amount", e.target.value)}
                          className="w-full pl-6 pr-2 py-2 text-xs font-bold border border-border-color rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary text-text-primary"
                        />
                        <span className="text-xs font-bold text-text-secondary absolute left-2 top-2">{user?.currencySymbol || "₹"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExpenseRow(row.id)}
                        className="p-2 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/5 transition-all flex-shrink-0"
                        title="Remove expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleAddExpenseRow}
                  className="w-full flex items-center justify-center space-x-1.5 py-2.5 border border-dashed border-border-color rounded-xl text-text-secondary hover:text-primary hover:border-primary/50 text-xs font-bold transition-all hover-lift"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Expense</span>
                </button>

                <div className="p-4 border border-red-100 rounded-xl bg-red-50/50 flex items-center justify-between text-xs font-semibold">
                  <span className="text-red-700">Total Expenses:</span>
                  <span className="font-extrabold text-danger text-base">{formatCurrency(totalExpenses)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Profit Summary & Memo notes */}
          <div className="glass-card rounded-3xl p-6 border border-border-color bg-white grid grid-cols-1 md:grid-cols-2 gap-6 items-center shadow-sm">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center space-x-1.5">
                <Notebook className="w-3.5 h-3.5 text-primary" />
                <span>Remarks / Memo Notes</span>
              </label>
              <input
                type="text"
                placeholder="Add brief details about today's trade..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 text-xs font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary"
              />
            </div>

            <div className="p-5 border border-border-color rounded-2xl bg-slate-50/50 flex flex-col justify-center space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-text-secondary">Calculated Profit / Loss:</span>
                <span className={`font-extrabold text-lg sm:text-xl ${netPL >= 0 ? "text-success" : "text-danger"}`}>
                  {netPL >= 0 ? "+" : ""}{formatCurrency(netPL)}
                </span>
              </div>
              <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider flex items-center space-x-1">
                <CheckCircle className={`w-3.5 h-3.5 ${netPL >= 0 ? "text-success" : "text-danger"}`} />
                <span>{netPL >= 0 ? "Daily balance in green (Surplus)" : "Daily balance in red (Deficit)"}</span>
              </div>
            </div>
          </div>

          {/* Action Commit Bar */}
          <div className="flex items-center justify-end space-x-3">
            {isSaved && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-bold text-success animate-pulse"
              >
                ✓ Ledger Entry Saved Safely!
              </motion.span>
            )}
            <button
              type="submit"
              className="flex items-center space-x-2 px-8 py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-2xl hover:shadow-lg hover:shadow-primary/30 transition-all hover-lift active:scale-98 text-xs sm:text-sm cursor-pointer"
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
