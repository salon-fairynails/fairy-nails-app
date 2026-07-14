'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const POLL_INTERVAL_MS = 20000

export function useUnreadMessagesCount() {
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [direct, teamInbox] = await Promise.all([
      supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .is('read_at', null),
      supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .is('recipient_id', null)
        .eq('is_broadcast', false)
        .neq('sender_id', user.id)
        .is('read_at', null),
    ])

    setCount((direct.count ?? 0) + (teamInbox.count ?? 0))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [load])

  return { count, reload: load }
}
