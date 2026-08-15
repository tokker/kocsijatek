import { useCallback, useEffect, useRef, useState } from 'react'
import { useCountdown } from './useCountdown'
import { normalize } from '../core/scoring'
import type { GameResult } from '../core/types'

export interface QuizRunnerProps<TItem> {
  items: TItem[]
  durationSec: number
  /** Meddig látszik a visszajelzés a válasz után. Tesztben 0. */
  revealMs?: number
  renderPrompt: (item: TItem, index: number) => React.ReactNode
  getChoices: (item: TItem) => string[]
  isCorrect: (item: TItem, choiceIndex: number) => boolean
  /** Feladatonkénti súly, pl. a Rapid Trivia utolsó öt kérdése dupla. */
  weightOf?: (item: TItem, index: number) => number
  onComplete: (result: GameResult) => void
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * A feladatsorok közös motorja. Ő biztosítja a csalásvédelmet:
 * a helyes válasz csak a rögzítés UTÁN kerül a DOM-ba, és egy feladathoz
 * egyetlen válasz tartozik — visszalépni nem lehet.
 */
export function QuizRunner<TItem>({
  items,
  durationSec,
  revealMs = 900,
  renderPrompt,
  getChoices,
  isCorrect,
  weightOf = () => 1,
  onComplete,
}: QuizRunnerProps<TItem>) {
  const [index, setIndex] = useState(0)
  const [locked, setLocked] = useState<number | null>(null)
  const answers = useRef<boolean[]>([])
  const startedAt = useRef(Date.now())
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true

    const correct = answers.current
    const earned = items.reduce(
      (sum, item, i) => sum + (correct[i] ? weightOf(item, i) : 0),
      0,
    )
    const max = items.reduce((sum, item, i) => sum + weightOf(item, i), 0)

    onComplete({
      points: normalize(earned, max),
      rawScore: `${correct.filter(Boolean).length} / ${items.length}`,
      // A meg nem válaszolt feladat is bekerül, hamis értékkel: az
      // összehasonlító rácsnak minden feladatról tudnia kell.
      items: items.map((_, i) => correct[i] === true),
      timeMs: Date.now() - startedAt.current,
    })
  }, [items, weightOf, onComplete])

  const { secondsLeft } = useCountdown(durationSec, finish)

  // Üres feladatsorral nincs mit játszani; azonnal lezárjuk, különben
  // a renderelés egy nem létező elemre hivatkozna.
  useEffect(() => {
    if (items.length === 0) finish()
  }, [items.length, finish])

  const answer = (choiceIndex: number) => {
    if (locked !== null || finished.current) return // egy feladat, egy válasz
    answers.current[index] = isCorrect(items[index], choiceIndex)
    setLocked(choiceIndex)

    const advance = () => {
      if (finished.current) return
      if (index + 1 >= items.length) return finish()
      setIndex(index + 1)
      setLocked(null)
    }

    if (revealMs > 0) setTimeout(advance, revealMs)
    else advance()
  }

  const item = items[index]
  if (!item) return null

  const choices = getChoices(item)
  const revealed = locked !== null

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
        {renderPrompt(item, index)}
      </div>

      <div className="grid gap-3">
        {choices.map((choice, i) => {
          // A helyes válasz CSAK a rögzítés után kerül a DOM-ba.
          const good = revealed && isCorrect(item, i)
          const badPick = revealed && locked === i && !good
          return (
            <button
              key={i}
              onClick={() => answer(i)}
              disabled={revealed}
              className={[
                'min-h-16 rounded-2xl px-4 text-lg font-medium transition',
                !revealed && 'bg-slate-700 active:bg-slate-600',
                good && 'bg-green-600',
                badPick && 'bg-red-600',
                revealed && !good && !badPick && 'bg-slate-800 opacity-50',
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
