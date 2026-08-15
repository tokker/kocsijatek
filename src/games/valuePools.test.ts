import { describe, expect, it } from 'vitest'
import { DIFFICULTY_ORDER, poolFor, type Difficulty } from './difficulty'
import { ROUND_MIX as CLOSEST_MIX } from './closest'
import { NUMBER_FACTS } from './closest/facts.en'
import { ROUND_MIX as WAGER_MIX } from './wager'
import { STATEMENTS } from './wager/statements.en'

/**
 * A nem feleletválasztós készletek ellenőrzése. A feleletválasztósakat
 * a choicePools.test.ts fedi le.
 */

describe('number facts', () => {
  it('uses unique ids', () => {
    const ids = NUMBER_FACTS.map((fact) => fact.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every fact a positive tolerance', () => {
    // Tűréshatár nélkül egy évszámkérdésre bármilyen vad tipp közel
    // teljes pontot érne, mert a hibát a válasz nagyságához mérnénk.
    for (const fact of NUMBER_FACTS) {
      expect(fact.tolerance, fact.id).toBeGreaterThan(0)
    }
  })

  it('keeps the tolerance tight on year questions', () => {
    // A jelölésre támaszkodunk, nem a szám nagyságára: az Eiffel-torony
    // 1665 lépcsőfoka is évszámnak látszana egy tartomány-ellenőrzésnek.
    for (const fact of NUMBER_FACTS.filter((f) => f.isYear)) {
      expect(fact.tolerance, fact.id).toBeLessThan(100)
    }
  })

  it('marks every question that asks for a year', () => {
    for (const fact of NUMBER_FACTS) {
      if (/in which year|which year/i.test(fact.prompt.en)) {
        expect(fact.isYear, `${fact.id} asks for a year but is not marked`).toBe(true)
      }
    }
  })

  it('does not mark a question that is not about a year', () => {
    for (const fact of NUMBER_FACTS.filter((f) => f.isYear)) {
      expect(fact.prompt.en, fact.id).toMatch(/year/i)
    }
  })

  it('has enough facts in every tier, with a spare margin', () => {
    for (const [difficulty, count] of CLOSEST_MIX) {
      expect(poolFor(NUMBER_FACTS, difficulty).length, difficulty).toBeGreaterThan(count)
    }
  })

  it('uses only the allowed difficulty tiers', () => {
    for (const fact of NUMBER_FACTS) {
      expect(DIFFICULTY_ORDER, fact.id).toContain(fact.difficulty)
    }
  })
})

describe('wager statements', () => {
  it('uses unique ids', () => {
    const ids = STATEMENTS.map((statement) => statement.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has enough statements in every tier, with a spare margin', () => {
    for (const [difficulty, count] of WAGER_MIX) {
      expect(poolFor(STATEMENTS, difficulty).length, difficulty).toBeGreaterThan(count)
    }
  })

  it.each(DIFFICULTY_ORDER)('balances true and false within the %s tier', (difficulty: Difficulty) => {
    // Ha egy szinten jóval több az igaz állítás, egy csapat mindig
    // "igaz"-t nyomva pontot szerezhetne tudás nélkül. A tétes játékban
    // ez különösen sokat érne, mert hármas téttel lehetne kizsákmányolni.
    const tier = poolFor(STATEMENTS, difficulty)
    const trueCount = tier.filter((statement) => statement.isTrue).length
    const share = trueCount / tier.length
    expect(share, `${difficulty}: ${trueCount} true of ${tier.length}`).toBeGreaterThanOrEqual(0.4)
    expect(share, `${difficulty}: ${trueCount} true of ${tier.length}`).toBeLessThanOrEqual(0.6)
  })
})
