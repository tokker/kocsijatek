import { describe, expect, it } from 'vitest'
import { DIFFICULTY_ORDER, mixSize, poolFor, type HasDifficulty, type RoundMix } from './difficulty'
import { ROUND_MIX as EMOJI_MIX } from './emoji'
import { EMOJI_PUZZLES } from './emoji/puzzles.en'
import { ROUND_MIX as FLAGS_MIX } from './flags'
import { FLAG_QUESTIONS } from './flags/flags.en'
import { ROUND_MIX as TRIVIA_MIX } from './trivia'
import { TRIVIA_QUESTIONS } from './trivia/questions.en'

/**
 * Minden feleletválasztós készlet ugyanazokat a tartalmi szabályokat
 * követi. Új játék felvétele ide EGY sor — így nem lehet elfelejteni
 * ellenőrizni egy frissen írt kérdéskészletet.
 */
interface ChoicePool extends HasDifficulty {
  id: string
  choices: { en: string[] }
  correctIndex: number
}

const POOLS: Array<[string, ChoicePool[], RoundMix]> = [
  ['trivia', TRIVIA_QUESTIONS, TRIVIA_MIX],
  ['emoji', EMOJI_PUZZLES, EMOJI_MIX],
  ['flags', FLAG_QUESTIONS, FLAGS_MIX],
]

describe.each(POOLS)('choice pool: %s', (label, pool, mix) => {
  it('uses unique ids', () => {
    const ids = pool.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('offers four distinct choices per item', () => {
    for (const item of pool) {
      expect(item.choices.en, `${label}/${item.id}`).toHaveLength(4)
      expect(new Set(item.choices.en).size, `${label}/${item.id}`).toBe(4)
    }
  })

  it('points correctIndex at a real choice', () => {
    for (const item of pool) {
      expect(item.correctIndex, `${label}/${item.id}`).toBeGreaterThanOrEqual(0)
      expect(item.correctIndex, `${label}/${item.id}`).toBeLessThan(item.choices.en.length)
    }
  })

  it('uses only the three allowed difficulty tiers', () => {
    for (const item of pool) {
      expect(DIFFICULTY_ORDER, `${label}/${item.id}`).toContain(item.difficulty)
    }
  })

  it('has enough items in every tier to build a round', () => {
    for (const [difficulty, count] of mix) {
      expect(poolFor(pool, difficulty).length, `${label}/${difficulty}`).toBeGreaterThanOrEqual(count)
    }
  })

  it('keeps a spare margin so consecutive rounds differ', () => {
    for (const [difficulty, count] of mix) {
      expect(poolFor(pool, difficulty).length, `${label}/${difficulty}`).toBeGreaterThan(count)
    }
  })

  it('builds a round of a sensible length for fifteen minutes', () => {
    const size = mixSize(mix)
    expect(size, label).toBeGreaterThanOrEqual(18)
    expect(size, label).toBeLessThanOrEqual(40)
  })
})
