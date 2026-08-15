import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { en, type TranslationKey } from './en'
import { hu } from './hu'

export type Language = 'en' | 'hu'

export const LANGUAGES: Array<{ code: Language; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'hu', label: 'Magyar' },
]

const DICTIONARIES: Record<Language, Partial<Record<TranslationKey, string>>> = { en, hu }
const STORAGE_KEY = 'roadtrip:language'

/**
 * Behelyettesíti a {név} alakú helyőrzőket.
 * Egyetlen mondatba több érték is kerülhet, és a fordító
 * megváltoztathatja a sorrendjüket — magyarra fordításkor ez gyakran kell.
 */
function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  )
}

export function translate(
  language: Language,
  key: TranslationKey,
  values?: Record<string, string | number>,
): string {
  // Hiányzó fordítás esetén az angol változat jön: egy félig lefordított
  // felület még használható, egy üres felirat nem.
  const template = DICTIONARIES[language][key] ?? en[key]
  return interpolate(template, values)
}

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStored(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'hu' || stored === 'en' ? stored : 'en'
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStored)

  const setLanguage = useCallback((next: Language) => {
    localStorage.setItem(STORAGE_KEY, next)
    setLanguageState(next)
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, values) => translate(language, key, values),
    }),
    [language, setLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useT() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useT must be used inside a LanguageProvider')
  return context
}

export type { TranslationKey }
