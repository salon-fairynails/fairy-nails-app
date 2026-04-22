'use client'

import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'
import { cn, formatDate, formatAmount } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Expense, ExpensePaymentMethod } from '@/types/database'

interface Props {
  expenses: Expense[]
  loading: boolean
  onEdit: (expense: Expense) => void
}

const PAYMENT_BADGE: Record<ExpensePaymentMethod, string> = {
  cash: 'bg-secondary text-text',
  twint: 'bg-primary/20 text-primary-dark',
  credit_card: 'bg-accent/20 text-accent',
  bank_transfer: 'bg-success/15 text-success',
}

async function openReceipt(path: string) {
  const supabase = createClient()
  const { data } = await supabase.storage.from('receipts').createSignedUrl(path, 60)
  if (data?.signedUrl) window.open(data.signedUrl, '_blank')
}

export default function ExpenseTable({ expenses, loading, onEdit }: Props) {
  const { t } = useTranslation('common')

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-display text-xl font-semibold text-text">
          {t('expense_table.title')}
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 text-text-muted text-sm">
          {t('expense_table.no_entries')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="text-left px-4 py-3 font-medium text-text-muted">{t('expense_table.date')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted hidden sm:table-cell">{t('expense_table.category')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">{t('expense_table.description')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell">{t('expense_table.supplier')}</th>
                <th className="text-right px-4 py-3 font-medium text-text-muted">{t('expense_table.amount')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted hidden lg:table-cell">{t('expense_table.payment')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr
                  key={expense.id}
                  onClick={() => onEdit(expense)}
                  className={cn(
                    'border-b border-border last:border-0 cursor-pointer',
                    'hover:bg-secondary/20 transition-colors duration-150'
                  )}
                >
                  <td className="px-4 py-3 text-text whitespace-nowrap">
                    {formatDate(expense.expense_date)}
                  </td>
                  <td className="px-4 py-3 text-text-muted hidden sm:table-cell">
                    {expense.expense_categories
                      ? t(`expense_categories.${expense.expense_categories.id}`, { defaultValue: expense.expense_categories.name })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-text">
                    {expense.description}
                  </td>
                  <td className="px-4 py-3 text-text-muted hidden md:table-cell">
                    {expense.supplier ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text whitespace-nowrap">
                    CHF {formatAmount(expense.amount)}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={cn(
                      'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                      PAYMENT_BADGE[expense.payment_method]
                    )}>
                      {t(`payment.${expense.payment_method}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {expense.receipt_url && (
                      <button
                        onClick={() => openReceipt(expense.receipt_url!)}
                        title={t('expense_table.view_receipt')}
                        className="text-accent hover:text-[#7a3d5e] transition-colors"
                      >
                        <FileText size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
