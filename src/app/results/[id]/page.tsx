'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, Check, ChevronDown, ChevronRight, Loader2, Pencil, Share2 } from 'lucide-react'
import VZNAvatar from '@/components/ui/VZNAvatar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import MarketIntelligenceDisplay from '@/app/components/results/MarketIntelligenceDisplay'
import IdeaAlreadyExistsWarning from '@/app/components/results/IdeaAlreadyExistsWarning'
import type { MarketIntelligence } from '@/lib/types'
import AppShell from '@/components/AppShell'

const scoreLabels: Record<string, string> = {
  market: 'Market',
  moat: 'Moat',
  timing: 'Timing',
  founderFit: 'Founder Fit',
  monetisation: 'Monetisation',
  executionRisk: 'Execution Risk',
}

function StressTestOverlay({ startupId, onDone }: { startupId: string; onDone: () => void }) {
  const [hesitated, setHesitated] = useState(false)

  async function record(response: string) {
    await fetch(`/api/startups/${startupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stressTestResponse: response }),
    }).catch(() => {})
  }

  if (hesitated) {
    return (
      <motion.div className="fixed inset-0 z-50 grid place-items-center bg-[var(--bg-primary)]/95 px-6 text-center backdrop-blur-sm">
        <div className="max-w-[620px]">
          <VZNAvatar size="lg" mood="warning" className="mx-auto" />
          <p className="mt-8 text-2xl font-bold text-[var(--amber)]">That hesitation is your first data point. Most founders who click that button quit by month 4.</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]/95 px-6 text-center backdrop-blur-sm"
    >
      <div className="max-w-[680px]">
        <VZNAvatar size="lg" className="mx-auto" />
        <h2 className="mt-8 text-3xl font-bold md:text-[32px]">Before I show you the roadmap - are you actually ready to hear what&apos;s going to kill this?</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={async () => {
              await record('accepted')
              onDone()
            }}
            className="rounded-xl bg-[var(--purple)] px-6 py-3 font-semibold text-white"
          >
            Yes, show me everything.
          </button>
          <button
            onClick={async () => {
              await record('hesitated')
              setHesitated(true)
              window.setTimeout(onDone, 3000)
            }}
            className="rounded-xl border px-6 py-3 font-semibold"
            style={{ borderColor: 'var(--border)' }}
          >
            Maybe later.
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function Scorecard({ data }: { data: any }) {
  return (
    <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="vzn-panel-strong rounded-[1.5rem] p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--purple)]">Scorecard</div>
          <h2 className="mt-1 text-2xl font-bold">What VZN sees.</h2>
        </div>
        <VZNAvatar size="sm" />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {Object.entries(data || {}).map(([key, value]: any, index) => (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">{scoreLabels[key] || key}</span>
              <span className="text-sm font-bold">{value.score}/10</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Number(value.score || 0) * 10}%` }}
                transition={{ delay: index * 0.1 }}
                className="h-full rounded-full"
                style={{ background: key === 'executionRisk' ? 'var(--red)' : 'var(--purple)' }}
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{value.explanation}</p>
          </div>
        ))}
      </div>
    </motion.section>
  )
}

