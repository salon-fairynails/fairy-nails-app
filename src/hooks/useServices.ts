'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Service, ServiceCategory } from '@/types/database'

export function useServices() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    Promise.all([
      supabase.from('service_categories').select('*').order('id'),
      supabase.from('services').select('*').eq('is_active', true).order('id'),
    ]).then(([{ data: cats }, { data: svcs }]) => {
      setCategories(cats ?? [])
      setServices(svcs ?? [])
      setLoading(false)
    })
  }, [])

  return { categories, services, loading }
}
