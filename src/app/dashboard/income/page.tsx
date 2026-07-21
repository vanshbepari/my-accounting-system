"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Plus,
  Coins,
  CreditCard,
  Calendar,
  Tag,
  FileText,
  DollarSign,
  ArrowUpRight
} from "lucide-react";
import { useAccounting } from "@/context/AccountingContext";
import CustomDatePicker from "@/components/CustomDatePicker";

export default function IncomePage() {
  const { transactions, saveDailyRecord, user, formatCurrency } = useAccounting();

  // Income form states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [incomeType, setIncomeType] = useState<"online" | "cash">("online");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("Business Revenue");
  const [notes, setNotes] = useState("");

  // Aggregate metrics
  const totalRevenue = transactions.reduce((acc, t) => acc + t.onlineAmount + t.cashAmount, 0);
  const totalOnline = transactions.reduce((acc, t) => acc + t.onlineAmount, 0);
  const totalCash = transactions.reduce((acc, t) => acc + t.cashAmount, 0);

  // Real month-over-month revenue growth
  const currentMonth = new Date().toISOString().substring(0, 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = lastMonthDate.toISOString().substring(0, 7);

  const thisMonthRev = transactions
    .filter(t => t.date.startsWith(currentMonth))
    .reduce((acc, t) => acc + t.onlineAmount + t.cashAmount, 0);
  const lastMonthRev = transactions
    .filter(t => t.date.startsWith(lastMonth))
    .reduce((acc, t) => acc + t.onlineAmount + t.cashAmount, 0);

  const momGrowth = lastMonthRev > 0
    ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100
    : thisMonthRev > 0 ? 100 : 0;

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0 || !title) return;

    saveDailyRecord({
      date,
      title,
      category,
      onlineAmount: incomeType === "online" ? parsedAmt : 0,
      cashAmount: incomeType === "cash" ? parsedAmt : 0,
      expensesAmount: 0,
      expenses: [], // Satisfies extended Transaction type definition
      notes: notes || `Recorded manually under category ${category}. Method: ${incomeType}`
    });

    // Reset Form
    setTitle("");
    setAmount("");
    setNotes("");
  };

  const incomeCategories = [
    "Business Revenue",
    "Consulting Fees",
    "Retail Store Sales",
    "Investments",
    "Other Income"
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-color pb-6">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight">
            Revenue Bookkeeper
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Aggregate daily income deposits and allocate them cleanly to online bank assets or cash registers.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="glass-card rounded-2xl p-5 border border-border-color bg-white flex flex-col justify-between hover-lift">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block">
            Aggregated Revenue
          </span>
          <h3 className="text-2xl font-black text-primary tracking-tight leading-none mt-2">
            {formatCurrency(totalRevenue)}
          </h3>
          <span className="inline-flex items-center space-x-1.5 text-xs font-bold mt-4">
            <ArrowUpRight className={`w-3.5 h-3.5 ${momGrowth >= 0 ? "text-success" : "text-danger"}`} />
            <span className={momGrowth >= 0 ? "text-success" : "text-danger"}>
              {momGrowth >= 0 ? "+" : ""}{momGrowth.toFixed(1)}% vs last month
            </span>
          </span>
        </div>

        {/* Online Splits */}
        <div className="glass-card rounded-2xl p-5 border border-border-color bg-white flex flex-col justify-between hover-lift">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block">
              Online Payments
            </span>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-black text-text-primary tracking-tight leading-none mt-2">
            {formatCurrency(totalOnline)}
          </h3>
          <span className="text-[10px] text-text-secondary block mt-4">
            {totalRevenue > 0 ? ((totalOnline / totalRevenue) * 100).toFixed(0) : 0}% of net shares
          </span>
        </div>

        {/* Cash Splits */}
        <div className="glass-card rounded-2xl p-5 border border-border-color bg-white flex flex-col justify-between hover-lift">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block">
              Cash Deposits
            </span>
            <Coins className="w-4 h-4 text-warning" />
          </div>
          <h3 className="text-2xl font-black text-text-primary tracking-tight leading-none mt-2">
            {formatCurrency(totalCash)}
          </h3>
          <span className="text-[10px] text-text-secondary block mt-4">
            {totalRevenue > 0 ? ((totalCash / totalRevenue) * 100).toFixed(0) : 0}% of net shares
          </span>
        </div>
      </div>

      {/* Logger Form Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Logging card (8 cols) */}
        <div className="lg:col-span-8">
          <div className="glass-card rounded-3xl p-6 md:p-8 bg-white border border-border-color shadow-md">
            <form onSubmit={handleIncomeSubmit} className="space-y-6">
              <div className="flex items-center space-x-3 border-b border-border-color pb-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success shadow-sm">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-display font-bold text-base text-text-primary">Record Income</h3>
                  <p className="text-[10px] text-text-secondary">Log client payments and revenue splits</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">
                    Income Source / Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe subscription, Store sales Cash"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">
                    Amount Received ({user?.currencySymbol || "₹"})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="e.g. 8000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 text-xs font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary"
                    />
                    <span className="text-xs font-bold text-text-secondary absolute left-3 top-3.5">{user?.currencySymbol || "₹"}</span>
                  </div>
                </div>

                {/* Method selector */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">
                    Deposit Method
                  </label>
                  <div className="flex p-1 rounded-xl bg-slate-100 border border-border-color">
                    <button
                      type="button"
                      onClick={() => setIncomeType("online")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                        incomeType === "online"
                          ? "bg-white text-primary shadow-sm"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                      <span>Online Asset</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncomeType("cash")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                        incomeType === "cash"
                          ? "bg-white text-primary shadow-sm"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5 text-warning" />
                      <span>Cash Register</span>
                    </button>
                  </div>
                </div>

                {/* Date */}
                <div className="sm:col-span-2">
                  <CustomDatePicker
                    value={date}
                    onChange={(newDate) => setDate(newDate)}
                    label="Deposit Date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category selector */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">
                    Income Classification
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="appearance-none w-full pl-9 pr-10 py-2.5 text-xs font-semibold rounded-xl border border-border-color bg-slate-50 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                    >
                      {incomeCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <Tag className="w-4 h-4 text-text-secondary absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* Notes Memo */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">
                    Remarks / Notes (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Add memo logs..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary"
                    />
                    <FileText className="w-4 h-4 text-text-secondary absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold shadow-md shadow-primary/25 hover:brightness-105 transition-all hover-lift active:scale-98 text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Log Income Deposit</span>
              </button>
            </form>
          </div>
        </div>

        {/* Corporate asset disclaimer card (4 cols) */}
        <div className="lg:col-span-4 glass-card rounded-3xl p-5 border border-border-color bg-white text-left space-y-4">
          <h4 className="text-xs font-bold text-text-primary flex items-center space-x-1.5 border-b border-border-color pb-3">
            <DollarSign className="w-4 h-4 text-primary" />
            <span>Revenue Allocator Tips</span>
          </h4>
          <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
            <p>
              Log client retainers, over-the-counter shop transactions, and Gumroad shop sales.
            </p>
            <p>
              Specify whether payments went directly to UPI/Stripe assets (Online) or registers (Cash) to balance cash drawers dynamically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
