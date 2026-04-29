'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n/config'
import type { ServiceCategory } from '@/types/database'
import CategoryManager from '@/components/admin/CategoryManager'
import ServiceManager from '@/components/admin/ServiceManager'

interface ServiceWithCategory {
  id: number
  name: string
  category_id: number
  default_price: number | null
  price_label: string | null
  is_active: boolean
  service_categories?: { id: number; name: string }
}

export default function CatalogPage() {
  const { t } = useTranslation('common')
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [services, setServices] = useState<ServiceWithCategory[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const [catsRes, svcsRes] = await Promise.all([
      fetch('/api/admin/catalog/categories'),
      fetch('/api/admin/catalog/services'),
    ])
    const [cats, svcs] = await Promise.all([catsRes.json(), svcsRes.json()])
    setCategories(cats)
    setServices(svcs)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-text">{t('catalog.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        <CategoryManager categories={categories} onReload={loadData} />
        <ServiceManager services={services} categories={categories} onReload={loadData} />
      </div>
    </div>
  )
}
