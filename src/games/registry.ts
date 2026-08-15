import anagramGame from './anagram'
import closestGame from './closest'
import emojiGame from './emoji'
import flagsGame from './flags'
import triviaGame from './trivia'
import wagerGame from './wager'
import zoomGame from './zoom'
import type { GameModule } from './types'

/**
 * A játékok nyilvántartása. Új játék hozzáadása EGY sor itt, plusz egy
 * fájl — a motor, a szinkron és a képernyők változatlanok maradnak.
 */
const modules = [
  triviaGame,
  emojiGame,
  flagsGame,
  closestGame,
  wagerGame,
  anagramGame,
  zoomGame,
] as unknown as GameModule[]

export const GAMES: Record<string, GameModule> = Object.fromEntries(
  modules.map((module) => [module.id, module]),
)

export const GAME_IDS = Object.keys(GAMES)

export function getGame(id: string): GameModule {
  const game = GAMES[id]
  if (!game) throw new Error(`Unknown game: ${id}`)
  return game
}
