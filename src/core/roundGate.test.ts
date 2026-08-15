import { describe, expect, it } from 'vitest'
import { isRoundUnlocked, participatingTeams, teamRoundStatus, teamsStillPlaying } from './roundGate'
import type { GameResult, RoomState, TeamInfo } from './types'

const result = (points: number): GameResult => ({
  points,
  rawScore: `${points}`,
  items: [],
  timeMs: 1000,
})

const team = (id: string, joinedAtRound = 1): TeamInfo => ({
  id,
  name: id,
  emoji: '🚗',
  colorIndex: 0,
  joinedAtRound,
})

function room(over: Partial<RoomState> = {}): RoomState {
  return {
    meta: { roomCode: 'ABC1', roundSeconds: 900, createdAt: 0, schedule: [] },
    teams: { car1: team('car1'), car2: team('car2') },
    rounds: {},
    ...over,
  }
}

describe('isRoundUnlocked', () => {
  it('always unlocks round 1', () => {
    expect(isRoundUnlocked(room(), 1)).toBe(true)
  })

  it('keeps round 2 locked when nobody has finished round 1', () => {
    expect(isRoundUnlocked(room(), 2)).toBe(false)
  })

  it('keeps round 2 locked when only one team has finished round 1', () => {
    const state = room({ rounds: { 1: { done: { car1: result(500) } } } })
    expect(isRoundUnlocked(state, 2)).toBe(false)
  })

  it('keeps round 2 locked while the other team is merely playing', () => {
    const state = room({
      rounds: { 1: { started: { car1: 1, car2: 2 }, done: { car1: result(500) } } },
    })
    expect(isRoundUnlocked(state, 2)).toBe(false)
  })

  it('unlocks round 2 once every team has finished round 1', () => {
    const state = room({ rounds: { 1: { done: { car1: result(500), car2: result(400) } } } })
    expect(isRoundUnlocked(state, 2)).toBe(true)
  })

  it('does not care that one team started much later', () => {
    const state = room({
      rounds: {
        1: {
          started: { car1: 0, car2: 9_000_000 },
          done: { car1: result(1), car2: result(2) },
        },
      },
    })
    expect(isRoundUnlocked(state, 2)).toBe(true)
  })

  it('works with four teams', () => {
    const state = room({
      teams: { car1: team('car1'), car2: team('car2'), car3: team('car3'), car4: team('car4') },
      rounds: { 1: { done: { car1: result(1), car2: result(1), car3: result(1) } } },
    })
    expect(isRoundUnlocked(state, 2)).toBe(false)
  })

  it('does not deadlock when a team joins mid-game', () => {
    // A car3 a 3. körnél szállt be, tehát az 1. és 2. körre nem kell megvárni.
    const state = room({
      teams: { car1: team('car1'), car2: team('car2'), car3: team('car3', 3) },
      rounds: { 2: { done: { car1: result(1), car2: result(1) } } },
    })
    expect(isRoundUnlocked(state, 3)).toBe(true)
  })

  it('locks when there are no teams at all', () => {
    expect(isRoundUnlocked(room({ teams: {} }), 2)).toBe(false)
  })
})

describe('participatingTeams', () => {
  it('excludes teams that had not joined yet', () => {
    const state = room({ teams: { car1: team('car1'), car3: team('car3', 5) } })
    expect(participatingTeams(state, 2).map((t) => t.id)).toEqual(['car1'])
  })

  it('includes a team from the round it joined', () => {
    const state = room({ teams: { car1: team('car1'), car3: team('car3', 5) } })
    expect(participatingTeams(state, 5).map((t) => t.id).sort()).toEqual(['car1', 'car3'])
  })
})

describe('teamRoundStatus', () => {
  it('reports not-started, playing, and done', () => {
    const state = room({ rounds: { 1: { started: { car2: 1000 }, done: { car1: result(5) } } } })
    expect(teamRoundStatus(state, 1, 'car1')).toBe('done')
    expect(teamRoundStatus(state, 1, 'car2')).toBe('playing')
    expect(teamRoundStatus(state, 1, 'car3')).toBe('not-started')
  })

  it('reports done even if the start timestamp is missing', () => {
    const state = room({ rounds: { 1: { done: { car1: result(5) } } } })
    expect(teamRoundStatus(state, 1, 'car1')).toBe('done')
  })
})

describe('teamsStillPlaying', () => {
  it('lists everyone who has not finished', () => {
    const state = room({ rounds: { 1: { done: { car1: result(5) } } } })
    expect(teamsStillPlaying(state, 1).map((t) => t.id)).toEqual(['car2'])
  })

  it('is empty once everyone is done', () => {
    const state = room({ rounds: { 1: { done: { car1: result(5), car2: result(6) } } } })
    expect(teamsStillPlaying(state, 1)).toEqual([])
  })
})
