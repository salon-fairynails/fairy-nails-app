'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/database'

export function useBroadcasts() {
  const [broadcasts, setBroadcasts] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(full_name, role, color)')
      .eq('is_broadcast', true)
      .order('created_at', { ascending: false })

    setBroadcasts(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const send = useCallback(async (content: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('messages').insert({
      sender_id: user.id,
      recipient_id: null,
      is_broadcast: true,
      content,
    })
    await load()
  }, [load])

  return { broadcasts, loading, send, reload: load }
}
