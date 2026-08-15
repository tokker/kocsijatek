import { describe, expect, it } from 'vitest'
import { generateGrid, readLine } from './generate'
import { createRng } from '../../core/rng'

const WORDS = ['PLANET', 'COMET', 'ORBIT', 'GALAXY', 'NEBULA', 'STAR']

describe('generateGrid', () => {
  it('is deterministic for a seed', () => {
    expect(generateGrid(10, WORDS, createRng('s'))).toEqual(
      generateGrid(10, WORDS, createRng('s')),
    )
  })

  it('differs between seeds', () => {
    const a = generateGrid(10, WORDS, createRng('s1'))
    const b = generateGrid(10, WORDS, createRng('s2'))
    expect(a.cells).not.toEqual(b.cells)
  })

  it('fills every cell with a letter', () => {
    const grid = generateGrid(10, WORDS, createRng('s'))
    for (const row of grid.cells) {
      expect(row).toHaveLength(10)
      for (const cell of row) expect(cell).toMatch(/^[A-Z]$/)
    }
  })

  it('places every word that fits', () => {
    const grid = generateGrid(12, WORDS, createRng('s'))
    expect(grid.words.map((w) => w.word).sort()).toEqual([...WORDS].sort())
  })

  it('actually writes each placed word into the grid', () => {
    const grid = generateGrid(10, WORDS, createRng('s'))
    for (const placed of grid.words) {
      let read = ''
      for (let i = 0; i < placed.word.length; i++) {
        read += grid.cells[placed.row + placed.dr * i][placed.col + placed.dc * i]
      }
      expect(read, placed.word).toBe(placed.word)
    }
  })

  it('keeps every placed word inside the grid', () => {
    const grid = generateGrid(8, WORDS, createRng('s'))
    for (const placed of grid.words) {
      const endRow = placed.row + placed.dr * (placed.word.length - 1)
      const endCol = placed.col + placed.dc * (placed.word.length - 1)
      for (const value of [placed.row, placed.col, endRow, endCol]) {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(8)
      }
    }
  })

  it('skips words longer than the grid rather than crashing', () => {
    const grid = generateGrid(4, ['ENORMOUSWORD', 'CAT'], createRng('s'))
    expect(grid.words.map((w) => w.word)).toEqual(['CAT'])
  })
})

describe('readLine', () => {
  const grid = generateGrid(6, ['STAR'], createRng('fixed'))

  it('reads a horizontal run', () => {
    const word = readLine(grid, { row: 2, col: 0 }, { row: 2, col: 3 })
    expect(word).toHaveLength(4)
  })

  it('reads a diagonal run', () => {
    const word = readLine(grid, { row: 0, col: 0 }, { row: 3, col: 3 })
    expect(word).toHaveLength(4)
  })

  it('reads backwards too', () => {
    const forward = readLine(grid, { row: 1, col: 1 }, { row: 1, col: 4 })!
    const backward = readLine(grid, { row: 1, col: 4 }, { row: 1, col: 1 })!
    expect(backward).toBe([...forward].reverse().join(''))
  })

  it('rejects a crooked line', () => {
    expect(readLine(grid, { row: 0, col: 0 }, { row: 1, col: 3 })).toBeNull()
  })

  it('rejects a single cell', () => {
    expect(readLine(grid, { row: 2, col: 2 }, { row: 2, col: 2 })).toBeNull()
  })

  it('finds the word that was planted', () => {
    const planted = grid.words[0]
    const end = {
      row: planted.row + planted.dr * (planted.word.length - 1),
      col: planted.col + planted.dc * (planted.word.length - 1),
    }
    expect(readLine(grid, { row: planted.row, col: planted.col }, end)).toBe(planted.word)
  })
})
