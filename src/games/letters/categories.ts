import { ANIMALS } from './lists/animals'
import { CAPITALS } from './lists/capitals'
import { CAR_BRANDS } from './lists/carBrands'
import { COUNTRIES } from './lists/countries'
import { FOODS } from './lists/foods'
import { wordSet } from '../text'
import type { Rng } from '../../core/rng'

export interface Category {
  id: string
  name: { en: string; hu?: string }
  words: Set<string>
}

export const CATEGORIES: Category[] = [
  { id: 'countries', name: { en: 'Countries' }, words: wordSet(COUNTRIES) },
  { id: 'capitals', name: { en: 'Capital cities' }, words: wordSet(CAPITALS) },
  { id: 'animals', name: { en: 'Animals' }, words: wordSet(ANIMALS) },
  { id: 'cars', name: { en: 'Car brands' }, words: wordSet(CAR_BRANDS) },
  { id: 'food', name: { en: 'Food and drink' }, words: wordSet(FOODS) },
]

/** Ennyi szónak legalább lennie kell egy betűre, hogy feladható legyen. */
const MIN_WORDS_PER_LETTER = 6

export interface Challenge {
  id: string
  categoryId: string
  categoryName: string
  letter: string
  /** Hány szó létezik egyáltalán erre a betűre. Ebből mérjük a teljesítményt. */
  available: number
}

function lettersWithEnoughWords(category: Category): string[] {
  const counts = new Map<string, number>()
  for (const word of category.words) {
    const initial = word[0]
    counts.set(initial, (counts.get(initial) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= MIN_WORDS_PER_LETTER)
    .map(([letter]) => letter)
    .sort()
}

/**
 * Hat feladat: kategória és kezdőbetű párok.
 *
 * Csak olyan betűt adunk fel, amire elég szó létezik a listában. Enélkül
 * kifoghatna valaki egy olyan párost, amire két szó sincs — az nem
 * nehéz feladat, hanem elrontott kör, és mivel a seed közös, MINDKÉT
 * autót egyformán sújtaná.
 */
export function buildChallenges(rng: Rng, count = 6): Challenge[] {
  const pool: Challenge[] = []

  for (const category of CATEGORIES) {
    for (const letter of lettersWithEnoughWords(category)) {
      pool.push({
        id: `${category.id}-${letter}`,
        categoryId: category.id,
        categoryName: category.name.en,
        letter,
        available: [...category.words].filter((word) => word.startsWith(letter)).length,
      })
    }
  }

  // Kategóriánként legfeljebb kettő, hogy ne hatszor országokat kelljen sorolni.
  const chosen: Challenge[] = []
  const perCategory = new Map<string, number>()

  for (const challenge of rng.shuffle(pool)) {
    if (chosen.length >= count) break
    const used = perCategory.get(challenge.categoryId) ?? 0
    if (used >= 2) continue
    perCategory.set(challenge.categoryId, used + 1)
    chosen.push(challenge)
  }

  return chosen
}

export function categoryById(id: string): Category | undefined {
  return CATEGORIES.find((category) => category.id === id)
}
