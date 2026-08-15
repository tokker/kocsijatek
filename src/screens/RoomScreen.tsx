import { useEffect, useMemo, useState } from 'react'
import { createRng } from '../core/rng'
import { roundWinners } from '../core/scoring'
import type { GameResult, RoomState } from '../core/types'
import { getGame } from '../games/registry'
import type { SyncAdapter } from '../sync'
import { useRoom } from '../sync/useRoom'
import type { Session } from '../state/session'
import { teamColor } from '../ui/teamColors'

interface Props {
  adapter: SyncAdapter
  session: Session
  onLeave: () => void
}

export function RoomScreen({ adapter, session, onLeave }: Props) {
  const room = useRoom(adapter, session.roomCode, session.teamId)
  const [playing, setPlaying] = useState(false)

  // Új kör mindig zárt állapotban kezdődik, hogy a START gomb újra
  // megjelenjen ahelyett, hogy azonnal a játékba esnénk.
  useEffect(() => setPlaying(false), [room.currentRound])

  const game = room.currentGameId ? getGame(room.currentGameId) : null
  const items = useMemo(
    () => (game && room.currentSeed ? game.buildItems(createRng(room.currentSeed)) : []),
    [game, room.currentSeed],
  )

  if (!room.state) {
    return <Centered>Connecting to room {session.roomCode}…</Centered>
  }

  const handleStart = async () => {
    await room.start()
    setPlaying(true)
  }

  const handleComplete = async (result: GameResult) => {
    setPlaying(false)
    await room.submitResult(result)
  }

  if (playing && game) {
    return <game.Component items={items} durationSec={room.state.meta.roundSeconds} onComplete={handleComplete} />
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col gap-5 overflow-y-auto p-5">
      <Header room={room} session={session} onLeave={onLeave} />

      {room.currentRound > 1 && (
        <PreviousRound state={room.state} round={room.currentRound - 1} myTeamId={session.teamId} />
      )}

      {room.myStatus === 'done' ? (
        <WaitingPanel names={room.waitingFor.map((team) => `${team.emoji} ${team.name}`)} />
      ) : (
        <StartPanel
          game={game}
          round={room.currentRound}
          resuming={room.myStatus === 'playing'}
          colorIndex={session.colorIndex}
          onStart={handleStart}
        />
      )}

      <Standings room={room} myTeamId={session.teamId} />
    </div>
  )
}

type Room = ReturnType<typeof useRoom>

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center p-6 text-center text-slate-400">{children}</div>
}

function Header({ room, session, onLeave }: { room: Room; session: Session; onLeave: () => void }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <header className="flex items-center justify-between">
      <div>
        <p className="text-xs text-slate-500">Room code</p>
        <p className="text-2xl font-bold tracking-[0.3em]">{session.roomCode}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <p className={`text-xs ${room.status === 'online' ? 'text-slate-500' : 'text-amber-400'}`}>
          {room.status === 'online' ? 'Synced' : 'Offline — will sync later'}
        </p>
        {/*
          Két lépéses kilépés. Egyetlen koppintásra kilépni egy rázkódó
          autóban túl könnyű, és a csapat kiesne a játékból kör közben.
        */}
        {confirming ? (
          <div className="flex gap-2">
            <button onClick={onLeave} className="rounded-lg bg-red-600 px-3 py-1 text-sm">
              Leave
            </button>
            <button onClick={() => setConfirming(false)} className="rounded-lg bg-slate-700 px-3 py-1 text-sm">
              Stay
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className="text-sm text-slate-500 underline">
            Leave game
          </button>
        )}
      </div>
    </header>
  )
}

function StartPanel({
  game,
  round,
  resuming,
  colorIndex,
  onStart,
}: {
  game: ReturnType<typeof getGame> | null
  round: number
  resuming: boolean
  colorIndex: number
  onStart: () => void
}) {
  return (
    <section className="flex flex-col items-center gap-4 rounded-3xl bg-slate-800 p-6 text-center">
      <p className="text-sm text-slate-400">Round {round}</p>
      <p className="text-5xl">{game?.icon ?? '🎲'}</p>
      <h2 className="text-2xl font-bold">{game?.id ?? 'Unknown game'}</h2>
      <p className="text-slate-400">
        {resuming
          ? 'You already started this round. Starting again restarts it from the first question.'
          : 'Start whenever your car is ready. The other car can start later.'}
      </p>
      <button
        onClick={onStart}
        className={`min-h-16 w-full rounded-2xl text-2xl font-bold ${teamColor(colorIndex).bg}`}
      >
        {resuming ? 'Restart round' : 'Start round'}
      </button>
    </section>
  )
}

function WaitingPanel({ names }: { names: string[] }) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-3xl bg-slate-800 p-6 text-center">
      <p className="text-5xl">⏳</p>
      <h2 className="text-xl font-bold">Round finished</h2>
      {names.length > 0 ? (
        <p className="text-slate-400">
          Waiting for {names.join(', ')} to finish before the next round opens.
        </p>
      ) : (
        <p className="text-slate-400">Opening the next round…</p>
      )}
    </section>
  )
}

function PreviousRound({
  state,
  round,
  myTeamId,
}: {
  state: RoomState
  round: number
  myTeamId: string
}) {
  const done = state.rounds?.[round]?.done ?? {}
  const winners = new Set(roundWinners(done))
  const entries = Object.entries(done).sort(([, a], [, b]) => b.points - a.points)
  if (entries.length === 0) return null

  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-slate-800 p-5">
      <h2 className="text-sm text-slate-400">Round {round} results</h2>
      {entries.map(([teamId, result]) => {
        const team = state.teams[teamId]
        return (
          <div key={teamId} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <span className={teamId === myTeamId ? 'font-bold' : ''}>
                {team?.emoji} {team?.name ?? teamId}
                {winners.has(teamId) && ' 👑'}
              </span>
              <span className="tabular-nums">
                {result.rawScore} · {result.points} pts
              </span>
            </div>
            <ItemGrid items={result.items} />
          </div>
        )
      })}
    </section>
  )
}

/** Feladatonkénti zöld/piros rács — ebből látszik, hol dőlt el a kör. */
function ItemGrid({ items }: { items: boolean[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((correct, index) => (
        <span
          key={index}
          className={`size-3 rounded-sm ${correct ? 'bg-green-500' : 'bg-red-500/60'}`}
        />
      ))}
    </div>
  )
}

function Standings({ room, myTeamId }: { room: Room; myTeamId: string }) {
  if (!room.state) return null
  const rows = room.standings.filter((row) => row.roundsPlayed > 0)
  if (rows.length === 0) return null

  return (
    <section className="flex flex-col gap-2 rounded-3xl bg-slate-800 p-5">
      <h2 className="text-sm text-slate-400">Overall</h2>
      {rows.map((row, index) => {
        const team = room.state!.teams[row.teamId]
        return (
          <div key={row.teamId} className="flex items-baseline justify-between">
            <span className={row.teamId === myTeamId ? 'font-bold' : ''}>
              {index + 1}. {team?.emoji} {team?.name ?? row.teamId}
            </span>
            <span className="tabular-nums text-slate-300">
              {row.total} pts · {row.roundsWon} won
            </span>
          </div>
        )
      })}
    </section>
  )
}
