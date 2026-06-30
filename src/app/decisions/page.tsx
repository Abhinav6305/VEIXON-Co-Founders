'use client'

import { FormEvent, useState } from 'react'
import { useSession } from 'next-auth/react'
import AppShell from '@/components/AppShell'
import VZNAvatar from '@/components/ui/VZNAvatar'

const types = ['pricing', 'hiring', 'pivot', 'fundraising', 'product', 'go-to-market']

export default function DecisionsPage() {
  const { data: session } = useSession()
  const [description, setDescription] = useState('')
  const [decisionType, setDecisionType] = useState(types[0])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const user = session?.user as any

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!description.trim()) return
    setLoading(true)
    const response = await fetch('/api/ai/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        decisionType,
        startupId: window.localStorage.getItem('visionix_active_startup_id'),
        userId: user?.id || user?.email || 'anonymous',
        email: user?.email,
        name: user?.name,
      }),
    })
    setResult(await response.json())
    setLoading(false)
  }

  return (
    <AppShell title="Decision Simulator" subtitle="Best case. Worst case. Most likely. Then the call.">
      <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 md:grid-cols-[420px_1fr] md:p-8">
        <form onSubmit={submit} className="vzn-panel-strong rounded-[1.5rem] p-6">
          <VZNAvatar size="md" />
          <h2 className="mt-5 text-2xl font-bold">What decision are you avoiding?</h2>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={6}
            placeholder="Should we pivot from SMBs to enterprise buyers?"
            className="focus-ring vzn-input mt-5 resize-none rounded-xl p-4 text-sm"
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {types.map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => setDecisionType(type)}
                className="vzn-button-ghost veixon-press rounded-lg border px-3 py-2 text-sm capitalize transition-colors"
                style={{
                  borderColor: decisionType === type ? 'var(--purple)' : 'var(--border)',
                  color: decisionType === type ? 'var(--purple)' : 'var(--text-muted)',
                }}
              >
                {type}
              </button>
            ))}
          </div>
          <button disabled={loading} className="vzn-button-primary mt-5 w-full rounded-xl px-5 py-3 font-semibold disabled:opacity-60">
            {loading ? 'VZN is simulating...' : 'Simulate decision'}
          </button>
        </form>

        <section className="vzn-panel rounded-[1.5rem] p-6">
          {!result ? (
            <div className="grid h-full min-h-[420px] place-items-center text-center" style={{ color: 'var(--text-muted)' }}>
              <div>
                <VZNAvatar size="lg" className="mx-auto mb-5" />
                The answer will not be gentle.
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--purple)]">Recommendation</div>
              <h2 className="mt-2 text-2xl font-bold">{result.recommendation}</h2>
              <p className="mt-3" style={{ color: 'var(--text-muted)' }}>{result.reasoning}</p>
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {[
                  ['Best Case', result.bestCase],
                  ['Most Likely', result.mostLikely],
                  ['Worst Case', result.worstCase],
                ].map(([label, scenario]: any, idx: number) => (
                  <div key={label} className="vzn-panel veixon-lift veixon-rise rounded-xl p-4" style={{ ['--d' as any]: `${idx * 0.07}s` }}>
                    <h3 className="font-bold">{label}</h3>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>{scenario?.summary}</p>
                    <div className="mt-4 space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <p><strong>Day 30:</strong> {scenario?.day30}</p>
                      <p><strong>Day 90:</strong> {scenario?.day90}</p>
                      <p><strong>Day 180:</strong> {scenario?.day180}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl border p-4 text-[var(--amber)]" style={{ borderColor: 'var(--amber)' }}>
                {result.vzn_voice}
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
