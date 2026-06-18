import type { NextConfig } from "next";

// Production API URL for Render backend
const PRODUCTION_API_URL = 'https://devsync-api-25hv.onrender.com/api/v1';

const nextConfig: NextConfig = {
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || PRODUCTION_API_URL,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  // Strict mode for development
  reactStrictMode: true,
  reactCompiler: true,

  // Output configuration for Docker
  output: 'standalone',

  // Production optimizations
  compress: true,
  poweredByHeader: false,

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
