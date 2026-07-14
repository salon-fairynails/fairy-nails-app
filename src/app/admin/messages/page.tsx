'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n/config'
import { cn } from '@/lib/utils'
import { useEmployees } from '@/hooks/useEmployees'
import ConversationThread from '@/components/messages/ConversationThread'
import BroadcastFeed from '@/components/messages/BroadcastFeed'

export default function AdminMessagesPage() {
  const { t } = useTranslation('common')
  const { employees, loading } = useEmployees()
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h1 className="font-display text-2xl text-accent">{t('messages.title')}</h1>

      <BroadcastFeed canSend />

      <div className="border border-border rounded-xl bg-surface h-[60vh] flex overflow-hidden">
        <div className="w-56 border-r border-border overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-text-muted">{t('messages.loading')}</p>
          ) : (
            employees.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelected(e.id)}
                className={cn(
                  'w-full text-left px-4 py-3 text-sm border-b border-border transition-colors',
                  selected === e.id ? 'bg-accent/10 text-accent' : 'text-text hover:bg-border/50'
                )}
              >
                {e.full_name}
              </button>
            ))
          )}
        </div>

        <div className="flex-1">
          {selected ? (
            <ConversationThread
              partnerId={selected}
              partnerName={employees.find((e) => e.id === selected)?.full_name}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-text-muted">
              {t('messages.no_conversation_selected')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
