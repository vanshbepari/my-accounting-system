"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAccounting } from "@/context/AccountingContext";

interface NavbarProps {
  onLoginClick?: () => void;
}

export default function Navbar({ onLoginClick }: NavbarProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAccounting();

  // Scroll detection to update header density and blur
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Overview", path: "/" },
    { name: "Features", path: "/features" },
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "py-3 glass shadow-lg shadow-black/2 bg-white/70 border-b border-border-color"
          : "py-5 bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group py-0.5">
            <Image
              src="/logo_full.png"
              alt="My Accounting"
              width={300}
              height={90}
              className="object-contain h-16 sm:h-20 md:h-24 w-auto group-hover:opacity-95 transition-opacity duration-200"
              priority
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1.5 relative">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors rounded-xl z-10 ${
                    isActive ? "text-primary" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span className="relative z-10">{link.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-primary/5 rounded-xl border border-primary/10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            {user?.isLoggedIn ? (
              <Link
                href="/dashboard"
                className="group relative inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white overflow-hidden transition-all duration-200 bg-gradient-to-r from-primary to-secondary shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                Go to Dashboard
              </Link>
            ) : (
              <button
                onClick={onLoginClick}
                className="group flex items-center space-x-2.5 px-4 py-2.5 rounded-xl border border-border-color bg-slate-50 hover:bg-slate-100 hover:border-primary/30 transition-all duration-200 text-xs font-bold uppercase tracking-wider text-text-primary cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.85-6.277-6.36 0-3.51 2.811-6.36 6.277-6.36 1.497 0 2.87.525 3.957 1.4l3.11-3.15C19.123 2.115 15.932 1 12.24 1 6.032 1 1 6.07 1 12.36s5.032 11.36 11.24 11.36c6.438 0 10.748-4.57 10.748-11.08 0-.69-.06-1.36-.178-2.355H12.24z"/></svg>
                <span>Sign In with Google</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-b border-border-color bg-white/95 overflow-hidden"
          >
            <div className="px-4 pt-3 pb-6 space-y-2 text-left">
              {navLinks.map((link) => {
                const isActive = pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    href={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-text-secondary hover:bg-slate-50"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-border-color space-y-3">
                {user?.isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block text-center w-full px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-primary to-secondary shadow-md"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <button
                    onClick={() => { setIsOpen(false); onLoginClick?.(); }}
                    className="flex items-center justify-center space-x-3 w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs font-bold uppercase tracking-wider text-text-primary cursor-pointer"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.85-6.277-6.36 0-3.51 2.811-6.36 6.277-6.36 1.497 0 2.87.525 3.957 1.4l3.11-3.15C19.123 2.115 15.932 1 12.24 1 6.032 1 1 6.07 1 12.36s5.032 11.36 11.24 11.36c6.438 0 10.748-4.57 10.748-11.08 0-.69-.06-1.36-.178-2.355H12.24z"/></svg>
                    <span>Sign In with Google</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
