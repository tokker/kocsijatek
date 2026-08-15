import type { GameResult, TeamId } from './types'

export interface TeamRound {
  teamId: TeamId
  result: GameResult
}

/**
 * A kör fordulópontja: az a feladat, ahol egyetlen csapat járt jól, és
 * ez a legtöbbet számított.
 *
 * A kései feladatok súlyosabbak — a legtöbb játékban az utolsó öt dupla
 * pontot ér —, ezért azonos "kizárólagosság" mellett a későbbi nyer.
 */
export function turningPoint(rounds: TeamRound[]): { index: number; teamId: TeamId } | null {
  if (rounds.length < 2) return null

  const length = Math.max(...rounds.map((entry) => entry.result.items.length))
  let best: { index: number; teamId: TeamId } | null = null

  for (let index = 0; index < length; index++) {
    const solvers = rounds.filter((entry) => entry.result.items[index] === true)
    // Csak akkor fordulópont, ha pontosan egy csapat oldotta meg.
    if (solvers.length !== 1) continue
    best = { index, teamId: solvers[0].teamId }
  }

  return best
}

/** Feladatonként hány csapat oldotta meg — ebből látszik, mi volt nehéz. */
export function itemDifficulty(rounds: TeamRound[]): number[] {
  const length = Math.max(0, ...rounds.map((entry) => entry.result.items.length))
  return Array.from(
    { length },
    (_, index) => rounds.filter((entry) => entry.result.items[index] === true).length,
  )
}

export interface WordEntry {
  key: string
  words: string[]
}

export interface UniquenessRow {
  teamId: TeamId
  shared: number
  unique: number
  bonus: number
}

export const SHARED_WORD_POINTS = 1
export const UNIQUE_WORD_POINTS = 3

/**
 * Egyediség-bónusz a Letter Blitz-hez.
 *
 * Amit mindkét autó leírt, az egy pontot ér; amit csak az egyik, hármat.
 * Ez tisztán string-összehasonlítás, tehát nem ítélkezés — és arra
 * ösztönöz, hogy ne a kézenfekvőt írjátok le.
 *
 * Csak a kör lezárása után számolható, amikor MINDKÉT csapat listája
 * megvan; ezért nem a játékban dől el, hanem itt.
 */
export function uniquenessBonus(
  entriesByTeam: Record<TeamId, WordEntry[]>,
): UniquenessRow[] {
  const teamIds = Object.keys(entriesByTeam)

  /** Feladatonként, szavanként: kik írták le. */
  const owners = new Map<string, Set<TeamId>>()
  for (const teamId of teamIds) {
    for (const entry of entriesByTeam[teamId] ?? []) {
      for (const word of entry.words) {
        const key = `${entry.key}::${word}`
        if (!owners.has(key)) owners.set(key, new Set())
        owners.get(key)!.add(teamId)
      }
    }
  }

  return teamIds.map((teamId) => {
    let shared = 0
    let unique = 0

    for (const entry of entriesByTeam[teamId] ?? []) {
      for (const word of entry.words) {
        const holders = owners.get(`${entry.key}::${word}`)!
        if (holders.size > 1) shared += 1
        else unique += 1
      }
    }

    return {
      teamId,
      shared,
      unique,
      bonus: shared * SHARED_WORD_POINTS + unique * UNIQUE_WORD_POINTS,
    }
  })
}

/** Kinyeri a szólistákat az eredményekből, ha a játék adott ilyet. */
export function wordEntriesOf(rounds: TeamRound[]): Record<TeamId, WordEntry[]> | null {
  const out: Record<TeamId, WordEntry[]> = {}
  let found = false

  for (const { teamId, result } of rounds) {
    const entries = (result.payload as { entries?: WordEntry[] } | undefined)?.entries
    if (!entries) continue
    out[teamId] = entries
    found = true
  }

  return found ? out : null
}
