'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn, startOfWeek, endOfWeek, startOfYear, endOfYear } from '@/lib/utils'
import type { ExpenseFilters, PeriodType, ExpenseCategory, EmployeeWithEmail } from '@/types/database'

interface Props {
  filters: ExpenseFilters
  employees: EmployeeWithEmail[]
  categories: ExpenseCategory[]
  onChange: (filters: ExpenseFilters) => void
}

const PERIODS: PeriodType[] = ['week', 'month', 'year', 'custom']

function periodDates(period: PeriodType): { date_from: string; date_to: string } {
  if (period === 'week') return { date_from: startOfWeek(), date_to: endOfWeek() }
  if (period === 'year') return { date_from: startOfYear(), date_to: endOfYear() }
  return { date_from: '', date_to: '' }
}

function monthDateRange(year: number, month: number): { date_from: string; date_to: string } {
  const m = String(month + 1).padStart(2, '0')
  const lastDay = new Date(year, month + 1, 0).getDate()
  return {
    date_from: `${year}-${m}-01`,
    date_to: `${year}-${m}-${String(lastDay).padStart(2, '0')}`,
  }
}

export default function ExpenseFilterPanel({ filters, employees, categories, onChange }: Props) {
  const { t, i18n } = useTranslation('common')

  const [pickerYear, setPickerYear] = useState<number>(() => {
    if (filters.date_from) return parseInt(filters.date_from.substring(0, 4))
    return new Date().getFullYear()
  })

  const set = (partial: Partial<ExpenseFilters>) => onChange({ ...filters, ...partial })

  const handlePeriod = (period: PeriodType) => {
    if (period === 'month') {
      set({ period, ...monthDateRange(pickerYear, new Date().getMonth()) })
    } else {
      set({ period, ...periodDates(period) })
    }
  }

  const handleMonthSelect = (month: number) => {
    set({ period: 'month', ...monthDateRange(pickerYear, month) })
  }

  const handleReset = () => {
    const now = new Date()
    setPickerYear(now.getFullYear())
    onChange({
      employee_id: '',
      period: 'month',
      ...monthDateRange(now.getFullYear(), now.getMonth()),
      payment_method: '',
      category_id: '',
    })
  }

  const activeMonth =
    filters.period === 'month' && filters.date_from
      ? parseInt(filters.date_from.substring(5, 7)) - 1
      : -1
  const activeYear =
    filters.period === 'month' && filters.date_from
      ? parseInt(filters.date_from.substring(0, 4))
      : -1

  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(i18n.language, { month: 'short' }).format(new Date(2024, i, 1))
  )

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

        {/* Monat: Monatsauswahl */}
        {filters.period === 'month' && (
          <div className="w-full flex flex-col gap-2 mt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPickerYear((y) => y - 1)}
                className="px-2 py-1 rounded-lg text-text-muted hover:text-text hover:bg-secondary/40 transition-all text-sm"
              >
                ‹
              </button>
              <span className="text-sm font-medium text-text min-w-[3rem] text-center">{pickerYear}</span>
              <button
                onClick={() => setPickerYear((y) => y + 1)}
                className="px-2 py-1 rounded-lg text-text-muted hover:text-text hover:bg-secondary/40 transition-all text-sm"
              >
                ›
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {monthNames.map((name, i) => (
                <button
                  key={i}
                  onClick={() => handleMonthSelect(i)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-sm transition-all border',
                    activeMonth === i && activeYear === pickerYear
                      ? 'bg-accent text-white border-accent'
                      : 'border-border text-text-muted hover:text-text hover:bg-secondary/40'
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

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
