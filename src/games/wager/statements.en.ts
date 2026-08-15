import type { Difficulty } from '../difficulty'

export interface Statement {
  id: string
  text: { en: string; hu?: string }
  isTrue: boolean
  difficulty: Difficulty
}

/**
 * Igaz/hamis állítások. Azért ez a forma, és nem a triviakérdések, mert
 * a tétes mechanika akkor működik, ha mindig lehet tippelni: 50%-os
 * alapesély mellett a tét megválasztása valódi döntés, nem formalitás.
 */
export const STATEMENTS: Statement[] = [
  // ─────────────────────────────── MEDIUM ───────────────────────────────
  { id: 'brain-10', text: { en: 'Humans only use ten per cent of their brains.' }, isTrue: false, difficulty: 'medium' },
  { id: 'goldfish', text: { en: 'Goldfish have a memory of only about three seconds.' }, isTrue: false, difficulty: 'medium' },
  { id: 'bulls-red', text: { en: 'Bulls become enraged by the colour red.' }, isTrue: false, difficulty: 'medium' },
  { id: 'camel-water', text: { en: 'Camels store water in their humps.' }, isTrue: false, difficulty: 'medium' },
  { id: 'bats-blind', text: { en: 'Bats are blind.' }, isTrue: false, difficulty: 'medium' },
  { id: 'turkey-capital', text: { en: 'The capital of Turkey is Istanbul.' }, isTrue: false, difficulty: 'medium' },
  { id: 'honey-spoil', text: { en: 'Honey does not spoil.' }, isTrue: true, difficulty: 'medium' },
  { id: 'antarctica-desert', text: { en: 'Antarctica counts as a desert.' }, isTrue: true, difficulty: 'medium' },
  { id: 'venus-backwards', text: { en: 'Venus rotates in the opposite direction to most planets.' }, isTrue: true, difficulty: 'medium' },
  { id: 'octopus-blue', text: { en: 'Octopus blood is blue.' }, isTrue: true, difficulty: 'medium' },
  { id: 'great-wall-space', text: { en: 'The Great Wall of China is visible from space with the naked eye.' }, isTrue: false, difficulty: 'medium' },
  { id: 'hungarian-gender', text: { en: 'Hungarian has no grammatical gender.' }, isTrue: true, difficulty: 'medium' },

  { id: 'pacific-vs-land', text: { en: 'The Pacific Ocean covers more area than all the land on Earth combined.' }, isTrue: true, difficulty: 'medium' },
  { id: 'shrimp-heart', text: { en: 'A shrimp’s heart is located in its head.' }, isTrue: true, difficulty: 'medium' },
  { id: 'banana-radioactive', text: { en: 'Bananas are slightly radioactive.' }, isTrue: true, difficulty: 'medium' },
  { id: 'eiffel-temporary', text: { en: 'The Eiffel Tower was built as a temporary structure.' }, isTrue: true, difficulty: 'medium' },
  { id: 'perihelion-july', text: { en: 'Earth is closest to the Sun in July.' }, isTrue: false, difficulty: 'medium' },
  { id: 'knuckle-arthritis', text: { en: 'Cracking your knuckles causes arthritis.' }, isTrue: false, difficulty: 'medium' },
  { id: 'hair-after-death', text: { en: 'Hair and fingernails keep growing after death.' }, isTrue: false, difficulty: 'medium' },
  { id: 'sugar-hyperactive', text: { en: 'Sugar makes children hyperactive.' }, isTrue: false, difficulty: 'medium' },

  // ──────────────────────────────── HARD ────────────────────────────────
  { id: 'sahara-largest', text: { en: 'The Sahara is the largest desert on Earth.' }, isTrue: false, difficulty: 'hard' },
  { id: 'everest-tallest', text: { en: 'Measured from base to peak, Everest is the tallest mountain on Earth.' }, isTrue: false, difficulty: 'hard' },
  { id: 'diamonds-coal', text: { en: 'Diamonds form from coal.' }, isTrue: false, difficulty: 'hard' },
  { id: 'glass-liquid', text: { en: 'Window glass slowly flows downwards at room temperature.' }, isTrue: false, difficulty: 'hard' },
  { id: 'tongue-map', text: { en: 'Different regions of the tongue detect different basic tastes.' }, isTrue: false, difficulty: 'hard' },
  { id: 'sound-water', text: { en: 'Sound travels faster through air than through water.' }, isTrue: false, difficulty: 'hard' },
  { id: 'sushi-raw', text: { en: 'The Japanese word sushi means raw fish.' }, isTrue: false, difficulty: 'hard' },
  { id: 'baby-bones', text: { en: 'Adults have more bones than newborn babies.' }, isTrue: false, difficulty: 'hard' },
  { id: 'venus-day-year', text: { en: 'A day on Venus lasts longer than a year on Venus.' }, isTrue: true, difficulty: 'hard' },
  { id: 'bananas-berries', text: { en: 'Botanically, bananas are berries but strawberries are not.' }, isTrue: true, difficulty: 'hard' },
  { id: 'sharks-trees', text: { en: 'Sharks existed before trees did.' }, isTrue: true, difficulty: 'hard' },
  { id: 'eiffel-summer', text: { en: 'The Eiffel Tower is measurably taller in summer than in winter.' }, isTrue: true, difficulty: 'hard' },
  { id: 'saturn-floats', text: { en: 'Saturn is less dense than water.' }, isTrue: true, difficulty: 'hard' },
  { id: 'finland-saunas', text: { en: 'Finland has more saunas than cars.' }, isTrue: true, difficulty: 'hard' },
  { id: 'iceland-mosquitoes', text: { en: 'Iceland has no native mosquitoes.' }, isTrue: true, difficulty: 'hard' },
  { id: 'chameleon-camouflage', text: { en: 'Chameleons change colour mainly to blend into their surroundings.' }, isTrue: false, difficulty: 'hard' },

  { id: 'pringles-inventor', text: { en: 'The man who designed the Pringles tube was buried in one.' }, isTrue: true, difficulty: 'hard' },
  { id: 'scots-snow-words', text: { en: 'Scots has more than four hundred words relating to snow.' }, isTrue: true, difficulty: 'hard' },
  { id: 'dna-length', text: { en: 'The DNA in a single human body, uncoiled, would reach far beyond the Sun.' }, isTrue: true, difficulty: 'hard' },
  { id: 'stars-vs-sand', text: { en: 'There are more stars in the observable universe than grains of sand on Earth.' }, isTrue: true, difficulty: 'hard' },
  { id: 'everest-shrinking', text: { en: 'Mount Everest is getting shorter every year.' }, isTrue: false, difficulty: 'hard' },
  { id: 'titanic-second', text: { en: 'The Titanic sank on its second voyage.' }, isTrue: false, difficulty: 'hard' },
  { id: 'alcohol-brain-cells', text: { en: 'Drinking alcohol kills brain cells outright.' }, isTrue: false, difficulty: 'hard' },
  { id: 'penny-skyscraper', text: { en: 'A coin dropped from a skyscraper could kill a person below.' }, isTrue: false, difficulty: 'hard' },

  // ─────────────────────────────── BRUTAL ───────────────────────────────
  { id: 'oxford-aztec', text: { en: 'Oxford University was already teaching before the Aztec Empire was founded.' }, isTrue: true, difficulty: 'brutal' },
  { id: 'cleopatra-moon', text: { en: 'Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.' }, isTrue: true, difficulty: 'brutal' },
  { id: 'chess-atoms', text: { en: 'There are more possible chess games than atoms in the observable universe.' }, isTrue: true, difficulty: 'brutal' },
  { id: 'nintendo-ottoman', text: { en: 'Nintendo was founded before the Ottoman Empire fell.' }, isTrue: true, difficulty: 'brutal' },
  { id: 'harvard-calculus', text: { en: 'Harvard University was founded before calculus was invented.' }, isTrue: true, difficulty: 'brutal' },
  { id: 'wombat-cubes', text: { en: 'Wombats produce cube-shaped droppings.' }, isTrue: true, difficulty: 'brutal' },
  { id: 'penguin-knight', text: { en: 'A penguin holds a knighthood in the Norwegian King’s Guard.' }, isTrue: true, difficulty: 'brutal' },
  { id: 'shortest-war', text: { en: 'The shortest war in recorded history lasted less than an hour.' }, isTrue: true, difficulty: 'brutal' },
  { id: 'scotland-unicorn', text: { en: 'The national animal of Scotland is the unicorn.' }, isTrue: true, difficulty: 'brutal' },
  { id: 'tittle', text: { en: 'The dot above a lowercase letter i is called a tittle.' }, isTrue: true, difficulty: 'brutal' },
  { id: 'tokyo-australia', text: { en: 'More people live in Greater Tokyo than in the whole of Australia.' }, isTrue: true, difficulty: 'brutal' },
  { id: 'viking-horns', text: { en: 'Viking warriors wore horned helmets in battle.' }, isTrue: false, difficulty: 'brutal' },
  { id: 'coriolis-sink', text: { en: 'The Coriolis effect decides which way water spirals down a household drain.' }, isTrue: false, difficulty: 'brutal' },
  { id: 'einstein-maths', text: { en: 'Albert Einstein failed mathematics at school.' }, isTrue: false, difficulty: 'brutal' },
  { id: 'greenland-australia', text: { en: 'Greenland is larger than Australia.' }, isTrue: false, difficulty: 'brutal' },
  { id: 'canary-birds', text: { en: 'The Canary Islands are named after the canary bird.' }, isTrue: false, difficulty: 'brutal' },
  { id: 'nobel-maths', text: { en: 'The Nobel Prizes include a category for mathematics.' }, isTrue: false, difficulty: 'brutal' },
  { id: 'liberty-britain', text: { en: 'The Statue of Liberty was a gift from Britain.' }, isTrue: false, difficulty: 'brutal' },
  { id: 'pluto-orbit', text: { en: 'Pluto has completed a full orbit of the Sun since it was discovered.' }, isTrue: false, difficulty: 'brutal' },
  { id: 'vatican-monaco', text: { en: 'Vatican City has a larger population than Monaco.' }, isTrue: false, difficulty: 'brutal' },
  { id: 'hoover-dam', text: { en: 'The Hoover Dam was completed in the 1950s.' }, isTrue: false, difficulty: 'brutal' },
  { id: 'hundred-years-exact', text: { en: "The Hundred Years' War lasted exactly one hundred years." }, isTrue: false, difficulty: 'brutal' },
]
