'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import '@/lib/i18n/config'
import { startOfMonth, endOfMonth, cn } from '@/lib/utils'
import { useAdminEntries } from '@/hooks/useAdminEntries'
import { useEmployees } from '@/hooks/useEmployees'
import { useServices } from '@/hooks/useServices'
import FilterPanel from '@/components/admin/FilterPanel'
import AdminEntryTable from '@/components/admin/AdminEntryTable'
import SummaryBar from '@/components/admin/SummaryBar'
import type { Filters } from '@/types/database'

const DEFAULT_FILTERS: Filters = {
  employee_id: '',
  period: 'month',
  date_from: startOfMonth(),
  date_to: endOfMonth(),
  payment_method: '',
  category_id: '',
  service_id: '',
}

export default function AdminDashboard() {
  const { t } = useTranslation('common')
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [exporting, setExporting] = useState(false)

  const { entries, loading } = useAdminEntries(filters)
  const { employees } = useEmployees()
  const { categories, services } = useServices()

  // Client-side filter for category (when service_id is not set)
  const displayedEntries = useMemo(() => {
    if (!filters.category_id || filters.service_id) return entries
    return entries.filter(
      (e) => e.services?.service_categories?.id === parseInt(filters.category_id)
    )
  }, [entries, filters.category_id, filters.service_id])

  const handleExport = async () => {
    setExporting(true)
    const { exportToPdf } = await import('@/lib/pdf/exportEntries')
    exportToPdf(displayedEntries, filters, employees)
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
          onClick={handleExport}
          disabled={exporting || displayedEntries.length === 0}
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

      <FilterPanel
        filters={filters}
        employees={employees}
        categories={categories}
        services={services}
        onChange={setFilters}
      />

      <SummaryBar entries={displayedEntries} />

      <AdminEntryTable entries={displayedEntries} loading={loading} />
    </div>
  )
}
