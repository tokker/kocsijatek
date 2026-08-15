import { describe, expect, it } from 'vitest'
import {
  itemDifficulty,
  turningPoint,
  uniquenessBonus,
  wordEntriesOf,
  type TeamRound,
} from './compare'
import type { GameResult } from './types'

const result = (items: boolean[], extra: Partial<GameResult> = {}): GameResult => ({
  points: 500,
  rawScore: 'x',
  items,
  timeMs: 1000,
  ...extra,
})

describe('turningPoint', () => {
  it('finds the item only one team solved', () => {
    const rounds: TeamRound[] = [
      { teamId: 'car1', result: result([true, true, false]) },
      { teamId: 'car2', result: result([true, false, false]) },
    ]
    expect(turningPoint(rounds)).toEqual({ index: 1, teamId: 'car1' })
  })

  it('prefers the later item when several were exclusive', () => {
    // A kései feladatok súlyosabbak, ott dől el a kör.
    const rounds: TeamRound[] = [
      { teamId: 'car1', result: result([true, false, false, false]) },
      { teamId: 'car2', result: result([false, false, false, true]) },
    ]
    expect(turningPoint(rounds)).toEqual({ index: 3, teamId: 'car2' })
  })

  it('ignores items both teams got', () => {
    const rounds: TeamRound[] = [
      { teamId: 'car1', result: result([true, true]) },
      { teamId: 'car2', result: result([true, true]) },
    ]
    expect(turningPoint(rounds)).toBeNull()
  })

  it('ignores items nobody got', () => {
    const rounds: TeamRound[] = [
      { teamId: 'car1', result: result([false, false]) },
      { teamId: 'car2', result: result([false, false]) },
    ]
    expect(turningPoint(rounds)).toBeNull()
  })

  it('returns null with a single team', () => {
    expect(turningPoint([{ teamId: 'car1', result: result([true]) }])).toBeNull()
  })

  it('copes with teams that reported different item counts', () => {
    const rounds: TeamRound[] = [
      { teamId: 'car1', result: result([true, true, true]) },
      { teamId: 'car2', result: result([true]) },
    ]
    expect(turningPoint(rounds)).toEqual({ index: 2, teamId: 'car1' })
  })
})

describe('itemDifficulty', () => {
  it('counts how many teams solved each item', () => {
    const rounds: TeamRound[] = [
      { teamId: 'car1', result: result([true, false, true]) },
      { teamId: 'car2', result: result([true, false, false]) },
    ]
    expect(itemDifficulty(rounds)).toEqual([2, 0, 1])
  })

  it('returns an empty list with no rounds', () => {
    expect(itemDifficulty([])).toEqual([])
  })
})

describe('uniquenessBonus', () => {
  it('pays more for a word the other team missed', () => {
    const rows = uniquenessBonus({
      car1: [{ key: 'countries-B', words: ['BRAZIL', 'BELGIUM'] }],
      car2: [{ key: 'countries-B', words: ['BRAZIL'] }],
    })
    const car1 = rows.find((row) => row.teamId === 'car1')!
    const car2 = rows.find((row) => row.teamId === 'car2')!

    expect(car1).toMatchObject({ shared: 1, unique: 1, bonus: 1 + 3 })
    expect(car2).toMatchObject({ shared: 1, unique: 0, bonus: 1 })
  })

  it('treats the same word under different letters separately', () => {
    const rows = uniquenessBonus({
      car1: [{ key: 'animals-B', words: ['BADGER'] }],
      car2: [{ key: 'animals-C', words: ['BADGER'] }],
    })
    // Nem ugyanaz a feladat, tehát mindkettő egyedi.
    expect(rows.every((row) => row.unique === 1)).toBe(true)
  })

  it('handles a team that wrote nothing', () => {
    const rows = uniquenessBonus({
      car1: [{ key: 'k', words: ['ONE'] }],
      car2: [{ key: 'k', words: [] }],
    })
    expect(rows.find((row) => row.teamId === 'car2')!.bonus).toBe(0)
    expect(rows.find((row) => row.teamId === 'car1')!.bonus).toBe(3)
  })

  it('returns a row per team even with no words at all', () => {
    expect(uniquenessBonus({ car1: [], car2: [] })).toHaveLength(2)
  })
})

describe('wordEntriesOf', () => {
  it('pulls the word lists out of the results', () => {
    const rounds: TeamRound[] = [
      {
        teamId: 'car1',
        result: result([true], { payload: { entries: [{ key: 'k', words: ['A'] }] } }),
      },
      {
        teamId: 'car2',
        result: result([true], { payload: { entries: [{ key: 'k', words: ['B'] }] } }),
      },
    ]
    expect(wordEntriesOf(rounds)).toEqual({
      car1: [{ key: 'k', words: ['A'] }],
      car2: [{ key: 'k', words: ['B'] }],
    })
  })

  it('returns null for games that carry no word lists', () => {
    expect(wordEntriesOf([{ teamId: 'car1', result: result([true]) }])).toBeNull()
  })
})
