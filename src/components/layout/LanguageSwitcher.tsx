'use client'

import { cn } from '@/lib/utils'
import { useLanguage } from '@/hooks/useLanguage'
import type { Locale } from '@/lib/i18n/config'

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'de', label: 'DE' },
  { value: 'en', label: 'EN' },
  { value: 'vi', label: 'VI' },
]

export default function LanguageSwitcher() {
  const { locale, changeLanguage } = useLanguage()

  return (
    <div className="flex gap-1">
      {LOCALES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => changeLanguage(value)}
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200',
            locale === value
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-muted hover:text-text hover:bg-secondary/40'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
