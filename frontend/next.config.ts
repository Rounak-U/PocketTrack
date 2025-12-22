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
  // Experimental config removed - turbo key is not valid in Next.js 16
  // Font loading is handled via Metadata API in layout.tsx
};

export default nextConfig;
