import { describe, expect, it } from 'vitest'
import { asArray, asRecord, normalizeRoomState } from './normalize'
import { standings } from '../core/scoring'
import { currentRoundOf } from '../core/roundGate'
import type { GameResult, RoomState } from '../core/types'

/**
 * Ezek a tesztek a FIREBASE tényleges válaszalakját írják le, nem a
 * MockAdapterét. A kettő különbözik, és pontosan ez a különbség okozott
 * fekete képernyőt: a mock localStorage-ba JSON-oz, ami megőrzi a
 * `{"1": ...}` kulcsokat, a Firebase viszont tömbbé alakítja őket.
 */

const result = (points: number): GameResult => ({
  points,
  rawScore: '5 / 10',
  items: [true, false, true],
  timeMs: 12_000,
})

const teams = {
  'team-a': { id: 'team-a', name: 'Car One', emoji: '🚗', colorIndex: 0, joinedAtRound: 1 },
  'team-b': { id: 'team-b', name: 'Car Two', emoji: '🚙', colorIndex: 1, joinedAtRound: 1 },
}

const meta = {
  roomCode: 'ABCD',
  roundSeconds: 900,
  createdAt: 0,
  schedule: [{ round: 1, gameId: 'trivia', seed: 'ABCD-r1-trivia' }],
}

/**
 * Ahogy a Firebase VALÓBAN visszaadja: `array[key] = ...` értékadással
 * építi a tömböt, tehát a 0. index LYUK, nem `null`. A különbség számít:
 * az `Object.entries` a lyukakat kihagyja, a `null`-t viszont kiadja.
 * Ezért nem a `standings` volt a fekete képernyő oka.
 */
function sparse<T>(entries: Record<number, T>): T[] {
  const out: T[] = []
  for (const [index, value] of Object.entries(entries)) out[Number(index)] = value
  return out
}

const firebaseSnapshot = {
  meta,
  teams,
  rounds: sparse({ 1: { done: { 'team-a': result(700), 'team-b': result(400) } } }),
}

describe('asRecord', () => {
  it('turns a Firebase-coerced array back into keyed entries', () => {
    expect(asRecord([null, { a: 1 }, { a: 2 }])).toEqual({ 1: { a: 1 }, 2: { a: 2 } })
  })

  it('leaves a plain object alone and defaults a missing branch', () => {
    expect(asRecord({ 3: 'x' })).toEqual({ 3: 'x' })
    expect(asRecord(undefined)).toEqual({})
  })
})

describe('asArray', () => {
  it('defaults a dropped empty array', () => {
    // A Firebase nem tárol üres tömböt: a kulcs egyszerűen eltűnik.
    expect(asArray(undefined)).toEqual([])
  })

  it('keeps false values, which are meaningful in an items list', () => {
    expect(asArray([true, false, false])).toEqual([true, false, false])
  })
})

describe('normalizeRoomState', () => {
  it('restores the declared RoomState shape from a Firebase snapshot', () => {
    const state = normalizeRoomState(firebaseSnapshot)!
    expect(Array.isArray(state.rounds)).toBe(false)
    expect(Object.keys(state.rounds)).toEqual(['1'])
    expect(state.rounds[1].done!['team-a'].points).toBe(700)
  })

  it('returns null when the room does not exist', () => {
    expect(normalizeRoomState(null)).toBeNull()
    expect(normalizeRoomState({ teams: {} })).toBeNull()
  })

  it('defaults the branches Firebase drops when empty', () => {
    const state = normalizeRoomState({ meta })!
    expect(state.teams).toEqual({})
    expect(state.rounds).toEqual({})
  })

  it('restores an items list that Firebase dropped for being empty', () => {
    const state = normalizeRoomState({
      meta,
      teams,
      rounds: sparse({ 1: { done: { 'team-a': { points: 0, rawScore: '0', timeMs: 1 } } } }),
    })!
    expect(state.rounds[1].done!['team-a'].items).toEqual([])
  })

  /**
   * A `standings` a nyers, lyukas tömbbel is elboldogul — az `Object.entries`
   * kihagyja a lyukakat. A normalizálás tehát nem összeomlást hárít el itt,
   * hanem azt garantálja, hogy a típusban leírt alak érkezzen a UI-hoz.
   */
  it('gives standings the same answer before and after normalizing', () => {
    const raw = firebaseSnapshot as unknown as RoomState
    expect(standings(raw)).toEqual(standings(normalizeRoomState(firebaseSnapshot)!))

    const state = normalizeRoomState(firebaseSnapshot)!
    const rows = standings(state)
    expect(rows[0]).toMatchObject({ teamId: 'team-a', roundsPlayed: 1, roundsWon: 1 })
    expect(rows[1]).toMatchObject({ teamId: 'team-b', roundsPlayed: 1, roundsWon: 0 })
  })

  it('keeps the round gate agreeing with the mock-shaped equivalent', () => {
    const fromFirebase = normalizeRoomState(firebaseSnapshot)!
    const fromMock = {
      meta,
      teams,
      rounds: { 1: { done: { 'team-a': result(700), 'team-b': result(400) } } },
    } as unknown as RoomState

    expect(currentRoundOf(fromFirebase)).toBe(currentRoundOf(fromMock))
    expect(standings(fromFirebase)).toEqual(standings(fromMock))
  })
})
