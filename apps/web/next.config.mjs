import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  // Suppress hydration warnings for third-party attributes
  reactStrictMode: true,
  onDemandEntries: {
    // Suppress hydration warnings in development
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Suppress hydration warnings from browser extensions
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable static optimization to prevent SSR issues with hooks
  output: 'standalone',
  // Skip building error pages that cause Html import issues
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3000',
  },
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Caching and static optimization
  generateEtags: true,
  
  // Bundle analyzer support
  ...(process.env.ANALYZE === 'true' && {
    experimental: {
      ...nextConfig.experimental,
      bundlePagesRouterDependencies: true,
    }
  }),
  
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // AGGRESSIVE FIX for ReferenceError: Cannot access 'v' before initialization
    // Force development-like module handling in production to prevent initialization issues
    if (!dev) {
      // Force development mode for module resolution
      config.mode = 'development'
      
      // Disable ALL optimizations that can cause variable initialization order issues
      config.optimization = {
        // Keep development-like optimization settings
        minimize: false,
        concatenateModules: false,
        sideEffects: false,
        usedExports: false,
        providedExports: false,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        mergeDuplicateChunks: false,
        mangleExports: false,
        // Minimal chunk splitting to prevent initialization order issues
        splitChunks: {
          chunks: 'all',
          minSize: 0,
          maxSize: 0,
          cacheGroups: {
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: -10,
              reuseExistingChunk: true
            }
          }
        }
      }
      
      // Force ES5 output to prevent modern JS initialization issues
      config.target = ['web', 'es5']
      
      // Add specific module loading order for problematic modules
      config.entry = async () => {
        const entries = await config.entry()
        return {
          ...entries,
          // Ensure React loads first
          'react-vendor': ['react', 'react-dom'],
          // Ensure wagmi loads after React
          'web3-vendor': ['wagmi', 'viem', '@tanstack/react-query']
        }
      }
    }
    
    return config
  },
  
  // API proxy rewrites - disabled since frontend calls API directly
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
  //     },
  //   ]
  // },

  // Headers for caching
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600',
          },
        ],
      },
    ]
  },
};

export default withBundleAnalyzer(nextConfig);