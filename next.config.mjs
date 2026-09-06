/** @type {import('next').NextConfig} */

const nextConfig = {
  allowedDevOrigins: ['192.168.0.184', 'localhost:3000'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;