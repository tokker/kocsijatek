import { useEffect, useState } from 'react'
import { GAME_IDS } from '../games/registry'
import { buildSchedule, generateRoomCode, isValidRoomCode, normalizeRoomCode } from '../core/room'
import { currentRoundOf } from '../core/roundGate'
import type { TeamInfo } from '../core/types'
import { generateTeamId, type Session } from '../state/session'
import { TEAM_COLORS, TEAM_EMOJIS, teamColor } from '../ui/teamColors'
import { readRoomOnce, type SyncAdapter } from '../sync'

/** 12 óra / 15 perc — bőven több kör, mint amennyit egy út alatt kijátszotok. */
const ROUND_COUNT = 48
const FULL_ROUND_SECONDS = 900
const TURBO_ROUND_SECONDS = 60

interface Props {
  adapter: SyncAdapter
  onJoined: (session: Session) => void
}

export function JoinScreen({ adapter, onJoined }: Props) {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [teamName, setTeamName] = useState('')
  const [emoji, setEmoji] = useState<string>(TEAM_EMOJIS[0])
  const [colorIndex, setColorIndex] = useState(0)
  const [codeInput, setCodeInput] = useState('')
  const [turbo, setTurbo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [existingTeams, setExistingTeams] = useState<TeamInfo[]>([])

  // Amint a kód teljes, megnézzük, milyen csapatok vannak már bent, hogy
  // fel lehessen ajánlani a visszalépést egy meglévőbe.
  useEffect(() => {
    const code = normalizeRoomCode(codeInput)
    if (mode !== 'join' || !isValidRoomCode(code)) {
      setExistingTeams([])
      return
    }
    let cancelled = false
    readRoomOnce(adapter, code).then((state) => {
      if (!cancelled) setExistingTeams(Object.values(state?.teams ?? {}))
    })
    return () => {
      cancelled = true
    }
  }, [adapter, mode, codeInput])

  /**
   * Belépés egy MÁR LÉTEZŐ csapatba, az eredeti azonosítóval.
   *
   * Enélkül egy lemerült telefon vagy egy véletlen kilépés árva csapatot
   * hagyna a szobában: a kör-kapu örökké várna rá, és a játék megakadna.
   */
  const takeOverTeam = (team: TeamInfo) => {
    onJoined({
      roomCode: normalizeRoomCode(codeInput),
      teamId: team.id,
      teamName: team.name,
      emoji: team.emoji,
      colorIndex: team.colorIndex,
    })
  }

  const submit = async () => {
    setError(null)
    setBusy(true)
    try {
      const name = teamName.trim() || 'Car'
      const roomCode = mode === 'create' ? generateRoomCode() : normalizeRoomCode(codeInput)

      if (mode === 'join' && !isValidRoomCode(roomCode)) {
        throw new Error('That room code does not look right.')
      }

      const exists = await adapter.roomExists(roomCode)
      if (mode === 'join' && !exists) throw new Error('No game found with that code.')

      if (mode === 'create') {
        await adapter.createRoom({
          roomCode,
          roundSeconds: turbo ? TURBO_ROUND_SECONDS : FULL_ROUND_SECONDS,
          createdAt: Date.now(),
          schedule: buildSchedule(roomCode, GAME_IDS, ROUND_COUNT),
        })
      }

      // Egy menet közben érkező autó az AKTUÁLIS körnél lép be, hogy a
      // már lezárt körökre ne kelljen visszamenőleg megvárni.
      const state = await readRoomOnce(adapter, roomCode)
      const joinedAtRound = state ? currentRoundOf(state) : 1

      const session: Session = {
        roomCode,
        teamId: generateTeamId(),
        teamName: name,
        emoji,
        colorIndex,
      }
      await adapter.joinRoom(roomCode, {
        id: session.teamId,
        name: session.teamName,
        emoji: session.emoji,
        colorIndex: session.colorIndex,
        joinedAtRound,
      })
      onJoined(session)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col gap-6 overflow-y-auto p-6">
      <header className="pt-4 text-center">
        <h1 className="text-3xl font-bold">Road Trip Game</h1>
        <p className="mt-1 text-slate-400">Car versus car, one round at a time.</p>
      </header>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-800 p-1">
        {(['create', 'join'] as const).map((value) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={`min-h-12 rounded-xl font-medium transition ${
              mode === value ? 'bg-slate-600' : 'text-slate-400'
            }`}
          >
            {value === 'create' ? 'New game' : 'Join game'}
          </button>
        ))}
      </div>

      {mode === 'join' && (
        <label className="flex flex-col gap-2">
          <span className="text-sm text-slate-400">Room code</span>
          <input
            value={codeInput}
            onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
            placeholder="AB2C"
            maxLength={4}
            autoCapitalize="characters"
            autoCorrect="off"
            className="min-h-16 rounded-2xl bg-slate-800 text-center text-3xl font-bold tracking-[0.4em] uppercase"
          />
        </label>
      )}

      {existingTeams.length > 0 && (
        <section className="flex flex-col gap-2 rounded-2xl bg-slate-800 p-4">
          <p className="text-sm text-slate-400">
            Already in this game — tap your car to take it back over on this phone:
          </p>
          <div className="flex flex-col gap-2">
            {existingTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => takeOverTeam(team)}
                className={`flex min-h-14 items-center gap-3 rounded-xl border-2 px-4 text-left text-lg ${teamColor(team.colorIndex).border}`}
              >
                <span className="text-2xl">{team.emoji}</span>
                {team.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">Or set up a new car below.</p>
        </section>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-sm text-slate-400">Team name</span>
        <input
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
          placeholder="The Fast Ones"
          maxLength={20}
          className="min-h-14 rounded-2xl bg-slate-800 px-4 text-lg"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-slate-400">Badge</span>
        <div className="grid grid-cols-6 gap-2">
          {TEAM_EMOJIS.map((value) => (
            <button
              key={value}
              onClick={() => setEmoji(value)}
              className={`min-h-14 rounded-xl bg-slate-800 text-2xl ${
                emoji === value ? 'ring-2 ring-slate-300' : ''
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-slate-400">Colour</span>
        <div className="grid grid-cols-4 gap-2">
          {TEAM_COLORS.map((color, index) => (
            <button
              key={color.name}
              aria-label={color.name}
              onClick={() => setColorIndex(index)}
              className={`min-h-14 rounded-xl ${color.bg} ${
                colorIndex === index ? 'ring-2 ring-white' : 'opacity-60'
              }`}
            />
          ))}
        </div>
      </div>

      {mode === 'create' && import.meta.env.DEV && (
        <label className="flex items-center gap-3 rounded-2xl bg-slate-800 p-4">
          <input
            type="checkbox"
            checked={turbo}
            onChange={(event) => setTurbo(event.target.checked)}
            className="size-5"
          />
          <span className="text-sm">
            Turbo rounds (60s instead of 15min)
            <span className="block text-slate-400">Development only, for testing the flow.</span>
          </span>
        </label>
      )}

      {error && <p className="rounded-xl bg-red-950 p-3 text-center text-red-300">{error}</p>}

      <button
        onClick={submit}
        disabled={busy}
        className={`min-h-16 rounded-2xl text-xl font-bold disabled:opacity-50 ${teamColor(colorIndex).bg}`}
      >
        {busy ? '…' : mode === 'create' ? 'Create game' : 'Join game'}
      </button>
    </div>
  )
}
