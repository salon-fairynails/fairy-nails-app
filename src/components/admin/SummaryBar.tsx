'use client'

import { useTranslation } from 'react-i18next'
import { formatAmount } from '@/lib/utils'
import type { AdminEntry, EmployeeWithEmail } from '@/types/database'

interface Props {
  entries: AdminEntry[]
  employees: EmployeeWithEmail[]
}

interface EmployeeCommission {
  id: string
  name: string
  total: number
  rate: number
  commission: number
  adminShare: number
}

export default function SummaryBar({ entries, employees }: Props) {
  const { t } = useTranslation('common')

  const total = entries.reduce((sum, e) => sum + Number(e.amount), 0)
  const cash = entries.filter((e) => e.payment_method === 'cash').reduce((s, e) => s + Number(e.amount), 0)
  const twint = entries.filter((e) => e.payment_method === 'twint').reduce((s, e) => s + Number(e.amount), 0)
  const cc = entries.filter((e) => e.payment_method === 'credit_card').reduce((s, e) => s + Number(e.amount), 0)

  // A "customer" is a unique combination of employee + date + time slot
  const customerCount = new Set(
    entries.map((e) => `${e.employee_id}|${e.entry_date}|${e.time_from}|${e.time_to}`)
  ).size

  // Commission breakdown per employee (only employees with entries)
  const commissionRows: EmployeeCommission[] = employees
    .filter((emp) => emp.role === 'employee')
    .map((emp) => {
      const empEntries = entries.filter((e) => e.employee_id === emp.id)
      const empTotal = empEntries.reduce((s, e) => s + Number(e.amount), 0)
      const commission = empTotal * (emp.commission_rate / 100)
      return {
        id: emp.id,
        name: emp.full_name,
        total: empTotal,
        rate: emp.commission_rate,
        commission,
        adminShare: empTotal - commission,
      }
    })
    .filter((row) => row.total > 0)

  const totalCommission = commissionRows.reduce((s, r) => s + r.commission, 0)
  const totalAdminShare = commissionRows.reduce((s, r) => s + r.adminShare, 0)
  const showCommission = commissionRows.length > 0

  return (
    <div className="bg-accent/5 border border-accent/20 rounded-2xl px-5 py-4 space-y-4">
      {/* Main summary row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Total */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-text-muted text-sm">{t('admin.summary.total')}:</span>
          <span className="font-display text-2xl font-semibold text-accent">
            CHF {formatAmount(total)}
          </span>
          <span className="text-text-muted text-xs">
            ({customerCount} {t('admin.summary.customers')} | {entries.length} {t('admin.summary.services')})
          </span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-border" />

        {/* Payment breakdown */}
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

      {/* Commission breakdown */}
      {showCommission && (
        <div className="border-t border-accent/15 pt-3 space-y-2">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            {t('admin.summary.commission_breakdown')}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted text-xs">
                  <th className="pr-4 pb-1 font-medium">{t('admin.employees.name')}</th>
                  <th className="pr-4 pb-1 font-medium text-right">{t('admin.summary.revenue')}</th>
                  <th className="pr-4 pb-1 font-medium text-right">{t('admin.summary.commission_col')}</th>
                  <th className="pb-1 font-medium text-right">{t('admin.summary.admin_share')}</th>
                </tr>
              </thead>
              <tbody>
                {commissionRows.map((row) => (
                  <tr key={row.id}>
                    <td className="pr-4 py-0.5 text-text">
                      {row.name}
                      <span className="text-text-muted text-xs ml-1">({row.rate}%)</span>
                    </td>
                    <td className="pr-4 py-0.5 text-right text-text">CHF {formatAmount(row.total)}</td>
                    <td className="pr-4 py-0.5 text-right text-primary">CHF {formatAmount(row.commission)}</td>
                    <td className="py-0.5 text-right text-success font-medium">CHF {formatAmount(row.adminShare)}</td>
                  </tr>
                ))}
              </tbody>
              {commissionRows.length > 1 && (
                <tfoot>
                  <tr className="border-t border-border text-sm font-bold">
                    <td className="pr-4 pt-1.5 text-text-muted">{t('admin.summary.total')}</td>
                    <td className="pr-4 pt-1.5 text-right text-text">CHF {formatAmount(total)}</td>
                    <td className="pr-4 pt-1.5 text-right text-primary">CHF {formatAmount(totalCommission)}</td>
                    <td className="pt-1.5 text-right text-success">CHF {formatAmount(totalAdminShare)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
