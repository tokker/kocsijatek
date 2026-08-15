import { useCallback, useEffect, useRef, useState } from 'react'
import { normalizeGuess, scramble } from './scramble'
import { ANAGRAM_WORDS, type AnagramWord } from './words.en'
import { buildEscalatingRound, type RoundMix } from '../difficulty'
import { normalize } from '../../core/scoring'
import type { Rng } from '../../core/rng'
import { useCountdown } from '../../ui/useCountdown'
import type { GameModule, GameProps } from '../types'

const ROUND_MIX: RoundMix = [
  ['medium', 7],
  ['hard', 7],
  ['brutal', 6],
]

export interface AnagramItem extends AnagramWord {
  scrambled: string
}

function buildItems(rng: Rng): AnagramItem[] {
  return buildEscalatingRound(ANAGRAM_WORDS, rng, ROUND_MIX).map((entry) => ({
    ...entry,
    scrambled: scramble(entry.word, rng),
  }))
}

function formatClock(totalSeconds: number): string {
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
}

function AnagramRunner({ items, durationSec, onComplete }: GameProps<AnagramItem>) {
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [reveal, setReveal] = useState<'hit' | 'miss' | null>(null)
  const hits = useRef<boolean[]>([])
  const startedAt = useRef(Date.now())
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true

    const solved = items.map((_, i) => hits.current[i] === true)
    onComplete({
      points: normalize(solved.filter(Boolean).length, items.length),
      rawScore: `${solved.filter(Boolean).length} / ${items.length}`,
      items: solved,
      timeMs: Date.now() - startedAt.current,
    })
  }, [items, onComplete])

  const { secondsLeft } = useCountdown(durationSec, finish)

  useEffect(() => {
    if (items.length === 0) finish()
  }, [items.length, finish])

  const item = items[index]

  const advance = useCallback(() => {
    if (finished.current) return
    if (index + 1 >= items.length) return finish()
    setIndex(index + 1)
    setInput('')
    setReveal(null)
  }, [index, items.length, finish])

  const submit = () => {
    if (reveal || finished.current || !item) return
    const correct = normalizeGuess(input) === item.word
    hits.current[index] = correct
    setReveal(correct ? 'hit' : 'miss')
    setTimeout(advance, correct ? 700 : 1600)
  }

  /** Továbblépés megoldás nélkül; a feladat kihagyottnak számít. */
  const skip = () => {
    if (reveal || finished.current) return
    hits.current[index] = false
    setReveal('miss')
    setTimeout(advance, 1400)
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

      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm uppercase tracking-widest text-slate-500">{item.hint.en}</p>
        <p className="text-4xl font-bold tracking-[0.2em] break-all">{item.scrambled}</p>
      </div>

      {reveal === 'miss' && (
        <div className="rounded-2xl bg-slate-800 p-4 text-center">
          <p className="text-sm text-slate-400">It was</p>
          <p className="text-2xl font-bold tracking-widest">{item.word}</p>
        </div>
      )}
      {reveal === 'hit' && (
        <div className="rounded-2xl bg-green-700 p-4 text-center text-2xl font-bold">Got it</div>
      )}

      {!reveal && (
        <div className="flex flex-col gap-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && submit()}
            placeholder="Unscramble it"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-16 rounded-2xl bg-slate-800 px-4 text-center text-2xl font-bold uppercase tracking-widest"
          />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              onClick={submit}
              className="min-h-16 rounded-2xl bg-slate-600 text-xl font-bold active:bg-slate-500"
            >
              Submit
            </button>
            <button onClick={skip} className="min-h-16 rounded-2xl bg-slate-800 px-5 text-slate-400">
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const anagramGame: GameModule<AnagramItem> = {
  id: 'anagram',
  titleKey: 'games.anagram.title',
  descriptionKey: 'games.anagram.description',
  icon: '🔤',
  buildItems,
  Component: AnagramRunner,
}

export default anagramGame
export { ROUND_MIX }
