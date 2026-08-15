import { backendStatus, type BackendStatus } from './backend'
import { MockAdapter } from './MockAdapter'
import type { SyncAdapter } from './SyncAdapter'
import type { RoomState } from '../core/types'

let instance: SyncAdapter | null = null

/** Melyik háttér fut, és ha nem a Firebase, akkor miért nem. */
export function currentBackend(): BackendStatus {
  return backendStatus(import.meta.env, import.meta.env.PROD)
}

/**
 * Egyetlen adapter az egész appra, a környezet alapján kiválasztva.
 * A Firebase változatot dinamikusan importáljuk, hogy a fejlesztői
 * mock mód ne húzza be a teljes SDK-t.
 */
export async function getSyncAdapter(): Promise<SyncAdapter> {
  if (!instance) {
    if (currentBackend().kind === 'firebase') {
      const { FirebaseAdapter } = await import('./FirebaseAdapter')
      instance = new FirebaseAdapter()
    } else {
      instance = new MockAdapter()
    }
  }
  return instance
}

/** Egyszeri olvasás: az első kiadott állapot után azonnal leiratkozik. */
export function readRoomOnce(
  adapter: SyncAdapter,
  roomCode: string,
): Promise<RoomState | null> {
  return new Promise((resolve) => {
    const off = adapter.subscribe(roomCode, (state) => {
      resolve(state)
      // A leiratkozás egy ütemmel később fut: a MockAdapter szinkron
      // hívja a callbacket, tehát `off` itt még nincs értéket kapva.
      queueMicrotask(() => off())
    })
  })
}

export type { BackendKind, BackendStatus } from './backend'
export type { ConnectionStatus, SyncAdapter } from './SyncAdapter'
