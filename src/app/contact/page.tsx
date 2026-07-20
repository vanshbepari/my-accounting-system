"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MessageSquare, Send, CheckCircle2, ChevronDown, Award } from "lucide-react";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100/80 py-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left font-display font-bold text-sm text-text-primary hover:text-primary transition-colors cursor-pointer"
      >
        <span>{question}</span>
        <ChevronDown className={`w-4 h-4 text-text-secondary transform transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-xs text-text-secondary leading-relaxed pt-2.5 font-semibold">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", msg: "" });

  const handleForm = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: "", email: "", msg: "" });
    setTimeout(() => {
      setSubmitted(false);
    }, 4000);
  };

  const faqs = [
    {
      question: "Is my financial data secure in My Accounting?",
      answer: "Yes, completely. My Accounting handles identity through Google OAuth 2.0. We do not store your passwords. Your transaction entries and business summaries are stored safely in secure database vaults."
    },
    {
      question: "Can I export my balance sheet records?",
      answer: "Yes. You can export your complete transaction ledger as a normalized CSV file which is fully compatible with Microsoft Excel and Google Sheets."
    },
    {
      question: "Does My Accounting support custom currency symbols?",
      answer: "Yes. Under the Settings panel in the dashboard, you can change your business name, currency code (e.g., INR, USD, EUR), and corresponding currency symbol (e.g., ₹, $, €)."
    },
    {
      question: "How do I split cash and online payments?",
      answer: "When adding a transaction entry, you can specify individual amounts for cash and online channels. The dashboard dynamically compiles both streams and displays comparative charts."
    },
    {
      question: "How can I print or download monthly reports?",
      answer: "In the Reports tab, you can view your monthly performance summaries. Use the browser's print function (Ctrl+P or Cmd+P) to save a clean, print-optimized PDF statement compiled via our custom CSS print stylesheet."
    },
    {
      question: "Is there any subscription fee for My Accounting?",
      answer: "No, My Accounting is fully free to use. All reporting, analytics, Excel exports, and Google identity vaults are unlocked for all store owners and entrepreneurs."
    },
    {
      question: "Can I edit past daily records?",
      answer: "Yes. In the Dashboard or Ledger view, you can click on any daily entry row to open the editing drawer and update transaction amounts, categories, or notes."
    }
  ];

  return (
    <>
      <Navbar />

      <main className="relative min-h-screen pt-24 pb-16 overflow-hidden bg-brand-bg transition-all duration-300">
        {/* Ambient glows */}
        <div className="absolute top-0 right-1/4 w-[60vw] h-[60vw] bg-primary/4 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-1/4 left-10 w-[50vw] h-[50vw] bg-secondary/3 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 max-w-3xl mx-auto mb-16 text-center"
          >
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary font-display block">
              Reach Out
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-text-primary tracking-tight leading-tight">
              We&apos;d Love To Hear From You
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xl mx-auto font-semibold">
              Have questions about statement compliance, feature requests, or custom database settings? Send us a line.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto items-start">
            {/* Contact details & FAQ */}
            <div className="lg:col-span-5 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.015 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card rounded-2xl p-5 border border-border-color bg-white flex items-start space-x-4 shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-display font-bold text-sm text-text-primary">Email Support</h3>
                  <p className="text-[10px] text-text-secondary mt-0.5 font-semibold">Our accounting success team replies inside 24 hours.</p>
                  <p className="text-xs font-black text-primary mt-1.5">support@myaccounting.app</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.015 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card rounded-2xl p-5 border border-border-color bg-white flex items-start space-x-4 shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 shadow-sm">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-display font-bold text-sm text-text-primary">Enterprise Support</h3>
                  <p className="text-[10px] text-text-secondary mt-0.5 font-semibold">Talk to developer engineers about custom compliance builds.</p>
                  <p className="text-xs font-black text-secondary mt-1.5">Mon-Fri · 9am to 6pm</p>
                </div>
              </motion.div>

              {/* Mini FAQ accordion */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card rounded-3xl p-6 border border-border-color bg-white text-left shadow-sm"
              >
                <h3 className="font-display font-black text-sm text-text-primary uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-primary" />
                  <span>Frequently Asked Questions</span>
                </h3>
                <div className="divide-y divide-slate-100">
                  {faqs.map((faq, i) => (
                    <FAQItem key={i} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7"
            >
              <div className="glass-card rounded-3xl p-8 border border-border-color bg-white relative overflow-hidden text-left shadow-md">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center space-y-4"
                  >
                    <div className="w-16 h-16 bg-success/10 border border-success/20 rounded-full flex items-center justify-center shadow-md animate-bounce">
                      <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>
                    <h2 className="font-display font-black text-xl text-text-primary tracking-tight">Message Transmitted!</h2>
                    <p className="text-xs text-text-secondary max-w-xs mx-auto font-semibold leading-relaxed">
                      Thank you for contacting us. A business support representative will follow up via your email address shortly.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleForm} className="space-y-4">
                    <h2 className="font-display font-black text-lg sm:text-xl text-text-primary mb-6 tracking-tight">
                      Send a secure message
                    </h2>

                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                          Your Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-2.5 text-xs font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="you@domain.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2.5 text-xs font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                          How can we help?
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Type your question..."
                          value={formData.msg}
                          onChange={(e) => setFormData({ ...formData, msg: e.target.value })}
                          className="w-full px-4 py-2.5 text-xs font-semibold border border-border-color rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary resize-none transition-all"
                        />
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full flex items-center justify-center space-x-2.5 p-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20 hover:brightness-105 transition-all cursor-pointer mt-4"
                    >
                      <Send className="w-4 h-4" />
                      <span>Transmit Message</span>
                    </motion.button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
