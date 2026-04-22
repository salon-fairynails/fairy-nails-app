'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AdminExpense, ExpenseFilters } from '@/types/database'

export function useAdminExpenses(filters: ExpenseFilters) {
  const [expenses, setExpenses] = useState<AdminExpense[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('expenses')
      .select('*, profiles(full_name), expense_categories(id, name)')
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters.employee_id) query = query.eq('employee_id', filters.employee_id)
    if (filters.date_from)   query = query.gte('expense_date', filters.date_from)
    if (filters.date_to)     query = query.lte('expense_date', filters.date_to)
    if (filters.payment_method) query = query.eq('payment_method', filters.payment_method)
    if (filters.category_id) query = query.eq('category_id', parseInt(filters.category_id))

    const { data } = await query
    setExpenses(data ?? [])
    setLoading(false)
  }, [
    filters.employee_id,
    filters.date_from,
    filters.date_to,
    filters.payment_method,
    filters.category_id,
  ])

  useEffect(() => { load() }, [load])

  return { expenses, loading, reload: load }
}
