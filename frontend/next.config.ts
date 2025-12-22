import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Disable Turbopack for font loading to avoid module resolution issues
  experimental: {
    turbo: {
      resolveAlias: {
        // Fallback for font loading
      },
    },
  },
};

export default nextConfig;
