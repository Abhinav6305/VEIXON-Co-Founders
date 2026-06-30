'use client'

import { FormEvent, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowRight } from 'lucide-react'
import VZNAvatar from '@/components/ui/VZNAvatar'
import AppShell from '@/components/AppShell'

export default function IntakePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [idea, setIdea] = useState('')
  const [targetCustomer, setTargetCustomer] = useState('')
  const [problem, setProblem] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth')
  }, [router, status])

  // Carry the idea the visitor typed on the landing page (pre-auth) into the form.
  useEffect(() => {
    const pending = window.localStorage.getItem('veixon_pending_idea')
    if (pending) {
      setIdea(pending)
      window.localStorage.removeItem('veixon_pending_idea')
    }
  }, [])

  useEffect(() => {
    if (!loading) return
    const started = Date.now()
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - started
      setProgress(Math.min(96, (elapsed / 35000) * 100))
    }, 180)
    return () => window.clearInterval(timer)
  }, [loading])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!idea.trim() || !targetCustomer.trim() || !problem.trim()) {
      setError('VZN needs all three answers.')
      return
    }
    setLoading(true)
    const user = session?.user as any
    try {
      const response = await fetch('/api/ai/ideation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          targetCustomer,
          problem,
          userId: user?.id || user?.email || 'anonymous',
          email: user?.email,
          name: user?.name,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.id) throw new Error(data.error || 'VZN is thinking... try again.')
      window.localStorage.setItem('visionix_active_startup_id', data.id)
      setProgress(100)
      router.push(`/results/${data.id}`)
    } catch (err: any) {
      setError(err.message || 'VZN is thinking... try again.')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppShell title="Idea Intake" subtitle="Scorecard, Founder DNA, failure probability, war plan.">
        <div className="vzn-page-pad grid min-h-[calc(100vh-120px)] place-items-center text-center">
          <div className="vzn-panel-strong w-full max-w-[560px] rounded-[1.5rem] p-8 md:p-10">
          <VZNAvatar size="lg" className="mx-auto" />
          <h1 className="mt-8 text-2xl font-bold">VZN is analysing your idea...</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>This usually takes a moment while the backend assembles the full founder report.</p>
            <div className="mt-8 h-2 overflow-hidden rounded-full border" style={{ background: 'var(--border)', borderColor: 'var(--border)' }}>
            <motion.div className="h-full bg-[var(--purple)]" style={{ width: `${progress}%` }} />
          </div>
            <div className="mt-4 grid gap-2 text-left">
              <div className="veixon-skeleton h-3 w-4/5" />
              <div className="veixon-skeleton h-3 w-3/5" />
              <div className="veixon-skeleton h-3 w-2/3" />
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Idea Intake" subtitle="Three precise answers. Then VZN runs the analysis.">
      <div className="vzn-page-pad flex min-h-[calc(100vh-120px)] items-center justify-center">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
          className="vzn-panel-strong vzn-stagger w-full max-w-[680px] rounded-[1.5rem] p-6 md:p-10"
      >
        <VZNAvatar size="md" className="mb-6" />
          <div className="vzn-section-label">Idea Diagnostic</div>
          <h1 className="mt-2 text-3xl font-bold">Let&apos;s analyse your idea.</h1>
        <p className="mt-2" style={{ color: 'var(--text-muted)' }}>Answer three questions. VZN will do the rest.</p>

        <div className="mt-8 space-y-6">
            <label className="block" style={{ ['--i' as any]: 1 }}>
            <span className="text-sm font-semibold">What are you building?</span>
            <textarea
              value={idea}
              onChange={(event) => setIdea(event.target.value.slice(0, 500))}
              placeholder="A subscription app for freelance designers in India to..."
              rows={5}
              maxLength={500}
                className="focus-ring vzn-input mt-2 resize-none rounded-xl px-4 py-3 text-sm"
            />
            <span className="mt-1 block text-right text-xs" style={{ color: 'var(--text-muted)' }}>{idea.length}/500</span>
          </label>

            <label className="block" style={{ ['--i' as any]: 2 }}>
            <span className="text-sm font-semibold">Who exactly will use or pay for this?</span>
            <input
              value={targetCustomer}
              onChange={(event) => setTargetCustomer(event.target.value)}
              placeholder="Freelance graphic designers aged 22-32 in Indian metros..."
                className="focus-ring vzn-input mt-2 rounded-xl px-4 py-3 text-sm"
            />
          </label>

            <label className="block" style={{ ['--i' as any]: 3 }}>
            <span className="text-sm font-semibold">What painful problem are you solving?</span>
            <input
              value={problem}
              onChange={(event) => setProblem(event.target.value)}
              placeholder="Freelancers lose 20-30% of income to late payments..."
                className="focus-ring vzn-input mt-2 rounded-xl px-4 py-3 text-sm"
            />
          </label>
        </div>

        {error && <p className="mt-5 rounded-lg border p-3 text-sm text-[var(--amber)]" style={{ borderColor: 'var(--amber)' }}>{error}</p>}

          <button type="submit" className="vzn-button-primary mt-7 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-semibold">
          Analyse my idea <ArrowRight className="h-4 w-4" />
        </button>
      </motion.form>
      </div>
    </AppShell>
  )
}
