'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn, formatDate, formatTime, formatAmount } from '@/lib/utils'
import type { Entry, PaymentMethod } from '@/types/database'

type Period = 'all' | 'week' | 'month' | 'year'

interface Props {
  entries: Entry[]
  loading: boolean
  employeeColor?: string | null
}

interface SessionGroup {
  key: string
  entry_date: string
  time_from: string
  time_to: string
  payment_method: PaymentMethod
  entries: Entry[]
  total: number
}

const PAYMENT_BADGE: Record<PaymentMethod, string> = {
  cash: 'bg-secondary text-text',
  twint: 'bg-primary/20 text-primary-dark',
  credit_card: 'bg-accent/20 text-accent',
  voucher: 'bg-success/15 text-success',
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

function groupBySessions(entries: Entry[]): SessionGroup[] {
  const groups = new Map<string, SessionGroup>()
  for (const entry of entries) {
    const key = `${entry.entry_date}|${entry.time_from}|${entry.time_to}|${entry.payment_method}`
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        entry_date: entry.entry_date,
        time_from: entry.time_from,
        time_to: entry.time_to,
        payment_method: entry.payment_method,
        entries: [],
        total: 0,
      })
    }
    const group = groups.get(key)!
    group.entries.push(entry)
    group.total += entry.amount ?? 0
  }
  return Array.from(groups.values())
}

export default function EntryTable({ entries, loading, employeeColor }: Props) {
  const { t } = useTranslation('common')
  const [period, setPeriod] = useState<Period>('month')

  const filtered = filterByPeriod(entries, period)
  const groups = groupBySessions(filtered)
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
        <div className="p-4 space-y-2">
          {groups.map((group) => (
            <div
              key={group.key}
              className={cn(
                'rounded-xl border bg-bg/40 px-4 py-3',
                group.entries.length > 1
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border'
              )}
            >
              {/* Session header: Date + Time + Payment */}
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-medium text-text whitespace-nowrap">
                    {formatDate(group.entry_date)}
                  </span>
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {formatTime(group.time_from)} – {formatTime(group.time_to)}
                  </span>
                </div>
                <span className={cn(
                  'inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0',
                  PAYMENT_BADGE[group.payment_method]
                )}>
                  {t(`payment.${group.payment_method}`)}
                </span>
              </div>

              {/* Service lines */}
              <div className="space-y-1.5">
                {group.entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-text-muted hidden sm:inline flex-shrink-0">
                        {entry.services?.service_categories?.name ?? ''}
                      </span>
                      <span
                        className="text-sm truncate"
                        style={employeeColor ? { color: employeeColor } : undefined}
                      >
                        {entry.services?.name ?? '—'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-text whitespace-nowrap">
                      CHF {formatAmount(entry.amount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total for multi-service sessions */}
              {group.entries.length > 1 && (
                <div className="mt-2.5 pt-2 border-t border-border/60 flex justify-between items-center">
                  <span className="text-xs text-text-muted font-medium">
                    {t('table.total')} ({group.entries.length})
                  </span>
                  <span className="text-sm font-bold text-text whitespace-nowrap">
                    CHF {formatAmount(group.total)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Overall total footer */}
      {!loading && filtered.length > 0 && (
        <div className="border-t-2 border-border px-6 py-3 bg-bg/50 flex justify-between items-center">
          <span className="text-sm font-semibold text-text-muted">
            {t('table.total')} ({filtered.length})
          </span>
          <span className="font-bold text-text whitespace-nowrap">
            CHF {formatAmount(total)}
          </span>
        </div>
      )}
    </div>
  )
}
