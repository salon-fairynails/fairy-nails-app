'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function AddEmployeeModal({ onClose, onCreated }: Props) {
  const { t } = useTranslation('common')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    password_confirm: '',
    role: 'employee',
    language: 'de',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.password_confirm) {
      setError(t('admin.add_employee.password_mismatch'))
      return
    }

    setLoading(true)
    const res = await fetch('/api/admin/create-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: form.role,
        language: form.language,
      }),
    })

    if (res.ok) {
      onCreated()
      onClose()
    } else {
      const data = await res.json()
      setError(data.error ?? t('admin.add_employee.error'))
      setLoading(false)
    }
  }

  const inputClass = cn(
    'w-full px-3 py-2 rounded-xl border border-border bg-bg text-text text-sm',
    'outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'
  )
  const labelClass = 'block text-xs font-medium text-text-muted mb-1'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-text/40 backdrop-blur-sm" />

      <div className="relative bg-surface rounded-2xl border border-border shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-xl font-semibold text-text">
            {t('admin.add_employee.title')}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>{t('admin.add_employee.name')}</label>
            <input type="text" required value={form.full_name} onChange={set('full_name')} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{t('admin.add_employee.email')}</label>
            <input type="email" required value={form.email} onChange={set('email')} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{t('admin.add_employee.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={form.password}
                onChange={set('password')}
                className={cn(inputClass, 'pr-10')}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('admin.add_employee.password_confirm')}</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={6}
                value={form.password_confirm}
                onChange={set('password_confirm')}
                className={cn(inputClass, 'pr-10')}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('admin.add_employee.role')}</label>
              <select value={form.role} onChange={set('role')} className={inputClass}>
                <option value="employee">{t('admin.employees.role_employee')}</option>
                <option value="admin">{t('admin.employees.role_admin')}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('admin.add_employee.language')}</label>
              <select value={form.language} onChange={set('language')} className={inputClass}>
                <option value="de">Deutsch</option>
                <option value="en">English</option>
                <option value="vi">Tiếng Việt</option>
              </select>
            </div>
          </div>

          {error && <p role="alert" className="text-error text-sm">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-text-muted hover:text-text hover:bg-secondary/40 transition-all">
              {t('modal.cancel')}
            </button>
            <button type="submit" disabled={loading}
              className={cn(
                'px-5 py-2 rounded-xl bg-accent text-white text-sm font-medium',
                'hover:bg-[#7a3d5e] active:scale-[0.98] transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}>
              {loading ? t('admin.add_employee.submitting') : t('admin.add_employee.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
