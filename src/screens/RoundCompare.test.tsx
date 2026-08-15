// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { RoundCompare } from './RoundCompare'
import { LanguageProvider } from '../i18n'
import { normalizeRoomState } from '../sync/normalize'
import type { RoomState } from '../core/types'

/**
 * A kör-összehasonlító az első olyan képernyő, ami MÁSIK csapat Firebase-ből
 * visszaolvasott eredményét rendereli. Minden korábbi teszt friss, mock
 * alakú szobával futott, ezért ez az út sosem járt éles adatalakon.
 */

afterEach(cleanup)

const meta = {
  roomCode: 'ABCD',
  roundSeconds: 900,
  createdAt: 0,
  schedule: [
    { round: 1, gameId: 'trivia', seed: 'ABCD-r1-trivia' },
    { round: 2, gameId: 'emoji', seed: 'ABCD-r2-emoji' },
  ],
}

const teams = {
  'team-a': { id: 'team-a', name: 'Car One', emoji: '🚗', colorIndex: 0, joinedAtRound: 1 },
  'team-b': { id: 'team-b', name: 'Car Two', emoji: '🚙', colorIndex: 1, joinedAtRound: 1 },
}

function renderCompare(state: RoomState) {
  return render(
    <LanguageProvider>
      <RoundCompare state={state} round={1} myTeamId="team-a" />
    </LanguageProvider>,
  )
}

it('renders a round played through Firebase without crashing', () => {
  // Ahogy a Firebase visszaadja: a `rounds` tömbbé alakul, mert minden
  // kulcsa egész szám. A 0. elem üres — a normalizálás mindkét alakot
  // (lyuk és null) ugyanoda vezeti.
  const state = normalizeRoomState({
    meta,
    teams,
    rounds: [
      null,
      {
        done: {
          'team-a': { points: 700, rawScore: '21 / 30', items: [true, false, true], timeMs: 60_000 },
          'team-b': { points: 400, rawScore: '12 / 30', items: [false, false, true], timeMs: 90_000 },
        },
      },
    ],
  })!

  renderCompare(state)
  // "Car One" a csapatsorban és a fordulópont mondatában is szerepel.
  expect(screen.getAllByText(/Car One/).length).toBeGreaterThan(0)
  expect(screen.getByText(/21 \/ 30/)).toBeTruthy()
  expect(screen.getByText(/12 \/ 30/)).toBeTruthy()
})

it('survives a result whose empty items list Firebase dropped', () => {
  // A csapat nem oldott meg semmit: `items: []`. A Firebase az üres tömböt
  // nem tárolja, tehát a mező hiányzik — enélkül itt szállt el a render.
  const state = normalizeRoomState({
    meta,
    teams,
    rounds: [
      null,
      {
        done: {
          'team-a': { points: 0, rawScore: '0 / 30', timeMs: 5_000 },
          'team-b': { points: 300, rawScore: '9 / 30', items: [true, false], timeMs: 60_000 },
        },
      },
    ],
  })!

  expect(() => renderCompare(state)).not.toThrow()
  expect(screen.getByText(/0 \/ 30/)).toBeTruthy()
})

/**
 * A tényleges hibajelenség: két csapat, néhány lejátszott kör, majd egy
 * Letter Blitz kör után a KÖVETKEZŐ képernyő feketére vált. Az itteni
 * adat pontosan úgy néz ki, ahogy a Firebase visszaadja: a kihagyott
 * betűk `words` kulcsa nincs benne, mert az üres tömböt nem tárolja.
 */
it('renders the screen that went black after a Letter Blitz round', () => {
  const lettersMeta = {
    ...meta,
    schedule: [{ round: 1, gameId: 'letters', seed: 'ABCD-r1-letters' }],
  }

  const state = normalizeRoomState({
    meta: lettersMeta,
    teams,
    rounds: [
      null,
      {
        done: {
          'team-a': {
            points: 620,
            rawScore: '7 words',
            items: [true, true, false],
            timeMs: 60_000,
            // A harmadik betűt üresen hagyták -> a Firebase törölte a kulcsot.
            payload: {
              entries: [
                { key: 'A', words: ['alma', 'antilop'] },
                { key: 'B', words: ['busz'] },
                { key: 'C' },
              ],
            },
          },
          'team-b': {
            points: 480,
            rawScore: '5 words',
            items: [true, false, false],
            timeMs: 60_000,
            payload: {
              entries: [
                { key: 'A', words: ['alma'] },
                { key: 'B' },
                { key: 'C' },
              ],
            },
          },
        },
      },
    ],
  })!

  expect(() => renderCompare(state)).not.toThrow()
  // Az egyediség-bónusz tényleg megjelenik, nem csak "nem dob kivételt".
  expect(screen.getByText(/7 words/)).toBeTruthy()
  expect(screen.getAllByText(/Car Two/).length).toBeGreaterThan(0)
})

/**
 * A jelentett hiba: "azt írta a másik csapatnak, hogy maximum pontot
 * kapott, pedig rosszul tippelt". A pontsáv korábban a VEZETŐHÖZ mérte
 * magát, tehát az élen álló autó sávja mindig teljesen tele volt — egy
 * 3/30-as kör is maxsávot kapott, ha a másik 2/30-at ért el.
 */
it('scales the score bar against the maximum, not against the leader', () => {
  const state = normalizeRoomState({
    meta, teams,
    rounds: [null, { done: {
      'team-a': { points: 100, rawScore: '3 / 30', items: [true], timeMs: 60_000 },
      'team-b': { points: 67, rawScore: '2 / 30', items: [false], timeMs: 60_000 },
    } }],
  })!

  const { container } = renderCompare(state)
  const widths = [...container.querySelectorAll<HTMLElement>('[style*="width"]')].map(
    (el) => el.style.width,
  )
  // 100 és 67 pont az 1000-es maximumból: 10% és 7%, nem 100% és 67%.
  expect(widths).toEqual(['10%', '7%'])
})

it('crowns nobody in a round where neither team scored', () => {
  const state = normalizeRoomState({
    meta, teams,
    rounds: [null, { done: {
      'team-a': { points: 0, rawScore: '0 / 30', items: [false], timeMs: 60_000 },
      'team-b': { points: 0, rawScore: '0 / 30', items: [false], timeMs: 60_000 },
    } }],
  })!

  const { container } = renderCompare(state)
  expect(container.textContent).not.toContain('👑')
})
