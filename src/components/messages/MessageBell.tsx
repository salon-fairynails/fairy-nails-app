'use client'

import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount'
import { useUser } from '@/hooks/useUser'

export default function MessageBell() {
  const router = useRouter()
  const { t } = useTranslation('common')
  const { profile } = useUser()
  const { count } = useUnreadMessagesCount()

  if (!profile) return null

  const handleClick = () => {
    router.push(profile.role === 'admin' ? '/admin/messages' : '/employee/messages')
  }

  return (
    <button
      onClick={handleClick}
      title={t('messages.bell_label')}
      className="relative flex items-center text-text-muted hover:text-text transition-colors"
    >
      <Bell size={16} strokeWidth={1.75} />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[10px] font-semibold leading-none">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}
