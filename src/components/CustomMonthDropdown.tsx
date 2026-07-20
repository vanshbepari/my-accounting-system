"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ChevronDown, Check, Sparkles } from "lucide-react";

export interface MonthOption {
  value: string; // YYYY-MM or "All"
  label: string; // e.g. "July 2026"
  sublabel?: string; // e.g. "Current Month", "3 Months Ago", "Next Month"
  badge?: "current" | "future" | "past" | "all";
}

interface CustomMonthDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: MonthOption[];
  variant?: "glass" | "light" | "dark";
  className?: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right" | "center";
}

export default function CustomMonthDropdown({
  value,
  onChange,
  options,
  variant = "glass",
  className = "",
  size = "md",
  align = "left"
}: CustomMonthDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0] || {
    value: value || "All",
    label: value === "All" ? "All Time (Cumulative)" : value
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  // Variant styles
  const buttonVariantClass =
    variant === "dark"
      ? "bg-slate-900/90 text-white border-white/10 hover:bg-slate-800/90 hover:border-primary/40 shadow-lg"
      : variant === "light"
      ? "bg-white text-slate-800 border-slate-200/90 hover:border-primary/40 hover:bg-slate-50/80 shadow-sm"
      : "bg-white/80 backdrop-blur-md text-slate-800 border-slate-200 hover:border-primary/40 hover:bg-white shadow-sm";

  const menuVariantClass =
    variant === "dark"
      ? "bg-slate-900/95 border-slate-700/80 text-white shadow-2xl backdrop-blur-xl"
      : "bg-white/95 border-slate-200/90 text-slate-800 shadow-2xl backdrop-blur-xl";

  const sizeClass =
    size === "sm"
      ? "px-3 py-1.5 text-xs rounded-xl"
      : size === "lg"
      ? "px-4 py-3 text-sm rounded-2xl"
      : "px-3.5 py-2 text-xs sm:text-sm rounded-xl";

  const alignClass =
    align === "right"
      ? "left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "left-1/2 -translate-x-1/2 sm:left-0 sm:right-auto sm:translate-x-0";

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center space-x-2.5 font-bold transition-all duration-200 cursor-pointer select-none border active:scale-[0.98] ${buttonVariantClass} ${sizeClass}`}
      >
        <div className="w-5 h-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <CalendarDays className="w-3.5 h-3.5" />
        </div>

        <span className="truncate max-w-[170px] sm:max-w-[200px]">
          {selectedOption.label}
        </span>

        {selectedOption.sublabel && (
          <span className="hidden sm:inline-block text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
            {selectedOption.sublabel}
          </span>
        )}

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400 shrink-0 ml-1"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`absolute ${alignClass} z-[9999] mt-1.5 w-[calc(100vw-2rem)] sm:w-[280px] max-w-[320px] sm:max-w-none max-h-[240px] sm:max-h-[320px] overflow-y-auto overscroll-contain rounded-2xl border p-1.5 space-y-1 shadow-2xl ${menuVariantClass}`}
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Select Ledger Period</span>
              <Sparkles className="w-3 h-3 text-primary" />
            </div>

            <div className="py-1 space-y-0.5">
              {options.map((opt) => {
                const isSelected = opt.value === value;

                let badgeClass = "bg-slate-100 text-slate-600 border-slate-200";
                if (opt.badge === "current") {
                  badgeClass = "bg-purple-100 text-purple-700 border-purple-200";
                } else if (opt.badge === "future") {
                  badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
                } else if (opt.badge === "past") {
                  badgeClass = "bg-blue-100 text-blue-700 border-blue-200";
                } else if (opt.badge === "all") {
                  badgeClass = "bg-indigo-100 text-indigo-700 border-indigo-200";
                }

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left select-none ${
                      isSelected
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isSelected ? "bg-primary" : "bg-slate-300"
                        }`}
                      />
                      <div className="truncate">
                        <span className="block truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="block text-[10px] font-normal text-slate-400 truncate">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 ml-2">
                      {opt.badge && (
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${badgeClass}`}
                        >
                          {opt.badge}
                        </span>
                      )}

                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
