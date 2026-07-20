"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, FileBarChart2, Plus, Settings, Wrench, X, LineChart, Target, Wallet } from "lucide-react";

interface MobileBottomNavbarProps {
  onQuickAddTrigger?: () => void;
}

export default function MobileBottomNavbar({ onQuickAddTrigger }: MobileBottomNavbarProps) {
  const pathname = usePathname();
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Reports", icon: FileBarChart2, path: "/dashboard/reports" },
    { name: "Add Entry", icon: Plus, path: "action_trigger" }, // Special floating action button
    { name: "Tools", icon: Wrench, path: "tools_trigger" }, // Tools popup menu
    { name: "Settings", icon: Settings, path: "/dashboard/settings" }
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] transition-all py-1.5 px-2 pb-[env(safe-area-inset-bottom,0px)] pointer-events-auto">
        <div className="grid grid-cols-5 h-14 w-full relative items-center justify-items-center">
          {navItems.map((item, idx) => {
            if (item.path === "action_trigger") {
              return (
                <div key="quick-add-btn" className="relative flex flex-col items-center justify-center w-full h-full">
                  <button
                    onClick={onQuickAddTrigger}
                    className="absolute -top-6 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary text-white shadow-lg shadow-primary/30 border-[3.5px] border-white focus:outline-none hover:scale-105 active:scale-95 transition-all z-30 cursor-pointer pointer-events-auto"
                    aria-label="Add Transaction Entry"
                  >
                    <Plus className="w-5.5 h-5.5 stroke-[2.5]" />
                  </button>
                  {/* Visual empty space underneath the elevated centerpiece button to balance vertical visual height */}
                  <span className="text-[9px] font-semibold tracking-tight text-text-secondary mt-7">
                    Add Entry
                  </span>
                </div>
              );
            }

            if (item.path === "tools_trigger") {
              const isActive = isToolsOpen || pathname === "/dashboard/forecast" || pathname === "/dashboard/target";
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  className={`flex flex-col items-center justify-center w-full h-full relative transition-colors cursor-pointer focus:outline-none ${
                    isActive ? "text-primary" : "text-text-secondary"
                  }`}
                >
                  {/* Active Circle Blob highlight */}
                  {isActive && (
                    <motion.div
                      layoutId="mobileActiveTab"
                      className="absolute inset-0 bg-primary/5 rounded-2xl -z-10 mx-1 my-0.5"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${isActive ? "scale-105" : ""}`} />
                  <span className="text-[9px] font-semibold tracking-tight">{item.name}</span>
                </button>
              );
            }

            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex flex-col items-center justify-center w-full h-full relative transition-colors ${
                  isActive ? "text-primary" : "text-text-secondary"
                }`}
              >
                {/* Active Circle Blob highlight */}
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute inset-0 bg-primary/5 rounded-2xl -z-10 mx-1 my-0.5"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${isActive ? "scale-105" : ""}`} />
                <span className="text-[9px] font-semibold tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tools Popup Drawer for Mobile View */}
      <AnimatePresence>
        {isToolsOpen && (
          <>
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsToolsOpen(false)}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm md:hidden"
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-border-color rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.12)] px-6 pt-5 pb-8 flex flex-col space-y-4 max-h-[85vh] overflow-y-auto text-left md:hidden"
            >
              {/* Drag Handle Indicator */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 cursor-pointer" onClick={() => setIsToolsOpen(false)} />

              <div className="flex items-center justify-between border-b border-border-color pb-3">
                <div>
                  <h3 className="font-display font-black text-lg text-text-primary">Financial Tools</h3>
                  <p className="text-[11px] text-text-secondary font-semibold">Select analysis tool for your business</p>
                </div>
                <button
                  onClick={() => setIsToolsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-text-secondary hover:text-text-primary transition-all cursor-pointer focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tool list */}
              <div className="grid grid-cols-1 gap-3.5">
                {/* Forecast Tool Link */}
                <Link
                  href="/dashboard/forecast"
                  onClick={() => setIsToolsOpen(false)}
                  className="flex items-start space-x-4 p-4 rounded-2xl border border-border-color bg-slate-50/50 hover:bg-slate-50 transition-all hover:scale-[1.01] active:scale-[0.99] hover:border-primary/20 shadow-sm cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                    <LineChart className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-text-primary">Forecast</span>
                      <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Predictive</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1 font-semibold leading-relaxed">
                      Projects future cash flow trends based on historical income and expense data to assist in financial planning.
                    </p>
                  </div>
                </Link>

                {/* Target Tool Link */}
                <Link
                  href="/dashboard/target"
                  onClick={() => setIsToolsOpen(false)}
                  className="flex items-start space-x-4 p-4 rounded-2xl border border-border-color bg-slate-50/50 hover:bg-slate-50 transition-all hover:scale-[1.01] active:scale-[0.99] hover:border-primary/20 shadow-sm cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary flex-shrink-0 mt-0.5">
                    <Target className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-text-primary">Target</span>
                      <span className="text-[9px] bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Milestones</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1 font-semibold leading-relaxed">
                      Enables users to set, track, and visually monitor their financial milestones and net profit goals.
                    </p>
                  </div>
                </Link>

                {/* Budget Tool Link */}
                <Link
                  href="/dashboard/budget"
                  onClick={() => setIsToolsOpen(false)}
                  className="flex items-start space-x-4 p-4 rounded-2xl border border-border-color bg-slate-50/50 hover:bg-slate-50 transition-all hover:scale-[1.01] active:scale-[0.99] hover:border-primary/20 shadow-sm cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0 mt-0.5">
                    <Wallet className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-text-primary">Budget</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Overheads</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1 font-semibold leading-relaxed">
                      Establish category spending limit thresholds, alerts, and recurring monthly rollovers.
                    </p>
                  </div>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

