import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildArcadeItems,
  INK_CLASS,
  SCORE,
  type ArcadeItem,
  type InkColor,
} from './challenges'
import { normalize } from '../../core/scoring'
import { useCountdown } from '../../ui/useCountdown'
import type { GameModule, GameProps } from '../types'

const MAX_PER_CHALLENGE = 100
/** Ettől a ponttól számít egy kihívás sikeresnek az összehasonlító rácson. */
const HIT_THRESHOLD = 50

interface ChallengeProps<T extends ArcadeItem> {
  item: T
  onDone: (score: number) => void
}

// ─────────────────────────── Reakcióidő ───────────────────────────

function ReactionChallenge({ item, onDone }: ChallengeProps<Extract<ArcadeItem, { kind: 'reaction' }>>) {
  const [trial, setTrial] = useState(0)
  const [armed, setArmed] = useState(false)
  const [tooEarly, setTooEarly] = useState(false)
  const shownAt = useRef(0)
  const times = useRef<number[]>([])

  useEffect(() => {
    if (trial >= item.delaysMs.length) return
    setArmed(false)
    setTooEarly(false)
    const timer = setTimeout(() => {
      shownAt.current = Date.now()
      setArmed(true)
    }, item.delaysMs[trial])
    return () => clearTimeout(timer)
  }, [trial, item.delaysMs])

  const tap = () => {
    if (!armed) {
      // Elkapkodott koppintás: büntetésként a leggyengébb idő jár rá.
      setTooEarly(true)
      times.current.push(600)
      return next()
    }
    times.current.push(Date.now() - shownAt.current)
    next()
  }

  const next = () => {
    if (trial + 1 >= item.delaysMs.length) {
      const average = times.current.reduce((sum, ms) => sum + ms, 0) / times.current.length
      return onDone(SCORE.reaction(average))
    }
    setTrial(trial + 1)
  }

  return (
    <button
      onClick={tap}
      className={`flex h-full w-full flex-col items-center justify-center gap-3 rounded-3xl text-2xl font-bold transition-colors ${
        armed ? 'bg-green-500 text-slate-900' : 'bg-slate-800'
      }`}
    >
      <span className="text-sm font-normal text-slate-400">
        {trial + 1} / {item.delaysMs.length}
      </span>
      {armed ? 'TAP NOW' : tooEarly ? 'Too early' : 'Wait for green…'}
    </button>
  )
}

// ─────────────────────────── Stroop-teszt ───────────────────────────

