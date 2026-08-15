import type { Rng } from '../core/rng'

/**
 * Nincs "easy" szint. A közönség művelt huszonévesekből áll, és ha
 * mindkét autó közel maximumot ér el, a pontszámok nem szóródnak —
 * a kör gyakorlatilag döntetlen lesz. A szóródás maga a játékmenet.
 */
export type Difficulty = 'medium' | 'hard' | 'brutal'

export const DIFFICULTY_ORDER: Difficulty[] = ['medium', 'hard', 'brutal']

export interface HasDifficulty {
  difficulty: Difficulty
}

/** Hány feladat jöjjön az egyes szintekről egy körben. */
export type RoundMix = ReadonlyArray<readonly [Difficulty, number]>

/**
 * Emelkedő nehézségű feladatsort épít: a kör könnyebben indul és a
 * végére nehezedik. Így a dupla pontot érő záró feladatok automatikusan
 * a legnehezebbek közül kerülnek ki, és a kör a hajrában dőlhet el.
 */
export function buildEscalatingRound<T extends HasDifficulty>(
  pool: readonly T[],
  rng: Rng,
  mix: RoundMix,
): T[] {
  return mix.flatMap(([difficulty, count]) =>
    rng.pick(
      pool.filter((item) => item.difficulty === difficulty),
      count,
    ),
  )
}

export function poolFor<T extends HasDifficulty>(
  pool: readonly T[],
  difficulty: Difficulty,
): T[] {
  return pool.filter((item) => item.difficulty === difficulty)
}

/** Hány feladatot ad egy mix összesen. */
export function mixSize(mix: RoundMix): number {
  return mix.reduce((sum, [, count]) => sum + count, 0)
}
