export type TriviaCategory =
  | 'geography'
  | 'science'
  | 'history'
  | 'culture'
  | 'sport'
  | 'nature'

export interface TriviaQuestion {
  id: string
  /** A magyar fordítás később kerül bele; a szerkezet már most készen áll rá. */
  prompt: { en: string; hu?: string }
  choices: { en: string[]; hu?: string[] }
  correctIndex: number
  category: TriviaCategory
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 'geo-lakes',
    prompt: { en: 'Which country has the most natural lakes?' },
    choices: { en: ['Canada', 'Russia', 'Finland', 'Brazil'] },
    correctIndex: 0,
    category: 'geography',
  },
  {
    id: 'geo-australia-capital',
    prompt: { en: 'What is the capital of Australia?' },
    choices: { en: ['Sydney', 'Melbourne', 'Canberra', 'Perth'] },
    correctIndex: 2,
    category: 'geography',
  },
  {
    id: 'geo-canada-capital',
    prompt: { en: 'What is the capital of Canada?' },
    choices: { en: ['Toronto', 'Ottawa', 'Vancouver', 'Montreal'] },
    correctIndex: 1,
    category: 'geography',
  },
  {
    id: 'geo-smallest-country',
    prompt: { en: 'What is the smallest country in the world by area?' },
    choices: { en: ['Monaco', 'Nauru', 'San Marino', 'Vatican City'] },
    correctIndex: 3,
    category: 'geography',
  },
  {
    id: 'geo-longest-africa',
    prompt: { en: 'What is the longest river in Africa?' },
    choices: { en: ['Congo', 'Nile', 'Niger', 'Zambezi'] },
    correctIndex: 1,
    category: 'geography',
  },
  {
    id: 'geo-deepest-ocean',
    prompt: { en: 'Which ocean is the deepest?' },
    choices: { en: ['Atlantic', 'Indian', 'Pacific', 'Arctic'] },
    correctIndex: 2,
    category: 'geography',
  },
  {
    id: 'geo-continents',
    prompt: { en: 'How many continents are there?' },
    choices: { en: ['5', '6', '7', '8'] },
    correctIndex: 2,
    category: 'geography',
  },
  {
    id: 'geo-salty-float',
    prompt: { en: 'In which body of water can people float without effort?' },
    choices: { en: ['Black Sea', 'Dead Sea', 'Caspian Sea', 'Red Sea'] },
    correctIndex: 1,
    category: 'geography',
  },
  {
    id: 'geo-tallest-mountain',
    prompt: { en: 'Which mountain is the tallest above sea level?' },
    choices: { en: ['K2', 'Mount Everest', 'Denali', 'Kilimanjaro'] },
    correctIndex: 1,
    category: 'geography',
  },
  {
    id: 'geo-japan-currency',
    prompt: { en: 'What is the currency of Japan?' },
    choices: { en: ['Won', 'Yuan', 'Yen', 'Baht'] },
    correctIndex: 2,
    category: 'geography',
  },
  {
    id: 'sci-largest-planet',
    prompt: { en: 'What is the largest planet in the Solar System?' },
    choices: { en: ['Saturn', 'Jupiter', 'Neptune', 'Uranus'] },
    correctIndex: 1,
    category: 'science',
  },
  {
    id: 'sci-red-planet',
    prompt: { en: 'Which planet is known as the Red Planet?' },
    choices: { en: ['Venus', 'Mercury', 'Mars', 'Jupiter'] },
    correctIndex: 2,
    category: 'science',
  },
  {
    id: 'sci-gold-symbol',
    prompt: { en: 'Which element has the chemical symbol Au?' },
    choices: { en: ['Silver', 'Gold', 'Aluminium', 'Argon'] },
    correctIndex: 1,
    category: 'science',
  },
  {
    id: 'sci-liquid-metal',
    prompt: { en: 'Which metal is liquid at room temperature?' },
    choices: { en: ['Mercury', 'Lead', 'Tin', 'Zinc'] },
    correctIndex: 0,
    category: 'science',
  },
  {
    id: 'sci-hardest-substance',
    prompt: { en: 'What is the hardest natural substance on Earth?' },
    choices: { en: ['Quartz', 'Steel', 'Diamond', 'Granite'] },
    correctIndex: 2,
    category: 'science',
  },
  {
    id: 'sci-plants-gas',
    prompt: { en: 'Which gas do plants absorb from the air?' },
    choices: { en: ['Oxygen', 'Nitrogen', 'Hydrogen', 'Carbon dioxide'] },
    correctIndex: 3,
    category: 'science',
  },
  {
    id: 'sci-bones',
    prompt: { en: 'How many bones are in the adult human body?' },
    choices: { en: ['186', '206', '226', '246'] },
    correctIndex: 1,
    category: 'science',
  },
  {
    id: 'sci-sunlight-vitamin',
    prompt: { en: 'Which vitamin does the body produce from sunlight?' },
    choices: { en: ['Vitamin A', 'Vitamin B12', 'Vitamin C', 'Vitamin D'] },
    correctIndex: 3,
    category: 'science',
  },
  {
    id: 'sci-freezing-fahrenheit',
    prompt: { en: 'What is the freezing point of water in Fahrenheit?' },
    choices: { en: ['0', '32', '64', '100'] },
    correctIndex: 1,
    category: 'science',
  },
  {
    id: 'sci-minutes-in-day',
    prompt: { en: 'How many minutes are there in a full day?' },
    choices: { en: ['960', '1200', '1440', '1800'] },
    correctIndex: 2,
    category: 'science',
  },
  {
    id: 'his-paper',
    prompt: { en: 'In which country was paper invented?' },
    choices: { en: ['Egypt', 'China', 'India', 'Greece'] },
    correctIndex: 1,
    category: 'history',
  },
  {
    id: 'his-olympics-2016',
    prompt: { en: 'Which country hosted the 2016 Summer Olympics?' },
    choices: { en: ['China', 'Japan', 'Brazil', 'Greece'] },
    correctIndex: 2,
    category: 'history',
  },
  {
    id: 'his-berlin-wall',
    prompt: { en: 'In which year did the Berlin Wall fall?' },
    choices: { en: ['1987', '1989', '1991', '1993'] },
    correctIndex: 1,
    category: 'history',
  },
  {
    id: 'his-moon-landing',
    prompt: { en: 'In which year did humans first land on the Moon?' },
    choices: { en: ['1965', '1969', '1972', '1975'] },
    correctIndex: 1,
    category: 'history',
  },
  {
    id: 'cul-mona-lisa',
    prompt: { en: 'Who painted the Mona Lisa?' },
    choices: { en: ['Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Donatello'] },
    correctIndex: 2,
    category: 'culture',
  },
  {
    id: 'cul-romeo-juliet',
    prompt: { en: 'Who wrote Romeo and Juliet?' },
    choices: { en: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Oscar Wilde'] },
    correctIndex: 1,
    category: 'culture',
  },
  {
    id: 'cul-violin-strings',
    prompt: { en: 'How many strings does a standard violin have?' },
    choices: { en: ['4', '5', '6', '7'] },
    correctIndex: 0,
    category: 'culture',
  },
  {
    id: 'cul-most-native-speakers',
    prompt: { en: 'Which language has the most native speakers?' },
    choices: { en: ['English', 'Spanish', 'Hindi', 'Mandarin Chinese'] },
    correctIndex: 3,
    category: 'culture',
  },
  {
    id: 'spo-football-players',
    prompt: { en: 'How many players from one team are on the pitch in football?' },
    choices: { en: ['9', '10', '11', '12'] },
    correctIndex: 2,
    category: 'sport',
  },
  {
    id: 'spo-olympic-rings',
    prompt: { en: 'How many rings are on the Olympic flag?' },
    choices: { en: ['4', '5', '6', '7'] },
    correctIndex: 1,
    category: 'sport',
  },
  {
    id: 'nat-largest-mammal',
    prompt: { en: 'What is the largest mammal on Earth?' },
    choices: { en: ['African elephant', 'Blue whale', 'Giraffe', 'Orca'] },
    correctIndex: 1,
    category: 'nature',
  },
  {
    id: 'nat-kangaroo',
    prompt: { en: 'Which country is the natural home of the kangaroo?' },
    choices: { en: ['South Africa', 'Australia', 'Argentina', 'India'] },
    correctIndex: 1,
    category: 'nature',
  },
  {
    id: 'nat-fastest-land',
    prompt: { en: 'What is the fastest land animal?' },
    choices: { en: ['Lion', 'Pronghorn', 'Cheetah', 'Horse'] },
    correctIndex: 2,
    category: 'nature',
  },
  {
    id: 'nat-honey-insect',
    prompt: { en: 'Which insect produces honey?' },
    choices: { en: ['Wasp', 'Bee', 'Ant', 'Beetle'] },
    correctIndex: 1,
    category: 'nature',
  },
]
