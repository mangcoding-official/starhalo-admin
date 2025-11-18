import { en } from './en'
import { ko } from './ko'

export const locales = {
  en,
  ko,
} as const

export type Locale = keyof typeof locales
export type TranslationKey = keyof typeof en

export const fallbackLocale: Locale = 'en'
