import type { NextConfig } from "next";

const apiServerUrl = process.env.API_SERVER_URL || `http://127.0.0.1:${process.env.APP_API_PORT || "8001"}`;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiServerUrl}/api/v1/:path*`,
      },
      {
        source: "/health",
        destination: `${apiServerUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
