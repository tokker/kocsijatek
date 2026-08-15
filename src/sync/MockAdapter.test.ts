// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MockAdapter } from './MockAdapter'
import type { RoomMeta, RoomState, TeamInfo } from '../core/types'

const meta: RoomMeta = { roomCode: 'AB2C', roundSeconds: 900, createdAt: 1, schedule: [] }
const car1: TeamInfo = { id: 'car1', name: 'Car 1', emoji: '🚗', colorIndex: 0, joinedAtRound: 1 }
const car2: TeamInfo = { id: 'car2', name: 'Car 2', emoji: '🚙', colorIndex: 1, joinedAtRound: 1 }

/** Elkapja a legutóbb kiadott állapotot egy feliratkozáson keresztül. */
function latestState(adapter: MockAdapter, roomCode = 'AB2C'): RoomState {
  let state: RoomState | null = null
  const off = adapter.subscribe(roomCode, (s) => {
    state = s
  })
  off()
  if (!state) throw new Error('no state')
  return state
}

describe('MockAdapter', () => {
  beforeEach(() => localStorage.clear())

  it('reports a room as missing before it is created', async () => {
    expect(await new MockAdapter().roomExists('AB2C')).toBe(false)
  })

  it('creates a room and finds it', async () => {
    const adapter = new MockAdapter()
    await adapter.createRoom(meta)
    expect(await adapter.roomExists('AB2C')).toBe(true)
  })

  it('pushes state to a subscriber immediately', async () => {
    const adapter = new MockAdapter()
    await adapter.createRoom(meta)
    const seen = vi.fn()
    adapter.subscribe('AB2C', seen)
    expect(seen).toHaveBeenCalledWith(expect.objectContaining({ meta }))
  })

  it('reports null for a room that does not exist', () => {
    const seen = vi.fn()
    new MockAdapter().subscribe('ZZZZ', seen)
    expect(seen).toHaveBeenCalledWith(null)
  })

  it('shares state between two independent adapter instances', async () => {
    // Ez modellezi a két böngészőfület.
    const tabA = new MockAdapter()
    const tabB = new MockAdapter()
    await tabA.createRoom(meta)
    await tabA.joinRoom('AB2C', car1)
    await tabB.joinRoom('AB2C', car2)

    expect(Object.keys(latestState(tabA).teams).sort()).toEqual(['car1', 'car2'])
  })

  it('records a start timestamp', async () => {
    const adapter = new MockAdapter()
    await adapter.createRoom(meta)
    await adapter.joinRoom('AB2C', car1)
    await adapter.markStarted('AB2C', 1, 'car1')
    expect(latestState(adapter).rounds[1].started!.car1).toBeGreaterThan(0)
  })

  it('records a result', async () => {
    const adapter = new MockAdapter()
    await adapter.createRoom(meta)
    await adapter.joinRoom('AB2C', car1)
    await adapter.submitResult('AB2C', 1, 'car1', {
      points: 700,
      rawScore: '7/10',
      items: [true],
      timeMs: 500,
    })
    expect(latestState(adapter).rounds[1].done!.car1.points).toBe(700)
  })

  it('notifies subscribers when another instance writes', async () => {
    const tabA = new MockAdapter()
    const tabB = new MockAdapter()
    await tabA.createRoom(meta)
    const seen = vi.fn()
    tabA.subscribe('AB2C', seen)
    seen.mockClear()
    await tabB.joinRoom('AB2C', car2)
    expect(seen).toHaveBeenCalled()
  })

  it('does not notify subscribers of a different room', async () => {
    const adapter = new MockAdapter()
    await adapter.createRoom(meta)
    await adapter.createRoom({ ...meta, roomCode: 'ZZZZ' })
    const seen = vi.fn()
    adapter.subscribe('AB2C', seen)
    seen.mockClear()
    await adapter.joinRoom('ZZZZ', car2)
    expect(seen).not.toHaveBeenCalled()
  })

  it('stops notifying after unsubscribe', async () => {
    const adapter = new MockAdapter()
    await adapter.createRoom(meta)
    const seen = vi.fn()
    const off = adapter.subscribe('AB2C', seen)
    off()
    seen.mockClear()
    await adapter.joinRoom('AB2C', car1)
    expect(seen).not.toHaveBeenCalled()
  })

  it('rejects writes to a room that was never created', async () => {
    await expect(new MockAdapter().joinRoom('ZZZZ', car1)).rejects.toThrow()
  })

  it('always reports online status', () => {
    const seen = vi.fn()
    new MockAdapter().subscribeStatus(seen)
    expect(seen).toHaveBeenCalledWith('online')
  })
})
