import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getStartup, updateStartup } from '@/lib/server-store'
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
    const id = body.id || body.startupId
    const { week, day, debrief, vznResponse, patternFlag, urgencyLevel, competitiveInsight, tomorrowSuggestion } = body
    const weekNumber = Number(week)
    const dayNumber = Number(day)

    if (!id) return Response.json({ error: 'Startup id is required' }, { status: 400 })
    if (!Number.isFinite(weekNumber) || !Number.isFinite(dayNumber)) {
      return Response.json({ error: 'Week and day are required' }, { status: 400 })
    }

    const startup = await getStartup(id)
    if (!startup) {
      return Response.json({ error: 'Startup not found' }, { status: 404 })
    }

    const existingDebrief = await prisma.dayDebrief.findFirst({
      where: { startupId: startup.id, week: weekNumber, day: dayNumber },
    })
    const dayDebriefData = {
      week: weekNumber,
      day: dayNumber,
      prepAnswers: JSON.stringify(body.prepAnswers || []),
      executionCount: Number(body.executionCount || 0),
      executionNotes: JSON.stringify(body.executionNotes || []),
      subStepsCompleted: JSON.stringify(body.subStepsCompleted || []),
      timeSpentMinutes: Number(body.timeSpentMinutes || 0),
      debrief: JSON.stringify(debrief || {}),
      vznResponse: vznResponse || '',
      patternFlag: patternFlag || null,
      urgencyLevel: urgencyLevel || 'green',
      competitiveInsight: competitiveInsight || null,
      tomorrowSuggestion: tomorrowSuggestion || '',
      completedAt: new Date(),
      dayCardShared: false,
    }

    if (existingDebrief) {
      await prisma.dayDebrief.update({
        where: { id: existingDebrief.id },
        data: dayDebriefData,
      })
    } else {
      await prisma.dayDebrief.create({
        data: {
          ...dayDebriefData,
          startupId: startup.id,
        },
      })
    }

    const taskId = body.taskId || `wk${weekNumber}-day${dayNumber}`
    const existingTask = await prisma.completedTask.findFirst({
      where: { startupId: startup.id, taskId },
    })

    if (!existingTask) {
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

    await recordFounderEvent({
      type: 'day_return',
      startupId: (startup as any).id,
      userId: (startup as any).userId,
      orgId: (startup as any).orgId,
      cohortId: (startup as any).cohortId,
      payload: { week: weekNumber, day: dayNumber, taskId, urgencyLevel, patternFlag: patternFlag || null, taskCompletionRate },
    })

    if (!existingTask) {
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
      week: weekNumber,
      day: dayNumber,
      task: body.taskLabel || body.task,
    })

    return Response.json({
      success: true,
      taskId,
      completedTasks,
      completedCount,
      totalTasks,
      taskCompletionRate,
      accountabilityScore,
    })
  } catch (error) {
    console.error('Complete day error:', error)
    return Response.json({ error: 'Failed to complete day' }, { status: 500 })
  }
}
