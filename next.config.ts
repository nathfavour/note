import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  transpilePackages: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
  compress: true,
  poweredByHeader: false,
  experimental: {
    reactCompiler: true,
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'lucide-react',
      'lodash-es',
      'date-fns',
      'framer-motion',
      'react-markdown',
    ],
  },

  // Security Headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.kylrix.space", 
              "style-src 'self' 'unsafe-inline' https://api.fontshare.com",
              "img-src 'self' data: https:",
              "font-src 'self' data: https://api.fontshare.com",
              "object-src 'none'",
              "connect-src 'self' https://*.kylrix.space https://*.appwrite.io https://*.appwrite.global",
              "frame-ancestors 'self' https://*.kylrix.space",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Force HTTPS (HSTS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Prevent DNS Prefetching
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          // XSS Protection
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },

  // async rewrites() {
  //   return [
  //     {
  //       source: '/',
  //       destination: '/app', // Default to the app subdomain
  //       has: [
  //         {
  //           type: 'host',
  //           value: 'app.kylrix.space',
  //         },
  //       ],
  //     },
  //     {
  //       source: '/',
  //       destination: '/login', // Route auth subdomain to login page
  //       has: [
  //         {
  //           type: 'host',
  //           value: 'auth.kylrix.space',
  //         },
  //       ],
  //     },
  //     {
  //       source: '/',
  //       destination: '/send', // Handle send subdomain
  //       has: [
  //         {
  //           type: 'host',
  //           value: 'send.kylrix.space',
  //         },
  //       ],
  //     },
  //     // Add more subdomain rewrites as needed
  //   ];
  // },
};

export default nextConfig;
