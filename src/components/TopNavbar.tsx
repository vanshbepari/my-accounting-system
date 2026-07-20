"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ChevronDown, Check, Trash2, Menu, Award, LogOut } from "lucide-react";
import { useAccounting } from "@/context/AccountingContext";
import CustomMonthDropdown from "@/components/CustomMonthDropdown";

interface TopNavbarProps {
  onMobileMenuToggle?: () => void;
}

export default function TopNavbar({ onMobileMenuToggle }: TopNavbarProps) {
  const pathname = usePathname();
  const {
    user,
    selectedMonth,
    setSelectedMonth,
    notifications,
    markNotificationAsRead,
    clearNotifications,
    logout,
    transactions
  } = useAccounting();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dynamically build month list from real transaction data + always show current + last 12 months
  const months = useMemo(() => {
    const monthSet = new Set<string>();

    // Add months from actual transaction data
    transactions.forEach(t => {
      if (t.date) monthSet.add(t.date.substring(0, 7));
    });

    // Always include current month and last 11 months as options
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthSet.add(key);
    }

    // Sort descending (most recent first)
    const sorted = Array.from(monthSet).sort((a, b) => b.localeCompare(a));

    const formatted = sorted.map(val => {
      const [year, month] = val.split("-").map(Number);
      const d = new Date(year, month - 1, 1);
      return {
        value: val,
        label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      };
    });

    return [{ value: "All", label: "All Time" }, ...formatted];
  }, [transactions]);

  const unreadNotifications = notifications.filter(n => !n.read);
  const unreadCount = unreadNotifications.length;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 border-b border-slate-200 bg-white shadow-xs`}
    >
      <div className="px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left side: Mobile Menu Button & Business Name */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMobileMenuToggle}
            className="p-2 rounded-xl border border-border-color bg-slate-50 text-text-secondary hover:text-text-primary md:hidden transition-colors cursor-pointer hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex flex-col max-w-[120px] sm:max-w-none text-left">
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary font-display truncate">
              Shop Workspace
            </span>
            <span className="font-display font-black text-sm sm:text-base text-text-primary leading-tight truncate flex items-center space-x-1.5">
              <span>{user?.businessName || "My Accounting"}</span>
              <Award className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            </span>
          </div>
        </div>

        {/* Right side: Month selector, notifications, profile */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Month Selector dropdown - hidden on mobile, shown on desktop ONLY on main dashboard */}
          {pathname === "/dashboard" && (
            <div className="hidden md:block">
              <CustomMonthDropdown
                value={selectedMonth}
                onChange={(val) => setSelectedMonth(val)}
                options={months}
                variant="glass"
                size="sm"
              />
            </div>
          )}

          {/* Notification bell popover */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
              }}
              className="relative p-2.5 rounded-xl border border-border-color bg-slate-50 hover:bg-slate-100 text-text-secondary hover:text-text-primary transition-all shadow-sm cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-danger text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="fixed inset-x-4 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96 bg-white rounded-2xl shadow-2xl z-[9999] overflow-hidden border border-slate-200/90 max-h-[80vh] flex flex-col"
                  >
                    <div className="p-4 border-b border-border-color flex items-center justify-between bg-slate-50/80 shrink-0">
                      <span className="font-display font-bold text-xs text-text-primary uppercase tracking-wider">
                        Notifications ({notifications.length})
                      </span>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearNotifications}
                          className="flex items-center space-x-1 text-xs text-danger font-semibold hover:underline cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear all</span>
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 sm:max-h-80 overflow-y-auto overscroll-contain divide-y divide-border-color" style={{ WebkitOverflowScrolling: "touch" }}>
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-text-secondary">
                          All caught up! No notifications.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-4 flex flex-col space-y-1 hover:bg-slate-50/40 transition-all text-left ${
                              !n.read ? "bg-primary/2" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-extrabold uppercase tracking-wide ${
                                n.type === "success" ? "text-success" :
                                n.type === "warning" ? "text-warning" :
                                n.type === "danger" ? "text-danger" : "text-primary"
                              }`}>
                                {n.title}
                              </span>
                              <span className="text-[10px] text-text-secondary">
                                {n.timestamp}
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                              {n.message}
                            </p>
                            {!n.read && (
                              <button
                                onClick={() => markNotificationAsRead(n.id)}
                                className="self-end flex items-center space-x-0.5 text-[10px] font-bold text-primary hover:underline pt-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Mark read</span>
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User profile menu */}
          {user && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center space-x-2 p-1 rounded-full border border-border-color hover:bg-slate-50 transition-colors shadow-sm bg-white cursor-pointer hover:border-primary/30"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8.5 h-8.5 rounded-full border border-primary/10 object-cover"
                  onError={(e) => {
                    const name = user?.name || "User";
                    e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=2563eb`;
                  }}
                />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl z-50 p-4 border border-border-color/80"
                    >
                      <div className="flex flex-col items-center text-center pb-3 border-b border-border-color mb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-14 h-14 rounded-full border-2 border-primary/20 object-cover mb-2"
                          onError={(e) => {
                            const name = user?.name || "User";
                            e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=2563eb`;
                          }}
                        />
                        <span className="text-xs font-bold text-text-primary">
                          {user.name}
                        </span>
                        <span className="text-[10px] text-text-secondary truncate max-w-full font-semibold">
                          {user.email}
                        </span>
                      </div>
                      <div className="text-xs text-text-secondary text-center space-y-1">
                        <p className="font-extrabold text-text-primary">
                          {user.businessName}
                        </p>
                        <p className="font-semibold text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md inline-block uppercase tracking-wider">
                          Premium Sandbox
                        </p>
                      </div>
                      
                      <button
                        onClick={async () => {
                          setProfileOpen(false);
                          await logout();
                        }}
                        className="w-full mt-3 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border border-red-200/60 bg-rose-50 hover:bg-rose-100 text-danger text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-danger" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
