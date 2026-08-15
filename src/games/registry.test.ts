import { describe, expect, it } from 'vitest'
import { GAMES, GAME_IDS, getGame } from './registry'
import { createRng } from '../core/rng'

describe('game registry', () => {
  it('has at least one game', () => {
    expect(GAME_IDS.length).toBeGreaterThan(0)
  })

  it('uses unique ids', () => {
    expect(new Set(GAME_IDS).size).toBe(GAME_IDS.length)
  })

  it('matches every id to its module key', () => {
    for (const [key, game] of Object.entries(GAMES)) {
      expect(game.id).toBe(key)
    }
  })

  it('gives every game an icon and i18n keys', () => {
    for (const game of Object.values(GAMES)) {
      expect(game.icon, `${game.id} has no icon`).toBeTruthy()
      expect(game.titleKey).toMatch(/^games\./)
      expect(game.descriptionKey).toMatch(/^games\./)
    }
  })

  it('builds a non-empty deterministic item list for every game', () => {
    for (const game of Object.values(GAMES)) {
      const a = game.buildItems(createRng('seed-1'))
      const b = game.buildItems(createRng('seed-1'))
      expect(a.length, `${game.id} produced no items`).toBeGreaterThan(0)
      expect(a, `${game.id} is not deterministic`).toEqual(b)
    }
  })

  it('varies the item list between seeds for every game', () => {
    for (const game of Object.values(GAMES)) {
      const a = game.buildItems(createRng('seed-1'))
      const b = game.buildItems(createRng('seed-2'))
      expect(a, `${game.id} ignores its seed`).not.toEqual(b)
    }
  })

  it('returns the requested game', () => {
    expect(getGame('trivia').id).toBe('trivia')
  })

  it('throws for an unknown id', () => {
    expect(() => getGame('nope')).toThrow()
  })
})
