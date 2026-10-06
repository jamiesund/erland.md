import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/jamiesunderland.md", destination: "/api/markdown" }];
  },
};

export default nextConfig;
