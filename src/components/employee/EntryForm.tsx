'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Clock, Plus, Trash2 } from 'lucide-react'
import { cn, todayIso } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Service, ServiceCategory } from '@/types/database'

interface Props {
  categories: ServiceCategory[]
  services: Service[]
  onSuccess: () => void
}

const PAYMENT_METHODS = ['cash', 'twint', 'credit_card', 'voucher'] as const
const DISCOUNT_OPTIONS = [0, 5, 10, 15, 20, 25, 30]

interface ServiceRow {
  category_id: string
  service_id: string
  amount: string
  discount_pct: number
}

interface FormState {
  entry_date: string
  time_from: string
  time_to: string
  payment_method: string
  notes: string
  rows: ServiceRow[]
}

const EMPTY_ROW: ServiceRow = { category_id: '', service_id: '', amount: '', discount_pct: 0 }

const EMPTY_FORM: FormState = {
  entry_date: todayIso(),
  time_from: '',
  time_to: '',
  payment_method: '',
  notes: '',
  rows: [{ ...EMPTY_ROW }],
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

function TimeSelect({
  value,
  onChange,
  required,
}: {
  value: string
  onChange: (val: string) => void
  required?: boolean
}) {
  const [h, m] = value ? value.split(':') : ['', '']
  return (
    <div className={cn(
      'flex items-center gap-1 w-full px-3 py-2 rounded-xl border border-border bg-bg text-text text-sm',
      'transition-all duration-200 hover:border-primary/50',
      'focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary'
    )}>
      <Clock size={14} className="text-text-muted flex-shrink-0" />
      <select
        value={h || ''}
        onChange={(e) => onChange(`${e.target.value}:${m || '00'}`)}
        required={required}
        className="bg-transparent outline-none flex-1 min-w-0 cursor-pointer"
      >
        <option value="">HH</option>
        {HOURS.map((hh) => <option key={hh} value={hh}>{hh}</option>)}
      </select>
      <span className="text-text-muted select-none">:</span>
      <select
        value={m || ''}
        onChange={(e) => onChange(`${h || '00'}:${e.target.value}`)}
        required={required && !!h}
        className="bg-transparent outline-none flex-1 min-w-0 cursor-pointer"
      >
        <option value="">MM</option>
        {MINUTES.map((mm) => <option key={mm} value={mm}>{mm}</option>)}
      </select>
    </div>
  )
}

export default function EntryForm({ categories, services, onSuccess }: Props) {
  const { t } = useTranslation('common')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const setShared = (field: keyof Omit<FormState, 'rows'>) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleTimeFromChange = (value: string) => {
    setForm((prev) => {
      const [h, m] = value.split(':').map(Number)
      if (isNaN(h) || isNaN(m)) return { ...prev, time_from: value }
      const totalMinutes = h * 60 + m + 60
      const toH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0')
      const toM = String(totalMinutes % 60).padStart(2, '0')
      return { ...prev, time_from: value, time_to: `${toH}:${toM}` }
    })
  }

  const updateRow = (index: number, patch: Partial<ServiceRow>) => {
    setForm((prev) => {
      const rows = prev.rows.map((r, i) => (i === index ? { ...r, ...patch } : r))
      return { ...prev, rows }
    })
  }

  const handleCategoryChange = (index: number, value: string) => {
    updateRow(index, { category_id: value, service_id: '', amount: '', discount_pct: 0 })
  }

  const handleServiceChange = (index: number, value: string) => {
    const svc = services.find((s) => s.id === parseInt(value))
    updateRow(index, { service_id: value, amount: svc?.default_price?.toString() ?? '', discount_pct: 0 })
  }

  const handleDiscountChange = (index: number, pct: number) => {
    const row = form.rows[index]
    const svc = services.find((s) => s.id === parseInt(row.service_id))
    if (svc?.default_price != null) {
      const discounted = (svc.default_price * (1 - pct / 100)).toFixed(2)
      updateRow(index, { discount_pct: pct, amount: discounted })
    } else {
      updateRow(index, { discount_pct: pct })
    }
  }

  const addRow = () => {
    setForm((prev) => ({ ...prev, rows: [...prev.rows, { ...EMPTY_ROW }] }))
  }

  const removeRow = (index: number) => {
    setForm((prev) => ({ ...prev, rows: prev.rows.filter((_, i) => i !== index) }))
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

      const inserts = form.rows.map((row) => ({
        employee_id: user.id,
        service_id: parseInt(row.service_id),
        entry_date: form.entry_date,
        time_from: form.time_from,
        time_to: form.time_to,
        amount: parseFloat(row.amount),
        payment_method: form.payment_method,
        notes: form.notes || null,
      }))

      const { error: insertError } = await supabase.from('entries').insert(inserts)
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

  const allRowsValid = form.rows.every((r) => r.service_id && r.amount)

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
            <input type="date" required value={form.entry_date} onChange={setShared('entry_date')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('form.time_from')}</label>
            <TimeSelect value={form.time_from} onChange={handleTimeFromChange} required />
          </div>
          <div>
            <label className={labelClass}>{t('form.time_to')}</label>
            <TimeSelect value={form.time_to} onChange={(v) => setForm((p) => ({ ...p, time_to: v }))} required />
          </div>
        </div>

        {/* Service-Zeilen */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={cn(labelClass, 'mb-0')}>{t('form.services_label')}</label>
            {form.rows.length > 1 && (
              <span className="text-xs text-text-muted">
                {t('form.services_count', { count: form.rows.length })}
              </span>
            )}
          </div>

          {form.rows.map((row, index) => {
            const filteredServices = services.filter(
              (s) => s.category_id === parseInt(row.category_id) && s.is_active
            )
            return (
              <div
                key={index}
                className={cn(
                  'grid grid-cols-1 sm:grid-cols-[1fr_1fr_70px_auto_auto] gap-2 items-end',
                  'p-3 rounded-xl border border-border/60 bg-bg/50',
                  form.rows.length > 1 && 'relative'
                )}
              >
                {form.rows.length > 1 && (
                  <span className="absolute -top-2.5 left-3 text-[10px] text-text-muted bg-surface px-1">
                    {index + 1}
                  </span>
                )}
                <div>
                  <label className={labelClass}>{t('form.category')}</label>
                  <select
                    required
                    value={row.category_id}
                    onChange={(e) => handleCategoryChange(index, e.target.value)}
                    className={inputClass}
                  >
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
                    value={row.service_id}
                    onChange={(e) => handleServiceChange(index, e.target.value)}
                    disabled={!row.category_id}
                    className={cn(inputClass, !row.category_id && 'opacity-50 cursor-not-allowed')}
                  >
                    <option value="">
                      {row.category_id ? t('form.service_placeholder') : t('form.service_disabled')}
                    </option>
                    {filteredServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}{s.price_label ? ` (${s.price_label})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t('form.discount')}</label>
                  <select
                    value={row.discount_pct}
                    onChange={(e) => handleDiscountChange(index, parseInt(e.target.value))}
                    className={inputClass}
                  >
                    {DISCOUNT_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}%</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t('form.amount')}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.05"
                    value={row.amount}
                    onChange={(e) => updateRow(index, { amount: e.target.value })}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
                {form.rows.length > 1 && (
                  <div className="flex items-end pb-0.5">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="p-2 rounded-lg text-error/60 hover:text-error hover:bg-error/10 transition-all"
                      title={t('form.remove_service')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed border-border text-text-muted hover:border-primary hover:text-primary transition-all w-full justify-center"
          >
            <Plus size={13} />
            {t('form.add_service')}
          </button>
        </div>

        {/* Betrag + Zahlungsart */}
        <div>
          <label className={labelClass}>{t('form.payment_method')}</label>
          <select required value={form.payment_method} onChange={setShared('payment_method')} className={inputClass}>
            <option value="">{t('form.payment_placeholder')}</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm} value={pm}>{t(`payment.${pm}`)}</option>
            ))}
          </select>
        </div>

        {/* Notizen */}
        <div>
          <label className={labelClass}>{t('form.notes')}</label>
          <textarea
            value={form.notes}
            onChange={setShared('notes')}
            placeholder={t('form.notes_placeholder')}
            rows={2}
            className={cn(inputClass, 'resize-none')}
          />
        </div>

        {error && <p role="alert" className="text-error text-sm">{error}</p>}

        {success && (
          <div className="flex items-center gap-2 text-success text-sm">
            <CheckCircle size={16} />
            {form.rows.length > 1
              ? t('form.success_multiple', { count: form.rows.length })
              : t('form.success')}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !allRowsValid}
            className={cn(
              'px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-medium',
              'hover:bg-[#7a3d5e] active:scale-[0.98] transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2'
            )}
          >
            {loading
              ? t('form.submitting')
              : form.rows.length > 1
                ? t('form.submit_multiple', { count: form.rows.length })
                : t('form.submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
