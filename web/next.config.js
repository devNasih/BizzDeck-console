/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  devIndicators: {
    appIsrStatus: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: 'https://api.bizzdeck.com/v1/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'https://api.bizzdeck.com/api/:path*',
      },
    ];
  },
  // Note: /api/* is routed to FastAPI (port 8001) by the Kubernetes ingress at the platform level.
  // No application-level rewrite is needed.
};

module.exports = nextConfig;
