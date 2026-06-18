import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal self-contained server bundle for Docker/VPS deploys.
  output: "standalone",
};

export default nextConfig;
