"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="border-t border-border-color bg-slate-50/50 py-12 transition-all duration-300 relative overflow-hidden">
      {/* Ambient glow accent */}
      <div className="absolute top-0 right-1/3 w-[40vw] h-[40vw] bg-primary/3 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Brand Info */}
          <div className="space-y-3 text-left">
            <Link href="/" className="flex items-center group">
              <Image
                src="/logo_full.png"
                alt="My Accounting"
                width={200}
                height={60}
                className="object-contain h-12 w-auto group-hover:opacity-95 transition-opacity duration-200"
              />
            </Link>
            <p className="text-xs text-text-secondary max-w-xs leading-relaxed font-semibold">
              Beautifully automated accounting ledger and analytics for high-growth small businesses and shop owners.
            </p>

            {/* Social Media Icons EXCLUSIVELY for Instagram and X */}
            <div className="flex items-center space-x-2 pt-2">
              {/* Instagram */}
              <motion.a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.92 }}
                className="p-2 rounded-xl text-text-secondary hover:text-primary hover:bg-slate-100/80 border border-transparent hover:border-slate-200 transition-all duration-200"
              >
                <svg className="w-4.5 h-4.5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </motion.a>

              {/* X (formerly Twitter) */}
              <motion.a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X (formerly Twitter)"
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.92 }}
                className="p-2 rounded-xl text-text-secondary hover:text-primary hover:bg-slate-100/80 border border-transparent hover:border-slate-200 transition-all duration-200"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </motion.a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <Link href="/features" className="text-xs font-bold text-text-secondary hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="/about" className="text-xs font-bold text-text-secondary hover:text-primary transition-colors">
              About Us
            </Link>
            <Link href="/contact" className="text-xs font-bold text-text-secondary hover:text-primary transition-colors">
              Contact
            </Link>
            <a href="#" className="text-xs font-bold text-text-secondary hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-xs font-bold text-text-secondary hover:text-primary transition-colors">
              Terms of Service
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border-color/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-text-secondary font-semibold">
          <p>© {new Date().getFullYear()} My Accounting. All rights reserved.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-danger fill-danger" />
            <span>for small businesses and entrepreneurs globally.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

