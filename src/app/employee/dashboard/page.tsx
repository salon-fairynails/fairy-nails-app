'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import '@/lib/i18n/config'
import { cn } from '@/lib/utils'
import { useServices } from '@/hooks/useServices'
import { useEntries } from '@/hooks/useEntries'
import { useExpenses } from '@/hooks/useExpenses'
import { useExpenseCategories } from '@/hooks/useExpenseCategories'
import { useUser } from '@/hooks/useUser'
import EntryForm from '@/components/employee/EntryForm'
import EntryTable from '@/components/employee/EntryTable'
import EditEntryModal from '@/components/employee/EditEntryModal'
import ExpenseForm from '@/components/employee/ExpenseForm'
import ExpenseTable from '@/components/employee/ExpenseTable'
import EditExpenseModal from '@/components/employee/EditExpenseModal'
import type { Entry, Expense } from '@/types/database'

type Tab = 'income' | 'expenses'

export default function EmployeeDashboard() {
  const { t } = useTranslation('common')
  const [tab, setTab] = useState<Tab>('income')
  const [exporting, setExporting] = useState(false)

  const { profile } = useUser()
  const { categories: serviceCategories, services, loading: servicesLoading } = useServices()
  const { entries, loading: entriesLoading, reload: reloadEntries } = useEntries()
  const { categories: expenseCategories, loading: expCatsLoading } = useExpenseCategories()
  const { expenses, loading: expensesLoading, reload: reloadExpenses } = useExpenses()

  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const handleExport = async () => {
    setExporting(true)
    const name = profile?.full_name ?? ''
    if (tab === 'income') {
      const { exportEmployeeEntriesToPdf } = await import('@/lib/pdf/exportEmployeeEntries')
      exportEmployeeEntriesToPdf(entries, name)
    } else {
      const { exportEmployeeExpensesToPdf } = await import('@/lib/pdf/exportEmployeeEntries')
      exportEmployeeExpensesToPdf(expenses, name)
    }
    setExporting(false)
  }

  if (servicesLoading || expCatsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  const currentCount = tab === 'income' ? entries.length : expenses.length

  return (
    <>
      {/* Tabs + Export */}
      <div className="flex items-center justify-between mb-6">
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

        <button
          onClick={handleExport}
          disabled={exporting || currentCount === 0}
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

      {tab === 'income' && (
        <div className="space-y-6">
          <EntryForm categories={serviceCategories} services={services} onSuccess={reloadEntries} />
          <EntryTable entries={entries} loading={entriesLoading} onEdit={setEditingEntry} />
        </div>
      )}

      {tab === 'expenses' && (
        <div className="space-y-6">
          <ExpenseForm categories={expenseCategories} onSuccess={reloadExpenses} />
          <ExpenseTable expenses={expenses} loading={expensesLoading} onEdit={setEditingExpense} />
        </div>
      )}

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          categories={serviceCategories}
          services={services}
          onClose={() => setEditingEntry(null)}
          onSaved={reloadEntries}
        />
      )}

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          categories={expenseCategories}
          onClose={() => setEditingExpense(null)}
          onSaved={reloadExpenses}
        />
      )}
    </>
  )
}
