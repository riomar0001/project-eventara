/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    const backendOrigin = process.env.API_URL ?? 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
