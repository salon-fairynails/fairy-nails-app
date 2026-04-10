'use client'

import { useTranslation } from 'react-i18next'
import { cn, formatDate, formatTime, formatAmount } from '@/lib/utils'
import type { Entry, PaymentMethod } from '@/types/database'

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

export default function EntryTable({ entries, loading, onEdit }: Props) {
  const { t } = useTranslation('common')

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-display text-xl font-semibold text-text">
          {t('table.title')}
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-text-muted text-sm">
          {t('table.no_entries')}
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
              {entries.map((entry) => (
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
          </table>
        </div>
      )}
    </div>
  )
}
