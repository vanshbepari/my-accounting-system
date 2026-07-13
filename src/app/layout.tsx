import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { AccountingProvider } from "@/context/AccountingContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "My Accounting - Simple. Daily. Precise.",
  description: "Manage daily accounting, income, expenses, and profit/loss tracking with a clean, modern accounting dashboard built for small businesses.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo_mark.png",
    apple: "/logo_mark.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "My Accounting",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-brand-bg text-text-primary transition-colors duration-300">
        <AccountingProvider>
          {children}
        </AccountingProvider>
      </body>
    </html>
  );
}
