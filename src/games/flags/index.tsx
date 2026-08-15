import { FlagSvg } from './FlagSvg'
import { FLAG_QUESTIONS, type FlagQuestion } from './flags.en'
import { buildEscalatingRound, mixSize, type RoundMix } from '../difficulty'
import { QuizRunner } from '../../ui/QuizRunner'
import type { GameModule } from '../types'

const ROUND_MIX: RoundMix = [
  ['medium', 8],
  ['hard', 9],
  ['brutal', 8],
]

const DOUBLE_FROM = mixSize(ROUND_MIX) - 5

const flagsGame: GameModule<FlagQuestion> = {
  id: 'flags',
  titleKey: 'games.flags.title',
  descriptionKey: 'games.flags.description',
  icon: '🚩',

  buildItems: (rng) => buildEscalatingRound(FLAG_QUESTIONS, rng, ROUND_MIX),

  Component: ({ items, durationSec, onComplete }) => (
    <QuizRunner<FlagQuestion>
      items={items}
      durationSec={durationSec}
      renderPrompt={(question) => (
        <FlagSvg spec={question.spec} className="mx-auto h-40 w-auto rounded-lg shadow-lg" />
      )}
      getChoices={(question) => question.choices.en}
      isCorrect={(question, choiceIndex) => choiceIndex === question.correctIndex}
      weightOf={(_question, index) => (index >= DOUBLE_FROM ? 2 : 1)}
      onComplete={onComplete}
    />
  ),
}

export default flagsGame
export { ROUND_MIX }
