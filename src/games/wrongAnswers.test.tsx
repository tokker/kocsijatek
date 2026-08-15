// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GAMES } from './registry'
import { createRng } from '../core/rng'
import type { GameResult } from '../core/types'

afterEach(cleanup)

/**
 * A jelentett hiba: "a másik csapatnak azt írta, hogy maximum pontot
 * kapott, pedig rosszul tippelt". Ez a teszt szándékosan MINDENT
 * elront, és megnézi, mit jelent a játék az eredményről.
 */
describe.each(['trivia', 'emoji', 'flags'] as const)('%s answered entirely wrong', (id) => {
  it('reports zero points and no correct items', () => {
    vi.useFakeTimers()
    try {
      const game = GAMES[id]
      const items = game.buildItems(createRng('seed')) as Array<{ correctIndex: number }>
      const onComplete = vi.fn()

      const { container } = render(
        <game.Component items={items} durationSec={900} onComplete={onComplete} />,
      )

      for (let q = 0; q < items.length; q++) {
        const buttons = [...container.querySelectorAll('button')]
        if (buttons.length === 0) break
        // Mindig egy BIZTOSAN rossz gombot nyomunk meg.
        const wrong = buttons.findIndex((_, i) => i !== items[q].correctIndex)
        act(() => { buttons[wrong].click() })
        act(() => { vi.advanceTimersByTime(1000) })
      }

      act(() => { vi.advanceTimersByTime(1_000_000) })

      expect(onComplete).toHaveBeenCalled()
      const result = onComplete.mock.calls[0][0] as GameResult
      expect(result.items.some(Boolean), `${id} marked a wrong answer correct`).toBe(false)
      expect(result.points, `${id} awarded points for all-wrong answers`).toBe(0)
      expect(result.rawScore).toMatch(/^0 /)
    } finally {
      vi.useRealTimers()
    }
  })
})
