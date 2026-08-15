import type { RoomState, TeamId, TeamInfo } from './types'

export type TeamRoundStatus = 'not-started' | 'playing' | 'done'

/**
 * Azok a csapatok, akiknek egy adott körben játszaniuk kell.
 * Aki később szállt be, arra nem várunk a korábbi köröknél — enélkül
 * egy menet közben csatlakozó autó örökre megakasztaná a játékot.
 */
export function participatingTeams(state: RoomState, round: number): TeamInfo[] {
  return Object.values(state.teams ?? {}).filter((t) => t.joinedAtRound <= round)
}

/**
 * A rendszer központi szabálya: az N. kör csak akkor nyílik ki, ha az
 * (N-1). körben MINDEN érintett csapat végzett.
 *
 * Az, hogy ki mikor KEZDTE a kört, teljesen közömbös — pont ez teszi
 * lehetővé, hogy az egyik autó megálljon pihenni, és később kezdjen,
 * anélkül hogy a másik elhúzna mellette.
 */
export function isRoundUnlocked(state: RoomState, round: number): boolean {
  if (round <= 1) return true

  const previous = round - 1
  const teams = participatingTeams(state, previous)
  if (teams.length === 0) return false

  const done = state.rounds?.[previous]?.done ?? {}
  return teams.every((team) => done[team.id] != null)
}

export function teamRoundStatus(
  state: RoomState,
  round: number,
  teamId: TeamId,
): TeamRoundStatus {
  const roundState = state.rounds?.[round]
  if (roundState?.done?.[teamId] != null) return 'done'
  if (roundState?.started?.[teamId] != null) return 'playing'
  return 'not-started'
}

/** Kikre várunk még — ezt írja ki a várakozó képernyő. */
export function teamsStillPlaying(state: RoomState, round: number): TeamInfo[] {
  return participatingTeams(state, round).filter(
    (team) => teamRoundStatus(state, round, team.id) !== 'done',
  )
}
