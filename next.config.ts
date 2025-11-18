import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static optimization
  reactStrictMode: true,
  // Improve TypeScript type checking
  typescript: {
    // Don't fail build on type errors during development
    ignoreBuildErrors: process.env.NODE_ENV === "development",
  },
  // Handle CSS properly
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
