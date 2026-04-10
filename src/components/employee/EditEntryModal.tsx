'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Entry, Service, ServiceCategory } from '@/types/database'

interface Props {
  entry: Entry
  categories: ServiceCategory[]
  services: Service[]
  onClose: () => void
  onSaved: () => void
}

const PAYMENT_METHODS = ['cash', 'twint', 'credit_card'] as const

export default function EditEntryModal({ entry, categories, services, onClose, onSaved }: Props) {
  const { t } = useTranslation('common')

  const currentService = services.find((s) => s.id === entry.service_id)
  const initialCategoryId = currentService?.category_id?.toString() ?? ''

  const [form, setForm] = useState({
    entry_date: entry.entry_date,
    time_from: entry.time_from.substring(0, 5),
    time_to: entry.time_to.substring(0, 5),
    category_id: initialCategoryId,
    service_id: entry.service_id.toString(),
    amount: entry.amount.toString(),
    payment_method: entry.payment_method,
    notes: entry.notes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredServices = services.filter(
    (s) => s.category_id === parseInt(form.category_id)
  )

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, category_id: e.target.value, service_id: '' }))
  }

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const svc = services.find((s) => s.id === parseInt(e.target.value))
    setForm((prev) => ({
      ...prev,
      service_id: e.target.value,
      amount: svc?.default_price?.toString() ?? prev.amount,
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.time_to <= form.time_from) {
      setError(t('form.error_time'))
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('entries')
        .update({
          service_id: parseInt(form.service_id),
          entry_date: form.entry_date,
          time_from: form.time_from,
          time_to: form.time_to,
          amount: parseFloat(form.amount),
          payment_method: form.payment_method,
          notes: form.notes || null,
        })
        .eq('id', entry.id)

      if (updateError) throw updateError
      onSaved()
      onClose()
    } catch {
      setError(t('form.error_generic'))
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setDeleting(true)
    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('entries')
        .delete()
        .eq('id', entry.id)

      if (deleteError) throw deleteError
      onSaved()
      onClose()
    } catch {
      setError(t('form.error_generic'))
      setDeleting(false)
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-text/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-surface rounded-2xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-xl font-semibold text-text">
            {t('modal.edit_title')}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Datum + Zeit */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>{t('form.date')}</label>
              <input type="date" required value={form.entry_date} onChange={set('entry_date')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('form.time_from')}</label>
              <input type="time" required value={form.time_from} onChange={set('time_from')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('form.time_to')}</label>
              <input type="time" required value={form.time_to} onChange={set('time_to')} className={inputClass} />
            </div>
          </div>

          {/* Kategorie + Service */}
          <div className="grid grid-cols-2 gap-3">
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
                className={cn(inputClass, !form.category_id && 'opacity-50')}
              >
                <option value="">{t('form.service_placeholder')}</option>
                {filteredServices.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Betrag + Zahlungsart */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('form.amount')}</label>
              <input
                type="number"
                required
                min="0"
                step="0.05"
                value={form.amount}
                onChange={set('amount')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('form.payment_method')}</label>
              <select required value={form.payment_method} onChange={set('payment_method')} className={inputClass}>
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
              rows={2}
              className={cn(inputClass, 'resize-none')}
            />
          </div>

          {error && <p role="alert" className="text-error text-sm">{error}</p>}

          {/* Buttons */}
          <div className="flex items-center justify-between pt-2">
            {/* Delete */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={cn(
                'flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition-all duration-200',
                confirmDelete
                  ? 'bg-error text-white hover:bg-red-700'
                  : 'text-error hover:bg-error/10'
              )}
            >
              <Trash2 size={14} />
              {confirmDelete ? t('modal.delete_confirm') : t('modal.delete')}
            </button>

            {/* Save + Cancel */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm text-text-muted hover:text-text hover:bg-secondary/40 transition-all"
              >
                {t('modal.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'px-5 py-2 rounded-xl bg-accent text-white text-sm font-medium',
                  'hover:bg-[#7a3d5e] active:scale-[0.98] transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {loading ? t('modal.saving') : t('modal.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
