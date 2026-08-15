import { describe, expect, it } from 'vitest'
import triviaGame from './index'
import { TRIVIA_QUESTIONS } from './questions.en'
import { createRng } from '../../core/rng'

/**
 * Az általános szabályokat a gameContract.test.tsx és a
 * choicePools.test.ts ellenőrzi minden játékra. Itt csak az marad,
 * ami kifejezetten a triviára jellemző.
 */
describe('trivia content', () => {
  it('ends every prompt with a question mark', () => {
    for (const question of TRIVIA_QUESTIONS) {
      expect(question.prompt.en.endsWith('?'), question.id).toBe(true)
    }
  })

  it('covers a spread of categories rather than one topic', () => {
    const categories = new Set(TRIVIA_QUESTIONS.map((q) => q.category))
    expect(categories.size).toBeGreaterThanOrEqual(5)
  })

  it('leaves room for the Hungarian translation without code changes', () => {
    for (const question of TRIVIA_QUESTIONS) {
      expect(question.prompt, question.id).toHaveProperty('en')
      expect(question.choices, question.id).toHaveProperty('en')
    }
  })
})

describe('trivia round shape', () => {
  it('builds a 30 question round', () => {
    expect(triviaGame.buildItems(createRng('s'))).toHaveLength(30)
  })

  it('makes the double-weighted closing questions the hardest ones', () => {
    const items = triviaGame.buildItems(createRng('s'))
    for (const question of items.slice(25)) {
      expect(question.difficulty).toBe('brutal')
    }
  })
})
