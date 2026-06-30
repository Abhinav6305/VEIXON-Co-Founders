'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react'
import Link from 'next/link'
import VZNAvatar from '@/components/ui/VZNAvatar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import AppShell from '@/components/AppShell'
import { getWeek } from '@/lib/constants/ninetyDayPlan'

function buildSeedMission(week: number) {
  const days = getWeek(week)
  if (!days.length) return null
  const first = days[0]
  const last = days[days.length - 1]
  return {
    week,
    missionCode: first.missionCode,
    missionName: first.theme,
    primaryObjective: first.weekObjective,
    weeklyMilestone: first.weekMilestone,
    failureSignal: last.killSwitch,
    vznWatching: last.killSwitch,
    dailyTasks: days.map((d) => ({ day: d.dayOfWeek, task: d.task.label, category: d.rhythmRole })),
  }
}

interface WarPlanWeekPageProps {
  params: {
    week: string
  }
}

export default function WarPlanWeekPage({ params }: WarPlanWeekPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const week = parseInt(params.week)

  const [startup, setStartup] = useState<any>(null)
  const [mission, setMission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [weekAnalysis, setWeekAnalysis] = useState<any>(null)

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
        setMission(warMission || buildSeedMission(week))

        const analysis = data.weekAnalyses?.find((a: any) => a.week === week)
        setWeekAnalysis(analysis || null)
      })
      .catch((err) => console.error('Error fetching startup:', err))
      .finally(() => setLoading(false))
  }, [session, status, userId, week, router])

  if (loading) {
    return (
      <AppShell title="90-Day War Plan" subtitle={`Week ${week}`}>
        <div className="vzn-page-pad grid min-h-[calc(100vh-120px)] place-items-center">
          <LoadingSpinner label="Loading week..." />
        </div>
      </AppShell>
    )
  }

  if (!mission) {
    return (
      <AppShell title="90-Day War Plan" subtitle={`Week ${week}`}>
        <div className="vzn-page-pad grid min-h-[calc(100vh-120px)] place-items-center">
          <div className="vzn-panel rounded-[1.5rem] p-8 text-center">
            <VZNAvatar size="lg" className="mx-auto mb-6" />
            <p className="text-[var(--text-muted)]">Week not found</p>
          </div>
        </div>
      </AppShell>
    )
  }

  const dailyTasks = mission.dailyTasks || []
  const completedCount = dailyTasks.filter((task: any) => {
    const debrief = startup?.dayDebriefs?.find((d: any) => d.week === week && d.day === task.day)
    return debrief?.completedAt
  }).length
  const weekCompletion = dailyTasks.length ? Math.round((completedCount / dailyTasks.length) * 100) : 0
  const hasUnlockData = Array.isArray(startup?.weekUnlockStatus)
  const previousWeek = startup?.weekUnlockStatus?.find((w: any) => w.week === week - 1)
  const isWeekLocked = hasUnlockData && week > 1 && !previousWeek?.unlocked

  return (
    <AppShell
      title={`Week ${week}: ${mission.missionName}`}
      subtitle={mission.missionCode}
      actions={
        <button onClick={() => router.back()} className="vzn-button-ghost hidden rounded-xl border px-4 py-2 text-sm font-semibold md:inline-flex">
          <ArrowLeft size={16} /> Back
        </button>
      }
    >
      <div className="vzn-page-pad">
        <div className="vzn-page-center space-y-8">
          <button onClick={() => router.back()} className="vzn-button-ghost inline-flex rounded-xl border p-3 text-[var(--text-muted)] md:hidden" aria-label="Back">
            <ArrowLeft size={20} />
          </button>

          <section className="vzn-panel-strong rounded-[1.5rem] p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <div className="vzn-section-label text-[var(--amber)]">{mission.missionCode}</div>
                <h1 className="mt-2 text-3xl font-bold md:text-5xl">{mission.missionName}</h1>
                <p className="mt-4 text-[var(--text-muted)]">{mission.primaryObjective}</p>
              </div>
              <div className="relative mx-auto h-28 w-28 shrink-0 md:mx-0">
                <svg className="absolute h-full w-full -rotate-90">
                  <circle cx="56" cy="56" r="45" fill="none" stroke="var(--border)" strokeWidth="5" />
                  <circle
                    cx="56"
                    cy="56"
                    r="45"
                    fill="none"
                    stroke="var(--purple)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${(weekCompletion / 100) * 282.6} 282.6`}
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <div className="text-2xl font-bold">{weekCompletion}%</div>
                    <div className="text-xs text-[var(--text-muted)]">Complete</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {isWeekLocked && (
            <section className="vzn-panel rounded-[1.5rem] border-2 border-[var(--red)] p-6" style={{ background: 'color-mix(in srgb, var(--red) 7%, transparent)' }}>
              <div className="mb-2 flex items-center gap-3">
                <Lock size={24} className="text-[var(--red)]" />
                <h3 className="text-xl font-bold text-[var(--red)]">Week Locked</h3>
              </div>
              <p className="text-sm text-[var(--text-muted)]">Complete 70% of Week {week - 1} to unlock this week.</p>
            </section>
          )}

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="vzn-section-label">Daily Missions</div>
                <h2 className="mt-1 text-xl font-bold">7 days. 7 missions.</h2>
              </div>
              <span className="vzn-status-pill">{completedCount}/{dailyTasks.length} complete</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {dailyTasks.map((task: any) => {
                const dayDebrief = startup?.dayDebriefs?.find((d: any) => d.week === week && d.day === task.day)
                const isCompleted = !!dayDebrief?.completedAt

                return (
                  <Link
                    key={task.day}
                    href={isWeekLocked ? '#' : `/dashboard/warplan/${week}/${task.day}`}
                    onClick={(e) => isWeekLocked && e.preventDefault()}
                    style={{ ['--d' as any]: `${((task.day - 1) % 7) * 0.05}s` }}
                    className={`vzn-panel veixon-lift veixon-rise rounded-2xl p-4 ${isWeekLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="text-sm font-bold">Day {task.day}</div>
                      {isCompleted && <CheckCircle2 size={18} className="text-[var(--teal)]" />}
                    </div>
                    <p className="line-clamp-3 text-sm text-[var(--text-muted)]">{task.task}</p>
                    {dayDebrief?.theSignal && <p className="mt-2 text-xs italic text-[var(--teal)]">{dayDebrief.theSignal}</p>}
                    <span className="mt-3 inline-block rounded-full px-2 py-1 text-xs capitalize" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                      {task.category}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="vzn-panel rounded-[1.5rem] p-6">
              <div className="vzn-section-label text-[var(--amber)]">Week Milestone</div>
              <h3 className="mt-3 text-lg font-bold">{mission.weeklyMilestone}</h3>
            </div>

            <div className="vzn-panel rounded-[1.5rem] p-6" style={{ borderColor: 'var(--red)', background: 'color-mix(in srgb, var(--red) 6%, transparent)' }}>
              <div className="vzn-section-label text-[var(--red)]">Failure Signal</div>
              <p className="mt-3 text-sm text-[var(--red)]">{mission.failureSignal}</p>
            </div>

            <div className="vzn-panel rounded-[1.5rem] p-6" style={{ borderColor: 'var(--purple)' }}>
              <div className="flex items-start gap-3">
                <VZNAvatar size="sm" />
                <div>
                  <div className="vzn-section-label">VZN Is Watching</div>
                  <p className="mt-2 text-sm">{mission.vznWatching}</p>
                </div>
              </div>
            </div>
          </section>

          {weekAnalysis && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Week Analysis</h2>
              {weekAnalysis.patterns?.length > 0 && (
                <div className="vzn-panel rounded-2xl p-4" style={{ borderColor: 'var(--amber)' }}>
                  <h3 className="mb-2 font-bold text-[var(--amber)]">Patterns Detected</h3>
                  <ul className="space-y-1">
                    {weekAnalysis.patterns.map((p: string, i: number) => <li key={i} className="text-sm">- {p}</li>)}
                  </ul>
                </div>
              )}
              {weekAnalysis.strengths?.length > 0 && (
                <div className="vzn-panel rounded-2xl p-4" style={{ borderColor: 'var(--teal)' }}>
                  <h3 className="mb-2 font-bold text-[var(--teal)]">Strengths</h3>
                  <ul className="space-y-1">
                    {weekAnalysis.strengths.map((s: string, i: number) => <li key={i} className="text-sm">- {s}</li>)}
                  </ul>
                </div>
              )}
              {weekAnalysis.warnings?.length > 0 && (
                <div className="vzn-panel rounded-2xl p-4" style={{ borderColor: 'var(--red)' }}>
                  <h3 className="mb-2 font-bold text-[var(--red)]">Warnings</h3>
                  <ul className="space-y-1">
                    {weekAnalysis.warnings.map((w: string, i: number) => <li key={i} className="text-sm">- {w}</li>)}
                  </ul>
                </div>
              )}
              {weekAnalysis.vznVerdict && (
                <div className="vzn-panel rounded-2xl p-4">
                  <p className="text-sm">{weekAnalysis.vznVerdict}</p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </AppShell>
  )
}
