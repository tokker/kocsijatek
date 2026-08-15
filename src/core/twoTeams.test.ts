// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { MockAdapter } from '../sync/MockAdapter'
import { readRoomOnce } from '../sync'
import { buildSchedule } from './room'
import { currentRoundOf, teamRoundStatus, teamsStillPlaying } from './roundGate'
import { standings } from './scoring'
import { GAME_IDS } from '../games/registry'
import type { GameResult, RoomState } from './types'

const team = (id: string, joinedAtRound: number) => ({
  id, name: id, emoji: '🚗', colorIndex: 0, joinedAtRound,
})

const scored = (points: number, items: boolean[]): GameResult => ({
  points, rawScore: `${items.filter(Boolean).length}/${items.length}`, items, timeMs: 1000,
})

let adapter: MockAdapter
const CODE = 'ABCD'

async function state(): Promise<RoomState> {
  return (await readRoomOnce(adapter, CODE))!
}

beforeEach(async () => {
  localStorage.clear()
  adapter = new MockAdapter()
  await adapter.createRoom({
    roomCode: CODE, roundSeconds: 900, createdAt: 0,
    schedule: buildSchedule(CODE, GAME_IDS, 48),
  })
  await adapter.joinRoom(CODE, team('team-a', 1))
  await adapter.joinRoom(CODE, team('team-b', 1))
})

describe('two teams, one round', () => {
  it('does NOT advance the round when only one team has finished', async () => {
    await adapter.markStarted(CODE, 1, 'team-a')
    await adapter.markStarted(CODE, 1, 'team-b')
    await adapter.submitResult(CODE, 1, 'team-a', scored(700, [true, false]))

    const s = await state()
    expect(currentRoundOf(s)).toBe(1)
    expect(teamRoundStatus(s, 1, 'team-b')).toBe('playing')
    expect(teamsStillPlaying(s, 1).map((t) => t.id)).toEqual(['team-b'])
  })

  it('advances only once BOTH have finished', async () => {
    await adapter.submitResult(CODE, 1, 'team-a', scored(700, [true, false]))
    expect(currentRoundOf(await state())).toBe(1)
    await adapter.submitResult(CODE, 1, 'team-b', scored(300, [false, false]))
    expect(currentRoundOf(await state())).toBe(2)
  })
})

describe('standings across rounds', () => {
  it('scores a losing team by what it actually earned', async () => {
    await adapter.submitResult(CODE, 1, 'team-a', scored(700, [true, true]))
    await adapter.submitResult(CODE, 1, 'team-b', scored(100, [false, false]))

    const rows = standings(await state())
    const b = rows.find((r) => r.teamId === 'team-b')!
    expect(b.total).toBe(100)
    expect(b.roundsWon).toBe(0)
  })

  it('does not crown both teams when both scored zero', async () => {
    await adapter.submitResult(CODE, 1, 'team-a', scored(0, [false, false]))
    await adapter.submitResult(CODE, 1, 'team-b', scored(0, [false, false]))

    const rows = standings(await state())
    const winners = rows.filter((r) => r.roundsWon > 0)
    expect(winners.map((w) => `${w.teamId}:${w.total}`)).toEqual([])
  })
})
