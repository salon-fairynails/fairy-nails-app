'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n/config'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import LanguageSwitcher from './LanguageSwitcher'

const ADMIN_NAV = [
  { href: '/admin/dashboard', labelKey: 'nav.dashboard' },
  { href: '/admin/employees', labelKey: 'nav.employees' },
  { href: '/employee/dashboard', labelKey: 'nav.my_entries' },
]

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation('common')
  const { profile } = useUser()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo + Admin-Nav */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-xl font-semibold text-accent">
              {t('brand.name')}
            </span>
            <span className="text-lg" role="img" aria-label="sparkle">✨</span>
          </div>

          {profile?.role === 'admin' && (
            <nav className="flex items-center gap-1">
              {ADMIN_NAV.map(({ href, labelKey }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    pathname === href
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-muted hover:text-text hover:bg-border/50'
                  )}
                >
                  {t(labelKey)}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {profile && (
            <span className="text-sm text-text-muted hidden sm:block">
              {profile.full_name}
            </span>
          )}

          <LanguageSwitcher />

          <button
            onClick={handleLogout}
            title={t('nav.logout')}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
          >
            <LogOut size={16} strokeWidth={1.75} />
            <span className="hidden sm:inline">{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
