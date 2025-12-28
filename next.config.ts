import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Performance optimizations
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
    'lodash': {
      transform: 'lodash/{{member}}',
    },
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },

  // async rewrites() {
  //   return [
  //     {
  //       source: '/',
  //       destination: '/app', // Default to the app subdomain
  //       has: [
  //         {
  //           type: 'host',
  //           value: 'app.whisperrnote.space',
  //         },
  //       ],
  //     },
  //     {
  //       source: '/',
  //       destination: '/login', // Route auth subdomain to login page
  //       has: [
  //         {
  //           type: 'host',
  //           value: 'auth.whisperrnote.space',
  //         },
  //       ],
  //     },
  //     {
  //       source: '/',
  //       destination: '/send', // Handle send subdomain
  //       has: [
  //         {
  //           type: 'host',
  //           value: 'send.whisperrnote.space',
  //         },
  //       ],
  //     },
  //     // Add more subdomain rewrites as needed
  //   ];
  // },
};

export default nextConfig;
