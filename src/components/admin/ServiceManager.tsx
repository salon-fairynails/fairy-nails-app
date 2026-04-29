'use client'

import { useState } from 'react'
import { Pencil, Plus, X, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { ServiceCategory } from '@/types/database'

interface ServiceWithCategory {
  id: number
  name: string
  category_id: number
  default_price: number | null
  price_label: string | null
  is_active: boolean
  service_categories?: { id: number; name: string }
}

interface Props {
  services: ServiceWithCategory[]
  categories: ServiceCategory[]
  onReload: () => void
}

interface ModalState {
  mode: 'add' | 'edit'
  service?: ServiceWithCategory
}

const EMPTY_FORM = {
  name: '',
  category_id: '',
  default_price: '',
  price_label: '',
}

export default function ServiceManager({ services, categories, onReload }: Props) {
  const { t } = useTranslation('common')
  const [filterCat, setFilterCat] = useState('')
  const [modal, setModal] = useState<ModalState | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = filterCat
    ? services.filter((s) => s.category_id === parseInt(filterCat))
    : services

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, category_id: filterCat })
    setModal({ mode: 'add' })
    setError(null)
  }

  const openEdit = (svc: ServiceWithCategory) => {
    setForm({
      name: svc.name,
      category_id: String(svc.category_id),
      default_price: svc.default_price != null ? String(svc.default_price) : '',
      price_label: svc.price_label ?? '',
    })
    setModal({ mode: 'edit', service: svc })
    setError(null)
  }

  const closeModal = () => {
    setModal(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.category_id) {
      setError(t('catalog.error_name_cat_required'))
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name,
      category_id: form.category_id,
      default_price: form.default_price !== '' ? parseFloat(form.default_price) : null,
      price_label: form.price_label || null,
    }

    const res = modal?.mode === 'edit' && modal.service
      ? await fetch(`/api/admin/catalog/services/${modal.service.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/admin/catalog/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

    setSaving(false)
    if (!res.ok) {
      setError(t('catalog.error_generic'))
      return
    }
    closeModal()
    onReload()
  }

  const handleToggle = async (svc: ServiceWithCategory) => {
    setTogglingId(svc.id)
    await fetch(`/api/admin/catalog/services/${svc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !svc.is_active }),
    })
    setTogglingId(null)
    onReload()
  }

  const inputClass = cn(
    'w-full px-3 py-2 rounded-xl border border-border bg-bg text-text text-sm',
    'outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
    'placeholder-text-muted'
  )
  const labelClass = 'block text-xs font-medium text-text-muted mb-1'

  return (
    <>
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="font-display text-lg font-semibold text-text flex-1">{t('catalog.services')}</h2>
          <div className="flex items-center gap-2">
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className={cn(inputClass, 'py-1.5 w-auto')}
            >
              <option value="">{t('catalog.all_categories')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-[#7a3d5e] transition-all whitespace-nowrap"
            >
              <Plus size={13} />
              {t('catalog.add_service')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="text-left px-5 py-3 font-medium text-text-muted">{t('catalog.service_name')}</th>
                <th className="text-left px-5 py-3 font-medium text-text-muted hidden sm:table-cell">{t('catalog.service_category')}</th>
                <th className="text-left px-5 py-3 font-medium text-text-muted">{t('catalog.service_price')}</th>
                <th className="text-left px-5 py-3 font-medium text-text-muted hidden md:table-cell">{t('catalog.service_price_label')}</th>
                <th className="px-5 py-3 font-medium text-text-muted text-center">{t('catalog.service_status')}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((svc) => (
                <tr key={svc.id} className={cn(
                  'border-b border-border last:border-0 transition-colors',
                  svc.is_active ? 'hover:bg-secondary/10' : 'opacity-50 hover:bg-secondary/10'
                )}>
                  <td className="px-5 py-3 font-medium text-text">{svc.name}</td>
                  <td className="px-5 py-3 text-text-muted hidden sm:table-cell">
                    {svc.service_categories?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-text">
                    {svc.default_price != null ? `CHF ${svc.default_price.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-text-muted hidden md:table-cell">
                    {svc.price_label || '—'}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => handleToggle(svc)}
                      disabled={togglingId === svc.id}
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all',
                        svc.is_active
                          ? 'bg-success/15 text-success hover:bg-success/25'
                          : 'bg-error/15 text-error hover:bg-error/25',
                        togglingId === svc.id && 'opacity-50'
                      )}
                    >
                      {svc.is_active ? (
                        <><Check size={10} />{t('catalog.service_active')}</>
                      ) : (
                        <><X size={10} />{t('catalog.service_inactive')}</>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(svc)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-border/50 transition-all">
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-text-muted text-center py-8">{t('catalog.no_services')}</p>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text/20 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-text">
                {modal.mode === 'add' ? t('catalog.modal_add_title') : t('catalog.modal_edit_title')}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-text-muted hover:bg-border/50 transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelClass}>{t('catalog.service_name')} *</label>
                <input
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder={t('catalog.service_name_placeholder')}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>{t('catalog.service_category')} *</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">{t('catalog.category_placeholder')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t('catalog.service_price_chf')}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    value={form.default_price}
                    onChange={(e) => setForm((p) => ({ ...p, default_price: e.target.value }))}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('catalog.service_price_label')}</label>
                  <input
                    value={form.price_label}
                    onChange={(e) => setForm((p) => ({ ...p, price_label: e.target.value }))}
                    placeholder={t('catalog.service_price_label_placeholder')}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-error">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={closeModal}
                className="px-4 py-2 rounded-xl text-sm text-text-muted hover:bg-border/50 transition-all">
                {t('catalog.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.category_id}
                className="px-5 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-[#7a3d5e] disabled:opacity-50 transition-all"
              >
                {saving ? t('catalog.saving') : t('catalog.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
