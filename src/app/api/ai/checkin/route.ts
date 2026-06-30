import { callClaudeJson } from '@/lib/anthropic'
import { newId, saveCheckin, updateStartup } from '@/lib/server-store'
import { recordFounderEvent } from '@/lib/events'

export const runtime = 'nodejs'

const system = `You are VZN, a brutal AI co-founder. Analyse progress. Return ONLY valid JSON: { analysis:string, tasksForNextWeek:[{task:string, deadline:string, successMetric:string, priority:"high"|"medium"|"low"}], accountabilityScore:0-100, vzn_voice:string }. Tasks must be specific, not generic.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    let result: any
    try {
      result = await callClaudeJson({ system, body, maxTokens: 2000 })
    } catch {
      result = {
        analysis: 'You reported motion. I need proof that the motion changed a customer or a number.',
        tasksForNextWeek: [
          { task: 'Run 5 customer conversations and write the exact objections.', deadline: 'Friday', successMetric: '5 recorded objections', priority: 'high' },
          { task: 'Ask 3 prospects for payment or a signed pilot.', deadline: 'Friday', successMetric: '3 direct asks', priority: 'high' },
          { task: 'Kill one feature that does not support validation.', deadline: 'Wednesday', successMetric: 'one deleted scope item', priority: 'medium' },
        ],
        accountabilityScore: 58,
        vzn_voice: 'You moved, but you have not proved the movement mattered.',
        fallback: true,
      }
    }
    const id = newId('checkin')
    await saveCheckin({
      id,
      userId: body.userId || 'anonymous',
      weekOf: new Date(),
      progressNotes: body.progressNotes || '',
      tasksJson: result.tasksForNextWeek || [],
      accountabilityScore: result.accountabilityScore || 0,
      vznVoice: result.vzn_voice || '',
      createdAt: new Date().toISOString(),
    })
    if (body.startupId) await updateStartup(body.startupId, { accountabilityScore: result.accountabilityScore || 0 })
    await recordFounderEvent({ type: 'checkin', startupId: body.startupId || null, userId: body.userId || null, payload: { accountabilityScore: result.accountabilityScore || 0 } })
    return Response.json({ id, ...result })
  } catch {
    return Response.json({ error: 'AI unavailable', fallback: true }, { status: 500 })
  }
}
