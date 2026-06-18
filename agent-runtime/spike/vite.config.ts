import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// THROWAWAY spike (Plan 72-01) — serves the GATE 2 render for the orchestrator's
// 1024px AR visual confirmation. Local-only.
export default defineConfig({
  plugins: [react()],
  server: { port: 5273, host: '127.0.0.1', strictPort: false },
})
