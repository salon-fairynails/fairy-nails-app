'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatAmount } from '@/lib/utils'
import type { AdminEntry, EmployeeWithEmail } from '@/types/database'

interface Props {
  employees: EmployeeWithEmail[]
  entries: AdminEntry[]
}

export default function GoalProgress({ employees, entries }: Props) {
  const { t } = useTranslation('common')

  const revenueByEmployee = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of entries) {
      map[e.employee_id] = (map[e.employee_id] ?? 0) + Number(e.amount)
    }
    return map
  }, [entries])

  const rows = useMemo(() =>
    employees
      .filter(emp => emp.role === 'employee' && emp.monthly_target != null && emp.monthly_target > 0)
      .map(emp => {
        const revenue = revenueByEmployee[emp.id] ?? 0
        const target = emp.monthly_target!
        const pct = (revenue / target) * 100
        const achieved = revenue >= target
        const bonus = revenue * (emp.bonus_rate / 100)
        return { emp, revenue, target, pct, achieved, bonus }
      }),
    [employees, revenueByEmployee]
  )

  if (rows.length === 0) return null

  return (
    <div className="bg-accent/5 border border-accent/20 rounded-2xl px-5 py-4 space-y-4">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
        {t('admin.goals.title')}
      </p>

      <div className="space-y-5">
        {rows.map(({ emp, revenue, target, pct, achieved, bonus }) => (
          <div key={emp.id} className="space-y-1.5">
            {/* Header row */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text">{emp.full_name}</span>
                {achieved && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-success font-medium">
                    {t('admin.goals.achieved')}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1 text-xs text-text-muted">
                <span className={achieved ? 'text-success font-semibold' : 'text-text font-medium'}>
                  CHF {formatAmount(revenue)}
                </span>
                <span>/ CHF {formatAmount(target)}</span>
                <span className="ml-1">({pct.toFixed(1)}%)</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-3 rounded-full overflow-hidden bg-border">
              {/* Full red→green gradient always underneath */}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to right, #C0392B, #5D8A5E)' }}
              />
              {/* Gray cover shrinks from right as progress grows */}
              {pct < 100 && (
                <div
                  className="absolute top-0 right-0 h-full"
                  style={{
                    width: `${100 - Math.min(pct, 100)}%`,
                    background: '#E5D0C5',
                  }}
                />
              )}
            </div>

            {/* Bonus line */}
            {emp.bonus_rate > 0 && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <span>{t('admin.goals.bonus')}:</span>
                <span className={achieved ? 'text-success font-medium' : 'text-text'}>
                  CHF {formatAmount(bonus)}
                </span>
                {!achieved && (
                  <span>({t('admin.goals.on_achievement')})</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
