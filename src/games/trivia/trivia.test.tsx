// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import triviaGame from './index'
import { TRIVIA_QUESTIONS } from './questions.en'
import { createRng } from '../../core/rng'

describe('trivia content', () => {
  it('has enough questions to fill a round', () => {
    expect(TRIVIA_QUESTIONS.length).toBeGreaterThanOrEqual(30)
  })

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

  it('never repeats a question within one round', () => {
    const ids = triviaGame.buildItems(createRng('s')).map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
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
    expect(document.body.innerHTML).not.toMatch(/correct|bg-green/i)
  })
})
