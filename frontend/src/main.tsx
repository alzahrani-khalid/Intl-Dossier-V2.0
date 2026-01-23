import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './components/theme-provider/theme-provider'
import { LanguageProvider } from './components/language-provider/language-provider'
import { initSentry } from './lib/sentry'
import './index.css'
import App from './App.tsx'

// Initialize Sentry error tracking before rendering
initSentry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
)
