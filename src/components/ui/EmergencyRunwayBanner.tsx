'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import VZNAvatar from './VZNAvatar'

// Module-level cache so route changes don't refetch the dashboard on every
// navigation. Keyed by user; refreshed at most once per TTL.
let cache: { userId: string; days: number | null; at: number } | null = null
const TTL = 5 * 60 * 1000 // 5 minutes

function runwayFromStartup(startup: any): number | null {
  if (!startup) return null
  const burn = Number(startup.burnRate || 0)
  const revenue = Number(startup.monthlyRevenue || 0)
  const cash = Number(startup.cashInBank || 0)
  const netBurn = Math.max(burn - revenue, 0)
  const runway = netBurn > 0 ? Math.floor((cash / netBurn) * 30) : null
  return runway && runway < 30 ? runway : null
}

export default function EmergencyRunwayBanner() {
  const { data: session } = useSession()
  const [days, setDays] = useState<number | null>(cache?.days ?? null)

  const userId = (session?.user as any)?.id || session?.user?.email || ''

  useEffect(() => {
    if (!userId) return

    // Serve from cache while it is fresh — avoids a fetch on every route change.
    if (cache && cache.userId === userId && Date.now() - cache.at < TTL) {
      setDays(cache.days)
      return
    }

    let active = true
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        const runway = runwayFromStartup(data?.startup)
        cache = { userId, days: runway, at: Date.now() }
        if (active) setDays(runway)
      })
      .catch(() => {
        if (active) setDays(null)
      })
    return () => {
      active = false
    }
  }, [userId])

  if (!days) return null

  return (
    <div
      className="fixed inset-x-0 top-0 z-[70] flex min-h-12 items-center justify-center gap-3 border-b px-4 py-2 text-sm"
      style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--amber)', color: 'var(--amber)' }}
    >
      <VZNAvatar size="sm" mood="warning" />
      <span>You have {days} days of runway. Emergency protocol active.</span>
      <Link href="/vault" className="rounded-lg bg-[var(--purple)] px-3 py-1.5 text-xs font-semibold text-white">
        Get VC contacts now
      </Link>
    </div>
  )
}
