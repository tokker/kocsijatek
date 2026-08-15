// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import lettersGame, { SECONDS_PER_CHALLENGE } from './index'
import { createRng } from '../../core/rng'

const items = lettersGame.buildItems(createRng('seed'))

function renderRound(onComplete = vi.fn()) {
  render(<lettersGame.Component items={items} durationSec={900} onComplete={onComplete} />)
  return onComplete
}

/** A "3 / 6" alakú előrehaladás-jelzőből az aktuális sorszám. */
function currentPosition(): number {
  const label = screen.getByText(/^\d+ \/ \d+$/).textContent!
  return Number(label.split('/')[0].trim())
}

describe('Letter Blitz challenge clock', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('starts on the first challenge', () => {
    renderRound()
    expect(currentPosition()).toBe(1)
  })

  it('moves on when a challenge runs out of time', () => {
    renderRound()
    act(() => {
      vi.advanceTimersByTime(SECONDS_PER_CHALLENGE * 1000 + 500)
    })
    expect(currentPosition()).toBe(2)
  })

  it('keeps advancing on every later challenge, not just the first', () => {
    // Ez a lényegi eset. Ha a feladat órája nem indul újra, az első
    // lejárat után beragad a második feladat a kör végéig — és a
    // hiba csak a harmadik feladatnál derülne ki.
    renderRound()
    for (let expected = 2; expected <= 4; expected++) {
      act(() => {
        vi.advanceTimersByTime(SECONDS_PER_CHALLENGE * 1000 + 500)
      })
      expect(currentPosition(), `after ${expected - 1} expiries`).toBe(expected)
    }
  })

  /**
   * Feladatonként külön léptetjük az időt. Egyetlen nagy ugrás nem
   * működne: a következő panel effektusa — és vele az órája — csak az
   * act() blokk lezárásakor fut le, tehát a hátralévő idő nem esne bele.
   */
  const expireEveryChallenge = () => {
    for (let i = 0; i < items.length; i++) {
      act(() => {
        vi.advanceTimersByTime(SECONDS_PER_CHALLENGE * 1000 + 500)
      })
    }
  }

  it('reports a result after the last challenge expires', () => {
    const onComplete = renderRound()
    expireEveryChallenge()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('carries the typed words in the payload for the uniqueness bonus', () => {
    const onComplete = renderRound()
    expireEveryChallenge()
    const result = onComplete.mock.calls[0][0]
    const entries = (result.payload as { entries: Array<{ key: string; words: string[] }> }).entries
    expect(entries).toHaveLength(items.length)
    expect(entries.map((entry) => entry.key)).toEqual(items.map((item) => item.id))
  })
})
