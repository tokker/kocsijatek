import type { Difficulty } from '../difficulty'

export interface NumberFact {
  id: string
  prompt: { en: string; hu?: string }
  answer: number
  /** Mekkora tévedésnél csökken nullára a pont. Évszámoknál kötelező. */
  tolerance: number
  /** Mértékegység a beviteli mező mellett, pl. "m", "km", "év". */
  unit?: string
  difficulty: Difficulty
}

export const NUMBER_FACTS: NumberFact[] = [
  // ─────────────────────────────── MEDIUM ───────────────────────────────
  {
    id: 'eiffel-height',
    prompt: { en: 'How tall is the Eiffel Tower, including its antennas?' },
    answer: 330,
    tolerance: 90,
    unit: 'm',
    difficulty: 'medium',
  },
  {
    id: 'everest-height',
    prompt: { en: 'How high is Mount Everest above sea level?' },
    answer: 8849,
    tolerance: 900,
    unit: 'm',
    difficulty: 'medium',
  },
  {
    id: 'un-members',
    prompt: { en: 'How many member states does the United Nations have?' },
    answer: 193,
    tolerance: 30,
    difficulty: 'medium',
  },
  {
    id: 'piano-keys',
    prompt: { en: 'How many keys does a standard full-size piano have?' },
    answer: 88,
    tolerance: 20,
    difficulty: 'medium',
  },
  {
    id: 'marathon-km',
    prompt: { en: 'How long is a marathon, in kilometres?' },
    answer: 42,
    tolerance: 8,
    unit: 'km',
    difficulty: 'medium',
  },
  {
    id: 'elements',
    prompt: { en: 'How many elements are on the periodic table?' },
    answer: 118,
    tolerance: 25,
    difficulty: 'medium',
  },
  {
    id: 'first-iphone',
    prompt: { en: 'In which year was the first iPhone released?' },
    answer: 2007,
    tolerance: 5,
    difficulty: 'medium',
  },
  {
    id: 'eu-members',
    prompt: { en: 'How many member states does the European Union have?' },
    answer: 27,
    tolerance: 8,
    difficulty: 'medium',
  },
  {
    id: 'moon-distance',
    prompt: { en: 'How far is the Moon from Earth, in thousands of kilometres?' },
    answer: 384,
    tolerance: 150,
    unit: 'thousand km',
    difficulty: 'medium',
  },
  {
    id: 'human-teeth',
    prompt: { en: 'How many teeth does an adult human normally have?' },
    answer: 32,
    tolerance: 8,
    difficulty: 'medium',
  },

  // ──────────────────────────────── HARD ────────────────────────────────
  {
    id: 'danube-length',
    prompt: { en: 'How long is the Danube, in kilometres?' },
    answer: 2850,
    tolerance: 800,
    unit: 'km',
    difficulty: 'hard',
  },
  {
    id: 'light-speed',
    prompt: { en: 'What is the speed of light, in thousands of kilometres per second?' },
    answer: 300,
    tolerance: 90,
    unit: 'thousand km/s',
    difficulty: 'hard',
  },
  {
    id: 'earth-diameter',
    prompt: { en: 'What is the diameter of the Earth, in kilometres?' },
    answer: 12742,
    tolerance: 4000,
    unit: 'km',
    difficulty: 'hard',
  },
  {
    id: 'hungarian-alphabet',
    prompt: { en: 'How many letters are in the Hungarian alphabet?' },
    answer: 44,
    tolerance: 10,
    difficulty: 'hard',
  },
  {
    id: 'eu-languages',
    prompt: { en: 'How many official languages does the European Union have?' },
    answer: 24,
    tolerance: 7,
    difficulty: 'hard',
  },
  {
    id: 'scrabble-squares',
    prompt: { en: 'How many squares are on a Scrabble board?' },
    answer: 225,
    tolerance: 70,
    difficulty: 'hard',
  },
  {
    id: 'first-olympics',
    prompt: { en: 'In which year were the first modern Olympic Games held?' },
    answer: 1896,
    tolerance: 20,
    difficulty: 'hard',
  },
  {
    id: 'sun-surface',
    prompt: { en: 'How hot is the surface of the Sun, in degrees Celsius?' },
    answer: 5500,
    tolerance: 2500,
    unit: '°C',
    difficulty: 'hard',
  },
  {
    id: 'newborn-bones',
    prompt: { en: 'How many bones does a newborn baby have?' },
    answer: 270,
    tolerance: 80,
    difficulty: 'hard',
  },
  {
    id: 'mars-year',
    prompt: { en: 'How many Earth days does Mars take to orbit the Sun?' },
    answer: 687,
    tolerance: 250,
    unit: 'days',
    difficulty: 'hard',
  },
  {
    id: 'tokyo-metro-population',
    prompt: { en: 'How many million people live in the Greater Tokyo area?' },
    answer: 37,
    tolerance: 15,
    unit: 'million',
    difficulty: 'hard',
  },
  {
    id: 'hungary-eu-join',
    prompt: { en: 'In which year did Hungary join the European Union?' },
    answer: 2004,
    tolerance: 6,
    difficulty: 'hard',
  },

  // ─────────────────────────────── BRUTAL ───────────────────────────────
  {
    id: 'challenger-depth',
    prompt: { en: 'How deep is the Challenger Deep, in metres?' },
    answer: 10935,
    tolerance: 3000,
    unit: 'm',
    difficulty: 'brutal',
  },
  {
    id: 'everest-boiling',
    prompt: { en: 'At what temperature does water boil on the summit of Everest?' },
    answer: 71,
    tolerance: 20,
    unit: '°C',
    difficulty: 'brutal',
  },
  {
    id: 'concert-harp-strings',
    prompt: { en: 'How many strings does a concert harp have?' },
    answer: 47,
    tolerance: 15,
    difficulty: 'brutal',
  },
  {
    id: 'seconds-in-day',
    prompt: { en: 'How many seconds are there in a day?' },
    answer: 86400,
    tolerance: 20000,
    difficulty: 'brutal',
  },
  {
    id: 'human-muscles',
    prompt: { en: 'Roughly how many skeletal muscles does the human body have?' },
    answer: 600,
    tolerance: 250,
    difficulty: 'brutal',
  },
  {
    id: 'niagara-height',
    prompt: { en: 'How tall is Niagara Falls, in metres?' },
    answer: 51,
    tolerance: 25,
    unit: 'm',
    difficulty: 'brutal',
  },
  {
    id: 'friends-episodes',
    prompt: { en: 'How many episodes of the sitcom Friends were made?' },
    answer: 236,
    tolerance: 80,
    difficulty: 'brutal',
  },
  {
    id: 'foot-bones',
    prompt: { en: 'How many bones are there in one human foot?' },
    answer: 26,
    tolerance: 10,
    difficulty: 'brutal',
  },
  {
    id: 'trianon-year',
    prompt: { en: 'In which year was the Treaty of Trianon signed?' },
    answer: 1920,
    tolerance: 8,
    difficulty: 'brutal',
  },
  {
    id: 'vatican-area',
    prompt: { en: 'What is the area of Vatican City, in hectares?' },
    answer: 49,
    tolerance: 30,
    unit: 'ha',
    difficulty: 'brutal',
  },
]
