'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ExpenseCategory } from '@/types/database'

export function useExpenseCategories() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('expense_categories')
        .select('*')
        .order('id')
      setCategories(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return { categories, loading }
}
