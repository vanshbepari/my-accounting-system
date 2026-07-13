"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  PlusCircle,
  FileBarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { useAccounting } from "@/context/AccountingContext";

interface SidebarProps {
  isMobile?: boolean;
}

export default function Sidebar({ isMobile = false }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAccounting();

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Add Entry", icon: PlusCircle, path: "/dashboard/expenses" },
    { name: "Reports", icon: FileBarChart2, path: "/dashboard/reports" },
    { name: "Settings", icon: Settings, path: "/dashboard/settings" },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <motion.aside
      animate={{ width: isMobile ? "100%" : isCollapsed ? "80px" : "260px" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={isMobile
        ? "flex flex-col h-full bg-white transition-colors"
        : "hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 glass border-r border-border-color bg-white/70 transition-colors shadow-sm"}
    >
      {/* Sidebar Header */}
      <div className="flex items-center h-20 px-5 border-b border-border-color/80 relative">
        <Link href="/dashboard" className={`flex items-center overflow-hidden ${isCollapsed && !isMobile ? "mx-auto" : ""}`}>
          {(!isCollapsed || isMobile) ? (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center"
            >
              <Image
                src="/logo_full.png"
                alt="My Accounting"
                width={220}
                height={66}
                className="object-contain h-16 w-auto"
                priority
              />
            </motion.div>
          ) : (
            <Image
              src="/logo_mark.png"
              alt="My Accounting"
              width={48}
              height={48}
              className="object-contain w-12 h-12 rounded-xl"
              priority
            />
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex items-center justify-center absolute -right-3 top-7 w-6 h-6 rounded-full border border-border-color bg-white text-text-secondary hover:text-text-primary hover:bg-slate-50 transition-all cursor-pointer shadow-sm z-50 hover:scale-110 active:scale-95"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`relative flex items-center h-12 rounded-xl transition-all ${
                isActive
                  ? "text-primary font-bold"
                  : "text-text-secondary hover:bg-slate-100/50 hover:text-text-primary"
              }`}
            >
              {/* Active Tab Indicator Slide Animation */}
              {isActive && (
                <motion.div
                  layoutId="activeTabSlide"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary rounded-r-md"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              {/* Icon Container */}
              <div className="flex items-center justify-center w-12 h-full flex-shrink-0">
                <Icon className={`w-5 h-5 ${isActive ? "text-primary stroke-[2.5px]" : "stroke-[2px]"}`} />
              </div>

              {/* Item Text */}
              {(!isCollapsed || isMobile) && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs font-semibold tracking-wide text-left flex-grow"
                >
                  {item.name}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer / User Profile & Logout */}
      <div className="p-3 border-t border-border-color/85 space-y-2">
        {(!isCollapsed || isMobile) && user && (
          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 shadow-sm text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8.5 h-8.5 rounded-full border border-primary/20 object-cover flex-shrink-0"
              onError={(e) => {
                const name = user?.name || "User";
                e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=2563eb`;
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <p className="text-xs font-bold text-text-primary truncate">
                  {user.name}
                </p>
                <UserCheck className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              </div>
              <p className="text-[10px] text-text-secondary font-semibold truncate mt-0.5">
                {user.businessName}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center w-full h-11 rounded-xl text-danger hover:bg-rose-50 hover:text-danger/90 transition-all font-semibold cursor-pointer"
        >
          <div className="flex items-center justify-center w-12 h-full flex-shrink-0">
            <LogOut className="w-4 h-4 text-danger" />
          </div>
          {(!isCollapsed || isMobile) && <span className="text-xs font-bold">Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
}
