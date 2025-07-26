/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [      
      {
        protocol: "https",
        hostname: "**.aliyuncs.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8787",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
      {
        protocol: "https",
        hostname: "recipe-easy.annnb016.workers.dev",
      },
      {
        protocol: "https",
        hostname: "*.workers.dev",
      },
    ],
  },
};

export default nextConfig;
