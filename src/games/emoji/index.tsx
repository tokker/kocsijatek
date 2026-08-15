import { EMOJI_PUZZLES, type EmojiPuzzle } from './puzzles.en'
import { buildEscalatingRound, mixSize, type RoundMix } from '../difficulty'
import { shuffleChoices } from '../choices'
import { QuizRunner } from '../../ui/QuizRunner'
import type { GameModule } from '../types'

const ROUND_MIX: RoundMix = [
  ['medium', 8],
  ['hard', 9],
  ['brutal', 7],
]

/** Az utolsó öt rejtvény duplán számít. */
const DOUBLE_FROM = mixSize(ROUND_MIX) - 5

const emojiGame: GameModule<EmojiPuzzle> = {
  id: 'emoji',
  titleKey: 'games.emoji.title',
  descriptionKey: 'games.emoji.description',
  icon: '🎬',

  buildItems: (rng) =>
    buildEscalatingRound(EMOJI_PUZZLES, rng, ROUND_MIX).map((puzzle) =>
      shuffleChoices(puzzle, rng),
    ),

  Component: ({ items, durationSec, onComplete }) => (
    <QuizRunner<EmojiPuzzle>
      items={items}
      durationSec={durationSec}
      renderPrompt={(puzzle) => (
        // Az emoji sor a feladat maga, ezért kap kiemelt méretet.
        <span className="text-6xl leading-relaxed tracking-widest">{puzzle.emoji}</span>
      )}
      getChoices={(puzzle) => puzzle.choices.en}
      isCorrect={(puzzle, choiceIndex) => choiceIndex === puzzle.correctIndex}
      weightOf={(_puzzle, index) => (index >= DOUBLE_FROM ? 2 : 1)}
      onComplete={onComplete}
    />
  ),
}

export default emojiGame
export { ROUND_MIX }
