import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.3.240.26"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
