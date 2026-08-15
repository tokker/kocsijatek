export type TeamId = string

export interface TeamInfo {
  id: TeamId
  name: string
  emoji: string
  colorIndex: number
  /** Melyik körnél csatlakozott. A kör-kapu csak az ekkor már bent lévőket várja meg. */
  joinedAtRound: number
}

export interface ScheduleEntry {
  round: number
  gameId: string
  seed: string
}

export interface RoomMeta {
  roomCode: string
  roundSeconds: number
  createdAt: number
  schedule: ScheduleEntry[]
}

export interface GameResult {
  /** 0–1000-re normalizálva, hogy a játéktípusok összemérhetők legyenek. */
  points: number
  /** A játék saját mértéke, megjelenítéshez. Pl. "23 / 30". */
  rawScore: string
  /** Feladatonkénti helyes/helytelen — ez táplálja az összehasonlító rácsot. */
  items: boolean[]
  /** Mennyi időt használt fel a csapat, ezredmásodpercben. */
  timeMs: number
  /** Játékspecifikus extra, pl. a Letter Blitz beírt szavai az egyediség-bónuszhoz. */
  payload?: Record<string, unknown>
}

export interface RoundState {
  started?: Record<TeamId, number>
  done?: Record<TeamId, GameResult>
}

export interface RoomState {
  meta: RoomMeta
  teams: Record<TeamId, TeamInfo>
  rounds: Record<number, RoundState>
}
