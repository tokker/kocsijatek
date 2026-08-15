import type { ConnectionStatus, SyncAdapter } from './SyncAdapter'
import type { GameResult, RoomMeta, RoomState, TeamId, TeamInfo } from '../core/types'

const PREFIX = 'roadtrip:room:'
const CHANNEL = 'roadtrip-sync'

/**
 * Folyamaton belüli feliratkozók. Két MockAdapter példány ugyanabban a
 * lapban ezen keresztül értesíti egymást, SZINKRONBAN — a BroadcastChannel
 * kézbesítése aszinkron, ami a teszteket kiszámíthatatlanná tenné.
 */
const localListeners = new Set<(roomCode: string) => void>()

function notifyLocal(roomCode: string) {
  for (const listener of localListeners) listener(roomCode)
}

/**
 * Szerver nélküli adapter fejlesztéshez és teszteléshez. A localStorage
 * tárol, a BroadcastChannel értesíti a többi böngészőfület. Ugyanazt az
 * interfészt valósítja meg, mint a FirebaseAdapter, ezért a UI kódnak
 * fogalma sincs róla, melyik fut alatta.
 */
export class MockAdapter implements SyncAdapter {
  private channel: BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null

  constructor() {
    // A másik fülről érkező üzenetet továbbadjuk a helyi feliratkozóknak.
    this.channel?.addEventListener('message', (event: MessageEvent) => {
      notifyLocal(String(event.data))
    })
  }

  private key(roomCode: string) {
    return PREFIX + roomCode
  }

  private read(roomCode: string): RoomState | null {
    const raw = localStorage.getItem(this.key(roomCode))
    return raw ? (JSON.parse(raw) as RoomState) : null
  }

  private write(roomCode: string, state: RoomState) {
    localStorage.setItem(this.key(roomCode), JSON.stringify(state))
    notifyLocal(roomCode)
    this.channel?.postMessage(roomCode)
  }

  /** Olvas, módosít, visszaír. Egy szálon fut, ezért nem kell zárolás. */
  private mutate(roomCode: string, fn: (state: RoomState) => void) {
    const state = this.read(roomCode)
    if (!state) throw new Error(`Room ${roomCode} does not exist`)
    fn(state)
    this.write(roomCode, state)
  }

  async createRoom(meta: RoomMeta): Promise<void> {
    this.write(meta.roomCode, { meta, teams: {}, rounds: {} })
  }

  async roomExists(roomCode: string): Promise<boolean> {
    return this.read(roomCode) !== null
  }

  async joinRoom(roomCode: string, team: TeamInfo): Promise<void> {
    this.mutate(roomCode, (state) => {
      state.teams[team.id] = team
    })
  }

  async markStarted(roomCode: string, round: number, teamId: TeamId): Promise<void> {
    this.mutate(roomCode, (state) => {
      state.rounds[round] ??= {}
      state.rounds[round].started ??= {}
      state.rounds[round].started![teamId] = Date.now()
    })
  }

  async submitResult(
    roomCode: string,
    round: number,
    teamId: TeamId,
    result: GameResult,
  ): Promise<void> {
    this.mutate(roomCode, (state) => {
      state.rounds[round] ??= {}
      state.rounds[round].done ??= {}
      state.rounds[round].done![teamId] = result
    })
  }

  subscribe(roomCode: string, onState: (state: RoomState | null) => void): () => void {
    const listener = (changed: string) => {
      if (changed === roomCode) onState(this.read(roomCode))
    }
    localListeners.add(listener)
    onState(this.read(roomCode))
    return () => {
      localListeners.delete(listener)
    }
  }

  subscribeStatus(onStatus: (status: ConnectionStatus) => void): () => void {
    onStatus('online')
    return () => {}
  }
}
