'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Entry } from '@/types/database'

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('entries')
      .select('*, services(name, service_categories(id, name))')
      .order('entry_date', { ascending: false })
      .order('time_from', { ascending: false })

    setEntries(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { entries, loading, reload: load }
}
