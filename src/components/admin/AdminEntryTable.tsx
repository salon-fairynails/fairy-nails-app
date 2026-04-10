'use client'

import { useTranslation } from 'react-i18next'
import { cn, formatDate, formatTime, formatAmount } from '@/lib/utils'
import type { AdminEntry, PaymentMethod } from '@/types/database'

interface Props {
  entries: AdminEntry[]
  loading: boolean
}

const PAYMENT_BADGE: Record<PaymentMethod, string> = {
  cash: 'bg-secondary text-text',
  twint: 'bg-primary/20 text-primary-dark',
  credit_card: 'bg-accent/20 text-accent',
}

export default function AdminEntryTable({ entries, loading }: Props) {
  const { t } = useTranslation('common')

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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="text-left px-4 py-3 font-medium text-text-muted">{t('admin.table.employee')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">{t('admin.table.date')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted hidden sm:table-cell">{t('admin.table.time')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell">{t('admin.table.category')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">{t('admin.table.service')}</th>
                <th className="text-right px-4 py-3 font-medium text-text-muted">{t('admin.table.amount')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted hidden lg:table-cell">{t('admin.table.payment')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-secondary/10 transition-colors">
                  <td className="px-4 py-3 font-medium text-text">
                    {entry.profiles?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-text whitespace-nowrap">
                    {formatDate(entry.entry_date)}
                  </td>
                  <td className="px-4 py-3 text-text-muted whitespace-nowrap hidden sm:table-cell">
                    {formatTime(entry.time_from)} – {formatTime(entry.time_to)}
                  </td>
                  <td className="px-4 py-3 text-text-muted hidden md:table-cell">
                    {entry.services?.service_categories?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-text">
                    {entry.services?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text whitespace-nowrap">
                    CHF {formatAmount(entry.amount)}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
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
