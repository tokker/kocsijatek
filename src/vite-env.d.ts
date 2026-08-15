/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SYNC_BACKEND?: 'mock' | 'firebase'
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_DATABASE_URL?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
