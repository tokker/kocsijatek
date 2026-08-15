// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { RoomScreen } from './RoomScreen'
import { LanguageProvider } from '../i18n'
import { MockAdapter } from '../sync/MockAdapter'
import { buildSchedule } from '../core/room'
import { GAME_IDS } from '../games/registry'
import type { Session } from '../state/session'

const CODE = 'ABCD'
let adapter: MockAdapter

const session = (id: string): Session => ({
  roomCode: CODE, teamId: id, teamName: id, emoji: '🚗', colorIndex: 0,
})

beforeEach(async () => {
  localStorage.clear()
  adapter = new MockAdapter()
  await adapter.createRoom({
    roomCode: CODE, roundSeconds: 900, createdAt: 0,
    schedule: buildSchedule(CODE, GAME_IDS, 48),
  })
  for (const id of ['team-a', 'team-b']) {
    await adapter.joinRoom(CODE, { id, name: id, emoji: '🚗', colorIndex: 0, joinedAtRound: 1 })
  }
})

afterEach(cleanup)

function renderTeam(id: string) {
  return render(
    <LanguageProvider>
      <RoomScreen adapter={adapter} session={session(id)} onLeave={vi.fn()} />
    </LanguageProvider>,
  )
}

/** Igaz-e, hogy B a saját játékában van (nem az indító/váró panelen). */
function inGame(container: HTMLElement): boolean {
  const text = container.textContent ?? ''
  return !/Start round|Restart round|Round finished/.test(text)
}

it('team B stays in its own round when team A finishes', async () => {
  const b = renderTeam('team-b')

  await act(async () => { await adapter.markStarted(CODE, 1, 'team-b') })
  const startButton = screen.getByRole('button', { name: /Restart round|Start round/ })
  await act(async () => { startButton.click() })

  expect(inGame(b.container)).toBe(true)
  const playingHtml = b.container.innerHTML

  // A befejezi a saját körét, amíg B még játszik.
  await act(async () => {
    await adapter.submitResult(CODE, 1, 'team-a', {
      points: 900, rawScore: '9/10', items: [true], timeMs: 1000,
    })
  })

  // B-nek TOVÁBBRA IS a játékban kell lennie, változatlan képernyővel.
  expect(inGame(b.container)).toBe(true)
  expect(b.container.innerHTML).toBe(playingHtml)
})

it('team B is not pushed into the next round while it is still playing', async () => {
  const b = renderTeam('team-b')
  await act(async () => { await adapter.markStarted(CODE, 1, 'team-b') })
  await act(async () => {
    await adapter.submitResult(CODE, 1, 'team-a', {
      points: 900, rawScore: '9/10', items: [true], timeMs: 1000,
    })
  })
  // A kör száma nem ugorhat, amíg B nem végzett.
  expect(b.container.textContent).toContain('Round 1')
  expect(b.container.textContent).not.toContain('Round 2')
})
