'use client'

import { useTranslation } from 'react-i18next'
import '@/lib/i18n/config'
import { useUser } from '@/hooks/useUser'
import ConversationThread from '@/components/messages/ConversationThread'
import BroadcastFeed from '@/components/messages/BroadcastFeed'

export default function EmployeeMessagesPage() {
  const { t } = useTranslation('common')
  const { profile, loading } = useUser()

  if (loading || !profile) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <h1 className="font-display text-2xl text-accent">{t('messages.title')}</h1>

      <BroadcastFeed />

      <div className="border border-border rounded-xl bg-surface h-[60vh]">
        <ConversationThread partnerId={profile.id} />
      </div>
    </div>
  )
}
