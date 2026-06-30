'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  CheckSquare,
  LayoutDashboard,
  Lightbulb,
  Lock,
  LogOut,
  Map,
  Radar,
  Settings,
  Share2,
  Zap,
} from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

const groups: { label: string; items: { href: string; label: string; icon: any }[] }[] = [
  {
    label: 'Command',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/intake', label: 'My Idea', icon: Lightbulb },
      { href: '/results/latest#war-plan', label: 'War Plan', icon: Map },
    ],
  },
  {
    label: 'Execute',
    items: [
      { href: '/decisions', label: 'Decisions', icon: Zap },
      { href: '/dashboard#pivot', label: 'Pivot Radar', icon: Radar },
      { href: '/dashboard#checkins', label: 'Check-ins', icon: CheckSquare },
    ],
  },
  {
    label: 'Growth',
    items: [
      { href: '/vault', label: 'VC Vault', icon: Lock },
      { href: '/dashboard#share', label: 'Share', icon: Share2 },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export default function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const email = session?.user?.email || 'founder@visionix.ai'
  const name = session?.user?.name || 'Founder'

  return (
    <>
      {open && (
        <button
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[244px] flex-col border-r transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'color-mix(in srgb, var(--bg-tertiary) 86%, transparent)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderColor: 'var(--border)' }}
      >
        {/* brand lockup */}
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 px-5 py-5">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] text-sm font-black text-white"
            style={{ background: 'linear-gradient(135deg, var(--purple), color-mix(in srgb, var(--teal) 70%, var(--purple)))', boxShadow: '0 6px 22px -8px var(--purple)' }}
          >
            V
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-extrabold tracking-[0.12em]">VEIXON</span>
            <span className="block font-mono text-[9px] uppercase tracking-[0.24em]" style={{ color: 'var(--text-dim)' }}>Co-Founder OS</span>
          </span>
        </Link>

        {/* grouped nav */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--text-dim)' }}>
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href.split('#')[0].split('?')[0]
                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={onClose}
                      className="group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all"
                      style={{
                        background: active ? 'color-mix(in srgb, var(--purple) 16%, transparent)' : 'transparent',
                        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                        boxShadow: active ? 'inset 0 0 0 1px color-mix(in srgb, var(--purple) 38%, transparent)' : 'none',
                      }}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full" style={{ background: 'var(--purple)', boxShadow: '0 0 10px var(--purple)' }} />
                      )}
                      <Icon className="h-[18px] w-[18px] shrink-0 transition-colors" style={{ color: active ? 'var(--purple)' : 'currentColor' }} />
                      <span>{label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* status footer */}
        <div className="m-3 rounded-2xl border p-3" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--card-bg) 70%, transparent)' }}>
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--purple), var(--purple-dim))' }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{name}</div>
              <div className="truncate font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>{email}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/auth' })}
              className="veixon-press grid h-8 w-8 place-items-center rounded-lg border transition-colors hover:text-[var(--red)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
