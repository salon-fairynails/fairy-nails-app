'use client'

import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, ScanLine, X } from 'lucide-react'
import { cn, todayIso } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { ExpenseCategory } from '@/types/database'

interface Props {
  categories: ExpenseCategory[]
  onSuccess: () => void
}

const PAYMENT_METHODS = ['cash', 'twint', 'credit_card', 'bank_transfer'] as const

interface FormState {
  expense_date: string
  amount: string
  category_id: string
  description: string
  supplier: string
  payment_method: string
  notes: string
}

const EMPTY_FORM: FormState = {
  expense_date: todayIso(),
  amount: '',
  category_id: '',
  description: '',
  supplier: '',
  payment_method: '',
  notes: '',
}

export default function ExpenseForm({ categories, onSuccess }: Props) {
  const { t } = useTranslation('common')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleScan = async () => {
    if (!receiptFile) return
    setScanning(true)
    setScanMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', receiptFile)
      const res = await fetch('/api/scan-receipt', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.data) throw new Error(json.error ?? `HTTP ${res.status}`)

      const { date, amount, supplier, description } = json.data

      // Convert date from dd.MM.yyyy to yyyy-MM-dd
      let isoDate = form.expense_date
      if (date && /\d{2}\.\d{2}\.\d{4}/.test(date)) {
        const [d, m, y] = date.split('.')
        isoDate = `${y}-${m}-${d}`
      }

      setForm((prev) => ({
        ...prev,
        expense_date: isoDate || prev.expense_date,
        amount: amount?.toString() || prev.amount,
        supplier: supplier || prev.supplier,
        description: description || prev.description,
      }))
      setScanMsg(t('expense_form.scan_success'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setScanMsg(`${t('expense_form.scan_error')}${msg ? `: ${msg}` : ''}`)
    } finally {
      setScanning(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let receipt_url: string | null = null

      // Upload receipt if provided
      if (receiptFile) {
        const ext = receiptFile.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(path, receiptFile)
        if (!uploadError) receipt_url = path
      }

      const { error: insertError } = await supabase.from('expenses').insert({
        employee_id: user.id,
        category_id: parseInt(form.category_id),
        expense_date: form.expense_date,
        amount: parseFloat(form.amount),
        description: form.description,
        supplier: form.supplier || null,
        payment_method: form.payment_method,
        receipt_url,
        notes: form.notes || null,
      })

      if (insertError) throw insertError

      setForm({ ...EMPTY_FORM, expense_date: form.expense_date })
      setReceiptFile(null)
      setScanMsg(null)
      if (fileRef.current) fileRef.current.value = ''
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      onSuccess()
    } catch {
      setError(t('expense_form.error_generic'))
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
        {t('expense_form.title')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Datum + Betrag */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{t('expense_form.date')}</label>
            <input type="date" required value={form.expense_date} onChange={set('expense_date')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('expense_form.amount')}</label>
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
        </div>

        {/* Kategorie + Zahlungsart */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{t('expense_form.category')}</label>
            <select required value={form.category_id} onChange={set('category_id')} className={inputClass}>
              <option value="">{t('expense_form.category_placeholder')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {t(`expense_categories.${c.id}`, { defaultValue: c.name })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('expense_form.payment_method')}</label>
            <select required value={form.payment_method} onChange={set('payment_method')} className={inputClass}>
              <option value="">{t('expense_form.payment_placeholder')}</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>{t(`payment.${pm}`)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Beschreibung */}
        <div>
          <label className={labelClass}>{t('expense_form.description')}</label>
          <input
            type="text"
            required
            value={form.description}
            onChange={set('description')}
            placeholder={t('expense_form.description_placeholder')}
            className={inputClass}
          />
        </div>

        {/* Lieferant */}
        <div>
          <label className={labelClass}>{t('expense_form.supplier')}</label>
          <input
            type="text"
            value={form.supplier}
            onChange={set('supplier')}
            placeholder={t('expense_form.supplier_placeholder')}
            className={inputClass}
          />
        </div>

        {/* Beleg */}
        <div>
          <label className={labelClass}>{t('expense_form.receipt')}</label>
          <div className="space-y-2">
            {!receiptFile ? (
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => { setReceiptFile(e.target.files?.[0] ?? null); setScanMsg(null) }}
                className={cn(inputClass, 'cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-accent/10 file:text-accent hover:file:bg-accent/20')}
              />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-bg">
                <span className="text-sm text-text truncate flex-1">{receiptFile.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null)
                    setScanMsg(null)
                    if (fileRef.current) fileRef.current.value = ''
                  }}
                  className="text-text-muted hover:text-error transition-colors flex-shrink-0"
                  aria-label={t('expense_form.receipt_remove')}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {receiptFile && (
              <button
                type="button"
                onClick={handleScan}
                disabled={scanning}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  'bg-secondary text-text hover:bg-secondary/80 disabled:opacity-50'
                )}
              >
                <ScanLine size={15} />
                {scanning ? t('expense_form.scanning') : t('expense_form.scan_button')}
              </button>
            )}
            {scanMsg && (
              <p className={cn(
                'text-xs',
                scanMsg === t('expense_form.scan_success') ? 'text-success' : 'text-error'
              )}>{scanMsg}</p>
            )}
          </div>
        </div>

        {/* Notizen */}
        <div>
          <label className={labelClass}>{t('expense_form.notes')}</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            placeholder={t('expense_form.notes_placeholder')}
            rows={2}
            className={cn(inputClass, 'resize-none')}
          />
        </div>

        {error && <p role="alert" className="text-error text-sm">{error}</p>}

        {success && (
          <div className="flex items-center gap-2 text-success text-sm">
            <CheckCircle size={16} />
            {t('expense_form.success')}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-medium',
              'hover:bg-[#7a3d5e] active:scale-[0.98] transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? t('expense_form.submitting') : t('expense_form.submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
