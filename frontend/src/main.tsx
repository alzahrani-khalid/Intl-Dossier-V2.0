import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

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
