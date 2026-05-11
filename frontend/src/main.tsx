import './fonts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/list-pages.css'
import App from './App.tsx'

// Dev-only: suppress upstream HeroUI v3 (BETA) false-positive warning that
// originates inside @heroui/react's overlay components (PressResponder wraps
// non-pressable children). Not actionable at our call sites — remove this
// filter once HeroUI v3 ships stable.
if (import.meta.env.DEV) {
  const originalWarn = console.warn
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('A PressResponder was rendered without a pressable child')) {
      return
    }
    originalWarn(...args)
  }
}

// Defer Sentry initialization to after first paint (per D-06)
// This removes @sentry/react from the critical rendering path
requestIdleCallback(() => {
  import('./lib/sentry')
    .then(({ initSentry, initWebVitalsReporting }) => {
      initSentry()
      initWebVitalsReporting()
    })
    .catch((err) => console.error('Sentry init failed:', err))
})

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .catch((err) => console.error('SW registration failed:', err))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
