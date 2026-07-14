'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Megaphone } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { useBroadcasts } from '@/hooks/useBroadcasts'

interface BroadcastFeedProps {
  canSend?: boolean
}

export default function BroadcastFeed({ canSend = false }: BroadcastFeedProps) {
  const { t } = useTranslation('common')
  const { broadcasts, loading, send } = useBroadcasts()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    await send(content)
    setDraft('')
    setSending(false)
  }

  return (
    <div className="border border-border rounded-xl bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2 text-text font-medium">
        <Megaphone size={16} strokeWidth={1.75} className="text-accent" />
        {t('messages.broadcast_title')}
      </div>

      {canSend && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={t('messages.broadcast_placeholder')}
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="px-3 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-40 transition-opacity"
          >
            {t('messages.broadcast_send')}
          </button>
        </div>
      )}

      {!loading && broadcasts.length === 0 && (
        <p className="text-sm text-text-muted">{t('messages.empty')}</p>
      )}

      <ul className="space-y-2 max-h-56 overflow-y-auto">
        {broadcasts.map((b) => (
          <li key={b.id} className="text-sm border-b border-border last:border-0 pb-2">
            <p className="text-text whitespace-pre-wrap break-words">{b.content}</p>
            <p className="text-[11px] text-text-muted mt-1">
              {b.sender?.full_name} · {formatDateTime(b.created_at)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
