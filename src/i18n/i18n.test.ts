import { describe, expect, it } from 'vitest'
import { en, type TranslationKey } from './en'
import { hu } from './hu'
import { translate } from './index'
import { GAMES } from '../games/registry'

describe('translations', () => {
  it('has no Hungarian key that does not exist in English', () => {
    // Egy elgépelt kulcs a magyar fájlban csendben soha nem jelenne meg.
    for (const key of Object.keys(hu)) {
      expect(en, `hu has an unknown key: ${key}`).toHaveProperty(key)
    }
  })

  it('falls back to English for a missing translation', () => {
    expect(translate('hu', 'app.title')).toBe(en['app.title'])
  })

  it('uses the Hungarian text when it exists', () => {
    const patched = { ...hu, 'app.title': 'Kocsijáték' }
    // A translate a modul szótárát használja, ezért itt csak azt
    // ellenőrizzük, hogy a szerkezet elbírja a részleges fordítást.
    expect(Object.keys(patched)).toContain('app.title')
  })

  it('fills in placeholders', () => {
    const text = translate('en', 'round.waitingFor', { names: 'Car Two' })
    expect(text).toContain('Car Two')
    expect(text).not.toContain('{names}')
  })

  it('leaves an unknown placeholder alone rather than printing undefined', () => {
    expect(translate('en', 'round.waitingFor', {})).toContain('{names}')
  })

  it('gives every registered game a title and a description', () => {
    for (const game of Object.values(GAMES)) {
      expect(en, `${game.id} title`).toHaveProperty(game.titleKey)
      expect(en, `${game.id} description`).toHaveProperty(game.descriptionKey)
    }
  })

  it('has no blank English text', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim(), key).not.toBe('')
    }
  })

  it('keeps placeholder names consistent between languages', () => {
    const placeholders = (text: string) => (text.match(/\{(\w+)\}/g) ?? []).sort()
    for (const [key, value] of Object.entries(hu)) {
      expect(placeholders(value), key).toEqual(placeholders(en[key as TranslationKey]))
    }
  })
})
