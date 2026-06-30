import { callClaudeJson } from '@/lib/anthropic'
import { fallbackDecision } from '@/lib/fallbacks'
import { newId, saveDecision } from '@/lib/server-store'

export const runtime = 'nodejs'

const system = `You are VZN, a brutal AI co-founder. Simulate this decision. Return ONLY valid JSON: { bestCase:{summary,day30,day90,day180}, worstCase:{same}, mostLikely:{same}, recommendation:string, reasoning:string, vzn_voice:string }.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    let result: any
    try {
      result = await callClaudeJson({ system, body, maxTokens: 2400 })
    } catch {
      result = fallbackDecision()
    }
    const id = newId('decision')
    await saveDecision({
      id,
      userId: body.userId || 'anonymous',
      startupId: body.startupId || null,
      description: body.description || '',
      decisionType: body.decisionType || body.type || 'strategy',
      scenariosJson: {
        bestCase: result.bestCase,
        worstCase: result.worstCase,
        mostLikely: result.mostLikely,
      },
      recommendation: result.recommendation,
      reasoning: result.reasoning,
      vznVoice: result.vzn_voice,
      createdAt: new Date().toISOString(),
    })

    // Email the founder a summary of the decision VZN just ran.
    if (body.email) {
      try {
        const { dispatchEmail } = await import('@/lib/email/service')
        const { decisionEmail } = await import('@/lib/email/templates')
        const { subject, html } = decisionEmail(body.name || String(body.email).split('@')[0], {
          description: body.description,
          recommendation: result.recommendation,
          reasoning: result.reasoning,
        })
        await dispatchEmail({ type: 'decision', to: body.email, userId: body.userId, refId: id, subject, html, once: true })
      } catch {
        /* email is best-effort */
      }
    }

    return Response.json({ id, ...result })
  } catch {
    return Response.json({ error: 'AI unavailable', fallback: true }, { status: 500 })
  }
}
