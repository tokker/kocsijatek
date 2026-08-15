import type { FC } from 'react'
import type { Rng } from '../core/rng'
import type { GameResult } from '../core/types'

export interface GameProps<TItem> {
  items: TItem[]
  durationSec: number
  onComplete: (result: GameResult) => void
}

export interface GameModule<TItem = unknown> {
  id: string
  /** i18n kulcs, pl. "games.trivia.title" */
  titleKey: string
  descriptionKey: string
  icon: string
  /**
   * Determinisztikus feladatsor a seedből. Ugyanaz a seed ugyanazt a
   * sort adja — ezen múlik, hogy a két csapat pontszáma összemérhető.
   */
  buildItems(rng: Rng): TItem[]
  Component: FC<GameProps<TItem>>
}
