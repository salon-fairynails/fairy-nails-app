'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Expense } from '@/types/database'

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('expenses')
      .select('*, expense_categories(id, name)')
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })

    setExpenses(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { expenses, loading, reload: load }
}
