import type { Rng } from '../../core/rng'

export interface PlacedWord {
  word: string
  row: number
  col: number
  /** Irányvektor: dr sorlépés, dc oszloplépés. */
  dr: number
  dc: number
}

export interface Grid {
  size: number
  cells: string[][]
  words: PlacedWord[]
}

/** Nyolc irány, tehát visszafelé és átlósan is rejtőzhet szó. */
const DIRECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [-1, 1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [1, -1],
]

/**
 * Kitöltő betűk gyakoriság szerint súlyozva. Egyenletes A-Z eloszlásnál
 * a rács tele lenne Q, X és Z betűkkel, ami azonnal elárulná, hol NINCS
 * rejtett szó — a kitöltés önmaga adna fogódzót.
 */
const FILLER = 'EEEEEAAAAIIIIOOOONNNRRRTTTLLSSUUDDGGCCMMBBPPHHFFVWYKJXQZ'

function fits(grid: string[][], word: string, row: number, col: number, dr: number, dc: number) {
  const size = grid.length
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i
    const c = col + dc * i
    if (r < 0 || c < 0 || r >= size || c >= size) return false
    const existing = grid[r][c]
    // Keresztezés csak ott, ahol a betűk egyeznek.
    if (existing !== '' && existing !== word[i]) return false
  }
  return true
}

/**
 * Betűrácsot épít a megadott szavakkal.
 *
 * Determinisztikus: ugyanaz a seed ugyanazt a rácsot adja, tehát a két
 * autó pontosan ugyanazt a feladványt kapja — enélkül a pontszámaik
 * összehasonlíthatatlanok lennének.
 */
export function generateGrid(size: number, words: readonly string[], rng: Rng): Grid {
  const cells: string[][] = Array.from({ length: size }, () => Array<string>(size).fill(''))
  const placed: PlacedWord[] = []

  // Hosszabb szavakat előbb: a nagyokat nehezebb elhelyezni, és ha a
  // rövidek foglalják el a helyet, a hosszúak kimaradnának.
  const ordered = [...words].sort((a, b) => b.length - a.length)

  for (const word of ordered) {
    if (word.length > size) continue

    let done = false
    for (let attempt = 0; attempt < 200 && !done; attempt++) {
      const [dr, dc] = DIRECTIONS[rng.int(DIRECTIONS.length)]
      const row = rng.int(size)
      const col = rng.int(size)
      if (!fits(cells, word, row, col, dr, dc)) continue

      for (let i = 0; i < word.length; i++) {
        cells[row + dr * i][col + dc * i] = word[i]
      }
      placed.push({ word, row, col, dr, dc })
      done = true
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cells[r][c] === '') cells[r][c] = FILLER[rng.int(FILLER.length)]
    }
  }

  return { size, cells, words: placed }
}

/**
 * A két megjelölt cella közti egyenes mentén kiolvasott szó.
 * Null, ha a két cella nem esik egy sorba, oszlopba vagy átlóba.
 */
export function readLine(
  grid: Grid,
  from: { row: number; col: number },
  to: { row: number; col: number },
): string | null {
  const dr = to.row - from.row
  const dc = to.col - from.col
  const steps = Math.max(Math.abs(dr), Math.abs(dc))
  if (steps === 0) return null
  // Csak vízszintes, függőleges vagy pontosan 45 fokos átló érvényes.
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null

  const stepR = dr === 0 ? 0 : dr / Math.abs(dr)
  const stepC = dc === 0 ? 0 : dc / Math.abs(dc)

  let word = ''
  for (let i = 0; i <= steps; i++) {
    word += grid.cells[from.row + stepR * i][from.col + stepC * i]
  }
  return word
}

/** A rácsban ténylegesen elhelyezett szavak, ahogy a játékos kereshet rájuk. */
export function findableWords(grid: Grid): string[] {
  return grid.words.map((placed) => placed.word)
}
