/** @type {import('next').NextConfig} */

const cloudinaryCloudName =
  process.env.CLOUDINARY_CLOUD_NAME;

const nextConfig = {
  images: {
    remotePatterns: cloudinaryCloudName
      ? [
          {
            protocol: 'https',
            hostname: 'res.cloudinary.com',
            port: '',
            pathname: `/${cloudinaryCloudName}/image/upload/**`,
          },
        ]
      : [],
  },
};

export default nextConfig;