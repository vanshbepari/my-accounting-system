import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore TypeScript build errors during production builds on Vercel
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
