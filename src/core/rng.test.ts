import { describe, expect, it } from 'vitest'
import { createRng } from './rng'

describe('createRng', () => {
  it('produces identical sequences for the same seed', () => {
    const a = createRng('ROOM7-round3')
    const b = createRng('ROOM7-round3')
    const seqA = [a.next(), a.next(), a.next()]
    const seqB = [b.next(), b.next(), b.next()]
    expect(seqA).toEqual(seqB)
  })

  it('produces different sequences for different seeds', () => {
    const a = createRng('ROOM7-round3')
    const b = createRng('ROOM7-round4')
    expect(a.next()).not.toBe(b.next())
  })

  it('returns values in [0, 1)', () => {
    const rng = createRng('x')
    for (let i = 0; i < 500; i++) {
      const v = rng.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('int(n) stays within bounds', () => {
    const rng = createRng('y')
    for (let i = 0; i < 500; i++) {
      const v = rng.int(6)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(6)
    }
  })

  it('int(n) eventually reaches every value in range', () => {
    const rng = createRng('z')
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) seen.add(rng.int(6))
    expect(seen.size).toBe(6)
  })

  it('shuffle is deterministic and preserves all elements', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8]
    const a = createRng('s').shuffle(input)
    const b = createRng('s').shuffle(input)
    expect(a).toEqual(b)
    expect([...a].sort((x, y) => x - y)).toEqual(input)
  })

  it('shuffle actually reorders a large array', () => {
    const input = Array.from({ length: 100 }, (_, i) => i)
    expect(createRng('s').shuffle(input)).not.toEqual(input)
  })

  it('shuffle does not mutate the input array', () => {
    const input = [1, 2, 3]
    createRng('s').shuffle(input)
    expect(input).toEqual([1, 2, 3])
  })

  it('pick returns n distinct elements deterministically', () => {
    const pool = Array.from({ length: 50 }, (_, i) => i)
    const a = createRng('p').pick(pool, 10)
    const b = createRng('p').pick(pool, 10)
    expect(a).toEqual(b)
    expect(new Set(a).size).toBe(10)
  })

  it('pick returns everything when asked for more than the pool holds', () => {
    expect(createRng('p').pick([1, 2, 3], 10)).toHaveLength(3)
  })
})
