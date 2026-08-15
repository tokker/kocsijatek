import { useCallback, useEffect, useRef, useState } from 'react'
import { focusFor, type Focus } from './focus'
import { FLAG_H, FLAG_W, FlagSvg, type FlagCrop } from '../flags/FlagSvg'
import { FLAG_QUESTIONS, type FlagQuestion } from '../flags/flags.en'
import { buildEscalatingRound, type RoundMix } from '../difficulty'
import { normalize } from '../../core/scoring'
import type { Rng } from '../../core/rng'
import { useCountdown } from '../../ui/useCountdown'
import type { GameModule, GameProps } from '../types'

const ROUND_MIX: RoundMix = [
  ['medium', 5],
  ['hard', 5],
  ['brutal', 4],
]

/** Mekkora részt mutatunk a zászlóból az egyes szinteken. */
const ZOOM_LEVELS = [0.14, 0.32, 0.6, 1] as const
/** Pont az egyes szinteken adott helyes válaszért. */
const LEVEL_POINTS = [100, 70, 45, 25] as const
const MAX_PER_ITEM = LEVEL_POINTS[0]

export interface ZoomItem extends FlagQuestion {
  /** A kinagyított pont a zászlón, 0..1 arányban. Seedből, tehát mindenkinek ugyanaz. */
  focus: Focus
}

function cropFor(item: ZoomItem, level: number): FlagCrop | undefined {
  const share = ZOOM_LEVELS[level]
  if (share >= 1) return undefined

  const square = item.spec.kind === 'swissCross'
  const width = square ? FLAG_H : FLAG_W
  const height = FLAG_H
  const w = width * share
  const h = height * share

  // A kivágás középpontját bent tartjuk, hogy ne lógjon ki a zászlóból.
  const x = Math.min(Math.max(item.focus.fx * width - w / 2, 0), width - w)
  const y = Math.min(Math.max(item.focus.fy * height - h / 2, 0), height - h)
  return { x, y, w, h }
}

function buildItems(rng: Rng): ZoomItem[] {
  return buildEscalatingRound(FLAG_QUESTIONS, rng, ROUND_MIX).map((question) => ({
    ...question,
    focus: focusFor(question.spec, rng),
  }))
}

function formatClock(totalSeconds: number): string {
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
}

function ZoomRunner({ items, durationSec, onComplete }: GameProps<ZoomItem>) {
  const [index, setIndex] = useState(0)
  const [level, setLevel] = useState(0)
  const [reveal, setReveal] = useState<{ correct: boolean; points: number } | null>(null)
  const scores = useRef<number[]>([])
  const startedAt = useRef(Date.now())
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true

    const earned = scores.current.reduce((sum, points) => sum + (points ?? 0), 0)
    const hits = items.map((_, i) => (scores.current[i] ?? 0) > 0)

    onComplete({
      points: normalize(earned, items.length * MAX_PER_ITEM),
      rawScore: `${hits.filter(Boolean).length} / ${items.length}`,
      items: hits,
      timeMs: Date.now() - startedAt.current,
    })
  }, [items, onComplete])

  const { secondsLeft } = useCountdown(durationSec, finish)

  useEffect(() => {
    if (items.length === 0) finish()
  }, [items.length, finish])

  const item = items[index]

  const answer = (choiceIndex: number) => {
    if (reveal || finished.current || !item) return
    const correct = choiceIndex === item.correctIndex
    const points = correct ? LEVEL_POINTS[level] : 0
    scores.current[index] = points
    setReveal({ correct, points })

    setTimeout(() => {
      if (finished.current) return
      if (index + 1 >= items.length) return finish()
      setIndex(index + 1)
      setLevel(0)
      setReveal(null)
    }, 1400)
  }

  if (!item) return null

  // Válasz után a teljes zászlót mutatjuk, hogy lássátok, mi volt az.
  const crop = reveal ? undefined : cropFor(item, level)
  const lastLevel = level >= ZOOM_LEVELS.length - 1

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          {index + 1} / {items.length}
        </span>
        <span className="font-semibold text-slate-300">
          {reveal ? `+${reveal.points}` : `worth ${LEVEL_POINTS[level]}`}
        </span>
        <span className={secondsLeft <= 30 ? 'font-semibold text-red-400' : ''}>
          {formatClock(secondsLeft)}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <FlagSvg
          spec={item.spec}
          crop={crop}
          className="h-36 w-full rounded-lg object-cover shadow-lg"
        />
      </div>

      {!reveal && (
        <button
          onClick={() => setLevel((current) => current + 1)}
          disabled={lastLevel}
          className="min-h-12 rounded-xl bg-slate-800 text-sm font-medium disabled:opacity-40"
        >
          {lastLevel ? 'Fully zoomed out' : `Zoom out — drops to ${LEVEL_POINTS[level + 1]}`}
        </button>
      )}

      <div className="grid gap-2">
        {item.choices.en.map((choice, i) => {
          const good = reveal && i === item.correctIndex
          const badPick = reveal && !reveal.correct && !good
          return (
            <button
              key={i}
              onClick={() => answer(i)}
              disabled={!!reveal}
              className={[
                'min-h-14 rounded-2xl px-4 text-lg font-medium transition',
                !reveal && 'bg-slate-700 active:bg-slate-600',
                good && 'bg-green-600',
                reveal && !good && !badPick && 'bg-slate-800 opacity-50',
                reveal && badPick && 'bg-slate-800 opacity-50',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {choice}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const zoomGame: GameModule<ZoomItem> = {
  id: 'zoom',
  titleKey: 'games.zoom.title',
  descriptionKey: 'games.zoom.description',
  icon: '🔍',
  buildItems,
  Component: ZoomRunner,
}

export default zoomGame
export { ROUND_MIX, ZOOM_LEVELS, LEVEL_POINTS, cropFor }
