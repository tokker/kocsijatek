// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GAMES } from './registry'
import { DIFFICULTY_ORDER, type HasDifficulty } from './difficulty'
import { createRng } from '../core/rng'
import type { GameResult } from '../core/types'

/**
 * Minden játéknak teljesítenie kell ezeket — ez a keretrendszer
 * szerződése. Egy új játék regisztrálása automatikusan idekerül, tehát
 * nem lehet elfelejteni megírni hozzá az alapellenőrzéseket.
 */

const games = Object.values(GAMES)

function hasDifficulty(item: unknown): item is HasDifficulty {
  return typeof item === 'object' && item !== null && 'difficulty' in item
}

afterEach(cleanup)

describe.each(games.map((game) => [game.id, game] as const))('game contract: %s', (id, game) => {
  it('builds a non-empty item list', () => {
    expect(game.buildItems(createRng('seed')).length).toBeGreaterThan(0)
  })

  it('is deterministic for the same seed', () => {
    expect(game.buildItems(createRng('seed'))).toEqual(game.buildItems(createRng('seed')))
  })

  it('produces a different list for a different seed', () => {
    expect(game.buildItems(createRng('seed-a'))).not.toEqual(game.buildItems(createRng('seed-b')))
  })

  it('never repeats an item within one round', () => {
    const items = game.buildItems(createRng('seed')) as Array<{ id?: string }>
    const ids = items.map((item) => item.id).filter(Boolean)
    // Csak akkor ellenőrizhető, ha a feladatoknak van azonosítójuk.
    if (ids.length === items.length) expect(new Set(ids).size).toBe(ids.length)
  })

  it('never gets easier as the round goes on', () => {
    const items = game.buildItems(createRng('seed'))
    if (!items.every(hasDifficulty)) return
    const rank = items.map((item) => DIFFICULTY_ORDER.indexOf(item.difficulty))
    for (let i = 1; i < rank.length; i++) {
      expect(rank[i], `item ${i} of ${id} is easier than the one before`).toBeGreaterThanOrEqual(
        rank[i - 1],
      )
    }
  })

  it('uses no easy tier', () => {
    const items = game.buildItems(createRng('seed'))
    if (!items.every(hasDifficulty)) return
    for (const item of items) expect(DIFFICULTY_ORDER).toContain(item.difficulty)
  })

  it('renders without crashing', () => {
    const items = game.buildItems(createRng('seed'))
    expect(() =>
      render(<game.Component items={items} durationSec={900} onComplete={vi.fn()} />),
    ).not.toThrow()
  })

  it('does not mark which option is correct before the player commits', () => {
    const items = game.buildItems(createRng('seed'))
    render(<game.Component items={items} durationSec={900} onComplete={vi.fn()} />)

    // A helyes válasz SZÖVEGE jogosan látszik — az egyik gomb felirata az.
    // Amit tilos: bármi, ami megkülönbözteti a jót a rossztól. Ilyen
    // szivárgás osztálynévben vagy data- attribútumban jelenne meg,
    // ezért pontosan oda nézünk, és nem a teljes forrásba.
    const leaky = /^(correct|incorrect|answer|solution|difficulty|right|wrong)$/i
    const revealStyling = /^(bg-green|bg-red)/

    for (const element of document.querySelectorAll<HTMLElement>('*')) {
      for (const token of element.classList) {
        expect(token, `${id} styles an option as revealed too early`).not.toMatch(revealStyling)
        expect(token, `${id} leaks the answer in a class name`).not.toMatch(leaky)
      }
      for (const attribute of element.attributes) {
        if (!attribute.name.startsWith('data-')) continue
        expect(attribute.name, `${id} leaks the answer in a data attribute`).not.toMatch(
          /correct|answer|solution|difficulty/i,
        )
      }
    }
  })

  it('always finishes when the round clock runs out', () => {
    // Ez a legfontosabb szerződés: ha egy játék sosem hívná meg az
    // onComplete-et, a csapat eredménye sosem menne fel, és a kör-kapu
    // ÖRÖKRE megakasztaná a másik autót is.
    vi.useFakeTimers()
    try {
      const onComplete = vi.fn()
      const items = game.buildItems(createRng('seed'))
      render(<game.Component items={items} durationSec={5} onComplete={onComplete} />)

      act(() => {
        vi.advanceTimersByTime(10_000)
      })

      expect(onComplete, `${id} never reported a result`).toHaveBeenCalledTimes(1)

      const result = onComplete.mock.calls[0][0] as GameResult
      expect(result.points).toBeGreaterThanOrEqual(0)
      expect(result.points).toBeLessThanOrEqual(1000)
      expect(Number.isFinite(result.points)).toBe(true)
      expect(typeof result.rawScore).toBe('string')
      expect(Array.isArray(result.items)).toBe(true)
      expect(result.timeMs).toBeGreaterThanOrEqual(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
