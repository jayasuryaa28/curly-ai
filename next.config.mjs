/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['studio'],
  experimental: {
    allowedDevOrigins: ['10.42.146.235:3000', 'localhost:3000', '127.0.0.1:3000'],
  },
};

export default nextConfig;
