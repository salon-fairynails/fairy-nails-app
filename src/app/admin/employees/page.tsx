'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlus } from 'lucide-react'
import '@/lib/i18n/config'
import { useEmployees } from '@/hooks/useEmployees'
import EmployeeList from '@/components/admin/EmployeeList'
import AddEmployeeModal from '@/components/admin/AddEmployeeModal'

export default function EmployeesPage() {
  const { t } = useTranslation('common')
  const { employees, loading, reload } = useEmployees()
  const [showAdd, setShowAdd] = useState(false)

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold text-text">
            {t('admin.employees.title')}
          </h1>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-[#7a3d5e] active:scale-[0.98] transition-all"
          >
            <UserPlus size={15} />
            {t('admin.employees.add')}
          </button>
        </div>

        <EmployeeList employees={employees} loading={loading} onReload={reload} />
      </div>

      {showAdd && (
        <AddEmployeeModal
          onClose={() => setShowAdd(false)}
          onCreated={reload}
        />
      )}
    </>
  )
}
