"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Sparkles, CalendarDays, ChevronRight } from "lucide-react";

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
  const executedRef = useRef(false);

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

  // Format date display (e.g. "Sat, 19 Jul 2026")
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
    } catch {
      return dateStr;
    }
  };

  const handlePresetSelect = (val: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (executedRef.current) return;
    executedRef.current = true;
    setTimeout(() => {
      executedRef.current = false;
    }, 250);

    onChange(val);
  };

  const isToday = value === getTodayStr();
  const isYesterday = value === getYesterdayStr();
  const isFirstOfMonth = value === getFirstOfMonthStr();

  const presets = [
    { label: "Today", value: getTodayStr(), active: isToday },
    { label: "Yesterday", value: getYesterdayStr(), active: isYesterday },
    { label: "1st of Month", value: getFirstOfMonthStr(), active: isFirstOfMonth }
  ];

  return (
    <div className={`space-y-3 text-left w-full min-w-0 ${className}`}>
      {label && (
        <div className="flex items-center justify-between px-0.5 min-w-0">
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-1.5 min-w-0">
            <CalendarDays className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{label}</span>
          </label>
          <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-primary/10 to-indigo-500/10 text-primary px-2 py-0.5 rounded-full border border-primary/20 shadow-xs flex items-center space-x-1 shrink-0 ml-1">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Active Period</span>
          </span>
        </div>
      )}

      {/* Premium Defined Container with Soft Depth & Gradient Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="glass-card rounded-3xl p-3.5 sm:p-5 border-2 border-indigo-200/80 bg-gradient-to-br from-white via-slate-50/60 to-indigo-50/30 shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden group/container space-y-3 sm:space-y-4"
      >
        {/* Subtle Ambient Backdrop Light Orb */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none group-hover/container:bg-primary/15 transition-all duration-500" />
        <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-secondary/10 rounded-full blur-2xl pointer-events-none group-hover/container:bg-secondary/15 transition-all duration-500" />

        {/* Date Input Wrapper with Interactive Trigger */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => inputRef.current?.showPicker?.() || inputRef.current?.focus()}
          className="relative flex items-center justify-between p-3 sm:p-4 rounded-2xl border-2 border-slate-200/90 bg-white/90 hover:bg-white hover:border-primary/60 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md group/button select-none min-w-0 gap-2"
        >
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-secondary text-white flex items-center justify-center shadow-lg shadow-primary/25 border border-white/20 shrink-0 group-hover/button:scale-105 transition-transform duration-200">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <div className="min-w-0 text-left flex-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 block tracking-widest leading-none mb-1">
                Selected Ledger Date
              </span>
              <span className="text-xs xs:text-sm sm:text-base font-black text-slate-900 block tracking-tight leading-snug">
                {getFormattedDisplay(value)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1 text-[11px] sm:text-xs font-black text-primary group-hover/button:translate-x-0.5 transition-transform duration-200 shrink-0 ml-1 sm:ml-3 bg-primary/5 hover:bg-primary/10 px-2.5 sm:px-3 py-1.5 rounded-xl border border-primary/20">
            <span>Change</span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </div>

          {/* Hidden HTML5 Native Date Picker */}
          <input
            ref={inputRef}
            type="date"
            required
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
          />
        </motion.div>

        {/* Quick Presets Bar with Elevated z-20 Touch Layer */}
        <div className="flex items-center space-x-2 pt-1 overflow-x-auto no-scrollbar relative z-20">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 flex items-center space-x-1 mr-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Presets:</span>
          </span>

          {presets.map((preset) => (
            <motion.button
              key={preset.label}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onTouchEnd={(e) => handlePresetSelect(preset.value, e)}
              onClick={(e) => handlePresetSelect(preset.value, e)}
              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer shrink-0 border select-none ${
                preset.active
                  ? "bg-gradient-to-r from-primary to-indigo-600 text-white border-primary shadow-md shadow-primary/20"
                  : "bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 border-slate-200/80"
              }`}
            >
              <span>{preset.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
