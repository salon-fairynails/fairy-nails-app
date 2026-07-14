'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/database'

// partnerId ist immer die Employee-ID des Threads (eigene ID bei Employee,
// ausgewählte Mitarbeiter-ID bei Admin) — Nachrichten des Admin-Teams an
// diesen Employee haben recipient_id = partnerId, Nachrichten des Employees
// ans Admin-Team haben sender_id = partnerId und recipient_id = null.
export function useConversation(partnerId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!partnerId) {
      setMessages([])
      setLoading(false)
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(full_name, role, color)')
      .or(`sender_id.eq.${partnerId},recipient_id.eq.${partnerId}`)
      .eq('is_broadcast', false)
      .order('created_at')

    setMessages(data ?? [])
    setLoading(false)
  }, [partnerId])

  useEffect(() => {
    load()
  }, [load])

  const send = useCallback(async (content: string) => {
    if (!partnerId) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const recipientId = user.id === partnerId ? null : partnerId
    await supabase.from('messages').insert({
      sender_id: user.id,
      recipient_id: recipientId,
      is_broadcast: false,
      content,
    })
    await load()
  }, [partnerId, load])

  const markRead = useCallback(async () => {
    if (!partnerId) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (user.id === partnerId) {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .is('read_at', null)
    } else {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', partnerId)
        .is('recipient_id', null)
        .eq('is_broadcast', false)
        .is('read_at', null)
    }
    await load()
  }, [partnerId, load])

  return { messages, loading, send, markRead, reload: load }
}
