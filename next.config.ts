import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions configuration (Increased limit for product uploads)
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },

  // Environment variables for SEO
  env: {
    NEXT_PUBLIC_BASE_URL:
      process.env.NEXT_PUBLIC_BASE_URL || "https://jradianceco.com",
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jradianceco.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.jradianceco.com",
        pathname: "/**",
      },
      // Supabase Storage - Product Images & Avatars
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Performance optimization
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp", "image/avif"],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.supabase.co https://*.fingerprintjs.com https://*.fpcdn.io https://*.datadoghq.com https://va.vercel-scripts.com; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "img-src 'self' data: blob: https://jradianceco.com https://www.jradianceco.com https://*.supabase.co https://*.vercel.com https://*.stripe.com; " +
              "connect-src 'self' https://*.supabase.co https://*.datadoghq.com https://api.stripe.com https://*.stripe.com https://*.vercel-analytics.com; " +
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com;",
          },
          // Additional security headers
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      // Cache headers for static assets
      {
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
