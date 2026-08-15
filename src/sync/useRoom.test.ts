// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MockAdapter } from './MockAdapter'
import { useRoom } from './useRoom'
import { buildSchedule } from '../core/room'
import type { RoomMeta, TeamInfo } from '../core/types'

const meta: RoomMeta = {
  roomCode: 'AB2C',
  roundSeconds: 900,
  createdAt: 1,
  schedule: buildSchedule('AB2C', ['trivia', 'emoji'], 5),
}
const car1: TeamInfo = { id: 'car1', name: 'Car 1', emoji: '🚗', colorIndex: 0, joinedAtRound: 1 }
const car2: TeamInfo = { id: 'car2', name: 'Car 2', emoji: '🚙', colorIndex: 1, joinedAtRound: 1 }

const score = (points: number) => ({ points, rawScore: `${points}`, items: [true], timeMs: 10 })

describe('useRoom', () => {
  let adapter: MockAdapter

  beforeEach(async () => {
    localStorage.clear()
    adapter = new MockAdapter()
    await adapter.createRoom(meta)
    await adapter.joinRoom('AB2C', car1)
    await adapter.joinRoom('AB2C', car2)
  })

  it('exposes the room state', async () => {
    const { result } = renderHook(() => useRoom(adapter, 'AB2C', 'car1'))
    await waitFor(() => expect(result.current.state).not.toBeNull())
    expect(result.current.state!.meta.roomCode).toBe('AB2C')
  })

  it('starts on round 1 unlocked', async () => {
    const { result } = renderHook(() => useRoom(adapter, 'AB2C', 'car1'))
    await waitFor(() => expect(result.current.state).not.toBeNull())
    expect(result.current.currentRound).toBe(1)
    expect(result.current.canStart).toBe(true)
  })

  it('exposes the scheduled game for the current round', async () => {
    const { result } = renderHook(() => useRoom(adapter, 'AB2C', 'car1'))
    await waitFor(() => expect(result.current.state).not.toBeNull())
    expect(['trivia', 'emoji']).toContain(result.current.currentGameId)
    expect(result.current.currentSeed).toContain('AB2C-r1-')
  })

  it('blocks the next round while the other team is still playing', async () => {
    const { result } = renderHook(() => useRoom(adapter, 'AB2C', 'car1'))
    await waitFor(() => expect(result.current.state).not.toBeNull())

    await act(async () => {
      await result.current.submitResult(score(700))
    })

    // A car1 végzett, a car2 még nem: a kapunak zárva kell maradnia.
    await waitFor(() => expect(result.current.myStatus).toBe('done'))
    expect(result.current.canStart).toBe(false)
    expect(result.current.currentRound).toBe(1)
    expect(result.current.waitingFor.map((t) => t.id)).toEqual(['car2'])
  })

  it('advances once every team has finished', async () => {
    const { result } = renderHook(() => useRoom(adapter, 'AB2C', 'car1'))
    await waitFor(() => expect(result.current.state).not.toBeNull())

    await act(async () => {
      await result.current.submitResult(score(700))
      await adapter.submitResult('AB2C', 1, 'car2', score(500))
    })

    await waitFor(() => expect(result.current.currentRound).toBe(2))
    expect(result.current.canStart).toBe(true)
    // A friss körben senki nem végzett még, de ez nem "várakozás".
    expect(result.current.waitingFor).toEqual([])
  })

  it('reports nobody as blocking while I have not finished myself', async () => {
    const { result } = renderHook(() => useRoom(adapter, 'AB2C', 'car1'))
    await waitFor(() => expect(result.current.state).not.toBeNull())

    await act(async () => {
      await adapter.markStarted('AB2C', 1, 'car1')
    })

    expect(result.current.myStatus).toBe('playing')
    expect(result.current.waitingFor).toEqual([])
  })

  it('lets a team start a round long after the other one did', async () => {
    const { result } = renderHook(() => useRoom(adapter, 'AB2C', 'car2'))
    await waitFor(() => expect(result.current.state).not.toBeNull())

    // A car1 elkezdi és be is fejezi az 1. kört, amíg a car2 pihen.
    await act(async () => {
      await adapter.markStarted('AB2C', 1, 'car1')
      await adapter.submitResult('AB2C', 1, 'car1', score(900))
    })

    // A car2 még mindig elkezdheti ugyanazt a kört, és nem maradt le.
    await waitFor(() => expect(result.current.currentRound).toBe(1))
    expect(result.current.canStart).toBe(true)
  })

  it('reports standings once a round is closed by everyone', async () => {
    const { result } = renderHook(() => useRoom(adapter, 'AB2C', 'car1'))
    await waitFor(() => expect(result.current.state).not.toBeNull())

    await act(async () => {
      await result.current.submitResult(score(700))
      await adapter.submitResult('AB2C', 1, 'car2', score(500))
    })

    await waitFor(() => expect(result.current.standings[0].teamId).toBe('car1'))
    // 700 pont + 200 győzelmi bónusz
    expect(result.current.standings[0].total).toBe(900)
  })
})
