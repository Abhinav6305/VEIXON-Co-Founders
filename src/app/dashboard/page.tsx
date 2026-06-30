'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { X } from 'lucide-react'
import AppShell from '@/components/AppShell'
import StatCard from '@/components/dashboard/StatCard'
import TaskList from '@/components/dashboard/TaskList'
import DecisionTable from '@/components/dashboard/DecisionTable'
import BurnClock from '@/components/dashboard/BurnClock'
import VZNAvatar from '@/components/ui/VZNAvatar'
import NotificationPermission from '@/app/components/ui/NotificationPermission'
import AnimatedNumber from '@/components/ui/motion/AnimatedNumber'
import { DashboardSkeleton } from '@/components/ui/motion/Skeleton'

function Ring({ value, color }: { value: number; color: string }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative grid h-24 w-24 place-items-center">
      <svg className="absolute h-full w-full -rotate-90">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (value / 100) * circumference}
        />
      </svg>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  )
}

function percentFromRate(rate: number) {
  return Math.min(100, Math.round(rate * (rate <= 1 ? 100 : 1)))
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showOath, setShowOath] = useState(true)
  const [burnForm, setBurnForm] = useState({ burnRate: '', cashInBank: '', monthlyRevenue: '' })

  const user = session?.user as any
  const userId = user?.id || user?.email || 'anonymous'

  useEffect(() => {
    if (!session) return
    fetch(`/api/dashboard?userId=${encodeURIComponent(userId)}`)
      .then((res) => res.json())
      .then((payload) => {
        setData(payload)
        if (payload.startup?.id) window.localStorage.setItem('visionix_active_startup_id', payload.startup.id)
        setBurnForm({
          burnRate: payload.startup?.burnRate ? String(payload.startup.burnRate) : '',
          cashInBank: payload.startup?.cashInBank ? String(payload.startup.cashInBank) : '',
          monthlyRevenue: payload.startup?.monthlyRevenue ? String(payload.startup.monthlyRevenue) : '',
        })
      })
      .finally(() => setLoading(false))
  }, [session, userId])

  const todayKey = new Date().toISOString().slice(0, 10)
  const isMonday = new Date().getDay() === 1
  const oathDismissed = useMemo(() => (typeof window !== 'undefined' ? window.localStorage.getItem(`oath_${todayKey}`) === '1' : false), [todayKey])
  const completedCount = data?.stats?.completedCount ?? data?.startup?.completedTasks?.length ?? 0
  const totalTasks = data?.stats?.totalTasks ?? 90
  const taskProgress =
    data?.stats?.taskProgress ??
    percentFromRate(Number(data?.startup?.taskCompletionRate || 0))

  async function saveBurn() {
    if (!data?.startup?.id) return
    const update = {
      burnRate: Number(burnForm.burnRate) || 0,
      cashInBank: Number(burnForm.cashInBank) || 0,
      monthlyRevenue: Number(burnForm.monthlyRevenue) || 0,
    }
    await fetch(`/api/startups/${data.startup.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    setData((prev: any) => ({ ...prev, startup: { ...prev.startup, ...update } }))
  }

  function dismissOath() {
    window.localStorage.setItem(`oath_${todayKey}`, '1')
    setShowOath(false)
  }

  function applyTaskProgress(progress: any) {
    setData((prev: any) => {
      if (!prev?.startup) return prev

      const nextStartup = {
        ...prev.startup,
        completedTasks: progress.completedTasks || prev.startup.completedTasks || [],
        taskCompletionRate: progress.taskCompletionRate ?? prev.startup.taskCompletionRate,
        accountabilityScore: progress.accountabilityScore ?? prev.startup.accountabilityScore,
      }
      const nextCompletedCount = progress.completedCount ?? nextStartup.completedTasks.length ?? 0
      const nextTotalTasks = progress.totalTasks ?? prev.stats?.totalTasks ?? 90
      const nextTaskProgress = percentFromRate(Number(nextStartup.taskCompletionRate || 0))
      const nextPivotStatus =
        Number(nextStartup.taskCompletionRate || 0) > 0.7
          ? 'GREEN'
          : Number(nextStartup.accountabilityScore || 0) < 45
            ? 'RED'
            : 'AMBER'

      return {
        ...prev,
        startup: nextStartup,
        stats: {
          ...prev.stats,
          accountability: nextStartup.accountabilityScore || 0,
          pivotStatus: nextPivotStatus,
          completedCount: nextCompletedCount,
          totalTasks: nextTotalTasks,
          taskProgress: nextTaskProgress,
        },
      }
    })
  }

  return (
    <AppShell
      title={`Good morning, ${(session?.user?.name || 'Founder').split(' ')[0]}. VZN is watching.`}
      actions={
        <button onClick={() => router.push('/decisions')} className="vzn-button-primary rounded-lg px-4 py-2 text-sm font-semibold">
          New Decision
        </button>
      }
    >
      {isMonday && data?.startup?.oath && showOath && !oathDismissed && (
        <div className="vzn-panel mx-4 mt-4 flex items-center justify-between gap-4 rounded-2xl px-6 py-3 md:mx-8">
          <div className="flex min-w-0 items-center gap-3">
            <VZNAvatar size="sm" />
            <p className="truncate text-sm">
              You said this on Day 1: <em>{data.startup.oath}</em> Are you living up to it?
            </p>
          </div>
          <button onClick={dismissOath}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="vzn-page-pad mx-auto w-full max-w-7xl">
        {loading ? (
          <DashboardSkeleton />
        ) : !data?.startup ? (
          <div className="vzn-panel-strong rounded-[1.5rem] p-10 text-center">
            <VZNAvatar size="lg" className="mx-auto" />
            <h2 className="mt-6 text-2xl font-bold">No startup analysed yet.</h2>
            <p className="mt-2" style={{ color: 'var(--text-muted)' }}>Give VZN a raw idea and let it get uncomfortable.</p>
            <Link href="/intake" className="vzn-button-primary mt-6 inline-flex rounded-xl px-5 py-3 font-semibold">Analyse idea</Link>
          </div>
        ) : (
          <>
            <section className="vzn-panel veixon-lift veixon-rise mb-6 rounded-[1.5rem] p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="vzn-section-label">90-Day Progress</div>
                  <h2 className="mt-1 text-2xl font-bold">{taskProgress}% complete</h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {completedCount}/{totalTasks} tasks done. Keep the proof moving.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-right sm:flex sm:items-center">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>Done</div>
                    <div className="text-xl font-bold text-[var(--teal)]">{completedCount}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>Left</div>
                    <div className="text-xl font-bold">{Math.max(0, totalTasks - completedCount)}</div>
                  </div>
                </div>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full bg-[var(--purple)] transition-all duration-700" style={{ width: `${taskProgress}%` }} />
              </div>
            </section>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Startup Health" index={0}><Ring value={data.stats.startupHealth || 0} color="var(--purple)" /></StatCard>
              <StatCard label="Accountability Score" index={1}><Ring value={data.stats.accountability || 0} color="var(--teal)" /></StatCard>
              <StatCard label="Decisions Made" index={2}>
                <AnimatedNumber value={data.stats.decisionsThisMonth || 0} className="text-5xl font-bold" />
                <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>this month</p>
              </StatCard>
              <StatCard label="Pivot Radar" index={3}>
                <span className="inline-flex rounded-full px-3 py-1 text-sm font-bold" style={{ background: 'color-mix(in srgb, var(--purple) 15%, transparent)', color: 'var(--purple)' }}>
                  {data.stats.pivotStatus}
                </span>
              </StatCard>
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-12">
              <section id="checkins" className="vzn-panel veixon-lift veixon-rise rounded-[1.5rem] p-6 lg:col-span-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">This week&apos;s tasks</h2>
                  <Link href="/dashboard/warplan" className="text-sm font-semibold text-[var(--purple)] hover:underline">
                    View 90-day plan →
                  </Link>
                </div>
                <TaskList 
                  tasks={data.tasks || []} 
                  startupId={data?.startup?.id} 
                  initialCompleted={(data?.startup?.completedTasks || []).map((t: any) => t.taskId)} 
                  onProgressUpdate={applyTaskProgress}
                />
              </section>
              <section className="vzn-panel veixon-lift veixon-rise rounded-[1.5rem] p-6 lg:col-span-4" style={{ ['--d' as any]: '0.08s' }}>
                <h2 className="mb-6 text-lg font-bold">VZN Insights</h2>
                <VZNAvatar size="lg" />
                <p className="mt-6 text-lg font-medium leading-snug">&quot;{data.insight}&quot;</p>
                <button onClick={() => router.push('/dashboard#checkins')} className="vzn-button-primary mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold">
                  Run check-in
                </button>
              </section>
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-12">
              <section className="vzn-panel veixon-lift veixon-rise rounded-[1.5rem] p-6 lg:col-span-4">
                <h2 className="mb-4 text-lg font-bold">Burn Clock</h2>
                <BurnClock burnRate={data.startup.burnRate} cashInBank={data.startup.cashInBank} monthlyRevenue={data.startup.monthlyRevenue} />
                <div className="mt-5 grid gap-2">
                  {(['burnRate', 'cashInBank', 'monthlyRevenue'] as const).map((key) => (
                    <input
                      key={key}
                      value={burnForm[key]}
                      onChange={(event) => setBurnForm((prev) => ({ ...prev, [key]: event.target.value }))}
                      placeholder={key}
                      className="focus-ring vzn-input rounded-lg px-3 py-2 text-sm"
                    />
                  ))}
                  <button onClick={saveBurn} className="vzn-button-primary rounded-lg px-3 py-2 text-sm font-semibold">Save runway</button>
                </div>
              </section>
              <section className="vzn-panel veixon-lift veixon-rise overflow-hidden rounded-[1.5rem] lg:col-span-8" style={{ ['--d' as any]: '0.08s' }}>
                <div className="border-b p-6" style={{ borderColor: 'var(--border)' }}>
                  <h2 className="text-lg font-bold">Recent decisions</h2>
                </div>
                <DecisionTable decisions={data.decisions || []} />
              </section>
            </div>
          </>
        )}
      </div>
      <NotificationPermission />
    </AppShell>
  )
}
