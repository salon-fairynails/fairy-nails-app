'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import '@/lib/i18n/config'
import { startOfMonth, endOfMonth, cn, formatAmount } from '@/lib/utils'
import { useAdminEntries } from '@/hooks/useAdminEntries'
import { useAdminExpenses } from '@/hooks/useAdminExpenses'
import { useEmployees } from '@/hooks/useEmployees'
import { useServices } from '@/hooks/useServices'
import { useExpenseCategories } from '@/hooks/useExpenseCategories'
import FilterPanel from '@/components/admin/FilterPanel'
import ExpenseFilterPanel from '@/components/admin/ExpenseFilterPanel'
import AdminEntryTable from '@/components/admin/AdminEntryTable'
import AdminExpenseTable from '@/components/admin/AdminExpenseTable'
import SummaryBar from '@/components/admin/SummaryBar'
import type { Filters, ExpenseFilters } from '@/types/database'

type Tab = 'income' | 'expenses'

const DEFAULT_FILTERS: Filters = {
  employee_id: '',
  period: 'month',
  date_from: startOfMonth(),
  date_to: endOfMonth(),
  payment_method: '',
  category_id: '',
  service_id: '',
}

const DEFAULT_EXPENSE_FILTERS: ExpenseFilters = {
  employee_id: '',
  period: 'month',
  date_from: startOfMonth(),
  date_to: endOfMonth(),
  payment_method: '',
  category_id: '',
}

export default function AdminDashboard() {
  const { t } = useTranslation('common')
  const [tab, setTab] = useState<Tab>('income')
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [expenseFilters, setExpenseFilters] = useState<ExpenseFilters>(DEFAULT_EXPENSE_FILTERS)
  const [exporting, setExporting] = useState(false)

  const { entries, loading: entriesLoading } = useAdminEntries(filters)
  const { expenses, loading: expensesLoading } = useAdminExpenses(expenseFilters)
  const { employees } = useEmployees()
  const { categories, services } = useServices()
  const { categories: expenseCategories } = useExpenseCategories()

  const displayedEntries = useMemo(() => {
    if (!filters.category_id || filters.service_id) return entries
    return entries.filter(
      (e) => e.services?.service_categories?.id === parseInt(filters.category_id)
    )
  }, [entries, filters.category_id, filters.service_id])

  // Combined summary values (based on current tab's period)
  const totalIncome = displayedEntries.reduce((sum, e) => sum + Number(e.amount), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const difference = totalIncome - totalExpenses

  const handleExportIncome = async () => {
    setExporting(true)
    const { exportToPdf } = await import('@/lib/pdf/exportEntries')
    exportToPdf(displayedEntries, filters, employees)
    setExporting(false)
  }

  const handleExportExpenses = async () => {
    setExporting(true)
    const { exportExpensesToPdf } = await import('@/lib/pdf/exportExpenses')
    exportExpensesToPdf(expenses, expenseFilters, employees)
    setExporting(false)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-text">
          {t('admin.dashboard_title')}
        </h1>
        <button
          onClick={tab === 'income' ? handleExportIncome : handleExportExpenses}
          disabled={exporting || (tab === 'income' ? displayedEntries.length === 0 : expenses.length === 0)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
            'bg-accent text-white hover:bg-[#7a3d5e] active:scale-[0.98]',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <Download size={15} />
          {exporting ? '…' : t('admin.export.button')}
        </button>
      </div>

      {/* Combined Summary */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl px-5 py-4 flex flex-wrap items-center gap-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-text-muted text-sm">{t('admin.combined_summary.income')}:</span>
          <span className="font-display text-xl font-semibold text-success">CHF {formatAmount(totalIncome)}</span>
        </div>
        <div className="hidden sm:block w-px h-7 bg-border" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-text-muted text-sm">{t('admin.combined_summary.expenses')}:</span>
          <span className="font-display text-xl font-semibold text-error">CHF {formatAmount(totalExpenses)}</span>
        </div>
        <div className="hidden sm:block w-px h-7 bg-border" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-text-muted text-sm">
            {difference >= 0 ? t('admin.combined_summary.profit') : t('admin.combined_summary.loss')}:
          </span>
          <span className={cn(
            'font-display text-xl font-semibold',
            difference >= 0 ? 'text-accent' : 'text-error'
          )}>
            CHF {formatAmount(Math.abs(difference))}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-border overflow-hidden bg-surface w-fit">
        {(['income', 'expenses'] as Tab[]).map((t_) => (
          <button
            key={t_}
            onClick={() => setTab(t_)}
            className={cn(
              'px-5 py-2 text-sm font-medium transition-all',
              tab === t_
                ? 'bg-accent text-white'
                : 'text-text-muted hover:text-text hover:bg-secondary/40'
            )}
          >
            {t(`tabs.${t_}`)}
          </button>
        ))}
      </div>

      {/* Income Tab */}
      {tab === 'income' && (
        <>
          <FilterPanel
            filters={filters}
            employees={employees}
            categories={categories}
            services={services}
            onChange={setFilters}
          />
          <SummaryBar entries={displayedEntries} />
          <AdminEntryTable entries={displayedEntries} loading={entriesLoading} />
        </>
      )}

      {/* Expenses Tab */}
      {tab === 'expenses' && (
        <>
          <ExpenseFilterPanel
            filters={expenseFilters}
            employees={employees}
            categories={expenseCategories}
            onChange={setExpenseFilters}
          />
          <div className="bg-accent/5 border border-accent/20 rounded-2xl px-5 py-4 flex flex-wrap items-center gap-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-text-muted text-sm">{t('admin.summary.total')}:</span>
              <span className="font-display text-2xl font-semibold text-accent">
                CHF {formatAmount(totalExpenses)}
              </span>
              <span className="text-text-muted text-xs">
                ({expenses.length} {t('admin.summary.entries')})
              </span>
            </div>
          </div>
          <AdminExpenseTable expenses={expenses} loading={expensesLoading} />
        </>
      )}
    </div>
  )
}
