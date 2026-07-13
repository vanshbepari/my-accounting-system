"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { useAccounting } from "@/context/AccountingContext";

export default function TransactionsPage() {
  const { dailySummaries, transactions, formatCurrency, selectedMonth } = useAccounting();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDates, setExpandedDates] = useState<{ [date: string]: boolean }>({});

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
    } catch {
      return dateStr;
    }
  };

  // Filter summaries by selected month first, then by search query
  const filteredSummaries = dailySummaries.filter(summary => {
    // Apply month filter
    if (selectedMonth && selectedMonth !== "All" && !summary.date.startsWith(selectedMonth)) {
      return false;
    }

    // If no search query, return everything within the month
    if (!searchQuery) return true;

    // Search query matches date or matches any inner transaction recorded on that date
    const formattedDate = formatDateFriendly(summary.date).toLowerCase();
    const query = searchQuery.toLowerCase();

    if (formattedDate.includes(query) || summary.date.includes(query)) return true;

    // Check inner transactions
    const dayTxs = transactions.filter(t => t.date === summary.date);
    return dayTxs.some(t => t.title.toLowerCase().includes(query) || t.category.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-color pb-6">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight">
            Daily Ledger Sheets
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Rounded daily transaction ledger showing cash and online splits. Tap row to view detail breakdown.
          </p>
        </div>
      </div>

      {/* Control bar: Search Input */}
      <div className="w-full flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search dates, descriptions, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-border-color bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary shadow-sm"
          />
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-3.5" />
        </div>
      </div>

      {/* Ledger list container */}
      <div className="space-y-4">
        {filteredSummaries.length === 0 ? (
          <div className="p-16 text-center border-2 border-dashed border-border-color rounded-2xl">
            <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
            <p className="text-sm font-semibold text-text-primary">No ledger entries detected</p>
            <p className="text-xs text-text-secondary mt-1">
              Try adjusting your query or add transactions in Smart Expenses.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View: Hidden on mobile screens */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-border-color shadow-sm bg-white/70">
              <table className="min-w-full divide-y divide-border-color text-left border-collapse">
                <thead className="bg-slate-50/50 text-[10px] uppercase font-bold tracking-widest text-text-secondary sticky top-0 backdrop-blur-md">
                  <tr>
                    <th scope="col" className="px-6 py-4">Date</th>
                    <th scope="col" className="px-6 py-4">🟢 Online</th>
                    <th scope="col" className="px-6 py-4">🟠 Cash</th>
                    <th scope="col" className="px-6 py-4">🔵 Revenue</th>
                    <th scope="col" className="px-6 py-4">🔴 Expenses</th>
                    <th scope="col" className="px-6 py-4">Net P/L</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color text-xs font-semibold">
                  {filteredSummaries.map((summary) => {
                    const isExpanded = !!expandedDates[summary.date];
                    const dayTxs = transactions.filter(t => t.date === summary.date);

                    return (
                      <React.Fragment key={summary.date}>
                        {/* Summary primary row */}
                        <tr
                          onClick={() => toggleExpandDate(summary.date)}
                          className="hover:bg-slate-50/50 transition-all cursor-pointer hover-lift select-none"
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
                            <span className="text-[10px] bg-slate-100 text-text-secondary font-bold px-2 py-0.5 rounded">
                              {dayTxs.length} items
                            </span>
                          </td>
                        </tr>

                        {/* Collateral sub-transactions details drawer */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="p-0 bg-slate-50/30">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-12 py-4 space-y-2.5 border-t border-b border-border-color/30">
                                    <span className="text-[9px] uppercase font-bold tracking-widest text-text-secondary block mb-1">
                                      Detailed records for {formatDateFriendly(summary.date)}
                                    </span>
                                    {dayTxs.map((tx) => {
                                      const isRev = tx.onlineAmount > 0 || tx.cashAmount > 0;
                                      const amt = isRev ? tx.onlineAmount + tx.cashAmount : tx.expensesAmount;
                                      const method = tx.onlineAmount > 0 ? "Online Income" : tx.cashAmount > 0 ? "Cash Income" : "Expense";

                                      return (
                                        <div
                                          key={tx.id}
                                          className="p-3 border border-border-color/60 rounded-xl bg-white flex items-center justify-between hover:border-primary/20 transition-all text-xs"
                                        >
                                          <div className="flex items-center space-x-3 min-w-0">
                                            <span className={`w-2 h-2 rounded-full ${
                                              method.includes("Online") ? "bg-blue-500" :
                                              method.includes("Cash") ? "bg-amber-500" : "bg-danger"
                                            }`} />
                                            <div className="text-left">
                                              <p className="font-semibold text-text-primary">{tx.title}</p>
                                              <p className="text-[10px] text-text-secondary mt-0.5 uppercase tracking-wide font-bold">
                                                {tx.category} • {method}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-4">
                                            <span className={`font-bold ${isRev ? "text-success" : "text-danger"}`}>
                                              {isRev ? "+" : "-"}{formatCurrency(amt)}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
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

            {/* Mobile Cards View: Automatically converts rows to cards on small viewports */}
            <div className="block md:hidden space-y-4">
              {filteredSummaries.map((summary) => {
                const isExpanded = !!expandedDates[summary.date];
                const dayTxs = transactions.filter(t => t.date === summary.date);

                return (
                  <motion.div
                    key={summary.date}
                    layout
                    className="glass-card rounded-2xl border border-border-color bg-white p-4 space-y-3 relative overflow-hidden"
                  >
                    {/* Header bar date */}
                    <div
                      onClick={() => toggleExpandDate(summary.date)}
                      className="flex items-center justify-between border-b border-border-color pb-2.5 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 text-xs font-bold text-text-primary">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>Date: {formatDateFriendly(summary.date)}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
                    </div>

                    {/* Columns representation */}
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

                    {/* Net profit callout row */}
                    <div className="pt-2 border-t border-border-color flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-text-secondary font-medium">Net Profit:</span>
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
                          className="overflow-hidden pt-3 space-y-2 border-t border-border-color/30"
                        >
                          <span className="text-[9px] uppercase font-bold tracking-widest text-text-secondary block mb-1">
                            Individual Items
                          </span>
                          {dayTxs.map((tx) => {
                            const isRev = tx.onlineAmount > 0 || tx.cashAmount > 0;
                            const amt = isRev ? tx.onlineAmount + tx.cashAmount : tx.expensesAmount;
                            const method = tx.onlineAmount > 0 ? "Online" : tx.cashAmount > 0 ? "Cash" : "Expense";

                            return (
                              <div
                                key={tx.id}
                                className="p-3 border border-border-color/60 rounded-xl bg-slate-50/50 flex items-center justify-between text-xs"
                              >
                                <div className="text-left min-w-0">
                                  <p className="font-semibold text-text-primary truncate">{tx.title}</p>
                                  <p className="text-[9px] text-text-secondary font-bold mt-0.5">
                                    {tx.category} • {method}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span className={`font-bold ${isRev ? "text-success" : "text-danger"}`}>
                                    {isRev ? "+" : "-"}{formatCurrency(amt)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
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
  );
}
