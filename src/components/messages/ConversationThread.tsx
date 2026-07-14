'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Send } from 'lucide-react'
import { cn, formatDateTime } from '@/lib/utils'
import { useConversation } from '@/hooks/useConversation'
import { useUser } from '@/hooks/useUser'

interface ConversationThreadProps {
  partnerId: string
  partnerName?: string
}

export default function ConversationThread({ partnerId, partnerName }: ConversationThreadProps) {
  const { t } = useTranslation('common')
  const { profile } = useUser()
  const { messages, loading, send, markRead } = useConversation(partnerId)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    markRead()
  }, [partnerId, markRead])

  const handleSend = async () => {
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    await send(content)
    setDraft('')
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      {partnerName && (
        <div className="px-4 py-3 border-b border-border font-medium text-text">
          {partnerName}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-sm text-text-muted">{t('messages.loading')}</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-text-muted">{t('messages.empty')}</p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === profile?.id
            return (
              <div key={m.id} className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}>
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words',
                    isMine ? 'bg-accent text-white' : 'bg-surface border border-border text-text'
                  )}
                >
                  {m.content}
                </div>
                <span className="text-[11px] text-text-muted mt-1">
                  {!isMine && m.sender?.full_name ? `${m.sender.full_name} · ` : ''}
                  {formatDateTime(m.created_at)}
                </span>
              </div>
            )
          })
        )}
      </div>

      <div className="p-3 border-t border-border flex items-center gap-2">
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
          placeholder={t('messages.placeholder')}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent text-white disabled:opacity-40 transition-opacity"
        >
          <Send size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
