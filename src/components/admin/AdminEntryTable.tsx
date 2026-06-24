'use client'

import { useTranslation } from 'react-i18next'
import { cn, formatDate, formatTime, formatAmount } from '@/lib/utils'
import type { AdminEntry, PaymentMethod } from '@/types/database'

interface Props {
  entries: AdminEntry[]
  loading: boolean
  onEdit: (entry: AdminEntry) => void
}

interface SessionGroup {
  key: string
  employee_id: string
  employee_name: string
  employee_color: string | null
  entry_date: string
  time_from: string
  time_to: string
  payment_method: PaymentMethod
  entries: AdminEntry[]
  total: number
}

const PAYMENT_BADGE: Record<PaymentMethod, string> = {
  cash: 'bg-secondary text-text',
  twint: 'bg-primary/20 text-primary-dark',
  credit_card: 'bg-accent/20 text-accent',
  voucher: 'bg-success/15 text-success',
}

function groupBySessions(entries: AdminEntry[]): SessionGroup[] {
  const groups = new Map<string, SessionGroup>()
  for (const entry of entries) {
    const key = `${entry.employee_id}|${entry.entry_date}|${entry.time_from}|${entry.time_to}|${entry.payment_method}`
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        employee_id: entry.employee_id,
        employee_name: entry.profiles?.full_name ?? '—',
        employee_color: entry.profiles?.color ?? null,
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

export default function AdminEntryTable({ entries, loading, onEdit }: Props) {
  const { t } = useTranslation('common')

  const groups = groupBySessions(entries)

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-text-muted text-sm">
          {t('admin.table.no_entries')}
        </div>
      ) : (
        <div className="p-4 space-y-2">
          {groups.map((group) => (
            <div
              key={group.key}
              className={cn(
                'rounded-xl border px-4 py-3',
                group.entries.length > 1
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border bg-bg/40'
              )}
            >
              {/* Session header */}
              <div className="flex items-center justify-between gap-3 mb-2.5 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="text-sm font-semibold truncate"
                    style={group.employee_color ? { color: group.employee_color } : undefined}
                  >
                    {group.employee_name}
                  </span>
                  <span className="text-sm text-text whitespace-nowrap">
                    {formatDate(group.entry_date)}
                  </span>
                  <span className="text-xs text-text-muted whitespace-nowrap hidden sm:inline">
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
                  <div
                    key={entry.id}
                    onClick={() => onEdit(entry)}
                    className="flex items-center justify-between gap-2 cursor-pointer hover:bg-secondary/20 -mx-1 px-1 py-0.5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-text-muted hidden md:inline flex-shrink-0">
                        {entry.services?.service_categories?.name ?? ''}
                      </span>
                      <span
                        className="text-sm truncate"
                        style={group.employee_color ? { color: group.employee_color } : undefined}
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
                    {t('admin.summary.total')} ({group.entries.length})
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
    </div>
  )
}
