import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const backendOrigin = process.env.API_URL ?? 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/:path*`
      }
    ];
  }
};

export default nextConfig;
