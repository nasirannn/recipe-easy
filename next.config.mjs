import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

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
        hostname: "replicate.delivery",
      },
      {
        protocol: "https",
        hostname: "recipe-easy.annnb016.workers.dev",
      },
      // 删除 *.workers.dev，这种写法不支持
    ],
  },
};

export default withNextIntl(nextConfig);
