/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  // Optimize build for Vercel
  experimental: {
    // Reduce memory usage during build
    optimizePackageImports: ['@dnd-kit/core', '@dnd-kit/sortable', 'sharp'],
    // Skip source map generation to reduce build time
    optimizeCss: false,
  },
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    }

    // Reduce bundle size
    config.optimization.splitChunks = {
      ...config.optimization.splitChunks,
      cacheGroups: {
        default: false,
        vendors: false,
        vendor: {
          chunks: 'all',
          name: 'vendor',
          test: /[\\/]node_modules[\\/]/,
          priority: 20,
          enforce: true,
        },
      },
    };

    // Exclude problematic modules from server build
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    }

    return config;
  },
  // Reduce output trace for Vercel
  outputFileTracing: true,
  // Disable static generation for problematic routes
  trailingSlash: false,
}

module.exports = nextConfig
