'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { EmployeeWithEmail } from '@/types/database'

interface Props {
  employees: EmployeeWithEmail[]
  loading: boolean
  onReload: () => void
}

export default function EmployeeList({ employees, loading, onReload }: Props) {
  const { t } = useTranslation('common')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  const handleDeactivate = async (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id)
      return
    }
    setWorking(true)
    await fetch('/api/admin/deactivate-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: id }),
    })
    setConfirmId(null)
    setWorking(false)
    onReload()
  }

  const LANG_LABELS: Record<string, string> = { de: 'DE', en: 'EN', vi: 'VI' }
  const ROLE_LABELS: Record<string, string> = {
    admin: t('admin.employees.role_admin'),
    employee: t('admin.employees.role_employee'),
  }

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="text-left px-4 py-3 font-medium text-text-muted">{t('admin.employees.name')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted hidden sm:table-cell">{t('admin.employees.email')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell">{t('admin.employees.role')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell">{t('admin.employees.language')}</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">{t('admin.employees.status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-secondary/10 transition-colors">
                  <td className="px-4 py-3 font-medium text-text">{emp.full_name}</td>
                  <td className="px-4 py-3 text-text-muted hidden sm:table-cell">{emp.email}</td>
                  <td className="px-4 py-3 text-text-muted hidden md:table-cell">
                    {ROLE_LABELS[emp.role] ?? emp.role}
                  </td>
                  <td className="px-4 py-3 text-text-muted hidden md:table-cell">
                    {LANG_LABELS[emp.language] ?? emp.language}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                      emp.is_active
                        ? 'bg-success/15 text-success'
                        : 'bg-error/15 text-error'
                    )}>
                      {emp.is_active ? t('admin.employees.active') : t('admin.employees.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {emp.is_active && (
                      <button
                        onClick={() => handleDeactivate(emp.id)}
                        disabled={working}
                        className={cn(
                          'text-xs px-3 py-1 rounded-lg transition-all',
                          confirmId === emp.id
                            ? 'bg-error text-white'
                            : 'text-error hover:bg-error/10'
                        )}
                      >
                        {confirmId === emp.id
                          ? t('admin.employees.deactivate_confirm')
                          : t('admin.employees.deactivate')}
                      </button>
                    )}
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
