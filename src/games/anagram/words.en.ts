import type { Difficulty } from '../difficulty'

export interface AnagramWord {
  id: string
  word: string
  /** Kategória-segítség, enélkül egy hosszú anagramma reménytelen. */
  hint: { en: string; hu?: string }
  difficulty: Difficulty
}

export const ANAGRAM_WORDS: AnagramWord[] = [
  // ─────────────────────────────── MEDIUM ───────────────────────────────
  { id: 'elephant', word: 'ELEPHANT', hint: { en: 'Animal' }, difficulty: 'medium' },
  { id: 'portugal', word: 'PORTUGAL', hint: { en: 'Country' }, difficulty: 'medium' },
  { id: 'mountain', word: 'MOUNTAIN', hint: { en: 'Landscape' }, difficulty: 'medium' },
  { id: 'library', word: 'LIBRARY', hint: { en: 'Building' }, difficulty: 'medium' },
  { id: 'diamond', word: 'DIAMOND', hint: { en: 'Mineral' }, difficulty: 'medium' },
  { id: 'penguin', word: 'PENGUIN', hint: { en: 'Animal' }, difficulty: 'medium' },
  { id: 'captain', word: 'CAPTAIN', hint: { en: 'Job' }, difficulty: 'medium' },
  { id: 'hospital', word: 'HOSPITAL', hint: { en: 'Building' }, difficulty: 'medium' },
  { id: 'magazine', word: 'MAGAZINE', hint: { en: 'Object' }, difficulty: 'medium' },
  { id: 'triangle', word: 'TRIANGLE', hint: { en: 'Shape' }, difficulty: 'medium' },
  { id: 'keyboard', word: 'KEYBOARD', hint: { en: 'Object' }, difficulty: 'medium' },
  { id: 'chocolate', word: 'CHOCOLATE', hint: { en: 'Food' }, difficulty: 'medium' },
  { id: 'butterfly', word: 'BUTTERFLY', hint: { en: 'Animal' }, difficulty: 'medium' },
  { id: 'december', word: 'DECEMBER', hint: { en: 'Month' }, difficulty: 'medium' },
  { id: 'festival', word: 'FESTIVAL', hint: { en: 'Event' }, difficulty: 'medium' },

  // ──────────────────────────────── HARD ────────────────────────────────
  { id: 'architect', word: 'ARCHITECT', hint: { en: 'Job' }, difficulty: 'hard' },
  { id: 'orchestra', word: 'ORCHESTRA', hint: { en: 'Music' }, difficulty: 'hard' },
  { id: 'submarine', word: 'SUBMARINE', hint: { en: 'Vehicle' }, difficulty: 'hard' },
  { id: 'labyrinth', word: 'LABYRINTH', hint: { en: 'Structure' }, difficulty: 'hard' },
  { id: 'telescope', word: 'TELESCOPE', hint: { en: 'Instrument' }, difficulty: 'hard' },
  { id: 'crocodile', word: 'CROCODILE', hint: { en: 'Animal' }, difficulty: 'hard' },
  { id: 'lighthouse', word: 'LIGHTHOUSE', hint: { en: 'Building' }, difficulty: 'hard' },
  { id: 'blacksmith', word: 'BLACKSMITH', hint: { en: 'Job' }, difficulty: 'hard' },
  { id: 'waterfall', word: 'WATERFALL', hint: { en: 'Landscape' }, difficulty: 'hard' },
  { id: 'champagne', word: 'CHAMPAGNE', hint: { en: 'Drink' }, difficulty: 'hard' },
  { id: 'detective', word: 'DETECTIVE', hint: { en: 'Job' }, difficulty: 'hard' },
  { id: 'algorithm', word: 'ALGORITHM', hint: { en: 'Computing' }, difficulty: 'hard' },
  { id: 'accordion', word: 'ACCORDION', hint: { en: 'Instrument' }, difficulty: 'hard' },
  { id: 'antarctica', word: 'ANTARCTICA', hint: { en: 'Continent' }, difficulty: 'hard' },
  { id: 'quarantine', word: 'QUARANTINE', hint: { en: 'Medicine' }, difficulty: 'hard' },
  { id: 'silhouette', word: 'SILHOUETTE', hint: { en: 'Art' }, difficulty: 'hard' },

  // ─────────────────────────────── BRUTAL ───────────────────────────────
  { id: 'philosopher', word: 'PHILOSOPHER', hint: { en: 'Job' }, difficulty: 'brutal' },
  { id: 'constellation', word: 'CONSTELLATION', hint: { en: 'Astronomy' }, difficulty: 'brutal' },
  { id: 'archipelago', word: 'ARCHIPELAGO', hint: { en: 'Geography' }, difficulty: 'brutal' },
  { id: 'metamorphosis', word: 'METAMORPHOSIS', hint: { en: 'Biology' }, difficulty: 'brutal' },
  { id: 'kaleidoscope', word: 'KALEIDOSCOPE', hint: { en: 'Object' }, difficulty: 'brutal' },
  { id: 'renaissance', word: 'RENAISSANCE', hint: { en: 'History' }, difficulty: 'brutal' },
  { id: 'mediterranean', word: 'MEDITERRANEAN', hint: { en: 'Geography' }, difficulty: 'brutal' },
  { id: 'choreography', word: 'CHOREOGRAPHY', hint: { en: 'Dance' }, difficulty: 'brutal' },
  { id: 'bureaucracy', word: 'BUREAUCRACY', hint: { en: 'Politics' }, difficulty: 'brutal' },
  { id: 'hieroglyph', word: 'HIEROGLYPH', hint: { en: 'Writing' }, difficulty: 'brutal' },
  { id: 'thermodynamics', word: 'THERMODYNAMICS', hint: { en: 'Physics' }, difficulty: 'brutal' },
  { id: 'onomatopoeia', word: 'ONOMATOPOEIA', hint: { en: 'Language' }, difficulty: 'brutal' },
  { id: 'perpendicular', word: 'PERPENDICULAR', hint: { en: 'Geometry' }, difficulty: 'brutal' },
  { id: 'extraordinary', word: 'EXTRAORDINARY', hint: { en: 'Adjective' }, difficulty: 'brutal' },
]
