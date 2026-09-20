import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  turbopack: {
    // Parent Documents/package-lock.json must not become the workspace root.
    root: process.cwd(),
  },
};

export default nextConfig;
