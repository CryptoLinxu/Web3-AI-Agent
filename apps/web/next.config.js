/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 启用 AI SDK 流式响应支持
    serverComponentsExternalPackages: ['ai'],
  },
  // 环境变量公开配置
  env: {
    APP_NAME: 'Web3 AI Agent',
    APP_VERSION: '0.1.0',
  },
  // 图片优化配置 - 直接放行所有外部图片
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        pathname: '/coins/images/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
