'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n/config'
import { clsx } from 'clsx'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { t } = useTranslation('common')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase setzt die Session automatisch aus dem URL-Hash beim Laden der Seite
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    // Fallback: kurz warten dann trotzdem anzeigen
    const timer = setTimeout(() => setReady(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError(t('reset_password.error_mismatch'))
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(t('reset_password.error_generic'))
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.replace('/login'), 2500)
  }

  const inputClass = clsx(
    'w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-text',
    'text-sm transition-all duration-200 outline-none',
    'focus:ring-2 focus:ring-primary/40 focus:border-primary'
  )

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="font-display text-4xl font-semibold text-accent tracking-wide">
              Fairy Nails
            </span>
            <span className="text-3xl">✨</span>
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-8">
          <h1 className="font-display text-2xl font-semibold text-text mb-1">
            {t('reset_password.title')}
          </h1>
          <p className="text-text-muted text-sm mb-7">{t('reset_password.subtitle')}</p>

          {success ? (
            <div className="text-center py-4">
              <p className="text-success text-sm font-medium">{t('reset_password.success')}</p>
              <p className="text-text-muted text-xs mt-1">{t('reset_password.redirect')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text">
                  {t('reset_password.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={clsx(inputClass, 'pr-11')}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
                    {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text">
                  {t('reset_password.password_confirm')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={clsx(inputClass, 'pr-11')}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
                    {showConfirm ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                  </button>
                </div>
              </div>

              {error && <p role="alert" className="text-error text-sm">{error}</p>}

              <button type="submit" disabled={loading || !ready}
                className={clsx(
                  'w-full py-3 rounded-xl font-medium text-sm transition-all duration-200',
                  'bg-accent text-white shadow-sm hover:bg-[#7a3d5e] active:scale-[0.98]',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    {t('reset_password.submitting')}
                  </span>
                ) : t('reset_password.submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
