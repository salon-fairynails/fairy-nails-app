'use client'

import { useTranslation } from 'react-i18next'
import { formatAmount } from '@/lib/utils'
import type { AdminEntry } from '@/types/database'

interface Props {
  entries: AdminEntry[]
}

export default function SummaryBar({ entries }: Props) {
  const { t } = useTranslation('common')

  const total = entries.reduce((sum, e) => sum + Number(e.amount), 0)
  const cash = entries.filter((e) => e.payment_method === 'cash').reduce((s, e) => s + Number(e.amount), 0)
  const twint = entries.filter((e) => e.payment_method === 'twint').reduce((s, e) => s + Number(e.amount), 0)
  const cc = entries.filter((e) => e.payment_method === 'credit_card').reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="bg-accent/5 border border-accent/20 rounded-2xl px-5 py-4 flex flex-wrap items-center gap-4">
      {/* Total */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-text-muted text-sm">{t('admin.summary.total')}:</span>
        <span className="font-display text-2xl font-semibold text-accent">
          CHF {formatAmount(total)}
        </span>
        <span className="text-text-muted text-xs">
          ({entries.length} {t('admin.summary.entries')})
        </span>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-8 bg-border" />

      {/* Breakdown */}
      <div className="flex flex-wrap gap-4 text-sm">
        {cash > 0 && (
          <span className="text-text-muted">
            {t('payment.cash')}: <span className="text-text font-medium">CHF {formatAmount(cash)}</span>
          </span>
        )}
        {twint > 0 && (
          <span className="text-text-muted">
            {t('payment.twint')}: <span className="text-text font-medium">CHF {formatAmount(twint)}</span>
          </span>
        )}
        {cc > 0 && (
          <span className="text-text-muted">
            {t('payment.credit_card')}: <span className="text-text font-medium">CHF {formatAmount(cc)}</span>
          </span>
        )}
        {total === 0 && (
          <span className="text-text-muted text-sm">—</span>
        )}
      </div>
    </div>
  )
}
