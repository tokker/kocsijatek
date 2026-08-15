import { describe, expect, it } from 'vitest'
import { shuffleChoices } from './choices'
import { GAMES } from './registry'
import { createRng } from '../core/rng'

describe('shuffleChoices', () => {
  const question = {
    choices: { en: ['A', 'B', 'C', 'D'], hu: ['a', 'b', 'c', 'd'] },
    correctIndex: 1,
  }

  it('keeps correctIndex pointing at the same answer', () => {
    for (let seed = 0; seed < 200; seed++) {
      const shuffled = shuffleChoices(question, createRng(`s${seed}`))
      expect(shuffled.choices.en[shuffled.correctIndex]).toBe('B')
    }
  })

  it('applies the same permutation to every language', () => {
    for (let seed = 0; seed < 50; seed++) {
      const shuffled = shuffleChoices(question, createRng(`s${seed}`))
      // Az "A"/"a" pár együtt mozog, különben a magyar felirat más
      // válaszhoz tartozna, mint az angol.
      const enOrder = shuffled.choices.en.map((c) => c.toLowerCase())
      expect(shuffled.choices.hu).toEqual(enOrder)
    }
  })

  it('keeps every option, losing and duplicating none', () => {
    const shuffled = shuffleChoices(question, createRng('x'))
    expect([...shuffled.choices.en].sort()).toEqual(['A', 'B', 'C', 'D'])
  })

  it('leaves a missing translation missing rather than inventing one', () => {
    const untranslated: { choices: { en: string[]; hu?: string[] }; correctIndex: number } = {
      choices: { en: ['A', 'B'] },
      correctIndex: 0,
    }
    expect(shuffleChoices(untranslated, createRng('x')).choices.hu).toBeUndefined()
  })

  it('is deterministic, so both cars see the same order', () => {
    const a = shuffleChoices(question, createRng('same'))
    const b = shuffleChoices(question, createRng('same'))
    expect(a).toEqual(b)
  })
})

/**
 * A feladatbankban a helyes válasz helye erősen torzít. Keverés nélkül a
 * "mindig a másodikat nyomom" stratégia pontokat termel, tudás nélkül —
 * pontosan az, amit a játék nem akar jutalmazni.
 */
describe.each(['trivia', 'emoji', 'flags', 'zoom'] as const)('%s answer position', (id) => {
  it('spreads the correct answer across all slots', () => {
    const counts = new Map<number, number>()
    let total = 0

    for (let seed = 0; seed < 120; seed++) {
      const items = GAMES[id].buildItems(createRng(`seed${seed}`)) as Array<{
        correctIndex: number
        choices: { en: string[] }
      }>
      for (const item of items) {
        counts.set(item.correctIndex, (counts.get(item.correctIndex) ?? 0) + 1)
        total++
      }
    }

    // Négy lehetőség mellett egyik hely sem viheti a találatok több mint
    // 40%-át (véletlen esetén 25% körül volna).
    for (const [slot, count] of counts) {
      expect(count / total, `${id}: slot ${slot} holds ${Math.round((count / total) * 100)}%`)
        .toBeLessThan(0.4)
    }
  })
})
