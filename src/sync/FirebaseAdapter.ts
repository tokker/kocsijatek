import { initializeApp } from 'firebase/app'
import {
  type Database,
  get,
  getDatabase,
  onValue,
  ref,
  serverTimestamp,
  set,
  update,
} from 'firebase/database'
import type { ConnectionStatus, SyncAdapter } from './SyncAdapter'
import type { GameResult, RoomMeta, RoomState, TeamId, TeamInfo } from '../core/types'

export class FirebaseAdapter implements SyncAdapter {
  private db: Database

  constructor() {
    const app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    })
    this.db = getDatabase(app)
  }

  async createRoom(meta: RoomMeta): Promise<void> {
    await set(ref(this.db, `rooms/${meta.roomCode}/meta`), meta)
  }

  async roomExists(roomCode: string): Promise<boolean> {
    return (await get(ref(this.db, `rooms/${roomCode}/meta`))).exists()
  }

  async joinRoom(roomCode: string, team: TeamInfo): Promise<void> {
    await set(ref(this.db, `rooms/${roomCode}/teams/${team.id}`), team)
  }

  async markStarted(roomCode: string, round: number, teamId: TeamId): Promise<void> {
    await update(ref(this.db, `rooms/${roomCode}/rounds/${round}/started`), {
      [teamId]: serverTimestamp(),
    })
  }

  async submitResult(
    roomCode: string,
    round: number,
    teamId: TeamId,
    result: GameResult,
  ): Promise<void> {
    // Ha épp nincs hálózat, az SDK sorba állítja ezt az írást, és
    // visszatéréskor magától elküldi. Az eredmény tehát alagútban sem
    // vész el, csak a másik autó látja később.
    await set(ref(this.db, `rooms/${roomCode}/rounds/${round}/done/${teamId}`), result)
  }

  subscribe(roomCode: string, onState: (state: RoomState | null) => void): () => void {
    return onValue(ref(this.db, `rooms/${roomCode}`), (snapshot) => {
      const value = snapshot.val()
      if (!value?.meta) return onState(null)
      // A Firebase nem tárol üres objektumot, ezért a hiányzó ágakat
      // alapértelmezzük — különben a hívóknak kellene mindenhol védekezni.
      onState({
        meta: value.meta,
        teams: value.teams ?? {},
        rounds: value.rounds ?? {},
      })
    })
  }

  subscribeStatus(onStatus: (status: ConnectionStatus) => void): () => void {
    onStatus('connecting')
    return onValue(ref(this.db, '.info/connected'), (snapshot) => {
      onStatus(snapshot.val() === true ? 'online' : 'offline')
    })
  }
}
