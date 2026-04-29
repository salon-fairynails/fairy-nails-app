'use client'

import { useState } from 'react'
import { Pencil, Check, X, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { ServiceCategory } from '@/types/database'

interface Props {
  categories: ServiceCategory[]
  onReload: () => void
}

export default function CategoryManager({ categories, onReload }: Props) {
  const { t } = useTranslation('common')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startEdit = (cat: ServiceCategory) => {
    setEditId(cat.id)
    setEditName(cat.name)
    setAdding(false)
    setError(null)
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditName('')
    setError(null)
  }

  const saveEdit = async () => {
    if (!editName.trim() || editId === null) return
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/admin/catalog/categories/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    })
    setSaving(false)
    if (!res.ok) {
      setError(t('catalog.error_generic'))
      return
    }
    setEditId(null)
    onReload()
  }

  const saveNew = async () => {
    if (!newName.trim()) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/admin/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    setSaving(false)
    if (!res.ok) {
      setError(t('catalog.error_generic'))
      return
    }
    setNewName('')
    setAdding(false)
    onReload()
  }

  const inputClass = cn(
    'px-2.5 py-1.5 rounded-lg border border-border bg-bg text-text text-sm',
    'outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-full'
  )

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-text">{t('catalog.categories')}</h2>
        {!adding && (
          <button
            onClick={() => { setAdding(true); setEditId(null); setError(null) }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-[#7a3d5e] transition-all"
          >
            <Plus size={13} />
            {t('catalog.add_category')}
          </button>
        )}
      </div>

      <ul className="divide-y divide-border">
        {categories.map((cat) => (
          <li key={cat.id} className="flex items-center gap-3 px-5 py-3">
            {editId === cat.id ? (
              <>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                  className={cn(inputClass, 'flex-1')}
                />
                <button onClick={saveEdit} disabled={saving || !editName.trim()}
                  className="p-1.5 rounded-lg text-success hover:bg-success/10 disabled:opacity-40 transition-all">
                  <Check size={15} />
                </button>
                <button onClick={cancelEdit} className="p-1.5 rounded-lg text-text-muted hover:bg-border/50 transition-all">
                  <X size={15} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-text">{cat.name}</span>
                <button onClick={() => startEdit(cat)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-border/50 transition-all">
                  <Pencil size={14} />
                </button>
              </>
            )}
          </li>
        ))}

        {adding && (
          <li className="flex items-center gap-3 px-5 py-3 bg-secondary/10">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveNew(); if (e.key === 'Escape') { setAdding(false); setNewName('') } }}
              placeholder={t('catalog.category_name_placeholder')}
              className={cn(inputClass, 'flex-1')}
            />
            <button onClick={saveNew} disabled={saving || !newName.trim()}
              className="p-1.5 rounded-lg text-success hover:bg-success/10 disabled:opacity-40 transition-all">
              <Check size={15} />
            </button>
            <button onClick={() => { setAdding(false); setNewName('') }}
              className="p-1.5 rounded-lg text-text-muted hover:bg-border/50 transition-all">
              <X size={15} />
            </button>
          </li>
        )}
      </ul>

      {categories.length === 0 && !adding && (
        <p className="text-sm text-text-muted text-center py-8">{t('catalog.no_categories')}</p>
      )}

      {error && <p className="text-xs text-error px-5 py-2">{error}</p>}
    </div>
  )
}
