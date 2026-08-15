import { QuizRunner } from '../../ui/QuizRunner'
import { TRIVIA_QUESTIONS, type TriviaQuestion } from './questions.en'
import type { GameModule } from '../types'

const QUESTION_COUNT = 30
/** Az utolsó öt kérdés duplán számít — így az utolsó percekben fordulhat a kör. */
const DOUBLE_FROM = 25

const triviaGame: GameModule<TriviaQuestion> = {
  id: 'trivia',
  titleKey: 'games.trivia.title',
  descriptionKey: 'games.trivia.description',
  icon: '🧠',

  buildItems: (rng) =>
    rng.pick(TRIVIA_QUESTIONS, Math.min(QUESTION_COUNT, TRIVIA_QUESTIONS.length)),

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
