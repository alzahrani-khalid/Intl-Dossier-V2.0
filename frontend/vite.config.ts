import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), TanStackRouterVite()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true, // Expose on network (shows both localhost and network IP)
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/routeTree.gen.ts'],
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
      'Pragma': 'no-cache',
      'Expires': '0',
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
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }

          // TanStack libraries
          if (id.includes('node_modules/@tanstack/react-router') ||
              id.includes('node_modules/@tanstack/react-query')) {
            return 'tanstack-vendor';
          }

          // i18n libraries
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'i18n-vendor';
          }

          // UI libraries (shadcn, Radix UI)
          if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/cmdk')) {
            return 'ui-vendor';
          }

          // Chart/visualization libraries (React Flow for graph viz)
          if (id.includes('node_modules/reactflow') || id.includes('node_modules/@xyflow') ||
              id.includes('node_modules/d3') || id.includes('node_modules/recharts')) {
            return 'visualization-vendor';
          }

          // Form libraries
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod')) {
            return 'form-vendor';
          }

          // Date libraries
          if (id.includes('node_modules/date-fns') || id.includes('node_modules/dayjs')) {
            return 'date-vendor';
          }

          // Supabase client
          if (id.includes('node_modules/@supabase')) {
            return 'supabase-vendor';
          }

          // Other large node_modules
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
        // T132: Optimize chunk file names for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})