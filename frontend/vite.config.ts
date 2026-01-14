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
    // Increase chunk size limit since we're using a simpler chunking strategy
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Simplified chunking strategy to avoid React dependency resolution issues
        // All node_modules go into a single vendor chunk to ensure proper load order
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
