import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { locales, fallbackLocale, type Locale, type TranslationKey } from '@/locales'

export type Translator = (
  key: TranslationKey | (string & {}),
  fallback?: string
) => string

type TranslationContextValue = {
  locale: Locale
  setLocale: (next: Locale | string) => void
  t: Translator
}

const TranslationContext = createContext<TranslationContextValue>({
  locale: fallbackLocale,
  setLocale: () => {},
  t: (key, fallback) => fallback ?? String(key),
})

function normalizeLocale(value?: string | null): Locale {
  if (!value) return fallbackLocale
  const normalized = value.toLowerCase().trim()
  if (normalized in locales) {
    return normalized as Locale
  }
  return fallbackLocale
}

function createTranslator(locale: Locale): Translator {
  const dictionary = locales[locale]
  const defaultDictionary = locales[fallbackLocale]

  return (key, fallback) => {
    const translation =
      dictionary[key as TranslationKey] ??
      defaultDictionary[key as TranslationKey] ??
      fallback
    return translation ?? String(fallback ?? key)
  }
}

type TranslationProviderProps = {
  children: React.ReactNode
  initialLocale?: string
}

export function TranslationProvider({
  children,
  initialLocale,
}: TranslationProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    normalizeLocale(initialLocale)
  )

  const setLocale = useCallback((next: Locale | string) => {
    setLocaleState(normalizeLocale(next))
  }, [])

  const value = useMemo<TranslationContextValue>(() => {
    const translator = createTranslator(locale)
    return {
      locale,
      setLocale,
      t: translator,
    }
  }, [locale, setLocale])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.__setLocale = setLocale
    return () => {
      if (window.__setLocale === setLocale) {
        delete window.__setLocale
      }
    }
  }, [setLocale])

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  return useContext(TranslationContext)
}

declare global {
  interface Window {
    __setLocale?: (locale: Locale | string) => void
  }
}
