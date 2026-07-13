"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Sparkles
} from "lucide-react";
import { useAccounting } from "@/context/AccountingContext";

export default function NotificationsPage() {
  const {
    notifications,
    markNotificationAsRead,
    clearNotifications
  } = useAccounting();

  const handleMarkAllRead = () => {
    notifications.forEach(n => {
      if (!n.read) markNotificationAsRead(n.id);
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-color pb-6">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Review ledger sync histories, automated balance milestones, and security updates.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center space-x-3 self-start">
            <button
              onClick={handleMarkAllRead}
              className="flex items-center space-x-1 px-3 py-2 border border-border-color bg-white hover:bg-slate-50 text-text-primary text-xs font-semibold rounded-xl transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={clearNotifications}
              className="flex items-center space-x-1 px-3 py-2 border border-danger/25 bg-danger/5 hover:bg-danger/10 text-danger text-xs font-semibold rounded-xl transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications list grid */}
      <div className="max-w-3xl mx-auto space-y-4">
        {notifications.length === 0 ? (
          <div className="p-16 text-center border-2 border-dashed border-border-color rounded-3xl bg-white/20">
            <Bell className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h3 className="font-display font-bold text-sm text-text-primary">All caught up!</h3>
            <p className="text-xs text-text-secondary mt-1">
              You have no active alerts. Sync operations are running smoothly.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((n) => {
                const Icon =
                  n.type === "success" ? CheckCircle :
                  n.type === "warning" ? AlertTriangle :
                  n.type === "danger" ? AlertTriangle : Info;

                const colorClass =
                  n.type === "success" ? "bg-success/10 text-success border-success/10" :
                  n.type === "warning" ? "bg-warning/10 text-warning border-warning/10" :
                  n.type === "danger" ? "bg-danger/10 text-danger border-danger/10" :
                  "bg-primary/10 text-primary border-primary/10";

                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`glass-card p-4 rounded-2xl border border-border-color bg-white flex items-start justify-between gap-4 text-xs sm:text-sm hover-lift relative overflow-hidden ${
                      !n.read ? "border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3 text-left">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-text-primary">
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="bg-primary text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-text-secondary leading-relaxed text-xs">
                          {n.message}
                        </p>
                        <span className="flex items-center space-x-1 text-[10px] text-text-secondary font-semibold pt-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{n.timestamp}</span>
                        </span>
                      </div>
                    </div>

                    {!n.read && (
                      <button
                        onClick={() => markNotificationAsRead(n.id)}
                        className="p-1.5 rounded-lg border border-border-color bg-slate-50 text-text-secondary hover:text-primary transition-all text-xs font-semibold flex items-center space-x-1 hover-lift flex-shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Mark read</span>
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
