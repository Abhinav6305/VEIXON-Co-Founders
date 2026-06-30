'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import AppShell from '@/components/AppShell'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { getWeek } from '@/lib/constants/ninetyDayPlan'

// Curriculum fallback: render all 13 weeks from the seed plan until the AI personalizes warPlanJson.
function buildAllSeedWeeks() {
  const weeks: any[] = []
  for (let w = 1; w <= 13; w++) {
    const days = getWeek(w)
    if (!days.length) continue
    weeks.push({
      week: w,
      missionCode: days[0].missionCode,
      missionName: days[0].theme,
      dailyTasks: days.map((d) => ({ day: d.dayOfWeek, task: d.task.label, category: d.rhythmRole })),
    })
  }
  return weeks
}

export default function WarPlanPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [startup, setStartup] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const userId = (session?.user as any)?.id || (session?.user as any)?.email

  useEffect(() => {
    if (!session || !userId) return
    const startupId = window.localStorage.getItem('visionix_active_startup_id')
    if (!startupId) {
      router.push('/dashboard')
      return
    }

    fetch(`/api/startups/${startupId}`)
      .then((res) => res.json())
      .then((data) => setStartup(data))
      .catch((err) => console.error('Failed to load plan:', err))
      .finally(() => setLoading(false))
  }, [session, userId, router])

  if (loading) {
    return <AppShell title="90-Day War Plan"><div className="py-20"><LoadingSpinner label="Loading 90-day plan..." /></div></AppShell>
  }

  if (!startup) {
    return (
      <AppShell title="90-Day War Plan">
        <div className="mx-auto max-w-4xl p-6 text-center">No plan generated yet.</div>
      </AppShell>
    )
  }

  const completedTaskIds = (startup.completedTasks || []).map((t: any) => t.taskId)
  const planWeeks = (startup.warPlanJson && startup.warPlanJson.length)
    ? startup.warPlanJson
    : buildAllSeedWeeks()

  return (
    <AppShell title="90-Day War Plan" actions={<button onClick={() => router.back()} className="vzn-button-ghost flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold"><ArrowLeft size={16} /> Back to Dashboard</button>}>
      <div className="vzn-page-pad mx-auto w-full max-w-6xl space-y-12">
        <div className="vzn-panel-strong rounded-[1.5rem] p-6 text-center md:p-8">
          <h1 className="text-3xl font-bold mb-4">Your 90-Day War Plan</h1>
          <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
            This is your exact day-by-day execution roadmap. Click into any day to view the hypothesis, run the execution timer, and log your debrief.
          </p>
        </div>

        {planWeeks.map((mission: any, weekIndex: number) => {
          // Assume week 1 is always unlocked for now, or use weekUnlockStatus if strictly available
          const isUnlocked = weekIndex === 0 || startup.weekUnlockStatus?.some((w: any) => w.week === mission.week && w.unlocked) || true // Temporarily force unlock for testing visibility
          
          return (
            <section key={mission.week} className="vzn-panel rounded-[1.5rem] p-5 md:p-6">
              <div className="flex items-end justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <div className="text-sm font-bold tracking-widest uppercase text-[var(--purple)]">Week {mission.week}: {mission.missionCode}</div>
                  <h2 className="text-xl font-bold">{mission.missionName}</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {(mission.dailyTasks || []).map((task: any, taskIndex: number) => {
                  const dayNum = task.day || taskIndex + 1
                  const taskId = `wk${mission.week}-day${dayNum}`
                  const isCompleted = completedTaskIds.includes(taskId) || completedTaskIds.includes(task.task)
                  
                  return (
                    <Link
                      key={taskIndex}
                      href={`/dashboard/warplan/${mission.week}/${task.day || taskIndex + 1}`}
                      className={`vzn-panel veixon-lift veixon-rise relative flex flex-col justify-between rounded-xl p-5 ${!isUnlocked ? 'opacity-50 pointer-events-none' : ''}`}
                      style={{ borderColor: isCompleted ? 'var(--teal)' : undefined, ['--d' as any]: `${Math.min(taskIndex, 6) * 0.05}s` }}
                    >
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Day {dayNum}</span>
                          {isCompleted && <CheckCircle2 size={18} className="text-[var(--teal)]" />}
                        </div>
                        <p className={`text-sm font-medium ${isCompleted ? 'opacity-70 line-through' : ''}`}>{task.task}</p>
                      </div>
                      <div className="mt-auto inline-flex self-start rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                        {task.category || 'execution'}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </AppShell>
  )
}
