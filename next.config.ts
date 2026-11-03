import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Catalog data comes from a local SQLite file through synchronous reads, so
  // pages render at request time (classic model) instead of Cache Components.
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
