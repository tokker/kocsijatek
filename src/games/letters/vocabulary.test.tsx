// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import lettersGame from './index'
import { CATEGORIES, buildChallenges, type Challenge } from './categories'
import { matchesWord } from '../text'
import { createRng } from '../../core/rng'

afterEach(cleanup)

function challengeFor(categoryId: string, letter: string): Challenge {
  const cat = CATEGORIES.find((c) => c.id === categoryId)!
  return {
    id: `${categoryId}-${letter}`,
    categoryId,
    categoryName: cat.name.en,
    letter,
    available: [...cat.words].filter((w) => w.startsWith(letter)).length,
  }
}

/** Beírja a szót, és megmondja, elfogadta-e a játék. */
function tryWord(categoryId: string, letter: string, word: string): boolean {
  const { container } = render(
    <lettersGame.Component
      items={[challengeFor(categoryId, letter)]}
      durationSec={900}
      onComplete={vi.fn()}
    />,
  )
  const input = container.querySelector('input') as HTMLInputElement
  fireEvent.change(input, { target: { value: word } })
  fireEvent.keyDown(input, { key: 'Enter' })
  const accepted = container.textContent?.includes(word.toUpperCase().replace(/[^A-Z]/g, '')) ?? false
  cleanup()
  return accepted
}

/**
 * A jelentett hiba: "T-nél semmilyen válasz nem működik". A kód rendben
 * volt — a szótár nem: a listák a ritkaságok felé húztak, és pont a
 * kézenfekvő válaszok hiányoztak belőlük. Ételnél hét T-szó volt, és
 * egyik sem az, amit bárki elsőre mondana.
 */
describe('the answers a real player actually gives for T', () => {
  const cases: Array<[string, string[]]> = [
    ['food', ['Tea', 'Toast', 'Taco', 'Turkey', 'Tart', 'Toffee', 'Tortilla', 'Tiramisu', 'Tequila', 'Tomato', 'Tuna', 'Tofu']],
    ['animals', ['Tiger', 'Turtle', 'Toad', 'Tuna', 'Turkey', 'Trout', 'Termite', 'Tarantula', 'Tortoise', 'Tern']],
    ['capitals', ['Tokyo', 'Tirana', 'Taipei', 'Thimphu', 'Tegucigalpa', 'Tallinn', 'Tehran', 'Tunis']],
    ['countries', ['Thailand', 'Turkey', 'Turkiye', 'Tunisia', 'Togo', 'Tonga', 'Taiwan']],
    ['cars', ['Tesla', 'Toyota', 'Tata', 'Tatra', 'Triumph', 'Trabant']],
  ]

  it.each(cases)('%s accepts the obvious T answers', (categoryId, words) => {
    const rejected = words.filter((w) => !tryWord(categoryId, 'T', w))
    expect(rejected).toEqual([])
  })
})

/** A T volt a bejelentett eset, de a szótár minden betűnél sovány volt. */
describe('the obvious answers for other letters', () => {
  const cases: Array<[string, string, string[]]> = [
    ['animals', 'B', ['Bear', 'Bee', 'Bat', 'Beetle', 'Badger']],
    ['animals', 'S', ['Shark', 'Snake', 'Sheep', 'Spider', 'Squirrel', 'Seal']],
    ['animals', 'C', ['Cat', 'Cow', 'Crab', 'Camel', 'Chicken']],
    ['animals', 'M', ['Mouse', 'Monkey', 'Mole', 'Moose']],
    ['food', 'C', ['Cheese', 'Chocolate', 'Coffee', 'Cake', 'Chicken']],
    ['food', 'P', ['Pizza', 'Potato', 'Pasta', 'Pear', 'Pepper']],
    ['capitals', 'B', ['Berlin', 'Budapest', 'Brussels', 'Bangkok']],
  ]

  it.each(cases)('%s / %s', (categoryId, letter, words) => {
    const rejected = words.filter((w) => !tryWord(categoryId, letter, w))
    expect(rejected).toEqual([])
  })
})

describe('plural tolerance', () => {
  it('accepts a plural whose singular is in the list', () => {
    const animals = CATEGORIES.find((c) => c.id === 'animals')!.words
    expect(matchesWord(animals, 'TIGERS')).toBe(true)
    expect(matchesWord(animals, 'TIGER')).toBe(true)
  })

  it('still refuses a word that is simply not in the list', () => {
    const animals = CATEGORIES.find((c) => c.id === 'animals')!.words
    expect(matchesWord(animals, 'TRICERATOPS')).toBe(false)
    expect(matchesWord(animals, 'BLORPS')).toBe(false)
  })

  it('accepts a plural through the game itself', () => {
    expect(tryWord('animals', 'T', 'Tigers')).toBe(true)
  })
})

/** Minden feladható betűhöz legyen elég valódi szó, nem csak a küszöb. */
it('every reachable challenge has a workable number of answers', () => {
  const seen = new Map<string, Challenge>()
  for (let s = 0; s < 200; s++) {
    for (const c of buildChallenges(createRng(`s${s}`))) seen.set(c.id, c)
  }
  const thin = [...seen.values()].filter((c) => c.available < 6)
  expect(thin.map((c) => `${c.id}:${c.available}`)).toEqual([])
})
