import { useCallback, useEffect, useRef, useState } from 'react'
import { NUMBER_FACTS, type NumberFact } from './facts.en'
import { buildEscalatingRound, mixSize, type RoundMix } from '../difficulty'
import { normalize, proximityPoints } from '../../core/scoring'
import { useCountdown } from '../../ui/useCountdown'
import type { GameModule, GameProps } from '../types'

const ROUND_MIX: RoundMix = [
  ['medium', 6],
  ['hard', 6],
  ['brutal', 5],
]

const MAX_PER_ITEM = 100
/** Ennyi ponttól számít egy tipp "találatnak" az összehasonlító rácson. */
const HIT_THRESHOLD = 50

function formatClock(totalSeconds: number): string {
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
}

function ClosestRunner({ items, durationSec, onComplete }: GameProps<NumberFact>) {
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [reveal, setReveal] = useState<{ guess: number; points: number } | null>(null)
  const scores = useRef<number[]>([])
  const startedAt = useRef(Date.now())
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true

    const earned = scores.current.reduce((sum, points) => sum + (points ?? 0), 0)
    const hits = items.map((_, i) => (scores.current[i] ?? 0) >= HIT_THRESHOLD)

    onComplete({
      points: normalize(earned, items.length * MAX_PER_ITEM),
      rawScore: `${hits.filter(Boolean).length} / ${items.length} close`,
      items: hits,
      timeMs: Date.now() - startedAt.current,
    })
  }, [items, onComplete])

  const { secondsLeft } = useCountdown(durationSec, finish)

  useEffect(() => {
    if (items.length === 0) finish()
  }, [items.length, finish])

  const item = items[index]

  const submit = () => {
    if (reveal || finished.current || !item) return
    const guess = Number(input.replace(',', '.'))
    const valid = input.trim() !== '' && Number.isFinite(guess)
    const points = valid ? proximityPoints(guess, item.answer, item.tolerance) : 0
    scores.current[index] = points
    setReveal({ guess: valid ? guess : Number.NaN, points })
  }

  const next = () => {
    if (index + 1 >= items.length) return finish()
    setIndex(index + 1)
    setInput('')
    setReveal(null)
  }

  if (!item) return null

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          {index + 1} / {items.length}
        </span>
        <span className={secondsLeft <= 30 ? 'font-semibold text-red-400' : ''}>
          {formatClock(secondsLeft)}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center text-center text-2xl font-semibold">
        {item.prompt.en}
      </div>

      {reveal ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl bg-slate-800 p-5 text-center">
            <p className="text-sm text-slate-400">It was</p>
            <p className="text-4xl font-bold">
              {item.answer.toLocaleString('en-US')}
              {item.unit && <span className="ml-1 text-xl text-slate-400">{item.unit}</span>}
            </p>
            <p className="mt-2 text-slate-400">
              You said {Number.isNaN(reveal.guess) ? '—' : reveal.guess.toLocaleString('en-US')}
            </p>
            <p
              className={`mt-1 text-lg font-semibold ${
                reveal.points >= HIT_THRESHOLD ? 'text-green-400' : 'text-amber-400'
              }`}
            >
              +{reveal.points}
            </p>
          </div>
          <button onClick={next} className="min-h-16 rounded-2xl bg-slate-700 text-xl font-bold">
            {index + 1 >= items.length ? 'Finish' : 'Next'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && submit()}
              // A telefon numerikus billentyűzetet nyisson, ne betűset.
              inputMode="decimal"
              placeholder="Your estimate"
              className="min-h-16 flex-1 rounded-2xl bg-slate-800 px-4 text-center text-2xl font-bold"
            />
            {item.unit && <span className="w-24 text-slate-400">{item.unit}</span>}
          </div>
          <button
            onClick={submit}
            className="min-h-16 rounded-2xl bg-slate-600 text-xl font-bold active:bg-slate-500"
          >
            Lock it in
          </button>
        </div>
      )}
    </div>
  )
}

const closestGame: GameModule<NumberFact> = {
  id: 'closest',
  titleKey: 'games.closest.title',
  descriptionKey: 'games.closest.description',
  icon: '🎯',
  buildItems: (rng) => buildEscalatingRound(NUMBER_FACTS, rng, ROUND_MIX),
  Component: ClosestRunner,
}

export default closestGame
export { ROUND_MIX, MAX_PER_ITEM, mixSize }
