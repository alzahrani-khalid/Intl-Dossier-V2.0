import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      // Disable auto-generation in dev mode to prevent infinite loops
      autoCodeSplitting: true,
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Expose on network (shows both localhost and network IP)
    port: 5173,
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
      '/api': {
        target: 'http://localhost:54321',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
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
    // T132: Optimize chunk size limits for better code splitting
    chunkSizeWarningLimit: 500, // Warn about chunks larger than 500kb
    rollupOptions: {
      output: {
        // T132: Enhanced manual chunking for better lazy loading
        // Using a function that properly handles dependencies
        manualChunks: (id) => {
          // Skip non-node_modules
          if (!id.includes('node_modules')) {
            return undefined
          }

          // Core React libraries - must be in same chunk to avoid circular deps
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor'
          }

          // TanStack libraries
          if (
            id.includes('node_modules/@tanstack/react-router') ||
            id.includes('node_modules/@tanstack/react-query')
          ) {
            return 'tanstack-vendor'
          }

          // i18n libraries
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'i18n-vendor'
          }

          // UI libraries (shadcn, Radix UI)
          if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/cmdk')) {
            return 'ui-vendor'
          }

          // Chart/visualization libraries - d3 doesn't depend on React, can be separate
          // BUT reactflow and recharts DO depend on React, so let Rollup handle them
          if (id.includes('node_modules/d3')) {
            return 'd3-vendor'
          }

          // Let reactflow, @xyflow, and recharts be handled automatically
          // to preserve proper React dependency resolution
          if (
            id.includes('node_modules/reactflow') ||
            id.includes('node_modules/@xyflow') ||
            id.includes('node_modules/recharts')
          ) {
            // Return undefined to let Rollup handle these naturally
            return undefined
          }

          // Form libraries
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod')) {
            return 'form-vendor'
          }

          // Date libraries
          if (id.includes('node_modules/date-fns') || id.includes('node_modules/dayjs')) {
            return 'date-vendor'
          }

          // Supabase client
          if (id.includes('node_modules/@supabase')) {
            return 'supabase-vendor'
          }

          // Other large node_modules - but be careful not to catch everything
          // Only group truly independent libraries
          if (
            id.includes('node_modules/lodash') ||
            id.includes('node_modules/clsx') ||
            id.includes('node_modules/class-variance-authority')
          ) {
            return 'vendor-misc'
          }

          // Let Rollup handle the rest automatically
          return undefined
        },
        // T132: Optimize chunk file names for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