function FounderDNA({ startupId, startup }: { startupId: string; startup: any }) {
  const [dna, setDna] = useState<any>(startup.founderDNA || null)
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (dna) return
    fetch('/api/ai/founder-dna', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startupId,
        idea: startup.ideaText,
        targetCustomer: startup.targetCustomer,
        problem: startup.problem,
      }),
    })
      .then((res) => res.json())
      .then((data) => setDna(data))
      .catch(() => {})
  }, [dna, startup, startupId])

  async function share() {
    if (!ref.current || sharing) return
    setShareError(null)
    setSharing(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(ref.current, { width: 1080, height: 1080, backgroundColor: null })
      const link = document.createElement('a')
      link.download = 'veixon-founder-dna.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
      await navigator.clipboard?.writeText(`VZN classified my founder DNA as ${dna?.founderType}. VEIXON Co-founders, a product by @VEIXON Tech.`)
    } catch {
      setShareError('Could not generate the image. Try again.')
    } finally {
      setSharing(false)
    }
  }

  if (!dna) return <LoadingSpinner label="VZN is reading your founder DNA..." />

  return (
    <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="vzn-panel-strong rounded-[1.5rem] p-6">
      <div ref={ref} className="vzn-panel rounded-2xl p-6">
        <div className="mb-6 flex items-center gap-3">
          <VZNAvatar size="sm" />
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--purple)]">Founder DNA - Analysed by VZN</div>
            <h2 className="text-2xl font-bold">{dna.founderType}</h2>
          </div>
        </div>
        <div className="space-y-4">
          {Object.entries(dna.traits || {}).map(([key, value]: any) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                <span>{value}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: 'var(--border)' }}>
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${value}%` }} className="h-full rounded-full bg-[var(--purple)]" />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 font-medium">{dna.vznVerdict}</p>
        <p className="mt-2 text-sm text-[var(--amber)]">Warning: {dna.dangerLine}</p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={share} disabled={sharing} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-60" style={{ borderColor: 'var(--border)' }}>
          {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          {sharing ? 'Rendering image…' : 'Share your DNA'}
        </button>
        {shareError && <span className="text-xs font-medium text-[var(--red)]">{shareError}</span>}
      </div>
    </motion.section>
  )
}

function BrutalNumber({ probability, survivalEdge }: { probability: number; survivalEdge: string }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const pct = Math.min(1, (now - start) / 2000)
      setValue(Math.round(probability * pct))
      if (pct < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [probability])

  return (
    <section className="grid min-h-[80vh] place-items-center py-20 text-center">
      <div className="max-w-[760px]">
        <div className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Estimated risk · directional</div>
        <div className="mt-2 text-[72px] font-bold leading-none text-[var(--red)] md:text-[120px]">~{value}%</div>
        <p className="mt-5 text-2xl font-semibold">estimated failure risk for an idea at this stage if nothing changes.</p>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>A model estimate from the framework + your inputs — a prioritisation signal, not a measured statistic. Verify before quoting it anywhere.</p>
        <div className="mx-auto my-8 h-px max-w-[280px]" style={{ background: 'var(--border)' }} />
        <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>{survivalEdge}</p>
        <a href="#war-plan" className="mt-8 inline-flex rounded-xl bg-[var(--purple)] px-6 py-3 font-semibold text-white">
          Show me the war plan.
        </a>
      </div>
    </section>
  )
}

function WarPlan({ startupId, missions = [] }: { startupId: string; missions: any[] }) {
  const [open, setOpen] = useState(1)
  const [edit, setEdit] = useState(false)
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const total = missions.reduce((sum, mission) => sum + (mission.dailyTasks?.length || 0), 0)
  const done = Object.values(completed).filter(Boolean).length

  async function complete(taskId: string) {
    setCompleted((prev) => ({ ...prev, [taskId]: !prev[taskId] }))
    await fetch('/api/tasks/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startupId, taskId }),
    }).catch(() => {})
  }

  async function watchdog(taskId: string, original: string, edited: string) {
    if (!edit || edited === original) return
    const res = await fetch('/api/ai/task-watchdog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ original, edited }),
    }).catch(() => null)
    const data = res ? await res.json() : null
    if (data?.comment) setComments((prev) => ({ ...prev, [taskId]: data.comment }))
  }

  return (
    <section id="war-plan" className="vzn-panel-strong scroll-mt-24 rounded-[1.5rem] p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--purple)]">90-Day War Plan</div>
          <h2 className="text-2xl font-bold">13 missions. No vague work.</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Day streak: {done} · Completion: {total ? Math.round((done / total) * 100) : 0}%</p>
        </div>
        <button onClick={() => setEdit((value) => !value)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }}>
          <Pencil className="h-4 w-4" /> {edit ? 'Lock tasks' : 'Edit mode'}
        </button>
      </div>

      <div className="space-y-3">
        {missions.map((mission) => (
          <div key={mission.week} className="rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => setOpen(open === mission.week ? 0 : mission.week)} className="flex w-full items-center justify-between gap-4 p-4 text-left">
              <div>
                <div className="font-mono text-xs text-[var(--amber)]">{mission.missionCode}</div>
                <div className="font-bold">{mission.missionName}</div>
                <div className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{mission.primaryObjective}</div>
              </div>
              {open === mission.week ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
            {open === mission.week && (
              <div className="border-t p-4" style={{ borderColor: 'var(--border)' }}>
                <div className="space-y-3">
                  {mission.dailyTasks?.map((task: any) => {
                    const taskId = `${mission.week}-${task.day}`
                    return (
                      <div key={taskId}>
                        <div className="flex items-start gap-3">
                          <button onClick={() => complete(taskId)} className="mt-0.5 grid h-5 w-5 place-items-center rounded border border-[var(--purple)] text-[var(--purple)]">
                            {completed[taskId] && <Check className="h-3 w-3" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p
                              contentEditable={edit}
                              suppressContentEditableWarning
                              onBlur={(event) => watchdog(taskId, task.task, event.currentTarget.innerText)}
                              className={completed[taskId] ? 'text-sm line-through decoration-[var(--purple)] opacity-60' : 'text-sm'}
                            >
                              {task.task}
                            </p>
                            <span className="mt-1 inline-block rounded-full border px-2 py-0.5 text-[11px]" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>{task.category}</span>
                            {comments[taskId] && <p className="mt-2 text-xs text-[var(--amber)]">{comments[taskId]}</p>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 rounded-lg border p-3 text-sm text-[var(--amber)]" style={{ borderColor: 'var(--amber)' }}>
                  Failure signal: {mission.failureSignal}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Link href="/oath" className="mt-6 inline-flex rounded-xl bg-[var(--purple)] px-6 py-3 font-semibold text-white">
        Ready to commit.
      </Link>
    </section>
  )
}

export default function ResultsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [startup, setStartup] = useState<any>(null)
  const [marketIntelligence, setMarketIntelligence] = useState<MarketIntelligence | null>(null)
  const [error, setError] = useState('')
  const [stressDone, setStressDone] = useState(false)
  const [showIdeasExistsWarning, setShowIdeaExistsWarning] = useState(false)
  const [marketIntelligenceLoaded, setMarketIntelligenceLoaded] = useState(false)

  const id = useMemo(() => {
    if (params.id !== 'latest') return params.id
    if (typeof window === 'undefined') return params.id
    return window.localStorage.getItem('visionix_active_startup_id') || params.id
  }, [params.id])

  useEffect(() => {
    if (id === 'latest') {
      router.replace('/dashboard')
      return
    }
    fetch(`/api/startups/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else {
          setStartup(data)
          setStressDone(!!data.stressTestResponse)
          
          // Fetch market intelligence if not already done
          if (!data.marketIntelligence) {
            fetch('/api/ai/market-intelligence', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                idea: data.ideaText,
                targetCustomer: data.targetCustomer,
                problem: data.problem,
              }),
            })
              .then((res) => res.json())
              .then((mi) => {
                setMarketIntelligence(mi)
                
                // Check if should show idea already exists warning
                if (mi.ideaOriginality?.score <= 2 && mi.graveyardWarning?.hasDeadStartups && mi.directCompetitors?.some((c: any) => c.status === 'active')) {
                  setShowIdeaExistsWarning(true)
                }
                
                // Save to startup
                fetch(`/api/startups/${data.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ marketIntelligence: mi }),
                }).catch(() => {})
              })
              .catch((err) => console.error('Market intelligence error:', err))
              .finally(() => setMarketIntelligenceLoaded(true))
          } else {
            setMarketIntelligence(data.marketIntelligence)
            setMarketIntelligenceLoaded(true)
          }
        }
      })
      .catch(() => setError('VZN is thinking... try again.'))
  }, [id, router])

  if (error) {
    return (
      <AppShell title="AI Co-Founder Report" subtitle="Startup analysis">
        <div className="vzn-page-pad grid min-h-[calc(100vh-120px)] place-items-center text-center">
        <div className="vzn-panel rounded-[1.5rem] p-8">
          <VZNAvatar size="lg" className="mx-auto mb-6" />
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
        </div>
      </AppShell>
    )
  }

  if (!startup) {
    return (
      <AppShell title="AI Co-Founder Report" subtitle="Startup analysis">
        <div className="vzn-page-pad grid min-h-[calc(100vh-120px)] place-items-center">
          <LoadingSpinner label="VZN is thinking... try again if this stalls." />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="AI Co-Founder Report"
      subtitle="Scorecard, market intelligence, founder DNA, and war plan."
      actions={<Link href="/dashboard" className="vzn-button-ghost rounded-xl border px-4 py-2 text-sm font-semibold">Dashboard</Link>}
    >
      {!stressDone && <StressTestOverlay startupId={startup.id} onDone={() => setStressDone(true)} />}
      {showIdeasExistsWarning && marketIntelligence && (
        <IdeaAlreadyExistsWarning
          startupId={startup.id}
          topCompetitorName={marketIntelligence.directCompetitors?.[0]?.name || 'competitors'}
          onContinue={() => setShowIdeaExistsWarning(false)}
        />
      )}
      <div className="vzn-page-pad">
      <div className="vzn-page-center space-y-8">
        <section className="vzn-panel-strong rounded-[1.5rem] p-6 md:p-8">
          <div className="vzn-section-label">Your AI co-founder report</div>
          <h1 className="mt-2 text-3xl font-bold md:text-5xl">{startup.ideaText}</h1>
          <p className="mt-4 text-lg" style={{ color: 'var(--text-muted)' }}>{startup.targetCustomer} · {startup.problem}</p>
        </section>
        <Scorecard data={startup.scorecardJson} />
        {marketIntelligenceLoaded && marketIntelligence && (
          <MarketIntelligenceDisplay data={marketIntelligence} />
        )}
        <section className="vzn-panel rounded-[1.5rem] p-6">
          <div className="mb-4 flex items-center gap-3 text-[var(--amber)]">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-widest">Devil&apos;s Advocate</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(startup.devilsAdvocateJson || []).map((item: any) => (
              <div key={item.title} className="rounded-xl border p-4" style={{ borderColor: 'var(--amber)', background: 'color-mix(in srgb, var(--amber) 8%, transparent)' }}>
                <div className="text-sm font-bold">{item.title}</div>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.explanation}</p>
              </div>
            ))}
          </div>
        </section>
        <FounderDNA startupId={startup.id} startup={startup} />
        <BrutalNumber probability={startup.failureProbability || 72} survivalEdge={startup.survivalEdge || ''} />
        <WarPlan startupId={startup.id} missions={startup.warPlanJson || []} />
      </div>
      </div>
    </AppShell>
  )
}
