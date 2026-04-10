'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AdminEntry, Filters } from '@/types/database'

export function useAdminEntries(filters: Filters) {
  const [entries, setEntries] = useState<AdminEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('entries')
      .select('*, profiles(full_name), services(name, service_categories(id, name))')
      .order('entry_date', { ascending: false })
      .order('time_from', { ascending: false })

    if (filters.employee_id) query = query.eq('employee_id', filters.employee_id)
    if (filters.date_from)   query = query.gte('entry_date', filters.date_from)
    if (filters.date_to)     query = query.lte('entry_date', filters.date_to)
    if (filters.payment_method) query = query.eq('payment_method', filters.payment_method)
    if (filters.service_id)  query = query.eq('service_id', parseInt(filters.service_id))

    const { data } = await query
    setEntries(data ?? [])
    setLoading(false)
  }, [
    filters.employee_id,
    filters.date_from,
    filters.date_to,
    filters.payment_method,
    filters.service_id,
  ])

  useEffect(() => { load() }, [load])

  return { entries, loading, reload: load }
}
