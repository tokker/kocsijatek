export type BackendKind = 'firebase' | 'mock'

export interface BackendStatus {
  kind: BackendKind
  /**
   * Miért nem a Firebase fut, ha nem az. Null, ha minden rendben.
   * Éles buildben ez mindig hiba: a mock adapter csak a böngésző saját
   * tárolóját használja, tehát KÉT FÜL UGYANAZON A GÉPEN látja egymást,
   * két külön telefon viszont soha.
   */
  problem: string | null
}

/**
 * Melyik szinkron-háttér fut, és miért.
 *
 * A korábbi változat csendben mockra esett vissza, ha hiányzott a
 * beállítás. Ez a lehető legrosszabb hibamód: az app működőnek LÁTSZIK,
 * amíg egy gépen két fülön próbálod, és csak a valódi úton derül ki,
 * hogy a két autó nem látja egymást.
 */
export function backendStatus(env: ImportMetaEnv, isProduction: boolean): BackendStatus {
  const requested = env.VITE_SYNC_BACKEND
  const databaseUrl = env.VITE_FIREBASE_DATABASE_URL
  const apiKey = env.VITE_FIREBASE_API_KEY

  if (requested === 'firebase' && databaseUrl && apiKey) {
    return { kind: 'firebase', problem: null }
  }

  // Fejlesztés közben a mock a szándékolt alapértelmezés, nem hiba.
  if (!isProduction) return { kind: 'mock', problem: null }

  if (requested !== 'firebase') {
    return {
      kind: 'mock',
      problem:
        'VITE_SYNC_BACKEND is not set to "firebase" in this build. Set the environment variables on the Cloudflare Pages build and redeploy.',
    }
  }

  const missing = [
    !databaseUrl && 'VITE_FIREBASE_DATABASE_URL',
    !apiKey && 'VITE_FIREBASE_API_KEY',
  ].filter(Boolean)

  return {
    kind: 'mock',
    problem: `Firebase was requested but ${missing.join(' and ')} is missing from this build.`,
  }
}
