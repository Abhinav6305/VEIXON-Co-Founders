import prisma from '@/lib/prisma'
import { getStartup } from '@/lib/server-store'

export const runtime = 'nodejs'

function parseJson(value: any, fallback: any = null) {
  if (value === null || value === undefined) return fallback
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function serializeDayDebrief(debrief: any) {
  if (!debrief) return {}
  return {
    ...debrief,
    prepAnswers: parseJson(debrief.prepAnswers, []),
    executionNotes: parseJson(debrief.executionNotes, []),
    subStepsCompleted: parseJson(debrief.subStepsCompleted, []),
    debrief: parseJson(debrief.debrief, {}),
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await req.json()
    const startup = await getStartup(id)

    if (!startup) {
      return Response.json({ error: 'Startup not found' }, { status: 404 })
    }

    const { week, day, executionCount, executionNote, subStep, timeSpent } = body
    const weekNumber = Number(week)
    const dayNumber = Number(day)

    if (!Number.isFinite(weekNumber) || !Number.isFinite(dayNumber)) {
      return Response.json({ error: 'Week and day are required' }, { status: 400 })
    }

    const existing = await prisma.dayDebrief.findFirst({
      where: { startupId: id, week: weekNumber, day: dayNumber },
    })

    const currentExecutionNotes = parseJson(existing?.executionNotes, [])
    const currentSubSteps = parseJson(existing?.subStepsCompleted, [])
    const nextExecutionNotes = executionNote ? [...currentExecutionNotes, executionNote] : currentExecutionNotes
    const nextSubSteps = subStep ? [...currentSubSteps, subStep] : currentSubSteps
    const baseData = {
      week: weekNumber,
      day: dayNumber,
      executionCount: executionCount !== undefined ? Number(executionCount) : Number(existing?.executionCount || 0),
      executionNotes: JSON.stringify(nextExecutionNotes),
      subStepsCompleted: JSON.stringify(nextSubSteps),
      timeSpentMinutes: Number(existing?.timeSpentMinutes || 0) + Number(timeSpent || 0),
      prepAnswers: existing?.prepAnswers || JSON.stringify([]),
      prepFeedback: existing?.prepFeedback || '',
      debrief: existing?.debrief || JSON.stringify({}),
      vznResponse: existing?.vznResponse || '',
      urgencyLevel: existing?.urgencyLevel || 'green',
      tomorrowSuggestion: existing?.tomorrowSuggestion || '',
      dayCardShared: existing?.dayCardShared || false,
    }

    const saved = existing
      ? await prisma.dayDebrief.update({ where: { id: existing.id }, data: baseData })
      : await prisma.dayDebrief.create({ data: { ...baseData, startupId: id } })

    return Response.json({ success: true, debrief: serializeDayDebrief(saved) })
  } catch (error) {
    console.error('Day update error:', error)
    return Response.json({ error: 'Failed to update day' }, { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { searchParams } = new URL(req.url)
    const week = searchParams.get('week')
    const day = searchParams.get('day')

    const startup = await getStartup(id)
    if (!startup) {
      return Response.json({ error: 'Startup not found' }, { status: 404 })
    }

    if (week && day) {
      const debrief = startup.dayDebriefs?.find((item: any) => item.week === parseInt(week) && item.day === parseInt(day))
      return Response.json(debrief || {})
    }

    return Response.json(startup)
  } catch (error) {
    console.error('Day get error:', error)
    return Response.json({ error: 'Failed to fetch day' }, { status: 500 })
  }
}
