import { describe, expect, it } from 'vitest'
import { WINNER_BONUS, normalize, proximityPoints, roundWinners, standings } from './scoring'
import type { GameResult, RoomState } from './types'

const result = (points: number): GameResult => ({
  points,
  rawScore: `${points}`,
  items: [],
  timeMs: 0,
})

describe('normalize', () => {
  it('maps a perfect score to 1000', () => {
    expect(normalize(30, 30)).toBe(1000)
  })

  it('maps zero to zero', () => {
    expect(normalize(0, 30)).toBe(0)
  })

  it('rounds to the nearest integer', () => {
    expect(normalize(1, 3)).toBe(333)
  })

  it('never exceeds 1000 even if earned is above max', () => {
    expect(normalize(40, 30)).toBe(1000)
  })

  it('never goes below zero', () => {
    expect(normalize(-5, 30)).toBe(0)
  })

  it('returns 0 when max is 0 instead of NaN', () => {
    expect(normalize(0, 0)).toBe(0)
  })
})

describe('proximityPoints', () => {
  it('gives full points for an exact guess', () => {
    expect(proximityPoints(100, 100)).toBe(100)
  })

  it('gives zero when the guess is off by the actual value or more', () => {
    expect(proximityPoints(0, 100)).toBe(0)
    expect(proximityPoints(500, 100)).toBe(0)
  })

  it('gives partial points for a close guess', () => {
    expect(proximityPoints(90, 100)).toBe(90)
  })

  it('is symmetric around the actual value', () => {
    expect(proximityPoints(90, 100)).toBe(proximityPoints(110, 100))
  })

  it('handles an actual value of zero without dividing by zero', () => {
    expect(proximityPoints(0, 0)).toBe(100)
    expect(proximityPoints(5, 0)).toBe(0)
  })

  it('scores against an explicit tolerance when one is given', () => {
    expect(proximityPoints(1989, 1989, 25)).toBe(100)
    expect(proximityPoints(1964, 1989, 25)).toBe(0)
    expect(proximityPoints(1976, 1989, 25)).toBe(48)
  })

  it('makes a wild year guess worthless, which the default cannot', () => {
    // Tűréshatár nélkül egy 39 éves tévedés 98 pontot érne, mert az
    // 1989-hez képest csak 2% — ezért kötelező évszámnál a tűréshatár.
    expect(proximityPoints(1950, 1989)).toBeGreaterThan(90)
    expect(proximityPoints(1950, 1989, 25)).toBe(0)
  })

  it('treats a zero tolerance as demanding an exact answer', () => {
    expect(proximityPoints(10, 10, 0)).toBe(100)
    expect(proximityPoints(11, 10, 0)).toBe(0)
  })
})

describe('roundWinners', () => {
  it('returns the single highest scoring team', () => {
    expect(roundWinners({ car1: result(700), car2: result(500) })).toEqual(['car1'])
  })

  it('returns every team on a tie', () => {
    expect(roundWinners({ car1: result(700), car2: result(700) }).sort()).toEqual(['car1', 'car2'])
  })

  it('returns an empty array when nobody finished', () => {
    expect(roundWinners({})).toEqual([])
  })
})

describe('standings', () => {
  const state: RoomState = {
    meta: { roomCode: 'A', roundSeconds: 900, createdAt: 0, schedule: [] },
    teams: {
      car1: { id: 'car1', name: 'A', emoji: '🚗', colorIndex: 0, joinedAtRound: 1 },
      car2: { id: 'car2', name: 'B', emoji: '🚙', colorIndex: 1, joinedAtRound: 1 },
    },
    rounds: {
      1: { done: { car1: result(700), car2: result(500) } },
      2: { done: { car1: result(300), car2: result(900) } },
    },
  }

  it('adds the winner bonus to each round winner', () => {
    const table = standings(state)
    expect(table.find((r) => r.teamId === 'car1')!.total).toBe(700 + WINNER_BONUS + 300)
    expect(table.find((r) => r.teamId === 'car2')!.total).toBe(500 + 900 + WINNER_BONUS)
  })

  it('sorts by total descending', () => {
    expect(standings(state).map((r) => r.teamId)).toEqual(['car2', 'car1'])
  })

  it('counts rounds won and played', () => {
    const car1 = standings(state).find((r) => r.teamId === 'car1')!
    expect(car1.roundsWon).toBe(1)
    expect(car1.roundsPlayed).toBe(2)
  })

  it('ignores rounds that are not finished by everyone', () => {
    const partial: RoomState = {
      ...state,
      rounds: { ...state.rounds, 3: { done: { car1: result(999) } } },
    }
    const car1 = standings(partial).find((r) => r.teamId === 'car1')!
    expect(car1.total).toBe(700 + WINNER_BONUS + 300)
    expect(car1.roundsPlayed).toBe(2)
  })

  it('lists every team even before any round is finished', () => {
    const fresh: RoomState = { ...state, rounds: {} }
    expect(standings(fresh)).toHaveLength(2)
    expect(standings(fresh).every((r) => r.total === 0)).toBe(true)
  })
})
