"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Globe, Compass } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccounting } from "@/context/AccountingContext";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import MobileBottomNavbar from "@/components/MobileBottomNavbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthReady } = useAccounting();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const router = useRouter();

  // Handle protected route redirect
  React.useEffect(() => {
    if (isAuthReady) {
      if (!user?.isLoggedIn) {
        router.replace("/login");
      } else if (!user.onboarded) {
        router.replace("/onboarding");
      }
    }
  }, [isAuthReady, user, router]);

  // Show a blank dark screen while checking Supabase auth session
  // This prevents flashing the dashboard before we know if they're logged in
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Auth is ready but user is not logged in — show spinner while redirect fires
  // (prevents any flash of dashboard content during the navigation)
  if (!user?.isLoggedIn) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }


  // If user is logged in, show the complete double-bar workspace dashboard layout
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg transition-colors duration-300">
      {/* Sidebar - fixed on desktop, width managed inside Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      {/* Main workspace container */}
      <div className="flex-1 md:pl-[80px] transition-all duration-300 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <TopNavbar onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        {/* Scrollable Viewport Page Area */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full transition-all">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNavbar onQuickAddTrigger={() => {
        // Redirection to expenses smart entry or show modal.
        // We will make it redirect straight to `/dashboard/expenses` to type naturally!
        window.location.href = "/dashboard/expenses?focus=quick";
      }} />

      {/* Mobile Drawer (optional sidebar view for mobile) */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-border-color md:hidden"
            >
              {/* Render Sidebar in mobile drawer */}
              <div className="h-full flex flex-col" onClick={() => setMobileSidebarOpen(false)}>
                {/* Embedded Sidebar triggers */}
                <Sidebar isMobile={true} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
