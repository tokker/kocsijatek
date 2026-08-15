import type { Rng } from '../../core/rng'
import type { Difficulty } from '../difficulty'

export type InkColor = 'red' | 'green' | 'blue' | 'yellow'

export const INK_CLASS: Record<InkColor, string> = {
  red: 'text-red-400',
  green: 'text-green-400',
  blue: 'text-blue-400',
  yellow: 'text-yellow-300',
}

export interface StroopTrial {
  /** A kiírt szó. */
  word: InkColor
  /** A betűk tényleges színe — erre kell válaszolni. */
  ink: InkColor
  options: InkColor[]
}

export interface MathProblem {
  text: string
  answer: number
  options: number[]
}

export type ArcadeItem =
  | { id: 'reaction'; kind: 'reaction'; difficulty: Difficulty; delaysMs: number[] }
  | { id: 'stroop'; kind: 'stroop'; difficulty: Difficulty; trials: StroopTrial[]; seconds: number }
  | { id: 'numbers'; kind: 'numbers'; difficulty: Difficulty; order: number[]; count: number }
  | { id: 'math'; kind: 'math'; difficulty: Difficulty; problems: MathProblem[]; seconds: number }

const COLORS: InkColor[] = ['red', 'green', 'blue', 'yellow']

/**
 * Minden kihívás adata a seedből épül, nem futásidejű véletlenből.
 *
 * Ez itt nem stílus kérdése: ha az egyik autó rövidebb várakozásokat
 * kapna a reakciótesztben vagy könnyebb szorzásokat, a mért eredmények
 * összehasonlíthatatlanok lennének.
 */
export function buildArcadeItems(rng: Rng): ArcadeItem[] {
  const delaysMs = Array.from({ length: 6 }, () => 1200 + rng.int(2600))

  const trials: StroopTrial[] = Array.from({ length: 40 }, () => {
    const ink = COLORS[rng.int(COLORS.length)]
    // A szó általában MÁS színt nevez meg, mint amilyennel írva van —
    // ettől ütközik a két inger, és ez a teszt lényege.
    const conflicting = COLORS.filter((color) => color !== ink)
    const word = rng.next() < 0.8 ? conflicting[rng.int(conflicting.length)] : ink
    return { word, ink, options: rng.shuffle(COLORS) }
  })

  const count = 25
  const order = rng.shuffle(Array.from({ length: count }, (_, i) => i))

  const problems: MathProblem[] = Array.from({ length: 40 }, () => {
    const mode = rng.int(3)
    let text: string
    let answer: number

    if (mode === 0) {
      const a = 12 + rng.int(78)
      const b = 12 + rng.int(78)
      text = `${a} + ${b}`
      answer = a + b
    } else if (mode === 1) {
      const a = 40 + rng.int(120)
      const b = 12 + rng.int(a - 20)
      text = `${a} − ${b}`
      answer = a - b
    } else {
      const a = 3 + rng.int(15)
      const b = 3 + rng.int(15)
      text = `${a} × ${b}`
      answer = a * b
    }

    // A hamis válaszok közel esnek a helyeshez, hogy tényleg számolni kelljen.
    const wrong = new Set<number>()
    while (wrong.size < 3) {
      const offset = 1 + rng.int(Math.max(4, Math.round(Math.abs(answer) * 0.15)))
      const candidate = answer + (rng.next() < 0.5 ? -offset : offset)
      if (candidate !== answer && candidate > 0) wrong.add(candidate)
    }

    return { text, answer, options: rng.shuffle([answer, ...wrong]) }
  })

  return [
    { id: 'reaction', kind: 'reaction', difficulty: 'medium', delaysMs },
    { id: 'stroop', kind: 'stroop', difficulty: 'hard', trials, seconds: 45 },
    { id: 'numbers', kind: 'numbers', difficulty: 'hard', order, count },
    { id: 'math', kind: 'math', difficulty: 'brutal', problems, seconds: 60 },
  ]
}

/**
 * A négy kihívás mértékegysége teljesen más (ezredmásodperc, találat,
 * másodperc), ezért mindegyiket 0–100-ra hozzuk egy reális
 * referenciateljesítményhez viszonyítva.
 */
export const SCORE = {
  reaction: (averageMs: number) => clamp((600 - averageMs) / 4),
  stroop: (correct: number) => clamp(correct * 4),
  numbers: (elapsedMs: number) => clamp((90_000 - elapsedMs) / 600),
  math: (correct: number) => clamp(correct * 7),
}

function clamp(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)))
}
