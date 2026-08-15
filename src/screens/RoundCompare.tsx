import { useMemo } from 'react'
import { turningPoint, uniquenessBonus, wordEntriesOf, type TeamRound } from '../core/compare'
import { roundWinners } from '../core/scoring'
import type { RoomState, TeamId } from '../core/types'
import { GAMES } from '../games/registry'
import { useT, type TranslationKey } from '../i18n'
import { teamColor } from '../ui/teamColors'

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/**
 * Kör utáni összehasonlítás.
 *
 * Nem elég a végeredményt kiírni: a lényeg az, hogy lássátok, HOL dőlt
 * el a kör. Ezért van feladatonkénti rács és kiemelt fordulópont.
 */
export function RoundCompare({
  state,
  round,
  myTeamId,
}: {
  state: RoomState
  round: number
  myTeamId: TeamId
}) {
  const { t } = useT()

  const rounds: TeamRound[] = useMemo(() => {
    const done = state.rounds?.[round]?.done ?? {}
    return Object.entries(done)
      .map(([teamId, result]) => ({ teamId, result }))
      .sort((a, b) => b.result.points - a.result.points)
  }, [state, round])

  const winners = useMemo(
    () => new Set(roundWinners(Object.fromEntries(rounds.map((r) => [r.teamId, r.result])))),
    [rounds],
  )

  const pivot = useMemo(() => turningPoint(rounds), [rounds])
  const bonuses = useMemo(() => {
    const entries = wordEntriesOf(rounds)
    return entries ? uniquenessBonus(entries) : null
  }, [rounds])

  if (rounds.length === 0) return null

  const gameId = state.meta.schedule.find((entry) => entry.round === round)?.gameId
  const game = gameId ? GAMES[gameId] : undefined
  const best = Math.max(...rounds.map((entry) => entry.result.points), 1)

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-slate-800 p-5">
      <header className="flex items-baseline justify-between">
        <h2 className="text-sm text-slate-400">
          {t('round.label')} {round}
        </h2>
        <span className="text-sm text-slate-300">
          {game?.icon} {game ? t(game.titleKey as TranslationKey) : gameId}
        </span>
      </header>

      {rounds.map(({ teamId, result }) => {
        const team = state.teams[teamId]
        const color = teamColor(team?.colorIndex ?? 0)
        const mine = teamId === myTeamId

        return (
          <div key={teamId} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className={mine ? 'font-bold' : ''}>
                {team?.emoji} {team?.name ?? teamId}
                {winners.has(teamId) && ' 👑'}
              </span>
              <span className="tabular-nums text-slate-300">
                {result.rawScore} · {result.points} pts
              </span>
            </div>

            {/* Pontsáv: a vezetőhöz viszonyítva, hogy a különbség látszódjon. */}
            <div className="h-2 overflow-hidden rounded-full bg-slate-900">
              <div
                className={`h-full rounded-full ${color.bg}`}
                style={{ width: `${Math.round((result.points / best) * 100)}%` }}
              />
            </div>

            <ItemGrid items={result.items} pivotIndex={pivot?.teamId === teamId ? pivot.index : -1} />

            <p className="text-xs text-slate-500">
              {t('compare.took')} {formatDuration(result.timeMs)}
            </p>
          </div>
        )
      })}

      {pivot && (
        <p className="rounded-2xl bg-slate-900 p-3 text-center text-sm">
          <span className="text-slate-400">{t('compare.turningPoint')}: </span>
          {/* Egy mondatban, hogy a fordító átrendezhesse a szórendet. */}
          {t('compare.turningPointDetail', {
            number: pivot.index + 1,
            team: state.teams[pivot.teamId]?.name ?? pivot.teamId,
          })}
        </p>
      )}

      {bonuses && (
        <div className="flex flex-col gap-1 rounded-2xl bg-slate-900 p-3 text-sm">
          <p className="text-slate-400">{t('compare.uniqueness')}</p>
          {bonuses
            .sort((a, b) => b.bonus - a.bonus)
            .map((row) => (
              <div key={row.teamId} className="flex justify-between">
                <span>{state.teams[row.teamId]?.name ?? row.teamId}</span>
                <span className="tabular-nums text-slate-300">
                  {row.unique} {t('compare.onlyYours')} · {row.shared} {t('compare.shared')} · +{row.bonus}
                </span>
              </div>
            ))}
        </div>
      )}
    </section>
  )
}

function ItemGrid({ items, pivotIndex }: { items?: boolean[]; pivotIndex: number }) {
  if (!items?.length) return null
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((correct, index) => (
        <span
          key={index}
          className={[
            'size-3 rounded-sm',
            correct ? 'bg-green-500' : 'bg-red-500/50',
            index === pivotIndex && 'ring-2 ring-amber-300',
          ]
            .filter(Boolean)
            .join(' ')}
        />
      ))}
    </div>
  )
}
