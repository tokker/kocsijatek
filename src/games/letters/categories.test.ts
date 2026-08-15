import { describe, expect, it } from 'vitest'
import { buildChallenges, CATEGORIES, categoryById } from './categories'
import { createRng } from '../../core/rng'

describe('word lists', () => {
  it.each(CATEGORIES.map((category) => [category.id, category] as const))(
    '%s parses into a usable set',
    (id, category) => {
      expect(category.words.size, id).toBeGreaterThan(40)
    },
  )

  it('normalises every entry to bare uppercase letters', () => {
    for (const category of CATEGORIES) {
      for (const word of category.words) {
        expect(word, `${category.id}: ${word}`).toMatch(/^[A-Z]+$/)
      }
    }
  })

  it('has no accidental duplicates between spelling variants', () => {
    for (const category of CATEGORIES) {
      // A Set már deduplikál; ez azt őrzi, hogy a lista ne legyen üres
      // csupa ismétlés miatt.
      expect(category.words.size, category.id).toBeGreaterThan(30)
    }
  })

  it('finds a category by id', () => {
    expect(categoryById('countries')?.words.has('HUNGARY')).toBe(true)
    expect(categoryById('nope')).toBeUndefined()
  })
})

describe('buildChallenges', () => {
  it('is deterministic for a seed', () => {
    expect(buildChallenges(createRng('s'))).toEqual(buildChallenges(createRng('s')))
  })

  it('differs between seeds', () => {
    expect(buildChallenges(createRng('s1'))).not.toEqual(buildChallenges(createRng('s2')))
  })

  it('builds the requested number of challenges', () => {
    expect(buildChallenges(createRng('s'))).toHaveLength(6)
  })

  it('never sets a letter with too few words behind it', () => {
    // Egy két szavas betű nem nehéz feladat, hanem elrontott kör — és a
    // közös seed miatt mindkét autót egyformán sújtaná.
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      for (const challenge of buildChallenges(createRng(seed))) {
        expect(challenge.available, `${challenge.id}`).toBeGreaterThanOrEqual(6)
      }
    }
  })

  it('reports the true number of available words', () => {
    for (const challenge of buildChallenges(createRng('s'))) {
      const category = categoryById(challenge.categoryId)!
      const actual = [...category.words].filter((word) => word.startsWith(challenge.letter)).length
      expect(actual, challenge.id).toBe(challenge.available)
    }
  })

  it('does not make you list the same category six times', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      const counts = new Map<string, number>()
      for (const challenge of buildChallenges(createRng(seed))) {
        counts.set(challenge.categoryId, (counts.get(challenge.categoryId) ?? 0) + 1)
      }
      for (const [categoryId, count] of counts) {
        expect(count, `${seed}/${categoryId}`).toBeLessThanOrEqual(2)
      }
    }
  })

  it('never repeats the same category and letter pair', () => {
    const ids = buildChallenges(createRng('s')).map((challenge) => challenge.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