function StroopChallenge({ item, onDone }: ChallengeProps<Extract<ArcadeItem, { kind: 'stroop' }>>) {
  const [index, setIndex] = useState(0)
  const correct = useRef(0)
  const done = useRef(false)

  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    onDone(SCORE.stroop(correct.current))
  }, [onDone])

  const { secondsLeft } = useCountdown(item.seconds, finish)
  const trial = item.trials[index]

  const answer = (color: InkColor) => {
    if (done.current || !trial) return
    if (color === trial.ink) correct.current += 1
    if (index + 1 >= item.trials.length) return finish()
    setIndex(index + 1)
  }

  if (!trial) return null

  return (
    <div className="flex h-full flex-col gap-4">
      <p className="text-center text-sm text-slate-400">
        Tap the COLOUR of the letters, not the word · {secondsLeft}s
      </p>
      <div className="flex flex-1 items-center justify-center">
        <span className={`text-6xl font-black uppercase ${INK_CLASS[trial.ink]}`}>{trial.word}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {trial.options.map((color) => (
          <button
            key={color}
            onClick={() => answer(color)}
            className="min-h-16 rounded-2xl bg-slate-700 text-lg font-bold uppercase active:bg-slate-600"
          >
            {color}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────── 1-től 25-ig ───────────────────────────

function NumbersChallenge({ item, onDone }: ChallengeProps<Extract<ArcadeItem, { kind: 'numbers' }>>) {
  const [next, setNext] = useState(1)
  const startedAt = useRef(Date.now())

  const tap = (value: number) => {
    if (value !== next) return
    if (value >= item.count) return onDone(SCORE.numbers(Date.now() - startedAt.current))
    setNext(value + 1)
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <p className="text-center text-sm text-slate-400">
        Tap the numbers in order · next is <span className="font-bold text-slate-100">{next}</span>
      </p>
      <div className="grid flex-1 grid-cols-5 gap-1.5">
        {item.order.map((slot) => {
          const value = slot + 1
          const cleared = value < next
          return (
            <button
              key={slot}
              onClick={() => tap(value)}
              className={`rounded-xl text-lg font-bold transition ${
                cleared ? 'bg-slate-900 text-slate-700' : 'bg-slate-700 active:bg-slate-600'
              }`}
            >
              {cleared ? '' : value}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────── Fejszámolás ───────────────────────────

function MathChallenge({ item, onDone }: ChallengeProps<Extract<ArcadeItem, { kind: 'math' }>>) {
  const [index, setIndex] = useState(0)
  const correct = useRef(0)
  const done = useRef(false)

  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    onDone(SCORE.math(correct.current))
  }, [onDone])

  const { secondsLeft } = useCountdown(item.seconds, finish)
  const problem = item.problems[index]

  const answer = (value: number) => {
    if (done.current || !problem) return
    if (value === problem.answer) correct.current += 1
    if (index + 1 >= item.problems.length) return finish()
    setIndex(index + 1)
  }

  if (!problem) return null

  return (
    <div className="flex h-full flex-col gap-4">
      <p className="text-center text-sm text-slate-400">{secondsLeft}s left</p>
      <div className="flex flex-1 items-center justify-center text-5xl font-bold">
        {problem.text}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {problem.options.map((option) => (
          <button
            key={option}
            onClick={() => answer(option)}
            className="min-h-16 rounded-2xl bg-slate-700 text-2xl font-bold active:bg-slate-600"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────── A kör maga ───────────────────────────

const TITLES: Record<ArcadeItem['kind'], string> = {
  reaction: 'Reaction',
  stroop: 'Colour clash',
  numbers: 'Count to 25',
  math: 'Mental maths',
}

const BLURBS: Record<ArcadeItem['kind'], string> = {
  reaction: 'Tap the moment the screen turns green. Six goes.',
  stroop: 'Tap the colour the letters are printed in, ignoring what the word says.',
  numbers: 'Tap 1 to 25 in order, as fast as you can.',
  math: 'Answer as many as you can in a minute.',
}

function ArcadeRunner({ items, durationSec, onComplete }: GameProps<ArcadeItem>) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const scores = useRef<number[]>([])
  const startedAt = useRef(Date.now())
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true

    const earned = scores.current.reduce((sum, score) => sum + (score ?? 0), 0)
    const hits = items.map((_, i) => (scores.current[i] ?? 0) >= HIT_THRESHOLD)

    onComplete({
      points: normalize(earned, items.length * MAX_PER_CHALLENGE),
      rawScore: `${earned} / ${items.length * MAX_PER_CHALLENGE}`,
      items: hits,
      timeMs: Date.now() - startedAt.current,
    })
  }, [items, onComplete])

  useCountdown(durationSec, finish)

  useEffect(() => {
    if (items.length === 0) finish()
  }, [items.length, finish])

  const item = items[index]

  const handleDone = (score: number) => {
    scores.current[index] = score
    setPlaying(false)
    if (index + 1 >= items.length) return finish()
    setIndex(index + 1)
  }

  if (!item) return null

  if (!playing) {
    const previous = index > 0 ? scores.current[index - 1] : null
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 p-6 text-center">
        {previous != null && (
          <p className="rounded-2xl bg-slate-800 px-5 py-3 text-lg">
            Last challenge scored <span className="font-bold">{previous}</span> / 100
          </p>
        )}
        <p className="text-sm uppercase tracking-widest text-slate-500">
          Challenge {index + 1} of {items.length}
        </p>
        <h2 className="text-3xl font-bold">{TITLES[item.kind]}</h2>
        <p className="text-slate-400">{BLURBS[item.kind]}</p>
        {/* A telefon körbejár: mindenki kap egy kihívást. */}
        <p className="text-sm text-amber-300">Pass the phone to the next player</p>
        <button
          onClick={() => setPlaying(true)}
          className="min-h-16 w-full rounded-2xl bg-slate-600 text-xl font-bold active:bg-slate-500"
        >
          Ready
        </button>
      </div>
    )
  }

  return (
    <div className="h-full p-4">
      {item.kind === 'reaction' && <ReactionChallenge item={item} onDone={handleDone} />}
      {item.kind === 'stroop' && <StroopChallenge item={item} onDone={handleDone} />}
      {item.kind === 'numbers' && <NumbersChallenge item={item} onDone={handleDone} />}
      {item.kind === 'math' && <MathChallenge item={item} onDone={handleDone} />}
    </div>
  )
}

const arcadeGame: GameModule<ArcadeItem> = {
  id: 'arcade',
  titleKey: 'games.arcade.title',
  descriptionKey: 'games.arcade.description',
  icon: '⚡',
  buildItems: buildArcadeItems,
  Component: ArcadeRunner,
}

export default arcadeGame
