'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowRight, AlertTriangle } from 'lucide-react'

type Teaser = {
  failureProbability: number
  composite: number
  scores: { label: string; score: number }[]
  devil: { title: string; explanation: string; severity: string }
  tenMillion: boolean
  killCriteria: string
  vzn: string
  source?: 'ai' | 'fallback'
}

const STEPS = [
  'Reading your idea…',
  'Running a 5-Why on the problem…',
  'Sizing the market — TAM / SAM / SOM…',
  'Hunting for a real moat…',
  'Stress-testing the $10M scalability test…',
  'Checking the competitive graveyard…',
  'Writing the brutal verdict…',
]
const MIN_LOADING_MS = 5000

function CountUp({ to, duration = 1400 }: { to: number; duration?: number }) {
  const [v, setV] = useState(0)
  const raf = useRef<number>()
  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setV(Math.round((1 - Math.pow(1 - t, 3)) * to))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [to, duration])
  return <>{v}</>
}

export default function IdeaConsole() {
  const router = useRouter()
  const [idea, setIdea] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [teaser, setTeaser] = useState<Teaser | null>(null)
  const [error, setError] = useState('')

  // cycle the analysis steps while loading
  useEffect(() => {
    if (!loading) return
    setStep(0)
    const iv = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 850)
    return () => clearInterval(iv)
  }, [loading])

  async function analyse() {
    const text = idea.trim()
    if (text.length < 6) { setError('Describe your idea in a few words.'); return }
    setError(''); setTeaser(null); setLoading(true)
    const started = Date.now()
    try {
      const r = await fetch('/api/ai/teaser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: text }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Try again.')
      // hold the loader a minimum of 5s so the analysis feels real and lands with weight
      const elapsed = Date.now() - started
      if (elapsed < MIN_LOADING_MS) await new Promise((res) => setTimeout(res, MIN_LOADING_MS - elapsed))
      setTeaser(data)
    } catch (e: any) {
      setError(e.message || 'Try again.')
    } finally {
      setLoading(false)
    }
  }

  function unlock() {
    if (typeof window !== 'undefined') window.localStorage.setItem('veixon_pending_idea', idea.trim())
    router.push('/auth')
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-[640px]">
      {/* input console */}
      <div
        className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-3 backdrop-blur-xl sm:flex-row sm:items-center"
        style={{ boxShadow: '0 20px 60px -30px var(--card-glow)' }}
      >
        <input
          value={idea}
          onChange={(e) => setIdea(e.target.value.slice(0, 200))}
          onKeyDown={(e) => e.key === 'Enter' && !loading && analyse()}
          placeholder="Describe your startup in one line…"
          disabled={loading}
          className="w-full flex-1 bg-transparent px-3 py-2.5 text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:opacity-60"
        />
        <button
          onClick={analyse}
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-5 py-2.5 text-sm font-bold text-[var(--bg-primary)] transition-transform active:scale-95 disabled:opacity-60"
        >
          {loading ? 'Analysing…' : <>Get my brutal analysis <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-[var(--red)]">{error}</p>}
      {!teaser && !loading && (
        <p className="mt-3 text-[13px] text-[var(--text-muted)]">Real AI analysis, free, no signup. VZN doesn&apos;t sugarcoat.</p>
      )}

      <AnimatePresence mode="wait">
        {/* loading sequence */}
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-9 text-center backdrop-blur-xl"
          >
            <div className="relative mx-auto h-20 w-20">
              <span className="absolute inset-0 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--text-primary)]" />
              <span className="absolute inset-2 animate-spin rounded-full border-2 border-[var(--border)] border-b-[var(--text-primary)] [animation-direction:reverse] [animation-duration:1.4s]" />
              <span className="absolute inset-0 m-auto h-3.5 w-3.5 animate-pulse rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, #fff, #7a5cff)' }} />
            </div>
            <div className="mt-6 text-sm font-bold text-[var(--text-primary)]">VZN is running the brutal analysis…</div>
            <div className="mt-1.5 h-5 text-[13px] text-[var(--text-muted)]">
              <AnimatePresence mode="wait">
                <motion.span key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="inline-block">
                  {STEPS[step]}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="mt-5 h-1 overflow-hidden rounded-full bg-[var(--border)]">
              <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: MIN_LOADING_MS / 1000, ease: 'easeInOut' }} className="h-full rounded-full bg-[var(--text-primary)]" />
            </div>
          </motion.div>
        )}

        {/* result */}
        {teaser && !loading && (
          <motion.div
            key="teaser"
            initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 text-left backdrop-blur-xl"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
                  The brutal number
                  <span className="ml-1 rounded border border-[var(--text-muted)] px-1.5 py-0.5 text-[9px] text-[var(--text-muted)]">EST.</span>
                  {teaser.source === 'ai' && <span className="ml-1 rounded bg-[var(--text-primary)] px-1.5 py-0.5 text-[9px] text-[var(--bg-primary)]">LIVE AI</span>}
                </div>
                <div className="mt-1 text-[56px] font-extrabold leading-none text-[var(--red)]">
                  ~<CountUp to={teaser.failureProbability} />%
                </div>
                <div className="text-[13px] text-[var(--text-muted)]">estimated risk if nothing changes — a directional signal, not a measured stat</div>
              </div>
              <div className="text-right">
                <div className="text-[32px] font-bold text-[var(--text-primary)]">{teaser.composite}<span className="text-base text-[var(--text-muted)]">/10</span></div>
                <div className="text-[12px] text-[var(--text-muted)]">composite</div>
                <div className={`mt-2 inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold ${teaser.tenMillion ? 'border-[var(--text-primary)] text-[var(--text-primary)]' : 'border-[var(--red)] text-[var(--red)]'}`}>
                  $10M test: {teaser.tenMillion ? 'plausible' : 'at risk'}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {teaser.scores.map((s, i) => (
                <div key={s.label} className="grid grid-cols-[1fr_auto] items-center gap-2">
                  <div>
                    <div className="text-[12px] text-[var(--text-muted)]">{s.label}</div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: 'color-mix(in srgb, var(--text-primary) 12%, transparent)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.score * 10}%` }}
                        transition={{ duration: 0.9, delay: 0.25 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ background: s.score >= 7 ? 'var(--text-primary)' : s.score >= 5 ? 'var(--text-muted)' : 'var(--red)' }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{s.score}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-xl border border-[var(--border)] p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--red)]" />
              <p className="text-sm text-[var(--text-primary)]">
                <span className="font-semibold">{teaser.devil.title}.</span>{' '}
                <span className="text-[var(--text-muted)]">{teaser.devil.explanation}</span>
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="max-w-[300px] text-[13px] text-[var(--text-muted)]">
                This is the teaser. The full 6-dimension scorecard, Lean Canvas, and 90-day war plan unlock when you sign up.
              </p>
              <button
                onClick={unlock}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] px-6 py-3 text-sm font-bold text-[var(--bg-primary)] transition-transform active:scale-95 hover:opacity-90"
              >
                Unlock my full war plan →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
