import { QuizRunner } from '../../ui/QuizRunner'
import { TRIVIA_QUESTIONS, type TriviaDifficulty, type TriviaQuestion } from './questions.en'
import type { Rng } from '../../core/rng'
import type { GameModule } from '../types'

/**
 * Egy kör összetétele. A sorrend szándékos: a kör könnyebben indul és
 * a végére nehezedik, így az utolsó öt — dupla pontot érő — kérdés a
 * legnehezebbekből kerül ki, és a kör tényleg a hajrában dőlhet el.
 */
const ROUND_MIX: Array<[TriviaDifficulty, number]> = [
  ['medium', 10],
  ['hard', 12],
  ['brutal', 8],
]

const DOUBLE_FROM = 25

function poolFor(difficulty: TriviaDifficulty): TriviaQuestion[] {
  return TRIVIA_QUESTIONS.filter((question) => question.difficulty === difficulty)
}

function buildRound(rng: Rng): TriviaQuestion[] {
  return ROUND_MIX.flatMap(([difficulty, count]) => rng.pick(poolFor(difficulty), count))
}

const triviaGame: GameModule<TriviaQuestion> = {
  id: 'trivia',
  titleKey: 'games.trivia.title',
  descriptionKey: 'games.trivia.description',
  icon: '🧠',

  buildItems: buildRound,

  Component: ({ items, durationSec, onComplete }) => (
    <QuizRunner<TriviaQuestion>
      items={items}
      durationSec={durationSec}
      renderPrompt={(question) => question.prompt.en}
      getChoices={(question) => question.choices.en}
      isCorrect={(question, choiceIndex) => choiceIndex === question.correctIndex}
      weightOf={(_question, index) => (index >= DOUBLE_FROM ? 2 : 1)}
      onComplete={onComplete}
    />
  ),
}

export default triviaGame
export { ROUND_MIX, poolFor }
