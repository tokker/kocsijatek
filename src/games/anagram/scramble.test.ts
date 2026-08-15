import { describe, expect, it } from 'vitest'
import { normalizeGuess, scramble } from './scramble'
import { createRng } from '../../core/rng'
import { ANAGRAM_WORDS } from './words.en'

describe('scramble', () => {
  it('keeps exactly the same letters', () => {
    const scrambled = scramble('ELEPHANT', createRng('s'))
    expect([...scrambled].sort()).toEqual([...'ELEPHANT'].sort())
  })

  it('never returns the original word', () => {
    for (const entry of ANAGRAM_WORDS) {
      for (const seed of ['a', 'b', 'c', 'd', 'e']) {
        expect(scramble(entry.word, createRng(seed)), entry.id).not.toBe(entry.word)
      }
    }
  })

  it('is deterministic for a seed', () => {
    expect(scramble('MOUNTAIN', createRng('s'))).toBe(scramble('MOUNTAIN', createRng('s')))
  })

  it('differs between seeds', () => {
    expect(scramble('MEDITERRANEAN', createRng('s1'))).not.toBe(
      scramble('MEDITERRANEAN', createRng('s2')),
    )
  })

  it('gives up gracefully on a word of identical letters', () => {
    expect(scramble('AAA', createRng('s'))).toBe('AAA')
  })
})

describe('anagram word list', () => {
  it('uses unique ids', () => {
    const ids = ANAGRAM_WORDS.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('names every id after its own word', () => {
    // Egy elcsúszott azonosító nem tör el semmit, csak később
    // megtalálhatatlanná teszi a bejegyzést.
    for (const entry of ANAGRAM_WORDS) {
      expect(entry.id.toUpperCase(), entry.id).toBe(entry.word)
    }
  })

  it('uses only bare uppercase letters', () => {
    for (const entry of ANAGRAM_WORDS) {
      expect(entry.word, entry.id).toMatch(/^[A-Z]+$/)
    }
  })

  it('keeps every word long enough to be worth scrambling', () => {
    for (const entry of ANAGRAM_WORDS) {
      expect(entry.word.length, entry.id).toBeGreaterThanOrEqual(6)
    }
  })

  it('gives every word a category hint', () => {
    for (const entry of ANAGRAM_WORDS) {
      expect(entry.hint.en.trim(), entry.id).not.toBe('')
    }
  })
})

describe('normalizeGuess', () => {
  it('ignores case and surrounding space', () => {
    expect(normalizeGuess('  Elephant ')).toBe('ELEPHANT')
  })

  it('ignores accents typed on a Hungarian keyboard', () => {
    expect(normalizeGuess('élephànt')).toBe('ELEPHANT')
  })

  it('ignores punctuation and spaces inside the word', () => {
    expect(normalizeGuess('light-house')).toBe('LIGHTHOUSE')
  })

  it('returns an empty string for a blank guess', () => {
    expect(normalizeGuess('   ')).toBe('')
  })
})
