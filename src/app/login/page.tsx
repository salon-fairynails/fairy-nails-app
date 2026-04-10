'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { type Locale } from '@/lib/i18n/config'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n/config' // sorgt für synchrone i18n-Initialisierung
import { clsx } from 'clsx'

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'de', label: 'DE' },
  { value: 'en', label: 'EN' },
  { value: 'vi', label: 'VI' },
]

export default function LoginPage() {
  const router = useRouter()
  const { t, i18n } = useTranslation('common')

  const [locale, setLocale] = useState<Locale>('de')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLocaleChange = useCallback(
    async (next: Locale) => {
      setLocale(next)
      await i18n.changeLanguage(next)
    },
    [i18n]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError || !data.user) {
        setError(
          authError?.message?.toLowerCase().includes('invalid')
            ? t('login.error_invalid')
            : t('login.error_generic')
        )
        setLoading(false)
        return
      }

      // Rolle aus profiles laden
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'admin') {
        router.replace('/admin/dashboard')
      } else {
        router.replace('/employee/dashboard')
      }
    } catch {
      setError(t('login.error_generic'))
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12">
      {/* Language switcher */}
      <div className="absolute top-6 right-6 flex gap-1">
        {LOCALES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleLocaleChange(value)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
              locale === value
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-secondary/40'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="font-display text-4xl font-semibold text-accent tracking-wide">
              {t('brand.name')}
            </span>
            <span className="text-3xl" role="img" aria-label="sparkle">
              ✨
            </span>
          </div>
          <p className="text-text-muted text-sm font-sans tracking-widest uppercase">
            {t('brand.tagline')}
          </p>
        </div>

        {/* Form card */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-8">
          <h1 className="font-display text-2xl font-semibold text-text mb-1">
            {t('login.title')}
          </h1>
          <p className="text-text-muted text-sm mb-7">{t('login.subtitle')}</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text"
              >
                {t('login.email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.email_placeholder')}
                className={clsx(
                  'w-full px-4 py-2.5 rounded-xl border bg-bg text-text placeholder-text-muted',
                  'text-sm transition-all duration-200 outline-none',
                  'focus:ring-2 focus:ring-primary/40 focus:border-primary',
                  error ? 'border-error' : 'border-border hover:border-primary/50'
                )}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text"
              >
                {t('login.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.password_placeholder')}
                  className={clsx(
                    'w-full px-4 py-2.5 pr-11 rounded-xl border bg-bg text-text placeholder-text-muted',
                    'text-sm transition-all duration-200 outline-none',
                    'focus:ring-2 focus:ring-primary/40 focus:border-primary',
                    error ? 'border-error' : 'border-border hover:border-primary/50'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? t('login.hide_password') : t('login.show_password')
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.75} />
                  ) : (
                    <Eye size={16} strokeWidth={1.75} />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p role="alert" className="text-error text-sm">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className={clsx(
                'w-full py-3 rounded-xl font-medium text-sm transition-all duration-200',
                'bg-accent text-white shadow-sm',
                'hover:bg-[#7a3d5e] active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
                'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2'
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  {t('login.loading')}
                </span>
              ) : (
                t('login.submit')
              )}
            </button>
          </form>
        </div>

        {/* Decorative footer */}
        <p className="text-center text-text-muted/50 text-xs mt-8">
          © {new Date().getFullYear()} Fairy Nails
        </p>
      </div>
    </main>
  )
}
