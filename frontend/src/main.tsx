import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './components/theme-provider/theme-provider'
import { LanguageProvider } from './components/language-provider/language-provider'
import './index.css'
import App from './App.tsx'

// Defer Sentry initialization to after first paint (per D-06)
// This removes @sentry/react from the critical rendering path
requestIdleCallback(() => {
  import('./lib/sentry').then(({ initSentry, initWebVitalsReporting }) => {
    initSentry()
    initWebVitalsReporting()
  })
})

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((err) => console.error('SW registration failed:', err))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
)
