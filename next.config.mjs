import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 控制末尾斜杠行为 - false表示不添加末尾斜杠
  trailingSlash: false,
  
  // 移除重写规则，使用 Next.js 默认路由
  
  // 添加安全头部
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ]
  },
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.aliyuncs.com",
      },
      {
        protocol: "https",
        hostname: "dashscope-result-wlcb-acdr-1.oss-cn-wulanchabu-acdr-1.aliyuncs.com",
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
        hostname: "recipe-easy.com",
      },
    ],
  },
  // 优化webpack配置
  webpack: (config, { isServer, webpack }) => {
    // 减少包大小
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // 添加全局变量定义，解决 __name 未定义的问题
    config.plugins.push(
      new webpack.DefinePlugin({
        __name: JSON.stringify(''),
        __filename: JSON.stringify(''),
        __dirname: JSON.stringify(''),
      })
    );
    
    return config;
  },
  // 实验性功能
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default withNextIntl(nextConfig);

// 开发环境初始化 - 用于 @opennextjs/cloudflare
if (process.env.NODE_ENV === 'development') {
  try {
    const { initOpenNextCloudflareForDev } = await import('@opennextjs/cloudflare');
    initOpenNextCloudflareForDev();
  } catch (error) {
    // 如果包未安装或在构建时，忽略错误
    console.warn('OpenNext Cloudflare dev initialization skipped:', error.message);
  }
}
