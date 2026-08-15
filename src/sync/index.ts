import { MockAdapter } from './MockAdapter'
import type { SyncAdapter } from './SyncAdapter'

let instance: SyncAdapter | null = null

/**
 * Egyetlen adapter az egész appra, a környezet alapján kiválasztva.
 * A Firebase változatot dinamikusan importáljuk, hogy a fejlesztői
 * mock mód ne húzza be a teljes SDK-t.
 */
export async function getSyncAdapter(): Promise<SyncAdapter> {
  if (!instance) {
    if (import.meta.env.VITE_SYNC_BACKEND === 'firebase') {
      const { FirebaseAdapter } = await import('./FirebaseAdapter')
      instance = new FirebaseAdapter()
    } else {
      instance = new MockAdapter()
    }
  }
  return instance
}

export type { ConnectionStatus, SyncAdapter } from './SyncAdapter'
