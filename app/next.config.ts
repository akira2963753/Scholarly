import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    // 解決 canvas 模組在 SSR 下的問題
    config.resolve.alias.canvas = false;
    return config;
  },
  async rewrites() {
    // 讓舊路徑 /uploads/:filename 和新路徑 /api/uploads/:filename 都能存取上傳的 PDF
    return [
      {
        source: "/uploads/:filename",
        destination: "/api/uploads/:filename",
      },
    ];
  },
};

export default nextConfig;
