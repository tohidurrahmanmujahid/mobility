/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: {
    // Skip ESLint during `next build`
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With, Accept' },
          { key: 'Access-Control-Max-Age', value: '86400' }, // Cache preflight for 24 hours
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/partner',
        destination: '/login',
      },
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },
  // Enable server-side environment variables
  serverRuntimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
  },
  // Environment variables available to the client
  publicRuntimeConfig: {
    appName: 'MobilityParnter',
  },
};

module.exports = nextConfig;