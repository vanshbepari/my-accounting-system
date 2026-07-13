"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Globe, MessageSquare, Users, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border-color bg-slate-50/50 py-12 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Brand Info */}
          <div className="space-y-3 text-left">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo_full.png"
                alt="My Accounting"
                width={200}
                height={60}
                className="object-contain h-12 w-auto"
              />
            </Link>
            <p className="text-xs text-text-secondary max-w-xs leading-relaxed font-semibold">
              Beautifully automated accounting ledger and analytics for high-growth small businesses and shop owners.
            </p>
            <div className="flex space-x-3 pt-1">
              <a href="#" className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-slate-100 transition-all">
                <MessageSquare className="w-4 h-4" />
              </a>
              <a href="#" className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-slate-100 transition-all">
                <Users className="w-4 h-4" />
              </a>
              <a href="#" className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-slate-100 transition-all">
                <Globe className="w-4 h-4" />
              </a>
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
