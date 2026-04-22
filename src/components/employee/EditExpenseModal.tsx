'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Trash2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Expense, ExpenseCategory } from '@/types/database'

interface Props {
  expense: Expense
  categories: ExpenseCategory[]
  onClose: () => void
  onSaved: () => void
}

const PAYMENT_METHODS = ['cash', 'twint', 'credit_card', 'bank_transfer'] as const

export default function EditExpenseModal({ expense, categories, onClose, onSaved }: Props) {
  const { t } = useTranslation('common')

  const [form, setForm] = useState({
    expense_date: expense.expense_date,
    amount: expense.amount.toString(),
    category_id: expense.category_id.toString(),
    description: expense.description,
    supplier: expense.supplier ?? '',
    payment_method: expense.payment_method,
    notes: expense.notes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          expense_date: form.expense_date,
          amount: parseFloat(form.amount),
          category_id: parseInt(form.category_id),
          description: form.description,
          supplier: form.supplier || null,
          payment_method: form.payment_method,
          notes: form.notes || null,
        })
        .eq('id', expense.id)

      if (updateError) throw updateError
      onSaved()
      onClose()
    } catch {
      setError(t('expense_form.error_generic'))
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase.from('expenses').delete().eq('id', expense.id)
      if (deleteError) throw deleteError
      onSaved()
      onClose()
    } catch {
      setError(t('expense_form.error_generic'))
      setDeleting(false)
    }
  }

  const handleViewReceipt = async () => {
    if (!expense.receipt_url) return
    const supabase = createClient()
    const { data } = await supabase.storage.from('receipts').createSignedUrl(expense.receipt_url, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
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
      <div className="absolute inset-0 bg-text/40 backdrop-blur-sm" />

      <div className="relative bg-surface rounded-2xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-xl font-semibold text-text">
            {t('expense_modal.edit_title')}
          </h2>
          <div className="flex items-center gap-2">
            {expense.receipt_url && (
              <button
                onClick={handleViewReceipt}
                title={t('expense_table.view_receipt')}
                className="text-accent hover:text-[#7a3d5e] transition-colors"
              >
                <FileText size={18} />
              </button>
            )}
            <button onClick={onClose} className="text-text-muted hover:text-text transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('expense_form.date')}</label>
              <input type="date" required value={form.expense_date} onChange={set('expense_date')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('expense_form.amount')}</label>
              <input type="number" required min="0" step="0.05" value={form.amount} onChange={set('amount')} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('expense_form.category')}</label>
              <select required value={form.category_id} onChange={set('category_id')} className={inputClass}>
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
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>{t(`payment.${pm}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('expense_form.description')}</label>
            <input type="text" required value={form.description} onChange={set('description')} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{t('expense_form.supplier')}</label>
            <input type="text" value={form.supplier} onChange={set('supplier')} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{t('expense_form.notes')}</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} className={cn(inputClass, 'resize-none')} />
          </div>

          {error && <p role="alert" className="text-error text-sm">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={cn(
                'flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition-all duration-200',
                confirmDelete ? 'bg-error text-white hover:bg-red-700' : 'text-error hover:bg-error/10'
              )}
            >
              <Trash2 size={14} />
              {confirmDelete ? t('expense_modal.delete_confirm') : t('expense_modal.delete')}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm text-text-muted hover:text-text hover:bg-secondary/40 transition-all"
              >
                {t('expense_modal.cancel')}
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
                {loading ? t('expense_modal.saving') : t('expense_modal.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
