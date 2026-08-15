import { useCallback, useEffect, useRef, useState } from 'react'
import { STATEMENTS, type Statement } from './statements.en'
import { buildEscalatingRound, type RoundMix } from '../difficulty'
import { normalize } from '../../core/scoring'
import { useCountdown } from '../../ui/useCountdown'
import type { GameModule, GameProps } from '../types'

const ROUND_MIX: RoundMix = [
  ['medium', 5],
  ['hard', 6],
  ['brutal', 4],
]

const STAKES = [1, 2, 3] as const
const MAX_STAKE = 3

function formatClock(totalSeconds: number): string {
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
}

/**
 * Igaz/hamis állítás tét megjelölésével.
 *
 * Az irány és a tét EGY koppintás, nem kettő: hat gomb helyett két sor
 * három oszloppal. Egy autóban minden fölösleges érintés hibalehetőség,
 * és a kétlépéses változat ugyanezt az információt kérné el kétszer
 * annyi idő alatt.
 *
 * A rossz válasz LEVON: enélkül a hármas tét ingyen lenne, és mindenki
 * mindig azt választaná — a tét megszűnne döntés lenni.
 */
function WagerRunner({ items, durationSec, onComplete }: GameProps<Statement>) {
  const [index, setIndex] = useState(0)
  const [reveal, setReveal] = useState<{ correct: boolean; stake: number } | null>(null)
  const deltas = useRef<number[]>([])
  const startedAt = useRef(Date.now())
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true

    const net = deltas.current.reduce((sum, delta) => sum + (delta ?? 0), 0)
    const hits = items.map((_, i) => (deltas.current[i] ?? 0) > 0)

    onComplete({
      // A nettó pont negatív is lehet; a normalize levágja nullára.
      points: normalize(net, items.length * MAX_STAKE),
      rawScore: `${hits.filter(Boolean).length} / ${items.length} · ${net >= 0 ? '+' : ''}${net}`,
      items: hits,
      timeMs: Date.now() - startedAt.current,
    })
  }, [items, onComplete])

  const { secondsLeft } = useCountdown(durationSec, finish)

  useEffect(() => {
    if (items.length === 0) finish()
  }, [items.length, finish])

  const item = items[index]

  const answer = (saidTrue: boolean, stake: number) => {
    if (reveal || finished.current || !item) return
    const correct = saidTrue === item.isTrue
    deltas.current[index] = correct ? stake : -stake
    setReveal({ correct, stake })

    setTimeout(() => {
      if (finished.current) return
      if (index + 1 >= items.length) return finish()
      setIndex(index + 1)
      setReveal(null)
    }, 1200)
  }

  if (!item) return null

  const running = deltas.current.reduce((sum, delta) => sum + (delta ?? 0), 0)

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          {index + 1} / {items.length}
        </span>
        <span className="font-semibold text-slate-300">
          {running >= 0 ? '+' : ''}
          {running}
        </span>
        <span className={secondsLeft <= 30 ? 'font-semibold text-red-400' : ''}>
          {formatClock(secondsLeft)}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center text-center text-2xl font-semibold">
        {item.text.en}
      </div>

      {reveal ? (
        <div
          className={`rounded-2xl p-6 text-center ${reveal.correct ? 'bg-green-700' : 'bg-red-700'}`}
        >
          <p className="text-3xl font-bold">
            {reveal.correct ? '+' : '−'}
            {reveal.stake}
          </p>
          <p className="mt-1 text-slate-100">
            It was {item.isTrue ? 'true' : 'false'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-center text-sm text-slate-400">
            Pick your side and how much you stake
          </p>
          {[true, false].map((side) => (
            <div key={String(side)} className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-2">
              <span className="w-14 text-lg font-bold">{side ? 'True' : 'False'}</span>
              {STAKES.map((stake) => (
                <button
                  key={stake}
                  onClick={() => answer(side, stake)}
                  className={`min-h-16 rounded-2xl text-xl font-bold active:opacity-80 ${
                    side ? 'bg-emerald-800' : 'bg-rose-900'
                  }`}
                >
                  ×{stake}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const wagerGame: GameModule<Statement> = {
  id: 'wager',
  titleKey: 'games.wager.title',
  descriptionKey: 'games.wager.description',
  icon: '🎲',
  buildItems: (rng) => buildEscalatingRound(STATEMENTS, rng, ROUND_MIX),
  Component: WagerRunner,
}

export default wagerGame
export { ROUND_MIX, MAX_STAKE }
