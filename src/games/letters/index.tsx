import { useCallback, useEffect, useRef, useState } from 'react'
import { buildChallenges, categoryById, type Challenge } from './categories'
import { normalizeWord } from '../text'
import { normalize } from '../../core/scoring'
import type { Rng } from '../../core/rng'
import { useCountdown } from '../../ui/useCountdown'
import type { GameModule, GameProps } from '../types'

const SECONDS_PER_CHALLENGE = 90
/** Ennyi szó ér teljes pontot egy feladatban. */
const TARGET_WORDS = 8
const MAX_PER_CHALLENGE = 100
const HIT_THRESHOLD = 4

function buildItems(rng: Rng): Challenge[] {
  return buildChallenges(rng)
}

/**
 * Egyetlen betű-feladat, saját 90 másodperces órával.
 *
 * Külön komponens, mert a szülő `key` propja csak így indítja újra a
 * visszaszámlálót. Ha a hook a szülőben ülne, a `startedAt` ref az első
 * csatoláskor rögzülne, és a második feladat órája sosem indulna el.
 */
function ChallengePanel({
  challenge,
  position,
  total,
  onExpire,
  onWordsChange,
}: {
  challenge: Challenge
  position: number
  total: number
  onExpire: () => void
  onWordsChange: (words: string[]) => void
}) {
  const [input, setInput] = useState('')
  const [accepted, setAccepted] = useState<string[]>([])
  const [flash, setFlash] = useState<'hit' | 'dup' | 'miss' | null>(null)

  const { secondsLeft } = useCountdown(SECONDS_PER_CHALLENGE, onExpire)

  const submit = () => {
    const word = normalizeWord(input)
    setInput('')
    if (!word) return

    const category = categoryById(challenge.categoryId)
    if (!word.startsWith(challenge.letter) || !category?.words.has(word)) {
      setFlash('miss')
    } else if (accepted.includes(word)) {
      setFlash('dup')
    } else {
      const next = [...accepted, word]
      setAccepted(next)
      onWordsChange(next)
      setFlash('hit')
    }
    setTimeout(() => setFlash(null), 400)
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          {position} / {total}
        </span>
        <span className={secondsLeft <= 15 ? 'font-semibold text-red-400' : ''}>
          {secondsLeft}s
        </span>
      </div>

      <div className="rounded-3xl bg-slate-800 p-5 text-center">
        <p className="text-sm uppercase tracking-widest text-slate-400">
          {challenge.categoryName}
        </p>
        <p className="mt-1 text-6xl font-black">{challenge.letter}</p>
        <p className="mt-1 text-sm text-slate-500">
          {accepted.length} found · {challenge.available} exist
        </p>
      </div>

      <input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && submit()}
        placeholder={`Something starting with ${challenge.letter}`}
        autoCapitalize="words"
        autoCorrect="off"
        spellCheck={false}
        className={`min-h-16 rounded-2xl px-4 text-center text-xl font-bold transition-colors ${
          flash === 'hit'
            ? 'bg-green-700'
            : flash === 'dup'
              ? 'bg-amber-700'
              : flash === 'miss'
                ? 'bg-red-800'
                : 'bg-slate-800'
        }`}
      />

      <button
        onClick={submit}
        className="min-h-14 rounded-2xl bg-slate-600 text-lg font-bold active:bg-slate-500"
      >
        Add
      </button>

      <div className="flex flex-1 flex-wrap content-start gap-2 overflow-y-auto">
        {accepted.map((word) => (
          <span key={word} className="rounded-lg bg-emerald-900 px-2 py-1 text-sm text-emerald-200">
            {word}
          </span>
        ))}
      </div>

      <button onClick={onExpire} className="min-h-12 rounded-xl bg-slate-800 text-sm text-slate-400">
        {position >= total ? 'Finish round' : 'Skip to next letter'}
      </button>
    </div>
  )
}

function LettersRunner({ items, durationSec, onComplete }: GameProps<Challenge>) {
  const [index, setIndex] = useState(0)
  const collected = useRef<string[][]>([])
  const startedAt = useRef(Date.now())
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true

    const counts = items.map((_, i) => (collected.current[i] ?? []).length)
    const earned = counts.reduce(
      (sum, count) => sum + Math.min(count / TARGET_WORDS, 1) * MAX_PER_CHALLENGE,
      0,
    )

    onComplete({
      points: normalize(earned, items.length * MAX_PER_CHALLENGE),
      rawScore: `${counts.reduce((sum, count) => sum + count, 0)} words`,
      items: counts.map((count) => count >= HIT_THRESHOLD),
      timeMs: Date.now() - startedAt.current,
      // A beírt szavak felmennek a szerverre: az egyediség-bónusz csak
      // akkor számolható ki, amikor MINDKÉT csapat listája megvan, tehát
      // a kör lezárása után, az összehasonlító képernyőn.
      payload: {
        entries: items.map((challenge, i) => ({
          key: challenge.id,
          words: collected.current[i] ?? [],
        })),
      },
    })
  }, [items, onComplete])

  useCountdown(durationSec, finish)

  useEffect(() => {
    if (items.length === 0) finish()
  }, [items.length, finish])

  const nextChallenge = useCallback(() => {
    if (finished.current) return
    if (index + 1 >= items.length) return finish()
    setIndex(index + 1)
  }, [index, items.length, finish])

  const challenge = items[index]
  if (!challenge) return null

  return (
    <ChallengePanel
      // A kulcs a KOMPONENSEN van, nem egy belső div-en: csak így
      // csatolódik újra, és indul friss órával a következő feladat.
      key={challenge.id}
      challenge={challenge}
      position={index + 1}
      total={items.length}
      onExpire={nextChallenge}
      onWordsChange={(words) => {
        collected.current[index] = words
      }}
    />
  )
}

const lettersGame: GameModule<Challenge> = {
  id: 'letters',
  titleKey: 'games.letters.title',
  descriptionKey: 'games.letters.description',
  icon: '🔠',
  buildItems,
  Component: LettersRunner,
}

export default lettersGame
export { TARGET_WORDS, MAX_PER_CHALLENGE, SECONDS_PER_CHALLENGE }
