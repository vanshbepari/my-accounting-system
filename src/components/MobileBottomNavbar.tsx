"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, FileBarChart2, Plus, Settings, Receipt } from "lucide-react";

interface MobileBottomNavbarProps {
  onQuickAddTrigger?: () => void;
}

export default function MobileBottomNavbar({ onQuickAddTrigger }: MobileBottomNavbarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Reports", icon: FileBarChart2, path: "/dashboard/reports" },
    { name: "Add Entry", icon: Plus, path: "action_trigger" }, // Special floating action button
    { name: "Ledger", icon: Receipt, path: "/dashboard/transactions" }, // Symmetrical Ledger/Transactions route
    { name: "Settings", icon: Settings, path: "/dashboard/settings" }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-border-color shadow-[0_-8px_30px_rgba(0,0,0,0.06)] transition-all py-1.5 px-2 pb-safe-bottom">
      <div className="grid grid-cols-5 h-14 w-full relative items-center justify-items-center">
        {navItems.map((item, idx) => {
          if (item.path === "action_trigger") {
            return (
              <div key="quick-add-btn" className="relative flex flex-col items-center justify-center w-full h-full">
                <button
                  onClick={onQuickAddTrigger}
                  className="absolute -top-6 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary text-white shadow-lg shadow-primary/30 border-[3.5px] border-white focus:outline-none hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer"
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
  );
}

