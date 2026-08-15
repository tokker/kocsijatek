import { describe, expect, it } from 'vitest'
import { backendStatus } from './backend'

const env = (over: Partial<ImportMetaEnv> = {}) => ({ ...over }) as ImportMetaEnv

describe('backendStatus', () => {
  it('uses Firebase when the backend is selected and configured', () => {
    const status = backendStatus(
      env({
        VITE_SYNC_BACKEND: 'firebase',
        VITE_FIREBASE_DATABASE_URL: 'https://x.firebasedatabase.app',
        VITE_FIREBASE_API_KEY: 'key',
      }),
      true,
    )
    expect(status).toEqual({ kind: 'firebase', problem: null })
  })

  it('treats mock as normal during development', () => {
    expect(backendStatus(env(), false)).toEqual({ kind: 'mock', problem: null })
  })

  it('reports a problem when a production build has no backend selected', () => {
    // Ez a valódi hibaeset: a Cloudflare build nem latja a .env.local-t,
    // tehát a valtozok nelkul csendben mockra esne vissza.
    const status = backendStatus(env(), true)
    expect(status.kind).toBe('mock')
    expect(status.problem).toContain('VITE_SYNC_BACKEND')
  })

  it('names the missing variable when Firebase is selected but unconfigured', () => {
    const status = backendStatus(env({ VITE_SYNC_BACKEND: 'firebase' }), true)
    expect(status.kind).toBe('mock')
    expect(status.problem).toContain('VITE_FIREBASE_DATABASE_URL')
    expect(status.problem).toContain('VITE_FIREBASE_API_KEY')
  })

  it('names only the variable that is actually missing', () => {
    const status = backendStatus(
      env({ VITE_SYNC_BACKEND: 'firebase', VITE_FIREBASE_API_KEY: 'key' }),
      true,
    )
    expect(status.problem).toContain('VITE_FIREBASE_DATABASE_URL')
    expect(status.problem).not.toContain('VITE_FIREBASE_API_KEY')
  })

  it('does not fall back to Firebase when only some settings are present', () => {
    const status = backendStatus(
      env({ VITE_SYNC_BACKEND: 'firebase', VITE_FIREBASE_DATABASE_URL: 'https://x' }),
      true,
    )
    expect(status.kind).toBe('mock')
  })
})
