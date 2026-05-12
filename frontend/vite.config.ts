import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'

// Enable bundle analysis when ANALYZE env var is set
const isAnalyze = process.env.ANALYZE === 'true'

// Sentry configuration from environment variables
const sentryOrg = process.env.SENTRY_ORG
const sentryProject = process.env.SENTRY_PROJECT
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN
const sentryRelease =
  process.env.SENTRY_RELEASE ||
  `intl-dossier-frontend@${process.env.npm_package_version || '1.0.0'}`
const devPort = process.env.VITE_DEV_PORT ? Number(process.env.VITE_DEV_PORT) : 5173
const backendProxyTarget = process.env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:5000'

// Only enable Sentry plugin in production build with proper config
const isSentryEnabled = !!(
  sentryOrg &&
  sentryProject &&
  sentryAuthToken &&
  process.env.NODE_ENV === 'production'
)

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      // Disable auto-generation in dev mode to prevent infinite loops
      autoCodeSplitting: true,
      generatedRouteTree: './src/routeTree.gen.ts',
      routeFileIgnorePattern: '(__tests__|\\.test\\.)',
    }),
    tailwindcss(),
    react(),
    // Bundle visualizer - only enabled when ANALYZE=true
    isAnalyze &&
      visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap', // Options: treemap, sunburst, network
      }),
    // Sentry source maps upload - only in production with proper config
    isSentryEnabled &&
      sentryVitePlugin({
        org: sentryOrg,
        project: sentryProject,
        authToken: sentryAuthToken,
        release: {
          name: sentryRelease,
        },
        sourcemaps: {
          // Upload source maps to Sentry
          filesToDeleteAfterUpload: ['./dist/**/*.map'],
        },
        telemetry: false,
        // Silence warnings about missing source maps in dev
        silent: !process.env.CI,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Expose on network (shows both localhost and network IP)
    port: devPort,
    strictPort: false,
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/routeTree.gen.ts',
        '**/.tanstack/**',
        '**/coverage/**',
        '**/.vite/**',
        '**/public/assets/**', // Ignore static assets (maps, flags)
        '**/.DS_Store',
      ],
      // Disable file system polling to prevent excessive CPU usage
      usePolling: false,
    },
    proxy: {
      // Express backend routes
      // Edge Functions use full VITE_SUPABASE_URL so don't need a proxy
      '/api': {
        target: backendProxyTarget,
        changeOrigin: true,
      },
      '/ai': {
        target: backendProxyTarget,
        changeOrigin: true,
      },
      '/analytics-dashboard': {
        target: backendProxyTarget,
        changeOrigin: true,
      },
      '/organization-benchmarks': {
        target: backendProxyTarget,
        changeOrigin: true,
      },
      '/notifications-center': {
        target: backendProxyTarget,
        changeOrigin: true,
      },
    },
    // Add cache-busting headers for HTML in dev mode
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  },
  build: {
    target: 'ES2022',
    outDir: 'dist',
    sourcemap: true,
    // Increase chunk size limit since we're using a simpler chunking strategy
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Strategic chunk splitting for better caching and load performance
        // Split vendor bundles by category to optimize cache invalidation
        manualChunks: (id) => {
          if (id.includes('/src/components/signature-visuals/')) {
            return 'signature-visuals-static'
          }

          if (id.includes('node_modules')) {
            // Scoped-package rules must come BEFORE the `react` substring match.
            // Without this ordering, paths like `@heroui/react/*`, `@sentry/react/*`,
            // `@dnd-kit/*?react*`, `@radix-ui/react-*` are mis-classified into
            // react-vendor (Phase 49 Plan 01 audit: 117 KB leaked across these scopes).
            // HeroUI primitive cascade per CLAUDE.md §Component Library Strategy (D-07)
            if (id.includes('@heroui')) {
              return 'heroui-vendor'
            }
            // Sentry error tracking; init is requestIdleCallback-deferred at main.tsx:24
            // so non-initial-path. Cache-isolated per D-09.
            if (id.includes('@sentry')) {
              return 'sentry-vendor'
            }
            // @dnd-kit kanban + reorder; non-initial-path
            if (id.includes('@dnd-kit')) {
              return 'dnd-vendor'
            }
            // Radix UI - headless components (kept before react match for the same reason)
            if (id.includes('@radix-ui')) {
              return 'radix-vendor'
            }
            // TanStack ecosystem - routing, query, table (before react: @tanstack/react-* contains 'react')
            if (id.includes('@tanstack')) {
              return 'tanstack-vendor'
            }
            // React core - rarely changes, cache well
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-vendor'
            }
            // Framer Motion - animation library
            if (id.includes('framer-motion') || id.includes('motion')) {
              return 'motion-vendor'
            }
            // Signature visuals geospatial dependencies
            if (
              id.includes('d3-geo') ||
              id.includes('topojson-client') ||
              id.includes('world-atlas')
            ) {
              return 'signature-visuals-d3'
            }
            // Charts and visualization
            if (
              id.includes('recharts') ||
              id.includes('d3-') ||
              id.includes('@xyflow') ||
              id.includes('reactflow')
            ) {
              return 'charts-vendor'
            }
            // i18n
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n-vendor'
            }
            // Supabase client
            if (id.includes('@supabase')) {
              return 'supabase-vendor'
            }
            // Form handling
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'forms-vendor'
            }
            // All other dependencies
            return 'vendor'
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/app-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
