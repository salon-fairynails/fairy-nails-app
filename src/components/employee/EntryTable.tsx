'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn, formatDate, formatTime, formatAmount } from '@/lib/utils'
import type { Entry, PaymentMethod } from '@/types/database'

type Period = 'all' | 'week' | 'month' | 'year'

interface Props {
  entries: Entry[]
  loading: boolean
  onEdit: (entry: Entry) => void
}

const PAYMENT_BADGE: Record<PaymentMethod, string> = {
  cash: 'bg-secondary text-text',
  twint: 'bg-primary/20 text-primary-dark',
  credit_card: 'bg-accent/20 text-accent',
}

const PERIODS: Period[] = ['all', 'week', 'month', 'year']

function filterByPeriod(entries: Entry[], period: Period): Entry[] {
  if (period === 'all') return entries
  const now = new Date()
  return entries.filter(entry => {
    const d = new Date(entry.entry_date)
    if (period === 'week') {
      const weekStart = new Date(now)
      const day = now.getDay()
      weekStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
      weekStart.setHours(0, 0, 0, 0)
      return d >= weekStart
    }
    if (period === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
    if (period === 'year') {
      return d.getFullYear() === now.getFullYear()
    }
    return true
  })
}

export default function EntryTable({ entries, loading, onEdit }: Props) {
  const { t } = useTranslation('common')
  const [period, setPeriod] = useState<Period>('month')

  const filtered = filterByPeriod(entries, period)
  const total = filtered.reduce((sum, e) => sum + (e.amount ?? 0), 0)

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-display text-xl font-semibold text-text">
            {t('table.title')}
          </h2>
          <div className="flex rounded-lg border border-border overflow-hidden bg-bg/50">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-all',
                  period === p
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-text hover:bg-secondary/40'
                )}
              >
                {t(`table.filter_${p}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-text-muted text-sm">
          {t('table.no_entries')}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-muted text-sm">
          {t('table.no_entries_filtered')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="text-left px-4 py-3 font-medium text-text-muted">{t('table.date')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">{t('table.time')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted hidden sm:table-cell">{t('table.category')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">{t('table.service')}</th>
                <th className="text-right px-4 py-3 font-medium text-text-muted">{t('table.amount')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell">{t('table.payment')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() => onEdit(entry)}
                  className={cn(
                    'border-b border-border last:border-0 cursor-pointer',
                    'hover:bg-secondary/20 transition-colors duration-150'
                  )}
                >
                  <td className="px-4 py-3 text-text whitespace-nowrap">
                    {formatDate(entry.entry_date)}
                  </td>
                  <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                    {formatTime(entry.time_from)} – {formatTime(entry.time_to)}
                  </td>
                  <td className="px-4 py-3 text-text-muted hidden sm:table-cell">
                    {entry.services?.service_categories?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-text">
                    {entry.services?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-text text-right font-medium whitespace-nowrap">
                    CHF {formatAmount(entry.amount)}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={cn(
                      'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                      PAYMENT_BADGE[entry.payment_method]
                    )}>
                      {t(`payment.${entry.payment_method}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-bg/50">
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
                <td className="px-4 py-3 hidden sm:table-cell" />
                <td className="px-4 py-3 text-sm font-semibold text-text-muted text-right">
                  {t('table.total')} ({filtered.length})
                </td>
                <td className="px-4 py-3 text-right font-bold text-text whitespace-nowrap">
                  CHF {formatAmount(total)}
                </td>
                <td className="px-4 py-3 hidden md:table-cell" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
