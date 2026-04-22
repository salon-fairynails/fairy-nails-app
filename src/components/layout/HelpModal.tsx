'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

type HelpTab = 'general' | 'income' | 'expenses' | 'employees'

interface Props {
  onClose: () => void
}

export default function HelpModal({ onClose }: Props) {
  const { t } = useTranslation('common')
  const [tab, setTab] = useState<HelpTab>('general')

  const tabs: { key: HelpTab; label: string }[] = [
    { key: 'general', label: t('help.tab_general') },
    { key: 'income', label: t('help.tab_income') },
    { key: 'expenses', label: t('help.tab_expenses') },
    { key: 'employees', label: t('help.tab_employees') },
  ]

  const steps: Record<HelpTab, { title: string; text: string }[]> = {
    general: t('help.general_steps', { returnObjects: true }) as { title: string; text: string }[],
    income: t('help.income_steps', { returnObjects: true }) as { title: string; text: string }[],
    expenses: t('help.expenses_steps', { returnObjects: true }) as { title: string; text: string }[],
    employees: t('help.employees_steps', { returnObjects: true }) as { title: string; text: string }[],
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-display text-xl font-semibold text-text">
            {t('help.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors"
            aria-label={t('help.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex-1 px-4 py-2.5 text-sm font-medium transition-all',
                tab === key
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-muted hover:text-text'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {steps[tab].map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent/10 text-accent text-sm font-semibold flex items-center justify-center">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-text mb-0.5">{step.title}</p>
                <p className="text-sm text-text-muted leading-relaxed">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
