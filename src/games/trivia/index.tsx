import { TRIVIA_QUESTIONS, type TriviaQuestion } from './questions.en'
import { buildEscalatingRound, mixSize, type RoundMix } from '../difficulty'
import { QuizRunner } from '../../ui/QuizRunner'
import type { GameModule } from '../types'

const ROUND_MIX: RoundMix = [
  ['medium', 10],
  ['hard', 12],
  ['brutal', 8],
]

/** Az utolsó öt kérdés duplán számít — így a kör a hajrában dőlhet el. */
const DOUBLE_FROM = mixSize(ROUND_MIX) - 5

const triviaGame: GameModule<TriviaQuestion> = {
  id: 'trivia',
  titleKey: 'games.trivia.title',
  descriptionKey: 'games.trivia.description',
  icon: '🧠',

  buildItems: (rng) => buildEscalatingRound(TRIVIA_QUESTIONS, rng, ROUND_MIX),

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
export { ROUND_MIX }
