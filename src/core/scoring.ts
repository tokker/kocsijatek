import { participatingTeams } from './roundGate'
import type { GameResult, RoomState, TeamId } from './types'

export const MAX_POINTS = 1000
export const WINNER_BONUS = 200

/**
 * Bármely játék saját pontszámát a közös 0–1000 skálára hozza, hogy egy
 * 30 kérdéses kvíz és egy reflexjáték eredménye összemérhető legyen.
 */
export function normalize(earned: number, max: number): number {
  if (max <= 0) return 0
  const ratio = Math.min(1, Math.max(0, earned / max))
  return Math.round(ratio * MAX_POINTS)
}

/**
 * Tippversenyekhez: 100 pont a pontos találatért, onnan lineárisan nullára,
 * amikor a tévedés eléri a valós érték nagyságát.
 */
export function proximityPoints(guess: number, actual: number): number {
  const error = Math.abs(guess - actual)
  if (actual === 0) return error === 0 ? 100 : 0
  const ratio = 1 - error / Math.abs(actual)
  return Math.round(Math.max(0, ratio) * 100)
}

export function roundWinners(done: Record<TeamId, GameResult>): TeamId[] {
  const entries = Object.entries(done)
  if (entries.length === 0) return []
  const best = Math.max(...entries.map(([, r]) => r.points))
  return entries.filter(([, r]) => r.points === best).map(([id]) => id)
}

export interface StandingRow {
  teamId: TeamId
  total: number
  roundsWon: number
  roundsPlayed: number
}

export function standings(state: RoomState): StandingRow[] {
  const rows = new Map<TeamId, StandingRow>()
  for (const team of Object.values(state.teams ?? {})) {
    rows.set(team.id, { teamId: team.id, total: 0, roundsWon: 0, roundsPlayed: 0 })
  }

  for (const [key, round] of Object.entries(state.rounds ?? {})) {
    const roundNumber = Number(key)
    const done = round.done ?? {}
    const expected = participatingTeams(state, roundNumber)

    // Csak a mindenki által lezárt köröket számoljuk bele. Enélkül az
    // állás ugrálna, amíg a másik autó még játszik — és félrevezetne.
    if (expected.length === 0 || !expected.every((t) => done[t.id] != null)) continue

    const winners = new Set(roundWinners(done))
    for (const [teamId, result] of Object.entries(done)) {
      const row = rows.get(teamId)
      if (!row) continue
      row.total += result.points + (winners.has(teamId) ? WINNER_BONUS : 0)
      row.roundsPlayed += 1
      if (winners.has(teamId)) row.roundsWon += 1
    }
  }

  return [...rows.values()].sort((a, b) => b.total - a.total)
}
