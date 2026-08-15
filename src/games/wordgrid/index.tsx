import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { generateGrid, readLine, type Grid } from './generate'
import { GRID_THEMES } from './themes.en'
import type { Difficulty } from '../difficulty'
import { normalize } from '../../core/scoring'
import type { Rng } from '../../core/rng'
import { useCountdown } from '../../ui/useCountdown'
import type { GameModule, GameProps } from '../types'

/** Három rács, egyre nagyobb. A nehézség a méretből és a szószámból jön. */
const BOARDS: Array<{ size: number; wordCount: number; difficulty: Difficulty }> = [
  { size: 8, wordCount: 6, difficulty: 'medium' },
  { size: 10, wordCount: 8, difficulty: 'hard' },
  { size: 11, wordCount: 9, difficulty: 'brutal' },
]

export interface GridItem {
  id: string
  themeName: string
  grid: Grid
  difficulty: Difficulty
}

function buildItems(rng: Rng): GridItem[] {
  const themes = rng.pick(GRID_THEMES, BOARDS.length)
  return BOARDS.map((board, index) => {
    const theme = themes[index]
    return {
      id: `${theme.id}-${board.size}`,
      themeName: theme.name.en,
      grid: generateGrid(board.size, rng.pick(theme.words, board.wordCount), rng),
      difficulty: board.difficulty,
    }
  })
}

function formatClock(totalSeconds: number): string {
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
}

type Cell = { row: number; col: number }

function WordGridRunner({ items, durationSec, onComplete }: GameProps<GridItem>) {
  const [boardIndex, setBoardIndex] = useState(0)
  const [start, setStart] = useState<Cell | null>(null)
  const [found, setFound] = useState<Record<string, string[]>>({})
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null)
  const startedAt = useRef(Date.now())
  const finished = useRef(false)
  const foundRef = useRef(found)
  foundRef.current = found

  const allWords = useMemo(
    () => items.flatMap((item) => item.grid.words.map((placed) => `${item.id}:${placed.word}`)),
    [items],
  )

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true

    const hits = allWords.map((key) => {
      const [itemId, word] = key.split(':')
      return (foundRef.current[itemId] ?? []).includes(word)
    })

    onComplete({
      points: normalize(hits.filter(Boolean).length, allWords.length),
      rawScore: `${hits.filter(Boolean).length} / ${allWords.length} words`,
      items: hits,
      timeMs: Date.now() - startedAt.current,
    })
  }, [allWords, onComplete])

  const { secondsLeft } = useCountdown(durationSec, finish)

  useEffect(() => {
    if (items.length === 0) finish()
  }, [items.length, finish])

  const item = items[boardIndex]

  const tap = (cell: Cell) => {
    if (finished.current || !item) return
    if (!start) return setStart(cell)

    const line = readLine(item.grid, start, cell)
    setStart(null)
    if (!line) return

    // Visszafelé kiolvasva is elfogadjuk: a rácsban mindkét irány szerepel.
    const reversed = [...line].reverse().join('')
    const already = found[item.id] ?? []
    const target = item.grid.words
      .map((placed) => placed.word)
      .find((word) => (word === line || word === reversed) && !already.includes(word))

    if (!target) {
      setFlash('miss')
      setTimeout(() => setFlash(null), 350)
      return
    }

    setFound({ ...found, [item.id]: [...already, target] })
    setFlash('hit')
    setTimeout(() => setFlash(null), 350)
  }

  if (!item) return null

  const foundHere = found[item.id] ?? []
  const remaining = item.grid.words.filter((placed) => !foundHere.includes(placed.word))
  const lastBoard = boardIndex >= items.length - 1

  /** A megtalált szavak celláit kiemeljük. */
  const highlighted = new Set<string>()
  for (const placed of item.grid.words) {
    if (!foundHere.includes(placed.word)) continue
    for (let i = 0; i < placed.word.length; i++) {
      highlighted.add(`${placed.row + placed.dr * i},${placed.col + placed.dc * i}`)
    }
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          Grid {boardIndex + 1} / {items.length}
        </span>
        <span className="font-semibold text-slate-300">{item.themeName}</span>
        <span className={secondsLeft <= 30 ? 'font-semibold text-red-400' : ''}>
          {formatClock(secondsLeft)}
        </span>
      </div>

      <div
        className={`grid gap-0.5 rounded-xl p-1 transition-colors ${
          flash === 'hit' ? 'bg-green-800' : flash === 'miss' ? 'bg-red-900' : 'bg-slate-800'
        }`}
        style={{ gridTemplateColumns: `repeat(${item.grid.size}, minmax(0, 1fr))` }}
      >
        {item.grid.cells.map((row, r) =>
          row.map((letter, c) => {
            const isStart = start?.row === r && start?.col === c
            const isFound = highlighted.has(`${r},${c}`)
            return (
              <button
                key={`${r},${c}`}
                onClick={() => tap({ row: r, col: c })}
                className={`aspect-square rounded text-xs font-bold uppercase transition ${
                  isStart
                    ? 'bg-amber-500 text-slate-900'
                    : isFound
                      ? 'bg-emerald-600'
                      : 'bg-slate-700 active:bg-slate-600'
                }`}
              >
                {letter}
              </button>
            )
          }),
        )}
      </div>

      <p className="text-center text-xs text-slate-500">
        {start ? 'Now tap the last letter' : 'Tap the first letter of a word'}
      </p>

      <div className="flex flex-1 flex-wrap content-start gap-2">
        {item.grid.words.map((placed) => {
          const done = foundHere.includes(placed.word)
          return (
            <span
              key={placed.word}
              className={`rounded-lg px-2 py-1 text-sm ${
                done ? 'bg-emerald-900 text-emerald-300 line-through' : 'bg-slate-800'
              }`}
            >
              {placed.word}
            </span>
          )
        })}
      </div>

      <button
        onClick={() => (lastBoard ? finish() : setBoardIndex(boardIndex + 1))}
        className="min-h-14 rounded-2xl bg-slate-700 font-bold active:bg-slate-600"
      >
        {lastBoard
          ? 'Finish round'
          : remaining.length > 0
            ? `Next grid — ${remaining.length} still hidden`
            : 'Next grid'}
      </button>
    </div>
  )
}

const wordGridGame: GameModule<GridItem> = {
  id: 'wordgrid',
  titleKey: 'games.wordgrid.title',
  descriptionKey: 'games.wordgrid.description',
  icon: '🔡',
  buildItems,
  Component: WordGridRunner,
}

export default wordGridGame
export { BOARDS }
