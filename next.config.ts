import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/jamiesunderland.md",
        destination: "/v1.md",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
