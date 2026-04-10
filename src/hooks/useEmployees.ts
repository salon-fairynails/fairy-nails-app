'use client'

import { useEffect, useState, useCallback } from 'react'
import type { EmployeeWithEmail } from '@/types/database'

export function useEmployees() {
  const [employees, setEmployees] = useState<EmployeeWithEmail[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/employees')
    if (res.ok) {
      const data = await res.json()
      setEmployees(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { employees, loading, reload: load }
}
