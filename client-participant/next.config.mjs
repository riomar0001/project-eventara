/** @type {import('next').NextConfig} */

function storageImagePattern() {
  const publicUrl = process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL ?? '';
  if (!publicUrl) return [];
  try {
    const { hostname, protocol } = new URL(publicUrl);
    return [{ protocol: protocol.replace(':', ''), hostname }];
  } catch {
    return [];
  }
}

const nextConfig = {
  output: 'standalone',
  async rewrites() {
    const backendOrigin = process.env.API_URL ?? 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/:path*`
      }
    ];
  },
  images: {
    remotePatterns: storageImagePattern()
  }
};

export default nextConfig;
