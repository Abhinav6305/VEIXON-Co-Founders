'use client'

import { ReactNode, useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import Sidebar from '@/components/dashboard/Sidebar'
import AmbientBackdrop from '@/components/dashboard/AmbientBackdrop'
import PageReveal from '@/components/dashboard/PageReveal'

export default function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode
  title?: string
  subtitle?: string
  actions?: ReactNode
}) {
  const [navOpen, setNavOpen] = useState(false)
  const hasHeader = title || subtitle || actions

  return (
    <div className="vzn-app-shell relative min-h-screen text-[var(--text-primary)]">
      <AmbientBackdrop />
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <main className="relative z-10 min-h-screen pl-0 lg:pl-[244px]">
        {hasHeader ? (
          <header
            className="vzn-shell-header sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-3 border-b px-4 py-3 md:px-8"
          >
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setNavOpen(true)}
                aria-label="Open menu"
                className="veixon-press vzn-icon-button grid h-10 w-10 shrink-0 place-items-center rounded-xl border lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <span className="vzn-header-accent hidden h-10 w-[3px] shrink-0 rounded-full sm:block" />
              <div className="min-w-0">
                {title && <h1 className="truncate text-lg font-bold tracking-tight md:text-2xl">{title}</h1>}
                {subtitle && (
                  <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.16em] md:text-xs" style={{ color: 'var(--text-dim)' }}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <button
                className="veixon-press vzn-icon-button relative hidden h-10 w-10 place-items-center rounded-xl border md:grid"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="veixon-pulse absolute right-2 top-2 h-1.5 w-1.5 rounded-full" style={{ background: 'var(--teal)' }} />
              </button>
            </div>
          </header>
        ) : (
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            className="veixon-press vzn-icon-button fixed left-3 top-3 z-30 grid h-10 w-10 place-items-center rounded-xl border backdrop-blur-xl lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <PageReveal>{children}</PageReveal>
      </main>
    </div>
  )
}

export { AppShell }
