'use client'

import { signOut, useSession } from 'next-auth/react'
import AppShell from '@/components/AppShell'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function SettingsPage() {
  const { data: session } = useSession()

  return (
    <AppShell title="Settings" subtitle="Account, theme, and billing.">
      <div className="mx-auto grid w-full max-w-4xl gap-6 p-4 md:p-8">
        <section className="vzn-panel rounded-[1.5rem] p-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--purple)]">Account</div>
          <h2 className="mt-2 text-2xl font-bold">{session?.user?.name || 'Founder'}</h2>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>{session?.user?.email}</p>
          <button onClick={() => signOut({ callbackUrl: '/auth' })} className="vzn-button-ghost mt-5 rounded-lg border px-4 py-2 text-sm">
            Log out
          </button>
        </section>

        <section className="vzn-panel rounded-[1.5rem] p-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--purple)]">Theme</div>
          <div className="mt-4 flex items-center justify-between">
            <p style={{ color: 'var(--text-muted)' }}>Default is dark. VZN does not do cheerful.</p>
            <ThemeToggle />
          </div>
        </section>

        <section className="vzn-panel rounded-[1.5rem] p-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--purple)]">Billing</div>
          <h2 className="mt-2 text-2xl font-bold">Free tier</h2>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Stripe subscription hooks are ready for INR monthly plans.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {['Free - Rs 0/mo', 'Founders - Rs 999/mo', 'Team - Rs 2,499/mo'].map((tier) => (
              <button key={tier} className="vzn-button-ghost rounded-xl border p-4 text-left text-sm">
                {tier}
              </button>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
