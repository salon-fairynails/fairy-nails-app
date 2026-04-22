'use client'

import { useTranslation } from 'react-i18next'
import { cn, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from '@/lib/utils'
import type { ExpenseFilters, PeriodType, ExpenseCategory, EmployeeWithEmail } from '@/types/database'

interface Props {
  filters: ExpenseFilters
  employees: EmployeeWithEmail[]
  categories: ExpenseCategory[]
  onChange: (filters: ExpenseFilters) => void
}

const PERIODS: PeriodType[] = ['week', 'month', 'year', 'custom']

function periodDates(period: PeriodType): { date_from: string; date_to: string } {
  if (period === 'week')  return { date_from: startOfWeek(),  date_to: endOfWeek() }
  if (period === 'month') return { date_from: startOfMonth(), date_to: endOfMonth() }
  if (period === 'year')  return { date_from: startOfYear(),  date_to: endOfYear() }
  return { date_from: '', date_to: '' }
}

export default function ExpenseFilterPanel({ filters, employees, categories, onChange }: Props) {
  const { t } = useTranslation('common')

  const set = (partial: Partial<ExpenseFilters>) => onChange({ ...filters, ...partial })

  const handlePeriod = (period: PeriodType) => {
    set({ period, ...periodDates(period) })
  }

  const handleReset = () =>
    onChange({
      employee_id: '',
      period: 'month',
      ...periodDates('month'),
      payment_method: '',
      category_id: '',
    })

  const selectClass = cn(
    'px-3 py-1.5 rounded-xl border border-border bg-bg text-text text-sm',
    'outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'
  )

  return (
    <div className="bg-surface rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-text">{t('admin.filter.title')}</h2>
        <button onClick={handleReset} className="text-xs text-text-muted hover:text-accent transition-colors">
          {t('admin.filter.reset')}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Mitarbeitende */}
        <select
          value={filters.employee_id}
          onChange={(e) => set({ employee_id: e.target.value })}
          className={selectClass}
        >
          <option value="">{t('admin.filter.all_employees')}</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.full_name}</option>
          ))}
        </select>

        {/* Zeitraum */}
        <div className="flex rounded-xl border border-border overflow-hidden bg-bg">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => handlePeriod(p)}
              className={cn(
                'px-3 py-1.5 text-sm transition-all',
                filters.period === p
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text hover:bg-secondary/40'
              )}
            >
              {t(`admin.period.${p}`)}
            </button>
          ))}
        </div>

        {filters.period === 'custom' && (
          <>
            <input type="date" value={filters.date_from} onChange={(e) => set({ date_from: e.target.value })} className={selectClass} />
            <input type="date" value={filters.date_to} onChange={(e) => set({ date_to: e.target.value })} className={selectClass} />
          </>
        )}

        {/* Zahlungsart */}
        <select value={filters.payment_method} onChange={(e) => set({ payment_method: e.target.value })} className={selectClass}>
          <option value="">{t('admin.expense_filter.all_payments')}</option>
          <option value="cash">{t('payment.cash')}</option>
          <option value="twint">{t('payment.twint')}</option>
          <option value="credit_card">{t('payment.credit_card')}</option>
          <option value="bank_transfer">{t('payment.bank_transfer')}</option>
        </select>

        {/* Kategorie */}
        <select value={filters.category_id} onChange={(e) => set({ category_id: e.target.value })} className={selectClass}>
          <option value="">{t('admin.expense_filter.all_categories')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {t(`expense_categories.${c.id}`, { defaultValue: c.name })}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
