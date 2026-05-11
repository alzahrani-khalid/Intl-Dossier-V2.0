/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_LOG_WEB_VITALS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
