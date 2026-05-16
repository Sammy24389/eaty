import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [],
    formats: ["image/webp", "image/avif"],
  },
};

export default nextConfig;
