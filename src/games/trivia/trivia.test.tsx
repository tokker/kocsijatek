// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import triviaGame, { ROUND_MIX, poolFor } from './index'
import { TRIVIA_QUESTIONS } from './questions.en'
import { createRng } from '../../core/rng'

describe('trivia content', () => {
  it('uses unique ids', () => {
    const ids = TRIVIA_QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every question exactly one correct answer among distinct choices', () => {
    for (const question of TRIVIA_QUESTIONS) {
      expect(question.correctIndex, question.id).toBeGreaterThanOrEqual(0)
      expect(question.correctIndex, question.id).toBeLessThan(question.choices.en.length)
      expect(new Set(question.choices.en).size, question.id).toBe(question.choices.en.length)
    }
  })

  it('gives every question four choices', () => {
    for (const question of TRIVIA_QUESTIONS) {
      expect(question.choices.en, question.id).toHaveLength(4)
    }
  })

  it('ends every prompt with a question mark', () => {
    for (const question of TRIVIA_QUESTIONS) {
      expect(question.prompt.en.endsWith('?'), question.id).toBe(true)
    }
  })

  it('has no easy tier at all', () => {
    // A közönség művelt huszonévesekből áll; a "medium" az alsó határ.
    const tiers = new Set(TRIVIA_QUESTIONS.map((q) => q.difficulty))
    expect([...tiers].sort()).toEqual(['brutal', 'hard', 'medium'])
  })

  it('has enough questions in every tier to build a round', () => {
    for (const [difficulty, count] of ROUND_MIX) {
      expect(poolFor(difficulty).length, difficulty).toBeGreaterThanOrEqual(count)
    }
  })

  it('keeps a spare margin so consecutive rounds differ', () => {
    for (const [difficulty, count] of ROUND_MIX) {
      expect(poolFor(difficulty).length, difficulty).toBeGreaterThan(count)
    }
  })
})

describe('trivia game', () => {
  it('is deterministic for a seed', () => {
    expect(triviaGame.buildItems(createRng('s'))).toEqual(triviaGame.buildItems(createRng('s')))
  })

  it('differs between seeds', () => {
    const a = triviaGame.buildItems(createRng('s1')).map((q) => q.id)
    const b = triviaGame.buildItems(createRng('s2')).map((q) => q.id)
    expect(a).not.toEqual(b)
  })

  it('builds a 30 question round', () => {
    expect(triviaGame.buildItems(createRng('s'))).toHaveLength(30)
  })

  it('never repeats a question within one round', () => {
    const ids = triviaGame.buildItems(createRng('s')).map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('escalates in difficulty across the round', () => {
    const rank = { medium: 0, hard: 1, brutal: 2 }
    const order = triviaGame.buildItems(createRng('s')).map((q) => rank[q.difficulty])
    // Sosem lehet könnyebb, mint az előző kérdés.
    for (let i = 1; i < order.length; i++) {
      expect(order[i]).toBeGreaterThanOrEqual(order[i - 1])
    }
  })

  it('makes the double-weighted closing questions the hardest ones', () => {
    const items = triviaGame.buildItems(createRng('s'))
    for (const question of items.slice(25)) {
      expect(question.difficulty).toBe('brutal')
    }
  })

  it('renders the first question with its choices', () => {
    const items = triviaGame.buildItems(createRng('s'))
    render(<triviaGame.Component items={items} durationSec={900} onComplete={vi.fn()} />)

    expect(screen.getByText(items[0].prompt.en)).toBeInTheDocument()
    for (const choice of items[0].choices.en) {
      expect(screen.getByRole('button', { name: choice })).toBeInTheDocument()
    }
  })

  it('does not reveal which choice is correct before answering', () => {
    const items = triviaGame.buildItems(createRng('s'))
    render(<triviaGame.Component items={items} durationSec={900} onComplete={vi.fn()} />)

    // Egy kíváncsi utas a telefon forrásából sem tudhatja meg a választ.
    expect(document.body.innerHTML).not.toMatch(/correct|difficulty|bg-green/i)
  })
})
