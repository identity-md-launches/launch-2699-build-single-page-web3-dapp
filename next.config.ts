import type { NextConfig } from "next";
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  assetPrefix: ".",
  images: { unoptimized: true },
  reactStrictMode: true,
  devIndicators: false,
  experimental: { cpus: 2 },
};
export default config;
