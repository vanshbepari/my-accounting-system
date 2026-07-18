"use client";

import React, { useRef } from "react";
import { Calendar, Sparkles, Clock, Check } from "lucide-react";

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export default function CustomDatePicker({
  value,
  onChange,
  label = "Select Ledger Date",
  className = ""
}: CustomDatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick preset helpers
  const getTodayStr = () => new Date().toISOString().split("T")[0];
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  };
  const getFirstOfMonthStr = () => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  };

  // Format date display (e.g. "18 Jul 2026")
  const getFormattedDisplay = (dateStr: string) => {
    if (!dateStr) return "Select Date";
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  const isToday = value === getTodayStr();
  const isYesterday = value === getYesterdayStr();
  const isFirstOfMonth = value === getFirstOfMonthStr();

  return (
    <div className={`space-y-2.5 text-left w-full min-w-0 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
            <span>{label}</span>
          </label>
          <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
            Ledger Date
          </span>
        </div>
      )}

      <div className="glass-card rounded-2xl p-4 border border-slate-200/90 bg-white/95 shadow-sm space-y-3 relative overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-md">
        {/* Date Input Wrapper */}
        <div
          onClick={() => inputRef.current?.showPicker?.() || inputRef.current?.focus()}
          className="relative flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-primary/50 transition-all cursor-pointer group select-none min-w-0"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center shadow-md shadow-primary/20 shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Selected Date
              </span>
              <span className="text-sm font-black text-slate-800 block truncate">
                {getFormattedDisplay(value)}
              </span>
            </div>
          </div>

          <span className="text-xs font-extrabold text-primary group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
            Change ➔
          </span>

          {/* Hidden HTML5 Native Date Picker */}
          <input
            ref={inputRef}
            type="date"
            required
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </div>

        {/* Quick Presets Bar */}
        <div className="flex items-center space-x-2 pt-0.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Presets:</span>
          </span>

          <button
            type="button"
            onClick={() => onChange(getTodayStr())}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 border ${
              isToday
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-slate-100 text-slate-650 hover:bg-slate-200 border-slate-200"
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => onChange(getYesterdayStr())}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 border ${
              isYesterday
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-slate-100 text-slate-650 hover:bg-slate-200 border-slate-200"
            }`}
          >
            Yesterday
          </button>

          <button
            type="button"
            onClick={() => onChange(getFirstOfMonthStr())}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 border ${
              isFirstOfMonth
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-slate-100 text-slate-650 hover:bg-slate-200 border-slate-200"
            }`}
          >
            1st of Month
          </button>
        </div>
      </div>
    </div>
  );
}
