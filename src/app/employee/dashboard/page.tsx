'use client'

import { useState } from 'react'
import '@/lib/i18n/config'
import { useServices } from '@/hooks/useServices'
import { useEntries } from '@/hooks/useEntries'
import EntryForm from '@/components/employee/EntryForm'
import EntryTable from '@/components/employee/EntryTable'
import EditEntryModal from '@/components/employee/EditEntryModal'
import type { Entry } from '@/types/database'

export default function EmployeeDashboard() {
  const { categories, services, loading: servicesLoading } = useServices()
  const { entries, loading: entriesLoading, reload } = useEntries()
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)

  if (servicesLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <EntryForm
          categories={categories}
          services={services}
          onSuccess={reload}
        />
<EntryTable
          entries={entries}
          loading={entriesLoading}
          onEdit={setEditingEntry}
        />
      </div>

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          categories={categories}
          services={services}
          onClose={() => setEditingEntry(null)}
          onSaved={reload}
        />
      )}
    </>
  )
}
