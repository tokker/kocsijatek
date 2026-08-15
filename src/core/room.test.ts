import { describe, expect, it } from 'vitest'
import { buildSchedule, generateRoomCode, isValidRoomCode, normalizeRoomCode } from './room'

describe('generateRoomCode', () => {
  it('returns four characters', () => {
    expect(generateRoomCode()).toHaveLength(4)
  })

  it('avoids characters that are easy to misread aloud', () => {
    // A kódot telefonon fogják bediktálni a másik autónak.
    for (let i = 0; i < 300; i++) {
      expect(generateRoomCode()).not.toMatch(/[OI01]/)
    }
  })

  it('is uppercase alphanumeric', () => {
    expect(generateRoomCode()).toMatch(/^[A-Z2-9]{4}$/)
  })

  it('does not return the same code every time', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateRoomCode()))
    expect(codes.size).toBeGreaterThan(1)
  })
})

describe('normalizeRoomCode', () => {
  it('trims and uppercases', () => {
    expect(normalizeRoomCode('  ab2c ')).toBe('AB2C')
  })
})

describe('isValidRoomCode', () => {
  it('accepts a well formed code', () => {
    expect(isValidRoomCode('AB2C')).toBe(true)
  })

  it('accepts lowercase input by normalising it', () => {
    expect(isValidRoomCode('ab2c')).toBe(true)
  })

  it('rejects the wrong length', () => {
    expect(isValidRoomCode('AB2')).toBe(false)
    expect(isValidRoomCode('AB2CD')).toBe(false)
  })

  it('rejects ambiguous characters', () => {
    expect(isValidRoomCode('AB0C')).toBe(false)
    expect(isValidRoomCode('ABIC')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidRoomCode('')).toBe(false)
  })
})

describe('buildSchedule', () => {
  it('creates the requested number of rounds', () => {
    expect(buildSchedule('AB2C', ['a', 'b', 'c'], 10)).toHaveLength(10)
  })

  it('numbers rounds from 1', () => {
    expect(buildSchedule('AB2C', ['a', 'b'], 4).map((s) => s.round)).toEqual([1, 2, 3, 4])
  })

  it('never repeats a game until every game has been played once', () => {
    const first = buildSchedule('AB2C', ['a', 'b', 'c', 'd'], 4).map((s) => s.gameId)
    expect(new Set(first).size).toBe(4)
  })

  it('starts a fresh cycle after exhausting the pool', () => {
    const schedule = buildSchedule('AB2C', ['a', 'b', 'c'], 6).map((s) => s.gameId)
    expect(new Set(schedule.slice(0, 3)).size).toBe(3)
    expect(new Set(schedule.slice(3, 6)).size).toBe(3)
  })

  it('is deterministic for the same room code', () => {
    expect(buildSchedule('AB2C', ['a', 'b', 'c'], 9)).toEqual(
      buildSchedule('AB2C', ['a', 'b', 'c'], 9),
    )
  })

  it('differs between room codes', () => {
    const a = buildSchedule('AB2C', ['a', 'b', 'c', 'd'], 4).map((s) => s.gameId)
    const b = buildSchedule('ZZ9X', ['a', 'b', 'c', 'd'], 4).map((s) => s.gameId)
    expect(a).not.toEqual(b)
  })

  it('gives every round a distinct seed', () => {
    const seeds = buildSchedule('AB2C', ['a', 'b'], 8).map((s) => s.seed)
    expect(new Set(seeds).size).toBe(8)
  })

  it('handles a single game without looping forever', () => {
    expect(buildSchedule('AB2C', ['only'], 3).map((s) => s.gameId)).toEqual([
      'only',
      'only',
      'only',
    ])
  })

  it('throws when there are no games', () => {
    expect(() => buildSchedule('AB2C', [], 4)).toThrow()
  })
})
