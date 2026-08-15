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
 * amikor a tévedés eléri a tűréshatárt.
 *
 * A tűréshatár megadása évszámoknál elengedhetetlen. Alapértelmezésben a
 * válasz nagysága a viszonyítás, ami magnitúdó-kérdéseknél helyes ("hány
 * méter magas"), évszámoknál viszont csődöt mond: 1989 helyett 1950-et
 * tippelve a 39 év tévedés az 1989-hez képest 2%, tehát 98 pont járna
 * egy vadul rossz tippért.
 */
export function proximityPoints(guess: number, actual: number, tolerance?: number): number {
  const error = Math.abs(guess - actual)
  const span = tolerance ?? Math.abs(actual)
  if (span === 0) return error === 0 ? 100 : 0
  const ratio = 1 - error / span
  return Math.round(Math.max(0, ratio) * 100)
}

export function roundWinners(done: Record<TeamId, GameResult>): TeamId[] {
  const entries = Object.entries(done)
  if (entries.length === 0) return []
  const best = Math.max(...entries.map(([, r]) => r.points))
  // Nullponttal senki nem nyert. Enélkül egy olyan körben, ahol egyik autó
  // sem talált el semmit, MINDKETTŐ koronát és győzelmi bónuszt kapott —
  // a felület gyakorlatilag megjutalmazta a rossz tippeket.
  if (best <= 0) return []
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
    // A `round` sosem lehetne null, de ha egy szinkron-háttér mégis lyukas
    // listát ad, az egy renderelés közbeni kivétel — vagyis fekete képernyő,
    // menet közben, út közepén. Egy hiányzó kör kihagyása arányosabb ár.
    const done = round?.done ?? {}
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
