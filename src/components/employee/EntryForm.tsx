'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from 'lucide-react'
import { cn, todayIso } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Service, ServiceCategory } from '@/types/database'

interface Props {
  categories: ServiceCategory[]
  services: Service[]
  onSuccess: () => void
}

const PAYMENT_METHODS = ['cash', 'twint', 'credit_card'] as const

interface FormState {
  entry_date: string
  time_from: string
  time_to: string
  category_id: string
  service_id: string
  amount: string
  payment_method: string
  notes: string
}

const EMPTY_FORM: FormState = {
  entry_date: todayIso(),
  time_from: '',
  time_to: '',
  category_id: '',
  service_id: '',
  amount: '',
  payment_method: '',
  notes: '',
}

export default function EntryForm({ categories, services, onSuccess }: Props) {
  const { t } = useTranslation('common')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const filteredServices = services.filter(
    (s) => s.category_id === parseInt(form.category_id)
  )

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleTimeFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm((prev) => {
      const [h, m] = value.split(':').map(Number)
      const totalMinutes = h * 60 + m + 60
      const toH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0')
      const toM = String(totalMinutes % 60).padStart(2, '0')
      return { ...prev, time_from: value, time_to: `${toH}:${toM}` }
    })
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, category_id: e.target.value, service_id: '', amount: '' }))
  }

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const svc = services.find((s) => s.id === parseInt(e.target.value))
    setForm((prev) => ({
      ...prev,
      service_id: e.target.value,
      amount: svc?.default_price?.toString() ?? '',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.time_to <= form.time_from) {
      setError(t('form.error_time'))
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase.from('entries').insert({
        employee_id: user.id,
        service_id: parseInt(form.service_id),
        entry_date: form.entry_date,
        time_from: form.time_from,
        time_to: form.time_to,
        amount: parseFloat(form.amount),
        payment_method: form.payment_method,
        notes: form.notes || null,
      })

      if (insertError) throw insertError

      setForm({ ...EMPTY_FORM, entry_date: form.entry_date })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      onSuccess()
    } catch {
      setError(t('form.error_generic'))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = cn(
    'w-full px-3 py-2 rounded-xl border border-border bg-bg text-text text-sm',
    'placeholder-text-muted outline-none transition-all duration-200',
    'focus:ring-2 focus:ring-primary/30 focus:border-primary',
    'hover:border-primary/50'
  )

  const labelClass = 'block text-xs font-medium text-text-muted mb-1'

  return (
    <div className="bg-surface rounded-2xl border border-border p-6">
      <h2 className="font-display text-xl font-semibold text-text mb-5">
        {t('form.title')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Datum + Zeit */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>{t('form.date')}</label>
            <input type="date" required value={form.entry_date} onChange={set('entry_date')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('form.time_from')}</label>
            <input type="time" required value={form.time_from} onChange={handleTimeFromChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('form.time_to')}</label>
            <input type="time" required value={form.time_to} onChange={set('time_to')} className={inputClass} />
          </div>
        </div>

        {/* Kategorie + Service */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{t('form.category')}</label>
            <select required value={form.category_id} onChange={handleCategoryChange} className={inputClass}>
              <option value="">{t('form.category_placeholder')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('form.service')}</label>
            <select
              required
              value={form.service_id}
              onChange={handleServiceChange}
              disabled={!form.category_id}
              className={cn(inputClass, !form.category_id && 'opacity-50 cursor-not-allowed')}
            >
              <option value="">
                {form.category_id ? t('form.service_placeholder') : t('form.service_disabled')}
              </option>
              {filteredServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.price_label ? ` (${s.price_label})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Betrag + Zahlungsart */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{t('form.amount')}</label>
            <input
              type="number"
              required
              min="0"
              step="0.05"
              value={form.amount}
              onChange={set('amount')}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t('form.payment_method')}</label>
            <select required value={form.payment_method} onChange={set('payment_method')} className={inputClass}>
              <option value="">{t('form.payment_placeholder')}</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>{t(`payment.${pm}`)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notizen */}
        <div>
          <label className={labelClass}>{t('form.notes')}</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            placeholder={t('form.notes_placeholder')}
            rows={2}
            className={cn(inputClass, 'resize-none')}
          />
        </div>

        {/* Fehler */}
        {error && <p role="alert" className="text-error text-sm">{error}</p>}

        {/* Erfolg */}
        {success && (
          <div className="flex items-center gap-2 text-success text-sm">
            <CheckCircle size={16} />
            {t('form.success')}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-medium',
              'hover:bg-[#7a3d5e] active:scale-[0.98] transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2'
            )}
          >
            {loading ? t('form.submitting') : t('form.submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
