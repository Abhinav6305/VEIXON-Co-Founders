import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getStartupById, updateStartup } from '@/lib/server-store'
import { recordFounderEvent } from '@/lib/events'
import { sendDayOneCompletionEmail } from '@/lib/email/day-one'

export const runtime = 'nodejs'

function totalPlanTasks(startup: any) {
  const planned = (startup?.warPlanJson || []).reduce((sum: number, mission: any) => {
    return sum + (mission.dailyTasks?.length || 0)
  }, 0)

  return Math.max(90, planned || 0)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const taskId = String(body.taskId || '').trim()
    const startup = await getStartupById(body.startupId)

    if (!startup) return Response.json({ error: 'Startup not found', fallback: true }, { status: 404 })
    if (!taskId) return Response.json({ error: 'Task id is required', fallback: true }, { status: 400 })

    const existing = await prisma.completedTask.findFirst({
      where: { startupId: startup.id, taskId },
    })

    if (!existing) {
      await prisma.completedTask.create({
        data: {
          startupId: startup.id,
          taskId,
          completedAt: new Date(),
        },
      })
    }

    const completedTasks = await prisma.completedTask.findMany({
      where: { startupId: startup.id },
      orderBy: { completedAt: 'asc' },
    })
    const totalTasks = totalPlanTasks(startup)
    const completedCount = completedTasks.length
    const taskCompletionRate = Math.min(1, completedCount / totalTasks)
    const accountabilityScore = Math.min(100, Math.round(taskCompletionRate * 100))

    await updateStartup(startup.id, { taskCompletionRate, accountabilityScore })

    if (!existing) {
      await recordFounderEvent({
        type: 'task_completed',
        startupId: startup.id,
        userId: (startup as any).userId,
        orgId: (startup as any).orgId,
        cohortId: (startup as any).cohortId,
        payload: { taskId, taskCompletionRate, completedCount, totalTasks },
      })
    }

    const session = await getServerSession(authOptions).catch(() => null)
    await sendDayOneCompletionEmail({
      startup,
      session,
      taskId,
      task: body.taskLabel || body.task,
    })

    return Response.json({
      completed: true,
      alreadyCompleted: !!existing,
      taskId,
      completedTasks,
      completedCount,
      totalTasks,
      taskCompletionRate,
      accountabilityScore,
    })
  } catch (error) {
    console.error('Task update unavailable:', error)
    return Response.json({ error: 'Task update unavailable', fallback: true }, { status: 500 })
  }
}
