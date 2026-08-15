import { describe, expect, it } from 'vitest'
import { focusFor } from './focus'
import { cropFor, ZOOM_LEVELS } from './index'
import { createRng } from '../../core/rng'
import { FLAG_QUESTIONS } from '../flags/flags.en'
import type { FlagQuestion } from '../flags/flags.en'

const withFocus = (question: FlagQuestion, seed: string) => ({
  ...question,
  focus: focusFor(question.spec, createRng(seed)),
})

describe('focusFor', () => {
  it('is deterministic for a seed', () => {
    for (const question of FLAG_QUESTIONS) {
      expect(focusFor(question.spec, createRng('s')), question.id).toEqual(
        focusFor(question.spec, createRng('s')),
      )
    }
  })

  it('stays inside the flag', () => {
    for (const question of FLAG_QUESTIONS) {
      for (const seed of ['a', 'b', 'c']) {
        const { fx, fy } = focusFor(question.spec, createRng(seed))
        expect(fx, question.id).toBeGreaterThanOrEqual(0)
        expect(fx, question.id).toBeLessThanOrEqual(1)
        expect(fy, question.id).toBeGreaterThanOrEqual(0)
        expect(fy, question.id).toBeLessThanOrEqual(1)
      }
    }
  })

  it('lands on a colour boundary for striped flags', () => {
    // Ez a lényeg: a legszűkebb kivágásban is két szín találkozzon,
    // különben a 100 pontos szint megfejthetetlen egyszínű folt lenne.
    const striped = FLAG_QUESTIONS.filter(
      (question) => question.spec.kind === 'horizontal' || question.spec.kind === 'vertical',
    )
    expect(striped.length).toBeGreaterThan(0)

    for (const question of striped) {
      const spec = question.spec as { kind: string; colors: string[]; weights?: number[] }
      const weights = spec.weights ?? spec.colors.map(() => 1)
      const total = weights.reduce((sum, value) => sum + value, 0)

      const edges: number[] = []
      let running = 0
      for (let i = 0; i < weights.length - 1; i++) {
        running += weights[i]
        edges.push(running / total)
      }

      for (const seed of ['a', 'b', 'c']) {
        const { fx, fy } = focusFor(question.spec, createRng(seed))
        const onEdge = spec.kind === 'horizontal' ? fy : fx
        expect(edges, `${question.id} focus missed every stripe boundary`).toContain(onEdge)
      }
    }
  })
})

describe('cropFor', () => {
  it('returns no crop at full zoom out', () => {
    const item = withFocus(FLAG_QUESTIONS[0], 's')
    expect(cropFor(item, ZOOM_LEVELS.length - 1)).toBeUndefined()
  })

  it('shrinks the view at every closer level', () => {
    const item = withFocus(FLAG_QUESTIONS[0], 's')
    const areas = [0, 1, 2].map((level) => {
      const crop = cropFor(item, level)!
      return crop.w * crop.h
    })
    expect(areas[0]).toBeLessThan(areas[1])
    expect(areas[1]).toBeLessThan(areas[2])
  })

  it('never lets the crop fall outside the flag', () => {
    for (const question of FLAG_QUESTIONS) {
      const item = withFocus(question, 'seed')
      const width = question.spec.kind === 'swissCross' ? 60 : 90
      for (let level = 0; level < ZOOM_LEVELS.length - 1; level++) {
        const crop = cropFor(item, level)!
        expect(crop.x, question.id).toBeGreaterThanOrEqual(0)
        expect(crop.y, question.id).toBeGreaterThanOrEqual(0)
        expect(crop.x + crop.w, question.id).toBeLessThanOrEqual(width + 0.001)
        expect(crop.y + crop.h, question.id).toBeLessThanOrEqual(60.001)
      }
    }
  })
})
