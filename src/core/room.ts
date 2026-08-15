import { createRng } from './rng'
import type { ScheduleEntry } from './types'

/**
 * Az O, I, 0 és 1 szándékosan kimarad: a szobakódot telefonon fogják
 * bediktálni a másik autónak, és ezek hallás után összekeverhetők.
 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 4

export function generateRoomCode(): string {
  const bytes = new Uint32Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase()
}

export function isValidRoomCode(input: string): boolean {
  const code = normalizeRoomCode(input)
  if (code.length !== CODE_LENGTH) return false
  return [...code].every((c) => CODE_ALPHABET.includes(c))
}

/**
 * Végigjátssza az összes játékot, mielőtt bármelyiket megismételné.
 * Egy 12 órás úton ez azt jelenti, hogy nem kapjátok ugyanazt kétszer,
 * amíg a többit ki nem próbáltátok.
 */
export function buildSchedule(
  roomCode: string,
  gameIds: readonly string[],
  roundCount: number,
): ScheduleEntry[] {
  if (gameIds.length === 0) throw new Error('buildSchedule needs at least one game')

  const schedule: ScheduleEntry[] = []
  let pool: string[] = []
  let cycle = 0

  for (let round = 1; round <= roundCount; round++) {
    if (pool.length === 0) {
      pool = createRng(`${roomCode}-cycle${cycle++}`).shuffle(gameIds)
    }
    const gameId = pool.shift()!
    schedule.push({ round, gameId, seed: `${roomCode}-r${round}-${gameId}` })
  }

  return schedule
}
