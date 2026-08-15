import { useEffect, useMemo, useState } from 'react'
import { RoundCompare } from './RoundCompare'
import { createRng } from '../core/rng'
import type { GameResult } from '../core/types'
import { GAMES } from '../games/registry'
import type { GameModule } from '../games/types'
import { useT, type TranslationKey } from '../i18n'
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
  const { t } = useT()
  const room = useRoom(adapter, session.roomCode, session.teamId)
  const [playing, setPlaying] = useState(false)

  // Új kör mindig zárt állapotban kezdődik, hogy a START gomb újra
  // megjelenjen ahelyett, hogy azonnal a játékba esnénk.
  useEffect(() => setPlaying(false), [room.currentRound])

  // Szándékosan NEM a `getGame`, ami ismeretlen azonosítóra kivételt dob:
  // a menetrend a szoba létrehozásakor íródik be, tehát egy régebbi vagy
  // újabb build által készített szoba olyan játékot is kérhet, amit ez a
  // változat nem ismer. Renderelés közbeni kivétel = fekete képernyő; egy
  // kihagyható kör sokkal olcsóbb.
  const game = room.currentGameId ? (GAMES[room.currentGameId] ?? null) : null
  const items = useMemo(
    () => (game && room.currentSeed ? game.buildItems(createRng(room.currentSeed)) : []),
    [game, room.currentSeed],
  )

  if (!room.state) {
    return (
      <Centered>
        {t('room.connecting')} {session.roomCode}…
      </Centered>
    )
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
        <RoundCompare state={room.state} round={room.currentRound - 1} myTeamId={session.teamId} />
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
  const { t } = useT()
  const [confirming, setConfirming] = useState(false)

  return (
    <header className="flex items-center justify-between">
      <div>
        <p className="text-xs text-slate-500">{t('join.roomCode')}</p>
        <p className="text-2xl font-bold tracking-[0.3em]">{session.roomCode}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <p className={`text-xs ${room.status === 'online' ? 'text-slate-500' : 'text-amber-400'}`}>
          {room.status === 'online' ? t('room.synced') : t('room.offline')}
        </p>
        {/*
          Két lépéses kilépés. Egyetlen koppintásra kilépni egy rázkódó
          autóban túl könnyű, és a csapat kiesne a játékból kör közben.
        */}
        {confirming ? (
          <div className="flex gap-2">
            <button onClick={onLeave} className="rounded-lg bg-red-600 px-3 py-1 text-sm">
              {t('room.leaveConfirm')}
            </button>
            <button onClick={() => setConfirming(false)} className="rounded-lg bg-slate-700 px-3 py-1 text-sm">
              {t('room.stay')}
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className="text-sm text-slate-500 underline">
            {t('room.leave')}
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
  game: GameModule | null
  round: number
  resuming: boolean
  colorIndex: number
  onStart: () => void
}) {
  const { t } = useT()
  return (
    <section className="flex flex-col items-center gap-4 rounded-3xl bg-slate-800 p-6 text-center">
      <p className="text-sm text-slate-400">
        {t('round.label')} {round}
      </p>
      <p className="text-5xl">{game?.icon ?? '🎲'}</p>
      <h2 className="text-2xl font-bold">
        {game ? t(game.titleKey as TranslationKey) : '—'}
      </h2>
      <p className="text-slate-400">
        {resuming
          ? t('round.resumeHint')
          : game
            ? t(game.descriptionKey as TranslationKey)
            : t('round.startHint')}
      </p>
      <button
        onClick={onStart}
        className={`min-h-16 w-full rounded-2xl text-2xl font-bold ${teamColor(colorIndex).bg}`}
      >
        {resuming ? t('round.restart') : t('round.start')}
      </button>
    </section>
  )
}

function WaitingPanel({ names }: { names: string[] }) {
  const { t } = useT()
  return (
    <section className="flex flex-col items-center gap-3 rounded-3xl bg-slate-800 p-6 text-center">
      <p className="text-5xl">⏳</p>
      <h2 className="text-xl font-bold">{t('round.finished')}</h2>
      <p className="text-slate-400">
        {names.length > 0
          ? t('round.waitingFor', { names: names.join(', ') })
          : t('round.opening')}
      </p>
    </section>
  )
}


function Standings({ room, myTeamId }: { room: Room; myTeamId: string }) {
  const { t } = useT()
  if (!room.state) return null
  const rows = room.standings.filter((row) => row.roundsPlayed > 0)
  if (rows.length === 0) return null

  return (
    <section className="flex flex-col gap-2 rounded-3xl bg-slate-800 p-5">
      <h2 className="text-sm text-slate-400">{t('standings.title')}</h2>
      {rows.map((row, index) => {
        const team = room.state!.teams[row.teamId]
        return (
          <div key={row.teamId} className="flex items-baseline justify-between">
            <span className={row.teamId === myTeamId ? 'font-bold' : ''}>
              {index + 1}. {team?.emoji} {team?.name ?? row.teamId}
            </span>
            <span className="tabular-nums text-slate-300">
              {row.total} {t('standings.points')} · {row.roundsWon} {t('standings.won')}
            </span>
          </div>
        )
      })}
    </section>
  )
}
