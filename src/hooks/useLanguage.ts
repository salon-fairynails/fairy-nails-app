'use client'

import { useState, useEffect, useCallback } from 'react'
import i18n, { type Locale } from '@/lib/i18n/config'

const STORAGE_KEY = 'fairy-nails-lang'

export function useLanguage() {
  const [locale, setLocale] = useState<Locale>('de')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored && ['de', 'en', 'vi'].includes(stored)) {
      setLocale(stored)
      i18n.changeLanguage(stored)
    }
  }, [])

  const changeLanguage = useCallback(async (lang: Locale) => {
    setLocale(lang)
    localStorage.setItem(STORAGE_KEY, lang)
    await i18n.changeLanguage(lang)
  }, [])

  return { locale, changeLanguage }
}
