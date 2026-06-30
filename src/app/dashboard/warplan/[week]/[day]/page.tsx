'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, CheckCircle2, Flag, Swords, Target } from 'lucide-react'
import VZNAvatar from '@/components/ui/VZNAvatar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import AppShell from '@/components/AppShell'
import { getDay } from '@/lib/constants/ninetyDayPlan'
import ShareCard from '@/components/dashboard/ShareCard'

interface DayPageProps {
  params: {
    week: string
    day: string
  }
}

const MIN_PREP = 8
const MIN_DEBRIEF = 12

const PHASE_LABEL: Record<string, string> = {
  VALIDATE: 'Phase 1 | Validate',
  BUILD: 'Phase 2 | Build',
  PROVE: 'Phase 3 | Prove',
}

export default function DayPage({ params }: DayPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const week = parseInt(params.week)
  const day = parseInt(params.day)
  const seed = getDay(week, day)

  const [startup, setStartup] = useState<any>(null)
  const [override, setOverride] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'brief' | 'prep' | 'execution' | 'debrief' | 'complete'>('brief')

  const [prepAnswers, setPrepAnswers] = useState(['', '', ''])
  const [executionCount, setExecutionCount] = useState(0)
  const [taskDone, setTaskDone] = useState(false)
  const [debrief, setDebrief] = useState({
    whatHappened: '',
    theSignal: '',
    whatItMeans: '',
    whatChanges: '',
    tomorrowEdge: '',
  })
  const [debriefLoading, setDebriefLoading] = useState(false)
  const [debriefMode, setDebriefMode] = useState<'quick' | 'full'>('quick')
  const [oneLine, setOneLine] = useState('')
  const [completionProgress, setCompletionProgress] = useState<any>(null)

  const user = session?.user as any
  const userId = user?.id || user?.email

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth')
      return
    }
    if (!session || !userId) return

    const startupId = window.localStorage.getItem('visionix_active_startup_id')
    if (!startupId) {
      router.push('/dashboard')
      return
    }

    fetch(`/api/startups/${startupId}`)
      .then((res) => res.json())
      .then((data) => {
        setStartup(data)
        const warMission = data.warPlanJson?.find((m: any) => m.week === week)
        const task = warMission?.dailyTasks?.find((t: any) => t.day === day)
        if (task) setOverride(task)
      })
      .catch((err) => console.error('Error fetching startup:', err))
      .finally(() => setLoading(false))
  }, [session, status, userId, week, day, router])

  const prepComplete = prepAnswers.every((a) => a.trim().length >= MIN_PREP)
  const executionComplete =
    seed?.task.mode === 'count'
      ? seed.task.target
        ? executionCount >= seed.task.target
        : executionCount > 0
      : taskDone
  const debriefComplete =
    debriefMode === 'quick'
      ? oneLine.trim().length >= 15
      : Object.values(debrief).every((v) => v.trim().length >= MIN_DEBRIEF)

  function expandOneLine(text: string) {
    const parts = text.split(/[.;\n]/).map((x) => x.trim()).filter(Boolean)
    const pick = (i: number) => parts[i] || parts[parts.length - 1] || text.trim()
    return {
      whatHappened: pick(0),
      theSignal: pick(1),
      whatItMeans: pick(2),
      whatChanges: pick(3),
      tomorrowEdge: pick(4),
    }
  }

  const effectiveDebrief = debriefMode === 'quick' ? expandOneLine(oneLine) : debrief

  const handleDebriefSubmit = async () => {
    if (!debriefComplete || !seed || !startup?.id) return
    setDebriefLoading(true)
    try {
      const response = await fetch('/api/ai/debrief-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...effectiveDebrief,
          week,
          day,
          missionCode: seed.missionCode,
          debriefFocus: seed.debriefFocus,
          marketIntelligence: startup?.marketIntelligence,
        }),
      })
      const analysis = await response.json().catch(() => ({}))

      const completionResponse = await fetch('/api/day/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: startup.id,
          week,
          day,
          taskLabel,
          prepAnswers,
          executionCount,
          debrief: effectiveDebrief,
          ...analysis,
        }),
      })
      const completion = await completionResponse.json().catch(() => ({}))
      if (!completionResponse.ok) throw new Error(completion?.error || 'Failed to complete day')
      setCompletionProgress(completion)
      setStartup((prev: any) => ({
        ...prev,
        completedTasks: completion.completedTasks || prev?.completedTasks || [],
        taskCompletionRate: completion.taskCompletionRate ?? prev?.taskCompletionRate,
        accountabilityScore: completion.accountabilityScore ?? prev?.accountabilityScore,
      }))

      setStep('complete')
    } catch (error) {
      console.error('Error submitting debrief:', error)
    } finally {
      setDebriefLoading(false)
    }
  }

  if (loading) {
    return (
      <AppShell title="Daily Mission" subtitle={`Week ${week} | Day ${day}`}>
        <div className="vzn-page-pad grid min-h-[calc(100vh-120px)] place-items-center">
          <LoadingSpinner label="Loading mission..." />
        </div>
      </AppShell>
    )
  }

  if (!seed) {
    return (
      <AppShell title="Daily Mission" subtitle={`Week ${week} | Day ${day}`}>
        <div className="vzn-page-pad grid min-h-[calc(100vh-120px)] place-items-center">
          <div className="vzn-panel rounded-[1.5rem] p-8 text-center">
            <VZNAvatar size="lg" className="mx-auto" />
            <p className="mt-4 text-[var(--text-muted)]">No mission exists for Week {week}, Day {day}.</p>
            <button onClick={() => router.push('/dashboard/warplan')} className="vzn-button-primary mt-6 rounded-xl px-4 py-2 font-semibold">
              Back to war plan
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  const taskLabel = override?.task || seed.task.label
  const brief = override?.brief || seed.brief
  const phaseLabel = PHASE_LABEL[seed.phase] || seed.phase

  return (
    <AppShell
      title={seed.theme}
      subtitle={`${phaseLabel} | Week ${week} | Day ${day}/7 | ${seed.missionCode}`}
      actions={
        <div className="hidden items-center gap-2 md:flex">
          <span className="vzn-status-pill">Streak {startup?.streakCount || 0}</span>
          <button onClick={() => router.back()} className="vzn-button-ghost rounded-xl border px-4 py-2 text-sm font-semibold">
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      }
    >
      <div className="vzn-page-pad">
        <div className="vzn-page-center max-w-5xl space-y-6">
          <div className="vzn-panel rounded-[1.5rem] p-4 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <button onClick={() => router.back()} className="vzn-button-ghost inline-flex w-fit rounded-xl border p-3 md:hidden" aria-label="Back">
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="vzn-section-label">{seed.rhythmRole}</div>
                <h1 className="mt-1 text-2xl font-bold md:text-3xl">{taskLabel}</h1>
              </div>
              <span className="vzn-status-pill">{startup?.streakCount || 0} day streak</span>
            </div>
          </div>

          <div className="vzn-panel rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
              <span className={prepComplete ? 'text-[var(--teal)]' : ''}>1 prep</span>
              <span>/</span>
              <span className={executionComplete ? 'text-[var(--teal)]' : ''}>2 execution</span>
              <span>/</span>
              <span className={debriefComplete ? 'text-[var(--teal)]' : ''}>3 debrief</span>
              <span className="ml-auto uppercase">{seed.rhythmRole}</span>
            </div>
          </div>

          {step === 'brief' && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <section className="vzn-panel-strong rounded-[1.5rem] p-6">
                <div className="mb-5 flex items-start gap-3">
                  <VZNAvatar size="sm" />
                  <p className="text-sm leading-relaxed text-[var(--text-muted)]">{brief}</p>
                </div>
                <h2 className="mb-4 text-2xl font-bold">{taskLabel}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--teal)] bg-[var(--teal)]/10 p-4">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-[var(--teal)]"><Target size={14} /> Success Looks Like</div>
                    <p className="text-sm">{seed.successCriteria}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--amber)] bg-[var(--amber)]/10 p-4">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-[var(--amber)]"><Flag size={14} /> Failure Signal</div>
                    <p className="text-sm">{seed.failureSignal}</p>
                  </div>
                </div>
              </section>

              {seed.competitiveContext && (
                <section className="vzn-panel rounded-2xl p-5">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-[var(--purple)]"><Swords size={14} /> Competitive Context</div>
                  <p className="text-sm text-[var(--text-muted)]">
                    {startup?.marketIntelligence?.whitespace
                      ? `Aim today's work at the gap competitors leave open: ${startup.marketIntelligence.whitespace}`
                      : 'Today touches customers or the market. Every conversation is a chance to find where competitors are weak. Log what you hear.'}
                  </p>
                </section>
              )}

              <button onClick={() => setStep('prep')} className="vzn-button-primary w-full rounded-xl px-4 py-3 font-semibold">
                Start task
              </button>
            </motion.div>
          )}

          {step === 'prep' && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="vzn-panel rounded-[1.5rem] p-6">
              <h3 className="text-lg font-bold">Before you act, answer all three</h3>
              <div className="mt-5 space-y-4">
                {seed.prepQuestions.map((question, i) => (
                  <label key={i} className="block">
                    <span className="mb-1 block text-sm font-medium">{question}</span>
                    <textarea
                      value={prepAnswers[i]}
                      onChange={(e) => {
                        const answers = [...prepAnswers]
                        answers[i] = e.target.value
                        setPrepAnswers(answers)
                      }}
                      className="vzn-input rounded-xl px-4 py-3 text-sm"
                      rows={2}
                    />
                  </label>
                ))}
              </div>
              <button
                onClick={() => setStep('execution')}
                disabled={!prepComplete}
                className="vzn-button-primary mt-5 w-full rounded-xl px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                {prepComplete ? 'Continue to execution' : 'Answer all three to continue'}
              </button>
            </motion.div>
          )}

          {step === 'execution' && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
              <section className="vzn-panel rounded-[1.5rem] p-6">
                <p className="mb-4 text-sm text-[var(--text-muted)]">{taskLabel}</p>

                {seed.task.mode === 'count' ? (
                  <>
                    {seed.task.target && <p className="mb-2 text-center text-xs font-mono text-[var(--text-muted)]">TARGET: {seed.task.target}</p>}
                    <div className="mb-6 text-center text-6xl font-bold" style={{ color: executionComplete ? 'var(--teal)' : 'var(--purple)' }}>
                      {executionCount}{seed.task.target ? ` / ${seed.task.target}` : ''}
                    </div>
                    <div className="mb-6 flex justify-center gap-2">
                      <button onClick={() => setExecutionCount(Math.max(0, executionCount - 1))} className="vzn-button-ghost rounded-xl border px-6 py-3">-</button>
                      <button onClick={() => setExecutionCount(executionCount + 1)} className="vzn-button-ghost rounded-xl border px-6 py-3">+</button>
                    </div>
                  </>
                ) : (
                  <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] p-4">
                    <input type="checkbox" checked={taskDone} onChange={(e) => setTaskDone(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--purple)]" />
                    <span className="text-sm">I completed this task and have the artifact or decision it called for.</span>
                  </label>
                )}

                <button
                  onClick={() => setStep('debrief')}
                  disabled={!executionComplete}
                  className="vzn-button-primary w-full rounded-xl px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {executionComplete ? 'Done, debrief' : seed.task.mode === 'count' ? 'Log real activity to continue' : 'Check the box to continue'}
                </button>
              </section>
            </motion.div>
          )}

          {step === 'debrief' && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="vzn-panel rounded-[1.5rem] p-6">
              <h3 className="text-lg font-bold">Debrief: {seed.debriefFocus}</h3>
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--amber)] bg-[var(--amber)]/10 p-3">
                <AlertTriangle size={16} className="mt-0.5 text-[var(--amber)]" />
                <p className="text-xs text-[var(--text-muted)]"><span className="font-semibold text-[var(--amber)]">VZN is watching:</span> {seed.killSwitch}</p>
              </div>

              <div className="mt-4 flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-1">
                <button
                  onClick={() => setDebriefMode('quick')}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold ${debriefMode === 'quick' ? 'bg-[var(--purple)] text-white' : 'text-[var(--text-muted)]'}`}
                >
                  One line
                </button>
                <button
                  onClick={() => setDebriefMode('full')}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold ${debriefMode === 'full' ? 'bg-[var(--purple)] text-white' : 'text-[var(--text-muted)]'}`}
                >
                  Detailed
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {debriefMode === 'quick' ? (
                  <>
                    <textarea
                      value={oneLine}
                      onChange={(e) => setOneLine(e.target.value)}
                      placeholder="Brain-dump your day in one line: what happened, what you noticed, what's next."
                      className="vzn-input rounded-xl px-4 py-3 text-sm"
                      rows={3}
                    />
                    {oneLine.trim().length >= 15 && (
                      <div className="vzn-panel rounded-xl p-4">
                        <div className="mb-2 text-[11px] font-mono text-[var(--text-muted)]">VZN expanded it:</div>
                        {[
                          ['What happened', effectiveDebrief.whatHappened],
                          ['The signal', effectiveDebrief.theSignal],
                          ['What it means', effectiveDebrief.whatItMeans],
                          ['What changes', effectiveDebrief.whatChanges],
                          ['Tomorrow', effectiveDebrief.tomorrowEdge],
                        ].map(([label, value]) => (
                          <div key={label} className="mb-1.5 text-sm">
                            <span className="text-xs font-semibold text-[var(--purple)]">{label}:</span> {value}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  [
                    { k: 'whatHappened', l: 'What actually happened?' },
                    { k: 'theSignal', l: 'What was the key signal?' },
                    { k: 'whatItMeans', l: 'What does it mean?' },
                    { k: 'whatChanges', l: 'What changes because of it?' },
                    { k: 'tomorrowEdge', l: "Tomorrow's edge?" },
                  ].map((field) => (
                    <textarea
                      key={field.k}
                      value={(debrief as any)[field.k]}
                      onChange={(e) => setDebrief({ ...debrief, [field.k]: e.target.value })}
                      placeholder={field.l}
                      className="vzn-input rounded-xl px-4 py-3 text-sm"
                      rows={2}
                    />
                  ))
                )}
              </div>

              <button
                onClick={handleDebriefSubmit}
                disabled={debriefLoading || !debriefComplete}
                className="vzn-button-primary mt-5 w-full rounded-xl px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                {debriefLoading ? 'Submitting...' : debriefComplete ? 'Submit and complete day' : 'Fill every field to complete'}
              </button>
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
              <section className="vzn-panel-strong rounded-[1.5rem] p-6 text-center" style={{ borderColor: 'var(--teal)' }}>
                <CheckCircle2 size={64} className="mx-auto mb-4 text-[var(--teal)]" />
                <h2 className="mb-2 text-3xl font-bold">Day {day} complete</h2>
                <div className="my-6">
                  <ShareCard
                    shareAngle={seed.shareAngle}
                    missionCode={seed.missionCode}
                    week={week}
                    day={day}
                    completionRate={completionProgress?.taskCompletionRate}
                    completedCount={completionProgress?.completedCount}
                    totalTasks={completionProgress?.totalTasks}
                  />
                </div>
                <button onClick={() => router.push(`/dashboard/warplan/${week}`)} className="vzn-button-ghost w-full rounded-xl border px-4 py-3 font-semibold">
                  Back to week
                </button>
              </section>
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
