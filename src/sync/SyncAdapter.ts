import type { GameResult, RoomMeta, RoomState, TeamId, TeamInfo } from '../core/types'

export type ConnectionStatus = 'connecting' | 'online' | 'offline'

/**
 * Mindent, ami hálózatot érint, ez az interfész takar el. Két
 * implementációja van: MockAdapter (fejlesztéshez, szerver nélkül) és
 * FirebaseAdapter (élesben). A React kód egyiket sem ismeri közvetlenül,
 * ezért a háttér lecserélése nem érinti a felületet.
 */
export interface SyncAdapter {
  createRoom(meta: RoomMeta): Promise<void>
  roomExists(roomCode: string): Promise<boolean>
  joinRoom(roomCode: string, team: TeamInfo): Promise<void>
  markStarted(roomCode: string, round: number, teamId: TeamId): Promise<void>
  submitResult(
    roomCode: string,
    round: number,
    teamId: TeamId,
    result: GameResult,
  ): Promise<void>
  /** Feliratkozás a szoba állapotára. A visszatérési érték leiratkoztat. */
  subscribe(roomCode: string, onState: (state: RoomState | null) => void): () => void
  /** Feliratkozás a kapcsolat állapotára, hogy a UI jelezhesse az offline módot. */
  subscribeStatus(onStatus: (status: ConnectionStatus) => void): () => void
}
